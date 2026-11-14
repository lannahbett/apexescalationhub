import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { askApex } from "@/lib/ai.functions";
import type { GroundSource } from "@/lib/handbook";
import { summarize } from "./ai-tools";
import { useHub } from "./store";
import { useWorkNotes } from "./workspace-notes";
import { toast } from "sonner";

export function ApexCopilot() {
  const { parts, sync, commercialMode } = useHub();
  const { save, ready } = useWorkNotes();
  const run = useServerFn(askApex);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ question: string; sources: GroundSource[]; at: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = sync === "checking" || sync === "connecting";
  const ask = async () => { if (busy || pending || !question.trim()) return; setBusy(true); setError(""); setAnswer(null); try { const result = await run({ data: { question, parts: parts.map((p) => summarize(p, commercialMode)) } }); setAnswer({ question, sources: result.sources, at: new Date().toLocaleTimeString() }); } catch (e) { setError(e instanceof Error ? e.message : "Guidance unavailable"); } finally { setBusy(false); } };
  return <Sheet><SheetTrigger asChild><Button variant="secondary" size="sm"><MessageCircle aria-hidden className="size-4" />Ask Apex AI</Button></SheetTrigger>
    <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Ask Apex AI</SheetTitle><SheetDescription>Advisory · Groq selects relevant handbook and board excerpts. Facts below are quoted, not generated. Relevance can still be mistaken.</SheetDescription></SheetHeader>
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); void ask(); }}>
        <label className="block space-y-1 text-sm"><span>Your question</span><Textarea aria-label="Your question" maxLength={1500} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is the difference between planned GI and PGI?" /></label>
        <p className="text-xs text-muted-foreground">Your question and the current board summary go to Groq. Do not include confidential information.</p>
        <Button disabled={busy || pending || !question.trim()}>{busy && <Loader2 aria-hidden className="size-4 animate-spin" />}{busy ? "Finding evidence…" : "Ask"}</Button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-critical">{error}</p>}
      <div aria-live="polite" className="mt-4 space-y-4">
        {answer && <><h3 className="font-semibold">Relevant verified excerpts</h3><p className="text-xs text-muted-foreground">Board snapshot at {answer.at}. This is not live SAP information.</p>{answer.sources.length === 0 ? <p>I cannot verify an answer from the handbook or this board. Check with your planner or SAP key user.</p> : answer.sources.map((source) => <section key={source.id} className="space-y-1 border-l-2 border-primary pl-3"><h4 className="text-sm font-semibold">{source.title}</h4><p className="whitespace-pre-wrap break-words text-sm">{source.text}</p><p className="font-mono text-xs text-muted-foreground">Source: {source.id}</p></section>)}
          {answer.sources.length > 0 && <Button variant="outline" disabled={!ready} onClick={() => { if (save({ title: answer.question.slice(0, 120), body: answer.sources.map((s) => `${s.title}\n${s.text}\nSource: ${s.id}`).join("\n\n"), category: "note", reference: "", pinned: false })) toast.success("Guidance saved to private notes"); }}>Save to notes</Button>}
          <p className="text-xs text-muted-foreground">Advisory only. Nothing was sent, approved or changed on the board.</p></>}
      </div>
    </SheetContent></Sheet>;
}