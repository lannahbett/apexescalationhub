import { describe, expect, it } from "vitest";
import { buildSeed, requestSource, sliceLines, stockProjection, STANDUP_SECONDS, standupParts } from "./shortages";

const part = buildSeed()[0];
if (!part) throw new Error("Missing fixture");
describe("plant triage", () => {
  it("records a qualified request once without changing PO, stock, stage or supplier", () => {
    const next = requestSource(part, "sister", "2026-11-14T00:00:00Z", "Planner");
    expect(next?.sourcingRequests).toEqual([{ optionId: "sister", at: "2026-11-14T00:00:00Z", by: "Planner", status: "requested" }]);
    expect(next?.po).toBe(part.po); expect(next?.stock).toEqual(part.stock); expect(next?.stage).toBe(part.stage); expect(next?.supplier).toBe(part.supplier);
    if (!next) throw new Error("Request failed");
    expect(requestSource(next, "sister", "2026-11-14T00:00:00Z", "Planner")).toBeNull();
  });
  it("rejects unqualified, unavailable, unreferenced and delivered options", () => {
    for (const patch of [{ qualified: false }, { available: 0 }, { approvalRef: "" }]) {
      expect(requestSource({ ...part, sourcingOptions: (part.sourcingOptions ?? []).map((o) => ({ ...o, ...patch })) }, "sister", "2026-11-14", "Planner")).toBeNull();
    }
    expect(requestSource({ ...part, stage: "delivered" }, "sister", "2026-11-14", "Planner")).toBeNull();
  });
  it("shows an exact stockout gap and does not use inbound stock before ETA", () => {
    const result = stockProjection({ asOf: "2026-11-14T00:00:00Z", onHand: 20, dailyUsage: 40, eta: "2026-11-15T00:00:00Z", inboundQty: 80 });
    expect(result?.stockoutHours).toBe(12); expect(result?.gapHours).toBe(12);
    expect(result?.points.find((p) => p.hour === 16)?.qty).toBe(0);
    expect(result?.points.filter((p) => p.hour === 24).map((p) => p.qty)).toEqual([0, 80]);
    expect(stockProjection()).toBeNull();
    expect(stockProjection({ asOf: "2026-11-14", onHand: 20, dailyUsage: 0, eta: "2026-11-15", inboundQty: 80 })).toBeNull();
  });
  it("slices assembly lines exactly", () => {
    expect(sliceLines(buildSeed(), "Line A - Robotics").length).toBe(4);
    expect(sliceLines(buildSeed(), "all").length).toBe(14);
  });
});
describe("standup baseline", () => {
  it("selects the five highest-risk open parts", () => { expect(standupParts(buildSeed()).map((p) => p.riskScore)).toEqual([96, 91, 88, 84, 79]); });
  it("uses three minutes per part", () => { expect(STANDUP_SECONDS).toBe(180); });
  it("restores 14 clean sample parts", () => { expect(buildSeed()).toHaveLength(14); expect(buildSeed().every((p) => !p.sourcingRequests?.length && !p.recoveries?.length)).toBe(true); });
});