/** Number formatting helpers. */

export function decimalsFor(step: number): number {
  if (!Number.isFinite(step) || step <= 0) {
    return 1;
  }
  const text = step.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

export function formatNumber(value: number, step: number, language: string): string {
  const decimals = decimalsFor(step);
  return new Intl.NumberFormat(language, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatValue(
  value: number,
  step: number,
  unit: string | null | undefined,
  language: string,
): string {
  const number = formatNumber(value, step, language);
  return unit ? `${number} ${unit}` : number;
}

/** Parse user input that may use a decimal comma. */
export function parseNumber(text: string): number {
  const cleaned = text.trim().replace(/\s/g, "").replace(",", ".");
  if (cleaned === "" || !/^-?\d*(\.\d*)?$/.test(cleaned)) {
    return Number.NaN;
  }
  return Number(cleaned);
}

/** Pick "nice" grid lines between min and max. */
export function niceTicks(min: number, max: number, target = 5): number[] {
  const span = max - min;
  if (span <= 0) {
    return [min];
  }
  const raw = span / target;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const candidates = [1, 2, 2.5, 5, 10].map((f) => f * magnitude);
  const step = candidates.find((c) => c >= raw) ?? candidates[candidates.length - 1];
  const ticks: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
  }
  return ticks;
}
