import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Play, Truck, Mail, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { practiceParts } from "@/lib/practice";
import { sanitizeExtraction } from "@/lib/ai-parse";
import { applyOrderPatch, validateOrderChange, expediteComparison, eur, type Part } from "@/lib/shortages";
import { cn } from "@/lib/utils";

const missions = [
  { id: "freight", label: "Protect a customer delivery", icon: Truck, story: "A motor is four days late. Demo Medical Systems cannot finish its equipment without it. Compare an air-freight quote against the projected late-delivery fees.", takeaway: "The comparison is an estimate, not a booking or a promise. Real decisions must account for other missing parts and confirmed carrier dates." },
  { id: "inbound", label: "Review a supplier update", icon: Mail, story: "The supplier reports a longer delay. Review a prepared extraction and confirm it before it changes the practice part.", takeaway: "A supplier update can affect every linked customer order. The live inbound parser uses AI; this practice uses a fixed example and makes no AI request." },
  { id: "customer", label: "Agree a new delivery date", icon: CalendarClock, story: "The customer agrees to a later delivery. A push-out means moving a commitment later, not cancelling the order or fixing the physical shortage.", takeaway: "Only an approved customer commitment should replace the existing date. Moving it does not make parts arrive sooner; the shortage still needs follow-up." },
] as const;
type Mission = typeof missions[number]["id"];

