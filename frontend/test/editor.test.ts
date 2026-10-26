import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "../src/editor";
import type { ZeitprofilEditor } from "../src/editor";
import type { ZeitprofilCurve } from "../src/curve";
import { instance } from "./fixtures/instance";
import type { HomeAssistant } from "../src/api";

let editor: ZeitprofilEditor;
let callWS: ReturnType<typeof vi.fn>;

async function settle(): Promise<void> {
  await editor.updateComplete;
  const curve = curveElement();
  await curve?.updateComplete;
}

function curveElement(): ZeitprofilCurve | null {
  return editor.shadowRoot!.querySelector("zeitprofil-curve");
}

function points() {
  return editor._draft.profiles.werktag.points;
}

function rows() {
  return editor.shadowRoot!.querySelectorAll("table.points tbody tr");
}

function pointer(type: string, target: Element, x: number, y: number): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      button: 0,
    }),
  );
}

beforeEach(async () => {
  callWS = vi.fn();
  editor = document.createElement("zeitprofil-editor");
  editor.hass = { callWS, callService: vi.fn() } as unknown as HomeAssistant;
  editor.language = "de";
  editor.data = instance();
  document.body.appendChild(editor);
  await settle();
});

afterEach(() => {
  editor.remove();
});

describe("zeitprofil-editor: points", () => {
  it("renders a table row and a handle per point", () => {
    expect(rows()).toHaveLength(3);
    expect(curveElement()!.shadowRoot!.querySelectorAll(".handle")).toHaveLength(3);
  });

  it("adds a point with the + button (field input)", async () => {
    const add = editor.shadowRoot!.querySelector<HTMLButtonElement>("button.add-point")!;
    add.click();
    await settle();
    expect(points()).toHaveLength(4);
    expect(rows()).toHaveLength(4);
    // Largest gap is 18:00 -> 06:00 (over midnight), so the point goes to 00:00.
    expect(points()[0].t).toBe("00:00");
    expect(editor.dirty).toBe(true);

    // Edit the new point through the fields.
    const row = rows()[0];
    const time = row.querySelector<HTMLInputElement>('input[type="time"]')!;
    time.value = "03:10";
    time.dispatchEvent(new Event("change"));
    await settle();
    expect(points()[0].t).toBe("03:10");
    const value = rows()[0].querySelector<HTMLInputElement>("input.value")!;
    value.value = "52,5";
    value.dispatchEvent(new Event("change"));
    await settle();
    expect(points()[0].v).toBe(52.5);
    // Values are kept inside min/max.
    const value2 = rows()[0].querySelector<HTMLInputElement>("input.value")!;
    value2.value = "99";
    value2.dispatchEvent(new Event("change"));
    await settle();
    expect(points()[0].v).toBe(70);
  });

  it("keeps points sorted when a time is typed", async () => {
    const time = rows()[0].querySelector<HTMLInputElement>('input[type="time"]')!;
    time.value = "20:00";
    time.dispatchEvent(new Event("change"));
    await settle();
    expect(points().map((p) => p.t)).toEqual(["12:00", "18:00", "20:00"]);
    expect(editor._selected).toBe(2);
  });

  it("rejects a time that is already used", async () => {
    const time = rows()[0].querySelector<HTMLInputElement>('input[type="time"]')!;
    time.value = "12:00";
    time.dispatchEvent(new Event("change"));
    await settle();
    expect(points().map((p) => p.t)).toEqual(["06:00", "12:00", "18:00"]);
    expect(editor.shadowRoot!.querySelector(".notice.warning")?.textContent).toContain("12:00");
  });

  it("moves a point by dragging and snaps to the grid", async () => {
    const curve = curveElement()!;
    const handle = curve.shadowRoot!.querySelectorAll<HTMLElement>(".handle")[1];
    const start = { x: curve.xFor(12 * 60), y: curve.yFor(60) };
    pointer("pointerdown", handle, start.x, start.y);
    pointer("pointermove", handle, curve.xFor(13 * 60 + 7), curve.yFor(55.2));
    await curve.updateComplete;
    // Live tooltip while dragging
    expect(curve.shadowRoot!.querySelector(".tooltip")?.textContent).toContain("13:00");
    pointer("pointerup", handle, curve.xFor(13 * 60 + 7), curve.yFor(55.2));
    await settle();
    expect(points()[1]).toEqual({ t: "13:00", v: 55 });
    expect(editor._selected).toBe(1);
  });

  it("does not drag a point past its neighbours", async () => {
    const curve = curveElement()!;
    const handle = curve.shadowRoot!.querySelectorAll<HTMLElement>(".handle")[1];
    pointer("pointerdown", handle, curve.xFor(720), curve.yFor(60));
    pointer("pointermove", handle, curve.xFor(22 * 60), curve.yFor(60));
    pointer("pointerup", handle, curve.xFor(22 * 60), curve.yFor(60));
    await settle();
    expect(points()[1].t).toBe("17:55");
    expect(points().map((p) => p.t)).toEqual(["06:00", "17:55", "18:00"]);
  });

  it("adds a point when tapping the chart", async () => {
    const curve = curveElement()!;
    const chart = curve.shadowRoot!.querySelector(".chart")!;
    const x = curve.xFor(9 * 60);
    pointer("pointerdown", chart, x, 100);
    pointer("pointerup", chart, x, 100);
    await settle();
    expect(points().map((p) => p.t)).toEqual(["06:00", "09:00", "12:00", "18:00"]);
    // The point is placed on the existing line (linear: halfway 45 -> 60).
    expect(points()[1].v).toBe(52.5);
    expect(editor._selected).toBe(1);
  });

  it("deletes a point from the table and the selection panel", async () => {
    rows()[2].querySelector<HTMLButtonElement>("button.delete")!.click();
    await settle();
    expect(points().map((p) => p.t)).toEqual(["06:00", "12:00"]);

    // select a point via its handle, then delete it from the panel below the chart
    const handle = curveElement()!.shadowRoot!.querySelectorAll<HTMLElement>(".handle")[0];
    handle.click();
    await settle();
    const panel = editor.shadowRoot!.querySelector(".selected-point")!;
    panel.querySelector<HTMLButtonElement>("button.danger")!.click();
    await settle();
    expect(points().map((p) => p.t)).toEqual(["12:00"]);
    // The last point cannot be deleted.
    editor.deletePoint(0);
    await settle();
    expect(points()).toHaveLength(1);
  });

  it("supports undo and redo", async () => {
    editor.deletePoint(0);
    await settle();
    expect(points()).toHaveLength(2);
    editor.undo();
    await settle();
    expect(points()).toHaveLength(3);
    expect(editor.dirty).toBe(false);
    editor.redo();
    await settle();
    expect(points()).toHaveLength(2);
  });
});

