import { describe, it, expect } from "vitest";
import { dashboardAnalysis, applyOrderPatch, expediteComparison, CURRENT_USER } from "./shortages";
import { defaultDashboard, readDashboard, WIDGETS } from "./dashboard";
import { practiceParts } from "./practice";
import { sanitizeExtraction } from "./ai-parse";

describe("dashboard analysis and isolated practice", () => {
  it("deduplicates customer and outbound order counts across pegged parts", () => {
    const p = practiceParts()[0]; if (!p) throw new Error("fixture required");
    const data = dashboardAnalysis([p, { ...p, id: "second" }], "open");
    expect(data.customers[0]?.count).toBe(1);
    expect(data.commercial.projectedPenalties).toBe(10000);
    expect(data.customers[0]?.penalty).toBe(10000);
    expect(data.outbound.find((r) => r.mode === "unspecified")?.count).toBe(1);
    expect(data.inbound.find((r) => r.mode === "unspecified")?.count).toBe(2);
  });
  it("excludes delivered parts and cancelled customer exposure from action counts", () => {
    const p = practiceParts()[0]; if (!p) throw new Error("fixture required");
    const cancelled = { ...p, orders: p.orders?.map((o) => ({ ...o, status: "cancelled" as const })) };
    const data = dashboardAnalysis([cancelled, { ...p, id: "delivered", stage: "delivered" }], "open");
    expect(data.critical).toHaveLength(1); expect(data.actions).toHaveLength(1);
    expect(data.customers).toHaveLength(0); expect(data.commercial.projectedPenalties).toBe(0);
    expect(data.stages.find((s) => s.id === "delivered")?.count).toBe(0);
  });
  it("my open parts respects the existing planner name and excludes delivered", () => {
    const p = practiceParts()[0]; if (!p) throw new Error("fixture required");
    expect(dashboardAnalysis([p, { ...p, id: "other", planner: "Other" }, { ...p, id: "done", stage: "delivered" }], "mine").scoped.map((r) => r.planner)).toEqual([CURRENT_USER]);
  });
  it("uses actual minus planned supplier lead-time days without inventing missing signals", () => {
    const p = practiceParts()[0]; if (!p) throw new Error("fixture required");
    const data = dashboardAnalysis([{ ...p, leadTime: { erpDays: 10, actualDays: 16, otdPct: 60 } }, { ...p, id: "other", leadTime: undefined }], "open");
    expect(data.suppliers[0]?.drift).toBe(6);
    expect(data.suppliers[0]?.planned).toBe(10);
    expect(data.suppliers[0]?.actual).toBe(16);
    expect(dashboardAnalysis([{ ...p, leadTime: undefined }], "open").suppliers[0]?.drift).toBeNull();
  });
  it("validates saved layouts, removes duplicates and keeps every available widget", () => {
    const prefs = readDashboard({ order: ["customers", "customers", "fake"], hidden: ["freight", "fake"], scope: "fake" }, "om");
    expect(prefs.order[0]).toBe("customers"); expect(prefs.order).toHaveLength(WIDGETS.length);
    expect(prefs.hidden).toEqual(["freight"]); expect(prefs.scope).toBe("open");
    expect(defaultDashboard("buyer").order[0]).toBe("suppliers");
  });
  it("practice freight calculates a concrete estimate and never mutates its source", () => {
    const parts = practiceParts(); const before = structuredClone(parts); const p = parts[0]; if (!p) throw new Error("fixture required");
    expect(expediteComparison(parts, p.id, 2, 1800, 0, "dual")?.netSaving).toBe(3200);
    expect(parts).toEqual(before);
  });
  it("practice updates use separate objects and extracted changes are only proposals", () => {
    const original = practiceParts(); const p = original[0]; const o = p?.orders?.[0]; if (!p || !o) throw new Error("fixture required");
    expect(sanitizeExtraction({ updates: [{ partNumber: p.partNumber, daysLate: 8 }] }, original)[0]?.to).toBe(8);
    expect(p.daysLate).toBe(4);
    const changed = applyOrderPatch(original, o.so, { committed: "2026-11-18T00:00:00Z" }, { kind: "date", at: "2026-11-12", by: "Tester", text: "approved" });
    expect(changed[0]?.orders?.[0]?.committed).toBe("2026-11-18T00:00:00Z");
    expect(original[0]?.orders?.[0]?.committed).toBe("2026-11-12T00:00:00Z");
  });
});