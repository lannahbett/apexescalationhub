import { useState } from "react";
import type React from "react";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { STAGES, eur, orderExposure, type Part, type Stage } from "@/lib/shortages";
import { ConfidencePill, DemandChip, LeadTimeChip, LineStop, PlannerBadge, RiskPill, StageBadge } from "./badges";
import { useHub } from "./store";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export type Density = "standard" | "compact";
const openKey = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
};

export function ShortageTable({ parts, onOpen, density = "standard" }: { parts: Part[]; onOpen: (id: string) => void; density?: Density }) {
  const [sort, setSort] = useState<"riskScore" | "valueAtRisk">("riskScore");
  const rows = [...parts].sort((a, b) => b[sort] - a[sort]);
  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  const SortBtn = ({ k, label }: { k: typeof sort; label: string }) => (
    <Button variant="ghost" type="button" onClick={() => setSort(k)} aria-label={`Sort by ${label}`} className={cn("inline-flex min-h-11 min-w-11 items-center gap-1 px-0 text-[11px] uppercase", sort === k && "text-foreground")}>
      {label} <ArrowUpDown aria-hidden className="size-3" />
    </Button>
  );
  return (
    <div role="region" aria-label="Scrollable shortage table" tabIndex={0} className="max-w-full overflow-x-auto rounded-md border bg-card">
      <table aria-label={`Shortages, ${rows.length} parts`} data-density={density} className="w-full min-w-[1150px] border-collapse">
        <thead className="border-b bg-muted">
          <tr>
            <th scope="col" aria-sort={sort === "riskScore" ? "descending" : "none"} className={th}><SortBtn k="riskScore" label="Risk" /></th>
            <th scope="col" className={th}>Part Details</th>
            <th scope="col" className={th}>Line Impact</th>
            <th scope="col" aria-sort={sort === "valueAtRisk" ? "descending" : "none"} className={cn(th, "text-right")}><SortBtn k="valueAtRisk" label="Financial Risk" /></th>
            <th scope="col" className={th}>Shortage</th>
            <th scope="col" className={th}>Planner</th>
            <th scope="col" className={th}>Fix Confidence</th>
            <th scope="col" className={th}>Stage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} tabIndex={0} aria-label={`${p.partNumber}, ${p.description}. Press Enter for details`} onClick={() => onOpen(p.id)} onKeyDown={openKey(() => onOpen(p.id))} className={cn("cursor-pointer border-b last:border-0 hover:bg-accent/50 focus-visible:bg-accent focus-visible:outline-offset-[-2px]", density === "compact" ? "[&>td]:py-1" : "[&>td]:py-2.5")}>
              <td className="px-3"><RiskPill score={p.riskScore} /></td>
              <td className="px-3">
                <div className="font-mono text-xs font-semibold">{p.partNumber}</div>
                <div className="text-xs">{p.description}</div>
                <div className="text-[11px] text-muted-foreground">{p.category}</div>
                <div className="mt-1"><DemandChip demand={p.demand} /></div>
              </td>
              <td className="px-3 text-xs">
                <div className="font-medium">{p.line}</div>
                <div className="text-muted-foreground">Build {fmtDate(p.targetBuild)}</div>
              </td>
              <td className="px-3 text-right font-mono text-xs">
                <div className="font-semibold">{eur(p.valueAtRisk)}</div>
                {(p.orders?.length ?? 0) > 0 && <div className="text-[11px] text-muted-foreground">{p.orders!.length} SO · {eur(orderExposure(p))}</div>}
              </td>
              <td className="px-3">
                <div className="font-mono text-xs">{p.qtyPending.toLocaleString()} {p.uom}</div>
                <LineStop hours={p.hoursToLineStop} daysLate={p.daysLate} />
                <LeadTimeChip lt={p.leadTime} />
              </td>
              <td className="px-3"><PlannerBadge name={p.planner} /></td>
              <td className="px-3"><ConfidencePill value={p.confidence} /></td>
              <td className="px-3"><StageBadge stage={p.stage} /></td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={8} className="py-10 text-center text-sm text-muted-foreground">No parts match these filters.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StageSelect({ part, className }: { part: Part; className?: string }) {
  const { update } = useHub();
  return (
    <select
      aria-label={`Move ${part.partNumber} to stage`}
      className={cn("h-11 w-full rounded-md border border-input bg-card px-3 text-xs text-foreground", className)}
      value={part.stage}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onChange={(e) => {
        const v = e.target.value;
        const s = STAGES.find((x) => x.id === v);
        if (!s) return;
        update(part.id, { stage: s.id }, { kind: "stage", text: `Stage moved to ${s.n}. ${s.label}` });
      }}
    >
      {STAGES.map((s) => <option key={s.id} value={s.id}>{s.n}. {s.label}</option>)}
    </select>
  );
}

export function KanbanBoard({ parts, onOpen }: { parts: Part[]; onOpen: (id: string) => void }) {
  const { update } = useHub();
  const [over, setOver] = useState<Stage | null>(null);
  return (
    <div className="grid grid-flow-col auto-cols-[260px] gap-3 overflow-x-auto pb-2 xl:grid-flow-row xl:grid-cols-5 xl:auto-cols-auto">
      {STAGES.map((s) => {
        const col = parts.filter((p) => p.stage === s.id).sort((a, b) => b.riskScore - a.riskScore);
        const total = col.reduce((t, p) => t + p.valueAtRisk, 0);
        return (
          <div
            key={s.id}
            onDragOver={(e) => { e.preventDefault(); setOver(s.id); }}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              e.preventDefault(); setOver(null);
              const id = e.dataTransfer.getData("text/plain");
              const p = parts.find((x) => x.id === id);
              if (p && p.stage !== s.id) update(id, { stage: s.id }, { kind: "stage", text: `Stage moved to ${s.n}. ${s.label}` });
            }}
            role="region"
            aria-label={`${s.label}: ${col.length} parts`}
            className={cn("flex min-h-[300px] flex-col rounded-md border bg-muted/60 transition-colors", over === s.id && "border-ring bg-accent")}
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <div className="text-xs font-semibold"><span className="mr-1 font-mono text-muted-foreground">{s.n}</span>{s.label}</div>
              <span className="rounded bg-card px-1.5 font-mono text-[11px]">{col.length}</span>
            </div>
            <div className="px-3 pt-1.5 font-mono text-[11px] text-muted-foreground">{eur(total)}</div>
            <div className="flex flex-col gap-2 p-2">
              {col.map((p) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                  className="group rounded border bg-card p-2.5 shadow-sm hover:border-ring"
                >
                  <Button variant="ghost" aria-label={`Open ${p.partNumber}, ${p.description}, ${eur(p.valueAtRisk)} at risk`} onClick={() => onOpen(p.id)} className="block h-auto min-h-11 w-full whitespace-normal p-0 text-left font-normal">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <GripVertical aria-hidden className="size-3.5 text-muted-foreground" />
                      <span className="font-mono text-xs font-semibold">{p.partNumber}</span>
                    </div>
                    <RiskPill score={p.riskScore} showLabel={false} />
                  </div>
                  <div className="mt-1 truncate text-xs text-muted-foreground">{p.description}</div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold">{eur(p.valueAtRisk)}</span>
                    <span className={p.daysLate > 0 ? "font-medium text-critical" : "text-success"}>{p.daysLate > 0 ? `${p.daysLate}d late` : "On time"}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <ConfidencePill value={p.confidence} />
                    <DemandChip demand={p.demand} />
                  </div>
                  </Button>
                  <StageSelect part={p} className="mt-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
