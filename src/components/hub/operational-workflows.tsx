import { Radar, GitCompareArrows, Truck, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { operationalSignals } from "@/lib/shortages";
import { useHub } from "./store";

export const WORKFLOWS = [
  { id: "early", label: "Early warning", icon: Radar, target: "board" },
  { id: "execution", label: "Execution & scenarios", icon: GitCompareArrows, target: "tools" },
  { id: "shipping", label: "Shipping readiness", icon: Truck, target: "shipping" },
] as const;
export type WorkflowId = (typeof WORKFLOWS)[number]["id"];

export function OperationalPulse({ onOpen }: { onOpen: (id: string) => void }) {
  const { parts, sync } = useHub();
  const { imminent, lines } = operationalSignals(parts);
  const pending = sync === "checking" || sync === "connecting";
  const unavailable = sync === "error";
  return (
    <section aria-labelledby="operations-pulse" className="border-y py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="operations-pulse" className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle className="size-4 text-elevated" /> Production continuity</h2>
          <p className="mt-1 text-xs text-muted-foreground">Recorded line-stop estimates · advisory, not live plant status</p>
        </div>
        <div role="status" className="text-xs font-medium">
          {pending ? "Loading team signals…" : unavailable ? "Team signals unavailable" : `${lines} lines with risk under 24h · ${imminent.length} component alerts`}
        </div>
      </div>
      {!pending && !unavailable && <>
        <div className="mt-3 flex flex-wrap gap-2">
          {imminent.map((p) => <Button key={p.id} variant="outline" onClick={() => onOpen(p.id)} className="h-auto min-h-11 max-w-full justify-start whitespace-normal text-left text-xs">
            <span><span className="font-mono font-semibold">{p.partNumber}</span> · {p.hoursToLineStop}h to line stop<br /><span className="font-normal text-muted-foreground">{p.line} · {p.planner}</span></span><ArrowUpRight className="size-4 shrink-0" />
          </Button>)}
          {imminent.length === 0 && <p className="text-xs text-muted-foreground">No open part has a recorded line-stop estimate below 24 hours.</p>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">A component may block assembly even when other parts are available. Confirm BOM dependency and recovery options before treating it as a single point of failure.</p>
      </>}
    </section>
  );
}