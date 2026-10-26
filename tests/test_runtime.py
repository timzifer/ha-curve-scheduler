"""Tests for computing and writing the setpoint."""

from __future__ import annotations

from datetime import date, datetime, timedelta
import logging
from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.const import STATE_UNAVAILABLE
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.util import dt as dt_util
import pytest
from pytest_homeassistant_custom_component.common import (
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.curve_scheduler.const import DOMAIN

from .conftest import TARGET, make_entry, setup_entry

THURSDAY_NOON = "2026-10-29 12:00:00+01:00"


def target_value(hass: HomeAssistant) -> float:
    return float(hass.states.get(TARGET).state)


async def tick(hass: HomeAssistant, freezer: FrozenDateTimeFactory, delta: timedelta) -> None:
    freezer.tick(delta)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()


@pytest.fixture
async def started(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> Any:
    freezer.move_to(THURSDAY_NOON)
    return await setup_entry(hass, make_entry())


async def test_writes_on_start_and_on_interval(
    hass: HomeAssistant, started: Any, freezer: FrozenDateTimeFactory
) -> None:
    # Workday profile at 12:00 is the low level (45).
    assert target_value(hass) == 45
    sensor = hass.states.get("sensor.zirkulation_setpoint")
    assert float(sensor.state) == 45
    assert sensor.attributes["profile_id"] == "workday"
    assert sensor.attributes["reason"] == "weekday"
    assert sensor.attributes["next_point_value"] == 45
    assert sensor.attributes["next_point_time"].startswith("2026-10-29T17:00")
    assert hass.states.get("sensor.zirkulation_profile").state == "Workday"

    freezer.move_to("2026-10-29 17:15:00+01:00")
    await tick(hass, freezer, timedelta(minutes=5))
    assert 45 < target_value(hass) < 60
    await tick(hass, freezer, timedelta(minutes=30))
    assert target_value(hass) == 60


async def test_value_in_one_hour_attribute(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to("2026-10-29 16:45:00+01:00")
    await setup_entry(hass, make_entry())
    attrs = hass.states.get("sensor.zirkulation_setpoint").attributes
    assert attrs["value_in_1h"] == 60


async def test_threshold(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(THURSDAY_NOON)
    entry = await setup_entry(hass, make_entry(write_threshold=5))
    assert target_value(hass) == 45
    await hass.services.async_call(
        "input_number", "set_value", {"entity_id": TARGET, "value": 43}, blocking=True
    )
    await tick(hass, freezer, timedelta(minutes=6))
    assert target_value(hass) == 43  # difference 2 < threshold 5
    await hass.services.async_call(
        "input_number", "set_value", {"entity_id": TARGET, "value": 30}, blocking=True
    )
    await tick(hass, freezer, timedelta(minutes=5))
    assert target_value(hass) == 45
    # Immediate actions ignore the threshold.
    await hass.services.async_call(
        "input_number", "set_value", {"entity_id": TARGET, "value": 43}, blocking=True
    )
    await hass.services.async_call(
        DOMAIN, "apply_now", {"config_entry_id": entry.entry_id}, blocking=True
    )
    assert target_value(hass) == 45


async def test_does_not_rewrite_same_value(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    calls: list[ServiceCall] = []
    freezer.move_to(THURSDAY_NOON)
    hass.states.async_set(TARGET, "45", {"min": 20, "max": 70})
    calls = async_mock_service(hass, "input_number", "set_value")
    await setup_entry(hass, make_entry())
    await tick(hass, freezer, timedelta(minutes=10))
    assert calls == []


async def test_unavailable_target(
    hass: HomeAssistant,
    started: Any,
    freezer: FrozenDateTimeFactory,
    caplog: pytest.LogCaptureFixture,
) -> None:
    hass.states.async_set(TARGET, STATE_UNAVAILABLE)
    freezer.move_to("2026-10-29 17:30:00+01:00")
    caplog.clear()
    with caplog.at_level(logging.WARNING):
        for _ in range(3):
            await tick(hass, freezer, timedelta(minutes=5))
    warnings = [r for r in caplog.records if "unavailable" in r.getMessage()]
    assert len(warnings) == 1
    assert hass.states.get(TARGET).state == STATE_UNAVAILABLE
    # Sensor keeps showing the computed value.
    assert float(hass.states.get("sensor.zirkulation_setpoint").state) == 60

    calls = async_mock_service(hass, "input_number", "set_value")
    hass.states.async_set(TARGET, "40", {"min": 20, "max": 70})
    await hass.async_block_till_done()
    assert len(calls) == 1
    assert calls[0].data["value"] == 60


async def test_disabled_does_not_write(
    hass: HomeAssistant, started: Any, freezer: FrozenDateTimeFactory
) -> None:
    await hass.services.async_call(
        "switch", "turn_off", {"entity_id": "switch.zirkulation_active"}, blocking=True
    )
    assert hass.states.get("switch.zirkulation_active").state == "off"
    freezer.move_to("2026-10-29 17:40:00+01:00")
    await tick(hass, freezer, timedelta(minutes=5))
    assert target_value(hass) == 45
    assert float(hass.states.get("sensor.zirkulation_setpoint").state) == 60
    await hass.services.async_call(
        "switch", "turn_on", {"entity_id": "switch.zirkulation_active"}, blocking=True
    )
    assert target_value(hass) == 60


async def test_override_via_select(hass: HomeAssistant, started: Any) -> None:
    await hass.services.async_call(
        "select",
        "select_option",
        {"entity_id": "select.zirkulation_mode", "option": "Day off"},
        blocking=True,
    )
    # Day off profile at 12:00 is the high level.
    assert target_value(hass) == 60
    sensor = hass.states.get("sensor.zirkulation_setpoint")
    assert sensor.attributes["reason"] == "override"
    assert hass.states.get("select.zirkulation_mode").state == "Day off"
    await hass.services.async_call(
        "select",
        "select_option",
        {"entity_id": "select.zirkulation_mode", "option": "auto"},
        blocking=True,
    )
    assert target_value(hass) == 45


async def test_override_until_expires(
    hass: HomeAssistant, started: Any, freezer: FrozenDateTimeFactory
) -> None:
    entry = started
    await hass.services.async_call(
        DOMAIN,
        "set_override",
        {
            "config_entry_id": entry.entry_id,
            "profile": "day_off",
            "until": "2026-10-29 13:00:00",
        },
        blocking=True,
    )
    assert target_value(hass) == 60
    freezer.move_to("2026-10-29 13:00:30+01:00")
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert target_value(hass) == 45
    assert entry.runtime_data.data["override"] is None


async def test_restart_keeps_override_switch_and_data(
    hass: HomeAssistant, started: Any, freezer: FrozenDateTimeFactory
) -> None:
    entry = started
    runtime = entry.runtime_data
    await hass.services.async_call(
        DOMAIN,
        "set_override",
        {"config_entry_id": entry.entry_id, "profile": "Day off"},
        blocking=True,
    )
    schedule = runtime.schedule_dict()
    schedule["profiles"]["workday"]["points"][0]["v"] = 50.0
    await runtime.async_save_schedule(schedule, runtime.revision)
    await hass.services.async_call(
        "switch", "turn_off", {"entity_id": "switch.zirkulation_active"}, blocking=True
    )
    await hass.async_block_till_done()

    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    runtime = entry.runtime_data
    assert runtime.data["override"]["profile"] == "day_off"
    assert runtime.enabled is False
    assert runtime.data["profiles"]["workday"]["points"][0]["v"] == 50.0
    assert hass.states.get("select.zirkulation_mode").state == "Day off"
    assert hass.states.get("switch.zirkulation_active").state == "off"


async def test_loads_from_storage(
    hass: HomeAssistant,
    hass_storage: dict[str, Any],
    berlin: None,
    target: str,
    freezer: FrozenDateTimeFactory,
) -> None:
    freezer.move_to(THURSDAY_NOON)
    entry = make_entry()
    hass_storage[f"{DOMAIN}.{entry.entry_id}"] = {
        "version": 1,
        "minor_version": 1,
        "key": f"{DOMAIN}.{entry.entry_id}",
        "data": {
            "profiles": {
                "a": {"name": "A", "color": "#123456", "points": [{"t": "00:00", "v": 33}]}
            },
            "week": dict.fromkeys(["mon", "tue", "wed", "thu", "fri", "sat", "sun"], "a"),
            "holiday_profile": "a",
            "exceptions": [],
        },
    }
    await setup_entry(hass, entry)
    assert target_value(hass) == 33
    assert entry.runtime_data.data["enabled"] is True


async def test_holiday_from_workday_sensor(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(THURSDAY_NOON)
    hass.states.async_set("binary_sensor.workday", "on")
    entry = await setup_entry(hass, make_entry(holiday_source="binary_sensor.workday"))
    assert target_value(hass) == 45
    hass.states.async_set("binary_sensor.workday", "off")
    await hass.async_block_till_done()
    assert target_value(hass) == 60
    assert hass.states.get("sensor.zirkulation_setpoint").attributes["reason"] == "holiday"

    # Exceptions beat holidays.
    runtime = entry.runtime_data
    schedule = runtime.schedule_dict()
    schedule["exceptions"] = [{"from": "2026-10-29", "to": "2026-10-29", "profile": "workday"}]
    await runtime.async_save_schedule(schedule, runtime.revision)
    assert target_value(hass) == 45
    assert hass.states.get("sensor.zirkulation_setpoint").attributes["reason"] == "exception"


async def test_holiday_from_calendar(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(THURSDAY_NOON)
    hass.states.async_set("calendar.feiertage", "off")
    requests: list[dict[str, Any]] = []

    async def get_events(call: ServiceCall) -> dict[str, Any]:
        requests.append(dict(call.data))
        return {
            "calendar.feiertage": {
                "events": [
                    {"start": "2026-10-29", "end": "2026-10-30", "summary": "Feiertag"},
                    {
                        "start": "2026-10-31T10:00:00+01:00",
                        "end": "2026-10-31T12:00:00+01:00",
                        "summary": "Timed",
                    },
                ]
            }
        }

    hass.services.async_register(
        "calendar", "get_events", get_events, supports_response=SupportsResponse.ONLY
    )
    entry = await setup_entry(hass, make_entry(holiday_source="calendar.feiertage"))
    assert requests
    assert target_value(hass) == 60
    holidays = await entry.runtime_data.holidays.async_holidays(
        date(2026, 10, 28), date(2026, 11, 1)
    )
    assert holidays == [date(2026, 10, 29), date(2026, 10, 31)]


async def test_climate_target(
    hass: HomeAssistant, berlin: None, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(THURSDAY_NOON)
    hass.states.async_set("climate.boiler", "heat", {"temperature": 40, "min_temp": 20})
    calls = async_mock_service(hass, "climate", "set_temperature")
    await setup_entry(hass, make_entry("climate.boiler"))
    assert len(calls) == 1
    assert calls[0].data == {"entity_id": "climate.boiler", "temperature": 45}


async def test_water_heater_target(
    hass: HomeAssistant, berlin: None, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to(THURSDAY_NOON)
    hass.states.async_set("water_heater.tank", "eco", {"temperature": 40})
    calls = async_mock_service(hass, "water_heater", "set_temperature")
    await setup_entry(hass, make_entry("water_heater.tank"))
    assert calls[0].data == {"entity_id": "water_heater.tank", "temperature": 45}


@pytest.mark.parametrize(
    "moment",
    [
        "2026-10-25 02:30:00+02:00",  # 25 hour day, first 02:30
        "2026-10-25 02:30:00+01:00",  # 25 hour day, second 02:30
        "2026-03-29 03:30:00+02:00",  # 23 hour day
        "2026-03-29 01:59:00+01:00",
    ],
)
async def test_dst_days(
    hass: HomeAssistant,
    berlin: None,
    target: str,
    freezer: FrozenDateTimeFactory,
    moment: str,
) -> None:
    freezer.move_to(moment)
    entry = await setup_entry(hass, make_entry())
    runtime = entry.runtime_data
    for minutes in range(0, 26 * 60, 10):
        runtime.compute_at(dt_util.now() + timedelta(minutes=minutes))
    await tick(hass, freezer, timedelta(hours=1))
    assert hass.states.get("sensor.zirkulation_setpoint").state not in ("unknown", "unavailable")


async def test_no_jump_at_midnight_friday_to_saturday(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to("2026-10-30 12:00:00+01:00")
    entry = await setup_entry(hass, make_entry(step=0.001))
    runtime = entry.runtime_data
    tz = dt_util.get_default_time_zone()
    before = runtime.compute_at(datetime(2026, 10, 30, 23, 59, 59, 999000, tzinfo=tz))
    after = runtime.compute_at(datetime(2026, 10, 31, 0, 0, tzinfo=tz))
    assert before.profile_id == "workday"
    assert after.profile_id == "day_off"
    assert abs(before.raw - after.raw) < 0.01


async def test_preview_matches_written_value(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to("2026-10-29 00:00:00+01:00")
    entry = await setup_entry(hass, make_entry())
    runtime = entry.runtime_data
    curve = runtime.preview(date(2026, 10, 29), None, 15)
    for minute, value in curve[:-1]:
        freezer.move_to(
            datetime(
                2026,
                10,
                29,
                int(minute) // 60,
                int(minute) % 60,
                tzinfo=dt_util.get_default_time_zone(),
            )
        )
        await runtime.async_update(force=True)
        assert abs(target_value(hass) - value) <= runtime.step / 2 + 1e-9


async def test_auto_cleanup_of_past_exceptions(
    hass: HomeAssistant, started: Any, freezer: FrozenDateTimeFactory
) -> None:
    runtime = started.runtime_data
    schedule = runtime.schedule_dict()
    schedule["auto_cleanup"] = True
    schedule["exceptions"] = [
        {"from": "2026-10-20", "to": "2026-10-29", "profile": "day_off"},
        {"from": "2026-12-24", "to": "2026-12-26", "profile": "day_off"},
    ]
    await runtime.async_save_schedule(schedule, runtime.revision)
    freezer.move_to("2026-10-30 00:01:00+01:00")
    await tick(hass, freezer, timedelta(minutes=5))
    assert [e["from"] for e in runtime.data["exceptions"]] == ["2026-12-24"]


async def test_unload(hass: HomeAssistant, started: Any) -> None:
    assert await hass.config_entries.async_unload(started.entry_id)
    await hass.async_block_till_done()
