"""Base entity for Zeitprofil."""

from __future__ import annotations

from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity
from homeassistant.util import slugify

from .const import DOMAIN
from .runtime import ZeitprofilRuntime


class ZeitprofilEntity(Entity):
    """Common behaviour: device, naming and update subscription."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(
        self, runtime: ZeitprofilRuntime, key: str, object_suffix: str, domain: str
    ) -> None:
        """Initialize the entity."""
        self.runtime = runtime
        entry = runtime.entry
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_translation_key = key
        # Stable, language independent entity ids such as sensor.zirkulation_sollwert.
        self.entity_id = f"{domain}.{slugify(entry.title)}_{object_suffix}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=f"Zeitprofil {entry.title}",
            manufacturer="Zeitprofil",
            model="Zeitprofil",
            entry_type=DeviceEntryType.SERVICE,
        )

    async def async_added_to_hass(self) -> None:
        """Subscribe to runtime updates."""
        self.async_on_remove(self.runtime.async_add_listener(self._handle_update))

    def _handle_update(self) -> None:
        self.async_write_ha_state()
