import { stockProjection, type Part } from "@/lib/shortages";

export function StockProjection({ part, compact = false }: { part: Part; compact?: boolean }) {
  const projection = stockProjection(part.stock);
  if (!projection || !part.stock) return <p className="text-xs text-muted-foreground">Stock projection unavailable</p>;
  const max = Math.max(1, ...projection.points.map((p) => p.qty));
  const horizon = projection.points.at(-1)?.hour ?? 48;
  const x = (h: number) => 10 + h / horizon * 280;
  const y = (q: number) => 70 - q / max * 58;
  return (
    <figure aria-label={`Stock projection for ${part.partNumber}`} className="min-w-0">
      <figcaption className="flex flex-wrap justify-between gap-1 text-xs"><span className="font-semibold">Stock burn-down</span><span className="text-muted-foreground">Projected · {part.stock.dailyUsage}/{part.uom}/day</span></figcaption>
      <svg viewBox="0 0 300 106" role="img" aria-label={`Stock runs out after ${projection.stockoutHours.toFixed(1)} hours; PO ETA after ${projection.etaHours.toFixed(1)} hours`} className="w-full text-info">
        <path d="M10 70H290" fill="none" className="stroke-border" />
        <polyline points={projection.points.map((p) => `${x(p.hour)},${y(p.qty)}`).join(" ")} fill="none" stroke="currentColor" strokeWidth="2.5" />
        {projection.etaHours <= horizon && <><path d={`M${x(projection.etaHours)} 8V70`} className="stroke-elevated" strokeDasharray="4 3" /><text x={Math.min(255, x(projection.etaHours))} y="100" className="fill-foreground text-[10px]">PO ETA</text></>}
        <text x="10" y="84" className="fill-muted-foreground text-[10px]">0h</text><text x="265" y="84" className="fill-muted-foreground text-[10px]">{Math.round(horizon)}h</text>
      </svg>
      <p className="text-xs text-critical">{projection.gapHours === null ? "No inbound quantity recorded" : projection.gapHours > 0 ? `${projection.gapHours.toFixed(1)}h stockout gap before receipt` : "ETA precedes projected stockout"}</p>
      {!compact && <><p className="mt-1 text-xs text-muted-foreground">Snapshot {new Date(part.stock.asOf).toLocaleString("en-GB")}. Constant usage assumption; receipt is projected, not confirmed.</p><details className="mt-2 text-xs"><summary className="min-h-11 cursor-pointer py-3">Projection data</summary><table className="w-full"><thead><tr><th className="text-left">Hours from snapshot</th><th className="text-right">{part.uom} remaining</th></tr></thead><tbody>{projection.points.map((p, i) => <tr key={i}><td>{p.hour.toFixed(1)}</td><td className="text-right">{p.qty.toFixed(1)}</td></tr>)}</tbody></table></details></>}
    </figure>
  );
}