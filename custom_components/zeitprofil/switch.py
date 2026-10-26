"""Switch to enable or disable an instance."""

from __future__ import annotations

from typing import Any

from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import ZeitprofilConfigEntry
from .entity import ZeitprofilEntity
from .runtime import ZeitprofilRuntime


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ZeitprofilConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the switch."""
    async_add_entities([ActiveSwitch(entry.runtime_data)])


class ActiveSwitch(ZeitprofilEntity, SwitchEntity):
    """Writing on/off. The state is persisted in the schedule store."""

    def __init__(self, runtime: ZeitprofilRuntime) -> None:
        """Initialize the switch."""
        super().__init__(runtime, "active", "aktiv", "switch")

    @property
    def is_on(self) -> bool:
        """Return whether the instance writes values."""
        return self.runtime.enabled

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Enable writing."""
        await self.runtime.async_set_enabled(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Disable writing."""
        await self.runtime.async_set_enabled(False)
