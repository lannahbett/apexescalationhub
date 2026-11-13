import { useState } from "react";
import { CheckCircle2, CircleAlert, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FREIGHT_MODES, SHIPPING_DOCS, orderStatus, requiredShippingDocs, shippingReadiness, uniqueOrderRows, type CustomerOrder, type FreightMode, type ShippingInfo } from "@/lib/shortages";
import { useHub } from "./store";

export function ShippingGate() {
  const { parts, updateOrder } = useHub();
  const rows = uniqueOrderRows(parts).filter((r) => orderStatus(r.order) !== "cancelled");
  const [edit, setEdit] = useState<CustomerOrder | null>(null);
  const ready = rows.filter((r) => shippingReadiness(r.order).ready).length;
  return (
    <section id="shipping" tabIndex={-1} aria-labelledby="shipping-title" className="space-y-3 border-t pt-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="shipping-title" className="flex items-center gap-2 text-lg font-semibold"><Truck className="size-5" /> Outbound shipping & customs gate</h2>
          <p className="text-sm text-muted-foreground">Documents each customer order needs before it can leave the dock. {ready} of {rows.length} open orders ready. Saved in this browser; no customs or carrier systems are connected.</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border" tabIndex={0} aria-label="Shipping readiness table">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-muted text-left text-xs"><tr><th className="px-3 py-2">Sales order</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Freight</th><th className="px-3 py-2">Readiness</th><th className="px-3 py-2"><span className="sr-only">Action</span></th></tr></thead>
          <tbody>{rows.map(({ order }) => {
            const r = shippingReadiness(order);
            return <tr key={order.so} className="border-t">
              <td className="px-3 py-2 font-mono">{order.so}</td><td className="px-3 py-2">{order.customer}</td>
              <td className="px-3 py-2">{FREIGHT_MODES[order.freightMode ?? "unspecified"]}</td>
              <td className="px-3 py-2">{r.ready
                ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="size-4" /> Ready to ship</span>
                : <span className="inline-flex items-center gap-1 text-critical"><CircleAlert className="size-4" /> {!r.freightSet ? "Choose freight mode" : `${r.missing.length} of ${r.required.length} documents missing`}</span>}</td>
              <td className="px-3 py-2 text-right"><Button size="sm" variant="outline" onClick={() => setEdit(order)}>Documents</Button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      {edit && <DocsDialog order={edit} onClose={() => setEdit(null)} onSave={(freightMode, shipping) => { updateOrder(edit.so, { freightMode, shipping }, `Shipping documents updated (${shippingReadiness({ ...edit, freightMode, shipping }).ready ? "ready to ship" : "not ready"}).`); setEdit(null); }} />}
    </section>
  );
}

function DocsDialog({ order, onClose, onSave }: { order: CustomerOrder; onClose: () => void; onSave: (f: FreightMode, s: ShippingInfo) => void }) {
  const [freight, setFreight] = useState<FreightMode>(order.freightMode ?? "unspecified");
  const [info, setInfo] = useState<ShippingInfo>({ ...order.shipping, refs: { ...order.shipping?.refs } });
  const draft = { ...order, freightMode: freight, shipping: info };
  const required = requiredShippingDocs(draft);
  const flag = (k: "outsideEu" | "preferential" | "romania", label: string) => (
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 accent-primary" checked={!!info[k]} onChange={(e) => setInfo({ ...info, [k]: e.target.checked })} />{label}</label>
  );
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader><DialogTitle>Shipping documents · {order.so}</DialogTitle><DialogDescription>{order.customer}. Enter each document number once it exists; the list changes with freight mode and destination.</DialogDescription></DialogHeader>
        <label className="flex flex-col gap-1 text-sm font-medium">Freight mode
          <select value={freight} onChange={(e) => setFreight(e.target.value as FreightMode)} className="min-h-11 rounded-md border border-input bg-card px-2">{Object.entries(FREIGHT_MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </label>
        <fieldset className="space-y-1"><legend className="text-sm font-medium">Destination</legend>
          {flag("outsideEu", "Leaves the EU (export customs needed)")}
          {info.outsideEu && flag("preferential", "Customer claims preferential origin (EUR.1)")}
          {(freight === "road" || freight === "express") && flag("romania", "Road route enters or crosses Romania (UIT)")}
        </fieldset>
        <div className="space-y-3">{required.map((d) => (
          <label key={d} className="flex flex-col gap-1 text-sm"><span className="font-medium">{SHIPPING_DOCS[d].label}</span>
            <span className="text-xs text-muted-foreground">{SHIPPING_DOCS[d].help}</span>
            <Input className="min-h-11" placeholder="Document number" value={info.refs?.[d] ?? ""} onChange={(e) => setInfo({ ...info, refs: { ...info.refs, [d]: e.target.value.slice(0, 80) } })} />
          </label>))}
        </div>
        <DialogFooter className="gap-2"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(freight, info)}>Save documents</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
