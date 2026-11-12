import { describe, expect, it } from "vitest";
import { FIELDS, autoMapping, parseCsv, validateReport, exportRows, csvContent, MAX_ROWS } from "./data-exchange";
import { applyReportParts, buildSeed } from "./shortages";

const seed = buildSeed();
const first = seed[0];
if (!first) throw new Error("Missing seed");
const grid = () => ({ name: "Test", headers: FIELDS.map((f) => f[1]), rows: exportRows([first]) });
const mapping = autoMapping(grid().headers);
const log = { at: "2026-11-12T00:00:00Z", by: "Test", kind: "note" as const, text: "Import" };
const column = (key: string) => FIELDS.findIndex((f) => f[0] === key);

describe("report exchange", () => {
  it("reads quoted commas, multiline fields, escaped quotes and semicolon CSV", () => {
    expect(parseCsv('part;description\n001;"Motor, large\nrev ""A"""').rows).toEqual([["001", 'Motor, large\nrev "A"']]);
  });
  it("rejects more than 5000 rows", () => {
    expect(() => parseCsv("a\n" + Array(MAX_ROWS + 1).fill("b").join("\n"))).toThrow("5,000");
  });
  it("round-trips all shortage, customer, demand, lead-time and freight values", () => {
    const original = { ...first, inboundFreight: "sea" as const, inboundReference: "00123" };
    const g = { ...grid(), rows: exportRows([original]) };
    const r = validateReport(parseCsv(csvContent([g.headers, ...g.rows])), mapping, [], "replace");
    expect(r.errors).toEqual([]);
    expect(r.parts).toHaveLength(1);
    expect(r.parts[0]).toMatchObject({ partNumber: first.partNumber, valueAtRisk: 412000, qtyPending: 120, inboundFreight: "sea", inboundReference: "00123", demand: first.demand, leadTime: first.leadTime });
    expect(r.parts[0]?.orders?.[0]?.penaltyPerDay).toBe(2500);
  });
  it("requires operational inputs rather than inventing risk scores or line-stop times", () => {
    const m = { ...mapping, hoursToLineStop: undefined, riskScore: undefined };
    expect(validateReport(grid(), m, [], "replace").errors[0]?.message).toContain("hours_to_line_stop, risk_score");
  });
  it("rejects impossible dates and risk above 100", () => {
    const g = grid();
    const row = g.rows[0]; if (!row) throw new Error("Missing row");
    row[column("targetBuild")] = "2026-02-30";
    expect(validateReport(g, mapping, [], "replace").errors[0]?.message).toContain("calendar date");
    row[column("targetBuild")] = "2026-11-12"; row[column("riskScore")] = "101";
    expect(validateReport(g, mapping, [], "replace").errors[0]?.message).toContain("riskScore");
  });
  it("rejects negative quantities and ambiguous decimal numbers", () => {
    for (const value of ["-1", "1,200", "1e3", "Infinity"]) {
      const g = grid(); const row = g.rows[0]; if (!row) throw new Error("Missing row");
      row[column("qtyPending")] = value;
      expect(validateReport(g, mapping, [], "replace").errors).toHaveLength(1);
    }
  });
  it("rejects inconsistent customer order terms", () => {
    const g = grid(); const row = g.rows[0]; if (!row) throw new Error("Missing row");
    const second = [...row]; second[column("orderValue")] = "1"; g.rows.push(second);
    expect(validateReport(g, mapping, [], "replace").errors[0]?.message).toContain("Conflicting terms");
  });
  it("merges without duplicating shortages and preserves notes and checklists", () => {
    const incoming = validateReport(grid(), mapping, seed, "merge").parts;
    const next = applyReportParts(seed, incoming, "merge", log);
    expect(next).toHaveLength(14);
    expect(next[0]?.timeline.slice(1)).toEqual(first.timeline);
    expect(next[0]?.checklist).toEqual(first.checklist);
    expect(next[1]).toEqual(seed[1]);
  });
  it("replaces only with incoming data, without sample signal backfill", () => {
    const g = grid(); const m = { ...mapping, baselineWeekly: undefined, actualWeekly: undefined, driver: undefined, erpDays: undefined, actualDays: undefined, otdPct: undefined };
    const next = applyReportParts(seed, validateReport(g, m, seed, "replace").parts, "replace", log);
    expect(next).toHaveLength(1); expect(next[0]?.demand).toBeUndefined(); expect(next[0]?.leadTime).toBeUndefined();
  });
  it("propagates shared order terms to untouched shortage links", () => {
    const order = first.orders?.[0]; if (!order) throw new Error("Missing order");
    const shared = { ...first, id: "other", partNumber: "OTHER", orders: [order] };
    const incoming = { ...first, orders: [{ ...order, committed: "2026-12-01", status: "push_out" as const }] };
    const next = applyReportParts([first, shared], [incoming], "merge", log);
    expect(next[1]?.orders?.[0]?.committed).toBe("2026-12-01"); expect(next[1]?.timeline[0]).toEqual(log);
  });
  it("does not let retained old order terms overwrite a newly imported shared commitment", () => {
    const order = first.orders?.[0]; if (!order) throw new Error("Missing order");
    const other = { ...first, partNumber: "OTHER", id: "other", orders: [order] };
    const rows = [...exportRows([{ ...first, orders: [{ ...order, committed: "2026-12-01" }] }]), ...exportRows([{ ...other, orders: [] }])];
    const r = validateReport({ ...grid(), rows }, mapping, [first, other], "merge");
    expect(r.errors).toEqual([]);
    expect(r.parts[1]?.orders?.[0]?.committed).toBe("2026-12-01");
    const next = applyReportParts([first, other], r.parts, "merge", log);
    expect(next[0]?.orders?.[0]?.committed).toBe("2026-12-01");
  });
  it("escapes spreadsheet formula injection on CSV export", () => {
    expect(csvContent([["=HYPERLINK(1)", "+cmd", "@SUM(1)"]])).toContain("'=HYPERLINK(1)");
  });
  it("rejects a mapped column being reused", () => {
    expect(validateReport(grid(), { ...mapping, po: mapping.partNumber }, [], "replace").errors[0]?.message).toContain("mapped once");
  });
});