export function GuidedPractice() {
  const [open, setOpen] = useState(false);
  const [mission, setMission] = useState<Mission | null>(null);
  const [step, setStep] = useState(0);
  const [parts, setParts] = useState<Part[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [days, setDays] = useState("2");
  const [cost, setCost] = useState("1800");
  const [date, setDate] = useState("2026-11-18");
  const [note, setNote] = useState("");
  const [draft, setDraft] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [outcome, setOutcome] = useState("");
  const part = parts[0]; const order = part?.orders?.[0];
  const selected = missions.find((m) => m.id === mission);
  const result = part && days.trim() && cost.trim() ? expediteComparison(parts, part.id, Number(days), Number(cost), 0, "dual") : null;
  const proposal = sanitizeExtraction({ updates: [{ partNumber: "DEMO-MOTOR", daysLate: 8, evidence: "The motor is now eight days late." }] }, parts)[0];
  const start = (id: Mission) => {
    setMission(id); setParts(practiceParts()); setStep(0); setConfirmed(false); setDays("2"); setCost("1800"); setDate("2026-11-18"); setNote(""); setReviewed(false); setOutcome(""); setDraft("");
  };
  const complete = () => {
    if (!confirmed || !part) return;
    if (mission === "freight" && result) setOutcome(`Air-freight scenario reviewed: ${eur(result.penaltySaving)} in projected fees avoided, less ${eur(Number(cost))} freight = ${eur(result.netSaving)} estimated benefit. No shipment booked.`);
    else if (mission === "inbound" && reviewed && proposal) {
      setParts((ps) => ps.map((p) => p.id === part.id ? { ...p, daysLate: Number(proposal.to) } : p));
      setOutcome("Practice part updated: delay is now 8 days. Your saved board is unchanged.");
    } else if (mission === "customer" && order && note.trim() && validateOrderChange(order, "push_out", date, "unspecified")) {
      setParts((ps) => applyOrderPatch(ps, order.so, { committed: `${date}T00:00:00Z`, status: "push_out" }, { kind: "date", at: new Date().toISOString(), by: "Practice tester", text: note.trim() }));
      setOutcome(`Practice order commitment moved to ${date}. The motor remains four days late; your saved board is unchanged.`);
    } else return;
    setStep(2);
  };
  const canComplete = confirmed && (mission === "freight" ? !!result : mission === "inbound" ? reviewed && !!proposal : !!order && !!note.trim() && validateOrderChange(order, "push_out", date, "unspecified"));
  return <>
    <Button variant="secondary" size="sm" onClick={() => { setMission(null); setOpen(true); }}><Play aria-hidden /> Guided practice</Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{selected?.label ?? "Guided practice"}</DialogTitle><DialogDescription>Fictional, isolated sample data · no saved-board changes or real messages</DialogDescription></DialogHeader>
      {!selected ? <div className="space-y-2">{missions.map((m, i) => <Button key={m.id} variant="outline" className="h-auto min-h-11 w-full justify-start whitespace-normal py-4 text-left" onClick={() => start(m.id)}><m.icon aria-hidden /><span><span className="block text-sm">{i + 1}. {m.label}</span><span className="block text-xs font-normal text-muted-foreground">{i === 0 ? "Compare cost and impact" : i === 1 ? "Review before applying" : "Confirm a customer commitment"}</span></span><ArrowRight className="ml-auto" /></Button>)}</div> : <>
        <ol aria-label="Mission progress" className="flex gap-3 border-b pb-3 text-xs">{["Understand", "Take action", "Review outcome"].map((label, i) => <li key={label} aria-current={step === i ? "step" : undefined} className={cn("flex items-center gap-1", step === i ? "font-semibold text-info" : "text-muted-foreground")}><span className="font-mono">{i + 1}.</span>{label}</li>)}</ol>
        {step === 0 && <><p className="text-sm leading-relaxed">{selected.story}</p><dl className="grid grid-cols-2 gap-3 border-y py-3 text-xs"><div><dt className="text-muted-foreground">Missing part</dt><dd className="font-mono">DEMO-MOTOR</dd></div><div><dt className="text-muted-foreground">Customer commitment</dt><dd className="font-mono">2026-11-12</dd></div><div><dt className="text-muted-foreground">Current delay</dt><dd>4 days</dd></div><div><dt className="text-muted-foreground">Contractual late fee</dt><dd>€2,500 / day</dd></div></dl><Button onClick={() => setStep(1)}>Start practice <ArrowRight /></Button></>}
        {step === 1 && <div className="space-y-4">
          {mission === "freight" && <><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><label className="space-y-1 text-xs">Days saved by air freight<Input aria-label="Practice days saved" type="number" min="0" max="365" step="1" value={days} onChange={(e) => { setDays(e.target.value); setConfirmed(false); }} /></label><label className="space-y-1 text-xs">Extra freight cost (€)<Input aria-label="Practice freight cost" type="number" min="0" value={cost} onChange={(e) => { setCost(e.target.value); setConfirmed(false); }} /></label></div>{result ? <dl className="space-y-2 border-y py-3 text-sm"><div className="flex justify-between"><dt>Projected fee saving</dt><dd className="font-mono">{eur(result.penaltySaving)}</dd></div><div className="flex justify-between"><dt>Net estimated benefit</dt><dd className={cn("font-mono font-semibold", result.netSaving >= 0 ? "text-success" : "text-critical")}>{eur(result.netSaving)}</dd></div></dl> : <p role="alert" className="text-xs text-critical">Use non-negative costs and 0–365 whole days.</p>}<p className="text-xs text-muted-foreground">No downtime assumption included. In the live board, other missing parts may reduce the benefit.</p></>}
          {mission === "inbound" && <><blockquote className="border-l-2 border-info bg-info-soft p-3 text-sm">“Update for DEMO-MOTOR: the motor is now eight days late. Please revise your plan.”</blockquote><Button variant="outline" onClick={() => setReviewed(true)}>Review prepared extraction</Button>{reviewed && <div role="status" className="border-y py-3 text-sm"><strong>Proposed change:</strong> delay 4 → 8 days<p className="mt-1 text-xs text-muted-foreground">Evidence: “the motor is now eight days late” · prepared example, not a live AI response</p></div>}</>}
          {mission === "customer" && <><label className="block space-y-1 text-xs">New agreed delivery date<Input aria-label="Practice committed date" type="date" value={date} onChange={(e) => { setDate(e.target.value); setConfirmed(false); }} /></label><label className="block space-y-1 text-xs">Customer approval reference<Input aria-label="Practice approval reference" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Demo customer agreed in writing" /></label>{date <= "2026-11-12" && <p role="alert" className="text-xs text-critical">A push-out needs a later date than 2026-11-12.</p>}</>}
          <label className="flex min-h-11 items-center gap-3 text-xs"><input type="checkbox" className="size-11 shrink-0 accent-primary" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />{mission === "freight" ? "I reviewed this estimate; it does not book transport." : mission === "inbound" ? "I confirm this extracted change for the practice part." : "I confirm the customer approved this practice date change."}</label>
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setStep(0)}><ArrowLeft /> Back</Button><Button disabled={!canComplete} onClick={complete}>{mission === "freight" ? "Confirm scenario review" : "Confirm practice change"}<ArrowRight /></Button></div>
        </div>}
        {step === 2 && <div className="space-y-4"><div role="status" className="flex items-start gap-2 text-sm text-success"><CheckCircle2 className="size-5 shrink-0" /><p>{outcome}</p></div><p className="text-sm leading-relaxed">{selected.takeaway}</p>{mission === "inbound" && <p className="font-mono text-xs">Practice part delay: {part?.daysLate} days</p>}{mission === "customer" && <p className="font-mono text-xs">Practice commitment: {order?.committed.slice(0, 10)}</p>}{mission === "freight" && <><Button variant="outline" onClick={() => setDraft("Dear Demo Motion Ltd, please confirm whether air freight can recover two days for DEMO-MOTOR. Quote the extra cost and provide a confirmed delivery date before approval. No transport is authorized by this request.")}>Prepare practice supplier request</Button>{draft && <label className="block space-y-1 text-xs">Practice supplier draft<Textarea aria-label="Practice supplier draft" value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-32" /></label>}</>}
          <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setMission(null)}>Other missions</Button><Button onClick={() => setOpen(false)}>Finish practice</Button></div>
        </div>}
      </>}
    </DialogContent></Dialog>
  </>;
}