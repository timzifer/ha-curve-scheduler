/**
 * <curve-scheduler-curve>: SVG chart of one day with draggable points.
 *
 * Points are rendered as 44 px HTML handles on top of the SVG so they can be
 * dragged with touch in every direction (touch-action: none) while the rest of
 * the chart still lets the page scroll.
 */

import { LitElement, css, html, nothing, svg, type PropertyValues } from "lit";
import {
  Interpolator,
  MINUTES_PER_DAY,
  buildTimeline,
  clamp,
  formatTime,
  parseTime,
  roundToStep,
  type Mode,
  type Point,
} from "./interpolation";
import { MAX_POINTS, TIME_GRID_MINUTES, type SchedulePoint } from "./model";
import { formatValue, niceTicks } from "./format";

const PAD_LEFT = 44;
const PAD_RIGHT = 10;
const PAD_TOP = 14;
const PAD_BOTTOM = 26;
const CONTINUATION = 120; // minutes of the next day shown dashed
const TAP_TOLERANCE = 8; // px of movement that still counts as a tap
const HANDLE_SIZE = 44;

export interface PointsChangedDetail {
  points: SchedulePoint[];
  selected: number | null;
}

export interface CurveNoticeDetail {
  key: "point.full" | "point.taken";
  params: Record<string, unknown>;
}

interface DragState {
  index: number;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  points: SchedulePoint[];
}

export class CurveSchedulerCurve extends LitElement {
  static properties = {
    points: { attribute: false },
    context: { attribute: false },
    mode: {},
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    unit: {},
    language: {},
    color: {},
    snapMinutes: { type: Number, attribute: "snap-minutes" },
    editable: { type: Boolean, reflect: true },
    nowMinute: { attribute: false },
    nowValue: { attribute: false },
    selected: { attribute: false },
    height: { type: Number },
    showContinuation: { type: Boolean, attribute: "show-continuation" },
    _width: { state: true },
    _drag: { state: true },
  };

  /** Points of the day being shown/edited. */
  declare points: SchedulePoint[];
  /** Points of [day-2, day-1, day+1, day+2]; null repeats the edited day. */
  declare context: Point[][] | null;
  declare mode: Mode;
  declare min: number;
  declare max: number;
  declare step: number;
  declare unit: string | null;
  declare language: string;
  declare color: string;
  declare snapMinutes: number;
  declare editable: boolean;
  declare nowMinute: number | null;
  declare nowValue: number | null;
  declare selected: number | null;
  declare height: number;
  declare showContinuation: boolean;
  declare _width: number;
  declare _drag: DragState | null;

  private resizeObserver?: ResizeObserver;

