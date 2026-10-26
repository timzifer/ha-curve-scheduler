"""Interpolation of daily profiles.

This module is intentionally free of Home Assistant imports. It is mirrored
one-to-one in ``frontend/src/interpolation.ts``; both implementations are
checked against the shared vectors in ``tests/vectors/interpolation.json``.
Keep the order of floating point operations identical in both files.

A *timeline* is built from the point lists of five consecutive days
(day-2 .. day+2) so that interpolation around midnight takes the previous and
following day into account. Since every profile has at least one point, five
days always provide enough neighbours for the curve tangents of the centre day.
"""

from __future__ import annotations

from collections.abc import Sequence
import math

MINUTES_PER_DAY = 1440

# Number of days before/after the evaluated day that are part of a timeline.
TIMELINE_DAYS_BEFORE = 2
TIMELINE_DAYS_AFTER = 2
TIMELINE_LENGTH = TIMELINE_DAYS_BEFORE + 1 + TIMELINE_DAYS_AFTER

MODES = ("step", "linear", "smooth", "curve")

Point = tuple[float, float]


def parse_time(value: str) -> int:
    """Convert ``HH:MM`` into minutes after midnight."""
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


def format_time(minutes: int) -> str:
    """Convert minutes after midnight into ``HH:MM``."""
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def build_timeline(days: Sequence[Sequence[Point]]) -> list[Point]:
    """Combine the points of five days into one timeline.

    ``days[2]`` is the evaluated day; its points keep their x values (minutes
    after midnight). Points of the other days are shifted by multiples of
    1440 minutes.
    """
    if len(days) != TIMELINE_LENGTH:
        raise ValueError(f"expected {TIMELINE_LENGTH} days, got {len(days)}")
    timeline: list[Point] = []
    for index, points in enumerate(days):
        offset = (index - TIMELINE_DAYS_BEFORE) * MINUTES_PER_DAY
        timeline.extend((float(x) + offset, float(y)) for x, y in points)
    return timeline


def pchip_tangents(xs: Sequence[float], ys: Sequence[float]) -> list[float]:
    """Monotone tangents after Fritsch-Carlson (as used by PCHIP).

    Interior tangents are the weighted harmonic mean of the neighbouring
    secants, or zero at local extrema / flat sections. This prevents
    overshooting and only depends on direct neighbours, which keeps the curve
    identical no matter how far the timeline extends.
    """
    count = len(xs)
    if count < 2:
        return [0.0] * count
    widths = [xs[i + 1] - xs[i] for i in range(count - 1)]
    secants = [(ys[i + 1] - ys[i]) / widths[i] for i in range(count - 1)]
    tangents = [0.0] * count
    tangents[0] = secants[0]
    tangents[count - 1] = secants[count - 2]
    for i in range(1, count - 1):
        before = secants[i - 1]
        after = secants[i]
        if before == 0.0 or after == 0.0 or (before < 0.0) != (after < 0.0):
            tangents[i] = 0.0
            continue
        weight_1 = 2.0 * widths[i] + widths[i - 1]
        weight_2 = widths[i] + 2.0 * widths[i - 1]
        tangents[i] = (weight_1 + weight_2) / (weight_1 / before + weight_2 / after)
    return tangents


def _segment_index(xs: Sequence[float], x: float) -> int:
    """Return index i such that xs[i] <= x < xs[i + 1] (clamped)."""
    low = 0
    high = len(xs) - 1
    if x < xs[0]:
        return -1
    if x >= xs[high]:
        return high
    while high - low > 1:
        middle = (low + high) // 2
        if xs[middle] <= x:
            low = middle
        else:
            high = middle
    return low


def interpolate(timeline: Sequence[Point], x: float, mode: str) -> float:
    """Evaluate the timeline at position ``x`` (minutes) with ``mode``."""
    if not timeline:
        raise ValueError("timeline is empty")
    if mode not in MODES:
        raise ValueError(f"unknown mode {mode}")
    xs = [point[0] for point in timeline]
    ys = [point[1] for point in timeline]
    index = _segment_index(xs, x)
    if index < 0:
        return ys[0]
    if index >= len(xs) - 1:
        return ys[-1]
    x0 = xs[index]
    x1 = xs[index + 1]
    y0 = ys[index]
    y1 = ys[index + 1]
    if mode == "step":
        return y0
    width = x1 - x0
    s = (x - x0) / width
    if mode == "linear":
        return y0 + (y1 - y0) * s
    if mode == "smooth":
        return y0 + (y1 - y0) * (s * s * (3.0 - 2.0 * s))
    tangents = pchip_tangents(xs, ys)
    s2 = s * s
    s3 = s2 * s
    h00 = 2.0 * s3 - 3.0 * s2 + 1.0
    h10 = s3 - 2.0 * s2 + s
    h01 = -2.0 * s3 + 3.0 * s2
    h11 = s3 - s2
    return h00 * y0 + h10 * width * tangents[index] + h01 * y1 + h11 * width * tangents[index + 1]


def evaluate_day(days: Sequence[Sequence[Point]], mode: str, step_minutes: int = 5) -> list[Point]:
    """Sample the centre day from 00:00 to 24:00 (inclusive)."""
    timeline = build_timeline(days)
    return [
        (float(minute), interpolate(timeline, float(minute), mode))
        for minute in range(0, MINUTES_PER_DAY + 1, step_minutes)
    ]


def next_point(timeline: Sequence[Point], x: float) -> Point | None:
    """Return the first timeline point strictly after ``x``."""
    for point in timeline:
        if point[0] > x:
            return point
    return None


def round_to_step(value: float, step: float) -> float:
    """Round ``value`` to the nearest multiple of ``step`` (half up)."""
    if step <= 0:
        return value
    return round(math.floor(value / step + 0.5) * step, 6)


def clamp(value: float, minimum: float, maximum: float) -> float:
    """Clamp ``value`` into ``[minimum, maximum]``."""
    return max(minimum, min(maximum, value))
