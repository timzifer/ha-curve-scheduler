"""Tests for the interpolation core (shared vectors and properties)."""

from __future__ import annotations

import itertools
import json
from pathlib import Path
import random

import pytest

from custom_components.zeitprofil.interpolation import (
    MODES,
    build_timeline,
    clamp,
    evaluate_day,
    format_time,
    interpolate,
    next_point,
    parse_time,
    round_to_step,
)

VECTORS = json.loads(
    (Path(__file__).parent / "vectors" / "interpolation.json").read_text(encoding="utf-8")
)

WORKDAY = [(300, 45), (330, 60), (510, 60), (540, 50), (1020, 50), (1050, 60), (1320, 60)]
WEEKEND = [(420, 40), (450, 60), (1320, 60), (1380, 40)]


@pytest.mark.parametrize("case", VECTORS["cases"], ids=lambda c: c["name"])
def test_shared_vectors(case: dict) -> None:
    """Python results must match the shared vectors (also used by the card)."""
    timeline = build_timeline(case["days"])
    tolerance = VECTORS["tolerance"]
    for mode in MODES:
        for x, expected in zip(VECTORS["samples"], case["expected"][mode], strict=True):
            assert interpolate(timeline, x, mode) == pytest.approx(expected, abs=tolerance)


@pytest.mark.parametrize("mode", MODES)
def test_passes_through_points(mode: str) -> None:
    timeline = build_timeline([WORKDAY] * 5)
    for x, y in WORKDAY:
        assert interpolate(timeline, x, mode) == pytest.approx(y)


def test_step_holds_previous_value() -> None:
    timeline = build_timeline([WORKDAY] * 5)
    assert interpolate(timeline, 329.9, "stufe") == 45
    assert interpolate(timeline, 330, "stufe") == 60
    # Before the first point of the day the last value of the previous day applies.
    assert interpolate(timeline, 100, "stufe") == 60


def test_linear_and_smooth_midpoints() -> None:
    timeline = build_timeline([WORKDAY] * 5)
    assert interpolate(timeline, 315, "linear") == pytest.approx(52.5)
    assert interpolate(timeline, 315, "weich") == pytest.approx(52.5)
    # Smoothstep starts slower than linear.
    assert interpolate(timeline, 303, "weich") < interpolate(timeline, 303, "linear")


@pytest.mark.parametrize("mode", MODES)
def test_single_point_is_constant(mode: str) -> None:
    timeline = build_timeline([[(720, 55)]] * 5)
    for x in (0, 300, 720, 1000, 1440):
        assert interpolate(timeline, x, mode) == pytest.approx(55)


def test_curve_does_not_overshoot() -> None:
    timeline = build_timeline([WORKDAY] * 5)
    points = sorted(timeline)
    for (x0, y0), (x1, y1) in itertools.pairwise(points):
        low, high = min(y0, y1), max(y0, y1)
        for i in range(1, 50):
            value = interpolate(timeline, x0 + (x1 - x0) * i / 50, "kurve")
            assert low - 1e-9 <= value <= high + 1e-9


def test_curve_is_smooth_at_points() -> None:
    """The first derivative is continuous at the points (no kinks)."""
    timeline = build_timeline([WORKDAY, WORKDAY, WORKDAY, WEEKEND, WEEKEND])
    eps = 1e-4
    for x, _ in WORKDAY + [(p[0] + 1440, p[1]) for p in WEEKEND[:1]]:
        left = (interpolate(timeline, x, "kurve") - interpolate(timeline, x - eps, "kurve")) / eps
        right = (interpolate(timeline, x + eps, "kurve") - interpolate(timeline, x, "kurve")) / eps
        assert left == pytest.approx(right, abs=1e-3)


@pytest.mark.parametrize("mode", ["linear", "weich", "kurve"])
def test_no_jump_at_midnight_between_profiles(mode: str) -> None:
    """Friday 24:00 equals Saturday 00:00 although the profiles differ."""
    rng = random.Random(42)
    profiles = [WORKDAY, WEEKEND, [(720, 65)], [(0, 30), (1435, 70)]]
    for _ in range(200):
        week = [rng.choice(profiles) for _ in range(6)]
        today = build_timeline(week[0:5])
        tomorrow = build_timeline(week[1:6])
        assert interpolate(today, 1440, mode) == pytest.approx(
            interpolate(tomorrow, 0, mode), abs=1e-9
        )


def test_step_mode_switches_at_first_point_of_next_day() -> None:
    today = build_timeline([WORKDAY, WORKDAY, WORKDAY, WEEKEND, WEEKEND])
    # Until Saturday's first point the last Friday value stays.
    assert interpolate(today, 1440, "stufe") == 60


def test_evaluate_day_and_helpers() -> None:
    curve = evaluate_day([WORKDAY] * 5, "linear", 60)
    assert len(curve) == 25
    assert curve[0][0] == 0 and curve[-1][0] == 1440
    assert parse_time("05:30") == 330
    assert format_time(330) == "05:30"
    assert next_point(build_timeline([WORKDAY] * 5), 330) == (510.0, 60.0)
    assert round_to_step(57.26, 0.5) == 57.5
    assert round_to_step(57.24, 0.5) == 57.0
    assert round_to_step(57.25, 0.5) == 57.5
    assert clamp(80, 20, 70) == 70


def test_invalid_input() -> None:
    with pytest.raises(ValueError):
        build_timeline([WORKDAY] * 3)
    with pytest.raises(ValueError):
        interpolate([], 1, "linear")
    with pytest.raises(ValueError):
        interpolate(build_timeline([WORKDAY] * 5), 1, "spline")
