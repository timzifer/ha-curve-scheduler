"""Tests for the websocket API used by the card (as a non-admin user)."""

from __future__ import annotations

import copy
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
import pytest
from pytest_homeassistant_custom_component.typing import WebSocketGenerator

from .conftest import TARGET, make_entry, setup_entry


@pytest.fixture
async def entry(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> Any:
    freezer.move_to("2026-10-29 12:00:00+01:00")
    return await setup_entry(hass, make_entry())


@pytest.fixture
async def client(
    hass: HomeAssistant,
    hass_ws_client: WebSocketGenerator,
    hass_read_only_access_token: str,
    hass_read_only_user: Any,
) -> Any:
    """A websocket client of a regular (non-admin) user."""
    assert not hass_read_only_user.is_admin
    return await hass_ws_client(hass, hass_read_only_access_token)


async def test_list_and_get(hass: HomeAssistant, entry: Any, client: Any) -> None:
    await client.send_json_auto_id({"type": "zeitprofil/list"})
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"][0]["entry_id"] == entry.entry_id
    assert msg["result"][0]["config"]["max"] == 70

    await client.send_json_auto_id({"type": "zeitprofil/get", "entry_id": entry.entry_id})
    msg = await client.receive_json()
    result = msg["result"]
    assert result["revision"] == 1
    assert set(result["schedule"]["profiles"]) == {"werktag", "frei"}
    assert result["state"]["value"] == 45
    assert result["state"]["next_point"]["hhmm"] == "17:00"
    assert [d["profile_id"] for d in result["state"]["timeline"]] == [
        "werktag",
        "werktag",
        "werktag",
        "werktag",
        "frei",
    ]


async def test_unknown_entry(hass: HomeAssistant, entry: Any, client: Any) -> None:
    await client.send_json_auto_id({"type": "zeitprofil/get", "entry_id": "nope"})
    msg = await client.receive_json()
    assert not msg["success"]
    assert msg["error"]["code"] == "not_found"
    assert msg["error"]["translation_key"] == "entry_not_found"


async def test_non_admin_can_save(hass: HomeAssistant, entry: Any, client: Any) -> None:
    schedule = copy.deepcopy(entry.runtime_data.schedule_dict())
    # Change today's profile at the current time: written immediately.
    schedule["profiles"]["werktag"]["points"] = [{"t": "11:00", "v": 52.5}]
    schedule["week"]["sat"] = "werktag"
    await client.send_json_auto_id(
        {
            "type": "zeitprofil/save",
            "entry_id": entry.entry_id,
            "revision": 1,
            "schedule": schedule,
        }
    )
    msg = await client.receive_json()
    assert msg["success"]
    assert msg["result"] == {"ok": True, "revision": 2}
    assert float(hass.states.get(TARGET).state) == 52.5
    assert entry.runtime_data.data["week"]["sat"] == "werktag"


async def test_save_conflict(hass: HomeAssistant, entry: Any, client: Any) -> None:
    schedule = entry.runtime_data.schedule_dict()
    await client.send_json_auto_id(
        {"type": "zeitprofil/save", "entry_id": entry.entry_id, "revision": 1, "schedule": schedule}
    )
    assert (await client.receive_json())["result"]["ok"]
    await client.send_json_auto_id(
        {"type": "zeitprofil/save", "entry_id": entry.entry_id, "revision": 1, "schedule": schedule}
    )
    result = (await client.receive_json())["result"]
    assert result == {"ok": False, "conflict": True, "revision": 2}


async def test_save_validation(hass: HomeAssistant, entry: Any, client: Any) -> None:
    schedule = copy.deepcopy(entry.runtime_data.schedule_dict())
    schedule["profiles"]["werktag"]["points"].append({"t": "23:03", "v": 99})
    del schedule["profiles"]["frei"]
    await client.send_json_auto_id(
        {"type": "zeitprofil/save", "entry_id": entry.entry_id, "revision": 1, "schedule": schedule}
    )
    result = (await client.receive_json())["result"]
    assert result["ok"] is False
    codes = {error["code"] for error in result["errors"]}
    assert codes == {"time_not_on_grid", "value_out_of_range", "profile_in_use"}
    in_use = next(e for e in result["errors"] if e["code"] == "profile_in_use")
    assert in_use["params"]["name"] == "Day off"
    assert entry.runtime_data.revision == 1


async def test_subscribe_receives_updates(hass: HomeAssistant, entry: Any, client: Any) -> None:
    await client.send_json_auto_id({"type": "zeitprofil/subscribe", "entry_id": entry.entry_id})
    msg = await client.receive_json()
    assert msg["success"]
    event = await client.receive_json()
    assert event["event"]["revision"] == 1

    await hass.services.async_call(
        "switch", "turn_off", {"entity_id": "switch.zirkulation_aktiv"}, blocking=True
    )
    event = await client.receive_json()
    assert event["event"]["state"]["enabled"] is False

    await client.send_json_auto_id({"type": "unsubscribe_events", "subscription": msg["id"]})
    assert (await client.receive_json())["success"]


async def test_preview(hass: HomeAssistant, entry: Any, client: Any) -> None:
    await client.send_json_auto_id(
        {"type": "zeitprofil/preview", "entry_id": entry.entry_id, "step_minutes": 60}
    )
    result = (await client.receive_json())["result"]
    assert result["ok"]
    assert result["date"] == "2026-10-29"
    assert len(result["curve"]) == 25
    assert result["curve"][12] == [720.0, 45.0]

    schedule = copy.deepcopy(entry.runtime_data.schedule_dict())
    schedule["profiles"]["werktag"]["points"] = [{"t": "00:00", "v": 30}]
    await client.send_json_auto_id(
        {
            "type": "zeitprofil/preview",
            "entry_id": entry.entry_id,
            "date": "2026-10-28",
            "schedule": schedule,
            "step_minutes": 60,
        }
    )
    result = (await client.receive_json())["result"]
    assert result["curve"][12] == [720.0, 30.0]

    schedule["profiles"]["werktag"]["points"] = []
    await client.send_json_auto_id(
        {"type": "zeitprofil/preview", "entry_id": entry.entry_id, "schedule": schedule}
    )
    result = (await client.receive_json())["result"]
    assert result["ok"] is False


async def test_holidays_without_source(hass: HomeAssistant, entry: Any, client: Any) -> None:
    await client.send_json_auto_id(
        {
            "type": "zeitprofil/holidays",
            "entry_id": entry.entry_id,
            "start": "2026-10-01",
            "end": "2026-10-31",
        }
    )
    result = (await client.receive_json())["result"]
    assert result == {"configured": False, "holidays": []}


async def test_non_admin_can_call_services(hass: HomeAssistant, entry: Any, client: Any) -> None:
    await client.send_json_auto_id(
        {
            "type": "call_service",
            "domain": "zeitprofil",
            "service": "add_exception",
            "service_data": {
                "config_entry_id": entry.entry_id,
                "from": "2026-10-29",
                "to": "2026-11-02",
                "profile": "Day off",
                "note": "Urlaub",
            },
        }
    )
    msg = await client.receive_json()
    assert msg["success"], msg
    assert float(hass.states.get(TARGET).state) == 60
