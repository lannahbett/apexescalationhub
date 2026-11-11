import { useState } from "react";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES, eur, type Part, type Stage } from "@/lib/shortages";
import { ConfidencePill, LineStop, PlannerBadge, RiskPill, StageBadge } from "./badges";
import { useHub } from "./store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

export function ShortageTable({ parts, onOpen }: { parts: Part[]; onOpen: (id: string) => void }) {
  const [sort, setSort] = useState<"riskScore" | "valueAtRisk">("riskScore");
  const rows = [...parts].sort((a, b) => b[sort] - a[sort]);
  const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
  const SortBtn = ({ k, label }: { k: typeof sort; label: string }) => (
    <button onClick={() => setSort(k)} className={cn("inline-flex items-center gap-1 uppercase", sort === k && "text-foreground")}>
      {label} <ArrowUpDown className="size-3" />
    </button>
  );
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full min-w-[1150px] border-collapse">
        <thead className="border-b bg-muted">
          <tr>
            <th className={th}><SortBtn k="riskScore" label="Risk" /></th>
            <th className={th}>Part Details</th>
            <th className={th}>Line Impact</th>
            <th className={cn(th, "text-right")}><SortBtn k="valueAtRisk" label="Financial Risk" /></th>
            <th className={th}>Shortage</th>
            <th className={th}>Planner</th>
            <th className={th}>Fix Confidence</th>
            <th className={th}>Stage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} onClick={() => onOpen(p.id)} className="cursor-pointer border-b last:border-0 hover:bg-accent/50">
              <td className="px-3 py-2"><RiskPill score={p.riskScore} /></td>
              <td className="px-3 py-2">
                <div className="font-mono text-xs font-semibold">{p.partNumber}</div>
                <div className="text-xs">{p.description}</div>
                <div className="text-[11px] text-muted-foreground">{p.category}</div>
              </td>
              <td className="px-3 py-2 text-xs">
                <div className="font-medium">{p.line}</div>
                <div className="text-muted-foreground">Build {fmtDate(p.targetBuild)}</div>
              </td>
              <td className="px-3 py-2 text-right font-mono text-xs font-semibold">{eur(p.valueAtRisk)}</td>
              <td className="px-3 py-2">
                <div className="font-mono text-xs">{p.qtyPending.toLocaleString()} {p.uom}</div>
                <LineStop hours={p.hoursToLineStop} daysLate={p.daysLate} />
              </td>
              <td className="px-3 py-2"><PlannerBadge name={p.planner} /></td>
              <td className="px-3 py-2"><ConfidencePill value={p.confidence} /></td>
              <td className="px-3 py-2"><StageBadge stage={p.stage} /></td>
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
    <Select
      value={part.stage}
      onValueChange={(v) => {
        const s = STAGES.find((x) => x.id === v)!;
        update(part.id, { stage: v as Stage }, { kind: "stage", text: `Stage moved to ${s.n}. ${s.label}` });
      }}
    >
      <SelectTrigger className={cn("h-7 text-xs", className)} onClick={(e) => e.stopPropagation()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STAGES.map((s) => <SelectItem key={s.id} value={s.id} className="text-xs">{s.n}. {s.label}</SelectItem>)}
      </SelectContent>
    </Select>
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
                  onClick={() => onOpen(p.id)}
                  className="group cursor-pointer rounded border bg-card p-2.5 shadow-sm hover:border-ring"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <GripVertical className="size-3.5 text-muted-foreground" />
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
                  </div>
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
