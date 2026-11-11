import { describe, expect, it } from "vitest";
import { buildSeed } from "./shortages";
import { sanitizeExtraction } from "./ai-parse";

const parts = buildSeed();
const p = parts[0]!;

describe("sanitizeExtraction", () => {
  it("drops parts not on the board", () => {
    expect(sanitizeExtraction({ updates: [{ partNumber: "NOPE-1", stage: "transit" }] }, parts)).toEqual([]);
  });
  it("drops invalid stage and confidence values", () => {
    expect(sanitizeExtraction({ updates: [{ partNumber: p.partNumber, stage: "shipped", confidence: "maybe" }] }, parts)).toEqual([]);
  });
  it("rejects days late outside 0–365", () => {
    expect(sanitizeExtraction({ updates: [{ partNumber: p.partNumber, daysLate: 400 }] }, parts)).toEqual([]);
  });
  it("keeps a valid changed stage", () => {
    const to = p.stage === "customs" ? "transit" : "customs";
    const r = sanitizeExtraction({ updates: [{ partNumber: p.partNumber.toLowerCase(), stage: to }] }, parts);
    expect(r).toHaveLength(1);
    expect(r[0]!.to).toBe(to);
  });
});
