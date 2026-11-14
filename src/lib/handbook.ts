export const HANDBOOK = [
  { id: "dates", title: "SAP First Date, GI and PGI", text: "First Date is your team's SAP date label; confirm its field and whether it is requested or confirmed with your SAP key user. Apex's committed date is not automatically the same field. Planned GI is the scheduled goods-issue date. PGI means posting goods issue, an actual SAP transaction that changes stock and accounting; it is not a forecast date to move freely. Local configuration determines document flow and billing. Apex has no SAP connection and cannot post or redate anything." },
  { id: "redating", title: "Reviewing SAP dates after a shortage", text: "Confirm material availability and production readiness with the planner, then check packing, transport and customer delivery constraints. A component delay does not imply the same shift to every date. Obtain customer agreement where required, have authorised colleagues update the appropriate SAP fields, and verify the saved order and delivery. Do not alter an actual PGI just to represent a new plan; follow your company's correction process." },
  { id: "reschedule", title: "Customer pull-in and push-out requests", text: "Pull-in proposes an earlier customer delivery; push-out proposes a later delivery. Use Customer reschedule to prepare an email, record proposed dates and save a private draft. A request is not customer approval. After approval, Manage order can change the board commitment across linked parts with a reason and confirmation. It does not update SAP or send email." },
  { id: "board", title: "Finding and acting on shortages", text: "Use Assembly line to focus the board, Search for a part, supplier, customer or order, and open a part for details. Critical means risk score 80 or above; scores are supplied board values, not an AI calculation. Stage and confidence are different: stage records workflow progress; confidence records supply certainty. The board is private in your browser when signed out and shared with approved teammates when signed in." },
  { id: "signals", title: "Demand and lead-time alerts", text: "Abnormal Demand selects increases of at least 30% over the supplied baseline. Lead-Time Drift selects actual lead times at least 50% above ERP lead times. View details and Visual analytics for comparisons. These are board-data comparisons, not live SAP reports or invented historical trends." },
  { id: "recovery", title: "Continuous improvement", text: "Moving a part to Cleared & Delivered opens a recovery confirmation. Record the cause and optional actual cost, 5-Why notes and preventive action. Continuous improvement uses recorded recoveries and escalation starts, not inferred history. View fictional examples is an isolated read-only preview; it does not change team records." },
  { id: "triage", title: "Sourcing and stock projections", text: "Request stock transfer or Request second source records a qualified sourcing request only: no PO, stock reservation or purchase is created. Stock projections use explicit timestamped stock, constant daily consumption and inbound ETA. They are assumptions, not live inventory. Missing snapshots cannot support a projection." },
  { id: "standup", title: "Standup and baseline reset", text: "Standup mode freezes the five highest-risk open parts for the selected line. The optional timer is three minutes; unsaved action notes pause sequencing. Saving an action adds it to the part timeline. Reset Plant Baseline requires confirmation and works only on a private local board; it cannot reset a shared team board. Private notes are separate and are not removed by board reset." },
  { id: "shipping", title: "Shipping and customs", text: "Shipping & customs tracks document references per sales order. Air freight uses AWB, road uses CMR, sea uses B/L; destination flags may add export or origin documents. The checklist is planning guidance, not legal customs clearance. Verify actual requirements with your shipping/customs team. Apex does not issue documents or book transport." },
  { id: "notes", title: "Private notes and drafts", text: "Notes & drafts saves editable notes in this browser separately from the board, scoped to the current viewer. You can link a part or order, pin notes and copy a pinned handover. Notes are not shared or backed up to Cloud; clearing site data removes them. Customer emails are editable drafts only and must be reviewed before being copied to your email tool." },
] as const;

export interface GroundSource { id: string; title: string; text: string }
export function selectedSources(ids: string[], sources: GroundSource[]) {
  return [...new Set(ids)].flatMap((id) => { const source = sources.find((s) => s.id === id); return source ? [source] : []; }).slice(0, 5);
}
interface ConflictPart { partNumber: string; stage: string; riskScore: number; hoursToLineStop: number; daysLate: number; customerOrders?: { so: string; customer: string; committed: string }[] }
/** Deterministic check: board rows that disagree about a part or sales order named in the question. */
export function boardConflicts(question: string, parts: ConflictPart[]): string[] {
  const q = question.toUpperCase();
  const out: string[] = [];
  const parts_ = new Map<string, Set<string>>();
  const orders = new Map<string, Set<string>>();
  for (const p of parts) {
    if (q.includes(p.partNumber.toUpperCase())) (parts_.get(p.partNumber) ?? parts_.set(p.partNumber, new Set()).get(p.partNumber)!).add(`stage ${p.stage}, risk ${p.riskScore}, ${p.hoursToLineStop}h to line stop, ${p.daysLate} days late`);
    for (const o of p.customerOrders ?? []) if (q.includes(o.so.toUpperCase())) (orders.get(o.so) ?? orders.set(o.so, new Set()).get(o.so)!).add(`${o.customer}, commitment ${o.committed}`);
  }
  for (const [k, v] of [...parts_, ...orders]) if (v.size > 1) out.push(`${k} has conflicting board records: ${[...v].join(" | ")}. Confirm the correct record before acting.`);
  return out;
}

/** Questions that try to steer the assistant instead of asking for information get an explicit unknown. */
export function isSteeringAttempt(question: string) {
  return /\b(ignore|disregard|forget|override)\b.{0,40}\b(instructions?|rules?|prompt|sources?)\b|\bsystem prompt\b|\b(pretend|act as|roleplay)\b|\b(say|tell me|confirm|state) (that )?(every|all|everything)\b/i.test(question);
}
