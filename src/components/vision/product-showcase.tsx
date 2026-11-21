import { useEffect, useState } from "react";
import { AlarmClock, LayoutDashboard, Euro, Ship, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chapters = [
  { id: "crisis", icon: AlarmClock, label: "07:30 · Early warning", title: "Catch the shortage before it becomes a customer delay",
    text: "Start with parts approaching a line stop, recorded stock buffers, abnormal demand and supplier lead-time drift. See the customer orders behind each risk before choosing what to chase.",
    points: ["Review recorded stock snapshots, not assumed live inventory", "Identify the planner and supplier behind each blocker", "Check production risk alongside customer commitments"],
    where: "Daily focus: early warning and material triage" },
  { id: "command", icon: LayoutDashboard, label: "09:00 · Alignment", title: "Agree priorities on the same data, then keep acting",
    text: "Planners, buyers, Order Management and plant leaders bring different responsibilities to one shortage board. Agree recovery ownership at the standup and keep actions visible as circumstances change.",
    points: ["Role perspectives without separate copies of the board", "Shared part status and recorded recovery actions", "Dashboards focused on each team’s decisions"],
    where: "Daily focus: shared priorities and accountable follow-up" },
  { id: "money", icon: Euro, label: "13:00 · Trade-offs", title: "Compare recovery options against customer exposure",
    text: "A supplier update or customer call can change the plan mid-shift. Review qualified alternatives, compare freight scenarios and prepare a customer date-change request with the proposed dates clearly stated.",
    points: ["Customer tiers, contractual penalties or both", "Other material blockers remain in expedite estimates", "Review drafts and track approvals before manual SAP updates"],
    where: "Daily focus: execution, customer decisions and scenarios" },
  { id: "ship", icon: Ship, label: "16:30 · Shipping", title: "Check the outbound paperwork before the handover",
    text: "Review delivery notes and transport or customs documents for the recorded freight mode and destination. A complete document checklist is one gate, not proof that every material or dispatch requirement is met.",
    points: ["Track document gaps by customer order", "Review pending manual SAP date follow-ups", "Leave pinned notes and a clear handover for the next shift"],
    where: "Daily focus: shipping readiness and shift handover" },
] as const;

function Mock({ id }: { id: string }) {
  const bar = (w: string, c: string) => <div className={cn("h-2 rounded-full", c)} style={{ width: w }} />;
  if (id === "crisis") return <div className="grid gap-2">{["PN-8402-HX · 18h to line stop", "Weekly demand · +85%", "Supplier lead time · 10d → 22d", "Review customer delivery exposure"].map((t, i) => <div key={t} className={cn("rounded-md border bg-card p-3 text-xs font-mono", i === 0 && "border-critical text-critical")}>{t}</div>)}</div>;
  if (id === "command") return <div className="flex gap-2"><div className="w-1/4 space-y-2 rounded-md bg-sidebar p-2">{[1,2,3,4,5].map((i) => <div key={i} className={cn("h-3 rounded", i === 2 ? "bg-sidebar-primary" : "bg-sidebar-accent")} />)}</div><div className="flex-1 space-y-2">{([["90%","bg-critical"],["70%","bg-elevated"],["55%","bg-elevated"],["30%","bg-success"]] as const).map(([w,c]) => <div key={w} className="rounded-md border bg-card p-2">{bar(w, c)}</div>)}</div></div>;
  if (id === "money") return <div className="space-y-3 rounded-md border bg-card p-3 text-xs"><div className="flex justify-between"><span>Projected late fees</span><span className="font-mono text-critical">€10,000</span></div><div className="flex justify-between"><span>Air freight cost</span><span className="font-mono">€1,800</span></div><div className="flex justify-between border-t pt-2 font-semibold"><span>Estimated benefit</span><span className="font-mono text-success">€3,200</span></div><p className="text-muted-foreground">Sample figures</p></div>;
  return <div className="space-y-2 text-xs">{[["Delivery note", true],["Commercial invoice", true],["Air waybill", false]].map(([t, ok]) => <div key={String(t)} className="flex items-center justify-between rounded-md border bg-card p-2"><span>{t}</span><span className={ok ? "text-success" : "text-critical"}>{ok ? "✓ Ready" : "○ Missing"}</span></div>)}</div>;
}

export function ProductShowcase() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setI((n) => (n + 1) % chapters.length), 7000);
    return () => clearTimeout(t);
  }, [playing, i]);
  const c = chapters[i] ?? chapters[0];
  return (
    <section aria-labelledby="product-tour" className="border-b bg-secondary">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <p className="text-xs font-semibold uppercase text-info">A working day with Apex</p>
        <h2 id="product-tour" className="mt-3 text-3xl font-semibold leading-tight">The standup starts alignment. The work continues all shift.</h2>
        <div role="tablist" aria-label="Tour chapters" className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {chapters.map((ch, n) => (
            <Button variant="ghost" key={ch.id} id={`tour-tab-${ch.id}`} role="tab" aria-selected={n === i} aria-controls="tour-panel" onClick={() => { setI(n); setPlaying(false); }}
              className={cn("flex h-auto min-h-11 justify-start whitespace-normal items-center gap-2 rounded-md border px-3 py-2 text-left text-sm", n === i ? "border-primary bg-card font-semibold" : "bg-transparent text-muted-foreground")}>
              <ch.icon className="size-4 shrink-0" aria-hidden /><span><span className="font-mono text-xs">{n + 1}.</span> {ch.label}</span>
            </Button>
          ))}
        </div>
        <div id="tour-panel" role="tabpanel" aria-labelledby={`tour-tab-${c.id}`} aria-live="polite" className="mt-4 grid gap-6 border-y py-5 md:grid-cols-[1.2fr_1fr] md:py-8">
          <div>
            <h3 className="text-xl font-semibold">{c.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{c.text}</p>
            <ul className="mt-4 space-y-2 text-sm">{c.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="text-info">▸</span>{p}</li>)}</ul>
            <p className="mt-4 text-xs font-medium text-info">{c.where}</p>
          </div>
          <div><div className="rounded-md bg-muted p-4" aria-hidden><Mock id={c.id} /></div><p className="mt-2 text-xs text-muted-foreground">Illustrative workflow and sample figures, not live operating results.</p></div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => { setI((i + 3) % 4); setPlaying(false); }}><ArrowLeft /> Previous</Button>
          <Button variant="outline" onClick={() => setPlaying((p) => !p)}>{playing ? <><Pause /> Pause</> : <><Play /> Autoplay</>}</Button>
          <Button variant="outline" onClick={() => { setI((i + 1) % 4); setPlaying(false); }}>Next <ArrowRight /></Button>
          <Button asChild className="ml-auto"><Link to="/demo">Try it in the demo <ArrowRight /></Link></Button>
        </div>
      </div>
    </section>
  );
}
