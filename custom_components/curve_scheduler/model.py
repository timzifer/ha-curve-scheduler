"""Schedule data model, validation and day resolution.

Free of Home Assistant imports; mirrored in ``frontend/src/model.ts``.
Validation errors use stable codes which both the backend and the card
translate.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass, field
from datetime import date, timedelta
import math
import re
from typing import Any
import uuid

from .const import (
    MAX_EXCEPTIONS,
    MAX_NAME_LENGTH,
    MAX_NOTE_LENGTH,
    MAX_POINTS,
    MAX_PROFILES,
    MIN_POINTS,
    MINUTES_PER_DAY,
    MODE_AUTO,
    REASON_EXCEPTION,
    REASON_HOLIDAY,
    REASON_WEEKDAY,
    TIME_GRID_MINUTES,
    WEEKDAYS,
)
from .interpolation import Point, format_time, parse_time, round_to_step

TIME_RE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
PROFILE_ID_RE = re.compile(r"^[a-z0-9_]{1,40}$")

DEFAULT_COLORS = ["#e67e22", "#27ae60", "#2980b9", "#8e44ad", "#c0392b", "#16a085"]

# Fields of the schedule that the editor may change (everything except
# runtime state such as ``enabled`` and ``override``).
EDITABLE_KEYS = ("profiles", "week", "holiday_profile", "exceptions", "auto_cleanup")


@dataclass(slots=True)
class ValidationIssue:
    """A single validation problem."""

    code: str
    path: str
    params: dict[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        """Serialize for the websocket API."""
        return {"code": self.code, "path": self.path, "params": self.params}


class ScheduleValidationError(Exception):
    """Raised when schedule data is invalid."""

    def __init__(self, issues: list[ValidationIssue]) -> None:
        """Store the issues."""
        super().__init__(", ".join(f"{i.path}: {i.code}" for i in issues))
        self.issues = issues


def new_exception_id() -> str:
    """Return a short random identifier for an exception."""
    return uuid.uuid4().hex[:12]


def default_schedule(minimum: float, maximum: float, step: float, language: str) -> dict[str, Any]:
    """Return the initial schedule with two example profiles."""
    span = maximum - minimum

    def level(fraction: float) -> float:
        value = round_to_step(minimum + span * fraction, step)
        return max(minimum, min(maximum, value))

    low = level(0.5)
    high = level(0.8)
    german = language.lower().startswith("de")
    return {
        "profiles": {
            "workday": {
                "name": "Werktag" if german else "Workday",
                "color": DEFAULT_COLORS[0],
                "points": [
                    {"t": "05:00", "v": low},
                    {"t": "05:30", "v": high},
                    {"t": "08:30", "v": high},
                    {"t": "09:00", "v": low},
                    {"t": "17:00", "v": low},
                    {"t": "17:30", "v": high},
                    {"t": "21:30", "v": high},
                    {"t": "22:00", "v": low},
                ],
            },
            "day_off": {
                "name": "Frei" if german else "Day off",
                "color": DEFAULT_COLORS[1],
                "points": [
                    {"t": "07:00", "v": low},
                    {"t": "07:30", "v": high},
                    {"t": "22:00", "v": high},
                    {"t": "22:30", "v": low},
                ],
            },
        },
        "week": {
            "mon": "workday",
            "tue": "workday",
            "wed": "workday",
            "thu": "workday",
            "fri": "workday",
            "sat": "day_off",
            "sun": "day_off",
        },
        "holiday_profile": "day_off",
        "exceptions": [],
        "auto_cleanup": False,
        "enabled": True,
        "override": None,
    }


def profile_points(profile: Mapping[str, Any]) -> list[Point]:
    """Return the points of a profile as ``(minutes, value)`` tuples."""
    return [(float(parse_time(p["t"])), float(p["v"])) for p in profile["points"]]


def _issue(issues: list[ValidationIssue], code: str, path: str, **params: Any) -> None:
    issues.append(ValidationIssue(code, path, params))


def _validate_points(
    points: Any,
    path: str,
    minimum: float,
    maximum: float,
    issues: list[ValidationIssue],
) -> None:
    if not isinstance(points, list):
        _issue(issues, "invalid_format", path)
        return
    if len(points) < MIN_POINTS:
        _issue(issues, "too_few_points", path, min=MIN_POINTS)
    if len(points) > MAX_POINTS:
        _issue(issues, "too_many_points", path, max=MAX_POINTS)
    previous: int | None = None
    seen: set[int] = set()
    for index, point in enumerate(points):
        point_path = f"{path}.{index}"
        if not isinstance(point, Mapping) or not isinstance(point.get("t"), str):
            _issue(issues, "invalid_format", point_path)
            continue
        time_str = point["t"]
        if not TIME_RE.match(time_str):
            _issue(issues, "invalid_time", point_path, time=time_str)
            continue
        minutes = parse_time(time_str)
        if minutes % TIME_GRID_MINUTES:
            _issue(issues, "time_not_on_grid", point_path, time=time_str, grid=TIME_GRID_MINUTES)
        if minutes in seen:
            _issue(issues, "duplicate_time", point_path, time=time_str)
        elif previous is not None and minutes < previous:
            _issue(issues, "times_not_sorted", point_path, time=time_str)
        seen.add(minutes)
        previous = minutes
        value = point.get("v")
        if not isinstance(value, (int, float)) or isinstance(value, bool) or math.isnan(value):
            _issue(issues, "invalid_value", point_path, time=time_str)
        elif value < minimum or value > maximum:
            _issue(
                issues,
                "value_out_of_range",
                point_path,
                time=time_str,
                value=value,
                min=minimum,
                max=maximum,
            )


def _valid_date(value: Any) -> date | None:
    if not isinstance(value, str) or not DATE_RE.match(value):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def validate_schedule(data: Any, minimum: float, maximum: float) -> list[ValidationIssue]:
    """Validate the editable part of a schedule and return all issues."""
    issues: list[ValidationIssue] = []
    if not isinstance(data, Mapping):
        _issue(issues, "invalid_format", "")
        return issues

    profiles = data.get("profiles")
    if not isinstance(profiles, Mapping) or not profiles:
        _issue(issues, "no_profiles", "profiles")
        profiles = {}
    if len(profiles) > MAX_PROFILES:
        _issue(issues, "too_many_profiles", "profiles", max=MAX_PROFILES)

    names: dict[str, str] = {}
    for profile_id, profile in profiles.items():
        path = f"profiles.{profile_id}"
        if not isinstance(profile_id, str) or not PROFILE_ID_RE.match(profile_id):
            _issue(issues, "invalid_profile_id", path)
        if not isinstance(profile, Mapping):
            _issue(issues, "invalid_format", path)
            continue
        name = profile.get("name")
        if not isinstance(name, str) or not name.strip():
            _issue(issues, "empty_name", f"{path}.name")
        elif len(name) > MAX_NAME_LENGTH:
            _issue(issues, "name_too_long", f"{path}.name", max=MAX_NAME_LENGTH)
        else:
            key = name.strip().casefold()
            if key == MODE_AUTO:
                _issue(issues, "reserved_name", f"{path}.name", name=name)
            elif key in names:
                _issue(issues, "duplicate_name", f"{path}.name", name=name)
            names[key] = profile_id
        color = profile.get("color")
        if not isinstance(color, str) or not COLOR_RE.match(color):
            _issue(issues, "invalid_color", f"{path}.color")
        _validate_points(profile.get("points"), f"{path}.points", minimum, maximum, issues)

    def check_reference(value: Any, path: str) -> None:
        if not isinstance(value, str) or value not in profiles:
            _issue(issues, "unknown_profile", path, profile=str(value))

    week = data.get("week")
    if not isinstance(week, Mapping):
        _issue(issues, "invalid_format", "week")
    else:
        for day in WEEKDAYS:
            check_reference(week.get(day), f"week.{day}")

    check_reference(data.get("holiday_profile"), "holiday_profile")

    exceptions = data.get("exceptions")
    if not isinstance(exceptions, list):
        _issue(issues, "invalid_format", "exceptions")
        exceptions = []
    if len(exceptions) > MAX_EXCEPTIONS:
        _issue(issues, "too_many_exceptions", "exceptions", max=MAX_EXCEPTIONS)
    for index, exception in enumerate(exceptions):
        path = f"exceptions.{index}"
        if not isinstance(exception, Mapping):
            _issue(issues, "invalid_format", path)
            continue
        start = _valid_date(exception.get("from"))
        end = _valid_date(exception.get("to"))
        if start is None:
            _issue(issues, "invalid_date", f"{path}.from")
        if end is None:
            _issue(issues, "invalid_date", f"{path}.to")
        if start is not None and end is not None and end < start:
            _issue(issues, "date_range_reversed", path)
        check_reference(exception.get("profile"), f"{path}.profile")
        note = exception.get("note", "")
        if not isinstance(note, str):
            _issue(issues, "invalid_format", f"{path}.note")
        elif len(note) > MAX_NOTE_LENGTH:
            _issue(issues, "note_too_long", f"{path}.note", max=MAX_NOTE_LENGTH)

    if "auto_cleanup" in data and not isinstance(data["auto_cleanup"], bool):
        _issue(issues, "invalid_format", "auto_cleanup")
    return issues


def profile_usages(data: Mapping[str, Any], profile_id: str) -> list[str]:
    """Return where a profile is referenced (for delete protection)."""
    week = data.get("week")
    usages = []
    if isinstance(week, Mapping):
        usages = [f"week.{day}" for day in WEEKDAYS if week.get(day) == profile_id]
    if data.get("holiday_profile") == profile_id:
        usages.append("holiday_profile")
    exceptions = data.get("exceptions")
    if isinstance(exceptions, list):
        usages.extend(
            f"exceptions.{index}"
            for index, exception in enumerate(exceptions)
            if isinstance(exception, Mapping) and exception.get("profile") == profile_id
        )
    return usages


def validate_update(
    old: Mapping[str, Any], new: Any, minimum: float, maximum: float
) -> list[ValidationIssue]:
    """Validate new schedule data, reporting deleted-but-used profiles clearly."""
    issues = validate_schedule(new, minimum, maximum)
    if not isinstance(new, Mapping) or not isinstance(new.get("profiles"), Mapping):
        return issues
    removed = [pid for pid in old.get("profiles", {}) if pid not in new["profiles"]]
    for profile_id in removed:
        usages = profile_usages(new, profile_id)
        if not usages:
            continue
        name = old["profiles"][profile_id].get("name", profile_id)
        issues = [
            issue
            for issue in issues
            if not (issue.code == "unknown_profile" and issue.path in usages)
        ]
        _issue(
            issues,
            "profile_in_use",
            f"profiles.{profile_id}",
            name=name,
            usages=usages,
        )
    return issues


def normalize_schedule(data: Mapping[str, Any]) -> dict[str, Any]:
    """Return a cleaned copy of validated editable schedule data."""
    exceptions = []
    for exception in data["exceptions"]:
        exceptions.append(
            {
                "id": exception.get("id") or new_exception_id(),
                "from": exception["from"],
                "to": exception["to"],
                "profile": exception["profile"],
                "note": exception.get("note", "").strip(),
            }
        )
    exceptions.sort(key=lambda item: (item["from"], item["to"]))
    return {
        "profiles": {
            profile_id: {
                "name": profile["name"].strip(),
                "color": profile["color"].lower(),
                "points": [
                    {"t": format_time(parse_time(p["t"])), "v": float(p["v"])}
                    for p in profile["points"]
                ],
            }
            for profile_id, profile in data["profiles"].items()
        },
        "week": {day: data["week"][day] for day in WEEKDAYS},
        "holiday_profile": data["holiday_profile"],
        "exceptions": exceptions,
        "auto_cleanup": bool(data.get("auto_cleanup", False)),
    }


@dataclass(slots=True, frozen=True)
class DayProfile:
    """The profile that applies to a date and why."""

    profile_id: str
    reason: str


def resolve_day(
    data: Mapping[str, Any],
    day: date,
    is_holiday: Callable[[date], bool],
) -> DayProfile:
    """Resolve the automatic profile of a day (without manual override).

    Priority: exception > holiday > weekday.
    """
    iso = day.isoformat()
    for exception in data.get("exceptions", []):
        if exception["from"] <= iso <= exception["to"]:
            return DayProfile(exception["profile"], REASON_EXCEPTION)
    if is_holiday(day):
        return DayProfile(data["holiday_profile"], REASON_HOLIDAY)
    return DayProfile(data["week"][WEEKDAYS[day.weekday()]], REASON_WEEKDAY)


def timeline_days(day: date, before: int = 2, after: int = 2) -> list[date]:
    """Return the dates that make up the timeline around ``day``."""
    return [day + timedelta(days=offset) for offset in range(-before, after + 1)]


def minute_of_day(hour: int, minute: int, second: float = 0.0) -> float:
    """Wall clock time as fractional minutes after midnight."""
    return min(float(MINUTES_PER_DAY), hour * 60 + minute + second / 60.0)
