/**
 * <zeitprofil-editor>: edit daily plans, weekly plan and exceptions.
 *
 * All changes go to a local draft with undo/redo. Nothing is sent to Home
 * Assistant before "Save".
 */

import { LitElement, css, html, nothing, type PropertyValues, type TemplateResult } from "lit";
import { fetchHolidays, saveSchedule, type HomeAssistant } from "./api";
import { formatNumber, formatValue, parseNumber } from "./format";
import { isTranslationKey, translator, type Translate, type TranslationKey } from "./i18n";
import { clamp, formatTime, parseTime, roundToStep } from "./interpolation";
import {
  MAX_NOTE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_POINTS,
  MAX_PROFILES,
  PROFILE_COLORS,
  TIME_GRID_MINUTES,
  WEEKDAYS,
  addDays,
  clone,
  insertPoint,
  isoDate,
  newProfileId,
  nextColor,
  parseIsoDate,
  profileUsages,
  resolveDay,
  suggestFreeTime,
  validateSchedule,
  type InstanceData,
  type Profile,
  type Schedule,
  type SchedulePoint,
  type ValidationIssue,
  type Weekday,
} from "./model";
import { sharedStyles } from "./styles";
import "./curve";
import type { CurveNoticeDetail, PointsChangedDetail } from "./curve";

type Tab = "profiles" | "week" | "exceptions";
type Message = { kind: "success" | "error" | "warning" | "info"; text: string };

const TEMPERATURE_UNITS = ["°C", "°F", "K", "C", "F"];
const SNAP_OPTIONS = [5, 15, 30, 60];
const HISTORY_LIMIT = 100;

