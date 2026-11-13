export type Confidence = "high" | "at_risk" | "stalled";
export type Stage = "detected" | "sourcing" | "transit" | "customs" | "delivered";
export type RiskTier = "critical" | "elevated" | "monitored";

export const STAGES: { id: Stage; label: string; n: number }[] = [
  { id: "detected", label: "Shortage Detected", n: 1 },
  { id: "sourcing", label: "Sourcing Alternative", n: 2 },
  { id: "transit", label: "Expedited / In-Transit", n: 3 },
  { id: "customs", label: "Customs Hold", n: 4 },
  { id: "delivered", label: "Cleared & Delivered", n: 5 },
];

export const CONFIDENCE: Record<Confidence, { label: string; hint: string }> = {
  high: { label: "High Confidence", hint: "Tracking active / stock confirmed" },
  at_risk: { label: "At Risk", hint: "Supplier promised date, transit unconfirmed" },
  stalled: { label: "Stalled", hint: "No ETA / engineering hold" },
};

export interface TimelineEntry {
  at: string;
  kind: "date" | "contact" | "note" | "confidence" | "stage" | "checklist";
  text: string;
  by: string;
}
export interface ChecklistItem { id: string; label: string; done: boolean }

export interface Part {
  id: string;
  partNumber: string;
  description: string;
  category: string;
  line: string;
  targetBuild: string; // ISO date
  hoursToLineStop: number;
  daysLate: number;
  valueAtRisk: number;
  qtyPending: number;
  uom: string;
  planner: string;
  supplier: string;
  supplierContact: string;
  po: string;
  riskScore: number;
  confidence: Confidence;
  stage: Stage;
  timeline: TimelineEntry[];
  checklist: ChecklistItem[];
  orders?: CustomerOrder[] | undefined;
  demand?: DemandSignal | undefined;
  leadTime?: LeadTimeSignal | undefined;
  inboundFreight?: FreightMode;
  inboundReference?: string;
}

export const ROLE_VIEWS = [
  { id: "planner", label: "Material Planner" },
  { id: "om", label: "Order Management" },
  { id: "buyer", label: "Buyer / Procurement" },
  { id: "manager", label: "Plant Supply Chain Manager" },
] as const;
export type RoleView = typeof ROLE_VIEWS[number]["id"];
export const ORDER_STATUSES = { standard: "Standard", pull_in: "Pull-in", push_out: "Push-out", cancelled: "Cancelled" } as const;
export type OrderStatus = keyof typeof ORDER_STATUSES;
export const FREIGHT_MODES = { unspecified: "Not specified", air: "Air freight", road: "Road / groupage", sea: "Sea / ocean", express: "Dedicated express / hot-shot" } as const;
export type FreightMode = keyof typeof FREIGHT_MODES;
export const orderStatus = (o: CustomerOrder): OrderStatus => o.status ?? "standard";
export const activeOrders = (p: Part) => (p.orders ?? []).filter((o) => orderStatus(o) !== "cancelled");

