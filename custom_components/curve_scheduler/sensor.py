"""Sensors: computed setpoint and active profile."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorStateClass
from homeassistant.const import UnitOfTemperature
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import CurveSchedulerConfigEntry
from .entity import CurveSchedulerEntity
from .runtime import CurveSchedulerRuntime

TEMPERATURE_UNITS = {unit.value for unit in UnitOfTemperature}


async def async_setup_entry(
    hass: HomeAssistant,
    entry: CurveSchedulerConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up the sensors."""
    runtime = entry.runtime_data
    async_add_entities([SetpointSensor(runtime), ProfileSensor(runtime)])


class SetpointSensor(CurveSchedulerEntity, SensorEntity):
    """The currently computed setpoint."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, runtime: CurveSchedulerRuntime) -> None:
        """Initialize the sensor."""
        super().__init__(runtime, "setpoint", "setpoint", "sensor")
        self._attr_native_unit_of_measurement = runtime.unit
        if runtime.unit in TEMPERATURE_UNITS:
            self._attr_device_class = SensorDeviceClass.TEMPERATURE
        self._attr_suggested_display_precision = _precision(runtime.step)

    @property
    def native_value(self) -> float | None:
        """Return the computed value."""
        current = self.runtime.current
        return current.value if current else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return details about the computation."""
        current = self.runtime.current
        if current is None:
            return {}
        profile = self.runtime.data["profiles"].get(current.profile_id, {})
        in_one_hour = self.runtime.state_dict()["value_in_1h"]
        return {
            "profile": profile.get("name"),
            "profile_id": current.profile_id,
            "reason": current.reason,
            "next_point_time": (
                current.next_point_time.isoformat() if current.next_point_time else None
            ),
            "next_point_value": current.next_point_value,
            "value_in_1h": in_one_hour,
            "raw_value": round(current.raw, 4),
            "enabled": self.runtime.enabled,
        }


class ProfileSensor(CurveSchedulerEntity, SensorEntity):
    """Name of the active profile."""

    def __init__(self, runtime: CurveSchedulerRuntime) -> None:
        """Initialize the sensor."""
        super().__init__(runtime, "profile", "profile", "sensor")

    @property
    def native_value(self) -> str | None:
        """Return the active profile name."""
        current = self.runtime.current
        if current is None:
            return None
        name = self.runtime.data["profiles"].get(current.profile_id, {}).get("name")
        return str(name) if name is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """Return the profile id and reason."""
        current = self.runtime.current
        if current is None:
            return {}
        return {"profile_id": current.profile_id, "reason": current.reason}


def _precision(step: float) -> int:
    text = f"{step:.6f}".rstrip("0").rstrip(".")
    return len(text.split(".")[1]) if "." in text else 0
