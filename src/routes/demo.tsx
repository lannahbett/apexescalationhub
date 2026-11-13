import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Kanban, Rows3, Rows4, RotateCcw, Search, Table2, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_VIEWS, COMMERCIAL_MODES, FILTERS, filterParts, type FilterId } from "@/lib/shortages";
import { HubProvider, useHub } from "@/components/hub/store";
import { KanbanBoard, ShortageTable, type Density } from "@/components/hub/board";
import { RoleBoard } from "@/components/hub/role-board";
import { PartSheet } from "@/components/hub/part-sheet";
import { ImportDialog } from "@/components/hub/import-dialog";
import { ExportDialog } from "@/components/hub/export-dialog";
import { BriefingDialog, InboundParserDialog } from "@/components/hub/ai-tools";
import { AppSidebar, MobileNav } from "@/components/hub/app-sidebar";
import { ApexLogo } from "@/components/brand/apex-logo";
import { ShippingGate } from "@/components/hub/shipping-gate";
import { ConnectorsHub } from "@/components/hub/connectors-hub";
import { ModularDashboard } from "@/components/hub/modular-dashboard";
import { ActivityFeed, SharedBoardEmpty, SharedBoardStatus } from "@/components/hub/shared-board";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Apex Escalation Hub — Daily Operations Dashboard" },
      { name: "description", content: "Personalize your manufacturing dashboard, act on critical shortages and explore guided practice scenarios." },
      { property: "og:title", content: "Apex Escalation Hub — Daily Operations Dashboard" },
      { property: "og:description", content: "Critical parts, supplier delivery drift and customer commitments in a customizable action dashboard." },
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
  const { parts, reset, commercialMode, setCommercialMode, roleView, setRoleView } = useHub();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>("standard");
  const [dashboardFocus, setDashboardFocus] = useState<{ ids: string[]; label: string } | null>(null);
  useEffect(() => { const d = localStorage.getItem("apex-density"); if (d === "compact") setDensity("compact"); }, []);
  const changeDensity = (d: Density) => { setDensity(d); localStorage.setItem("apex-density", d); };
  const shown = useMemo(() => filterParts(parts, filter, q).filter((p) => !dashboardFocus || dashboardFocus.ids.includes(p.id)), [parts, filter, q, dashboardFocus]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, filterParts(parts, f.id, "").length])), [parts]);

  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar />
      <div className="min-w-0 flex-1">
      <a href="#board" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:text-xs">Skip to shortage board</a>
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)_auto] sm:flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <MobileNav />
            <div className="md:hidden"><ApexLogo compact /></div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold leading-tight">Apex Escalation Hub</h1>
              <div className="text-[11px] text-sidebar-foreground/80">Morning standup · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ImportDialog />
                      </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-4">
        <section id="perspective" tabIndex={-1} aria-label="Role perspective" className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <label className="flex max-w-full flex-wrap items-center gap-2 text-xs font-semibold">Perspective
            <select aria-label="Role perspective" value={roleView} onChange={(e) => { const role = ROLE_VIEWS.find((r) => r.id === e.target.value); if (role) setRoleView(role.id); }} className="h-11 min-w-11 max-w-full rounded-md border border-input bg-card px-3">
              {ROLE_VIEWS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          <SharedBoardStatus />
        </section>
        <SharedBoardEmpty />
        <ActivityFeed />
         <div id="dashboard" tabIndex={-1}><ModularDashboard onOpen={setOpen} onFocus={(ids, label) => {
           setQ(""); setFilter("all"); setDashboardFocus({ ids, label });
           requestAnimationFrame(() => { document.getElementById("board")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); document.getElementById("board")?.focus({ preventScroll: true }); });
         }} /></div>

         <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5"><h2 className="text-lg font-semibold">Shortage board <span className="font-mono text-xs font-normal text-muted-foreground">{shown.length} parts</span></h2>{dashboardFocus && <div role="status" className="flex min-w-0 items-center gap-2 text-xs text-info"><span className="min-w-0 break-words">{dashboardFocus.label}</span><Button variant="ghost" size="icon" title="Clear dashboard focus" aria-label="Clear dashboard focus" onClick={() => setDashboardFocus(null)}><X /></Button></div>}</div>

        <section aria-label="Board filters and view" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search aria-hidden className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Search part, customer, supplier or order" placeholder="Search part, customer, supplier, order…" className="h-11 bg-card pl-8 text-xs" />
            </div>
            <div role="group" aria-label="Filters" className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                 <Button variant="ghost" type="button" key={f.id} aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setDashboardFocus(null); }}
                  className={cn("inline-flex items-center gap-1.5 min-h-11 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent")}>
                  {f.label}
                  <span className="sr-only">, </span>
                  <span className={cn("rounded-full px-1.5 font-mono text-[10px]", filter === f.id ? "bg-primary-foreground/20" : "bg-muted")}>{counts[f.id]}</span>
                </Button>
              ))}
            </div>
          </div>
          <div id="tools" tabIndex={-1} className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Commercial mode
              <select aria-label="Commercial mode" value={commercialMode} onChange={(e) => {
                const mode = COMMERCIAL_MODES.find((m) => m.id === e.target.value);
                if (mode) setCommercialMode(mode.id);
              }} className="h-11 min-w-11 max-w-full rounded-md border border-input bg-card px-2 text-foreground">
                {COMMERCIAL_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <BriefingDialog />
            <ExportDialog shown={shown} />
            <InboundParserDialog />
            <Button size="icon" variant="ghost" onClick={reset} title="Reset sample data" aria-label="Reset sample data"><RotateCcw aria-hidden className="size-3.5" /></Button>
            <div role="group" aria-label="Row density" className="inline-flex rounded-md border bg-card p-0.5">
              {([["standard", Rows3, "Standard"], ["compact", Rows4, "Compact"]] as const).map(([id, Icon, label]) => (
                <Button variant="ghost" type="button" key={id} aria-pressed={density === id} onClick={() => changeDensity(id)} title={`${label} rows`}
                  className={cn("inline-flex min-h-11 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium", density === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon aria-hidden className="size-3.5" /> {label}
                </Button>
              ))}
            </div>
            <div role="group" aria-label="View" className="inline-flex rounded-md border bg-card p-0.5">
              {([["table", Table2, "Table"], ["kanban", Kanban, "Kanban"]] as const).map(([id, Icon, label]) => (
                <Button variant="ghost" type="button" key={id} aria-pressed={view === id} onClick={() => setView(id)}
                  className={cn("inline-flex min-h-11 items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium", view === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon aria-hidden className="size-3.5" /> {label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <section id="board" tabIndex={-1} aria-label="Shortage board">
          <h2 className="sr-only">Shortages ({shown.length})</h2>
          {view === "table" ? roleView === "planner" ? <ShortageTable parts={shown} onOpen={setOpen} density={density} /> : <RoleBoard parts={shown} onOpen={setOpen} density={density} /> : <KanbanBoard parts={shown} onOpen={setOpen} />}
        </section>
        <ShippingGate />
        <ConnectorsHub />
      </main>
      <PartSheet partId={open} onClose={() => setOpen(null)} />
      </div>
    </div>
  );
}
