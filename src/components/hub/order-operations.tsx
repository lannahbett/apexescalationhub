import { useState } from "react";
import { CalendarClock, Truck, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FREIGHT_MODES, ORDER_STATUSES, orderStatus, validateOrderChange, expediteComparison, eur, type CustomerOrder, type OrderStatus, type FreightMode, type Part } from "@/lib/shortages";
import { useHub } from "./store";

const selectClass = "h-11 w-full rounded-md border border-input bg-card px-2 text-xs";
export function OrderOperations({ order }: { order: CustomerOrder }) {
  const { updateOrder } = useHub();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(orderStatus(order));
  const [date, setDate] = useState(order.committed.slice(0, 10));
  const [freight, setFreight] = useState<FreightMode>(order.freightMode ?? "unspecified");
  const [reference, setReference] = useState(order.transportReference ?? "");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  // Unchanged pull-in/push-out labels may be retained when editing freight only.
  const validationStatus = date === order.committed.slice(0, 10) && status === orderStatus(order) ? "standard" : status;
  const valid = validateOrderChange(order, validationStatus, date, freight) && note.trim().length > 0 && confirmed;
  const start = () => { setStatus(orderStatus(order)); setDate(order.committed.slice(0, 10)); setFreight(order.freightMode ?? "unspecified"); setReference(order.transportReference ?? ""); setNote(""); setConfirmed(false); setOpen(true); };
  return <>
    <Button variant="outline" size="sm" aria-label={`Manage order ${order.so}`} onClick={start}><CalendarClock aria-hidden className="size-4" /> Manage order</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent><DialogHeader><DialogTitle>Order change · {order.so}</DialogTitle><DialogDescription>{order.customer} · current commitment {order.committed.slice(0, 10)}</DialogDescription></DialogHeader>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!valid) return;
          updateOrder(order.so, { status, committed: date === order.committed.slice(0, 10) ? order.committed : `${date}T00:00:00Z`, originalCommitted: order.originalCommitted ?? order.committed, freightMode: freight, transportReference: reference.trim() },
            `${ORDER_STATUSES[status]}: commitment ${order.committed.slice(0, 10)} → ${date}; outbound ${FREIGHT_MODES[freight]}${reference.trim() ? ` · ${reference.trim()}` : ""}. ${note.trim()}`);
          setOpen(false); toast.success("Order updated across linked parts"); }}>
          <label className="block space-y-1 text-xs"><span>Order status</span><select aria-label="Order status" className={selectClass} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus)}>{Object.entries(ORDER_STATUSES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="block space-y-1 text-xs"><span>Confirmed committed date</span><Input type="date" aria-label="Confirmed committed date" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
          <label className="block space-y-1 text-xs"><span>Outbound freight mode</span><select aria-label="Outbound freight mode" className={selectClass} value={freight} onChange={(e) => setFreight(e.target.value as FreightMode)}>{Object.entries(FREIGHT_MODES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <label className="block space-y-1 text-xs"><span>Transport reference (optional)</span><Input aria-label="Outbound transport reference" value={reference} maxLength={120} onChange={(e) => setReference(e.target.value)} /></label>
          <label className="block space-y-1 text-xs"><span>Reason / approval reference</span><Input aria-label="Order change reason" required value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} /></label>
          {status === "pull_in" && date >= order.committed.slice(0, 10) && validationStatus !== "standard" && <p role="alert" className="text-xs text-critical">Pull-in requires an earlier date.</p>}
          {status === "push_out" && date <= order.committed.slice(0, 10) && validationStatus !== "standard" && <p role="alert" className="text-xs text-critical">Push-out requires a later date.</p>}
          {status === "cancelled" && <p className="text-xs text-elevated">Cancellation removes customer exposure, not purchase orders or physical stock allocations.</p>}
          <label className="flex min-h-11 items-center gap-3 text-xs"><input type="checkbox" className="size-11 shrink-0 accent-primary" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />I confirm this approved change for every linked part.</label>
          <DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={!valid}>Confirm order change</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </>;
}

export function FreightAndExpedite({ part }: { part: Part }) {
  const { parts, update, commercialMode } = useHub();
  const [open, setOpen] = useState(false);
  const [freight, setFreight] = useState<FreightMode>(part.inboundFreight ?? "unspecified");
  const [reference, setReference] = useState(part.inboundReference ?? "");
  const [days, setDays] = useState("0"); const [cost, setCost] = useState("0"); const [downtime, setDowntime] = useState("0");
  const result = [days, cost, downtime].every((v) => v.trim() !== "") ? expediteComparison(parts, part.id, Number(days), Number(cost), Number(downtime), commercialMode) : null;
  return <section className="space-y-2 border-t pt-4">
    <h3 className="text-[11px] font-semibold uppercase text-muted-foreground">Inbound freight & expedite scenario</h3>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs"><span>{FREIGHT_MODES[part.inboundFreight ?? "unspecified"]}{part.inboundReference ? ` · ${part.inboundReference}` : ""}</span><Button variant="outline" size="sm" onClick={() => { setFreight(part.inboundFreight ?? "unspecified"); setReference(part.inboundReference ?? ""); setOpen(true); }}><Truck aria-hidden className="size-4" /> Edit inbound freight</Button></div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Inbound freight · {part.po}</DialogTitle><DialogDescription>{part.supplier}</DialogDescription></DialogHeader><form className="space-y-3" onSubmit={(e) => { e.preventDefault(); update(part.id, { inboundFreight: freight, inboundReference: reference.trim() }, { kind: "note", text: `Inbound freight: ${FREIGHT_MODES[freight]}${reference.trim() ? ` · ${reference.trim()}` : ""}.` }); setOpen(false); }}>
      <label className="block space-y-1 text-xs"><span>Inbound freight mode</span><select className={selectClass} aria-label="Inbound freight mode" value={freight} onChange={(e) => setFreight(e.target.value as FreightMode)}>{Object.entries(FREIGHT_MODES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      <label className="block space-y-1 text-xs"><span>Transport reference (optional)</span><Input aria-label="Inbound transport reference" value={reference} maxLength={120} onChange={(e) => setReference(e.target.value)} /></label><DialogFooter><Button type="submit">Save inbound freight</Button></DialogFooter></form></DialogContent></Dialog>
    <div className="flex items-center gap-2 pt-2 text-xs font-semibold"><Calculator aria-hidden className="size-4" /> Expedite comparison</div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <label className="space-y-1 text-xs"><span>Days saved</span><Input aria-label="Days saved" type="number" min="0" max="365" step="1" value={days} onChange={(e) => setDays(e.target.value)} /></label>
      <label className="space-y-1 text-xs"><span>Extra freight (€)</span><Input aria-label="Extra freight cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
      <label className="space-y-1 text-xs"><span>Downtime avoided / day (€)</span><Input aria-label="Downtime cost per day" type="number" min="0" step="0.01" value={downtime} onChange={(e) => setDowntime(e.target.value)} /></label>
    </div>
    {result ? <dl className="grid grid-cols-2 gap-2 text-xs">
      {commercialMode !== "tiers" && <><dt>Projected penalty saving</dt><dd className="text-right font-mono">{eur(result.penaltySaving)}</dd></>}
      <dt>Assumed downtime saving</dt><dd className="text-right font-mono">{eur(result.downtimeSaving)}</dd><dt>Net estimated benefit</dt><dd className={`text-right font-mono font-semibold ${result.netSaving >= 0 ? "text-success" : "text-critical"}`}>{eur(result.netSaving)}</dd>
    </dl> : <p className="text-xs text-muted-foreground">{part.stage === "delivered" ? "Part already delivered." : "Enter non-negative costs and 0–365 whole days."}</p>}
    <p className="text-[11px] text-muted-foreground">Scenario only · other part delays remain · downtime is your assumption, not measured savings · no shipment booked.</p>
  </section>;
}
