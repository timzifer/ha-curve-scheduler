"""Shared fixtures for Curve Scheduler tests."""

from __future__ import annotations

from collections.abc import Generator
from typing import Any
from unittest.mock import patch

from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.curve_scheduler.const import (
    CONF_HOLIDAY_SOURCE,
    CONF_INTERPOLATION,
    CONF_INTERVAL,
    CONF_MAX,
    CONF_MIN,
    CONF_STEP,
    CONF_TARGET,
    CONF_THRESHOLD,
    CONF_UNIT,
    DOMAIN,
)

TARGET = "input_number.zirkulation_soll"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations: Any) -> None:
    """Enable loading custom integrations in all tests."""


@pytest.fixture(autouse=True)
def mock_frontend() -> Generator[None]:
    """Skip the real frontend (needs the hass_frontend package) and the card."""
    with (
        patch("homeassistant.components.frontend.async_setup", return_value=True),
        patch("custom_components.curve_scheduler.async_register_frontend"),
    ):
        yield


@pytest.fixture
async def berlin(hass: HomeAssistant) -> None:
    """Use a European time zone (for DST tests)."""
    await hass.config.async_set_time_zone("Europe/Berlin")


@pytest.fixture
async def target(hass: HomeAssistant) -> str:
    """Create the input_number that receives the setpoint."""
    assert await async_setup_component(
        hass,
        "input_number",
        {
            "input_number": {
                "zirkulation_soll": {
                    "min": 20,
                    "max": 70,
                    "step": 0.5,
                    "initial": 40,
                    "unit_of_measurement": "°C",
                }
            }
        },
    )
    await hass.async_block_till_done()
    return TARGET


def entry_options(**overrides: Any) -> dict[str, Any]:
    """Return default options for a config entry."""
    options: dict[str, Any] = {
        CONF_INTERVAL: 5,
        CONF_INTERPOLATION: "curve",
        CONF_MIN: 20.0,
        CONF_MAX: 70.0,
        CONF_STEP: 0.5,
        CONF_UNIT: "°C",
        CONF_HOLIDAY_SOURCE: None,
        CONF_THRESHOLD: 0.0,
    }
    options.update(overrides)
    return options


def make_entry(target: str = TARGET, **overrides: Any) -> MockConfigEntry:
    """Create a config entry (not yet added)."""
    return MockConfigEntry(
        domain=DOMAIN,
        title="Zirkulation",
        data={"name": "Zirkulation", CONF_TARGET: target},
        options=entry_options(**overrides),
        unique_id=target,
    )


async def setup_entry(hass: HomeAssistant, entry: MockConfigEntry) -> MockConfigEntry:
    """Add and set up an entry."""
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry
