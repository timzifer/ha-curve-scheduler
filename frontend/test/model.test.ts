import { describe, expect, it } from "vitest";
import {
  addDays,
  newProfileId,
  profileUsages,
  resolveDay,
  suggestFreeTime,
  validateSchedule,
  weekdayOf,
  type Schedule,
} from "../src/model";

function schedule(): Schedule {
  return {
    profiles: {
      workday: {
        name: "Werktag",
        color: "#e67e22",
        points: [
          { t: "05:00", v: 45 },
          { t: "05:30", v: 60 },
        ],
      },
      day_off: { name: "Frei", color: "#27ae60", points: [{ t: "07:00", v: 50 }] },
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
  };
}

const codes = (data: Schedule) => validateSchedule(data, 20, 70).map((i) => i.code);

describe("validation (same codes as the backend)", () => {
  it("accepts the default", () => {
    expect(codes(schedule())).toEqual([]);
  });

  it.each([
    [[], "too_few_points"],
    [[{ t: "05:03", v: 40 }], "time_not_on_grid"],
    [[{ t: "24:00", v: 40 }], "invalid_time"],
    [
      [
        { t: "05:00", v: 40 },
        { t: "05:00", v: 41 },
      ],
      "duplicate_time",
    ],
    [
      [
        { t: "06:00", v: 40 },
        { t: "05:00", v: 41 },
      ],
      "times_not_sorted",
    ],
    [[{ t: "05:00", v: 80 }], "value_out_of_range"],
    [[{ t: "05:00", v: Number.NaN }], "invalid_value"],
  ])("points %j -> %s", (points, code) => {
    const data = schedule();
    data.profiles.workday.points = points;
    expect(codes(data)).toContain(code);
  });

  it("limits the number of points to 48", () => {
    const data = schedule();
    data.profiles.workday.points = Array.from({ length: 48 }, (_, i) => ({
      t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
      v: 40,
    }));
    expect(codes(data)).toEqual([]);
    data.profiles.workday.points.push({ t: "23:55", v: 40 });
    expect(codes(data)).toContain("too_many_points");
  });

  it("checks names, colors, references and exceptions", () => {
    const data = schedule();
    data.profiles.day_off.name = "werktag";
    data.profiles.workday.color = "red";
    data.week.sat = "missing";
    data.exceptions = [{ from: "2026-12-24", to: "2026-12-20", profile: "day_off" }];
    const result = codes(data);
    expect(result).toEqual(
      expect.arrayContaining([
        "duplicate_name",
        "invalid_color",
        "unknown_profile",
        "date_range_reversed",
      ]),
    );
    data.exceptions = [{ from: "2026-02-30", to: "2026-03-01", profile: "day_off" }];
    expect(codes(data)).toContain("invalid_date");
  });

  it("finds usages of a profile", () => {
    const data = schedule();
    data.exceptions = [{ from: "2026-12-24", to: "2026-12-26", profile: "day_off" }];
    expect(profileUsages(data, "day_off")).toEqual([
      "week.sat",
      "week.sun",
      "holiday_profile",
      "exceptions.0",
    ]);
    expect(profileUsages(data, "workday")).toHaveLength(5);
  });
});

describe("day resolution", () => {
  it("applies exception > holiday > weekday", () => {
    const data = schedule();
    data.profiles.vacation = { name: "Urlaub", color: "#2980b9", points: [{ t: "00:00", v: 30 }] };
    data.exceptions = [{ from: "2026-12-24", to: "2027-01-06", profile: "vacation" }];
    const holidays = new Set(["2026-12-25", "2026-11-01", "2026-10-29"]);
    const isHoliday = (day: string) => holidays.has(day);
    expect(resolveDay(data, "2026-10-28", isHoliday)).toEqual({
      profileId: "workday",
      reason: "weekday",
    });
    expect(resolveDay(data, "2026-10-29", isHoliday).reason).toBe("holiday");
    expect(resolveDay(data, "2026-10-31", isHoliday).profileId).toBe("day_off");
    expect(resolveDay(data, "2026-12-25", isHoliday)).toEqual({
      profileId: "vacation",
      reason: "exception",
    });
  });

  it("date helpers", () => {
    expect(weekdayOf("2026-10-31")).toBe("sat");
    expect(weekdayOf("2026-10-26")).toBe("mon");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("helpers", () => {
  it("creates readable unique ids", () => {
    const data = schedule();
    expect(newProfileId(data, "Vacation")).toBe("vacation");
    expect(newProfileId(data, "Workday")).toBe("workday_2");
    expect(newProfileId(data, "Große Ferien")).toBe("grosse_ferien");
  });

  it("suggests a free time in the largest gap", () => {
    expect(
      suggestFreeTime([
        { t: "06:00", v: 1 },
        { t: "08:00", v: 1 },
      ]),
    ).toBe(19 * 60);
    expect(suggestFreeTime([])).toBe(720);
  });
});
