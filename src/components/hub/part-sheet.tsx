import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Copy, Mail, MessageSquare, Phone, ShieldCheck, Workflow, ListChecks, Send, Gauge } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CONFIDENCE, CURRENT_USER, eur, type Confidence, type Part, type TimelineEntry } from "@/lib/shortages";
import { ConfidencePill, LineStop, PlannerBadge, RiskPill } from "./badges";
import { StageSelect } from "./board";
import { useHub } from "./store";

const kindIcon: Record<TimelineEntry["kind"], typeof Mail> = {
  date: CalendarClock, contact: Phone, note: MessageSquare, confidence: ShieldCheck, stage: Workflow, checklist: ListChecks,
};
const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export function PartSheet({ partId, onClose }: { partId: string | null; onClose: () => void }) {
  const { parts, update } = useHub();
  const part = parts.find((p) => p.id === partId);
  const [note, setNote] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [confOpen, setConfOpen] = useState(false);

  return (
    <Sheet open={!!part} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {part && (
          <>
            <SheetHeader className="border-b bg-sidebar p-5 text-sidebar-foreground">
              <div className="flex items-center gap-2"><RiskPill score={part.riskScore} /><ConfidencePill value={part.confidence} /></div>
              <SheetTitle className="font-mono text-lg text-sidebar-foreground">{part.partNumber}</SheetTitle>
              <SheetDescription className="text-sidebar-foreground/70">{part.description} · {part.category}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5 p-5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ["Line", part.line],
                  ["Target build", new Date(part.targetBuild).toLocaleDateString("en-GB")],
                  ["Value at risk", eur(part.valueAtRisk)],
                  ["Qty pending", `${part.qtyPending.toLocaleString()} ${part.uom}`],
                  ["Supplier", part.supplier],
                  ["PO", part.po],
                ].map(([k, v]) => (
                  <div key={k} className="rounded border bg-muted/50 p-2">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
                    <div className="font-medium">{v}</div>
                  </div>
                ))}
                <div className="rounded border bg-muted/50 p-2"><div className="text-[10px] uppercase tracking-wide text-muted-foreground">Status</div><LineStop hours={part.hoursToLineStop} daysLate={part.daysLate} /></div>
                <div className="rounded border bg-muted/50 p-2"><div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">Planner</div><PlannerBadge name={part.planner} /></div>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Workflow stage</div>
                <StageSelect part={part} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" onClick={() => setEmailOpen(true)}><Send className="size-3.5" /> Draft Supplier Escalation</Button>
                <Button size="sm" variant="outline" onClick={() => setConfOpen(true)}><Gauge className="size-3.5" /> Update Fix Confidence</Button>
              </div>

              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mitigation checklist</h3>
                <div className="space-y-1.5 rounded border p-3">
                  {part.checklist.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 text-xs">
                      <Checkbox
                        checked={c.done}
                        onCheckedChange={(v) =>
                          update(part.id, { checklist: part.checklist.map((x) => (x.id === c.id ? { ...x, done: !!v } : x)) },
                            { kind: "checklist", text: `${v ? "Completed" : "Reopened"}: ${c.label}` })
                        }
                      />
                      <span className={cn(c.done && "text-muted-foreground line-through")}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Audit timeline</h3>
                <form className="mb-3 flex gap-2" onSubmit={(e) => {
                  e.preventDefault(); if (!note.trim()) return;
                  update(part.id, {}, { kind: "note", text: note.trim() }); setNote("");
                }}>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note or supplier contact…" className="h-8 text-xs" />
                  <Button size="sm" type="submit" variant="secondary">Log</Button>
                </form>
                <ol className="relative space-y-3 border-l pl-4">
                  {part.timeline.map((t, i) => {
                    const Icon = kindIcon[t.kind];
                    return (
                      <li key={i} className="relative">
                        <span className="absolute -left-[25px] grid size-4 place-items-center rounded-full border bg-card"><Icon className="size-2.5 text-muted-foreground" /></span>
                        <div className="text-xs">{t.text}</div>
                        <div className="text-[11px] text-muted-foreground">{fmt(t.at)} · {t.by}</div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            </div>
            <EscalationDialog part={part} open={emailOpen} onOpenChange={setEmailOpen} />
            <ConfidenceDialog part={part} open={confOpen} onOpenChange={setConfOpen} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function draftEmail(p: Part) {
  const deadline = new Date(new Date(p.targetBuild).getTime() - 86400000).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  return `Dear ${p.supplier} Order Management,

Subject: URGENT EXPEDITE REQUEST – ${p.po} – ${p.partNumber}

We are formally escalating the open delivery against purchase order ${p.po}. The shortfall is now directly threatening production at our ${p.line} assembly line.

Part number:     ${p.partNumber}
Description:     ${p.description} (${p.category})
Open quantity:   ${p.qtyPending.toLocaleString()} ${p.uom}
Current delay:   ${p.daysLate} day(s) past confirmed date
Production run at risk: ${eur(p.valueAtRisk)}

Required delivery deadline: ${deadline}, at our receiving dock no later than 10:00 CET.

Please provide within 24 hours:
1. A confirmed ship date and tracking / AWB number
2. Options for partial or split shipment of available stock
3. Approval for expedited freight at your cost, given the delay

If this deadline cannot be met, please notify us immediately so we can activate alternative sourcing.

Kind regards,
${CURRENT_USER}
Material Planning – Apex Manufacturing`;
}

function EscalationDialog({ part, open, onOpenChange }: { part: Part; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { update } = useHub();
  const [body, setBody] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) setBody(draftEmail(part)); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={() => setBody(draftEmail(part))}>
        <DialogHeader>
          <DialogTitle>Supplier escalation draft</DialogTitle>
          <DialogDescription>To: {part.supplierContact}</DialogDescription>
        </DialogHeader>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="h-80 font-mono text-xs" />
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => { navigator.clipboard.writeText(body); toast.success("Email copied to clipboard"); }}><Copy className="size-3.5" /> Copy</Button>
          <Button onClick={() => {
            window.location.href = `mailto:${part.supplierContact}?subject=${encodeURIComponent(`URGENT EXPEDITE – ${part.po} – ${part.partNumber}`)}&body=${encodeURIComponent(body)}`;
            update(part.id, {}, { kind: "contact", text: `Escalation email sent to ${part.supplierContact}.` });
            onOpenChange(false);
          }}><Mail className="size-3.5" /> Open in mail & log</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfidenceDialog({ part, open, onOpenChange }: { part: Part; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { update } = useHub();
  const [val, setVal] = useState<Confidence>(part.confidence);
  const [note, setNote] = useState("");
  return (
    <Dialog open={open} onOpenChange={(o) => { if (o) { setVal(part.confidence); setNote(""); } onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update fix confidence</DialogTitle>
          <DialogDescription>A note is required for the audit trail.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(CONFIDENCE) as Confidence[]).map((c) => (
            <button type="button" key={c} aria-pressed={val === c} onClick={() => setVal(c)} className={cn("rounded border p-2 text-left", val === c ? "border-ring bg-accent" : "hover:bg-muted")}>
              <ConfidencePill value={c} />
              <div className="mt-1 text-[11px] text-muted-foreground">{CONFIDENCE[c].hint}</div>
            </button>
          ))}
        </div>
        <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why is confidence changing? (required)" className="text-xs" />
        <DialogFooter>
          <Button disabled={!note.trim()} onClick={() => {
            update(part.id, { confidence: val }, { kind: "confidence", text: `Confidence set to ${CONFIDENCE[val].label} — ${note.trim()}` });
            toast.success("Fix confidence updated");
            onOpenChange(false);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
