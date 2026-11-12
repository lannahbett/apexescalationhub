import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Factory, SlidersHorizontal, RotateCcw, Truck, Users, Euro, ListChecks, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { dashboardAnalysis, eur, FREIGHT_MODES, commercialVisibility } from "@/lib/shortages";
import { WIDGETS, defaultDashboard, readDashboard, type DashboardPreferences, type WidgetId } from "@/lib/dashboard";
import { useHub } from "./store";
import { GuidedPractice } from "./interactive-tour";
import { VisualAnalytics } from "./visual-analytics";

const icons = { critical: Factory, commercial: Euro, suppliers: TrendingUp, actions: ListChecks, freight: Truck, customers: Users };
export function ModularDashboard({ onFocus, onOpen }: { onFocus: (ids: string[], label: string) => void; onOpen: (id: string) => void }) {
  const { parts, roleView, commercialMode } = useHub();
  const [prefs, setPrefs] = useState<DashboardPreferences>(() => defaultDashboard(roleView));
  const [loadedRole, setLoadedRole] = useState<string | null>(null);
  const [customize, setCustomize] = useState(false);
  const [freightDirection, setFreightDirection] = useState<"inbound" | "outbound">("inbound");
  useEffect(() => {
    let next = defaultDashboard(roleView);
    try { next = readDashboard(JSON.parse(localStorage.getItem(`apex-dashboard-${roleView}`) ?? "null"), roleView); } catch { /* use defaults */ }
    setPrefs(next); setLoadedRole(roleView);
  }, [roleView]);
  useEffect(() => {
    if (loadedRole === roleView) { try { localStorage.setItem(`apex-dashboard-${roleView}`, JSON.stringify(prefs)); } catch { /* preferences remain usable for this visit */ } }
  }, [prefs, roleView, loadedRole]);
  const data = useMemo(() => dashboardAnalysis(parts, prefs.scope), [parts, prefs.scope]);
  const visibility = commercialVisibility(commercialMode);
  const limit = prefs.density === "compact" ? 2 : 4;
  const focus = (rows: typeof parts, label: string) => onFocus(rows.map((p) => p.id), label);
  const move = (id: WidgetId, delta: number) => setPrefs((p) => {
    const order = [...p.order]; const index = order.indexOf(id); const other = order[index + delta];
    if (!other) return p;
    order[index] = other; order[index + delta] = id; return { ...p, order };
  });
  const empty = <p className="py-5 text-sm text-muted-foreground">No matching open items.</p>;
  const content = (id: WidgetId) => {
    if (id === "critical") return <>
      <div className="flex items-baseline gap-2"><strong className="font-mono text-3xl text-critical">{data.critical.length}</strong><span className="text-xs text-muted-foreground">critical parts · {data.kpis.linesAtRisk} lines within 48h</span></div>
      <ul className="mt-3 divide-y">{data.critical.slice(0, limit).map((p) => <li key={p.id}><Button variant="ghost" onClick={() => onOpen(p.id)} className="h-auto min-h-11 w-full justify-between whitespace-normal px-0 py-2 text-left"><span className="min-w-0"><span className="block font-mono text-xs">{p.partNumber}</span><span className="block text-[11px] font-normal text-muted-foreground">{p.line}</span></span><span className="ml-2 shrink-0 font-mono text-xs text-critical">{p.hoursToLineStop}h <ArrowUpRight className="inline size-3" /></span></Button></li>)}</ul>
      {!data.critical.length && empty}
      <Button variant="link" className="px-0 text-xs" onClick={() => focus(data.critical, "Critical production bottlenecks")}>Review critical parts <ArrowUpRight /></Button>
    </>;
    if (id === "commercial") return <>
      <div className="font-mono text-3xl font-semibold">{eur(data.kpis.valueAtRisk)}</div><div className="text-xs text-muted-foreground">blocked production value</div>
      <dl className="mt-4 space-y-3 text-xs">{visibility.tiers && <div className="flex justify-between gap-2"><dt>Tier 1 orders exposed</dt><dd className="font-mono font-semibold text-info">{data.commercial.tier1Orders}</dd></div>}{visibility.penalties && <><div className="flex justify-between gap-2"><dt>Projected penalties</dt><dd className="font-mono font-semibold text-critical">{eur(data.commercial.projectedPenalties)}</dd></div><div className="flex justify-between gap-2"><dt>At projected delay / day</dt><dd className="font-mono">{eur(data.commercial.dailyPenalties)}</dd></div></>}<div className="flex justify-between gap-2"><dt>Orders with date risk</dt><dd className="font-mono">{data.commercial.otifOrders}</dd></div></dl>
      <Button variant="link" className="mt-2 px-0 text-xs" onClick={() => focus(data.scoped.filter((p) => p.stage !== "delivered"), "Commercial exposure")}>Review exposed orders <ArrowUpRight /></Button>
    </>;
    if (id === "suppliers") return <>
      <div className="flex items-baseline gap-2"><strong className="font-mono text-3xl">{data.suppliers.length}</strong><span className="text-xs text-muted-foreground">suppliers with open shortages</span></div>
      <ul className="mt-3 divide-y">{data.suppliers.slice(0, limit).map((s) => <li key={s.name}><Button variant="ghost" className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-0 py-2 text-left text-xs" onClick={() => focus(data.scoped.filter((p) => p.supplier === s.name && p.stage !== "delivered"), s.name)}><span className="min-w-0">{s.name}<span className="block text-[11px] font-normal text-muted-foreground">{s.count} open parts</span></span><span className={cn("shrink-0 font-mono", s.drift !== null && s.drift > 0 ? "text-elevated" : "text-muted-foreground")}>{s.drift === null ? "No signal" : `${s.drift > 0 ? "+" : ""}${s.drift.toFixed(1)}d`}</span></Button></li>)}</ul>{!data.suppliers.length && empty}
      <p className="mt-2 text-[11px] text-muted-foreground">Mean actual minus planned lead time · open parts only</p>
    </>;
    if (id === "actions") return <>
      <div className="flex items-baseline gap-2"><strong className="font-mono text-3xl text-elevated">{data.actions.length}</strong><span className="text-xs text-muted-foreground">parts needing follow-up</span></div>
      <ul className="mt-3 divide-y">{data.actions.slice(0, limit).map((p) => <li key={p.id}><Button variant="ghost" className="h-auto min-h-11 w-full justify-between whitespace-normal px-0 py-2 text-left" onClick={() => onOpen(p.id)}><span><span className="block font-mono text-xs">{p.partNumber}</span><span className="block text-[11px] font-normal text-muted-foreground">{p.stage === "customs" ? "Resolve customs hold" : "Get a confirmed supplier recovery date"} · {p.planner}</span></span><ArrowUpRight className="shrink-0" /></Button></li>)}</ul>{!data.actions.length && empty}
      <Button variant="link" className="px-0 text-xs" onClick={() => focus(data.actions, "Follow-up queue")}>Review follow-ups <ArrowUpRight /></Button>
    </>;
    if (id === "customers") return <>
      <div className="flex items-baseline gap-2"><strong className="font-mono text-3xl">{data.customers.length}</strong><span className="text-xs text-muted-foreground">customers linked to open shortages</span></div>
      <ul className="mt-3 divide-y">{data.customers.slice(0, limit).map((c) => <li key={c.name}><Button variant="ghost" className="h-auto min-h-11 w-full justify-between gap-2 whitespace-normal px-0 py-2 text-left text-xs" onClick={() => focus(data.scoped.filter((p) => p.stage !== "delivered" && p.orders?.some((o) => o.customer === c.name && o.status !== "cancelled")), c.name)}><span className="min-w-0">{c.name}<span className="block text-[11px] font-normal text-muted-foreground">Next commitment {c.committed.slice(0, 10)}{visibility.tiers ? ` · ${c.tier1} Tier 1` : ""}</span></span><span className={cn("shrink-0 font-mono", c.atRisk > 0 ? "text-critical" : "text-success")}>{c.atRisk}/{c.count} at risk</span></Button></li>)}</ul>{!data.customers.length && empty}
      <p className="mt-2 text-[11px] text-muted-foreground">Unique active orders · projected delivery-date risk</p>
    </>;
    return <>
      <div role="group" aria-label="Freight direction" className="flex gap-1 border-b pb-2">{(["inbound", "outbound"] as const).map((direction) => <Button key={direction} variant={freightDirection === direction ? "secondary" : "ghost"} size="sm" aria-pressed={freightDirection === direction} onClick={() => setFreightDirection(direction)}>{direction === "inbound" ? "Inbound parts" : "Outbound orders"}</Button>)}</div>
      <ul className="mt-2 space-y-1">{data[freightDirection].map((r) => <li key={r.mode}><Button variant="ghost" className="h-auto min-h-11 w-full justify-between whitespace-normal px-0 text-xs" onClick={() => focus(data.scoped.filter((p) => p.stage !== "delivered" && (freightDirection === "inbound" ? (p.inboundFreight ?? "unspecified") === r.mode : p.orders?.some((o) => o.status !== "cancelled" && (o.freightMode ?? "unspecified") === r.mode))), `${freightDirection === "inbound" ? "Inbound" : "Outbound"} · ${FREIGHT_MODES[r.mode]}`)}><span>{FREIGHT_MODES[r.mode]}</span><span className="font-mono font-semibold">{r.count}</span></Button></li>)}</ul>
      <p className="text-[11px] text-muted-foreground">Recorded modes · not shipment tracking</p>
    </>;
  };
  return <section aria-label="Action dashboard" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-[11px] font-semibold uppercase text-info">Daily command center</div><h2 className="mt-1 text-2xl font-semibold">Today’s priorities</h2></div><div className="flex flex-wrap gap-2"><GuidedPractice /><Button variant="outline" size="sm" onClick={() => setCustomize(true)}><SlidersHorizontal /> Customize dashboard</Button></div></div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-y py-2"><div className="flex flex-wrap gap-x-5 gap-y-1 text-xs"><span><strong className="font-mono">{data.kpis.activeCount}</strong> open shortages</span><span><strong className="font-mono text-critical">{data.kpis.stalledCount}</strong> stalled</span><span><strong className="font-mono text-elevated">{data.kpis.abnormalDemandCount}</strong> demand spikes</span></div><label className="flex items-center gap-2 text-xs text-muted-foreground">Analysis scope<select aria-label="Dashboard analysis scope" className="h-11 max-w-full rounded-md border border-input bg-card px-2 text-foreground" value={prefs.scope} onChange={(e) => { const scope = e.target.value; if (scope === "all" || scope === "open" || scope === "mine") setPrefs((p) => ({ ...p, scope })); }}><option value="open">Open shortages</option><option value="all">All board data</option><option value="mine">My open parts</option></select></label></div>
    <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">{prefs.order.filter((id) => !prefs.hidden.includes(id)).map((id) => { const Icon = icons[id]; return <article key={id} className="min-w-0 rounded-md border bg-card p-4"><h3 className="mb-3 flex items-center gap-2 text-xs font-semibold"><Icon aria-hidden className={cn("size-4", id === "critical" ? "text-critical" : id === "actions" ? "text-elevated" : "text-info")} />{WIDGETS.find((w) => w.id === id)?.label}</h3>{content(id)}</article>; })}</div>
    {prefs.hidden.length === WIDGETS.length && <div className="border-y py-6 text-center"><p className="text-muted-foreground">No widgets selected.</p><Button variant="link" onClick={() => setCustomize(true)}>Choose widgets</Button></div>}
    <VisualAnalytics data={data} mode={commercialMode} parts={parts} onFocus={onFocus} />
    <Sheet open={customize} onOpenChange={setCustomize}><SheetContent className="w-full overflow-y-auto sm:max-w-md"><SheetHeader className="pr-10"><SheetTitle>Customize dashboard</SheetTitle><SheetDescription>Personal layout · saved for this perspective in this browser</SheetDescription></SheetHeader>
      <fieldset className="mt-5"><legend className="mb-2 text-xs font-semibold">Card detail</legend><div className="flex gap-2">{(["compact", "expanded"] as const).map((d) => <Button key={d} variant={prefs.density === d ? "secondary" : "outline"} aria-pressed={prefs.density === d} size="sm" onClick={() => setPrefs((p) => ({ ...p, density: d }))}>{d === "compact" ? "Compact" : "Expanded"}</Button>)}</div></fieldset>
      <ol className="mt-5 divide-y">{prefs.order.map((id, index) => <li key={id} className="flex items-center justify-between gap-2 py-2"><label className="flex min-h-11 min-w-0 items-center gap-2 text-xs"><input type="checkbox" className="size-11 shrink-0 accent-primary" checked={!prefs.hidden.includes(id)} onChange={(e) => setPrefs((p) => ({ ...p, hidden: e.target.checked ? p.hidden.filter((x) => x !== id) : [...p.hidden, id] }))} />{WIDGETS.find((w) => w.id === id)?.label}</label><div className="flex shrink-0"><Button variant="ghost" size="icon" disabled={index === 0} aria-label={`Move ${id} up`} title="Move up" onClick={() => move(id, -1)}><ArrowUp /></Button><Button variant="ghost" size="icon" disabled={index === prefs.order.length - 1} aria-label={`Move ${id} down`} title="Move down" onClick={() => move(id, 1)}><ArrowDown /></Button></div></li>)}</ol>
      <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => setPrefs(defaultDashboard(roleView))}><RotateCcw /> Reset layout</Button><Button size="sm" onClick={() => setCustomize(false)}>Done</Button></div>
    </SheetContent></Sheet>
  </section>;
}