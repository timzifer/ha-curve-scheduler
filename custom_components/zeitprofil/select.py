"""Select between automatic mode and a manual profile override."""

from __future__ import annotations

from homeassistant.components.select import SelectEntity
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import ZeitprofilConfigEntry
from .const import DOMAIN, MODE_AUTO
from .entity import ZeitprofilEntity
from .runtime import ZeitprofilRuntime


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ZeitprofilConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the select."""
    async_add_entities([ModeSelect(entry.runtime_data)])


class ModeSelect(ZeitprofilEntity, SelectEntity):
    """``auto`` (shown as "Automatik") or the name of a profile."""

    def __init__(self, runtime: ZeitprofilRuntime) -> None:
        """Initialize the select."""
        super().__init__(runtime, "mode", "modus", "select")

    @property
    def options(self) -> list[str]:
        """Return automatic mode plus all profile names."""
        return [MODE_AUTO] + [p["name"] for p in self.runtime.data["profiles"].values()]

    @property
    def current_option(self) -> str | None:
        """Return the active mode."""
        override = self.runtime.active_override(dt_util.now())
        if override is None:
            return MODE_AUTO
        return str(self.runtime.data["profiles"][override]["name"])

    async def async_select_option(self, option: str) -> None:
        """Change the mode."""
        if option == MODE_AUTO:
            await self.runtime.async_clear_override()
            return
        profile_id = self.runtime.find_profile(option)
        if profile_id is None:
            raise ServiceValidationError(
                translation_domain=DOMAIN,
                translation_key="unknown_profile",
                translation_placeholders={"profile": option},
            )
        await self.runtime.async_set_override(profile_id, None)
