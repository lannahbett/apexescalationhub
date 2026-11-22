import { describe, expect, it } from "vitest";
import { buildSeed, type Part } from "./shortages";
import { buildGuidance, guidanceRoleFor } from "./copilot-guidance";

const base = (): Part => { const p = structuredClone(buildSeed()[0]!); p.stage = "sourcing"; p.confidence = "high"; p.hoursToLineStop = 100; p.orders = []; delete p.demand; delete p.leadTime; return p; };

describe("copilot guidance", () => {
  it("flags line stops under 24h for planners", () => {
    const p = { ...base(), hoursToLineStop: 10 };
    expect(buildGuidance([p], "dual").some((g) => g.role === "planner" && g.id.endsWith(":linestop"))).toBe(true);
    expect(buildGuidance([{ ...p, hoursToLineStop: 24 }], "dual").some((g) => g.id.endsWith(":linestop"))).toBe(false);
  });
  it("skips delivered parts", () => {
    expect(buildGuidance([{ ...base(), hoursToLineStop: 5, stage: "delivered" }], "dual")).toEqual([]);
  });
  it("sends stalled supply to buyers", () => {
    expect(buildGuidance([{ ...base(), confidence: "stalled" }], "dual").map((g) => g.role)).toContain("buyer");
  });
  it("hides penalties in tiers mode and states daily break-even in penalty mode", () => {
    const p = { ...base(), targetBuild: "2026-12-10", daysLate: 5, orders: [{ so: "SO-1", customer: "Acme", committed: "2026-12-10", value: 1000, slipDays: 0, strategic: false, penaltyPerDay: 2000, penaltyGraceDays: 0 } as never] };
    const tiers = buildGuidance([p], "tiers").find((g) => g.role === "om")!;
    expect(tiers.facts.join(" ")).not.toMatch(/penalty/i);
    const pen = buildGuidance([p], "penalties").find((g) => g.role === "om")!;
    expect(pen.facts.join(" ")).toMatch(/Projected penalty/);
    expect(pen.action).toMatch(/per day saved/);
  });
  it("shows managers every role", () => { expect(guidanceRoleFor("manager")).toBe("all"); expect(guidanceRoleFor("buyer")).toBe("buyer"); });
  it("does not mutate parts", () => { const p = { ...base(), hoursToLineStop: 3 }; const before = JSON.stringify(p); buildGuidance([p], "dual"); expect(JSON.stringify(p)).toBe(before); });
});
