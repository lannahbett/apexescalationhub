import { describe, it, expect } from "vitest";
import { riskTier, computeKpis, buildSeed, demandSurgePct, isAbnormalDemand, leadTimeDriftPct, orderSlipDays, filterParts } from "./shortages";

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
