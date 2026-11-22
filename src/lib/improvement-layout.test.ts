import { describe, expect, it } from "vitest";
import { defaultCiLayout, moveCiSection, readCiLayout } from "./improvement-layout";
describe("continuous improvement layout", () => {
  it("moves a section and refuses to move past the edges", () => {
    const l = defaultCiLayout();
    expect(moveCiSection(l, "register", -1).order).toEqual(["kpis", "pareto", "register", "repeats"]);
    expect(moveCiSection(l, "kpis", -1)).toBe(l);
  });
  it("keeps every section reachable after reading a partial or tampered layout", () => {
    const r = readCiLayout({ order: ["register", "bogus"], hidden: ["pareto", "x"], compact: false });
    expect(r.order).toEqual(["register", "kpis", "pareto", "repeats"]);
    expect(r.hidden).toEqual(["pareto"]);
    expect(r.compact).toBe(false);
  });
});
