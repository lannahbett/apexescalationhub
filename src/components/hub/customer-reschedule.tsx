import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { draftCustomerReschedule } from "@/lib/ai.functions";
import { rescheduleSchema, type RescheduleInput } from "@/lib/work-notes";
import { useHub } from "./store";
import { useWorkNotes } from "./workspace-notes";

export function CustomerReschedule() {
  const { parts, actor } = useHub(); const { ready, save, track } = useWorkNotes();
  const orders = [...new Map(parts.flatMap((p) => (p.orders ?? []).filter((o) => o.status !== "cancelled").map((o) => [o.so, o] as const))).values()];
  const [so, setSo] = useState(""); const order = orders.find((o) => o.so === so);
  const [direction, setDirection] = useState<RescheduleInput["direction"]>("push_out");
  const [proposed, setProposed] = useState(""); const [firstDate, setFirstDate] = useState(""); const [plannedGi, setPlannedGi] = useState("");
  const [customerPo, setCustomerPo] = useState(""); const [reason, setReason] = useState(""); const [sender, setSender] = useState("");
  const [text, setText] = useState(""); const [reviewed, setReviewed] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const run = useServerFn(draftCustomerReschedule);
  const invalidate = () => { setText(""); setReviewed(false); setError(""); };
  const generate = async () => { if (!order) return; const parsed = rescheduleSchema.safeParse({ so, customer: order.customer, customerPo, direction, committed: order.committed.slice(0, 10), proposed, firstDate, plannedGi, reason, sender, part: parts.filter((p) => p.orders?.some((o) => o.so === so)).map((p) => p.partNumber).join(", ") }); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check all fields"); return; } setBusy(true); setError(""); setText(""); try { setText((await run({ data: parsed.data })).text); setReviewed(false); } catch (e) { setError(e instanceof Error ? e.message : "Draft unavailable"); } finally { setBusy(false); } };
  return <Dialog onOpenChange={(open) => { if (open && !sender) setSender(actor); }}><DialogTrigger asChild><Button variant="secondary" size="sm"><Mail aria-hidden className="size-4" />Customer reschedule</Button></DialogTrigger>
    <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Customer reschedule request</DialogTitle><DialogDescription>Draft only · no email sent, customer approval recorded or SAP dates changed. Verify First Date with your SAP key user; actual PGI is not a planned date.</DialogDescription></DialogHeader>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void generate(); }}><fieldset disabled={busy} className="space-y-3">
        <label className="block text-xs">Sales order<select aria-label="Reschedule sales order" required className="h-11 w-full rounded border border-input bg-card px-2" value={so} onChange={(e) => { setSo(e.target.value); setProposed(""); setFirstDate(""); setPlannedGi(""); invalidate(); }}><option value="">Choose an order</option>{orders.map((o) => <option key={o.so} value={o.so}>{o.so} · {o.customer}</option>)}</select></label>
        {order && <p className="text-sm">Current commitment: <strong>{order.committed.slice(0, 10)}</strong></p>}
        <label className="block text-xs">Request<select aria-label="Reschedule direction" className="h-11 w-full rounded border border-input bg-card px-2" value={direction} onChange={(e) => { setDirection(e.target.value as RescheduleInput["direction"]); invalidate(); }}><option value="push_out">Push-out (later delivery)</option><option value="pull_in">Pull-in (earlier delivery)</option></select></label>
        <div className="grid gap-3 sm:grid-cols-2">{[["Proposed delivery", proposed, setProposed], ["Proposed First Date (optional)", firstDate, setFirstDate], ["Proposed planned GI (optional)", plannedGi, setPlannedGi]].map(([label, value, setter]) => <label key={String(label)} className="block min-w-0 text-xs">{String(label)}<Input aria-label={String(label)} type="date" required={label === "Proposed delivery"} value={String(value)} onChange={(e) => { if (typeof setter === "function") setter(e.target.value); invalidate(); }} /></label>)}</div>
        <label className="block text-xs">Customer PO (optional, not supplied by board)<Input aria-label="Customer PO" maxLength={120} value={customerPo} onChange={(e) => { setCustomerPo(e.target.value); invalidate(); }} /></label>
        <label className="block text-xs">Customer-safe reason<Textarea aria-label="Customer-safe reason" required maxLength={1500} value={reason} onChange={(e) => { setReason(e.target.value); invalidate(); }} /></label>
        <label className="block text-xs">Sender name<Input aria-label="Customer draft sender" required maxLength={80} value={sender} onChange={(e) => { setSender(e.target.value); invalidate(); }} /></label>
        <p className="text-xs text-muted-foreground">These fields are sent to Groq for a constrained draft. Review before sharing customer data.</p><Button disabled={!order || busy}>{busy && <Loader2 className="size-4 animate-spin" />}{busy ? "Preparing draft…" : "Prepare reviewed draft"}</Button>
      </fieldset></form>
      {error && <p role="alert" className="text-sm text-critical">{error}</p>}
      {text && <div className="space-y-3"><label className="block text-xs">Editable email draft<Textarea aria-label="Customer email draft" className="min-h-64" maxLength={12000} value={text} onChange={(e) => { setText(e.target.value); setReviewed(false); }} /></label>
        <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" className="size-5 accent-primary" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />I reviewed the dates, wording and request. This is not approval.</label>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!reviewed} onClick={async () => { try { await navigator.clipboard.writeText(text); toast.success("Draft copied, not sent"); } catch { toast.error("Clipboard unavailable"); } }}>Copy email draft</Button><Button disabled={!reviewed || !ready} onClick={() => { if (save({ title: `${so} ${direction === "push_out" ? "push-out" : "pull-in"} request`, body: text, reference: so, category: "customer_email", pinned: false })) toast.success("Email draft saved to private notes"); }}>Save draft to notes</Button><Button variant="outline" disabled={!reviewed || !ready || !order} onClick={() => { if (order && track({ so, customer: order.customer, direction, committed: order.committed.slice(0, 10), proposed, firstDate, plannedGi, response: "awaiting", alternativeDate: "", responseNote: "", sapDone: [] })) toast.success("Added to approval tracker as awaiting customer"); }}>Add to approval tracker</Button></div></div>}
    </DialogContent></Dialog>;
}