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
      timeline: timeline.reverse(),
      checklist: defaultChecklist().map((c) => ({ ...c, done: done.includes(c.id) })),
    };
  });
}

export type FilterId = "all" | "critical" | "stalled" | "mine" | "due48";
export const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Line Down / Critical" },
  { id: "stalled", label: "Stalled Confidence" },
  { id: "mine", label: `My Parts (${CURRENT_USER})` },
  { id: "due48", label: "Due < 48h" },
];

export function filterParts(parts: Part[], filter: FilterId, q: string) {
  const query = q.trim().toLowerCase();
  return parts.filter((p) => {
    if (filter === "critical" && riskTier(p.riskScore) !== "critical") return false;
    if (filter === "stalled" && p.confidence !== "stalled") return false;
    if (filter === "mine" && p.planner !== CURRENT_USER) return false;
    if (filter === "due48" && p.hoursToLineStop > 48) return false;
    if (!query) return true;
    return [p.partNumber, p.planner, p.description, p.category].some((v) => v.toLowerCase().includes(query));
  });
}

export const CSV_TEMPLATE = [
  "part_number,description,category,line,target_build_date,qty_pending,uom,days_late,value_at_risk_eur,planner,supplier,po_number",
  "PN-8402-HX,Brushless Servo Motor 48V,Motion Control,Line A - Robotics,2026-11-12,120,pcs,6,412000,Sarah M.,Kessler Antriebstechnik GmbH,PO-4500219843",
  "PN-3317-FP,FPGA Controller Board Rev C,Precision Electronics,Line B - Drive Units,2026-11-13,340,pcs,4,286500,Marco R.,Nordwave Electronics AB,PO-4500220117",
].join("\n");
