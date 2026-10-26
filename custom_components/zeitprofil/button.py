"""Button to write the setpoint immediately."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
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
    """Set up the button."""
    async_add_entities([ApplyNowButton(entry.runtime_data)])


class ApplyNowButton(ZeitprofilEntity, ButtonEntity):
    """Write the current setpoint now."""

    def __init__(self, runtime: ZeitprofilRuntime) -> None:
        """Initialize the button."""
        super().__init__(runtime, "apply_now", "jetzt_anwenden", "button")

    async def async_press(self) -> None:
        """Write now."""
        await self.runtime.async_update(force=True)
