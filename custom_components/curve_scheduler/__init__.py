"""The Curve Scheduler integration: daily setpoint curves for any number entity."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .frontend import async_register_frontend
from .runtime import CurveSchedulerRuntime
from .services import async_register_services
from .store import create_store
from .websocket_api import async_register_websocket_api

PLATFORMS = [Platform.BUTTON, Platform.SELECT, Platform.SENSOR, Platform.SWITCH]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)

type CurveSchedulerConfigEntry = ConfigEntry[CurveSchedulerRuntime]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up services, websocket commands and the card (once)."""
    async_register_services(hass)
    async_register_websocket_api(hass)
    await async_register_frontend(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: CurveSchedulerConfigEntry) -> bool:
    """Set up one instance."""
    runtime = CurveSchedulerRuntime(hass, entry, create_store(hass, entry.entry_id))
    await runtime.async_load()
    entry.runtime_data = runtime
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await runtime.async_start()
    entry.async_on_unload(entry.add_update_listener(_async_update_listener))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: CurveSchedulerConfigEntry) -> bool:
    """Unload an instance."""
    await entry.runtime_data.async_stop()
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: CurveSchedulerConfigEntry) -> None:
    """Delete the stored schedule when the instance is removed."""
    await create_store(hass, entry.entry_id).async_remove()


async def _async_update_listener(hass: HomeAssistant, entry: CurveSchedulerConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)
