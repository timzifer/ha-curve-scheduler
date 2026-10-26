"""Tests for validation and day resolution."""

from __future__ import annotations

import copy
from datetime import date

import pytest

from custom_components.curve_scheduler.model import (
    DayProfile,
    default_schedule,
    normalize_schedule,
    profile_usages,
    resolve_day,
    validate_schedule,
    validate_update,
)


@pytest.fixture
def schedule() -> dict:
    return default_schedule(20, 70, 0.5, "de")


def codes(issues) -> list[str]:
    return [issue.code for issue in issues]


def test_default_schedule_is_valid(schedule: dict) -> None:
    assert validate_schedule(schedule, 20, 70) == []
    assert schedule["profiles"]["workday"]["name"] == "Werktag"
    assert default_schedule(20, 70, 0.5, "en")["profiles"]["day_off"]["name"] == "Day off"


def test_default_values_follow_range() -> None:
    data = default_schedule(0, 10, 1, "en")
    values = {p["v"] for p in data["profiles"]["workday"]["points"]}
    assert values == {5.0, 8.0}


@pytest.mark.parametrize(
    ("points", "code"),
    [
        ([], "too_few_points"),
        (
            [{"t": f"{h:02d}:{m:02d}", "v": 40} for h in range(24) for m in (0, 30)]
            + [{"t": "23:55", "v": 40}],
            "too_many_points",
        ),
        ([{"t": "05:03", "v": 40}], "time_not_on_grid"),
        ([{"t": "24:00", "v": 40}], "invalid_time"),
        ([{"t": "05:00", "v": 40}, {"t": "05:00", "v": 41}], "duplicate_time"),
        ([{"t": "06:00", "v": 40}, {"t": "05:00", "v": 41}], "times_not_sorted"),
        ([{"t": "05:00", "v": 80}], "value_out_of_range"),
        ([{"t": "05:00", "v": "warm"}], "invalid_value"),
        ([{"t": "05:00", "v": True}], "invalid_value"),
        ("nope", "invalid_format"),
    ],
)
def test_point_validation(schedule: dict, points, code: str) -> None:
    schedule["profiles"]["workday"]["points"] = points
    assert code in codes(validate_schedule(schedule, 20, 70))


def test_48_points_are_allowed(schedule: dict) -> None:
    schedule["profiles"]["workday"]["points"] = [
        {"t": f"{h:02d}:{m:02d}", "v": 40} for h in range(24) for m in (0, 30)
    ]
    assert validate_schedule(schedule, 20, 70) == []


def test_profile_validation(schedule: dict) -> None:
    schedule["profiles"]["day_off"]["name"] = "werktag"
    schedule["profiles"]["workday"]["color"] = "red"
    schedule["profiles"]["Bad Id"] = copy.deepcopy(schedule["profiles"]["day_off"])
    schedule["profiles"]["Bad Id"]["name"] = "Automatik"
    schedule["week"]["sat"] = "missing"
    result = codes(validate_schedule(schedule, 20, 70))
    assert "duplicate_name" in result
    assert "invalid_color" in result
    assert "invalid_profile_id" in result
    assert "unknown_profile" in result


def test_reserved_and_empty_names(schedule: dict) -> None:
    schedule["profiles"]["day_off"]["name"] = "Auto"
    schedule["profiles"]["workday"]["name"] = "  "
    result = codes(validate_schedule(schedule, 20, 70))
    assert "reserved_name" in result
    assert "empty_name" in result


def test_exception_validation(schedule: dict) -> None:
    schedule["exceptions"] = [
        {"from": "2026-12-24", "to": "2026-12-20", "profile": "day_off"},
        {"from": "2026-13-01", "to": "2026-12-31", "profile": "day_off"},
        {"from": "2026-12-01", "to": "2026-12-02", "profile": "vacation"},
    ]
    result = codes(validate_schedule(schedule, 20, 70))
    assert result.count("date_range_reversed") == 1
    assert "invalid_date" in result
    assert "unknown_profile" in result


def test_deleting_used_profile_is_reported_clearly(schedule: dict) -> None:
    new = copy.deepcopy(schedule)
    del new["profiles"]["day_off"]
    issues = validate_update(schedule, new, 20, 70)
    assert codes(issues) == ["profile_in_use"]
    assert issues[0].params["name"] == "Frei"
    assert "week.sat" in issues[0].params["usages"]
    assert "holiday_profile" in issues[0].params["usages"]


def test_deleting_unused_profile(schedule: dict) -> None:
    schedule["profiles"]["vacation"] = {
        "name": "Urlaub",
        "color": "#2980b9",
        "points": [{"t": "00:00", "v": 30}],
    }
    new = copy.deepcopy(schedule)
    del new["profiles"]["vacation"]
    assert validate_update(schedule, new, 20, 70) == []
    assert profile_usages(schedule, "vacation") == []


def test_normalize_assigns_ids_and_sorts(schedule: dict) -> None:
    schedule["exceptions"] = [
        {"from": "2027-01-02", "to": "2027-01-03", "profile": "day_off", "note": " B "},
        {"from": "2026-12-24", "to": "2026-12-26", "profile": "day_off"},
    ]
    result = normalize_schedule(schedule)
    assert [e["from"] for e in result["exceptions"]] == ["2026-12-24", "2027-01-02"]
    assert all(e["id"] for e in result["exceptions"])
    assert result["exceptions"][1]["note"] == "B"


def test_priority(schedule: dict) -> None:
    schedule["profiles"]["vacation"] = {
        "name": "Urlaub",
        "color": "#2980b9",
        "points": [{"t": "00:00", "v": 30}],
    }
    schedule["exceptions"] = [{"from": "2026-12-24", "to": "2027-01-06", "profile": "vacation"}]
    holidays = {date(2026, 12, 25), date(2026, 11, 1)}

    def is_holiday(day: date) -> bool:
        return day in holidays

    # Thursday -> weekday profile
    assert resolve_day(schedule, date(2026, 10, 29), is_holiday) == DayProfile("workday", "weekday")
    # Saturday -> weekend
    assert resolve_day(schedule, date(2026, 10, 31), is_holiday).profile_id == "day_off"
    # Holiday on a Sunday
    assert resolve_day(schedule, date(2026, 11, 1), is_holiday).reason == "holiday"
    # Exception beats holiday
    assert resolve_day(schedule, date(2026, 12, 25), is_holiday) == DayProfile(
        "vacation", "exception"
    )
    # Inclusive end
    assert resolve_day(schedule, date(2027, 1, 6), is_holiday).profile_id == "vacation"
    assert resolve_day(schedule, date(2027, 1, 7), is_holiday).profile_id == "workday"
