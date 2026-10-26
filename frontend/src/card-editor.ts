/** Visual configuration editor of the card (shown in the dashboard editor). */

import { LitElement, css, html, nothing, type PropertyValues } from "lit";
import { listInstances, type HomeAssistant, type InstanceSummary } from "./api";
import { languageOf, translator } from "./i18n";
import { sharedStyles } from "./styles";
import type { CurveSchedulerCardConfig } from "./card";

export class CurveSchedulerCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
    _instances: { state: true },
  };

  declare hass: HomeAssistant;
  declare _config: CurveSchedulerCardConfig;
  declare _instances: InstanceSummary[] | null;

  constructor() {
    super();
    this._instances = null;
  }

  setConfig(config: CurveSchedulerCardConfig): void {
    this._config = config;
  }

  protected willUpdate(changed: PropertyValues<this>): void {
    if (changed.has("hass") && this.hass && this._instances === null) {
      this._instances = [];
      listInstances(this.hass)
        .then((instances) => {
          this._instances = instances;
          if (!this._config.entry_id && instances.length) {
            this.update_({ entry_id: instances[0].entry_id });
          }
        })
        .catch(() => (this._instances = []));
    }
  }

  private update_(patch: Partial<CurveSchedulerCardConfig>): void {
    const config = { ...this._config, ...patch };
    for (const key of Object.keys(config) as (keyof CurveSchedulerCardConfig)[]) {
      if (config[key] === "" || config[key] === undefined) {
        delete config[key];
      }
    }
    this._config = config;
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }),
    );
  }

  protected render() {
    if (!this._config) {
      return nothing;
    }
    const t = translator(languageOf(this.hass));
    const instances = this._instances ?? [];
    return html`
      <label class="field">
        ${t("config.instance")}
        <select
          @change=${(e: Event) => this.update_({ entry_id: (e.target as HTMLSelectElement).value })}
        >
          ${instances.length === 0
            ? html`<option value="">${t("card.no_instance")}</option>`
            : nothing}
          ${instances.map(
            (instance) =>
              html`<option
                value=${instance.entry_id}
                ?selected=${instance.entry_id === this._config.entry_id}
              >
                ${instance.title}
              </option>`,
          )}
        </select>
      </label>
      <label class="field">
        ${t("config.view")}
        <select
          @change=${(e: Event) =>
            this.update_({ view: (e.target as HTMLSelectElement).value as "compact" | "full" })}
        >
          <option value="compact" ?selected=${this._config.view !== "full"}>
            ${t("config.view.compact")}
          </option>
          <option value="full" ?selected=${this._config.view === "full"}>
            ${t("config.view.full")}
          </option>
        </select>
      </label>
      <label class="field">
        ${t("config.title")}
        <input
          type="text"
          .value=${this._config.title ?? ""}
          @change=${(e: Event) => this.update_({ title: (e.target as HTMLInputElement).value })}
        />
      </label>
      <label class="check">
        <input
          type="checkbox"
          .checked=${this._config.allow_edit !== false}
          @change=${(e: Event) =>
            this.update_({ allow_edit: (e.target as HTMLInputElement).checked })}
        />
        ${t("config.allow_edit")}
      </label>
    `;
  }

  static styles = [
    sharedStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
    `,
  ];
}

if (!customElements.get("curve-scheduler-card-editor")) {
  customElements.define("curve-scheduler-card-editor", CurveSchedulerCardEditor);
}