export type CommercialMode = "dual" | "tiers" | "penalties";
export type CustomerTier = "tier1" | "tier2" | "tier3";
export const COMMERCIAL_MODES: { id: CommercialMode; label: string }[] = [
  { id: "dual", label: "Tiers + penalties" },
  { id: "tiers", label: "Priority tiers & OTIF" },
  { id: "penalties", label: "Contractual penalties" },
];
export const CUSTOMER_TIERS: Record<CustomerTier, string> = { tier1: "Tier 1 · Strategic", tier2: "Tier 2 · Core", tier3: "Tier 3 · Standard" };
export interface CustomerOrder {
  so: string; customer: string; strategic: boolean; committed: string; value: number; penaltyPerDay: number;
  tier?: CustomerTier; penaltyGraceDays?: number; otifImpact?: boolean;
  status?: OrderStatus; originalCommitted?: string; freightMode?: FreightMode; transportReference?: string;
  shipping?: ShippingInfo;
}
export interface ShippingInfo { outsideEu?: boolean; preferential?: boolean; romania?: boolean; refs?: Partial<Record<ShippingDoc, string>> }
export const SHIPPING_DOCS = {
  delivery_note: { label: "Delivery note", help: "Created by Order Management; tells the warehouse what to pick and pack for this order." },
  packing_list: { label: "Packing list", help: "Boxes, weights and dimensions; the carrier and customs check it against the goods." },
  commercial_invoice: { label: "Commercial invoice", help: "Value of the goods; customs use it to calculate duties." },
  awb: { label: "AWB (Air Waybill)", help: "The air carrier's contract and tracking number for air freight." },
  cmr: { label: "CMR consignment note", help: "Road transport contract signed by sender, driver and receiver." },
  bl: { label: "B/L (Bill of Lading)", help: "Sea freight contract and title to the goods; needed to release the container." },
  uit: { label: "UIT code (RO e-Transport)", help: "Romanian tax authority code required before road goods move into or through Romania." },
  hs_code: { label: "HS code", help: "Customs classification number of the product; sets duty rates." },
  export_mrn: { label: "Export declaration (MRN)", help: "Customs reference proving goods were declared for export outside the EU." },
  eur1: { label: "EUR.1 certificate", help: "Proves EU origin so the customer pays reduced or zero duty under a trade agreement." },
} as const;
export type ShippingDoc = keyof typeof SHIPPING_DOCS;
/** Required outbound documents follow freight mode and destination flags; unspecified freight blocks readiness. */
export function requiredShippingDocs(o: CustomerOrder): ShippingDoc[] {
  const s = o.shipping ?? {};
  const mode = o.freightMode ?? "unspecified";
  const docs: ShippingDoc[] = ["delivery_note", "packing_list", "commercial_invoice"];
  if (mode === "air") docs.push("awb");
  if (mode === "road" || mode === "express") docs.push("cmr");
  if (mode === "sea") docs.push("bl");
  if (s.romania && (mode === "road" || mode === "express")) docs.push("uit");
  if (s.outsideEu) docs.push("hs_code", "export_mrn");
  if (s.outsideEu && s.preferential) docs.push("eur1");
  return docs;
}
export function shippingReadiness(o: CustomerOrder) {
  const required = requiredShippingDocs(o);
  const missing = required.filter((d) => !o.shipping?.refs?.[d]?.trim());
  const freightSet = (o.freightMode ?? "unspecified") !== "unspecified";
  return { required, missing, freightSet, ready: freightSet && missing.length === 0 && orderStatus(o) !== "cancelled" };
}
export const customerTier = (o: CustomerOrder): CustomerTier => o.tier ?? (o.strategic ? "tier1" : "tier3");
export const commercialVisibility = (mode: CommercialMode) => ({ tiers: mode !== "penalties", penalties: mode !== "tiers" });
export function validateCommercialTerms(tier: string, daily: number, grace: number) {
  return ["tier1", "tier2", "tier3"].includes(tier) && Number.isFinite(daily) && daily >= 0 &&
    Number.isInteger(grace) && grace >= 0 && grace <= 365;
}
/** Forecast only: chargeable slip after calendar-day grace; not an accrued invoice or confirmed OTIF score. */
export function projectedPenalty(p: Part, o: CustomerOrder) {
  const chargeableDays = Math.max(0, orderSlipDays(p, o) - (o.penaltyGraceDays ?? 0));
  return { chargeableDays, total: chargeableDays * o.penaltyPerDay };
}
/** One commercial exposure per sales order, using its worst open-part delay. */
export function computeCommercialKpis(parts: Part[]) {
  const orders = new Map<string, { tier1: boolean; otif: boolean; penalty: number; daily: number }>();
  for (const p of parts.filter((p) => p.stage !== "delivered")) for (const o of activeOrders(p)) {
    const old = orders.get(o.so);
    const penalty = projectedPenalty(p, o).total;
    orders.set(o.so, {
      tier1: (old?.tier1 ?? false) || customerTier(o) === "tier1",
      otif: (old?.otif ?? false) || (o.otifImpact !== false && orderSlipDays(p, o) > 0),
      penalty: Math.max(old?.penalty ?? 0, penalty),
      daily: Math.max(old?.daily ?? 0, penalty > 0 ? o.penaltyPerDay : 0),
    });
  }
  const rows = [...orders.values()];
  return { tier1Orders: rows.filter((o) => o.tier1).length, otifOrders: rows.filter((o) => o.otif).length,
    projectedPenalties: rows.reduce((s, o) => s + o.penalty, 0), dailyPenalties: rows.reduce((s, o) => s + o.daily, 0) };
}
export interface DemandSignal { baselineWeekly: number; actualWeekly: number; driver: string }
export interface LeadTimeSignal { erpDays: number; actualDays: number; otdPct: number }

