import { cn } from "@/lib/utils";
import { CONFIDENCE, STAGES, initials, riskTier, type Confidence, type Stage } from "@/lib/shortages";

const tierCls = {
  critical: "bg-critical text-primary-foreground",
  elevated: "bg-elevated-soft text-elevated border border-elevated/40",
  monitored: "bg-monitored-soft text-monitored border border-border",
};
const tierLabel = { critical: "Critical", elevated: "Elevated", monitored: "Monitored" };

export function RiskPill({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const t = riskTier(score);
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[11px] font-semibold", tierCls[t])}>
      {score}
      {showLabel && <span className="font-sans font-medium uppercase tracking-wide text-[10px]">{tierLabel[t]}</span>}
    </span>
  );
}

const confCls: Record<Confidence, { wrap: string; dot: string }> = {
  high: { wrap: "bg-success-soft text-success", dot: "bg-success" },
  at_risk: { wrap: "bg-elevated-soft text-elevated", dot: "bg-elevated" },
  stalled: { wrap: "bg-critical-soft text-critical", dot: "bg-critical animate-pulse" },
};
export function ConfidencePill({ value }: { value: Confidence }) {
  return (
    <span title={CONFIDENCE[value].hint} className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", confCls[value].wrap)}>
      <span className={cn("size-1.5 rounded-full", confCls[value].dot)} />
      {CONFIDENCE[value].label}
    </span>
  );
}

const stageCls: Record<Stage, string> = {
  detected: "border-critical/30 text-critical",
  sourcing: "border-elevated/40 text-elevated",
  transit: "border-info/40 text-info",
  customs: "border-monitored/40 text-monitored",
  delivered: "border-success/40 text-success",
};
export function StageBadge({ stage }: { stage: Stage }) {
  const s = STAGES.find((x) => x.id === stage)!;
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded border bg-card px-1.5 py-0.5 text-[11px] font-medium", stageCls[stage])}>
      <span className="font-mono">{s.n}</span>
      {s.label}
    </span>
  );
}

export function PlannerBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className="grid size-6 place-items-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">{initials(name)}</span>
      <span className="text-xs">{name}</span>
    </span>
  );
}

export function LineStop({ hours, daysLate }: { hours: number; daysLate: number }) {
  return (
    <div className="text-xs leading-tight">
      {daysLate > 0 ? <div className="font-medium text-critical">{daysLate}d late</div> : <div className="text-success">On time</div>}
      <div className={cn("text-muted-foreground", hours <= 48 && "font-medium text-elevated")}>
        Line stop in {hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`}
      </div>
    </div>
  );
}
