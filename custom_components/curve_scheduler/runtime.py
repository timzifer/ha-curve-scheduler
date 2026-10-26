"""Runtime of one Curve Scheduler instance: computing and writing the setpoint."""

from __future__ import annotations

from collections.abc import Callable
import copy
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
import logging
import math
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import ATTR_ENTITY_ID, ATTR_TEMPERATURE, STATE_UNAVAILABLE, STATE_UNKNOWN
from homeassistant.core import CALLBACK_TYPE, Event, EventStateChangedData, HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.event import (
    async_track_point_in_time,
    async_track_point_in_utc_time,
    async_track_state_change_event,
    async_track_time_interval,
)
from homeassistant.helpers.start import async_at_started
from homeassistant.util import dt as dt_util

from .const import (
    CONF_HOLIDAY_SOURCE,
    CONF_INTERPOLATION,
    CONF_INTERVAL,
    CONF_MAX,
    CONF_MIN,
    CONF_STEP,
    CONF_TARGET,
    CONF_THRESHOLD,
    CONF_UNIT,
    DEFAULT_INTERPOLATION,
    DEFAULT_INTERVAL,
    DEFAULT_MAX,
    DEFAULT_MIN,
    DEFAULT_STEP,
    DEFAULT_THRESHOLD,
    MINUTES_PER_DAY,
    REASON_OVERRIDE,
)
from .holidays import HolidayProvider
from .interpolation import (
    build_timeline,
    clamp,
    format_time,
    interpolate,
    next_point,
    round_to_step,
)
from .model import (
    EDITABLE_KEYS,
    DayProfile,
    ScheduleValidationError,
    ValidationIssue,
    default_schedule,
    new_exception_id,
    normalize_schedule,
    profile_points,
    resolve_day,
    timeline_days,
    validate_schedule,
    validate_update,
)
from .store import ScheduleStore, migrate_data

_LOGGER = logging.getLogger(__name__)


class RevisionConflictError(HomeAssistantError):
    """Raised when the stored data changed since the client loaded it."""

    def __init__(self, revision: int) -> None:
        """Store the current revision."""
        super().__init__(f"Data was changed in the meantime (revision {revision})")
        self.revision = revision


@dataclass(slots=True)
class ComputedValue:
    """Result of a computation for one point in time."""

    raw: float
    value: float
    profile_id: str
    reason: str
    next_point_time: datetime | None
    next_point_value: float | None


