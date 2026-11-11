import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Boxes, Euro, Factory, Kanban, Rows3, Rows4, RotateCcw, Search, Table2, Zap } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CURRENT_USER, FILTERS, computeKpis, eur, filterParts, initials, type FilterId } from "@/lib/shortages";
import { HubProvider, useHub } from "@/components/hub/store";
import { KanbanBoard, ShortageTable, type Density } from "@/components/hub/board";
import { PartSheet } from "@/components/hub/part-sheet";
import { ImportDialog } from "@/components/hub/import-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Apex Escalation Hub — Parts Shortage Board" },
      { name: "description", content: "Daily parts shortage and escalation board for material planners and production leads." },
      { property: "og:title", content: "Apex Escalation Hub — Parts Shortage Board" },
      { property: "og:description", content: "Track shortages, line impact, fix confidence and supplier escalations in one board." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <HubProvider>
      <Hub />
      <Toaster />
    </HubProvider>
  ),
});

function Hub() {
  const { parts, reset } = useHub();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>("standard");
  useEffect(() => { const d = localStorage.getItem("apex-density"); if (d === "compact") setDensity("compact"); }, []);
  const changeDensity = (d: Density) => { setDensity(d); localStorage.setItem("apex-density", d); };
  const k = computeKpis(parts);
  const shown = useMemo(() => filterParts(parts, filter, q), [parts, filter, q]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, filterParts(parts, f.id, "").length])), [parts]);

  const kpis = [
    { label: "Blocked Value at Risk", value: eur(k.valueAtRisk), sub: "open production runs", icon: Euro, tone: "text-critical" },
    { label: "Active Shortages", value: `${k.activeCount} parts`, sub: "not yet delivered", icon: Boxes, tone: "text-info" },
    { label: "Assembly Lines at Risk", value: `${k.linesAtRisk} lines`, sub: "impacted inside 48h", icon: Factory, tone: "text-elevated" },
    { label: "Stalled / Low-Confidence", value: `${k.stalledCount} parts`, sub: "no ETA / engineering hold", icon: AlertTriangle, tone: "text-critical" },
  ];

  return (
    <div className="min-h-dvh">
      <a href="#board" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:text-xs">Skip to shortage board</a>
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded bg-sidebar-primary text-sidebar-primary-foreground"><Zap aria-hidden className="size-4" /></div>
            <div>
              <h1 className="text-sm font-semibold leading-tight">Apex Escalation Hub</h1>
              <div className="text-[11px] text-sidebar-foreground/80">Morning standup · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ImportDialog />
            <div className="hidden items-center gap-2 sm:flex">
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-sidebar-accent text-[11px] font-semibold">{initials(CURRENT_USER)}</span>
              <span className="text-xs">{CURRENT_USER}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4">
        <h2 className="sr-only">Key figures</h2>
        <section aria-label="Key figures" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((x) => (
            <div key={x.label} className="rounded-md border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{x.label}</span>
                <x.icon aria-hidden className={cn("size-4", x.tone)} />
              </div>
              <div className="mt-1 font-mono text-xl font-semibold">{x.value}</div>
              <div className="text-[11px] text-muted-foreground">{x.sub}</div>
            </div>
          ))}
        </section>

        <section aria-label="Board filters and view" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search aria-hidden className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Search part, planner or component" placeholder="Search part, planner, component…" className="h-9 bg-card pl-8 text-xs" />
            </div>
            <div role="group" aria-label="Filters" className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button type="button" key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
                  className={cn("inline-flex items-center gap-1.5 min-h-8 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                  {f.label}
                  <span className="sr-only">, </span>
                  <span className={cn("rounded-full px-1.5 font-mono text-[10px]", filter === f.id ? "bg-primary-foreground/20" : "bg-muted")}>{counts[f.id]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={reset} title="Reset sample data" aria-label="Reset sample data"><RotateCcw aria-hidden className="size-3.5" /></Button>
            <div role="group" aria-label="Row density" className="inline-flex rounded-md border bg-card p-0.5">
              {([["standard", Rows3, "Standard"], ["compact", Rows4, "Compact"]] as const).map(([id, Icon, label]) => (
                <button type="button" key={id} aria-pressed={density === id} onClick={() => changeDensity(id)} title={`${label} rows`}
                  className={cn("inline-flex min-h-8 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium", density === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon aria-hidden className="size-3.5" /> {label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="View" className="inline-flex rounded-md border bg-card p-0.5">
              {([["table", Table2, "Table"], ["kanban", Kanban, "Kanban"]] as const).map(([id, Icon, label]) => (
                <button type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}
                  className={cn("inline-flex min-h-8 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium", view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon aria-hidden className="size-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="board" tabIndex={-1} aria-label="Shortage board">
          <h2 className="sr-only">Shortages ({shown.length})</h2>
          {view === "table" ? <ShortageTable parts={shown} onOpen={setOpen} density={density} /> : <KanbanBoard parts={shown} onOpen={setOpen} />}
        </section>
      </main>
      <PartSheet partId={open} onClose={() => setOpen(null)} />
    </div>
  );
}
