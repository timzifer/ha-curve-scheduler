/** Thin wrappers around the integration's websocket commands. */

import type { InstanceConfig, InstanceData, Schedule, ValidationIssue } from "./model";

export interface HassConnection {
  subscribeMessage<T>(
    callback: (message: T) => void,
    message: Record<string, unknown>,
  ): Promise<() => Promise<void>>;
}

/** The subset of the Home Assistant frontend object used by the card. */
export interface HomeAssistant {
  callWS<T>(message: Record<string, unknown>): Promise<T>;
  callService(
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ): Promise<unknown>;
  connection: HassConnection;
  user?: { is_admin: boolean; name?: string };
  locale?: { language?: string };
  language?: string;
}

export interface InstanceSummary {
  entry_id: string;
  title: string;
  config: InstanceConfig;
}

export type SaveResult =
  | { ok: true; revision: number }
  | { ok: false; conflict: true; revision: number }
  | { ok: false; conflict: false; errors: ValidationIssue[] };

export const listInstances = (hass: HomeAssistant): Promise<InstanceSummary[]> =>
  hass.callWS({ type: "zeitprofil/list" });

export const getInstance = (hass: HomeAssistant, entryId: string): Promise<InstanceData> =>
  hass.callWS({ type: "zeitprofil/get", entry_id: entryId });

export const saveSchedule = (
  hass: HomeAssistant,
  entryId: string,
  revision: number,
  schedule: Schedule,
): Promise<SaveResult> =>
  hass.callWS({ type: "zeitprofil/save", entry_id: entryId, revision, schedule });

export const subscribeInstance = (
  hass: HomeAssistant,
  entryId: string,
  callback: (data: InstanceData) => void,
): Promise<() => Promise<void>> =>
  hass.connection.subscribeMessage<InstanceData>(callback, {
    type: "zeitprofil/subscribe",
    entry_id: entryId,
  });

export const fetchHolidays = (
  hass: HomeAssistant,
  entryId: string,
  start: string,
  end: string,
): Promise<{ configured: boolean; holidays: string[] }> =>
  hass.callWS({ type: "zeitprofil/holidays", entry_id: entryId, start, end });

export const setMode = (
  hass: HomeAssistant,
  entryId: string,
  profileId: string | null,
): Promise<unknown> =>
  profileId === null
    ? hass.callService("zeitprofil", "clear_override", { config_entry_id: entryId })
    : hass.callService("zeitprofil", "set_override", {
        config_entry_id: entryId,
        profile: profileId,
      });

export const addException = (
  hass: HomeAssistant,
  entryId: string,
  from: string,
  to: string,
  profileId: string,
  note: string,
): Promise<unknown> =>
  hass.callService("zeitprofil", "add_exception", {
    config_entry_id: entryId,
    from,
    to,
    profile: profileId,
    note,
  });
