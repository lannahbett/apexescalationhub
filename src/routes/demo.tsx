import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Kanban, Rows3, Rows4, Search, Table2, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROLE_VIEWS, COMMERCIAL_MODES, FILTERS, filterParts, sliceLines, earlyWarningParts, type FilterId } from "@/lib/shortages";
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
import { Improvement } from "@/components/hub/improvement";
import { StandupMode } from "@/components/hub/standup-mode";
import { BaselineReset } from "@/components/hub/baseline-reset";
import { ArchitectureDrawer } from "@/components/hub/architecture-drawer";
import { WorkspaceNotes } from "@/components/hub/workspace-notes";
import { ApexCopilot } from "@/components/hub/apex-copilot";
import { Scratchpad } from "@/components/hub/scratchpad";
import { CustomerReschedule } from "@/components/hub/customer-reschedule";
import { RescheduleTracker } from "@/components/hub/reschedule-tracker";
import { OperationalPulse, type WorkflowId } from "@/components/hub/operational-workflows";
import { EnergyDemo } from "@/components/hub/energy-demo";
import { RequireSignIn } from "@/components/auth/require-sign-in";

export const Route = createFileRoute("/demo")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Apex Escalation Hub | Daily Operations Dashboard" },
      { name: "description", content: "Work through material risks, supplier recovery, customer commitments and shipping readiness in one daily manufacturing workspace." },
      { property: "og:title", content: "Apex Escalation Hub | Daily Operations Dashboard" },
      { property: "og:description", content: "Early warnings, recovery scenarios and shipping readiness on the same shortage board, with human-confirmed decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <RequireSignIn>
      <HubProvider>
        <WorkspaceNotes><Hub /></WorkspaceNotes>
        <Toaster />
      </HubProvider>
    </RequireSignIn>
  ),
});

function Hub() {
  const { parts, commercialMode, setCommercialMode, roleView, setRoleView } = useHub();
  const [q, setQ] = useState("");
  const [line, setLine] = useState("all");
  const [filter, setFilter] = useState<FilterId>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>("standard");
  const [dashboardFocus, setDashboardFocus] = useState<{ ids: string[]; label: string } | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowId | null>(null);
  const pickWorkflow = (id: WorkflowId) => {
    setWorkflow(id); setQ(""); setFilter("all"); setLine("all");
    setDashboardFocus(id === "early" ? { ids: earlyWarningParts(parts).map((p) => p.id), label: "Early warning: line-stop estimate or snapshot stock buffer <24h" } : id === "execution" ? { ids: parts.filter((p) => p.stage !== "delivered").map((p) => p.id), label: "Execution: open shortages" } : null);
  };
  useEffect(() => { const d = localStorage.getItem("apex-density"); if (d === "compact") setDensity("compact"); }, []);
  const changeDensity = (d: Density) => { setDensity(d); localStorage.setItem("apex-density", d); };
  const lineParts = useMemo(() => sliceLines(parts, line), [parts, line]);
  const shown = useMemo(() => {
    const earlyIds = new Set(earlyWarningParts(lineParts).map((p) => p.id));
    return filterParts(lineParts, filter, q).filter((p) => workflow === "early" ? earlyIds.has(p.id) : workflow === "execution" ? p.stage !== "delivered" : !dashboardFocus || dashboardFocus.ids.includes(p.id));
  }, [lineParts, filter, q, dashboardFocus, workflow]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, filterParts(lineParts, f.id, "").length])), [lineParts]);

  return (
    <div className="flex min-h-dvh w-full overflow-x-clip">
      <AppSidebar workflow={workflow} onWorkflow={pickWorkflow} />
      <div className="min-w-0 flex-1">
      <a href="#board" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-card focus:px-3 focus:py-2 focus:text-xs">Skip to shortage board</a>
      <header className="bg-sidebar text-sidebar-foreground">
        <div className="mx-auto grid grid-cols-[minmax(0,1fr)_auto] sm:flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <MobileNav workflow={workflow} onWorkflow={pickWorkflow} />
            <div className="md:hidden"><ApexLogo compact /></div>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold leading-tight">Apex · Daily operations & shortage resilience</h1>
              <div className="text-[11px] text-sidebar-foreground/80">Production continuity · Customer commitments · Human-confirmed decisions</div>
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
        <OperationalPulse onOpen={setOpen} />
         <div id="dashboard" tabIndex={-1}><ModularDashboard onOpen={setOpen} onFocus={(ids, label) => {
           setWorkflow(null); setQ(""); setFilter("all"); setDashboardFocus({ ids, label });
           setLine("all"); requestAnimationFrame(() => { document.getElementById("board")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); document.getElementById("board")?.focus({ preventScroll: true }); });
         }} /></div>

         <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-5"><h2 className="text-lg font-semibold">Shortage board <span className="font-mono text-xs font-normal text-muted-foreground">{shown.length} parts</span></h2>{dashboardFocus && <div role="status" className="flex min-w-0 items-center gap-2 text-xs text-info"><span className="min-w-0 break-words">{dashboardFocus.label}</span><Button variant="ghost" size="icon" title="Clear dashboard focus" aria-label="Clear dashboard focus" onClick={() => { setDashboardFocus(null); setWorkflow(null); }}><X /></Button></div>}</div>
         <div className="flex flex-wrap items-center gap-2">
           <label className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-semibold">Assembly line
             <select aria-label="Assembly line" value={line} onChange={(e) => { setLine(e.target.value); setDashboardFocus(null); setWorkflow(null); }} className="h-11 max-w-full rounded-md border border-input bg-card px-3"><option value="all">All assembly lines</option>{[...new Set(parts.map((p) => p.line))].sort().map((name) => <option key={name} value={name}>{name}</option>)}</select>
           </label>
           <StandupMode parts={lineParts} />
           <BaselineReset onReset={() => { setWorkflow(null); setQ(""); setFilter("all"); setLine("all"); setDashboardFocus(null); setOpen(null); }} />
           <ArchitectureDrawer />
           <EnergyDemo />
         </div>

        <section aria-label="Board filters and view" className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative md:w-72">
              <Search aria-hidden className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} type="search" aria-label="Search part, customer, supplier or order" placeholder="Search part, customer, supplier, order…" className="h-11 bg-card pl-8 text-xs" />
            </div>
            <div role="group" aria-label="Filters" className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                 <Button variant="ghost" type="button" key={f.id} aria-pressed={filter === f.id} onClick={() => { setFilter(f.id); setDashboardFocus(null); setWorkflow(null); }}
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
            <ApexCopilot onOpen={setOpen} />
            <Scratchpad />
            <CustomerReschedule />
            <RescheduleTracker />
            <ExportDialog shown={shown} />
            <InboundParserDialog />
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
         <Improvement onFocus={(ids, label) => { setWorkflow(null); setQ(""); setFilter("all"); setLine("all"); setDashboardFocus({ ids, label }); requestAnimationFrame(() => { document.getElementById("board")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); document.getElementById("board")?.focus({ preventScroll: true }); }); }} />
        <ConnectorsHub />
      </main>
      <PartSheet partId={open} onClose={() => setOpen(null)} />
      </div>
    </div>
  );
}
