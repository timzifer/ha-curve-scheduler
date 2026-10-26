import { afterEach, describe, expect, it, vi } from "vitest";
import "../src/curve-scheduler-card";
import type { CurveSchedulerCard } from "../src/card";
import type { HomeAssistant } from "../src/api";
import type { InstanceData } from "../src/model";
import { instance } from "./fixtures/instance";

function fakeHass(data: InstanceData, isAdmin = false) {
  const callService = vi.fn().mockResolvedValue(undefined);
  const hass = {
    callWS: vi.fn(),
    callService,
    user: { is_admin: isAdmin },
    locale: { language: "de" },
    connection: {
      subscribeMessage: vi.fn(async (callback: (d: InstanceData) => void) => {
        callback(data);
        return async () => undefined;
      }),
    },
  } as unknown as HomeAssistant;
  return { hass, callService };
}

async function mount(config: Record<string, unknown>, isAdmin = false) {
  const data = instance();
  data.state.timeline = ["workday", "workday", "workday", "workday", "day_off"].map((id, i) => ({
    date: `2026-10-${27 + i}`,
    profile_id: id,
    reason: "weekday" as const,
  }));
  const { hass, callService } = fakeHass(data, isAdmin);
  const card = document.createElement("curve-scheduler-card") as CurveSchedulerCard;
  card.setConfig({ type: "custom:curve-scheduler-card", entry_id: "abc", ...config });
  card.hass = hass;
  document.body.appendChild(card);
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await card.updateComplete;
  }
  return { card, callService };
}

afterEach(() => {
  document.body.innerHTML = "";
});

describe("curve-scheduler-card", () => {
  it("is announced to the card picker", () => {
    expect(window.customCards?.some((c) => c.type === "curve-scheduler-card")).toBe(true);
  });

  it("shows today's summary", async () => {
    const { card } = await mount({});
    const text = card.shadowRoot!.querySelector(".headline")!.textContent;
    expect(text).toBe("Heute: Werktag · jetzt 60\u00a0°C · ab 18:00 → 45\u00a0°C");
    expect(card.shadowRoot!.querySelector("curve-scheduler-curve")).not.toBeNull();
    expect(card.shadowRoot!.querySelector("curve-scheduler-editor")).toBeNull();
  });

  it("opens the editor", async () => {
    const { card } = await mount({});
    card.shadowRoot!.querySelector<HTMLButtonElement>("button.edit")!.click();
    await card.updateComplete;
    expect(card.shadowRoot!.querySelector("curve-scheduler-editor")).not.toBeNull();
  });

  it("hides the editor for non-admins when not allowed", async () => {
    const { card } = await mount({ allow_edit: false });
    expect(card.shadowRoot!.querySelector("button.edit")).toBeNull();
    const admin = await mount({ allow_edit: false }, true);
    expect(admin.card.shadowRoot!.querySelector("button.edit")).not.toBeNull();
  });

  it("full view shows the editor directly", async () => {
    const { card } = await mount({ view: "full" });
    expect(card.shadowRoot!.querySelector("curve-scheduler-editor")).not.toBeNull();
  });

  it("changes the mode", async () => {
    const { card, callService } = await mount({});
    const select = card.shadowRoot!.querySelector<HTMLSelectElement>("select.mode-select")!;
    select.value = "day_off";
    select.dispatchEvent(new Event("change"));
    expect(callService).toHaveBeenCalledWith("curve_scheduler", "set_override", {
      config_entry_id: "abc",
      profile: "day_off",
    });
    select.value = "auto";
    select.dispatchEvent(new Event("change"));
    expect(callService).toHaveBeenCalledWith("curve_scheduler", "clear_override", {
      config_entry_id: "abc",
    });
  });
});
