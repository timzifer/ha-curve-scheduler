/**
 * Demo page with an in-memory fake of the Curve Scheduler backend.
 * Used for development (npm run demo) and the README screenshots.
 */

import "../src/curve-scheduler-card";
import { Interpolator, buildTimeline, formatTime, roundToStep } from "../src/interpolation";
import {
  addDays,
  profilePoints,
  resolveDay,
  validateSchedule,
  type InstanceData,
  type Schedule,
} from "../src/model";

customElements.define(
  "ha-card",
  class extends HTMLElement {
    connectedCallback() {
      this.style.display = "block";
    }
  },
);

const params = new URLSearchParams(location.search);
const NOW = params.get("now") ?? "2026-10-29T14:20:00+01:00";
const holidays = new Set(["2026-10-31", "2026-11-01", "2026-12-25", "2026-12-26"]);

let schedule: Schedule = {
  profiles: {
    workday: {
      name: "Werktag",
      color: "#e67e22",
      points: [
        { t: "05:00", v: 45 },
        { t: "05:30", v: 60 },
        { t: "08:30", v: 60 },
        { t: "09:00", v: 50 },
        { t: "17:00", v: 50 },
        { t: "17:30", v: 60 },
        { t: "22:00", v: 60 },
        { t: "22:30", v: 45 },
      ],
    },
    day_off: {
      name: "Frei",
      color: "#27ae60",
      points: [
        { t: "07:00", v: 45 },
        { t: "07:30", v: 60 },
        { t: "22:00", v: 60 },
        { t: "23:00", v: 45 },
      ],
    },
    vacation: { name: "Urlaub", color: "#2980b9", points: [{ t: "12:00", v: 40 }] },
  },
  week: {
    mon: "workday",
    tue: "workday",
    wed: "workday",
    thu: "workday",
    fri: "workday",
    sat: "day_off",
    sun: "day_off",
  },
  holiday_profile: "day_off",
  exceptions: [
    { id: "a1", from: "2026-08-03", to: "2026-08-14", profile: "vacation", note: "Sommerurlaub" },
    { id: "b2", from: "2026-11-09", to: "2026-11-13", profile: "vacation", note: "Herbstferien" },
    { id: "c3", from: "2026-12-24", to: "2027-01-06", profile: "vacation", note: "Weihnachten" },
  ],
  auto_cleanup: false,
};
let revision = 7;
let override: { profile: string; until: string | null } | null = null;
const listeners = new Set<(data: InstanceData) => void>();
const config = {
  target: "number.zirkulation_soll",
  interval: 5,
  interpolation: "curve" as const,
  min: 20,
  max: 70,
  step: 0.5,
  unit: "°C",
  holiday_source: "binary_sensor.workday",
  threshold: 0,
};

function snapshot(): InstanceData {
  const today = NOW.slice(0, 10);
  const days = [-2, -1, 0, 1, 2].map((offset) => addDays(today, offset));
  const resolved = days.map((day) =>
    override
      ? { profileId: override.profile, reason: "override" as const }
      : resolveDay(schedule, day, (d) => holidays.has(d)),
  );
  const timeline = buildTimeline(resolved.map((r) => profilePoints(schedule.profiles[r.profileId])));
  const interpolator = new Interpolator(timeline, config.interpolation);
  const minute = Number(NOW.slice(11, 13)) * 60 + Number(NOW.slice(14, 16));
  const next = timeline.find(([x]) => x > minute)!;
  return {
    entry_id: "demo",
    title: "Zirkulation",
    config,
    schedule: JSON.parse(JSON.stringify(schedule)),
    revision,
    state: {
      now: NOW,
      enabled: true,
      override,
      value: roundToStep(interpolator.at(minute), config.step),
      raw_value: interpolator.at(minute),
      profile_id: resolved[2].profileId,
      reason: resolved[2].reason,
      next_point: {
        time: "",
        hhmm: formatTime(((next[0] % 1440) + 1440) % 1440),
        value: next[1],
      },
      value_in_1h: roundToStep(interpolator.at(minute + 60), config.step),
      target_available: true,
      target_value: null,
      timeline: days.map((date, i) => ({
        date,
        profile_id: resolved[i].profileId,
        reason: resolved[i].reason,
      })),
    },
  };
}

function publish() {
  const data = snapshot();
  listeners.forEach((listener) => listener(data));
}

const hass = {
  user: { is_admin: false, name: "Demo" },
  locale: { language: params.get("lang") ?? "de" },
  async callWS(message: Record<string, unknown>) {
    switch (message.type) {
      case "curve_scheduler/list":
        return [{ entry_id: "demo", title: "Zirkulation", config }];
      case "curve_scheduler/holidays":
        return { configured: true, holidays: [...holidays] };
      case "curve_scheduler/save": {
        if (message.revision !== revision) {
          return { ok: false, conflict: true, revision };
        }
        const errors = validateSchedule(message.schedule as Schedule, config.min, config.max);
        if (errors.length) {
          return { ok: false, conflict: false, errors };
        }
        schedule = message.schedule as Schedule;
        revision += 1;
        setTimeout(publish, 0);
        return { ok: true, revision };
      }
      default:
        throw new Error(`unknown ${String(message.type)}`);
    }
  },
  async callService(_domain: string, service: string, data: Record<string, unknown>) {
    if (service === "set_override") {
      override = { profile: data.profile as string, until: null };
    } else if (service === "clear_override") {
      override = null;
    } else if (service === "add_exception") {
      schedule.exceptions.push({
        id: String(Math.random()),
        from: data.from as string,
        to: data.to as string,
        profile: data.profile as string,
        note: data.note as string,
      });
      revision += 1;
    }
    publish();
  },
  connection: {
    async subscribeMessage(callback: (data: InstanceData) => void) {
      listeners.add(callback);
      callback(snapshot());
      return async () => {
        listeners.delete(callback);
      };
    },
  },
};

const card = document.createElement("curve-scheduler-card");
card.setConfig({
  type: "custom:curve-scheduler-card",
  entry_id: "demo",
  view: (params.get("view") as "compact" | "full") ?? "compact",
});
(card as unknown as { hass: unknown }).hass = hass;
document.getElementById("root")!.appendChild(card);
(window as unknown as { demoCard: unknown }).demoCard = card;