/** Abnormal demand = actual weekly consumption ≥ 30% above the 6-week baseline. */
export const DEMAND_SURGE_THRESHOLD = 30;
export const demandSurgePct = (d?: DemandSignal | undefined) =>
  !d || d.baselineWeekly <= 0 ? 0 : Math.round(((d.actualWeekly - d.baselineWeekly) / d.baselineWeekly) * 100);
export const isAbnormalDemand = (d?: DemandSignal | undefined) => demandSurgePct(d) >= DEMAND_SURGE_THRESHOLD;
export const leadTimeDriftPct = (l?: LeadTimeSignal | undefined) =>
  !l || l.erpDays <= 0 ? 0 : Math.round(((l.actualDays - l.erpDays) / l.erpDays) * 100);
/** Customer order value blocked by this part. */
export const orderExposure = (p: Part) => activeOrders(p).reduce((s, o) => s + o.value, 0);
/** Days the projected availability (target build + days late) overshoots an order's committed date; 0 if safe. */
export function orderSlipDays(p: Part, o: CustomerOrder) {
  if (orderStatus(o) === "cancelled") return 0;
  const ready = new Date(p.targetBuild).getTime() + p.daysLate * 86400000;
  return Math.max(0, Math.ceil((ready - new Date(o.committed).getTime()) / 86400000));
}

export const CURRENT_USER = "Sarah M.";

export function riskTier(score: number): RiskTier {
  if (score >= 80) return "critical";
  if (score >= 50) return "elevated";
  return "monitored";
}

export function computeKpis(parts: Part[]) {
  const active = parts.filter((p) => p.stage !== "delivered");
  return {
    valueAtRisk: active.reduce((s, p) => s + p.valueAtRisk, 0),
    activeCount: active.length,
    abnormalDemandCount: active.filter((p) => isAbnormalDemand(p.demand)).length,
    customerExposure: active.reduce((s, p) => s + orderExposure(p), 0),
    linesAtRisk: new Set(active.filter((p) => p.hoursToLineStop <= 48).map((p) => p.line)).size,
    stalledCount: active.filter((p) => p.confidence === "stalled").length,
  };
}

export const eur = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export const initials = (name: string) =>
  name.split(/\s+/).map((w) => w[0]).join("").replace(".", "").slice(0, 2).toUpperCase();

const day = (offset: number, h = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
};

const defaultChecklist = (): ChecklistItem[] => [
  { id: "alt", label: "Check alternate plant inventory (Győr / Brno)", done: false },
  { id: "courier", label: "Quote emergency courier / air freight", done: false },
  { id: "sub", label: "Test & qualify substitute part", done: false },
  { id: "eng", label: "Request engineering deviation approval", done: false },
  { id: "resched", label: "Resequence build schedule with production", done: false },
];

