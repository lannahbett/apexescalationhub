import Papa from "papaparse";
import { CONFIDENCE, STAGES, FREIGHT_MODES, ORDER_STATUSES, customerTier, computeKpis, computeCommercialKpis, CURRENT_USER, type Part, type CustomerOrder } from "./shortages";

export const FIELDS = [
  ["partNumber", "part_number", true], ["description", "description", true], ["category", "category", false],
  ["line", "line", true], ["targetBuild", "target_build_date", true], ["qtyPending", "qty_pending", true],
  ["uom", "uom", true], ["daysLate", "days_late", true], ["valueAtRisk", "value_at_risk_eur", true],
  ["hoursToLineStop", "hours_to_line_stop", true], ["riskScore", "risk_score", true],
  ["planner", "planner", true], ["supplier", "supplier", true], ["supplierContact", "supplier_contact", false],
  ["po", "po_number", true], ["stage", "stage", false], ["confidence", "confidence", false],
  ["inboundFreight", "inbound_freight", false], ["inboundReference", "inbound_reference", false],
  ["so", "sales_order", false], ["customer", "customer", false], ["committed", "committed_date", false],
  ["orderValue", "order_value_eur", false], ["tier", "customer_tier", false],
  ["penaltyPerDay", "penalty_per_day_eur", false], ["penaltyGraceDays", "penalty_grace_days", false],
  ["otifImpact", "otif_impact", false], ["status", "order_status", false], ["originalCommitted", "original_committed_date", false],
  ["freightMode", "outbound_freight", false], ["transportReference", "outbound_reference", false],
  ["baselineWeekly", "baseline_weekly", false], ["actualWeekly", "actual_weekly", false], ["driver", "demand_driver", false],
  ["erpDays", "erp_lead_days", false], ["actualDays", "actual_lead_days", false], ["otdPct", "supplier_otd_pct", false],
] as const;
export type Field = typeof FIELDS[number][0];
export type Mapping = Partial<Record<Field, number | undefined>>;
export type Grid = { name: string; headers: string[]; rows: string[][] };
export const MAX_ROWS = 5000;
const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
/** SAP ECC technical field names and common ALV column titles (MD04, ME2M, ME2N, VA05). */
export const SAP_ALIASES: Partial<Record<Field, string[]>> = {
  partNumber: ["MATNR", "Material"], description: ["MAKTX", "TXZ01", "Short text", "Material description"],
  po: ["EBELN", "Purchasing document", "Purch.doc."], supplier: ["LIFNR", "NAME1", "Vendor", "Supplier name"],
  targetBuild: ["BDTER", "EINDT", "Requirements date", "Delivery date"], qtyPending: ["WEMNG_OPEN", "Still to be delivered (qty)", "Open quantity", "MENGE"],
  uom: ["MEINS", "BPRME", "Order unit", "Base unit of measure"], planner: ["DISPO", "MRP controller"], line: ["ARBPL", "Work center"],
  so: ["VBELN", "Sales document"], customer: ["KUNNR", "Sold-to party", "Customer name"], committed: ["EDATU", "Schedule line date"], orderValue: ["NETWR", "Net value"],
};
export function isSapLayout(headers: string[]) {
  const tech = ["MATNR", "EBELN", "LIFNR", "EINDT", "BDTER", "MEINS", "DISPO", "VBELN", "WERKS"];
  return headers.filter((h) => tech.includes(h.trim().toUpperCase())).length >= 2;
}
export function autoMapping(headers: string[]): Mapping {
  return Object.fromEntries(FIELDS.flatMap(([key, label]) => {
    const names = [key, label, ...(SAP_ALIASES[key] ?? [])].map(normalize);
    const index = headers.findIndex((h) => names.includes(normalize(h)));
    return index < 0 ? [] : [[key, index]];
  }));
}
export function parseCsv(text: string): Grid {
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { skipEmptyLines: "greedy" });
  const errors = result.errors.filter((e) => e.code !== "UndetectableDelimiter");
  if (errors.length) throw new Error(`CSV could not be read: ${errors[0]?.message}`);
  return makeGrid("CSV", result.data);
}
function makeGrid(name: string, data: string[][]): Grid {
  const [headers, ...rows] = data;
  if (!headers?.length || !rows.length) throw new Error("The report needs a header row and at least one data row.");
  if (rows.length > MAX_ROWS) throw new Error(`Maximum ${MAX_ROWS.toLocaleString()} data rows per import.`);
  if (headers.length > 100) throw new Error("Maximum 100 columns per report.");
  if (rows.some((r) => r.length !== headers.length)) throw new Error("Rows have different column counts. Check the report delimiter and headers.");
  return { name, headers: headers.map((h) => h.trim()), rows };
}
export async function readReport(file: File): Promise<Grid[]> {
  if (file.size > 10 * 1024 * 1024) throw new Error("Maximum file size is 10 MB.");
  if (/\.csv$/i.test(file.name)) return [parseCsv(await file.text())];
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Choose a .csv or .xlsx file. Save legacy .xls reports as .xlsx first.");
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  await wb.xlsx.load(await file.arrayBuffer());
  const grids: Grid[] = [];
  wb.eachSheet((sheet) => {
    if (sheet.state !== "visible" || sheet.rowCount < 2) return;
    if (sheet.rowCount > MAX_ROWS + 1 || sheet.columnCount > 100) throw new Error(`Sheet ${sheet.name} exceeds the import limits.`);
    const rows: string[][] = [];
    sheet.eachRow((row) => {
      const cells = Array.from({ length: sheet.columnCount }, (_, i) => {
        const cell = row.getCell(i + 1);
        if (cell.type === 6) return "[FORMULA, replace with value]";
        return cell.value instanceof Date ? cell.value.toISOString().slice(0, 10) : cell.text;
      });
      if (cells.some((c) => c.trim())) rows.push(cells);
    });
    if (rows.length > 1) grids.push(makeGrid(sheet.name, rows));
  });
  if (!grids.length) throw new Error("No visible worksheets with data were found.");
  return grids;
}
export const partKey = (p: Pick<Part, "partNumber" | "po" | "line">) => JSON.stringify([p.partNumber, p.po, p.line]);
function date(raw: string) {
  const sap = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw);
  const value = sap ? `${sap[3]}-${sap[2]}-${sap[1]}` : raw;
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) throw new Error("date must be YYYY-MM-DD");
  const d = value.slice(0, 10);
  const parsed = new Date(`${d}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== d) throw new Error("invalid calendar date");
  return d;
}
/** SAP German-locale numbers (1.234,50 or 12,5); "1,200" stays ambiguous and is rejected; plain dots stay decimal points. */
export function sapNumber(v: string) {
  if (!/^\d{1,3}(?:\.\d{3})+,\d+$|^\d+,(?:\d{1,2}|\d{4,})$/.test(v)) return undefined;
  return Number(v.replace(/\./g, "").replace(",", "."));
}
export function validateReport(grid: Grid, mapping: Mapping, existing: Part[], mode: "merge" | "replace") {
  const errors: { row: number; message: string }[] = [];
  const missing = FIELDS.filter(([key, , required]) => required && mapping[key] === undefined);
  if (missing.length) return { parts: [] as Part[], errors: [{ row: 1, message: `Map required columns: ${missing.map((f) => f[1]).join(", ")}` }] };
  const assigned = Object.values(mapping).filter((v) => v !== undefined);
  if (new Set(assigned).size !== assigned.length) return { parts: [] as Part[], errors: [{ row: 1, message: "Each source column can only be mapped once." }] };
  const grouped = new Map<string, Part>();
  const signatures = new Map<string, string>();
  const orderTerms = new Map<string, string>();
  const importedOrders = new Map<string, CustomerOrder>();
  grid.rows.forEach((row, index) => {
    const get = (key: Field) => { const column = mapping[key]; return column === undefined ? "" : (row[column] ?? "").trim(); };
    try {
      for (const [key, label, required] of FIELDS) {
        if (required && !get(key)) throw new Error(`${label} is required`);
        if (get(key).startsWith("[FORMULA")) throw new Error(`${label}: replace formulas with values`);
      }
      const number = (key: Field, fallback = 0, max = Number.MAX_SAFE_INTEGER, integer = false) => {
        if (!get(key)) return fallback;
        const sapN = sapNumber(get(key));
        if (sapN !== undefined) { if (sapN > max || (integer && !Number.isInteger(sapN))) throw new Error(`${key}: invalid number or outside allowed range`); return sapN; }
        if (!/^(?:\d+(?:\.\d+)?|\.\d+)$/.test(get(key))) throw new Error(`${key}: use a non-negative number with a decimal point and no thousands separator`);
        const n = Number(get(key));
        if (!Number.isFinite(n) || n > max || (integer && !Number.isInteger(n))) throw new Error(`${key}: invalid number or outside allowed range`);
        return n;
      };
      const choice = <T extends string>(key: Field, values: readonly T[], fallback: T): T => {
        const value = get(key) || fallback;
        const valid = values.find((v) => v === value);
        if (!valid) throw new Error(`${key}: choose ${values.join(", ")}`);
        return valid;
      };
      const identity = { partNumber: get("partNumber"), po: get("po"), line: get("line") };
      const key = partKey(identity);
      const old = mode === "merge" ? existing.find((p) => partKey(p) === key) : undefined;
      const p: Part = { ...old, ...identity, id: old?.id ?? `erp-${encodeURIComponent(key)}`,
        description: get("description"), category: get("category") || old?.category || "",
        targetBuild: date(get("targetBuild")), qtyPending: number("qtyPending"), uom: get("uom"), daysLate: number("daysLate", 0, Number.MAX_SAFE_INTEGER, true),
        valueAtRisk: number("valueAtRisk"), hoursToLineStop: number("hoursToLineStop"), riskScore: number("riskScore", 0, 100, true),
        planner: get("planner"), supplier: get("supplier"), supplierContact: get("supplierContact") || old?.supplierContact || "",
        stage: choice("stage", STAGES.map((s) => s.id), old?.stage ?? "detected"),
        confidence: choice("confidence", Object.keys(CONFIDENCE) as Part["confidence"][], old?.confidence ?? "at_risk"),
        timeline: old?.timeline ?? [], checklist: old?.checklist ?? [], orders: old?.orders ?? [],
      };
      if (get("inboundFreight")) p.inboundFreight = choice("inboundFreight", Object.keys(FREIGHT_MODES) as NonNullable<Part["inboundFreight"]>[], "unspecified");
      if (get("inboundReference")) p.inboundReference = get("inboundReference");
      if (["baselineWeekly", "actualWeekly", "driver"].some((k) => get(k as Field))) {
        if (!get("baselineWeekly") || !get("actualWeekly")) throw new Error("Demand needs baseline_weekly and actual_weekly");
        p.demand = { baselineWeekly: number("baselineWeekly"), actualWeekly: number("actualWeekly"), driver: get("driver") };
      }
      if (["erpDays", "actualDays", "otdPct"].some((k) => get(k as Field))) {
        if (!get("erpDays") || !get("actualDays") || !get("otdPct")) throw new Error("Lead time needs erp_lead_days, actual_lead_days and supplier_otd_pct");
        p.leadTime = { erpDays: number("erpDays"), actualDays: number("actualDays"), otdPct: number("otdPct", 0, 100) };
      }
      const signature = JSON.stringify({ ...p, id: undefined, timeline: undefined, checklist: undefined, orders: undefined });
      if (signatures.has(key) && signatures.get(key) !== signature) throw new Error("Repeated part / PO / line has conflicting shortage values");
      signatures.set(key, signature);
      const prior = grouped.get(key);
      p.orders = [...(prior?.orders ?? p.orders ?? [])];
      const hasOrder = FIELDS.slice(19, 31).some(([k]) => get(k));
      if (hasOrder) {
        if (!["so", "customer", "committed", "orderValue"].every((k) => get(k as Field))) throw new Error("Customer orders need sales_order, customer, committed_date and order_value_eur");
        const oldOrder = mode === "merge" ? existing.flatMap((p) => p.orders ?? []).find((o) => o.so === get("so")) : undefined;
        const tier = choice("tier", ["tier1", "tier2", "tier3"], oldOrder ? customerTier(oldOrder) : "tier3");
        if (get("otifImpact") && !["true", "false"].includes(get("otifImpact"))) throw new Error("otif_impact: use true or false");
        const order: CustomerOrder = { ...oldOrder, so: get("so"), customer: get("customer"), committed: date(get("committed")), value: number("orderValue"), tier, strategic: tier === "tier1",
          penaltyPerDay: number("penaltyPerDay", oldOrder?.penaltyPerDay ?? 0), penaltyGraceDays: number("penaltyGraceDays", oldOrder?.penaltyGraceDays ?? 0, 365, true),
          otifImpact: get("otifImpact") ? get("otifImpact") === "true" : oldOrder?.otifImpact ?? true,
          status: choice("status", Object.keys(ORDER_STATUSES) as NonNullable<CustomerOrder["status"]>[], oldOrder?.status ?? "standard"),
          freightMode: choice("freightMode", Object.keys(FREIGHT_MODES) as NonNullable<CustomerOrder["freightMode"]>[], oldOrder?.freightMode ?? "unspecified"),
          transportReference: get("transportReference") || oldOrder?.transportReference || "",
          ...(get("originalCommitted") ? { originalCommitted: date(get("originalCommitted")) } : {}),
        };
        const terms = JSON.stringify(order);
        if (orderTerms.has(order.so) && orderTerms.get(order.so) !== terms) throw new Error(`Conflicting terms for ${order.so}`);
        orderTerms.set(order.so, terms);
        importedOrders.set(order.so, order);
        p.orders = [...p.orders.filter((o) => o.so !== order.so), order];
      }
      grouped.set(key, p);
    } catch (e) { errors.push({ row: index + 2, message: e instanceof Error ? e.message : "Invalid row" }); }
  });
  return { parts: [...grouped.values()].map((p) => ({ ...p, orders: (p.orders ?? []).map((o) => importedOrders.get(o.so) ?? o) })), errors };
}
export function exportRows(parts: Part[]): string[][] {
  return parts.flatMap((p) => (p.orders?.length ? p.orders : [undefined]).map((o) => {
    const values: Record<string, unknown> = { ...p, targetBuild: p.targetBuild.slice(0, 10), ...p.demand, ...p.leadTime,
      ...(o ? { ...o, tier: customerTier(o), committed: o.committed.slice(0, 10), originalCommitted: o.originalCommitted?.slice(0, 10), orderValue: o.value, otifImpact: o.otifImpact !== false } : {}) };
    return FIELDS.map(([key]) => String(values[key] ?? ""));
  }));
}
export function csvContent(rows: string[][]) {
  return Papa.unparse(rows, { escapeFormulae: true });
}
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function exportReport(parts: Part[], format: "csv" | "xlsx", scope: string) {
  const rows = [FIELDS.map((f) => f[1]), ...exportRows(parts)];
  const name = `apex-${scope}-${new Date().toISOString().slice(0, 10)}`;
  if (format === "csv") return downloadBlob(new Blob(["\uFEFF", csvContent(rows)], { type: "text/csv;charset=utf-8" }), `${name}.csv`);
  const { Workbook } = await import("exceljs");
  const wb = new Workbook();
  const sheet = wb.addWorksheet("Shortages", { views: [{ state: "frozen", ySplit: 1 }] });
  rows.forEach((r) => sheet.addRow(r));
  sheet.autoFilter = { from: "A1", to: { row: rows.length, column: FIELDS.length } };
  sheet.columns.forEach((c) => { c.width = 24; });
  const summary = wb.addWorksheet("Standup");
  summary.addRows([["Apex Escalation Hub", "Standup snapshot"], ["Exported UTC", new Date().toISOString()], ["Scope", scope], ["Planner", CURRENT_USER],
    ...Object.entries(computeKpis(parts)), ...Object.entries(computeCommercialKpis(parts)), ["Currency", "EUR"], ["Penalties", "Projected, not accrued"], ["Source", "Browser-saved board; no ERP write-back"]]);
  summary.getColumn(1).width = 32; summary.getColumn(2).width = 56;
  wb.eachSheet((s) => { s.eachRow((r) => { r.font = { name: "Arial", size: 11 }; }); s.getRow(1).font = { name: "Arial", size: 11, bold: true }; });
  const buffer = await wb.xlsx.writeBuffer();
  downloadBlob(new Blob([new Uint8Array(buffer)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${name}.xlsx`);
}