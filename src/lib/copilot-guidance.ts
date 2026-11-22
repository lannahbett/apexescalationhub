import { activeOrders, commercialVisibility, customerTier, demandSurgePct, eur, leadTimeDriftPct, orderSlipDays, projectedPenalty, stockProjection, type CommercialMode, type Part, type RoleView } from "./shortages";

export type GuidanceRole = "planner" | "buyer" | "om";
export interface GuidanceItem {
  id: string; partId: string; partNumber: string; role: GuidanceRole; priority: number;
  title: string; facts: string[]; action: string; source: string;
}

/** Map the board perspective to the guidance lens; plant managers see everything. */
export const guidanceRoleFor = (v: RoleView): GuidanceRole | "all" => (v === "manager" ? "all" : v);

/**
 * Deterministic human-agent guidance. Every fact is read from board records and every action is a
 * fixed playbook step citing a handbook entry; nothing here edits records, sends messages or touches SAP.
 */
export function buildGuidance(parts: Part[], mode: CommercialMode): GuidanceItem[] {
  const vis = commercialVisibility(mode);
  const out: GuidanceItem[] = [];
  for (const p of parts) {
    if (p.stage === "delivered") continue;
    const base = { partId: p.id, partNumber: p.partNumber };
    const hours = p.hoursToLineStop;
    const stockout = stockProjection(p.stock)?.stockoutHours;
    if (Number.isFinite(hours) && hours >= 0 && hours < 24) {
      const qualified = (p.sourcingOptions ?? []).filter((o) => o.qualified && o.leadHours < hours);
      out.push({ ...base, id: `${p.id}:linestop`, role: "planner", priority: 100 - hours,
        title: `${p.line} may stop in ${hours}h`,
        facts: [`${hours}h to line stop`, `${eur(p.valueAtRisk)} blocked production value`, `Stage ${p.stage}, confidence ${p.confidence}`, ...(stockout !== undefined ? [`Snapshot stock-out in ${stockout}h`] : [])],
        action: qualified.length ? `Review ${qualified.length} qualified sourcing option(s) that arrive before the stop, then confirm with production.` : "No qualified option on record arrives before the stop: agree a build sequence change with production and escalate the supplier.",
        source: "guide:triage" });
    }
    if (p.confidence === "stalled" || (Number.isFinite(hours) && hours < 48 && p.stage === "detected")) {
      out.push({ ...base, id: `${p.id}:expedite`, role: "buyer", priority: 80 - Math.min(hours, 48) / 2,
        title: `Escalate ${p.supplier} on ${p.po}`,
        facts: [`Confidence ${p.confidence}`, `${p.daysLate} days late`, `${p.qtyPending} ${p.uom} pending`, `Inbound freight: ${p.inboundFreight ?? "not specified"}`],
        action: "Request a confirmed ship date with tracking within 24 hours and partial-shipment options; compare a faster freight mode in Expedite scenarios before approving cost.",
        source: "guide:expedite" });
    }
    const drift = leadTimeDriftPct(p.leadTime);
    if (drift >= 50) out.push({ ...base, id: `${p.id}:drift`, role: "buyer", priority: 40 + Math.min(drift, 200) / 10,
      title: `Lead time ${drift}% above ERP`, facts: [`ERP ${p.leadTime?.erpDays}d vs actual ${p.leadTime?.actualDays}d`, `Supplier OTD ${p.leadTime?.otdPct}%`],
      action: "Ask the supplier to confirm the current lead time and request a planning-parameter review before the next order.", source: "guide:signals" });
    const surge = demandSurgePct(p.demand);
    if (surge >= 30) out.push({ ...base, id: `${p.id}:demand`, role: "planner", priority: 35 + Math.min(surge, 200) / 10,
      title: `Demand ${surge}% above baseline`, facts: [`${p.demand?.actualWeekly}/week vs baseline ${p.demand?.baselineWeekly}`, `Driver: ${p.demand?.driver}`],
      action: "Confirm whether the surge is lasting before increasing safety stock or supplier call-offs.", source: "guide:signals" });
    for (const o of activeOrders(p)) {
      const slip = orderSlipDays(p, o);
      if (slip <= 0) continue;
      const pen = projectedPenalty(p, o);
      const facts = [`${o.customer} · ${o.so}`, `Commitment ${o.committed}, projected slip ${slip} day(s)`];
      if (vis.tiers) facts.push(`Priority ${customerTier(o)}`);
      if (vis.penalties && pen.total > 0) facts.push(`Projected penalty ${eur(pen.total)} (${pen.chargeableDays} chargeable day(s) at ${eur(o.penaltyPerDay)}/day)`);
      out.push({ ...base, id: `${p.id}:${o.so}`, role: "om",
        priority: 50 + slip + (vis.penalties ? Math.min(pen.total / 1000, 30) : 0) + (vis.tiers && customerTier(o) === "tier1" ? 10 : 0),
        title: `${o.so} at risk of late delivery`, facts,
        action: vis.penalties && pen.total > 0
          ? `Expedite is worth reviewing when its extra cost is below ${eur(o.penaltyPerDay)} per day saved; otherwise prepare a push-out request for customer approval.`
          : "Prepare a push-out request in Customer reschedule and wait for customer approval before changing the commitment.",
        source: "guide:penalty" });
    }
  }
  return out.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}
