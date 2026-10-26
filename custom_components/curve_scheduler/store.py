"""Persistent storage of schedule data (independent of config entry options)."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORAGE_MINOR_VERSION, STORAGE_VERSION


class ScheduleStore(Store[dict[str, Any]]):
    """Versioned store with a migration path."""

    async def _async_migrate_func(
        self,
        old_major_version: int,
        old_minor_version: int,
        old_data: dict[str, Any],
    ) -> dict[str, Any]:
        """Migrate stored data to the current schema version."""
        if old_major_version > STORAGE_VERSION:
            raise NotImplementedError(
                f"Stored data version {old_major_version} is newer than supported"
            )
        # Add version specific steps here when the schema changes, e.g.
        # ``if old_major_version == 1: ...``. Missing keys are filled in by
        # ``migrate_data`` for every version.
        return migrate_data(dict(old_data))


def migrate_data(data: dict[str, Any]) -> dict[str, Any]:
    """Fill in keys that may be missing in older data (idempotent)."""
    data.setdefault("exceptions", [])
    data.setdefault("auto_cleanup", False)
    data.setdefault("enabled", True)
    data.setdefault("override", None)
    data.setdefault("revision", 1)
    return data


def create_store(hass: HomeAssistant, entry_id: str) -> ScheduleStore:
    """Create the store for a config entry."""
    return ScheduleStore(
        hass,
        STORAGE_VERSION,
        f"{DOMAIN}.{entry_id}",
        minor_version=STORAGE_MINOR_VERSION,
        atomic_writes=True,
    )
