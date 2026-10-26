"""Tests for the actions."""

from __future__ import annotations

from typing import Any

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
import pytest

from custom_components.zeitprofil.const import DOMAIN

from .conftest import TARGET, make_entry, setup_entry


@pytest.fixture
async def entry(
    hass: HomeAssistant, berlin: None, target: str, freezer: FrozenDateTimeFactory
) -> Any:
    freezer.move_to("2026-10-29 12:00:00+01:00")
    return await setup_entry(hass, make_entry())


async def test_exceptions(hass: HomeAssistant, entry: Any) -> None:
    response = await hass.services.async_call(
        DOMAIN,
        "add_exception",
        {"config_entry_id": entry.entry_id, "from": "2026-10-29", "profile": "frei"},
        blocking=True,
        return_response=True,
    )
    assert float(hass.states.get(TARGET).state) == 60
    exception = entry.runtime_data.data["exceptions"][0]
    assert exception["id"] == response["exception_id"]
    assert exception["to"] == "2026-10-29"

    response = await hass.services.async_call(
        DOMAIN,
        "remove_exception",
        {"config_entry_id": entry.entry_id, "date": "2026-10-29"},
        blocking=True,
        return_response=True,
    )
    assert response == {"removed": 1}
    assert float(hass.states.get(TARGET).state) == 45

    response = await hass.services.async_call(
        DOMAIN,
        "add_exception",
        {
            "config_entry_id": entry.entry_id,
            "from": "2026-12-24",
            "to": "2026-12-26",
            "profile": "Day off",
        },
        blocking=True,
        return_response=True,
    )
    await hass.services.async_call(
        DOMAIN,
        "remove_exception",
        {"config_entry_id": entry.entry_id, "exception_id": response["exception_id"]},
        blocking=True,
    )
    assert entry.runtime_data.data["exceptions"] == []


async def test_invalid_calls(hass: HomeAssistant, entry: Any) -> None:
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "set_override",
            {"config_entry_id": entry.entry_id, "profile": "missing"},
            blocking=True,
        )
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "set_override",
            {"config_entry_id": entry.entry_id, "profile": "frei", "until": "2020-01-01 00:00"},
            blocking=True,
        )
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN, "apply_now", {"config_entry_id": "unknown"}, blocking=True
        )
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "add_exception",
            {
                "config_entry_id": entry.entry_id,
                "from": "2026-12-24",
                "to": "2026-12-01",
                "profile": "frei",
            },
            blocking=True,
        )


async def test_override_and_clear(hass: HomeAssistant, entry: Any) -> None:
    await hass.services.async_call(
        DOMAIN,
        "set_override",
        {"config_entry_id": entry.entry_id, "profile": "frei"},
        blocking=True,
    )
    assert float(hass.states.get(TARGET).state) == 60
    await hass.services.async_call(
        DOMAIN, "clear_override", {"config_entry_id": entry.entry_id}, blocking=True
    )
    assert float(hass.states.get(TARGET).state) == 45