export class ZeitprofilEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    data: { attribute: false },
    language: {},
    _draft: { state: true },
    _base: { state: true },
    _baseRevision: { state: true },
    _undo: { state: true },
    _redo: { state: true },
    _tab: { state: true },
    _profileId: { state: true },
    _selected: { state: true },
    _snap: { state: true },
    _issues: { state: true },
    _message: { state: true },
    _saving: { state: true },
    _conflict: { state: true },
    _month: { state: true },
    _holidays: { state: true },
  };

  declare hass: HomeAssistant;
  declare data: InstanceData;
  declare language: string;
  declare _draft: Schedule;
  declare _base: Schedule;
  declare _baseRevision: number;
  declare _undo: Schedule[];
  declare _redo: Schedule[];
  declare _tab: Tab;
  declare _profileId: string;
  declare _selected: number | null;
  declare _snap: number;
  declare _issues: ValidationIssue[];
  declare _message: Message | null;
  declare _saving: boolean;
  declare _conflict: boolean;
  declare _month: string; // YYYY-MM-01
  declare _holidays: Record<string, Set<string>>;

  private t: Translate = translator("en");
  private messageTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this.language = "en";
    this._undo = [];
    this._redo = [];
    this._tab = "profiles";
    this._profileId = "";
    this._selected = null;
    this._snap = 15;
    this._issues = [];
    this._message = null;
    this._saving = false;
    this._conflict = false;
    this._month = "";
    this._holidays = {};
  }

  // ------------------------------------------------------------------
  // Lifecycle

  private readonly onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (this.dirty) {
      event.preventDefault();
      event.returnValue = "";
    }
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("beforeunload", this.onBeforeUnload);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("beforeunload", this.onBeforeUnload);
    clearTimeout(this.messageTimer);
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("language")) {
      this.t = translator(this.language);
    }
    if (changed.has("data") && this.data && !this._saving) {
      if (!this._draft) {
        this.resetTo(this.data);
      } else if (this.data.revision !== this._baseRevision) {
        if (this.dirty) {
          this._conflict = true;
        } else {
          this.resetTo(this.data);
        }
      }
    }
    if (!this._month) {
      this._month = `${isoDate(new Date()).slice(0, 8)}01`;
    }
  }

  protected updated(changed: PropertyValues<this>): void {
    if ((changed.has("_tab") || changed.has("_month")) && this._tab === "week") {
      void this.loadHolidays(this._month);
    }
    if (changed.has("_draft") || changed.has("_base")) {
      this.dispatchEvent(
        new CustomEvent("dirty-changed", {
          detail: { dirty: this.dirty },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private resetTo(data: InstanceData): void {
    this._base = clone(data.schedule);
    this._draft = clone(data.schedule);
    this._baseRevision = data.revision;
    this._undo = [];
    this._redo = [];
    this._issues = [];
    this._conflict = false;
    if (!(this._profileId in this._draft.profiles)) {
      this._profileId = Object.keys(this._draft.profiles)[0] ?? "";
      this._selected = null;
    }
    const points = this._draft.profiles[this._profileId]?.points ?? [];
    if (this._selected !== null && this._selected >= points.length) {
      this._selected = null;
    }
  }

  // ------------------------------------------------------------------
  // Draft handling

  get dirty(): boolean {
    return (
      this._draft !== undefined && JSON.stringify(this._draft) !== JSON.stringify(this._base)
    );
  }

  /** Apply a change to a copy of the draft and record it for undo. */
  private change(mutate: (draft: Schedule) => void): void {
    const next = clone(this._draft);
    mutate(next);
    if (JSON.stringify(next) === JSON.stringify(this._draft)) {
      return;
    }
    this._undo = [...this._undo, this._draft].slice(-HISTORY_LIMIT);
    this._redo = [];
    this._draft = next;
    this._issues = [];
  }

  undo(): void {
    const previous = this._undo[this._undo.length - 1];
    if (!previous) {
      return;
    }
    this._redo = [...this._redo, this._draft];
    this._undo = this._undo.slice(0, -1);
    this._draft = previous;
    this.fixSelection();
  }

  redo(): void {
    const next = this._redo[this._redo.length - 1];
    if (!next) {
      return;
    }
    this._undo = [...this._undo, this._draft];
    this._redo = this._redo.slice(0, -1);
    this._draft = next;
    this.fixSelection();
  }

  discard(ask = true): void {
    if (ask && this.dirty && !window.confirm(this.t("editor.confirm_discard"))) {
      return;
    }
    this.resetTo(this.data);
    this._draft = clone(this._base);
  }

  private fixSelection(): void {
    if (!(this._profileId in this._draft.profiles)) {
      this._profileId = Object.keys(this._draft.profiles)[0] ?? "";
      this._selected = null;
    }
    const count = this._draft.profiles[this._profileId]?.points.length ?? 0;
    if (this._selected !== null && this._selected >= count) {
      this._selected = null;
    }
  }

  /** Ask before leaving with unsaved changes. Returns true if leaving is ok. */
  confirmLeave(): boolean {
    if (!this.dirty) {
      return true;
    }
    if (window.confirm(this.t("editor.confirm_leave"))) {
      this.discard(false);
      return true;
    }
    return false;
  }

  private showMessage(message: Message, timeout = 4000): void {
    this._message = message;
    clearTimeout(this.messageTimer);
    if (timeout > 0) {
      this.messageTimer = setTimeout(() => (this._message = null), timeout);
    }
  }

  async save(): Promise<void> {
    const issues = validateSchedule(this._draft, this.data.config.min, this.data.config.max);
    if (issues.length) {
      this._issues = issues;
      this.showMessage({ kind: "error", text: this.t("editor.fix_errors") }, 0);
      return;
    }
    this._saving = true;
    try {
      const result = await saveSchedule(
        this.hass,
        this.data.entry_id,
        this._baseRevision,
        this._draft,
      );
      if (result.ok) {
        this._base = clone(this._draft);
        this._baseRevision = result.revision;
        this._undo = [];
        this._redo = [];
        this._issues = [];
        this._conflict = false;
        this.showMessage({ kind: "success", text: this.t("editor.saved") });
      } else if (result.conflict) {
        this._conflict = true;
      } else {
        this._issues = result.errors;
        this.showMessage({ kind: "error", text: this.t("editor.fix_errors") }, 0);
      }
    } catch (err) {
      this.showMessage(
        {
          kind: "error",
          text: this.t("card.connection_error", { message: (err as Error).message ?? err }),
        },
        0,
      );
    } finally {
      this._saving = false;
    }
  }

  private reloadAfterConflict(): void {
    this.resetTo(this.data);
    this._message = null;
  }

  // ------------------------------------------------------------------
  // Helpers

  private get config() {
    return this.data.config;
  }

  private get profile(): Profile | undefined {
    return this._draft.profiles[this._profileId];
  }

  private valueLabel(): string {
    return TEMPERATURE_UNITS.includes(this.config.unit ?? "")
      ? this.t("point.value")
      : this.t("point.value_generic");
  }

  private fmt(value: number): string {
    return formatValue(value, this.config.step, this.config.unit, this.language);
  }

  private normalizeValue(value: number): number {
    const { min, max, step } = this.config;
    return clamp(roundToStep(clamp(value, min, max), step), min, max);
  }

  private describeIssue(issue: ValidationIssue): string {
    const key = `error.${issue.code}`;
    const params: Record<string, unknown> = { ...issue.params };
    if (typeof params.value === "number") {
      params.value = this.fmt(params.value);
    }
    if (typeof params.min === "number" && issue.code === "value_out_of_range") {
      params.min = this.fmt(params.min);
      params.max = this.fmt(params.max as number);
    }
    if (Array.isArray(params.usages)) {
      params.usages = this.describeUsages(params.usages as string[]);
    }
    const text = isTranslationKey(key)
      ? this.t(key, params)
      : this.t("error.unknown", { code: issue.code });
    const match = /^profiles\.([^.]+)/.exec(issue.path);
    const profile = match ? this._draft.profiles[match[1]] : undefined;
    if (profile && issue.code !== "profile_in_use") {
      return `${profile.name}: ${text}`;
    }
    return text;
  }

  private describeUsages(usages: string[]): string {
    return usages
      .map((usage) => {
        if (usage.startsWith("week.")) {
          return this.t(`week.day.${usage.slice(5)}` as TranslationKey);
        }
        if (usage === "holiday_profile") {
          return this.t("usage.holiday_profile");
        }
        const index = Number(usage.split(".")[1]);
        const exception = this._draft.exceptions[index];
        return exception?.note || this.t("usage.exception", { number: index + 1 });
      })
      .join(", ");
  }

  private issuesFor(prefix: string): ValidationIssue[] {
    return this._issues.filter((i) => i.path === prefix || i.path.startsWith(`${prefix}.`));
  }

  // ------------------------------------------------------------------
  // Profile actions

  private selectProfile(id: string): void {
    this._profileId = id;
    this._selected = null;
  }

  private addProfile(): void {
    if (Object.keys(this._draft.profiles).length >= MAX_PROFILES) {
      return;
    }
    let name = this.t("profiles.new_name");
    const names = new Set(Object.values(this._draft.profiles).map((p) => p.name.toLowerCase()));
    for (let i = 2; names.has(name.toLowerCase()); i++) {
      name = `${this.t("profiles.new_name")} ${i}`;
    }
    const id = newProfileId(this._draft, name);
    const middle = this.normalizeValue((this.config.min + this.config.max) / 2);
    this.change((draft) => {
      draft.profiles[id] = {
        name,
        color: nextColor(draft),
        points: [{ t: "06:00", v: middle }],
      };
    });
    this.selectProfile(id);
  }

  private duplicateProfile(): void {
    const source = this.profile;
    if (!source || Object.keys(this._draft.profiles).length >= MAX_PROFILES) {
      return;
    }
    let name = `${source.name} ${this.t("profiles.copy_suffix")}`.slice(0, MAX_NAME_LENGTH);
    const names = new Set(Object.values(this._draft.profiles).map((p) => p.name.toLowerCase()));
    for (let i = 2; names.has(name.toLowerCase()); i++) {
      name = `${source.name} ${i}`.slice(0, MAX_NAME_LENGTH);
    }
    const id = newProfileId(this._draft, name);
    this.change((draft) => {
      draft.profiles[id] = { ...clone(source), name, color: nextColor(draft) };
    });
    this.selectProfile(id);
  }

  private deleteProfile(): void {
    const profile = this.profile;
    if (!profile) {
      return;
    }
    if (Object.keys(this._draft.profiles).length <= 1) {
      this.showMessage({ kind: "warning", text: this.t("profiles.last") });
      return;
    }
    const usages = profileUsages(this._draft, this._profileId);
    if (usages.length) {
      this.showMessage(
        {
          kind: "warning",
          text: this.t("profiles.in_use", {
            name: profile.name,
            usages: this.describeUsages(usages),
          }),
        },
        8000,
      );
      return;
    }
    if (!window.confirm(this.t("profiles.confirm_delete", { name: profile.name }))) {
      return;
    }
    const id = this._profileId;
    this.change((draft) => {
      delete draft.profiles[id];
    });
    this.selectProfile(Object.keys(this._draft.profiles)[0]);
  }

  private renameProfile(name: string): void {
    const id = this._profileId;
    this.change((draft) => {
      draft.profiles[id].name = name.slice(0, MAX_NAME_LENGTH);
    });
  }

  private recolorProfile(color: string): void {
    const id = this._profileId;
    this.change((draft) => {
      draft.profiles[id].color = color;
    });
  }

  private copyCurveFrom(sourceId: string): void {
    const source = this._draft.profiles[sourceId];
    const target = this.profile;
    if (!source || !target || sourceId === this._profileId) {
      return;
    }
    if (
      !window.confirm(
        this.t("profiles.confirm_copy", { target: target.name, source: source.name }),
      )
    ) {
      return;
    }
    const id = this._profileId;
    this.change((draft) => {
      draft.profiles[id].points = clone(source.points);
    });
    this._selected = null;
  }

  // ------------------------------------------------------------------
  // Point actions (shared by chart and table)

  private setPoints(points: SchedulePoint[], selected: number | null): void {
    const id = this._profileId;
    this.change((draft) => {
      draft.profiles[id].points = points;
    });
    this._selected = selected;
  }

  addPoint(): void {
    const profile = this.profile;
    if (!profile) {
      return;
    }
    if (profile.points.length >= MAX_POINTS) {
      this.showMessage({ kind: "warning", text: this.t("point.full", { max: MAX_POINTS }) });
      return;
    }
    const minute = suggestFreeTime(profile.points);
    if (minute === undefined) {
      return;
    }
    const curve = this.renderRoot.querySelector("zeitprofil-curve");
    const value = this.normalizeValue(
      curve?.curveValue(minute) ?? (this.config.min + this.config.max) / 2,
    );
    const points = clone(profile.points);
    const index = insertPoint(points, { t: formatTime(minute), v: value });
    this.setPoints(points, index);
  }

  deletePoint(index: number): void {
    const profile = this.profile;
    if (!profile) {
      return;
    }
    if (profile.points.length <= 1) {
      this.showMessage({ kind: "warning", text: this.t("point.min") });
      return;
    }
    const points = clone(profile.points);
    points.splice(index, 1);
    this.setPoints(points, null);
  }

  setPointTime(index: number, text: string): void {
    const profile = this.profile;
    if (!profile || !/^\d{1,2}:\d{2}/.test(text)) {
      this.requestUpdate();
      return;
    }
    let minute = parseTime(text.slice(0, 5));
    minute = Math.round(minute / TIME_GRID_MINUTES) * TIME_GRID_MINUTES;
    if (minute >= 1440) {
      minute = 1440 - TIME_GRID_MINUTES;
    }
    const time = formatTime(minute);
    if (profile.points.some((p, i) => i !== index && p.t === time)) {
      this.showMessage({ kind: "warning", text: this.t("point.taken", { time }) });
      this.requestUpdate();
      return;
    }
    const points = clone(profile.points);
    const [point] = points.splice(index, 1);
    const newIndex = insertPoint(points, { ...point, t: time });
    this.setPoints(points, newIndex);
  }

  setPointValue(index: number, value: number): void {
    const profile = this.profile;
    if (!profile || Number.isNaN(value)) {
      this.requestUpdate();
      return;
    }
    const points = clone(profile.points);
    points[index] = { ...points[index], v: this.normalizeValue(value) };
    this.setPoints(points, index);
  }

  private nudgePoint(index: number, direction: 1 | -1): void {
    const point = this.profile?.points[index];
    if (point) {
      this.setPointValue(index, point.v + direction * this.config.step);
    }
  }

  // ------------------------------------------------------------------
  // Week and exceptions

  private setWeekday(day: Weekday, profileId: string): void {
    this.change((draft) => {
      draft.week[day] = profileId;
    });
  }

  private setHolidayProfile(profileId: string): void {
    this.change((draft) => {
      draft.holiday_profile = profileId;
    });
  }

  private today(): string {
    return this.data.state.now.slice(0, 10);
  }

  private addException(): void {
    const today = this.today();
    const profile =
      Object.keys(this._draft.profiles).find((id) => /urlaub|holiday|vacation/i.test(id)) ??
      this._draft.holiday_profile;
    this.change((draft) => {
      draft.exceptions.push({
        from: today,
        to: addDays(today, 6),
        profile,
        note: this.t("holiday.note_default"),
      });
    });
  }

  private updateException(index: number, field: "from" | "to" | "profile" | "note", value: string) {
    this.change((draft) => {
      const exception = draft.exceptions[index];
      exception[field] = field === "note" ? value.slice(0, MAX_NOTE_LENGTH) : value;
      if (field === "from" && exception.to < value) {
        exception.to = value;
      }
    });
  }

  private deleteException(index: number): void {
    this.change((draft) => {
      draft.exceptions.splice(index, 1);
    });
  }

  private removePastExceptions(): void {
    const today = this.today();
    this.change((draft) => {
      draft.exceptions = draft.exceptions.filter((e) => e.to >= today);
    });
  }

  private async loadHolidays(month: string): Promise<void> {
    if (!this.config.holiday_source || this._holidays[month] || !this.hass) {
      return;
    }
    const start = month;
    const date = parseIsoDate(month);
    const end = isoDate(new Date(date.getFullYear(), date.getMonth() + 1, 0, 12));
    try {
      const result = await fetchHolidays(this.hass, this.data.entry_id, start, end);
      this._holidays = { ...this._holidays, [month]: new Set(result.holidays) };
    } catch {
      this._holidays = { ...this._holidays, [month]: new Set() };
    }
  }

  private shiftMonth(delta: number): void {
    const date = parseIsoDate(this._month);
    this._month = isoDate(new Date(date.getFullYear(), date.getMonth() + delta, 1, 12));
  }

  // ------------------------------------------------------------------
  // Rendering

  private profileOptions(selected: string): TemplateResult[] {
    return Object.entries(this._draft.profiles).map(
      ([id, profile]) =>
        html`<option value=${id} ?selected=${id === selected}>${profile.name}</option>`,
    );
  }

  private renderTabs() {
    const tabs: [Tab, TranslationKey][] = [
      ["profiles", "editor.tab.profiles"],
      ["week", "editor.tab.week"],
      ["exceptions", "editor.tab.exceptions"],
    ];
    return html`<div class="tabs" role="tablist">
      ${tabs.map(
        ([tab, key]) =>
          html`<button
            role="tab"
            class="tab ${this._tab === tab ? "active" : ""}"
            aria-selected=${this._tab === tab}
            @click=${() => (this._tab = tab)}
          >
            ${this.t(key)}
          </button>`,
      )}
    </div>`;
  }

  private renderProfileChips() {
    return html`<div class="chips" role="tablist">
      ${Object.entries(this._draft.profiles).map(
        ([id, profile]) =>
          html`<button
            class="chip ${id === this._profileId ? "active" : ""}"
            role="tab"
            aria-selected=${id === this._profileId}
            style="--chip-color: ${profile.color}"
            @click=${() => this.selectProfile(id)}
          >
            <span class="swatch" style="background: ${profile.color}"></span>${profile.name ||
            "…"}
          </button>`,
      )}
      <button
        class="chip add"
        ?disabled=${Object.keys(this._draft.profiles).length >= MAX_PROFILES}
        @click=${() => this.addProfile()}
      >
        + ${this.t("profiles.add")}
      </button>
    </div>`;
  }

  private renderProfileSettings(profile: Profile) {
    return html`<div class="profile-settings">
      <label class="field grow">
        ${this.t("profiles.name")}
        <input
          type="text"
          .value=${profile.name}
          maxlength=${MAX_NAME_LENGTH}
          @change=${(e: Event) => this.renameProfile((e.target as HTMLInputElement).value)}
        />
      </label>
      <div class="field">
        <span class="muted">${this.t("profiles.color")}</span>
        <div class="colors" role="radiogroup" aria-label=${this.t("profiles.color")}>
          ${PROFILE_COLORS.map(
            (color) =>
              html`<button
                class="color ${profile.color.toLowerCase() === color ? "active" : ""}"
                role="radio"
                aria-checked=${profile.color.toLowerCase() === color}
                aria-label=${color}
                style="background: ${color}"
                @click=${() => this.recolorProfile(color)}
              ></button>`,
          )}
        </div>
      </div>
      <div class="row">
        <button @click=${() => this.duplicateProfile()}>${this.t("profiles.duplicate")}</button>
        <button class="danger" @click=${() => this.deleteProfile()}>
          ${this.t("profiles.delete")}
        </button>
      </div>
    </div>`;
  }

  private renderSelectedPoint(profile: Profile) {
    const index = this._selected;
    if (index === null || !profile.points[index]) {
      return nothing;
    }
    const point = profile.points[index];
    return html`<div class="selected-point" aria-live="polite">
      <div class="muted">${this.t("point.selected")}</div>
      <div class="row">
        <label class="field">
          ${this.t("point.time")}
          <input
            type="time"
            step="300"
            .value=${point.t}
            @change=${(e: Event) =>
              this.setPointTime(index, (e.target as HTMLInputElement).value)}
          />
        </label>
        ${this.renderValueInput(index, point)}
        <button class="danger" @click=${() => this.deletePoint(index)}>
          ${this.t("point.delete")}
        </button>
      </div>
    </div>`;
  }

  private renderPlainValueInput(index: number, point: SchedulePoint) {
    return html`<input
      class="value"
      type="text"
      inputmode="decimal"
      aria-label=${this.valueLabel()}
      .value=${formatNumber(point.v, this.config.step, this.language)}
      @change=${(e: Event) =>
        this.setPointValue(index, parseNumber((e.target as HTMLInputElement).value))}
    />`;
  }

  private renderValueInput(index: number, point: SchedulePoint, withLabel = true) {
    const input = html`<div class="stepper">
      <button
        class="icon"
        aria-label=${this.t("point.minus")}
        @click=${() => this.nudgePoint(index, -1)}
      >
        −
      </button>
      <input
        class="value"
        type="text"
        inputmode="decimal"
        aria-label=${this.valueLabel()}
        .value=${formatNumber(point.v, this.config.step, this.language)}
        @change=${(e: Event) =>
          this.setPointValue(index, parseNumber((e.target as HTMLInputElement).value))}
      />
      <button
        class="icon"
        aria-label=${this.t("point.plus")}
        @click=${() => this.nudgePoint(index, 1)}
      >
        +
      </button>
    </div>`;
    return withLabel
      ? html`<div class="field">
          <span class="muted">${this.valueLabel()}${this.config.unit ? ` (${this.config.unit})` : ""}</span>
          ${input}
        </div>`
      : input;
  }

  private renderPointTable(profile: Profile) {
    return html`<table class="points">
        <caption class="muted">
          ${this.t("point.table")}
        </caption>
        <thead>
          <tr>
            <th>${this.t("point.time")}</th>
            <th>${this.valueLabel()}${this.config.unit ? ` (${this.config.unit})` : ""}</th>
            <th><span class="sr-only">${this.t("point.delete")}</span></th>
          </tr>
        </thead>
        <tbody>
          ${profile.points.map(
            (point, index) =>
              html`<tr
                class=${index === this._selected ? "selected" : ""}
                data-index=${index}
                @focusin=${() => (this._selected = index)}
              >
                <td>
                  <input
                    type="time"
                    step="300"
                    aria-label=${this.t("point.time")}
                    .value=${point.t}
                    @change=${(e: Event) =>
                      this.setPointTime(index, (e.target as HTMLInputElement).value)}
                  />
                </td>
                <td>${this.renderPlainValueInput(index, point)}</td>
                <td>
                  <button
                    class="icon flat delete"
                    aria-label=${this.t("point.delete")}
                    title=${this.t("point.delete")}
                    ?disabled=${profile.points.length <= 1}
                    @click=${() => this.deletePoint(index)}
                  >
                    🗑
                  </button>
                </td>
              </tr>`,
          )}
        </tbody>
      </table>
      <button
        class="add-point"
        ?disabled=${profile.points.length >= MAX_POINTS}
        @click=${() => this.addPoint()}
      >
        ${this.t("point.add")}
      </button>`;
  }

  private renderProfilesTab() {
    const profile = this.profile;
    if (!profile) {
      return this.renderProfileChips();
    }
    const others = Object.entries(this._draft.profiles).filter(([id]) => id !== this._profileId);
    const issues = this.issuesFor(`profiles.${this._profileId}`);
    return html`
      ${this.renderProfileChips()} ${this.renderProfileSettings(profile)}
      ${issues.length
        ? html`<div class="notice error">
            ${issues.map((i) => html`<div>${this.describeIssue(i)}</div>`)}
          </div>`
        : nothing}
      <div class="chart-wrapper">
        <zeitprofil-curve
          editable
          .points=${profile.points}
          .context=${null}
          .mode=${this.config.interpolation}
          .min=${this.config.min}
          .max=${this.config.max}
          .step=${this.config.step}
          .unit=${this.config.unit}
          .language=${this.language}
          .color=${profile.color}
          .snapMinutes=${this._snap}
          .selected=${this._selected}
          @points-changed=${(e: CustomEvent<PointsChangedDetail>) =>
            this.setPoints(e.detail.points, e.detail.selected)}
          @point-selected=${(e: CustomEvent<{ index: number | null }>) =>
            (this._selected = e.detail.index)}
          @curve-notice=${(e: CustomEvent<CurveNoticeDetail>) =>
            this.showMessage({ kind: "warning", text: this.t(e.detail.key, e.detail.params) })}
        ></zeitprofil-curve>
      </div>
      <div class="row chart-footer">
        <span class="muted grow">${this.t("profiles.hint")}</span>
        <label class="field inline">
          ${this.t("profiles.snap")}
          <select
            @change=${(e: Event) => (this._snap = Number((e.target as HTMLSelectElement).value))}
          >
            ${SNAP_OPTIONS.map(
              (minutes) =>
                html`<option value=${minutes} ?selected=${minutes === this._snap}>
                  ${this.t("profiles.snap_minutes", { minutes })}
                </option>`,
            )}
          </select>
        </label>
      </div>
      ${this.renderSelectedPoint(profile)} ${this.renderPointTable(profile)}
      ${others.length
        ? html`<div class="row copy">
            <label class="field grow">
              ${this.t("profiles.copy_from")}
              <select id="copy-source">
                ${others.map(([id, p]) => html`<option value=${id}>${p.name}</option>`)}
              </select>
            </label>
            <button
              class="copy-button"
              @click=${() =>
                this.copyCurveFrom(
                  (this.renderRoot.querySelector("#copy-source") as HTMLSelectElement).value,
                )}
            >
              ${this.t("profiles.copy")}
            </button>
          </div>`
        : nothing}
    `;
  }

  private renderWeekTab() {
    const draft = this._draft;
    return html`
      <h3>${this.t("week.title")}</h3>
      <div class="week">
        ${WEEKDAYS.map((day) => {
          const color = draft.profiles[draft.week[day]]?.color ?? "transparent";
          return html`<label class="week-row" style="--row-color: ${color}">
            <span class="day">${this.t(`week.day.${day}` as TranslationKey)}</span>
            <select
              data-day=${day}
              @change=${(e: Event) =>
                this.setWeekday(day, (e.target as HTMLSelectElement).value)}
            >
              ${this.profileOptions(draft.week[day])}
            </select>
          </label>`;
        })}
        <label
          class="week-row holiday"
          style="--row-color: ${draft.profiles[draft.holiday_profile]?.color ?? "transparent"}"
        >
          <span class="day">${this.t("week.holiday")}</span>
          <select
            @change=${(e: Event) =>
              this.setHolidayProfile((e.target as HTMLSelectElement).value)}
          >
            ${this.profileOptions(draft.holiday_profile)}
          </select>
        </label>
        ${this.config.holiday_source
          ? nothing
          : html`<div class="muted">${this.t("week.no_holiday_source")}</div>`}
      </div>
      ${this.renderMonth()}
    `;
  }

  private renderMonth() {
    const first = parseIsoDate(this._month);
    const year = first.getFullYear();
    const month = first.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const holidays = this._holidays[this._month] ?? new Set<string>();
    const today = this.today();
    const monthName = new Intl.DateTimeFormat(this.language, {
      month: "long",
      year: "numeric",
    }).format(first);
    const weekdayNames = WEEKDAYS.map((_, i) =>
      new Intl.DateTimeFormat(this.language, { weekday: "short" }).format(
        new Date(2024, 0, 1 + i, 12),
      ),
    );
    const cells: TemplateResult[] = [];
    for (let i = 0; i < leading; i++) {
      cells.push(html`<div class="cell empty"></div>`);
    }
    for (let d = 1; d <= days; d++) {
      const iso = isoDate(new Date(year, month, d, 12));
      const resolved = resolveDay(this._draft, iso, (day) => holidays.has(day));
      const profile = this._draft.profiles[resolved.profileId];
      const mark = resolved.reason === "holiday" ? "★" : resolved.reason === "exception" ? "✈" : "";
      cells.push(
        html`<div
          class="cell ${iso === today ? "today" : ""}"
          style="--cell-color: ${profile?.color ?? "transparent"}"
          title="${iso}: ${profile?.name ?? ""}"
        >
          <span class="num">${d}</span><span class="mark">${mark}</span>
        </div>`,
      );
    }
    return html`<div class="month">
      <div class="month-header">
        <button
          class="icon"
          aria-label=${this.t("week.prev_month")}
          @click=${() => this.shiftMonth(-1)}
        >
          ‹
        </button>
        <strong>${this.t("week.preview")}: ${monthName}</strong>
        <button
          class="icon"
          aria-label=${this.t("week.next_month")}
          @click=${() => this.shiftMonth(1)}
        >
          ›
        </button>
      </div>
      <div class="calendar">
        ${weekdayNames.map((name) => html`<div class="cell head">${name}</div>`)} ${cells}
      </div>
      <div class="legend">
        ${Object.values(this._draft.profiles).map(
          (p) =>
            html`<span class="row"
              ><span class="swatch" style="background: ${p.color}"></span>${p.name}</span
            >`,
        )}
        <span>★ ${this.t("week.legend_holiday")}</span>
        <span>✈ ${this.t("week.legend_exception")}</span>
      </div>
    </div>`;
  }

  private renderExceptionsTab() {
    const today = this.today();
    const exceptions = this._draft.exceptions;
    const hasPast = exceptions.some((e) => e.to < today);
    return html`
      <h3>${this.t("exceptions.title")}</h3>
      ${exceptions.length === 0
        ? html`<div class="muted">${this.t("exceptions.empty")}</div>`
        : nothing}
      <div class="exceptions">
        ${exceptions.map((exception, index) => {
          const past = exception.to < today;
          const active = exception.from <= today && today <= exception.to;
          const issues = this.issuesFor(`exceptions.${index}`);
          const color = this._draft.profiles[exception.profile]?.color ?? "transparent";
          return html`<div
            class="exception ${past ? "past" : ""}"
            style="--row-color: ${color}"
            data-index=${index}
          >
            <div class="row">
              <label class="field">
                ${this.t("exceptions.from")}
                <input
                  type="date"
                  .value=${exception.from}
                  @change=${(e: Event) =>
                    this.updateException(index, "from", (e.target as HTMLInputElement).value)}
                />
              </label>
              <label class="field">
                ${this.t("exceptions.to")}
                <input
                  type="date"
                  .value=${exception.to}
                  min=${exception.from}
                  @change=${(e: Event) =>
                    this.updateException(index, "to", (e.target as HTMLInputElement).value)}
                />
              </label>
              ${past ? html`<span class="badge">${this.t("exceptions.past")}</span>` : nothing}
              ${active ? html`<span class="badge active">${this.t("exceptions.active")}</span>` : nothing}
            </div>
            <div class="row">
              <label class="field grow">
                ${this.t("exceptions.profile")}
                <select
                  @change=${(e: Event) =>
                    this.updateException(index, "profile", (e.target as HTMLSelectElement).value)}
                >
                  ${this.profileOptions(exception.profile)}
                </select>
              </label>
              <label class="field grow">
                ${this.t("exceptions.note")}
                <input
                  type="text"
                  maxlength=${MAX_NOTE_LENGTH}
                  .value=${exception.note ?? ""}
                  @change=${(e: Event) =>
                    this.updateException(index, "note", (e.target as HTMLInputElement).value)}
                />
              </label>
              <button class="danger" @click=${() => this.deleteException(index)}>
                ${this.t("exceptions.delete")}
              </button>
            </div>
            ${issues.length
              ? html`<div class="notice error">
                  ${issues.map((i) => html`<div>${this.describeIssue(i)}</div>`)}
                </div>`
              : nothing}
          </div>`;
        })}
      </div>
      <div class="row">
        <button class="primary-outline" @click=${() => this.addException()}>
          ${this.t("exceptions.add")}
        </button>
        ${hasPast
          ? html`<button @click=${() => this.removePastExceptions()}>
              ${this.t("exceptions.remove_past")}
            </button>`
          : nothing}
      </div>
      <label class="check">
        <input
          type="checkbox"
          .checked=${this._draft.auto_cleanup}
          @change=${(e: Event) => {
            const checked = (e.target as HTMLInputElement).checked;
            this.change((draft) => {
              draft.auto_cleanup = checked;
            });
          }}
        />
        ${this.t("exceptions.auto_cleanup")}
      </label>
    `;
  }

  private renderFooter() {
    const otherIssues = this._issues.filter(
      (i) =>
        !(this._tab === "profiles" && i.path.startsWith(`profiles.${this._profileId}`)) &&
        !(this._tab === "exceptions" && i.path.startsWith("exceptions.")),
    );
    return html`
      ${this._conflict
        ? html`<div class="notice warning row">
            <span class="grow">${this.t("editor.conflict")}</span>
            <button @click=${() => this.reloadAfterConflict()}>${this.t("editor.reload")}</button>
          </div>`
        : nothing}
      ${otherIssues.length
        ? html`<div class="notice error">
            ${otherIssues.map((i) => html`<div>${this.describeIssue(i)}</div>`)}
          </div>`
        : nothing}
      ${this._message
        ? html`<div class="notice ${this._message.kind}" role="status">${this._message.text}</div>`
        : this.dirty
          ? html`<div class="muted unsaved">${this.t("editor.unsaved")}</div>`
          : nothing}
      <div class="footer">
        <button
          class="icon"
          title=${this.t("editor.undo")}
          aria-label=${this.t("editor.undo")}
          ?disabled=${this._undo.length === 0}
          @click=${() => this.undo()}
        >
          ↶
        </button>
        <button
          class="icon"
          title=${this.t("editor.redo")}
          aria-label=${this.t("editor.redo")}
          ?disabled=${this._redo.length === 0}
          @click=${() => this.redo()}
        >
          ↷
        </button>
        <span class="grow"></span>
        <button ?disabled=${!this.dirty || this._saving} @click=${() => this.discard()}>
          ${this.t("editor.discard")}
        </button>
        <button
          class="primary save"
          ?disabled=${!this.dirty || this._saving}
          @click=${() => this.save()}
        >
          ${this._saving ? this.t("editor.saving") : this.t("editor.save")}
        </button>
      </div>
    `;
  }

  protected render() {
    if (!this._draft) {
      return nothing;
    }
    let body: TemplateResult;
    switch (this._tab) {
      case "week":
        body = this.renderWeekTab();
        break;
      case "exceptions":
        body = this.renderExceptionsTab();
        break;
      default:
        body = this.renderProfilesTab();
    }
    return html`${this.renderTabs()}
      <div class="body" role="tabpanel">${body}</div>
      ${this.renderFooter()}`;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: var(--zp-gap);
      }
      h3 {
        margin: 4px 0;
        font-size: 16px;
        font-weight: 500;
      }
      .tabs {
        display: flex;
        border-bottom: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        overflow-x: auto;
        scrollbar-width: none;
      }
      .tab {
        flex: 1 1 0;
        min-width: 0;
        padding: 4px 6px;
        line-height: 1.2;
        border: none;
        border-radius: 0;
        background: none;
        border-bottom: 3px solid transparent;
        color: var(--secondary-text-color);
        font-weight: 500;
      }
      .tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }
      .body {
        display: flex;
        flex-direction: column;
        gap: var(--zp-gap);
        min-width: 0;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chip {
        border-radius: 22px;
        border-width: 2px;
      }
      .chip.active {
        border-color: var(--chip-color);
        background: color-mix(in srgb, var(--chip-color) 18%, transparent);
        font-weight: 500;
      }
      .chip.add {
        border-style: dashed;
      }
      .profile-settings {
        display: flex;
        flex-wrap: wrap;
        gap: var(--zp-gap);
        align-items: flex-end;
      }
      .profile-settings .field.grow {
        min-width: 160px;
      }
      .colors {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
      }
      .color {
        width: var(--zp-touch);
        height: var(--zp-touch);
        min-width: 0;
        padding: 0;
        border-radius: 50%;
        border: 3px solid transparent;
      }
      .color.active {
        border-color: var(--primary-text-color);
        box-shadow: inset 0 0 0 3px var(--card-background-color, #fff);
      }
      .chart-wrapper {
        margin: 0 -4px;
      }
      .chart-footer select {
        min-width: 100px;
      }
      .field.inline {
        flex-direction: row;
        align-items: center;
        gap: 8px;
      }
      .selected-point {
        padding: 10px;
        border-radius: var(--zp-radius);
        background: rgba(127, 127, 127, 0.08);
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .selected-point .row {
        align-items: flex-end;
      }
      .stepper {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .stepper input.value {
        width: 5.5em;
        text-align: center;
      }
      table.points {
        width: 100%;
        border-collapse: collapse;
      }
      table.points caption {
        text-align: left;
        padding-bottom: 4px;
      }
      table.points th {
        text-align: left;
        font-size: 13px;
        font-weight: 500;
        color: var(--secondary-text-color);
        padding: 4px;
      }
      table.points td {
        padding: 4px;
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.2));
      }
      table.points tr.selected td {
        background: rgba(127, 127, 127, 0.1);
      }
      table.points input[type="time"] {
        width: 100%;
        min-width: 6.5em;
      }
      table.points input.value {
        width: 100%;
        min-width: 4em;
        text-align: center;
      }
      table.points th:last-child,
      table.points td:last-child {
        width: var(--zp-touch);
      }
      .add-point {
        align-self: flex-start;
      }
      .copy {
        align-items: flex-end;
      }
      .week {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .week-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-left: 10px;
        border-left: 6px solid var(--row-color);
        border-radius: 4px;
      }
      .week-row .day {
        flex: 0 0 8.5em;
      }
      .week-row select {
        flex: 1 1 auto;
        min-width: 0;
      }
      .week-row.holiday {
        margin-top: 8px;
      }
      .month-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin: 8px 0;
      }
      .calendar {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 3px;
      }
      .cell {
        min-height: 40px;
        border-radius: 6px;
        background: color-mix(in srgb, var(--cell-color) 35%, transparent);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 13px;
      }
      .cell.head {
        min-height: 24px;
        background: none;
        color: var(--secondary-text-color);
        font-size: 12px;
      }
      .cell.empty {
        background: none;
      }
      .cell.today {
        outline: 2px solid var(--primary-text-color);
      }
      .cell .mark {
        font-size: 11px;
        line-height: 1;
        min-height: 11px;
      }
      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 4px 14px;
        margin-top: 8px;
        font-size: 13px;
        color: var(--secondary-text-color);
      }
      .legend .row {
        gap: 4px;
      }
      .exceptions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .exception {
        padding: 10px;
        border-radius: var(--zp-radius);
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        border-left: 6px solid var(--row-color);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .exception .row {
        align-items: flex-end;
      }
      .exception.past {
        opacity: 0.55;
      }
      .exception input[type="date"] {
        min-width: 9.5em;
      }
      .badge {
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        background: rgba(127, 127, 127, 0.2);
        margin-bottom: 12px;
      }
      .badge.active {
        background: var(--primary-color);
        color: var(--text-primary-color, #fff);
      }
      .footer {
        position: sticky;
        bottom: 0;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px 0 4px;
        background: var(--card-background-color, var(--ha-card-background, #fff));
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        z-index: 1;
      }
      @media (max-width: 400px) {
        .week-row .day {
          flex-basis: 6.5em;
        }
        .footer {
          display: grid;
          grid-template-columns: var(--zp-touch) var(--zp-touch) 1fr 1fr;
          gap: 6px;
        }
        .footer .grow {
          display: none;
        }
        .footer button:not(.icon) {
          padding: 0 6px;
        }
      }
      @media (max-width: 340px) {
        .footer {
          grid-template-columns: var(--zp-touch) var(--zp-touch) 1fr;
        }
        .footer .save {
          grid-column: 1 / -1;
        }
      }
    `,
  ];
}

if (!customElements.get("zeitprofil-editor")) {
  customElements.define("zeitprofil-editor", ZeitprofilEditor);
}

declare global {
  interface HTMLElementTagNameMap {
    "zeitprofil-editor": ZeitprofilEditor;
  }
}
