import { describe, it, expect } from "vitest";
import { buildSeed, validateOrderChange, applyOrderPatch, orderSlipDays, orderExposure, computeCommercialKpis, expediteComparison, uniqueOrderRows, ROLE_VIEWS } from "./shortages";
const first = buildSeed()[0];
if (!first) throw new Error("Seed required");
const order = { so: "SO-1", customer: "Customer", strategic: true, committed: "2026-11-12T00:00:00Z", value: 1000, penaltyPerDay: 2500 };
const part = { ...first, targetBuild: "2026-11-10T00:00:00Z", daysLate: 6, orders: [order] };
describe("order operations", () => {
  it("provides four role lenses without changing the board", () => expect(ROLE_VIEWS.map((r) => r.id)).toEqual(["planner", "om", "buyer", "manager"]));
  it("requires an earlier confirmed date for pull-in", () => { expect(validateOrderChange(order, "pull_in", "2026-11-11", "air")).toBe(true); expect(validateOrderChange(order, "pull_in", "2026-11-12", "air")).toBe(false); });
  it("requires a later confirmed date for push-out", () => { expect(validateOrderChange(order, "push_out", "2026-11-13", "sea")).toBe(true); expect(validateOrderChange(order, "push_out", "2026-11-11", "sea")).toBe(false); });
  it("rejects invalid dates and unknown freight modes", () => { expect(validateOrderChange(order, "standard", "2026-02-30", "road")).toBe(false); expect(validateOrderChange(order, "standard", "2026-11-12", "teleport")).toBe(false); });
  it("accepts air, road, sea and express freight", () => { for (const mode of ["air", "road", "sea", "express"]) expect(validateOrderChange(order, "standard", "2026-11-12", mode)).toBe(true); });
  it("cancellation excludes commercial exposure but preserves physical shortage", () => {
    const cancelled = { ...order, status: "cancelled" as const }; const p = { ...part, orders: [cancelled] };
    expect(orderSlipDays(p, cancelled)).toBe(0); expect(orderExposure(p)).toBe(0);
    expect(computeCommercialKpis([p])).toEqual({ tier1Orders: 0, otifOrders: 0, projectedPenalties: 0, dailyPenalties: 0 }); expect(p.qtyPending).toBe(120); expect(p.riskScore).toBe(96);
  });
  it("approved date changes recalculate delay without altering shortage risk", () => { expect(orderSlipDays(part, { ...order, committed: "2026-11-11T00:00:00Z" })).toBe(5); expect(orderSlipDays(part, { ...order, committed: "2026-11-20T00:00:00Z" })).toBe(0); });
  it("updates all order occurrences and logs each atomically", () => {
    const rows = applyOrderPatch([part, { ...part, id: "p2" }], order.so, { status: "push_out", freightMode: "sea" }, { at: "2026-11-12T00:00:00Z", by: "Planner", kind: "date", text: "approved" });
    expect(rows.map((p) => p.orders?.[0]?.freightMode)).toEqual(["sea", "sea"]); expect(rows.map((p) => p.timeline[0]?.text)).toEqual(["approved", "approved"]); expect(uniqueOrderRows(rows)).toHaveLength(1);
  });
  it("compares extra freight against penalty and entered downtime assumptions", () => expect(expediteComparison([part], part.id, 2, 1800, 1000, "dual")).toEqual({ penaltySaving: 5000, downtimeSaving: 2000, grossSaving: 7000, netSaving: 5200 }));
  it("retains other blockers on the same sales order", () => expect(expediteComparison([part, { ...part, id: "p2" }], part.id, 2, 1800, 0, "dual")?.penaltySaving).toBe(0));
  it("tiers-only never counts penalty savings", () => expect(expediteComparison([part], part.id, 2, 1800, 1000, "tiers")?.netSaving).toBe(200));
  it("rejects fractional days, negative costs and delivered scenarios", () => { expect(expediteComparison([part], part.id, 1.5, 0, 0, "dual")).toBeNull(); expect(expediteComparison([part], part.id, 1, -1, 0, "dual")).toBeNull(); expect(expediteComparison([{ ...part, stage: "delivered" }], part.id, 1, 0, 0, "dual")).toBeNull(); });
});
