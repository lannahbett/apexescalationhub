import { describe, expect, it } from "vitest";
import { buildSeed, filterParts, improvementAnalysis, validRecovery, type RecoveryRecord } from "./shortages";

const first = buildSeed()[0];
if (!first) throw new Error("Fixture required");
const recovery: RecoveryRecord = { id: "r1", recoveredAt: "2026-11-13T10:00:00Z", by: "Planner", cause: "customs", why: "Missing papers", cost: 1200, owner: "Buyer", reference: "8D-1", action: "Review documentation", status: "open", supplier: first.supplier, partNumber: first.partNumber };
describe("lead-time quick filter", () => {
  it("includes 50 percent, excludes 49 percent and missing signals, and applies search", () => {
    const rows = [{ ...first, id: "50", leadTime: { erpDays: 100, actualDays: 150, otdPct: 80 } }, { ...first, id: "49", leadTime: { erpDays: 100, actualDays: 149, otdPct: 80 } }, { ...first, id: "none", leadTime: undefined }];
    expect(filterParts(rows, "leadtime", "").map((p) => p.id)).toEqual(["50"]);
    expect(filterParts(rows, "leadtime", "not-a-supplier")).toEqual([]);
  });
});
describe("recovery records", () => {
  it("requires a recognized root cause", () => {
    expect(validRecovery(recovery)).toBe(true);
    expect(validRecovery({ ...recovery, cause: "invalid" as RecoveryRecord["cause"] })).toBe(false);
  });
  it("allows unknown cost but rejects negative and non-finite actual cost", () => {
    expect(validRecovery({ ...recovery, cost: null })).toBe(true);
    expect(validRecovery({ ...recovery, cost: -1 })).toBe(false);
    expect(validRecovery({ ...recovery, cost: Infinity })).toBe(false);
  });
  it("requires an owner and preventive action to close follow-up", () => {
    expect(validRecovery({ ...recovery, status: "closed" })).toBe(true);
    expect(validRecovery({ ...recovery, status: "closed", owner: "" })).toBe(false);
    expect(validRecovery({ ...recovery, status: "closed", action: "" })).toBe(false);
  });
  it("does not fabricate recovery history for already delivered seed parts", () => {
    expect(improvementAnalysis(buildSeed()).records).toEqual([]);
  });
  it("counts recovery episodes, cumulative Pareto and actual costs without commercial exposure", () => {
    const part = { ...first, recoveries: [recovery, { ...recovery, id: "r2", cost: null }, { ...recovery, id: "r3", cause: "planning" as const, cost: 300, status: "closed" as const }] };
    const data = improvementAnalysis([part]);
    expect(data.pareto.map((r) => [r.count, r.cumulativePct])).toEqual([[2, 67], [1, 100]]);
    expect(data.totalCost).toBe(1500);
    expect(data.knownCosts).toBe(2);
    expect(data.openActions).toBe(2);
  });
  it("flags more than two starts in 30 days, not ordinary stage changes or older events", () => {
    const now = Date.parse("2026-11-13T12:00:00Z");
    const timeline = [{ at: "2026-10-15T12:00:00Z", kind: "note" as const, text: "Shortage flagged by MRP run: 120 pcs uncovered", by: "ERP" }, ...["2026-11-01", "2026-11-05"].map((d) => ({ at: `${d}T12:00:00Z`, kind: "stage" as const, text: "Escalation reopened: Stage moved to 1.", by: "Planner" }))];
    expect(improvementAnalysis([{ ...first, timeline }], now).parts[0]?.count).toBe(3);
    expect(improvementAnalysis([{ ...first, timeline: timeline.slice(1) }], now).parts).toEqual([]);
    expect(improvementAnalysis([{ ...first, timeline: timeline.map((t) => ({ ...t, text: "Stage moved" })) }], now).parts).toEqual([]);
    expect(improvementAnalysis([{ ...first, timeline }], now + 31 * 86400000).parts).toEqual([]);
  });
});