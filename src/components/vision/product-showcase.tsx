import { useEffect, useState } from "react";
import { AlarmClock, LayoutDashboard, Euro, Ship, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chapters = [
  { id: "crisis", icon: AlarmClock, label: "The 08:30 standup", title: "Everyone arrives with a different answer",
    text: "A supplier slips. Production asks when the part arrives, the buyer chases an email, and Order Management cannot tell the customer whether the date still holds.",
    points: ["Shortages tracked in separate spreadsheets", "Customer impact discovered late", "Expedite decisions made without the full picture"],
    where: "Starting point: the business problem" },
  { id: "command", icon: LayoutDashboard, label: "One shared board", title: "Each team sees its own priorities on the same data",
    text: "The left menu jumps between today's priorities, the shortage board, analytics and tools. Switch perspective, planner, Order Management, buyer or plant manager, without changing the shared board.",
    points: ["Risk score and hours to line stop per part", "Table or drag-and-drop workflow stages", "Dashboard widgets you can reorder and hide"],
    where: "In the demo: left menu → Shortage board / Role perspective" },
  { id: "money", icon: Euro, label: "Customer impact & AI", title: "See which customer promise each missing part puts at risk",
    text: "Every part is linked to the customer orders it blocks. Track priority tiers, contractual late fees, or both. Compare an air-freight cost against the fees it could avoid, and let AI draft the supplier escalation.",
    points: ["Tiers, penalties or both, your choice", "Expedite comparisons are estimates, never bookings", "AI suggestions apply only after you confirm them"],
    where: "In the demo: Customer orders · Visual analytics · AI tools" },
  { id: "ship", icon: Ship, label: "Shipping & data", title: "From a recovered part to a shipped order",
    text: "The shipping section lists only the documents each order needs for its transport and destination, explained in plain language. Import SAP ECC or Excel exports, every row is checked before anything changes.",
    points: ["Air waybill, road and sea documents per order", "SAP column names and date formats recognised", "Exports for the standup and for Power BI"],
    where: "In the demo: Shipping & customs · Import / export" },
] as const;

function Mock({ id }: { id: string }) {
  const bar = (w: string, c: string) => <div className={cn("h-2 rounded-full", c)} style={{ width: w }} />;
  if (id === "crisis") return <div className="grid gap-2">{["Spreadsheet v7, final(2).xlsx", "RE: RE: RE: motor delay?", "Customer asking for date", "Line 3 stops in 6h"].map((t, i) => <div key={t} className={cn("rounded-md border bg-card p-3 text-xs font-mono", i === 3 && "border-critical text-critical")}>{t}</div>)}</div>;
  if (id === "command") return <div className="flex gap-2"><div className="w-1/4 space-y-2 rounded-md bg-sidebar p-2">{[1,2,3,4,5].map((i) => <div key={i} className={cn("h-3 rounded", i === 2 ? "bg-sidebar-primary" : "bg-sidebar-accent")} />)}</div><div className="flex-1 space-y-2">{[["90%","bg-critical"],["70%","bg-elevated"],["55%","bg-elevated"],["30%","bg-success"]].map(([w,c]) => <div key={w} className="rounded-md border bg-card p-2">{bar(w!, c!)}</div>)}</div></div>;
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
  const c = chapters[i]!;
  return (
    <section aria-labelledby="product-tour" className="border-b bg-secondary">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <p className="text-xs font-semibold uppercase text-info">Product tour · 4 chapters</p>
        <h2 id="product-tour" className="mt-3 text-3xl font-semibold leading-tight">How Apex works, in two minutes</h2>
        <div role="tablist" aria-label="Tour chapters" className="mt-6 grid grid-cols-2 gap-2 md:grid-cols-4">
          {chapters.map((ch, n) => (
            <button key={ch.id} role="tab" aria-selected={n === i} aria-controls="tour-panel" onClick={() => { setI(n); setPlaying(false); }}
              className={cn("flex min-h-11 items-center gap-2 rounded-md border px-3 py-2 text-left text-sm", n === i ? "border-primary bg-card font-semibold" : "bg-transparent text-muted-foreground")}>
              <ch.icon className="size-4 shrink-0" aria-hidden /><span><span className="font-mono text-xs">{n + 1}.</span> {ch.label}</span>
            </button>
          ))}
        </div>
        <div id="tour-panel" role="tabpanel" aria-live="polite" className="mt-4 grid gap-6 rounded-lg border bg-card p-5 md:grid-cols-[1.2fr_1fr] md:p-8">
          <div>
            <h3 className="text-xl font-semibold">{c.title}</h3>
            <p className="mt-3 leading-relaxed text-muted-foreground">{c.text}</p>
            <ul className="mt-4 space-y-2 text-sm">{c.points.map((p) => <li key={p} className="flex gap-2"><span aria-hidden className="text-info">▸</span>{p}</li>)}</ul>
            <p className="mt-4 text-xs font-medium text-info">{c.where}</p>
          </div>
          <div className="rounded-md bg-muted p-4" aria-hidden><Mock id={c.id} /></div>
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