type Seed = Omit<Part, "id" | "timeline" | "checklist" | "targetBuild"> & { buildIn: number; done?: string[] };

const seeds: Seed[] = [
  { partNumber: "PN-8402-HX", description: "Brushless Servo Motor 48V", category: "Motion Control", line: "Line A - Robotics", buildIn: 1, hoursToLineStop: 18, daysLate: 6, valueAtRisk: 412000, qtyPending: 120, uom: "pcs", planner: "Sarah M.", supplier: "Kessler Antriebstechnik GmbH", supplierContact: "j.wagner@kessler-at.de", po: "PO-4500219843", riskScore: 96, confidence: "stalled", stage: "sourcing", done: ["alt"] },
  { partNumber: "PN-3317-FP", description: "FPGA Controller Board Rev C", category: "Precision Electronics", line: "Line B - Drive Units", buildIn: 2, hoursToLineStop: 30, daysLate: 4, valueAtRisk: 286500, qtyPending: 340, uom: "pcs", planner: "Marco R.", supplier: "Nordwave Electronics AB", supplierContact: "orders@nordwave.se", po: "PO-4500220117", riskScore: 91, confidence: "at_risk", stage: "transit" },
  { partNumber: "PN-1209-EN", description: "Absolute Rotary Encoder 23-bit", category: "Sensors & Feedback", line: "Line A - Robotics", buildIn: 2, hoursToLineStop: 40, daysLate: 3, valueAtRisk: 198000, qtyPending: 260, uom: "pcs", planner: "Sarah M.", supplier: "Optronix Sensorik", supplierContact: "expedite@optronix.at", po: "PO-4500219902", riskScore: 84, confidence: "at_risk", stage: "customs" },
  { partNumber: "PN-5521-PL", description: "PLC CPU Module 1516-3 PN", category: "Control Systems", line: "Line C - Control Cabinets", buildIn: 1, hoursToLineStop: 22, daysLate: 9, valueAtRisk: 174200, qtyPending: 45, uom: "pcs", planner: "Anika T.", supplier: "Vectra Automation SpA", supplierContact: "l.ferri@vectra-auto.it", po: "PO-4500218811", riskScore: 88, confidence: "stalled", stage: "detected" },
  { partNumber: "PN-7740-HR", description: "Shielded Cable Harness 24-pin", category: "Interconnect", line: "Line B - Drive Units", buildIn: 3, hoursToLineStop: 64, daysLate: 2, valueAtRisk: 96400, qtyPending: 800, uom: "pcs", planner: "Marco R.", supplier: "Lumen Wiring s.r.o.", supplierContact: "p.novak@lumenwiring.cz", po: "PO-4500220301", riskScore: 67, confidence: "high", stage: "transit" },
  { partNumber: "PN-2288-BR", description: "Angular Contact Bearing 7206", category: "Mechanical", line: "Line D - Gearboxes", buildIn: 4, hoursToLineStop: 90, daysLate: 1, valueAtRisk: 58300, qtyPending: 1500, uom: "pcs", planner: "Jonas K.", supplier: "Baltic Bearing Co.", supplierContact: "sales@balticbearing.lt", po: "PO-4500220410", riskScore: 54, confidence: "at_risk", stage: "sourcing" },
  { partNumber: "PN-6603-PS", description: "24V DIN-Rail Power Supply 20A", category: "Power", line: "Line C - Control Cabinets", buildIn: 2, hoursToLineStop: 46, daysLate: 5, valueAtRisk: 132700, qtyPending: 210, uom: "pcs", planner: "Sarah M.", supplier: "Helion Power Ltd", supplierContact: "expedite@helionpower.co.uk", po: "PO-4500219677", riskScore: 79, confidence: "stalled", stage: "customs" },
  { partNumber: "PN-4415-GX", description: "Planetary Gearhead 10:1", category: "Motion Control", line: "Line D - Gearboxes", buildIn: 6, hoursToLineStop: 140, daysLate: 0, valueAtRisk: 74900, qtyPending: 90, uom: "pcs", planner: "Jonas K.", supplier: "Kessler Antriebstechnik GmbH", supplierContact: "j.wagner@kessler-at.de", po: "PO-4500220522", riskScore: 42, confidence: "high", stage: "transit" },
  { partNumber: "PN-9031-LS", description: "Laser Distance Sensor IP67", category: "Sensors & Feedback", line: "Line E - Vision Systems", buildIn: 5, hoursToLineStop: 110, daysLate: 2, valueAtRisk: 61200, qtyPending: 75, uom: "pcs", planner: "Priya D.", supplier: "Optronix Sensorik", supplierContact: "expedite@optronix.at", po: "PO-4500220034", riskScore: 58, confidence: "at_risk", stage: "detected" },
  { partNumber: "PN-1876-CM", description: "Industrial CMOS Camera 12MP", category: "Precision Electronics", line: "Line E - Vision Systems", buildIn: 3, hoursToLineStop: 70, daysLate: 7, valueAtRisk: 148000, qtyPending: 60, uom: "pcs", planner: "Priya D.", supplier: "Sakura Imaging KK", supplierContact: "intl@sakura-imaging.jp", po: "PO-4500219455", riskScore: 76, confidence: "stalled", stage: "sourcing" },
  { partNumber: "PN-3390-RL", description: "Safety Relay Module SIL3", category: "Control Systems", line: "Line C - Control Cabinets", buildIn: 7, hoursToLineStop: 165, daysLate: 0, valueAtRisk: 38500, qtyPending: 130, uom: "pcs", planner: "Anika T.", supplier: "Vectra Automation SpA", supplierContact: "l.ferri@vectra-auto.it", po: "PO-4500220688", riskScore: 31, confidence: "high", stage: "delivered" },
  { partNumber: "PN-5108-CP", description: "MLCC Capacitor 10µF 0805 (reel)", category: "Precision Electronics", line: "Line B - Drive Units", buildIn: 4, hoursToLineStop: 85, daysLate: 3, valueAtRisk: 89000, qtyPending: 40, uom: "reels", planner: "Sarah M.", supplier: "Arrowpoint Distribution", supplierContact: "eu-expedite@arrowpoint.com", po: "PO-4500220190", riskScore: 63, confidence: "at_risk", stage: "transit" },
  { partNumber: "PN-7212-LG", description: "Linear Guide Rail 1200mm", category: "Mechanical", line: "Line A - Robotics", buildIn: 8, hoursToLineStop: 190, daysLate: 0, valueAtRisk: 27300, qtyPending: 48, uom: "pcs", planner: "Jonas K.", supplier: "Baltic Bearing Co.", supplierContact: "sales@balticbearing.lt", po: "PO-4500220745", riskScore: 24, confidence: "high", stage: "customs" },
  { partNumber: "PN-6650-IO", description: "EtherCAT I/O Coupler 16DI", category: "Control Systems", line: "Line A - Robotics", buildIn: 5, hoursToLineStop: 118, daysLate: 1, valueAtRisk: 43000, qtyPending: 150, uom: "pcs", planner: "Marco R.", supplier: "Nordwave Electronics AB", supplierContact: "orders@nordwave.se", po: "PO-4500220559", riskScore: 47, confidence: "high", stage: "delivered" },
];

