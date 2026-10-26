"""Button to write the setpoint immediately."""

from __future__ import annotations

from homeassistant.components.button import ButtonEntity
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CurveSchedulerConfigEntry
from .entity import CurveSchedulerEntity
from .runtime import CurveSchedulerRuntime


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CurveSchedulerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the button."""
    async_add_entities([ApplyNowButton(entry.runtime_data)])


class ApplyNowButton(CurveSchedulerEntity, ButtonEntity):
    """Write the current setpoint now."""

    def __init__(self, runtime: CurveSchedulerRuntime) -> None:
        """Initialize the button."""
        super().__init__(runtime, "apply_now", "apply_now", "button")

    async def async_press(self) -> None:
        """Write now."""
        await self.runtime.async_update(force=True)
