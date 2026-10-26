"""Holiday sources: Workday binary sensor or calendar entity."""

from __future__ import annotations

from datetime import date, datetime, timedelta
import logging
from typing import Any

from homeassistant.const import STATE_OFF, STATE_ON
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util

_LOGGER = logging.getLogger(__name__)

# Upper bound for a single range request (e.g. the month preview).
MAX_RANGE_DAYS = 62


class HolidayProvider:
    """Answer "is this date a day off?" from the configured source.

    Results are cached per date. A Workday sensor reports today via its state
    and other dates via the ``workday.check_date`` action. For a calendar
    every event (all-day or timed) marks the touched dates as days off.
    """

    def __init__(self, hass: HomeAssistant, entity_id: str | None) -> None:
        """Initialize the provider."""
        self.hass = hass
        self.entity_id = entity_id or None
        self._cache: dict[date, bool] = {}
        self._fetched_at: datetime | None = None
        self._warned = False

    @property
    def configured(self) -> bool:
        """Return whether a source is configured."""
        return self.entity_id is not None

    @property
    def is_calendar(self) -> bool:
        """Return whether the source is a calendar."""
        return bool(self.entity_id and self.entity_id.startswith("calendar."))

    def clear(self) -> None:
        """Forget all cached results."""
        self._cache.clear()
        self._fetched_at = None

    def is_stale(self, now: datetime) -> bool:
        """Return True if cached data should be refreshed."""
        if self._fetched_at is None:
            return True
        if self._fetched_at.date() != now.date():
            return True
        return self.is_calendar and now - self._fetched_at > timedelta(hours=1)

    def is_holiday(self, day: date) -> bool:
        """Return the cached answer for ``day`` (False if unknown)."""
        if not self.entity_id:
            return False
        if not self.is_calendar and day == dt_util.now().date():
            state = self.hass.states.get(self.entity_id)
            if state is not None and state.state in (STATE_ON, STATE_OFF):
                return state.state == STATE_OFF
        return self._cache.get(day, False)

    async def async_ensure(self, start: date, end: date) -> None:
        """Make sure the dates ``start..end`` (inclusive) are cached."""
        if not self.entity_id or end < start:
            return
        end = min(end, start + timedelta(days=MAX_RANGE_DAYS))
        missing = [
            start + timedelta(days=i)
            for i in range((end - start).days + 1)
            if start + timedelta(days=i) not in self._cache
        ]
        if not missing:
            return
        try:
            if self.is_calendar:
                await self._async_fetch_calendar(missing[0], missing[-1])
            else:
                await self._async_fetch_workday(missing)
        except (HomeAssistantError, ValueError, KeyError, TypeError) as err:
            if not self._warned:
                _LOGGER.warning("Could not read holiday source %s: %s", self.entity_id, err)
                self._warned = True
            return
        self._warned = False
        if self._fetched_at is None:
            self._fetched_at = dt_util.now()

    async def async_holidays(self, start: date, end: date) -> list[date]:
        """Return all days off in ``start..end`` (inclusive)."""
        await self.async_ensure(start, end)
        days = (min(end, start + timedelta(days=MAX_RANGE_DAYS)) - start).days + 1
        return [
            start + timedelta(days=i)
            for i in range(max(days, 0))
            if self.is_holiday(start + timedelta(days=i))
        ]

    async def _async_fetch_calendar(self, start: date, end: date) -> None:
        assert self.entity_id
        tz = dt_util.get_default_time_zone()
        start_dt = datetime.combine(start, datetime.min.time(), tzinfo=tz)
        end_dt = datetime.combine(end + timedelta(days=1), datetime.min.time(), tzinfo=tz)
        response = await self.hass.services.async_call(
            "calendar",
            "get_events",
            {"start_date_time": start_dt.isoformat(), "end_date_time": end_dt.isoformat()},
            target={"entity_id": self.entity_id},
            blocking=True,
            return_response=True,
        )
        result: dict[date, bool] = {
            start + timedelta(days=i): False for i in range((end - start).days + 1)
        }
        payload: dict[str, Any] = dict(response or {})
        events: list[dict[str, Any]] = payload.get(self.entity_id, {}).get("events", [])
        for event in events:
            for day in _event_days(event["start"], event["end"]):
                if day in result:
                    result[day] = True
        self._cache.update(result)

    async def _async_fetch_workday(self, days: list[date]) -> None:
        assert self.entity_id
        if not self.hass.services.has_service("workday", "check_date"):
            raise HomeAssistantError("workday.check_date is not available")
        for day in days:
            response = await self.hass.services.async_call(
                "workday",
                "check_date",
                {"check_date": day.isoformat()},
                target={"entity_id": self.entity_id},
                blocking=True,
                return_response=True,
            )
            payload: dict[str, Any] = dict(response or {})
            workday = payload.get(self.entity_id, {}).get("workday")
            if workday is None:
                raise HomeAssistantError("unexpected response from workday.check_date")
            self._cache[day] = not workday


def _event_days(start_raw: str, end_raw: str) -> list[date]:
    """Return the local dates touched by a calendar event."""
    start_dt = dt_util.parse_datetime(start_raw)
    end_dt = dt_util.parse_datetime(end_raw)
    if start_dt is None or end_dt is None or len(start_raw) <= 10:
        # All-day event: the end date is exclusive.
        start_day = date.fromisoformat(start_raw[:10])
        end_day = date.fromisoformat(end_raw[:10]) - timedelta(days=1)
    else:
        start_day = dt_util.as_local(start_dt).date()
        local_end = dt_util.as_local(end_dt)
        end_day = local_end.date()
        if local_end.time() == datetime.min.time() and end_day > start_day:
            end_day -= timedelta(days=1)
    end_day = max(end_day, start_day)
    return [start_day + timedelta(days=i) for i in range((end_day - start_day).days + 1)]
