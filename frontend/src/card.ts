/**
 * <zeitprofil-card>: today's plan at a glance plus the editor.
 */

import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import {
  addException,
  listInstances,
  setMode,
  subscribeInstance,
  type HomeAssistant,
} from "./api";
import { formatValue } from "./format";
import { languageOf, translator, type Translate, type TranslationKey } from "./i18n";
import { Interpolator, buildTimeline, parseTime, type Point } from "./interpolation";
import { addDays, profilePoints, type InstanceData } from "./model";
import { sharedStyles } from "./styles";
import "./curve";
import "./editor";
import type { ZeitprofilEditor } from "./editor";

export interface ZeitprofilCardConfig {
  type: string;
  entry_id?: string;
  view?: "compact" | "full";
  allow_edit?: boolean;
  title?: string;
}

export class ZeitprofilCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _data: { state: true },
    _error: { state: true },
    _editorOpen: { state: true },
    _holidayForm: { state: true },
    _notice: { state: true },
    _tick: { state: true },
  };

  declare hass: HomeAssistant;
  declare _config: ZeitprofilCardConfig;
  declare _data: InstanceData | null;
  declare _error: string | null;
  declare _editorOpen: boolean;
  declare _holidayForm: { from: string; to: string; profile: string; note: string } | null;
  declare _notice: string | null;
  declare _tick: number;

  private unsubscribe?: Promise<() => Promise<void>>;
  private subscribedEntry?: string;
  private receivedAt = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  private t: Translate = translator("en");
  private language = "en";

  constructor() {
    super();
    this._data = null;
    this._error = null;
    this._editorOpen = false;
    this._holidayForm = null;
    this._notice = null;
    this._tick = 0;
  }

  static getConfigElement(): HTMLElement {
    return document.createElement("zeitprofil-card-editor");
  }

  static getStubConfig(): Partial<ZeitprofilCardConfig> {
    return { view: "compact", allow_edit: true };
  }

  setConfig(config: ZeitprofilCardConfig): void {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    const changedEntry = this._config?.entry_id !== config.entry_id;
    this._config = { view: "compact", allow_edit: true, ...config };
    if (changedEntry) {
      void this.resubscribe();
    }
  }

  getCardSize(): number {
    return this._config?.view === "full" ? 14 : 5;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto" };
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.timer = setInterval(() => (this._tick += 1), 30_000);
    if (this.hass && this._config) {
      void this.resubscribe();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this.timer);
    void this.teardown();
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass") && this.hass) {
      const language = languageOf(this.hass);
      if (language !== this.language) {
        this.language = language;
        this.t = translator(language);
      }
      if (!this.unsubscribe && this._config) {
        void this.resubscribe();
      }
    }
  }

  private async teardown(): Promise<void> {
    const pending = this.unsubscribe;
    this.unsubscribe = undefined;
    this.subscribedEntry = undefined;
    if (pending) {
      try {
        await (await pending)();
      } catch {
        // connection already closed
      }
    }
  }

  private async resubscribe(): Promise<void> {
    if (!this.hass || !this._config || !this.isConnected) {
      return;
    }
    let entryId = this._config.entry_id;
    if (!entryId) {
      try {
        const instances = await listInstances(this.hass);
        entryId = instances[0]?.entry_id;
      } catch (err) {
        this._error = this.t("card.connection_error", { message: (err as Error).message });
        return;
      }
      if (!entryId) {
        this._error = this.t("card.no_instance");
        return;
      }
    }
    if (entryId === this.subscribedEntry && this.unsubscribe) {
      return;
    }
    await this.teardown();
    this.subscribedEntry = entryId;
    this._error = null;
    const subscription = subscribeInstance(this.hass, entryId, (data) => {
      this._data = data;
      this.receivedAt = Date.now();
    });
    this.unsubscribe = subscription;
    try {
      await subscription;
    } catch (err) {
      this.unsubscribe = undefined;
      this.subscribedEntry = undefined;
      const code = (err as { code?: string }).code;
      this._error =
        code === "not_found"
          ? this.t("card.not_found")
          : this.t("card.connection_error", { message: (err as Error).message ?? code });
    }
  }

  // ------------------------------------------------------------------

  private get canEdit(): boolean {
    return this._config.allow_edit !== false || this.hass?.user?.is_admin === true;
  }

  private get editor(): ZeitprofilEditor | null {
    return this.renderRoot.querySelector("zeitprofil-editor");
  }

  private toggleEditor(): void {
    if (this._editorOpen) {
      if (this.editor && !this.editor.confirmLeave()) {
        return;
      }
      this._editorOpen = false;
    } else {
      this._editorOpen = true;
    }
  }

  /** Minutes after local midnight (of the HA server), advancing between updates. */
  private nowMinute(data: InstanceData): number {
    const base = parseTime(data.state.now.slice(11, 16)) + Number(data.state.now.slice(17, 19)) / 60;
    const elapsed = (Date.now() - this.receivedAt) / 60000;
    return Math.min(1440, base + Math.max(0, elapsed));
  }

  private fmt(value: number): string {
    const config = this._data!.config;
    return formatValue(value, config.step, config.unit, this.language);
  }

  private async changeMode(value: string): Promise<void> {
    try {
      await setMode(this.hass, this._data!.entry_id, value === "auto" ? null : value);
    } catch (err) {
      this._notice = (err as Error).message;
    }
  }

  private openHolidayForm(): void {
    const data = this._data!;
    const today = data.state.now.slice(0, 10);
    const profiles = Object.keys(data.schedule.profiles);
    const profile =
      profiles.find((id) => /urlaub|holiday|vacation/i.test(id)) ?? data.schedule.holiday_profile;
    this._holidayForm = {
      from: today,
      to: addDays(today, 6),
      profile,
      note: this.t("holiday.note_default"),
    };
  }

  private async submitHoliday(): Promise<void> {
    const form = this._holidayForm;
    if (!form || !form.from) {
      return;
    }
    const to = form.to && form.to >= form.from ? form.to : form.from;
    try {
      await addException(this.hass, this._data!.entry_id, form.from, to, form.profile, form.note);
      this._holidayForm = null;
      this._notice = this.t("holiday.added");
      setTimeout(() => (this._notice = null), 4000);
    } catch (err) {
      this._notice = (err as Error).message;
    }
  }

  // ------------------------------------------------------------------

  private renderToday(data: InstanceData) {
    const { state, schedule, config } = data;
    const profile = schedule.profiles[state.profile_id];
    const ids = state.timeline.map((d) => d.profile_id);
    const context: Point[][] = [ids[0], ids[1], ids[3], ids[4]].map((id) =>
      schedule.profiles[id] ? profilePoints(schedule.profiles[id]) : [],
    );
    const now = this.nowMinute(data);
    const centerPoints: Point[] = profile ? profilePoints(profile) : [];
    const timeline = buildTimeline([context[0], context[1], centerPoints, context[2], context[3]]);
    const nowValue = timeline.length
      ? new Interpolator(timeline, config.interpolation).at(now)
      : null;
    const parts = [
      this.t("today.title", { profile: profile?.name ?? "?" }),
      this.t("today.now", { value: this.fmt(state.value) }),
    ];
    if (state.next_point) {
      parts.push(
        this.t("today.next", { time: state.next_point.hhmm, value: this.fmt(state.next_point.value) }),
      );
    }
    let reason = "";
    if (state.reason !== "weekday") {
      reason = this.t(`today.reason.${state.reason}` as TranslationKey);
      if (state.reason === "override" && state.override?.until) {
        const until = new Date(state.override.until);
        reason += ` · ${this.t("today.until", {
          time: new Intl.DateTimeFormat(this.language, {
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
          }).format(until),
        })}`;
      }
    }
    const modeValue = state.override ? state.override.profile : "auto";
    return html`
      <div class="summary">
        <div class="headline">${parts.join(" · ")}</div>
        ${reason ? html`<div class="muted">${reason}</div>` : nothing}
      </div>
      <zeitprofil-curve
        .points=${profile?.points ?? []}
        .context=${context}
        .mode=${config.interpolation}
        .min=${config.min}
        .max=${config.max}
        .step=${config.step}
        .unit=${config.unit}
        .language=${this.language}
        .color=${profile?.color ?? "var(--primary-color)"}
        .nowMinute=${now}
        .nowValue=${nowValue}
        .height=${170}
        .showContinuation=${false}
      ></zeitprofil-curve>
      ${state.enabled ? nothing : html`<div class="notice warning">${this.t("today.disabled")}</div>`}
      ${state.enabled && !state.target_available
        ? html`<div class="notice warning">${this.t("today.unavailable")}</div>`
        : nothing}
      <div class="actions">
        <label class="field mode">
          ${this.t("today.mode")}
          <select
            class="mode-select"
            @change=${(e: Event) => this.changeMode((e.target as HTMLSelectElement).value)}
          >
            <option value="auto" ?selected=${modeValue === "auto"}>
              ${this.t("today.mode.auto")}
            </option>
            ${Object.entries(schedule.profiles).map(
              ([id, p]) => html`<option value=${id} ?selected=${modeValue === id}>${p.name}</option>`,
            )}
          </select>
        </label>
        <button @click=${() => (this._holidayForm ? (this._holidayForm = null) : this.openHolidayForm())}>
          ${this.t("today.add_holiday")}
        </button>
        ${this._config.view !== "full" && this.canEdit
          ? html`<button class="primary edit" @click=${() => this.toggleEditor()}>
              ${this._editorOpen ? this.t("today.close_editor") : this.t("today.edit")}
            </button>`
          : nothing}
      </div>
      ${this._holidayForm ? this.renderHolidayForm(data) : nothing}
      ${this._notice ? html`<div class="notice success" role="status">${this._notice}</div>` : nothing}
    `;
  }

  private renderHolidayForm(data: InstanceData) {
    const form = this._holidayForm!;
    const update = (field: keyof typeof form) => (e: Event) => {
      this._holidayForm = {
        ...form,
        [field]: (e.target as HTMLInputElement | HTMLSelectElement).value,
      };
    };
    return html`<div class="holiday-form">
      <strong>${this.t("holiday.title")}</strong>
      <div class="row">
        <label class="field">
          ${this.t("holiday.from")}
          <input type="date" .value=${form.from} @change=${update("from")} />
        </label>
        <label class="field">
          ${this.t("holiday.to")}
          <input type="date" .value=${form.to} min=${form.from} @change=${update("to")} />
        </label>
      </div>
      <div class="row">
        <label class="field grow">
          ${this.t("holiday.profile")}
          <select @change=${update("profile")}>
            ${Object.entries(data.schedule.profiles).map(
              ([id, p]) => html`<option value=${id} ?selected=${id === form.profile}>${p.name}</option>`,
            )}
          </select>
        </label>
        <label class="field grow">
          ${this.t("holiday.note")}
          <input type="text" maxlength="100" .value=${form.note} @change=${update("note")} />
        </label>
      </div>
      <div class="row end">
        <button @click=${() => (this._holidayForm = null)}>${this.t("holiday.cancel")}</button>
        <button class="primary" @click=${() => this.submitHoliday()}>${this.t("holiday.save")}</button>
      </div>
    </div>`;
  }

  protected render() {
    if (!this._config) {
      return nothing;
    }
    const title = this._config.title ?? this._data?.title;
    let content;
    if (this._error) {
      content = html`<div class="notice error">${this._error}</div>`;
    } else if (!this._data) {
      content = html`<div class="muted">${this.t("card.loading")}</div>`;
    } else {
      const showEditor = this.canEdit && (this._config.view === "full" || this._editorOpen);
      content = html`
        ${this.renderToday(this._data)}
        ${showEditor
          ? html`<zeitprofil-editor
              .hass=${this.hass}
              .data=${this._data}
              .language=${this.language}
            ></zeitprofil-editor>`
          : nothing}
      `;
    }
    return html`<ha-card>
      ${title ? html`<h1 class="card-header">${title}</h1>` : nothing}
      <div class="content">${content}</div>
    </ha-card>`;
  }

  static styles = [
    sharedStyles,
    css`
      ha-card {
        overflow: visible;
      }
      .card-header {
        margin: 0;
        padding: 16px 16px 0;
        font-size: 20px;
        font-weight: 400;
        line-height: 1.3;
      }
      .content {
        padding: 12px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: var(--zp-gap);
      }
      .headline {
        font-size: 16px;
        font-weight: 500;
        line-height: 1.4;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: flex-end;
      }
      .actions .mode {
        flex: 1 1 140px;
      }
      .actions .mode select {
        width: 100%;
      }
      .holiday-form {
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 12px;
        border-radius: var(--zp-radius);
        background: rgba(127, 127, 127, 0.08);
      }
      .row.end {
        justify-content: flex-end;
      }
      zeitprofil-editor {
        border-top: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        padding-top: 8px;
      }
    `,
  ];
}

if (!customElements.get("zeitprofil-card")) {
  customElements.define("zeitprofil-card", ZeitprofilCard);
}

declare global {
  interface HTMLElementTagNameMap {
    "zeitprofil-card": ZeitprofilCard;
  }
}