def local_datetime(day: date, minutes: float) -> datetime:
    """Return the local datetime for minutes after midnight of ``day``."""
    offset_days, minute = divmod(int(minutes), MINUTES_PER_DAY)
    target_day = day + timedelta(days=offset_days)
    return datetime.combine(
        target_day,
        time(minute // 60, minute % 60),
        tzinfo=dt_util.get_default_time_zone(),
    )


class CurveSchedulerRuntime:
    """Holds the schedule of one config entry and drives the target entity."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry, store: ScheduleStore) -> None:
        """Initialize the runtime."""
        self.hass = hass
        self.entry = entry
        self.store = store
        self.data: dict[str, Any] = {}
        self.holidays = HolidayProvider(hass, self.holiday_source)
        self.current: ComputedValue | None = None
        self.last_written: float | None = None
        self._listeners: list[Callable[[], None]] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._override_unsub: CALLBACK_TYPE | None = None
        self._unavailable_warned = False
        self._last_day: date | None = None
        self._stopped = False

    # ------------------------------------------------------------------
    # Configuration

    @property
    def options(self) -> dict[str, Any]:
        """Return merged config entry data and options."""
        return {**self.entry.data, **self.entry.options}

    @property
    def target(self) -> str:
        """Return the target entity id."""
        return str(self.options[CONF_TARGET])

    @property
    def interval(self) -> int:
        """Return the write interval in minutes."""
        return int(self.options.get(CONF_INTERVAL, DEFAULT_INTERVAL))

    @property
    def mode(self) -> str:
        """Return the interpolation mode."""
        return str(self.options.get(CONF_INTERPOLATION, DEFAULT_INTERPOLATION))

    @property
    def minimum(self) -> float:
        """Return the lower bound."""
        return float(self.options.get(CONF_MIN, DEFAULT_MIN))

    @property
    def maximum(self) -> float:
        """Return the upper bound."""
        return float(self.options.get(CONF_MAX, DEFAULT_MAX))

    @property
    def step(self) -> float:
        """Return the rounding step."""
        return float(self.options.get(CONF_STEP, DEFAULT_STEP))

    @property
    def threshold(self) -> float:
        """Return the write threshold."""
        return float(self.options.get(CONF_THRESHOLD, DEFAULT_THRESHOLD))

    @property
    def unit(self) -> str | None:
        """Return the display unit."""
        return self.options.get(CONF_UNIT) or None

    @property
    def holiday_source(self) -> str | None:
        """Return the holiday source entity id."""
        return self.options.get(CONF_HOLIDAY_SOURCE) or None

    @property
    def enabled(self) -> bool:
        """Return whether writing is enabled."""
        return bool(self.data.get("enabled", True))

    @property
    def revision(self) -> int:
        """Return the revision of the editable data."""
        return int(self.data.get("revision", 1))

    def config_dict(self) -> dict[str, Any]:
        """Return the configuration relevant for the card."""
        return {
            "target": self.target,
            "interval": self.interval,
            "interpolation": self.mode,
            "min": self.minimum,
            "max": self.maximum,
            "step": self.step,
            "unit": self.unit,
            "holiday_source": self.holiday_source,
            "threshold": self.threshold,
        }

    def schedule_dict(self) -> dict[str, Any]:
        """Return the editable schedule."""
        return {key: copy.deepcopy(self.data[key]) for key in EDITABLE_KEYS}

    # ------------------------------------------------------------------
    # Lifecycle

    async def async_load(self) -> None:
        """Load stored data or create the default schedule."""
        stored = await self.store.async_load()
        if stored is None:
            stored = default_schedule(
                self.minimum, self.maximum, self.step, self.hass.config.language
            )
            stored = migrate_data(stored)
            self.data = stored
            await self.store.async_save(self.data)
        else:
            self.data = migrate_data(stored)
        issues = validate_schedule(self.data, -math.inf, math.inf)
        if issues:
            _LOGGER.warning(
                "Stored schedule for %s has problems: %s",
                self.entry.title,
                ", ".join(f"{i.path}: {i.code}" for i in issues),
            )

    async def async_start(self) -> None:
        """Set up listeners and timers."""
        now = dt_util.now()
        self._last_day = now.date()
        self._unsubs.append(
            async_track_state_change_event(self.hass, [self.target], self._async_target_changed)
        )
        if self.holiday_source:
            self._unsubs.append(
                async_track_state_change_event(
                    self.hass, [self.holiday_source], self._async_holiday_source_changed
                )
            )
        next_minute = dt_util.utcnow().replace(second=0, microsecond=0) + timedelta(minutes=1)
        self._unsubs.append(
            async_track_point_in_utc_time(self.hass, self._async_start_interval, next_minute)
        )
        self._schedule_override_expiry()
        self._compute(now)
        self._unsubs.append(async_at_started(self.hass, self._async_hass_started))

    async def async_stop(self) -> None:
        """Remove listeners and timers."""
        self._stopped = True
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        if self._override_unsub:
            self._override_unsub()
            self._override_unsub = None
        self._listeners.clear()

    async def _async_hass_started(self, _hass: HomeAssistant) -> None:
        await self.async_update(force=True)

    async def _async_start_interval(self, _now: datetime) -> None:
        if self._stopped:
            return
        self._unsubs.append(
            async_track_time_interval(self.hass, self._async_tick, timedelta(minutes=self.interval))
        )
        await self._async_tick(_now)

    async def _async_tick(self, _now: datetime) -> None:
        now = dt_util.now()
        if self._last_day != now.date():
            self._last_day = now.date()
            await self._async_cleanup_exceptions(now.date())
        await self.async_update(force=False)

    @callback
    def _async_target_changed(self, event: Event[EventStateChangedData]) -> None:
        old = event.data["old_state"]
        new = event.data["new_state"]
        was_available = old is not None and old.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
        is_available = new is not None and new.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)
        if is_available and not was_available:
            if self._unavailable_warned:
                _LOGGER.info("Target %s is available again", self.target)
            self.hass.async_create_task(self.async_update(force=True))
        elif was_available != is_available:
            self._notify()

    @callback
    def _async_holiday_source_changed(self, _event: Event[EventStateChangedData]) -> None:
        self.holidays.clear()
        self.hass.async_create_task(self.async_update(force=True))

    # ------------------------------------------------------------------
    # Listeners

    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> CALLBACK_TYPE:
        """Register a callback that runs whenever state or data changes."""
        self._listeners.append(listener)

        @callback
        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return remove

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()

    # ------------------------------------------------------------------
    # Computation

    def active_override(self, at: datetime) -> str | None:
        """Return the override profile active at ``at``."""
        override = self.data.get("override")
        if not override:
            return None
        until = override.get("until")
        if until:
            until_dt = dt_util.parse_datetime(until)
            if until_dt is not None and at >= until_dt:
                return None
        profile_id = override.get("profile")
        if profile_id not in self.data["profiles"]:
            return None
        return str(profile_id)

    def day_profile(self, day: date, at: datetime) -> DayProfile:
        """Return the profile for ``day`` as seen at time ``at``."""
        override = self.active_override(at)
        if override is not None:
            return DayProfile(override, REASON_OVERRIDE)
        return resolve_day(self.data, day, self.holidays.is_holiday)

    def timeline_profiles(self, at: datetime) -> list[tuple[date, DayProfile]]:
        """Return the profiles of the five timeline days around ``at``."""
        local = dt_util.as_local(at)
        return [(day, self.day_profile(day, local)) for day in timeline_days(local.date())]

    def compute_at(self, at: datetime) -> ComputedValue:
        """Compute the setpoint for a point in time."""
        local = dt_util.as_local(at)
        days = self.timeline_profiles(local)
        timeline = build_timeline(
            [profile_points(self.data["profiles"][dp.profile_id]) for _, dp in days]
        )
        x = local.hour * 60 + local.minute + local.second / 60.0
        raw = interpolate(timeline, x, self.mode)
        value = clamp(
            round_to_step(clamp(raw, self.minimum, self.maximum), self.step),
            self.minimum,
            self.maximum,
        )
        upcoming = next_point(timeline, x)
        next_time = local_datetime(local.date(), upcoming[0]) if upcoming else None
        next_value = upcoming[1] if upcoming else None
        today = days[2][1]
        return ComputedValue(raw, value, today.profile_id, today.reason, next_time, next_value)

    def _compute(self, now: datetime) -> ComputedValue:
        self.current = self.compute_at(now)
        return self.current

    def preview(
        self, day: date, schedule: dict[str, Any] | None, step_minutes: int
    ) -> list[list[float]]:
        """Return the curve of ``day`` as ``[minute, value]`` pairs."""
        data = self.data if schedule is None else {**self.data, **schedule}
        override = self.active_override(dt_util.now())
        profiles = []
        for current_day in timeline_days(day):
            if override is not None and override in data["profiles"]:
                profile_id = override
            else:
                profile_id = resolve_day(data, current_day, self.holidays.is_holiday).profile_id
            profiles.append(profile_points(data["profiles"][profile_id]))
        timeline = build_timeline(profiles)
        return [
            [float(minute), interpolate(timeline, float(minute), self.mode)]
            for minute in range(0, MINUTES_PER_DAY + 1, step_minutes)
        ]

    # ------------------------------------------------------------------
    # Writing

    def target_value(self) -> float | None:
        """Return the current value of the target entity (if any)."""
        state = self.hass.states.get(self.target)
        if state is None:
            return None
        domain = self.target.split(".", 1)[0]
        raw: Any = state.state
        if domain in ("climate", "water_heater"):
            raw = state.attributes.get(ATTR_TEMPERATURE)
        try:
            return float(raw)
        except (TypeError, ValueError):
            return None

    def target_available(self) -> bool:
        """Return whether the target can be written."""
        state = self.hass.states.get(self.target)
        return state is not None and state.state not in (STATE_UNAVAILABLE, STATE_UNKNOWN)

    async def async_update(self, force: bool = False) -> None:
        """Recompute the setpoint and write it if needed.

        ``force`` is used for immediate updates (start, save, mode changes,
        button). They ignore the write threshold but still skip writing a value
        that the target already has.
        """
        if self._stopped:
            return
        now = dt_util.now()
        await self._async_expire_override(now)
        if self.holidays.configured and self.holidays.is_stale(now):
            self.holidays.clear()
        await self.holidays.async_ensure(
            now.date() - timedelta(days=2), now.date() + timedelta(days=3)
        )
        computed = self._compute(now)
        await self._async_write(computed.value, force)
        self._notify()

    async def _async_write(self, value: float, force: bool) -> None:
        if not self.enabled:
            return
        if not self.target_available():
            if not self._unavailable_warned:
                _LOGGER.warning(
                    "Target %s is unavailable, setpoint %s not written", self.target, value
                )
                self._unavailable_warned = True
            return
        self._unavailable_warned = False
        current = self.target_value()
        if current is not None:
            difference = abs(current - value)
            if difference < 1e-9:
                return
            if not force and self.threshold > 0 and difference < self.threshold:
                return
        domain = self.target.split(".", 1)[0]
        if domain in ("number", "input_number"):
            service, data = "set_value", {"value": value}
        else:
            service, data = "set_temperature", {ATTR_TEMPERATURE: value}
        try:
            await self.hass.services.async_call(
                domain, service, {ATTR_ENTITY_ID: self.target, **data}, blocking=True
            )
        except (HomeAssistantError, ValueError) as err:
            _LOGGER.error("Writing %s to %s failed: %s", value, self.target, err)
            return
        self.last_written = value
        _LOGGER.debug("Wrote %s to %s", value, self.target)

    # ------------------------------------------------------------------
    # Changes

    async def _async_persist(self) -> None:
        await self.store.async_save(self.data)

    async def async_save_schedule(self, schedule: Any, revision: int | None) -> int:
        """Validate and store new schedule data from the editor."""
        if revision is not None and revision != self.revision:
            raise RevisionConflictError(self.revision)
        issues = validate_update(self.data, schedule, self.minimum, self.maximum)
        if issues:
            raise ScheduleValidationError(issues)
        self.data.update(normalize_schedule(schedule))
        self.data["revision"] = self.revision + 1
        override = self.data.get("override")
        if override and override.get("profile") not in self.data["profiles"]:
            self.data["override"] = None
            self._schedule_override_expiry()
        await self._async_persist()
        await self.async_update(force=True)
        return self.revision

    async def async_set_enabled(self, enabled: bool) -> None:
        """Enable or disable writing."""
        self.data["enabled"] = enabled
        await self._async_persist()
        await self.async_update(force=True)

    async def async_set_override(self, profile_id: str, until: datetime | None) -> None:
        """Activate a manual profile override."""
        if profile_id not in self.data["profiles"]:
            raise ScheduleValidationError(
                [ValidationIssue("unknown_profile", "profile", {"profile": profile_id})]
            )
        if until is not None and until <= dt_util.now():
            raise ScheduleValidationError([ValidationIssue("until_in_past", "until")])
        self.data["override"] = {
            "profile": profile_id,
            "until": dt_util.as_local(until).isoformat() if until else None,
        }
        self._schedule_override_expiry()
        await self._async_persist()
        await self.async_update(force=True)

    async def async_clear_override(self) -> None:
        """Return to automatic mode."""
        self.data["override"] = None
        self._schedule_override_expiry()
        await self._async_persist()
        await self.async_update(force=True)

    def find_profile(self, value: str) -> str | None:
        """Find a profile by id or (case-insensitive) name."""
        if value in self.data["profiles"]:
            return value
        wanted = value.strip().casefold()
        for profile_id, profile in self.data["profiles"].items():
            if profile["name"].casefold() == wanted:
                return str(profile_id)
        return None

    async def async_add_exception(
        self, start: date, end: date, profile_id: str, note: str = ""
    ) -> str:
        """Add a date range exception and return its id."""
        exception_id = new_exception_id()
        exceptions = [*self.data["exceptions"]]
        exceptions.append(
            {
                "id": exception_id,
                "from": start.isoformat(),
                "to": end.isoformat(),
                "profile": profile_id,
                "note": note,
            }
        )
        await self.async_save_schedule({**self.schedule_dict(), "exceptions": exceptions}, None)
        return exception_id

    async def async_remove_exception(
        self, exception_id: str | None = None, day: date | None = None
    ) -> int:
        """Remove exceptions by id or covering a date; return the count."""
        iso = day.isoformat() if day else None
        remaining = [
            exception
            for exception in self.data["exceptions"]
            if not (
                (exception_id and exception["id"] == exception_id)
                or (iso and exception["from"] <= iso <= exception["to"])
            )
        ]
        removed = len(self.data["exceptions"]) - len(remaining)
        if removed:
            await self.async_save_schedule({**self.schedule_dict(), "exceptions": remaining}, None)
        return removed

    async def _async_cleanup_exceptions(self, today: date) -> None:
        if not self.data.get("auto_cleanup"):
            return
        iso = today.isoformat()
        remaining = [e for e in self.data["exceptions"] if e["to"] >= iso]
        if len(remaining) != len(self.data["exceptions"]):
            self.data["exceptions"] = remaining
            self.data["revision"] = self.revision + 1
            await self._async_persist()

    async def _async_expire_override(self, now: datetime) -> None:
        override = self.data.get("override")
        if override and override.get("until") and self.active_override(now) is None:
            self.data["override"] = None
            self._schedule_override_expiry()
            await self._async_persist()

    def _schedule_override_expiry(self) -> None:
        if self._override_unsub:
            self._override_unsub()
            self._override_unsub = None
        override = self.data.get("override")
        until = (
            dt_util.parse_datetime(override["until"])
            if override and override.get("until")
            else None
        )
        if until is None or self._stopped:
            return

        async def _expired(_now: datetime) -> None:
            self._override_unsub = None
            await self.async_update(force=True)

        self._override_unsub = async_track_point_in_time(self.hass, _expired, until)

    # ------------------------------------------------------------------
    # Serialization for the websocket API

    def state_dict(self) -> dict[str, Any]:
        """Return the live state for the card."""
        now = dt_util.now()
        current = self.current or self.compute_at(now)
        in_one_hour = self.compute_at(now + timedelta(hours=1))
        profiles = self.timeline_profiles(now)
        return {
            "now": now.isoformat(),
            "enabled": self.enabled,
            "override": copy.deepcopy(self.data.get("override")),
            "value": current.value,
            "raw_value": current.raw,
            "profile_id": current.profile_id,
            "reason": current.reason,
            "next_point": (
                {
                    "time": current.next_point_time.isoformat(),
                    "hhmm": format_time(
                        current.next_point_time.hour * 60 + current.next_point_time.minute
                    ),
                    "value": current.next_point_value,
                }
                if current.next_point_time
                else None
            ),
            "value_in_1h": in_one_hour.value,
            "target_available": self.target_available(),
            "target_value": self.target_value(),
            "timeline": [
                {"date": day.isoformat(), "profile_id": dp.profile_id, "reason": dp.reason}
                for day, dp in profiles
            ],
        }

    def as_dict(self) -> dict[str, Any]:
        """Return everything the card needs."""
        return {
            "entry_id": self.entry.entry_id,
            "title": self.entry.title,
            "config": self.config_dict(),
            "schedule": self.schedule_dict(),
            "revision": self.revision,
            "state": self.state_dict(),
        }
