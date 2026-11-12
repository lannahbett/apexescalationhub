import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FREIGHT_MODES, ORDER_STATUSES, CUSTOMER_TIERS, activeOrders, commercialVisibility, customerTier, eur, leadTimeDriftPct, orderStatus, uniqueOrderRows, type Part } from "@/lib/shortages";
import { ConfidencePill, RiskPill, StageBadge } from "./badges";
import { OrderOperations } from "./order-operations";
import { useHub } from "./store";
import type { Density } from "./board";

export function RoleBoard({ parts, onOpen, density }: { parts: Part[]; onOpen: (id: string) => void; density: Density }) {
  const { roleView, commercialMode } = useHub();
  const visible = commercialVisibility(commercialMode);
  const th = "px-3 py-3 text-left text-[11px] font-semibold uppercase text-muted-foreground";
  const td = "px-3 text-xs align-top";
  const rowClass = cn("border-b last:border-0", density === "compact" ? "[&>td]:py-1" : "[&>td]:py-3");
  const openPart = (p: Part) => <Button variant="ghost" size="sm" className="h-auto min-h-11 whitespace-normal px-0 text-left font-mono" onClick={() => onOpen(p.id)}>{p.partNumber}</Button>;
  return <div role="region" tabIndex={0} aria-label="Scrollable role table" className="max-w-full overflow-x-auto rounded-md border bg-card"><table data-density={density} className="w-full min-w-[1000px] border-collapse" aria-label={roleView === "om" ? "Customer orders" : roleView === "buyer" ? "Supplier priorities" : "Plant exposure"}>
    <thead className="border-b bg-muted"><tr>{(roleView === "om" ? ["Customer / sales order", "Commitment / status", "Linked parts", "Order value", "Commercial impact", "Outbound freight", "Action"] : roleView === "buyer" ? ["Supplier / PO", "Part / priority", "Open PO quantity", "Inbound freight", "Workflow / confidence", "Lead time / OTD", "Planner"] : ["Line / part", "Risk", "Blocked production value", "Customer exposure", "Line stop", "Confidence", "Action"]).map((label) => <th key={label} scope="col" className={th}>{label}</th>)}</tr></thead>
    <tbody>{roleView === "om" ? uniqueOrderRows(parts).sort((a, b) => b.slip - a.slip).map(({ order: o, parts: linked, slip, penalty }) => <tr key={o.so} className={rowClass}>
      <td className={td}><div className="font-semibold">{o.customer}</div><div className="font-mono">{o.so}</div></td>
      <td className={td}><div>{o.committed.slice(0, 10)}</div><div className={orderStatus(o) === "cancelled" ? "text-muted-foreground" : slip > 0 ? "text-critical" : "text-success"}>{ORDER_STATUSES[orderStatus(o)]} · {orderStatus(o) === "cancelled" ? "Excluded" : slip ? `${slip}d projected slip` : "On track"}</div></td>
      <td className={td}>{linked.map((p) => <div key={p.id}>{openPart(p)}</div>)}</td>
      <td className={cn(td, "font-mono")}>{eur(o.value)}</td>
      <td className={td}>{visible.tiers && <div>{CUSTOMER_TIERS[customerTier(o)]}</div>}{visible.penalties && <div>{eur(penalty)} projected penalty</div>}</td>
      <td className={td}>{FREIGHT_MODES[o.freightMode ?? "unspecified"]}<div className="break-all text-muted-foreground">{o.transportReference}</div></td>
      <td className={td}><OrderOperations order={o} /></td>
    </tr>) : [...parts].sort((a, b) => b.riskScore - a.riskScore).map((p) => roleView === "buyer" ? <tr key={p.id} className={rowClass}>
      <td className={td}><div className="font-semibold">{p.supplier}</div><div className="font-mono">{p.po}</div></td><td className={td}>{openPart(p)}<RiskPill score={p.riskScore} /></td><td className={cn(td, "font-mono")}>{p.qtyPending.toLocaleString()} {p.uom}</td><td className={td}>{FREIGHT_MODES[p.inboundFreight ?? "unspecified"]}<div className="break-all text-muted-foreground">{p.inboundReference}</div></td><td className={td}><StageBadge stage={p.stage} /><div className="mt-2"><ConfidencePill value={p.confidence} /></div></td><td className={td}>{p.leadTime ? <>{p.leadTime.erpDays}d ERP → {p.leadTime.actualDays}d actual<div>{leadTimeDriftPct(p.leadTime)}% drift · {p.leadTime.otdPct}% OTD</div></> : "Not available"}</td><td className={td}>{p.planner}</td>
    </tr> : <tr key={p.id} className={rowClass}><td className={td}>{p.line}<div>{openPart(p)}</div></td><td className={td}><RiskPill score={p.riskScore} /></td><td className={cn(td, "font-mono")}>{p.stage === "delivered" ? "Cleared" : eur(p.valueAtRisk)}</td><td className={td}>{activeOrders(p).length} active orders{visible.tiers && <div>{activeOrders(p).filter((o) => customerTier(o) === "tier1").length} Tier 1</div>}</td><td className={td}>{p.stage === "delivered" ? "Cleared" : `${p.hoursToLineStop}h`}</td><td className={td}><ConfidencePill value={p.confidence} /></td><td className={td}><Button variant="outline" size="sm" onClick={() => onOpen(p.id)}>Review mitigation</Button></td></tr>)}
      {parts.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-muted-foreground">No parts match these filters.</td></tr>}
    </tbody></table></div>;
}
