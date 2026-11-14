import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize, Pause, Play, Presentation, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { STANDUP_SECONDS, eur, standupParts, type Part } from "@/lib/shortages";
import { useHub } from "./store";
import { StockProjection } from "./stock-projection";
import { toast } from "sonner";

export function StandupMode({ parts }: { parts: Part[] }) {
  const { update } = useHub();
  const [open, setOpen] = useState(false);
  const [ids, setIds] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(STANDUP_SECONDS);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [owner, setOwner] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const part = parts.find((p) => p.id === ids[index]);
  const move = (next: number) => { setIndex(next); setSeconds(STANDUP_SECONDS); setNote(""); setOwner(""); };
  useEffect(() => {
    if (!open || !running) return;
    const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [open, running]);
  useEffect(() => {
    if (seconds !== 0 || !running) return;
    // Never discard an unsaved action when automatic sequencing fires.
    if (note.trim() || owner.trim()) { setRunning(false); return; }
    if (index + 1 < ids.length) move(index + 1); else setRunning(false);
  }, [seconds, running, index, ids.length, note, owner]);
  const dirty = !!note.trim() || !!owner.trim();
  return <><Button variant="outline" onClick={() => { setIds(standupParts(parts).map((p) => p.id)); move(0); setRunning(false); setOpen(true); }}><Presentation aria-hidden className="size-4" />Standup mode</Button>
    <Dialog open={open} onOpenChange={(v) => { if (!v && dirty && !window.confirm("Discard this unsaved standup action?")) return; setOpen(v); if (!v) setRunning(false); }}>
      <DialogContent ref={panel} className="standup-panel gap-5 border-sidebar-border bg-sidebar text-sidebar-foreground">
        <DialogHeader><DialogTitle className="text-sidebar-foreground">Morning standup</DialogTitle><DialogDescription className="text-sidebar-foreground/80">Top {ids.length} open risks · current line selection · advisory projections</DialogDescription></DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span aria-live="off" className="mr-2 font-mono text-2xl">{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
          <Button variant="secondary" size="icon" title={running ? "Pause timer" : "Start timer and auto-sequence"} aria-label={running ? "Pause timer" : "Start timer and auto-sequence"} onClick={() => { if (!seconds) setSeconds(STANDUP_SECONDS); setRunning(!running); }}>{running ? <Pause /> : <Play />}</Button>
          <Button variant="secondary" size="icon" title="Reset three-minute timer" aria-label="Reset three-minute timer" onClick={() => setSeconds(STANDUP_SECONDS)}><RotateCcw /></Button>
          <Button variant="secondary" size="icon" title="Full screen" aria-label="Full screen" onClick={async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await panel.current?.requestFullscreen(); } catch { toast.error("Full screen is unavailable in this browser."); } }}><Maximize /></Button>
          <span className="text-xs">{index + 1} / {ids.length || 0}</span>
        </div>
        {part ? <><div className="grid min-w-0 gap-5 md:grid-cols-2"><section className="min-w-0"><div className="text-sm text-sidebar-foreground/80">{part.line}</div><h2 className="mt-2 break-words font-mono text-3xl font-semibold">{part.partNumber}</h2><p className="mt-2 text-lg">{part.description}</p><div className="mt-5 grid grid-cols-2 gap-4"><div><div className="text-xs">Risk score</div><div className="font-mono text-4xl">{part.riskScore}</div></div><div><div className="text-xs">Hours to line stop</div><div className="font-mono text-4xl">{part.hoursToLineStop}</div></div></div><p className="mt-4 text-lg">{eur(part.valueAtRisk)} at risk</p><p className="mt-2 break-words">{part.supplier} · {part.planner}</p></section><section className="min-w-0 rounded-md bg-card p-4 text-card-foreground"><StockProjection part={part} compact /><form className="mt-4 space-y-2" onSubmit={(e) => { e.preventDefault(); if (!note.trim() || !owner.trim()) return; update(part.id, {}, { kind: "note", text: `Standup action | Owner: ${owner.trim()} | ${note.trim()}` }); setNote(""); setOwner(""); toast.success("Standup action saved to the part timeline."); }}><label className="block text-xs font-semibold" htmlFor="standup-owner">Action owner</label><Input id="standup-owner" maxLength={80} required value={owner} onChange={(e) => setOwner(e.target.value)} /><label className="block text-xs font-semibold" htmlFor="standup-action">Agreed next action</label><Textarea id="standup-action" maxLength={2000} required value={note} onChange={(e) => setNote(e.target.value)} /><Button disabled={!note.trim() || !owner.trim()} type="submit">Save action note</Button></form></section></div><div className="flex justify-between"><Button variant="secondary" disabled={index === 0 || dirty} onClick={() => move(index - 1)}><ChevronLeft />Previous</Button><Button variant="secondary" disabled={index + 1 >= ids.length || dirty} onClick={() => move(index + 1)}>Next<ChevronRight /></Button></div></> : <p>No open parts in this selection.</p>}
      </DialogContent>
    </Dialog>
  </>;
}