describe("zeitprofil-editor: saving", () => {
  it("sends the draft with the revision", async () => {
    callWS.mockResolvedValue({ ok: true, revision: 4 });
    editor.deletePoint(0);
    await settle();
    await editor.save();
    await settle();
    expect(callWS).toHaveBeenCalledWith(
      expect.objectContaining({ type: "zeitprofil/save", entry_id: "abc", revision: 3 }),
    );
    expect(editor.dirty).toBe(false);
  });

  it("shows the conflict hint", async () => {
    callWS.mockResolvedValue({ ok: false, conflict: true, revision: 5 });
    editor.deletePoint(0);
    await settle();
    await editor.save();
    await settle();
    expect(editor.shadowRoot!.textContent).toContain("Wurde inzwischen geändert – neu laden?");
  });

  it("does not send invalid data", async () => {
    editor._draft = { ...editor._draft, holiday_profile: "missing" };
    await editor.save();
    await settle();
    expect(callWS).not.toHaveBeenCalled();
    expect(editor.shadowRoot!.textContent).toContain("Der gewählte Plan existiert nicht.");
  });

  it("prevents deleting a profile that is still used", async () => {
    const confirm = vi.fn(() => true);
    window.confirm = confirm;
    editor.shadowRoot!.querySelector<HTMLButtonElement>(".profile-settings button.danger")!.click();
    await settle();
    expect(Object.keys(editor._draft.profiles)).toContain("werktag");
    expect(editor.shadowRoot!.textContent).toContain("noch verwendet");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("changes the profile of Saturday in the weekly plan", async () => {
    const tabs = editor.shadowRoot!.querySelectorAll<HTMLButtonElement>(".tab");
    tabs[1].click();
    await settle();
    const select = editor.shadowRoot!.querySelector<HTMLSelectElement>('select[data-day="sat"]')!;
    select.value = "werktag";
    select.dispatchEvent(new Event("change"));
    await settle();
    expect(editor._draft.week.sat).toBe("werktag");
    expect(editor.shadowRoot!.querySelectorAll(".calendar .cell:not(.head):not(.empty)").length).toBe(
      31,
    );
  });

  it("adds a holiday exception", async () => {
    const tabs = editor.shadowRoot!.querySelectorAll<HTMLButtonElement>(".tab");
    tabs[2].click();
    await settle();
    const add = [...editor.shadowRoot!.querySelectorAll<HTMLButtonElement>("button")].find((b) =>
      b.textContent?.includes("+ Ausnahme"),
    )!;
    add.click();
    await settle();
    expect(editor._draft.exceptions).toEqual([
      { from: "2026-10-29", to: "2026-11-04", profile: "frei", note: "Urlaub" },
    ]);
  });
});
