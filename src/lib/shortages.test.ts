import { describe, it, expect } from "vitest";
import { riskTier, computeKpis, buildSeed, demandSurgePct, isAbnormalDemand, leadTimeDriftPct, orderSlipDays, filterParts, customerTier, commercialVisibility, projectedPenalty, computeCommercialKpis, validateCommercialTerms } from "./shortages";

describe("risk tiers", () => {
  it("80+ is critical", () => { expect(riskTier(80)).toBe("critical"); expect(riskTier(100)).toBe("critical"); });
  it("50–79 is elevated", () => { expect(riskTier(50)).toBe("elevated"); expect(riskTier(79)).toBe("elevated"); });
  it("<50 is monitored", () => { expect(riskTier(49)).toBe("monitored"); });
});

describe("kpis", () => {
  it("excludes delivered parts and counts lines within 48h", () => {
    const parts = buildSeed();
    const k = computeKpis(parts);
    expect(k.activeCount).toBe(12);
    expect(k.linesAtRisk).toBe(3);
  });
});

describe("demand & lead time", () => {
  it("abnormal demand starts at +30% over baseline", () => {
    expect(isAbnormalDemand({ baselineWeekly: 100, actualWeekly: 130, driver: "" })).toBe(true);
    expect(isAbnormalDemand({ baselineWeekly: 100, actualWeekly: 129, driver: "" })).toBe(false);
    expect(demandSurgePct({ baselineWeekly: 40, actualWeekly: 74, driver: "" })).toBe(85);
  });
  it("lead-time drift compares actual to ERP", () => {
    expect(leadTimeDriftPct({ erpDays: 12, actualDays: 21, otdPct: 80 })).toBe(75);
  });
  it("abnormal demand filter only returns surging parts", () => {
    const r = filterParts(buildSeed(), "demand", "");
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((p) => isAbnormalDemand(p.demand))).toBe(true);
  });
});

describe("customer order slip", () => {
  it("counts days projected availability overshoots commit", () => {
    const p = { ...buildSeed()[0]!, targetBuild: "2026-11-10T00:00:00Z", daysLate: 3 };
    expect(orderSlipDays(p, { so: "", customer: "", strategic: false, committed: "2026-11-11T00:00:00Z", value: 0, penaltyPerDay: 0 })).toBe(2);
    expect(orderSlipDays(p, { so: "", customer: "", strategic: false, committed: "2026-11-20T00:00:00Z", value: 0, penaltyPerDay: 0 })).toBe(0);
  });
});

describe("commercial tracking", () => {
  const first = buildSeed()[0];
  if (!first) throw new Error("Seed part required");
  const part = { ...first, targetBuild: "2026-11-10T00:00:00Z", daysLate: 6, stage: "sourcing" as const };
  const order = { so: "SO-1", customer: "Test", strategic: true, committed: "2026-11-12T00:00:00Z", value: 1000, penaltyPerDay: 2500, penaltyGraceDays: 3 };
  it("dual mode enables both models", () => expect(commercialVisibility("dual")).toEqual({ tiers: true, penalties: true }));
  it("tiers-only hides penalties", () => expect(commercialVisibility("tiers")).toEqual({ tiers: true, penalties: false }));
  it("penalties-only hides tiers", () => expect(commercialVisibility("penalties")).toEqual({ tiers: false, penalties: true }));
  it("offers three customer tiers and preserves legacy strategic status", () => {
    expect(customerTier(order)).toBe("tier1");
    expect(customerTier({ ...order, tier: "tier2" })).toBe("tier2");
    expect(customerTier({ ...order, strategic: false })).toBe("tier3");
  });
  it("deducts three grace days from four projected slip days", () => expect(projectedPenalty(part, order)).toEqual({ chargeableDays: 1, total: 2500 }));
  it("charges nothing within grace or without a penalty clause", () => {
    expect(projectedPenalty({ ...part, daysLate: 5 }, order).total).toBe(0);
    expect(projectedPenalty(part, { ...order, penaltyPerDay: 0 }).total).toBe(0);
  });
  it("deduplicates sales orders and excludes delivered parts", () => {
    expect(computeCommercialKpis([{ ...part, orders: [order] }, { ...part, id: "other", orders: [order] }, { ...part, stage: "delivered", orders: [{ ...order, so: "SO-2" }] }])).toEqual({ tier1Orders: 1, otifOrders: 1, projectedPenalties: 2500, dailyPenalties: 2500 });
  });
  it("allows opting out of OTIF tracking", () => expect(computeCommercialKpis([{ ...part, orders: [{ ...order, otifImpact: false }] }]).otifOrders).toBe(0));
  it("rejects negative or invalid terms and accepts zero penalties", () => {
    expect(validateCommercialTerms("tier2", 0, 365)).toBe(true);
    expect(validateCommercialTerms("tier2", -1, 0)).toBe(false);
    expect(validateCommercialTerms("tier2", 1, 1.5)).toBe(false);
    expect(validateCommercialTerms("tier2", Infinity, 0)).toBe(false);
    expect(validateCommercialTerms("tier2", 1, 366)).toBe(false);
    expect(validateCommercialTerms("unknown", 1, 0)).toBe(false);
  });
});
