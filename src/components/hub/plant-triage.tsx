import { toast } from "sonner";
import { ArrowRightLeft, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canRequestSource, requestSource, type Part } from "@/lib/shortages";
import { useHub } from "./store";
import { StockProjection } from "./stock-projection";

export function PlantTriage({ part }: { part: Part }) {
  const { update, actor } = useHub();
  return <section aria-label="Plant triage" className="space-y-3 border-t pt-4">
    <h3 className="text-sm font-semibold">Plant triage & substitution</h3>
    <StockProjection part={part} />
    <h4 className="text-xs font-semibold">Alternate sourcing</h4>
    <p className="text-xs text-muted-foreground">Sample availability and qualification references. Requests are recorded only; no stock is reserved, transferred or purchased.</p>
    {!part.sourcingOptions?.length && <p className="text-xs text-muted-foreground">No sourcing options recorded for this part.</p>}
    {part.sourcingOptions?.map((option) => {
      const requested = part.sourcingRequests?.some((r) => r.optionId === option.id);
      return <article key={option.id} className="rounded-md border p-3 text-xs">
        <div className="flex items-center gap-2 font-semibold"><Factory aria-hidden className="size-4" />{option.location}</div>
        <div className="mt-1 break-words font-mono">{option.partNumber}</div>
        <p className="mt-1">{option.available} {part.uom} available · {option.leadHours}h estimated lead time</p>
        <p className={option.qualified ? "mt-1 text-success" : "mt-1 text-critical"}>{option.qualified ? `Qualified · ${option.approvalRef}` : "Engineering qualification required"}</p>
        <Button className="mt-2 w-full whitespace-normal" variant="outline" disabled={!canRequestSource(part, option)} onClick={() => {
          const next = requestSource(part, option.id, new Date().toISOString(), actor);
          if (!next?.sourcingRequests) return;
          update(part.id, { sourcingRequests: next.sourcingRequests }, { kind: "note", text: `${option.kind === "transfer" ? "Stock transfer" : "Second-source"} request recorded: ${option.location}, ${option.partNumber}. Awaiting external approval; primary PO unchanged.` });
          toast.success("Sourcing request recorded. No external order was sent.");
        }}><ArrowRightLeft aria-hidden className="size-4" />{requested ? "Request recorded" : option.kind === "transfer" ? "Request stock transfer" : "Request second source"}</Button>
      </article>;
    })}
  </section>;
}