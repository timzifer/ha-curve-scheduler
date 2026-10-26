import type { InstanceData } from "../../src/model";

export function instance(): InstanceData {
  return {
    entry_id: "abc",
    title: "Zirkulation",
    revision: 3,
    config: {
      target: "number.x",
      interval: 5,
      interpolation: "linear",
      min: 20,
      max: 70,
      step: 0.5,
      unit: "°C",
      holiday_source: null,
      threshold: 0,
    },
    schedule: {
      profiles: {
        workday: {
          name: "Werktag",
          color: "#e67e22",
          points: [
            { t: "06:00", v: 45 },
            { t: "12:00", v: 60 },
            { t: "18:00", v: 45 },
          ],
        },
        day_off: { name: "Frei", color: "#27ae60", points: [{ t: "08:00", v: 50 }] },
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
      exceptions: [],
      auto_cleanup: false,
    },
    state: {
      now: "2026-10-29T12:00:00+01:00",
      enabled: true,
      override: null,
      value: 60,
      raw_value: 60,
      profile_id: "workday",
      reason: "weekday",
      next_point: { time: "2026-10-29T18:00:00+01:00", hhmm: "18:00", value: 45 },
      value_in_1h: 57.5,
      target_available: true,
      target_value: 60,
      timeline: [],
    },
  };
}
