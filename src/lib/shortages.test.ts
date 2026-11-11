import { describe, it, expect } from "vitest";
import { riskTier, computeKpis, buildSeed } from "./shortages";

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