const CUSTOMERS: [string, boolean][] = [
  ["Siemens Healthineers", true], ["Bosch Rexroth", true], ["ASML", true], ["Krones AG", false],
  ["Festo SE", false], ["Trumpf GmbH", true], ["Philips Medical", false], ["Vestas Wind", false],
];
const DRIVERS = ["Customer bulk order", "Unplanned line ramp-up", "Scrap / yield anomaly", "Safety-stock pull", "ECO revision pull-in", "Forecast in line"];

/** Deterministic commercial + demand + lead-time signals per seed index (no randomness). */
export function seedSignals(i: number, s: { daysLate: number; valueAtRisk: number; buildIn: number }) {
  const n = 1 + (i % 3);
  const orders: CustomerOrder[] = Array.from({ length: n }, (_, k) => {
    const [customer, strategic] = CUSTOMERS[(i * 3 + k) % CUSTOMERS.length] ?? ["Demo customer", false];
    return {
      so: `SO-${9900 + i * 7 + k}`, customer, strategic,
      committed: day(s.buildIn + 2 + k * 3 - (i % 2) * 3, 12),
      value: Math.round((s.valueAtRisk * (1.6 - k * 0.4)) / 100) * 100,
      penaltyPerDay: strategic ? 2500 + (i % 4) * 1250 : 0,
      tier: strategic ? "tier1" : i % 2 ? "tier2" : "tier3", penaltyGraceDays: 0, otifImpact: true,
    };
  });
  const baselineWeekly = 40 + i * 15;
  const surge = [85, 12, 46, 5, 34, -8, 62, 0, 18, 41, 3, 9, 25, -4][i % 14] ?? 0;
  const demand: DemandSignal = {
    baselineWeekly,
    actualWeekly: Math.round(baselineWeekly * (1 + surge / 100)),
    driver: surge >= DEMAND_SURGE_THRESHOLD ? (DRIVERS[i % 5] ?? "Demand spike") : (DRIVERS[5] ?? "Forecast in line"),
  };
  const erpDays = 10 + (i % 4) * 4;
  const leadTime: LeadTimeSignal = { erpDays, actualDays: erpDays + s.daysLate * 2 + (i % 3), otdPct: Math.max(48, 96 - s.daysLate * 5 - (i % 3) * 3) };
  return { orders, demand, leadTime };
}

