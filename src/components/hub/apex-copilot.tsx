import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Loader2, Check } from "lucide-react";
import { buildGuidance, guidanceRoleFor, type GuidanceRole } from "@/lib/copilot-guidance";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { askApex } from "@/lib/ai.functions";
import type { GroundSource } from "@/lib/handbook";
import { summarize } from "./ai-tools";
import { useHub } from "./store";
import { useWorkNotes } from "./workspace-notes";
import { toast } from "sonner";
import { HANDBOOK } from "@/lib/handbook";
const HANDBOOK_TITLES: Record<string, string> = Object.fromEntries(HANDBOOK.map((h) => [`guide:${h.id}`, h.title]));

const LENSES: { id: GuidanceRole | "all"; label: string }[] = [{ id: "all", label: "All" }, { id: "planner", label: "Planner" }, { id: "buyer", label: "Buyer" }, { id: "om", label: "Order Mgmt" }];
const QUICK = ["Which lines may stop today and what should I check?", "When is expediting worth more than the customer penalty?", "How do I handle a customer push-out and the SAP dates?"];

export function ApexCopilot({ onOpen }: { onOpen?: (id: string) => void }) {
  const { parts, sync, commercialMode, roleView } = useHub();
  const [open, setOpen] = useState(false);
  const [lens, setLens] = useState<GuidanceRole | "all">(() => guidanceRoleFor(roleView));
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const plan = useMemo(() => buildGuidance(parts, commercialMode), [parts, commercialMode]);
  const shownPlan = plan.filter((g) => lens === "all" || g.role === lens).slice(0, 8);
  const { save, ready } = useWorkNotes();
  const run = useServerFn(askApex);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ question: string; sources: GroundSource[]; conflicts: string[]; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = sync === "checking" || sync === "connecting";
  const ask = async () => { if (busy || pending || !question.trim()) return; setBusy(true); setError(""); setAnswer(null); try { const result = await run({ data: { question, parts: parts.map((p) => summarize(p, commercialMode)) } }); setAnswer({ question, sources: result.sources, conflicts: result.conflicts, at: new Date().toLocaleTimeString() }); } catch (e) { setError(e instanceof Error ? e.message : "Guidance unavailable"); } finally { setBusy(false); } };
  return <Sheet open={open} onOpenChange={setOpen}><SheetTrigger asChild><Button variant="secondary" size="sm"><MessageCircle aria-hidden className="size-4" />Ask Apex AI</Button></SheetTrigger>
    <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Ask Apex AI</SheetTitle><SheetDescription>Advisory · Groq selects relevant handbook and board excerpts. Facts below are quoted, not generated, but AI accuracy cannot be guaranteed: the selected excerpts may be incomplete or not answer your question. Verify before acting.</SheetDescription></SheetHeader>
      <section aria-labelledby="plan-h" className="mt-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 id="plan-h" className="font-semibold">Live action plan</h3><span className="text-xs text-muted-foreground">{pending ? "Loading board…" : `${plan.length - [...reviewed].filter((id) => plan.some((g) => g.id === id)).length} open steps · updates with the board`}</span></div>
        <div role="group" aria-label="Guidance for" className="flex flex-wrap gap-1">{LENSES.map((l) => <Button key={l.id} size="sm" variant={lens === l.id ? "default" : "outline"} aria-pressed={lens === l.id} onClick={() => setLens(l.id)}>{l.label}</Button>)}</div>
        <p className="text-xs text-muted-foreground">Rule-based steps from board records, each citing the handbook. You decide: nothing is sent, booked or changed.</p>
        {!pending && shownPlan.length === 0 && <p className="text-sm">No open steps for this lens on the current board.</p>}
        <ol className="space-y-2">{!pending && shownPlan.map((g) => { const done = reviewed.has(g.id); const src = HANDBOOK_TITLES[g.source]; return <li key={g.id} data-testid="guidance-step" className={`rounded-md border p-3 text-sm ${done ? "opacity-60" : ""}`}>
          <p className="font-semibold">{g.partNumber} · {g.title}</p>
          <ul className="mt-1 list-disc pl-5 text-xs text-muted-foreground">{g.facts.map((f) => <li key={f}>{f}</li>)}</ul>
          <p className="mt-2">{g.action}</p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Source: {src ?? g.source}</p>
          <div className="mt-2 flex flex-wrap gap-2">{onOpen && <Button size="sm" variant="outline" onClick={() => { setOpen(false); onOpen(g.partId); }}>Open part</Button>}
            <Button size="sm" variant="ghost" aria-pressed={done} onClick={() => setReviewed((r) => { const n = new Set(r); if (n.has(g.id)) n.delete(g.id); else n.add(g.id); return n; })}><Check aria-hidden className="size-4" />{done ? "Reviewed" : "Mark reviewed"}</Button></div>
        </li>; })}</ol>
        {shownPlan.length > 0 && <Button size="sm" variant="outline" disabled={!ready} onClick={() => { if (save({ title: `Action plan ${new Date().toLocaleDateString()}`, body: shownPlan.map((g) => `${g.partNumber}: ${g.title}\n${g.facts.join("; ")}\nNext: ${g.action}\nSource: ${g.source}${reviewed.has(g.id) ? "\n(reviewed)" : ""}`).join("\n\n"), category: "note", reference: "", pinned: false })) toast.success("Action plan saved to private notes"); }}>Save plan to notes</Button>}
      </section>
      <h3 className="mt-6 font-semibold">Ask a question</h3>
      <div className="mt-2 flex flex-wrap gap-2">{QUICK.map((q) => <Button key={q} size="sm" variant="outline" className="h-auto min-h-11 whitespace-normal text-left" onClick={() => setQuestion(q)}>{q}</Button>)}</div>
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
        <label className="block space-y-1 text-sm"><span>Your question</span><Textarea aria-label="Your question" maxLength={1500} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is the difference between planned GI and PGI?" /></label>
        <p className="text-xs text-muted-foreground">Your question and the current board summary go to Groq. Do not include confidential information.</p>
        <Button disabled={busy || pending || !question.trim()}>{busy && <Loader2 aria-hidden className="size-4 animate-spin" />}{busy ? "Finding evidence…" : "Ask"}</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-critical">{error}</p>}
      <div aria-live="polite" className="mt-4 space-y-4">
        {answer && <><h3 className="font-semibold">Relevant verified excerpts</h3><p className="text-xs text-muted-foreground">Board snapshot at {answer.at}. This is not live SAP information.</p>{answer.conflicts.length > 0 && <div role="alert" className="rounded-md border border-critical p-3 text-sm"><p className="font-semibold">Conflicting board facts</p>{answer.conflicts.map((c) => <p key={c}>{c}</p>)}</div>}{answer.sources.length === 0 ? <p>I cannot verify an answer from the handbook or this board. Check with your planner or SAP key user.</p> : answer.sources.map((source) => <section key={source.id} data-testid="copilot-source" className="space-y-1 border-l-2 border-primary pl-3"><h4 className="text-sm font-semibold">{source.title}</h4><p className="whitespace-pre-wrap break-words text-sm">{source.text}</p><p className="font-mono text-xs text-muted-foreground">Source: {source.id}</p></section>)}
          {answer.sources.length > 0 && <Button variant="outline" disabled={!ready} onClick={() => { if (save({ title: answer.question.slice(0, 120), body: answer.sources.map((s) => `${s.title}\n${s.text}\nSource: ${s.id}`).join("\n\n"), category: "note", reference: "", pinned: false })) toast.success("Guidance saved to private notes"); }}>Save to notes</Button>}
          <p className="text-xs text-muted-foreground">Advisory only. AI accuracy cannot be guaranteed; check excerpts against SAP and your team. Nothing was sent, approved or changed on the board.</p></>}
      </div>
    </SheetContent></Sheet>;
}