  constructor() {
    super();
    this.points = [];
    this.context = null;
    this.mode = "curve";
    this.min = 20;
    this.max = 70;
    this.step = 0.5;
    this.unit = null;
    this.language = "en";
    this.color = "var(--primary-color, #03a9f4)";
    this.snapMinutes = 15;
    this.editable = false;
    this.nowMinute = null;
    this.nowValue = null;
    this.selected = null;
    this.height = 220;
    this.showContinuation = true;
    this._width = 320;
    this._drag = null;
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver((entries) => {
        const width = Math.round(entries[0]?.contentRect.width ?? 0);
        if (width > 0 && width !== this._width) {
          this._width = width;
        }
      });
      this.resizeObserver.observe(this);
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("points") && this._drag && !this.editable) {
      this._drag = null;
    }
  }

  // ------------------------------------------------------------------
  // Geometry

  private get domainEnd(): number {
    return this.showContinuation ? MINUTES_PER_DAY + CONTINUATION : MINUTES_PER_DAY;
  }

  private get plotWidth(): number {
    return Math.max(10, this._width - PAD_LEFT - PAD_RIGHT);
  }

  private get plotHeight(): number {
    return Math.max(10, this.height - PAD_TOP - PAD_BOTTOM);
  }

  xFor(minute: number): number {
    return PAD_LEFT + (minute / this.domainEnd) * this.plotWidth;
  }

  yFor(value: number): number {
    const span = this.max - this.min || 1;
    return PAD_TOP + (1 - (value - this.min) / span) * this.plotHeight;
  }

  minuteAt(x: number): number {
    return ((x - PAD_LEFT) / this.plotWidth) * this.domainEnd;
  }

  valueAt(y: number): number {
    const span = this.max - this.min || 1;
    return this.min + (1 - (y - PAD_TOP) / this.plotHeight) * span;
  }

  /** Points currently displayed (live while dragging). */
  get shownPoints(): SchedulePoint[] {
    return this._drag?.points ?? this.points;
  }

  private timeline(points: SchedulePoint[]): Point[] | null {
    if (points.length === 0) {
      return null;
    }
    const center: Point[] = points.map((p) => [parseTime(p.t), p.v]);
    const ctx = this.context;
    const days = ctx ? [ctx[0], ctx[1], center, ctx[2], ctx[3]] : [center, center, center, center, center];
    return buildTimeline(days);
  }

  /** Interpolated value of the shown curve at a minute. */
  curveValue(minute: number): number | null {
    const timeline = this.timeline(this.shownPoints);
    return timeline ? new Interpolator(timeline, this.mode).at(minute) : null;
  }

  // ------------------------------------------------------------------
  // Snapping and limits

  private snapTime(minute: number): number {
    const grid = Math.max(TIME_GRID_MINUTES, this.snapMinutes || TIME_GRID_MINUTES);
    return Math.round(minute / grid) * grid;
  }

  private snapValue(value: number): number {
    return clamp(roundToStep(clamp(value, this.min, this.max), this.step), this.min, this.max);
  }

  /** Time limits for point ``index`` so it cannot pass its neighbours. */
  private timeLimits(points: SchedulePoint[], index: number): [number, number] {
    const low = index > 0 ? parseTime(points[index - 1].t) + TIME_GRID_MINUTES : 0;
    const high =
      index < points.length - 1
        ? parseTime(points[index + 1].t) - TIME_GRID_MINUTES
        : MINUTES_PER_DAY - TIME_GRID_MINUTES;
    return [low, high];
  }

  /** Move point ``index`` to (minute, value) honouring snapping and neighbours. */
  movePoint(
    points: SchedulePoint[],
    index: number,
    minute: number,
    value: number,
  ): SchedulePoint[] {
    const [low, high] = this.timeLimits(points, index);
    const t = clamp(this.snapTime(minute), low, high);
    // Clamp may land between grid steps when neighbours are close: keep 5 min grid.
    const gridT = clamp(Math.round(t / TIME_GRID_MINUTES) * TIME_GRID_MINUTES, low, high);
    const next = points.map((p) => ({ ...p }));
    next[index] = { t: formatTime(gridT), v: this.snapValue(value) };
    return next;
  }

  // ------------------------------------------------------------------
  // Events

  private emitChange(points: SchedulePoint[], selected: number | null): void {
    this.dispatchEvent(
      new CustomEvent<PointsChangedDetail>("points-changed", {
        detail: { points, selected },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitSelect(index: number | null): void {
    this.dispatchEvent(
      new CustomEvent<{ index: number | null }>("point-selected", {
        detail: { index },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private emitNotice(detail: CurveNoticeDetail): void {
    this.dispatchEvent(
      new CustomEvent<CurveNoticeDetail>("curve-notice", { detail, bubbles: true, composed: true }),
    );
  }

  private localPosition(event: PointerEvent | MouseEvent): { x: number; y: number } {
    const rect = this.renderRoot.querySelector(".chart")?.getBoundingClientRect();
    return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
  }

  /** Add a point at a chart position (used for taps on the chart). */
  addPointAt(x: number): void {
    if (!this.editable) {
      return;
    }
    const minute = this.snapTime(this.minuteAt(x));
    if (minute < 0 || minute >= MINUTES_PER_DAY) {
      return;
    }
    const existing = this.points.findIndex((p) => parseTime(p.t) === minute);
    if (existing >= 0) {
      this.emitSelect(existing);
      this.emitNotice({ key: "point.taken", params: { time: formatTime(minute) } });
      return;
    }
    if (this.points.length >= MAX_POINTS) {
      this.emitNotice({ key: "point.full", params: { max: MAX_POINTS } });
      return;
    }
    const curve = this.curveValue(minute);
    const value = this.snapValue(curve ?? (this.min + this.max) / 2);
    const points = this.points.map((p) => ({ ...p }));
    let index = points.findIndex((p) => parseTime(p.t) > minute);
    if (index < 0) {
      index = points.length;
    }
    points.splice(index, 0, { t: formatTime(minute), v: value });
    this.emitChange(points, index);
  }

  private onChartPointerDown(event: PointerEvent): void {
    if (!this.editable || event.button > 0) {
      return;
    }
    const { x, y } = this.localPosition(event);
    this.tapStart = { x, y, pointerId: event.pointerId };
  }

  private tapStart: { x: number; y: number; pointerId: number } | null = null;

  private onChartPointerUp(event: PointerEvent): void {
    const start = this.tapStart;
    this.tapStart = null;
    if (!start || start.pointerId !== event.pointerId || this._drag) {
      return;
    }
    const { x, y } = this.localPosition(event);
    if (Math.hypot(x - start.x, y - start.y) > TAP_TOLERANCE) {
      return;
    }
    this.addPointAt(x);
  }

  private onChartPointerCancel(): void {
    this.tapStart = null;
  }

  private onHandlePointerDown(event: PointerEvent, index: number): void {
    if (!this.editable) {
      return;
    }
    event.stopPropagation();
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture?.(event.pointerId);
    target.focus?.({ preventScroll: true });
    const { x, y } = this.localPosition(event);
    this._drag = {
      index,
      pointerId: event.pointerId,
      startX: x,
      startY: y,
      moved: false,
      points: this.points.map((p) => ({ ...p })),
    };
    this.emitSelect(index);
  }

  private onHandlePointerMove(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    const { x, y } = this.localPosition(event);
    if (!drag.moved && Math.hypot(x - drag.startX, y - drag.startY) < 3) {
      return;
    }
    const points = this.movePoint(this.points, drag.index, this.minuteAt(x), this.valueAt(y));
    this._drag = { ...drag, moved: true, points };
  }

  private onHandlePointerUp(event: PointerEvent): void {
    const drag = this._drag;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }
    this._drag = null;
    const changed = drag.points.some(
      (p, i) => p.t !== this.points[i].t || p.v !== this.points[i].v,
    );
    if (drag.moved && changed) {
      this.emitChange(drag.points, drag.index);
    }
  }

  private onHandlePointerCancel(): void {
    this._drag = null;
  }

  private onHandleKeyDown(event: KeyboardEvent, index: number): void {
    if (!this.editable) {
      return;
    }
    const point = this.points[index];
    let minute = parseTime(point.t);
    let value = point.v;
    const grid = Math.max(TIME_GRID_MINUTES, this.snapMinutes);
    switch (event.key) {
      case "ArrowLeft":
        minute -= grid;
        break;
      case "ArrowRight":
        minute += grid;
        break;
      case "ArrowUp":
        value += this.step;
        break;
      case "ArrowDown":
        value -= this.step;
        break;
      default:
        return;
    }
    event.preventDefault();
    this.emitChange(this.movePoint(this.points, index, minute, value), index);
  }

  // ------------------------------------------------------------------
  // Rendering

  private curvePath(points: SchedulePoint[], from: number, to: number): string {
    const timeline = this.timeline(points);
    if (!timeline) {
      return "";
    }
    const interpolator = new Interpolator(timeline, this.mode);
    const samples = Math.max(24, Math.round(this.plotWidth / 2));
    const stepMinutes = (to - from) / samples;
    const parts: string[] = [];
    let previous: number | null = null;
    for (let i = 0; i <= samples; i++) {
      const minute = from + i * stepMinutes;
      const value = clamp(interpolator.at(minute), this.min, this.max);
      const x = this.xFor(minute).toFixed(1);
      const y = this.yFor(value).toFixed(1);
      if (this.mode === "step" && previous !== null && value !== previous) {
        parts.push(`L${x},${this.yFor(previous).toFixed(1)}`);
      }
      parts.push(`${i === 0 ? "M" : "L"}${x},${y}`);
      previous = value;
    }
    return parts.join("");
  }

  private renderGrid() {
    const ticks = niceTicks(this.min, this.max, this.height < 180 ? 3 : 5);
    const narrow = this._width < 420;
    const hours = narrow ? [0, 6, 12, 18, 24] : [0, 3, 6, 9, 12, 15, 18, 21, 24];
    const bottom = PAD_TOP + this.plotHeight;
    return svg`
      ${ticks.map(
        (tick) => svg`
          <line class="grid" x1=${PAD_LEFT} x2=${this.xFor(this.domainEnd)}
            y1=${this.yFor(tick)} y2=${this.yFor(tick)}></line>
          <text class="label y" x=${PAD_LEFT - 6} y=${this.yFor(tick) + 4}>${formatValue(
            tick,
            0.1,
            null,
            this.language,
          )}</text>`,
      )}
      ${hours.map(
        (hour) => svg`
          <line class="grid" x1=${this.xFor(hour * 60)} x2=${this.xFor(hour * 60)}
            y1=${PAD_TOP} y2=${bottom}></line>
          <text class="label x" x=${this.xFor(hour * 60)} y=${bottom + 17}>${hour}</text>`,
      )}
      ${
        this.showContinuation
          ? svg`<rect class="next-day" x=${this.xFor(MINUTES_PER_DAY)} y=${PAD_TOP}
              width=${this.xFor(this.domainEnd) - this.xFor(MINUTES_PER_DAY)}
              height=${this.plotHeight}></rect>
              <text class="label x" x=${this.xFor(MINUTES_PER_DAY + CONTINUATION / 2)}
                y=${PAD_TOP + 12}>+1</text>`
          : nothing
      }
    `;
  }

  private renderNow() {
    if (this.nowMinute === null) {
      return nothing;
    }
    const x = this.xFor(this.nowMinute);
    return svg`
      <line class="now" x1=${x} x2=${x} y1=${PAD_TOP} y2=${PAD_TOP + this.plotHeight}></line>
      ${
        this.nowValue !== null
          ? svg`<circle class="now-dot" cx=${x} cy=${this.yFor(clamp(this.nowValue, this.min, this.max))} r="6"></circle>`
          : nothing
      }
    `;
  }

  private renderHandles(points: SchedulePoint[]) {
    const drag = this._drag;
    return points.map((point, index) => {
      const minute = parseTime(point.t);
      const x = this.xFor(minute);
      const y = this.yFor(clamp(point.v, this.min, this.max));
      const selected = index === this.selected;
      const label = `${point.t} · ${formatValue(point.v, this.step, this.unit, this.language)}`;
      return html`
        <div
          class="handle ${selected ? "selected" : ""} ${drag?.index === index ? "dragging" : ""}"
          style="transform: translate(${x - HANDLE_SIZE / 2}px, ${y - HANDLE_SIZE / 2}px)"
          role="slider"
          tabindex=${this.editable ? 0 : -1}
          aria-label=${label}
          aria-valuemin=${this.min}
          aria-valuemax=${this.max}
          aria-valuenow=${point.v}
          aria-valuetext=${label}
          data-index=${index}
          @pointerdown=${(e: PointerEvent) => this.onHandlePointerDown(e, index)}
          @pointermove=${(e: PointerEvent) => this.onHandlePointerMove(e)}
          @pointerup=${(e: PointerEvent) => this.onHandlePointerUp(e)}
          @pointercancel=${() => this.onHandlePointerCancel()}
          @lostpointercapture=${(e: PointerEvent) => this.onHandlePointerUp(e)}
          @keydown=${(e: KeyboardEvent) => this.onHandleKeyDown(e, index)}
          @click=${(e: Event) => {
            e.stopPropagation();
            this.emitSelect(index);
          }}
        >
          <span class="dot" style="border-color: ${this.color}"></span>
        </div>
      `;
    });
  }

  private renderTooltip() {
    const drag = this._drag;
    if (!drag?.moved) {
      return nothing;
    }
    const point = drag.points[drag.index];
    const x = clamp(this.xFor(parseTime(point.t)), 50, this._width - 50);
    const y = this.yFor(point.v);
    const above = y > 48;
    return html`<div
      class="tooltip"
      style="left: ${x}px; top: ${above ? y - 40 : y + 26}px"
      role="status"
    >
      ${point.t} · ${formatValue(point.v, this.step, this.unit, this.language)}
    </div>`;
  }

  protected render() {
    const points = this.shownPoints;
    const solid = this.curvePath(points, 0, MINUTES_PER_DAY);
    const dashed = this.showContinuation
      ? this.curvePath(points, MINUTES_PER_DAY, this.domainEnd)
      : "";
    return html`
      <div
        class="chart"
        style="height: ${this.height}px"
        @pointerdown=${this.onChartPointerDown}
        @pointerup=${this.onChartPointerUp}
        @pointercancel=${this.onChartPointerCancel}
      >
        <svg
          width=${this._width}
          height=${this.height}
          viewBox="0 0 ${this._width} ${this.height}"
          role="img"
          aria-hidden="true"
        >
          ${this.renderGrid()}
          <path class="curve" d=${solid} style="stroke: ${this.color}"></path>
          ${dashed
            ? svg`<path class="curve continuation" d=${dashed} style="stroke: ${this.color}"></path>`
            : nothing}
          ${this.renderNow()}
          ${this.editable
            ? nothing
            : points.map(
                (p) =>
                  svg`<circle class="marker" cx=${this.xFor(parseTime(p.t))}
                    cy=${this.yFor(clamp(p.v, this.min, this.max))} r="3"
                    style="fill: ${this.color}"></circle>`,
              )}
        </svg>
        ${this.editable ? this.renderHandles(points) : nothing} ${this.renderTooltip()}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
      position: relative;
      user-select: none;
      -webkit-user-select: none;
    }
    .chart {
      position: relative;
      width: 100%;
      overflow: hidden;
      touch-action: pan-y;
    }
    svg {
      position: absolute;
      inset: 0;
      display: block;
    }
    .grid {
      stroke: var(--divider-color, rgba(127, 127, 127, 0.25));
      stroke-width: 1;
    }
    .label {
      fill: var(--secondary-text-color, #727272);
      font-size: 11px;
      font-family: inherit;
    }
    .label.y {
      text-anchor: end;
    }
    .label.x {
      text-anchor: middle;
    }
    .next-day {
      fill: var(--secondary-text-color, #727272);
      opacity: 0.08;
    }
    .curve {
      fill: none;
      stroke-width: 3;
      stroke-linejoin: round;
      stroke-linecap: round;
    }
    .curve.continuation {
      stroke-dasharray: 6 6;
      opacity: 0.6;
    }
    .now {
      stroke: var(--error-color, #db4437);
      stroke-width: 2;
      stroke-dasharray: 3 3;
    }
    .now-dot {
      fill: var(--error-color, #db4437);
      stroke: var(--card-background-color, #fff);
      stroke-width: 2;
    }
    .handle {
      position: absolute;
      left: 0;
      top: 0;
      width: ${HANDLE_SIZE}px;
      height: ${HANDLE_SIZE}px;
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      cursor: grab;
      border-radius: 50%;
      outline: none;
      -webkit-tap-highlight-color: transparent;
    }
    .handle.dragging {
      cursor: grabbing;
      z-index: 2;
    }
    .dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      border: 3px solid;
      box-sizing: border-box;
      transition: transform 0.1s;
    }
    .handle.selected .dot,
    .handle:focus-visible .dot {
      transform: scale(1.5);
      box-shadow: 0 0 0 4px rgba(127, 127, 127, 0.3);
    }
    .handle.dragging .dot {
      transform: scale(1.7);
    }
    .tooltip {
      position: absolute;
      transform: translateX(-50%);
      background: var(--primary-text-color, #212121);
      color: var(--card-background-color, #fff);
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      pointer-events: none;
      z-index: 3;
    }
  `;
}

if (!customElements.get("curve-scheduler-curve")) {
  customElements.define("curve-scheduler-curve", CurveSchedulerCurve);
}

declare global {
  interface HTMLElementTagNameMap {
    "curve-scheduler-curve": CurveSchedulerCurve;
  }
}