export function buildSeed(): Part[] {
  return seeds.map((s, i) => {
    const { buildIn, done = [], ...rest } = s;
    const timeline: TimelineEntry[] = [
      { at: day(-s.daysLate - 4, 8), kind: "note", text: `Shortage flagged by MRP run: ${s.qtyPending} ${s.uom} uncovered against ${s.po}.`, by: "ERP Sync" },
      { at: day(-s.daysLate - 2, 11), kind: "contact", text: `Called ${s.supplier} (${s.supplierContact}); supplier acknowledged backlog.`, by: s.planner },
      { at: day(-s.daysLate, 14), kind: "date", text: `Supplier confirmed date moved by +${Math.max(s.daysLate, 1)} days.`, by: s.planner },
    ];
    if (s.confidence === "stalled") timeline.push({ at: day(-1, 16), kind: "confidence", text: "Marked Stalled — no ETA provided / engineering hold on drawing revision.", by: s.planner });
    return {
      ...rest,
      id: `p${i + 1}`,
      targetBuild: day(buildIn),
      ...seedSignals(i, s),
      timeline: timeline.reverse(),
      checklist: defaultChecklist().map((c) => ({ ...c, done: done.includes(c.id) })),
    };
  });
}

export type FilterId = "all" | "critical" | "stalled" | "mine" | "due48" | "demand";
export const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Line Down / Critical" },
  { id: "stalled", label: "Stalled Confidence" },
  { id: "mine", label: `My Parts (${CURRENT_USER})` },
  { id: "due48", label: "Due < 48h" },
  { id: "demand", label: "Abnormal Demand" },
];

export function filterParts(parts: Part[], filter: FilterId, q: string) {
  const query = q.trim().toLowerCase();
  return parts.filter((p) => {
    if (filter === "critical" && riskTier(p.riskScore) !== "critical") return false;
    if (filter === "stalled" && p.confidence !== "stalled") return false;
    if (filter === "mine" && p.planner !== CURRENT_USER) return false;
    if (filter === "due48" && p.hoursToLineStop > 48) return false;
    if (filter === "demand" && !isAbnormalDemand(p.demand)) return false;
    if (!query) return true;
    return [p.partNumber, p.planner, p.supplier, p.po, p.description, p.category, ...(p.orders ?? []).flatMap((o) => [o.customer, o.so])].some((v) => v.toLowerCase().includes(query));
  });
}

