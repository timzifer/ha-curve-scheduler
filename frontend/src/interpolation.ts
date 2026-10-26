/**
 * Interpolation of daily profiles.
 *
 * Mirror of custom_components/curve_scheduler/interpolation.py. Both
 * implementations are tested against tests/vectors/interpolation.json.
 * Keep the order of floating point operations identical to the Python file.
 */

export const MINUTES_PER_DAY = 1440;
export const TIMELINE_DAYS_BEFORE = 2;
export const TIMELINE_DAYS_AFTER = 2;
export const TIMELINE_LENGTH = TIMELINE_DAYS_BEFORE + 1 + TIMELINE_DAYS_AFTER;

export const MODES = ["step", "linear", "smooth", "curve"] as const;
export type Mode = (typeof MODES)[number];

/** A point as [minutes, value]. */
export type Point = readonly [number, number];

export function parseTime(value: string): number {
  const [hours, minutes] = value.split(":");
  return Number(hours) * 60 + Number(minutes);
}

export function formatTime(minutes: number): string {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Combine the points of five days (day-2 .. day+2) into one timeline. */
export function buildTimeline(days: readonly (readonly Point[])[]): Point[] {
  if (days.length !== TIMELINE_LENGTH) {
    throw new Error(`expected ${TIMELINE_LENGTH} days, got ${days.length}`);
  }
  const timeline: Point[] = [];
  days.forEach((points, index) => {
    const offset = (index - TIMELINE_DAYS_BEFORE) * MINUTES_PER_DAY;
    for (const [x, y] of points) {
      timeline.push([x + offset, y]);
    }
  });
  return timeline;
}

/** Monotone tangents after Fritsch-Carlson (as used by PCHIP). */
export function pchipTangents(xs: readonly number[], ys: readonly number[]): number[] {
  const count = xs.length;
  if (count < 2) {
    return new Array<number>(count).fill(0);
  }
  const widths: number[] = [];
  const secants: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    widths.push(xs[i + 1] - xs[i]);
    secants.push((ys[i + 1] - ys[i]) / widths[i]);
  }
  const tangents = new Array<number>(count).fill(0);
  tangents[0] = secants[0];
  tangents[count - 1] = secants[count - 2];
  for (let i = 1; i < count - 1; i++) {
    const before = secants[i - 1];
    const after = secants[i];
    if (before === 0 || after === 0 || before < 0 !== after < 0) {
      tangents[i] = 0;
      continue;
    }
    const weight1 = 2.0 * widths[i] + widths[i - 1];
    const weight2 = widths[i] + 2.0 * widths[i - 1];
    tangents[i] = (weight1 + weight2) / (weight1 / before + weight2 / after);
  }
  return tangents;
}

function segmentIndex(xs: readonly number[], x: number): number {
  let low = 0;
  let high = xs.length - 1;
  if (x < xs[0]) {
    return -1;
  }
  if (x >= xs[high]) {
    return high;
  }
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (xs[middle] <= x) {
      low = middle;
    } else {
      high = middle;
    }
  }
  return low;
}

/** Interpolator that precomputes tangents once for many evaluations. */
export class Interpolator {
  private readonly xs: number[];
  private readonly ys: number[];
  private readonly tangents: number[];

  constructor(
    timeline: readonly Point[],
    private readonly mode: Mode,
  ) {
    if (timeline.length === 0) {
      throw new Error("timeline is empty");
    }
    if (!MODES.includes(mode)) {
      throw new Error(`unknown mode ${String(mode)}`);
    }
    this.xs = timeline.map((p) => p[0]);
    this.ys = timeline.map((p) => p[1]);
    this.tangents = mode === "curve" ? pchipTangents(this.xs, this.ys) : [];
  }

  at(x: number): number {
    const { xs, ys } = this;
    const index = segmentIndex(xs, x);
    if (index < 0) {
      return ys[0];
    }
    if (index >= xs.length - 1) {
      return ys[ys.length - 1];
    }
    const x0 = xs[index];
    const x1 = xs[index + 1];
    const y0 = ys[index];
    const y1 = ys[index + 1];
    if (this.mode === "step") {
      return y0;
    }
    const width = x1 - x0;
    const s = (x - x0) / width;
    if (this.mode === "linear") {
      return y0 + (y1 - y0) * s;
    }
    if (this.mode === "smooth") {
      return y0 + (y1 - y0) * (s * s * (3.0 - 2.0 * s));
    }
    const s2 = s * s;
    const s3 = s2 * s;
    const h00 = 2.0 * s3 - 3.0 * s2 + 1.0;
    const h10 = s3 - 2.0 * s2 + s;
    const h01 = -2.0 * s3 + 3.0 * s2;
    const h11 = s3 - s2;
    return (
      h00 * y0 +
      h10 * width * this.tangents[index] +
      h01 * y1 +
      h11 * width * this.tangents[index + 1]
    );
  }
}

export function interpolate(timeline: readonly Point[], x: number, mode: Mode): number {
  return new Interpolator(timeline, mode).at(x);
}

/** First timeline point strictly after x. */
export function nextPoint(timeline: readonly Point[], x: number): Point | undefined {
  return timeline.find((p) => p[0] > x);
}

/** Round to the nearest multiple of step (half up), like the backend. */
export function roundToStep(value: number, step: number): number {
  if (step <= 0) {
    return value;
  }
  return Math.round(Math.floor(value / step + 0.5) * step * 1e6) / 1e6;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
