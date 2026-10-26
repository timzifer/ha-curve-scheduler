import { describe, expect, it } from "vitest";
import {
  MODES,
  Interpolator,
  buildTimeline,
  formatTime,
  interpolate,
  nextPoint,
  parseTime,
  roundToStep,
  type Point,
} from "../src/interpolation";
import rawVectors from "../../tests/vectors/interpolation.json";

interface VectorCase {
  name: string;
  days: Point[][];
  expected: Record<string, number[]>;
}

const vectors = rawVectors as unknown as {
  tolerance: number;
  samples: number[];
  cases: VectorCase[];
};

describe("shared vectors (same file as the Python tests)", () => {
  for (const testCase of vectors.cases) {
    for (const mode of MODES) {
      it(`${testCase.name} / ${mode}`, () => {
        const interpolator = new Interpolator(buildTimeline(testCase.days), mode);
        vectors.samples.forEach((x, i) => {
          expect(Math.abs(interpolator.at(x) - testCase.expected[mode][i])).toBeLessThanOrEqual(
            vectors.tolerance,
          );
        });
      });
    }
  }

  it("covers all cases", () => {
    expect(vectors.cases.length).toBeGreaterThanOrEqual(8);
  });
});

describe("interpolation", () => {
  const workday: Point[] = [
    [300, 45],
    [330, 60],
    [1320, 60],
  ];

  it("passes through every point in every mode", () => {
    const timeline = buildTimeline([workday, workday, workday, workday, workday]);
    for (const mode of MODES) {
      for (const [x, y] of workday) {
        expect(interpolate(timeline, x, mode)).toBeCloseTo(y, 9);
      }
    }
  });

  it("has no jump at midnight between different profiles", () => {
    const weekend: Point[] = [
      [420, 40],
      [450, 60],
    ];
    const fri = buildTimeline([workday, workday, workday, weekend, weekend]);
    const sat = buildTimeline([workday, workday, weekend, weekend, workday]);
    for (const mode of ["linear", "smooth", "curve"] as const) {
      expect(interpolate(fri, 1440, mode)).toBeCloseTo(interpolate(sat, 0, mode), 9);
    }
  });

  it("helpers", () => {
    expect(parseTime("05:30")).toBe(330);
    expect(formatTime(330)).toBe("05:30");
    expect(roundToStep(57.25, 0.5)).toBe(57.5);
    expect(roundToStep(57.24, 0.5)).toBe(57);
    expect(nextPoint(buildTimeline([workday, workday, workday, workday, workday]), 330)).toEqual([
      1320, 60,
    ]);
    expect(() => buildTimeline([workday])).toThrow();
  });
});
