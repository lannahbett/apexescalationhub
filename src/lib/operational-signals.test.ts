import { describe, expect, it } from "vitest";
import { buildSeed, earlyWarningParts, filterParts, hasImminentLineRisk, operationalSignals } from "./shortages";

const sample = buildSeed()[0];
if (!sample) throw new Error("Sample part required");
const { stock: _stock, ...part } = sample;

describe("daily operating signals", () => {
  it("flags only open parts with a recorded line stop below 24 hours", () => {
    expect(hasImminentLineRisk({ ...part, hoursToLineStop: 23 })).toBe(true);
    expect(hasImminentLineRisk({ ...part, hoursToLineStop: 24 })).toBe(false);
    expect(hasImminentLineRisk({ ...part, hoursToLineStop: 0 })).toBe(true);
    expect(hasImminentLineRisk({ ...part, hoursToLineStop: -1 })).toBe(false);
    expect(hasImminentLineRisk({ ...part, hoursToLineStop: NaN })).toBe(false);
    expect(hasImminentLineRisk({ ...part, stage: "delivered" })).toBe(false);
  });
  it("uses explicit snapshots for under-24-hour stock warnings, not shortage quantities", () => {
    const stock = { asOf: "2026-11-21T08:00:00Z", eta: "2026-11-23T08:00:00Z", onHand: 23, dailyUsage: 24, inboundQty: 100 };
    const safeLine = { ...part, hoursToLineStop: 72, qtyPending: 1 };
    expect(earlyWarningParts([safeLine])).toHaveLength(0);
    expect(earlyWarningParts([{ ...safeLine, stock }])).toHaveLength(1);
    expect(earlyWarningParts([{ ...safeLine, stock: { ...stock, onHand: 24 } }])).toHaveLength(0);
    expect(earlyWarningParts([{ ...safeLine, stock, stage: "delivered" }])).toHaveLength(0);
  });
  it("counts distinct recorded risk lines and leaves input records unchanged", () => {
    const parts = [part, { ...part, id: "same-line" }, { ...part, id: "cleared", line: "Other", stage: "delivered" as const }];
    const before = JSON.stringify(parts);
    expect(operationalSignals(parts).lines).toBe(1);
    expect(operationalSignals(parts).imminent).toHaveLength(2);
    expect(JSON.stringify(parts)).toBe(before);
  });
  it("component filter retains search and excludes cleared or non-imminent parts", () => {
    expect(filterParts([part, { ...part, id: "safe", hoursToLineStop: 24 }, { ...part, id: "done", stage: "delivered" }], "component", part.partNumber).map((p) => p.id)).toEqual([part.id]);
    expect(filterParts([part], "component", "not-a-part")).toHaveLength(0);
  });
});