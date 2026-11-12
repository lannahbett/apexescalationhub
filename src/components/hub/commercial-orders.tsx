import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CUSTOMER_TIERS, customerTier, commercialVisibility, projectedPenalty, orderExposure, orderSlipDays, validateCommercialTerms, eur, ORDER_STATUSES, FREIGHT_MODES, orderStatus, type CustomerOrder, type CustomerTier, type Part } from "@/lib/shortages";
import { OrderOperations } from "./order-operations";
import { useHub } from "./store";

export function CommercialOrders({ part }: { part: Part }) {
  const { commercialMode, updateOrder } = useHub();
  const visible = commercialVisibility(commercialMode);
  const [editing, setEditing] = useState<CustomerOrder | null>(null);
  const [tier, setTier] = useState<CustomerTier>("tier3");
  const [daily, setDaily] = useState("0");
  const [grace, setGrace] = useState("0");
  const [otif, setOtif] = useState(true);
  const valid = daily.trim() !== "" && grace.trim() !== "" && validateCommercialTerms(tier, Number(daily), Number(grace));
  const edit = (order: CustomerOrder) => {
    setEditing(order); setTier(customerTier(order)); setDaily(String(order.penaltyPerDay));
    setGrace(String(order.penaltyGraceDays ?? 0)); setOtif(order.otifImpact !== false);
  };
  const save = () => {
    if (!editing || !valid) return;
    const terms = { tier, strategic: tier === "tier1", penaltyPerDay: Number(daily), penaltyGraceDays: Number(grace), otifImpact: otif };
    updateOrder(editing.so, terms, `Commercial terms updated for ${editing.so}: ${CUSTOMER_TIERS[tier]}, ${eur(terms.penaltyPerDay)}/day, ${terms.penaltyGraceDays}d grace, OTIF tracking ${otif ? "on" : "off"}.`);
    setEditing(null); toast.success("Customer terms saved");
  };
  return (
    <section>
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer orders at risk · {eur(orderExposure(part))}</h3>
      <p className="mb-2 text-[11px] text-muted-foreground">Demo orders · projected exposure, not accrued charges</p>
      {!part.orders?.length ? <p className="text-xs text-muted-foreground">No sales orders pegged to this part.</p> : <ul className="divide-y rounded border">
        {part.orders.map((o) => {
          const slip = orderSlipDays(part, o); const penalty = projectedPenalty(part, o);
          return <li key={o.so} className="space-y-2 p-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="break-words font-medium">{o.customer}</div>
                {visible.tiers && <span className="inline-block rounded border px-1.5 py-0.5 text-[11px] font-semibold">{CUSTOMER_TIERS[customerTier(o)]}</span>}
                <div className="font-mono text-[11px] text-muted-foreground">{o.so} · {eur(o.value)}</div>
                <div>Committed {new Date(o.committed).toLocaleDateString("en-GB")}</div>
                 <div>{ORDER_STATUSES[orderStatus(o)]} · {FREIGHT_MODES[o.freightMode ?? "unspecified"]}</div>
                 {o.originalCommitted && <div className="text-muted-foreground">Original commitment {o.originalCommitted.slice(0, 10)}</div>}
                 {o.transportReference && <div className="break-all">{o.transportReference}</div>}
              </div>
              <Button size="icon" variant="ghost" aria-label={`Edit terms for ${o.so}`} title="Edit customer terms" onClick={() => edit(o)}><Pencil aria-hidden className="size-4" /></Button>
            </div>
            <div className={slip > 0 ? "font-semibold text-critical" : "text-success"}>{orderStatus(o) === "cancelled" ? "Cancelled · excluded from exposure" : slip > 0 ? `Projected slip ${slip}d` : "On track"}</div>
            {orderStatus(o) !== "cancelled" && visible.tiers && o.otifImpact !== false && <div className="text-muted-foreground">OTIF: {slip > 0 ? "delivery-date risk" : "on track"}</div>}
            {orderStatus(o) !== "cancelled" && visible.penalties && <div className="text-muted-foreground">{o.penaltyPerDay > 0 ? <>{eur(o.penaltyPerDay)}/day · {o.penaltyGraceDays ?? 0}d grace<br />Projected penalty {eur(penalty.total)} · {penalty.chargeableDays} chargeable days</> : "No daily penalty configured"}</div>}
            <OrderOperations order={o} />
          </li>;
        })}
      </ul>}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Customer terms</DialogTitle><DialogDescription>{editing?.customer} · {editing?.so}</DialogDescription></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save(); }} className="space-y-4">
            <label className="block space-y-1 text-xs"><span>Customer priority tier</span>
              <select aria-label="Customer priority tier" value={tier} onChange={(e) => setTier(e.target.value as CustomerTier)} className="h-11 w-full rounded-md border border-input bg-card px-3">
                {Object.entries(CUSTOMER_TIERS).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs"><span>Daily penalty (€)</span><Input aria-label="Daily penalty (€)" type="number" min="0" step="0.01" required value={daily} onChange={(e) => setDaily(e.target.value)} /></label>
              <label className="space-y-1 text-xs"><span>Grace period (days)</span><Input aria-label="Grace period (days)" type="number" min="0" max="365" step="1" required value={grace} onChange={(e) => setGrace(e.target.value)} /></label>
            </div>
            <label className="flex min-h-11 items-center gap-3 text-xs"><input type="checkbox" className="size-11 accent-primary" checked={otif} onChange={(e) => setOtif(e.target.checked)} />Track committed-date risk for OTIF</label>
            {!valid && <p role="alert" className="text-xs text-critical">Enter a non-negative penalty and 0–365 whole grace days.</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" disabled={!valid}>Save terms</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}