export const CSV_TEMPLATE = [
  "part_number,description,category,line,target_build_date,qty_pending,uom,days_late,value_at_risk_eur,planner,supplier,po_number",
  "PN-8402-HX,Brushless Servo Motor 48V,Motion Control,Line A - Robotics,2026-11-12,120,pcs,6,412000,Sarah M.,Kessler Antriebstechnik GmbH,PO-4500219843",
  "PN-3317-FP,FPGA Controller Board Rev C,Precision Electronics,Line B - Drive Units,2026-11-13,340,pcs,4,286500,Marco R.,Nordwave Electronics AB,PO-4500220117",
].join("\n");

/** Date changes are confirmed customer commitments, not unapproved requests. */
export function validateOrderChange(o: CustomerOrder, status: string, committed: string, freight: string) {
  if (!(status in ORDER_STATUSES) || !(freight in FREIGHT_MODES)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(committed)) return false;
  const d = new Date(`${committed}T00:00:00Z`);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== committed) return false;
  const old = o.committed.slice(0, 10);
  if (status === "pull_in" && committed >= old) return false;
  if (status === "push_out" && committed <= old) return false;
  return true;
}
/** Update every pegging occurrence atomically; never deallocate stock without allocation data. */
export function applyOrderPatch(parts: Part[], so: string, patch: Partial<CustomerOrder>, log: TimelineEntry): Part[] {
  return parts.map((p) => !p.orders?.some((o) => o.so === so) ? p : {
    ...p, orders: p.orders.map((o) => o.so === so ? { ...o, ...patch } : o), timeline: [log, ...p.timeline],
  });
}
/** Import is atomic; omitted shortages survive a merge and order terms stay consistent across all pegging links. */
export function applyReportParts(existing: Part[], incoming: Part[], mode: "merge" | "replace", log: TimelineEntry): Part[] {
  const identity = (p: Part) => JSON.stringify([p.partNumber, p.po, p.line]);
  const incomingByKey = new Map(incoming.map((p) => [identity(p), p]));
  const orderTerms = new Map(incoming.flatMap((p) => (p.orders ?? []).map((o) => [o.so, o] as const)));
  const combined = mode === "replace" ? incoming : [
    ...existing.map((p) => incomingByKey.get(identity(p)) ?? p),
    ...incoming.filter((p) => !existing.some((old) => identity(old) === identity(p))),
  ];
  return combined.map((p) => {
    const touched = incomingByKey.has(identity(p)) || p.orders?.some((o) => orderTerms.has(o.so));
    return { ...p, orders: (p.orders ?? []).map((o) => orderTerms.get(o.so) ?? o), timeline: touched ? [log, ...p.timeline] : p.timeline };
  });
}
export function uniqueOrderRows(parts: Part[]) {
  const rows = new Map<string, { order: CustomerOrder; parts: Part[]; slip: number; penalty: number }>();
  for (const p of parts) for (const order of p.orders ?? []) {
    const row = rows.get(order.so);
    rows.set(order.so, { order: row?.order ?? order, parts: [...(row?.parts ?? []), p],
      slip: Math.max(row?.slip ?? 0, p.stage === "delivered" ? 0 : orderSlipDays(p, order)),
      penalty: Math.max(row?.penalty ?? 0, p.stage === "delivered" ? 0 : projectedPenalty(p, order).total) });
  }
  return [...rows.values()];
}
/** Dashboard analysis uses existing commercial rules and never invents approval requests or shipment status. */
export function dashboardAnalysis(parts: Part[], scope: "open" | "all" | "mine") {
  const scoped = parts.filter((p) => scope === "all" || (p.stage !== "delivered" && (scope !== "mine" || p.planner === CURRENT_USER)));
  const open = scoped.filter((p) => p.stage !== "delivered");
  const suppliers = [...new Set(open.map((p) => p.supplier))].map((name) => {
    const rows = open.filter((p) => p.supplier === name);
    const measured = rows.filter((p) => p.leadTime);
    return { name, count: rows.length, drift: measured.length ? measured.reduce((sum, p) => sum + ((p.leadTime?.actualDays ?? 0) - (p.leadTime?.erpDays ?? 0)), 0) / measured.length : null,
      planned: measured.length ? measured.reduce((sum, p) => sum + (p.leadTime?.erpDays ?? 0), 0) / measured.length : null,
      actual: measured.length ? measured.reduce((sum, p) => sum + (p.leadTime?.actualDays ?? 0), 0) / measured.length : null };
  }).sort((a, b) => (b.drift ?? -Infinity) - (a.drift ?? -Infinity));
  const orders = uniqueOrderRows(scoped).filter((r) => orderStatus(r.order) !== "cancelled" && r.parts.some((p) => p.stage !== "delivered"));
  const customers = [...new Set(orders.map((r) => r.order.customer))].map((name) => {
    const rows = orders.filter((r) => r.order.customer === name);
    return { name, count: rows.length, atRisk: rows.filter((r) => r.slip > 0).length, committed: rows.map((r) => r.order.committed).sort()[0] ?? "", tier1: rows.filter((r) => customerTier(r.order) === "tier1").length, penalty: rows.reduce((sum, r) => sum + r.penalty, 0) };
  }).sort((a, b) => b.atRisk - a.atRisk || a.committed.localeCompare(b.committed));
  return { scoped, stages: STAGES.map((s) => ({ ...s, count: scoped.filter((p) => p.stage === s.id).length })), kpis: computeKpis(scoped), commercial: computeCommercialKpis(scoped),
    critical: open.filter((p) => riskTier(p.riskScore) === "critical").sort((a, b) => a.hoursToLineStop - b.hoursToLineStop),
    actions: open.filter((p) => p.confidence === "stalled" || p.stage === "customs").sort((a, b) => b.riskScore - a.riskScore), suppliers, customers,
    inbound: Object.keys(FREIGHT_MODES).map((id) => ({ mode: id as FreightMode, count: open.filter((p) => (p.inboundFreight ?? "unspecified") === id).length })),
    outbound: Object.keys(FREIGHT_MODES).map((id) => ({ mode: id as FreightMode, count: orders.filter((r) => (r.order.freightMode ?? "unspecified") === id).length })) };
}
/** A scenario changes only this part's availability; other blockers stay in the estimate. */
export function expediteComparison(parts: Part[], partId: string, daysSaved: number, extraCost: number, downtimePerDay: number, mode: CommercialMode) {
  if (![daysSaved, extraCost, downtimePerDay].every(Number.isFinite) || !Number.isInteger(daysSaved) || daysSaved < 0 || daysSaved > 365 || extraCost < 0 || downtimePerDay < 0) return null;
  const part = parts.find((p) => p.id === partId);
  if (!part || part.stage === "delivered") return null;
  const before = computeCommercialKpis(parts).projectedPenalties;
  const after = computeCommercialKpis(parts.map((p) => p.id === partId ? { ...p, targetBuild: new Date(new Date(p.targetBuild).getTime() - daysSaved * 86400000).toISOString() } : p)).projectedPenalties;
  const penaltySaving = mode === "tiers" ? 0 : Math.max(0, before - after);
  const downtimeSaving = daysSaved * downtimePerDay;
  return { penaltySaving, downtimeSaving, grossSaving: penaltySaving + downtimeSaving, netSaving: penaltySaving + downtimeSaving - extraCost };
}
