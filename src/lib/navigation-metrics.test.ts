import { describe, expect, it } from "vitest";
import { buildSeed, requiredShippingDocs, type RecoveryRecord } from "./shortages";
import { navigationMetrics } from "./navigation-metrics";

describe("whole-board navigation metrics", () => {
  it("counts all 14 parts but only the four open critical parts", () => {
    const parts = buildSeed();
    const first = parts[0];
    if (!first) throw new Error("Missing seed part");
    expect(navigationMetrics(parts).board.count).toBe(14);
    expect(navigationMetrics(parts).dashboard.count).toBe(4);
    first.stage = "delivered";
    expect(navigationMetrics(parts).dashboard.count).toBe(3);
    expect(navigationMetrics(parts).board.count).toBe(14);
  });
  it("counts a pegged order once, excludes cancellations and updates when ready", () => {
    const parts = buildSeed().slice(0, 2);
    const source = parts[0]?.orders?.[0];
    if (!source) throw new Error("Missing seed order");
    const order = { ...source, freightMode: "road" as const, status: "standard" as const, shipping: {} };
    parts.forEach((part) => { part.orders = [{ ...order }]; });
    expect(navigationMetrics(parts).shipping.count).toBe(1);
    parts.forEach((part) => { part.orders = [{ ...order, shipping: { refs: Object.fromEntries(requiredShippingDocs(order).map((doc) => [doc, "DOC-1"])) } }]; });
    expect(navigationMetrics(parts).shipping.count).toBe(0);
    parts.forEach((part) => { part.orders = [{ ...order, status: "cancelled" }]; });
    expect(navigationMetrics(parts).shipping.count).toBe(0);
  });
  it("counts only recorded nonclosed follow-ups and updates after closure", () => {
    const parts = buildSeed({ improvementExamples: false });
    const first = parts[0];
    if (!first) throw new Error("Missing seed part");
    expect(navigationMetrics(parts).improvement.count).toBe(0);
    const record: RecoveryRecord = { id: "r", recoveredAt: "2026-11-14T00:00:00Z", by: "Planner", cause: "planning", why: "", cost: null, owner: "Planner", reference: "", action: "Review PO", status: "open", supplier: first.supplier, partNumber: first.partNumber };
    first.recoveries = [record];
    expect(navigationMetrics(parts).improvement.count).toBe(1);
    record.status = "closed";
    expect(navigationMetrics(parts).improvement.count).toBe(0);
  });
});