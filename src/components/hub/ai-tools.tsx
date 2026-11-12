import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Inbox, Loader2, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { generateBriefing, parseInboundUpdate } from "@/lib/ai.functions";
import { sanitizeExtraction, type ProposedChange } from "@/lib/ai-parse";
import { CONFIDENCE, STAGES, ROLE_VIEWS, activeOrders, FREIGHT_MODES, customerTier, commercialVisibility, projectedPenalty, demandSurgePct, leadTimeDriftPct, orderSlipDays, type CommercialMode, type Part } from "@/lib/shortages";
import { useHub } from "./store";

export const summarize = (p: Part, mode: CommercialMode = "dual") => ({
  partNumber: p.partNumber, description: p.description, line: p.line, stage: p.stage, confidence: p.confidence,
  daysLate: p.daysLate, hoursToLineStop: p.hoursToLineStop, valueAtRisk: p.valueAtRisk, riskScore: p.riskScore,
  planner: p.planner, supplier: p.supplier, po: p.po, qtyPending: p.qtyPending, uom: p.uom,
  inboundFreight: FREIGHT_MODES[p.inboundFreight ?? "unspecified"], inboundReference: p.inboundReference ?? "",
  demandSurgePct: demandSurgePct(p.demand), leadTimeDriftPct: leadTimeDriftPct(p.leadTime),
  customerOrders: activeOrders(p).map((o) => ({ so: o.so, customer: o.customer, committed: o.committed.slice(0, 10), value: o.value, status: o.status ?? "standard", outboundFreight: FREIGHT_MODES[o.freightMode ?? "unspecified"], slipDays: orderSlipDays(p, o),
    ...(commercialVisibility(mode).tiers ? { tier: customerTier(o), otifImpact: o.otifImpact !== false } : {}),
    ...(commercialVisibility(mode).penalties ? { penaltyPerDay: o.penaltyPerDay, penaltyGraceDays: o.penaltyGraceDays ?? 0, projectedPenalty: projectedPenalty(p, o).total } : {}),
  })),
});

const label = (c: ProposedChange, v: string | number) =>
  c.field === "stage" ? STAGES.find((s) => s.id === v)?.label ?? String(v)
  : c.field === "confidence" ? CONFIDENCE[v as keyof typeof CONFIDENCE]?.label ?? String(v)
  : `${v} day(s) late`;

const safeJson = (s: string): unknown => { try { return JSON.parse(s); } catch { return null; } };

export function BriefingDialog() {
  const { parts, commercialMode, roleView } = useHub();
  const run = useServerFn(generateBriefing);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setText("");
    try { setText((await run({ data: { commercialMode, roleView, parts: parts.filter((p) => p.stage !== "delivered").map((p) => summarize(p, commercialMode)) } })).text); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Briefing failed"); }
    finally { setBusy(false); }
  };
  return (
    <Dialog onOpenChange={(o) => o && go()}>
      <DialogTrigger asChild><Button size="sm" variant="secondary"><Sparkles aria-hidden className="size-3.5" /> Standup briefing</Button></DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>60-second briefing · {ROLE_VIEWS.find((r) => r.id === roleView)?.label}</DialogTitle>
          <DialogDescription>AI-generated from open shortages on this board. Check figures before sharing.</DialogDescription>
        </DialogHeader>
        <div aria-live="polite" aria-busy={busy} className="max-h-[55dvh] overflow-y-auto whitespace-pre-wrap rounded border bg-muted/40 p-3 text-sm">
          {busy ? <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 aria-hidden className="size-4 animate-spin" /> Generating…</span> : text || "No briefing yet."}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" disabled={!text} onClick={() => { navigator.clipboard.writeText(text); toast.success("Briefing copied"); }}>Copy</Button>
          <Button onClick={go} disabled={busy}>Regenerate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InboundParserDialog() {
  const { parts, update } = useHub();
  const run = useServerFn(parseInboundUpdate);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [changes, setChanges] = useState<ProposedChange[] | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const reset = () => { setMsg(""); setChanges(null); setPicked(new Set()); };

  const analyze = async () => {
    setBusy(true);
    try {
      const { json } = await run({ data: { message: msg, partNumbers: parts.map((p) => p.partNumber) } });
      const c = sanitizeExtraction(safeJson(json), parts);
      setChanges(c); setPicked(new Set());
    } catch (e) { toast.error(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setBusy(false); }
  };

  const apply = () => {
    if (!changes) return;
    changes.forEach((c, i) => {
      if (!picked.has(i)) return;
      update(c.partId, { [c.field]: c.to } as Partial<Part>, {
        kind: c.field === "stage" ? "stage" : c.field === "confidence" ? "confidence" : "date",
        text: `Confirmed from supplier update: ${label(c, c.from)} → ${label(c, c.to)}${c.evidence ? ` — “${c.evidence}”` : ""}`,
      });
    });
    toast.success(`${picked.size} change(s) applied`);
    setOpen(false); reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild><Button size="sm" variant="secondary"><Inbox aria-hidden className="size-3.5" /> Parse supplier update</Button></DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Inbound supplier update</DialogTitle>
          <DialogDescription>Paste an email or carrier note. Nothing changes until you tick and confirm each change.</DialogDescription>
        </DialogHeader>
        {changes === null ? (
          <Textarea aria-label="Supplier or carrier message" value={msg} onChange={(e) => setMsg(e.target.value)} className="h-56 text-xs" placeholder="e.g. PO-4471 for SRV-…: shipment departed, AWB 123…, ETA Thursday" />
        ) : changes.length === 0 ? (
          <p className="rounded border bg-muted/40 p-3 text-sm">No valid changes for parts on this board were found.</p>
        ) : (
          <fieldset className="max-h-[50dvh] space-y-2 overflow-y-auto">
            <legend className="mb-2 text-xs text-muted-foreground">Proposed changes — select the ones you confirm</legend>
            {changes.map((c, i) => (
              <label key={i} className="flex min-h-11 cursor-pointer gap-3 rounded border p-2 text-xs">
                <Checkbox className="size-11 shrink-0" checked={picked.has(i)}
                  onCheckedChange={(v) => setPicked((s) => { const n = new Set(s); v ? n.add(i) : n.delete(i); return n; })} />
                <span>
                  <span className="font-mono font-semibold">{c.partNumber}</span> · {label(c, c.from)} → <strong>{label(c, c.to)}</strong>
                  {c.evidence && <span className="mt-1 block text-muted-foreground">“{c.evidence}”</span>}
                </span>
              </label>
            ))}
          </fieldset>
        )}
        <DialogFooter className="gap-2">
          {changes === null ? (
            <Button onClick={analyze} disabled={busy || !msg.trim()}>{busy && <Loader2 aria-hidden className="size-3.5 animate-spin" />} Analyze</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setChanges(null)}>Back</Button>
              <Button onClick={apply} disabled={picked.size === 0}>Apply {picked.size} confirmed</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
