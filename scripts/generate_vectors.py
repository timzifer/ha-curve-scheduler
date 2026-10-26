"""Generate the shared interpolation test vectors.

Run from the repository root:  python scripts/generate_vectors.py

The expected values are produced by the Python implementation. The Python
and TypeScript test suites both compare their results against this file,
which proves that the two implementations agree.
"""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "custom_components" / "zeitprofil" / "interpolation.py"
TARGET = ROOT / "tests" / "vectors" / "interpolation.json"

# Load the module directly so Home Assistant does not need to be installed.
spec = importlib.util.spec_from_file_location("zp_interpolation", SOURCE)
assert spec and spec.loader
interpolation = importlib.util.module_from_spec(spec)
sys.modules["zp_interpolation"] = interpolation
spec.loader.exec_module(interpolation)

WORKDAY = [
    ["05:00", 45],
    ["05:30", 60],
    ["08:30", 60],
    ["09:00", 50],
    ["17:00", 50],
    ["17:30", 60],
    ["22:00", 60],
    ["22:30", 45],
]
DAY_OFF = [["07:00", 45], ["07:30", 60], ["22:00", 60], ["23:00", 40]]
SINGLE_LOW = [["12:00", 40]]
SINGLE_HIGH = [["06:00", 65]]
EDGES = [["00:00", 30], ["00:05", 70], ["12:00", 55], ["23:55", 20]]
UNEVEN = [
    ["01:00", 20],
    ["01:15", 22],
    ["06:00", 68],
    ["06:05", 70],
    ["13:40", 35],
    ["14:00", 35],
    ["19:00", 50],
    ["19:10", 49.5],
]

CASES = {
    "constant_single_point": [SINGLE_LOW] * 5,
    "workday_only": [WORKDAY] * 5,
    "workday_to_weekend": [WORKDAY, WORKDAY, WORKDAY, DAY_OFF, DAY_OFF],
    "weekend_to_workday": [DAY_OFF, DAY_OFF, DAY_OFF, WORKDAY, WORKDAY],
    "single_point_neighbours": [SINGLE_HIGH, SINGLE_LOW, WORKDAY, SINGLE_HIGH, SINGLE_LOW],
    "single_point_centre": [WORKDAY, DAY_OFF, SINGLE_HIGH, WORKDAY, DAY_OFF],
    "edges_of_day": [EDGES, EDGES, EDGES, UNEVEN, EDGES],
    "uneven_spacing": [UNEVEN, WORKDAY, UNEVEN, UNEVEN, DAY_OFF],
}

SAMPLES = sorted(
    {float(m) for m in range(0, 1441, 5)}
    | {0.5, 1.25, 299.9, 301.7, 1079.33, 1339.99, 1439.5, 1439.999}
)


def to_points(raw):
    return [[interpolation.parse_time(t), v] for t, v in raw]


def main() -> None:
    cases = []
    for name, days in CASES.items():
        point_days = [to_points(day) for day in days]
        timeline = interpolation.build_timeline(point_days)
        expected = {
            mode: [interpolation.interpolate(timeline, x, mode) for x in SAMPLES]
            for mode in interpolation.MODES
        }
        cases.append({"name": name, "days": point_days, "expected": expected})
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(
        json.dumps({"tolerance": 1e-6, "samples": SAMPLES, "cases": cases}, indent=1) + "\n",
        encoding="utf-8",
    )
    print(f"wrote {TARGET.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
