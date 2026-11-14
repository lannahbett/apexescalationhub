import { useState } from "react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { buildSeed, improvementAnalysis, ROOT_CAUSES, eur, validRecovery, type RecoveryRecord } from "@/lib/shortages";
import { RecoveryDialog } from "./recovery-dialog";
import { useHub } from "./store";

export function Improvement({ onFocus }: { onFocus: (ids: string[], label: string) => void }) {
  const { parts, update } = useHub();
  const [examples, setExamples] = useState(false);
  const [exampleParts] = useState(() => buildSeed());
  const data = improvementAnalysis(examples ? exampleParts : parts);
  const fictional = examples || data.records.some((r) => r.id.startsWith("demo-recovery-"));
  const [edit, setEdit] = useState<{ partId: string; recordId: string } | null>(null);
  const part = parts.find((p) => p.id === edit?.partId);
  const record = part?.recoveries?.find((r) => r.id === edit?.recordId);
  const focus = (ids: string[], label: string) => { if (!examples) onFocus(ids, label); };
  const save = (draft: RecoveryRecord) => {
    if (!part || !record || !validRecovery(draft)) return;
    update(part.id, { recoveries: (part.recoveries ?? []).map((r) => r.id === record.id ? { ...r, why: draft.why, owner: draft.owner, reference: draft.reference, action: draft.action, status: draft.status, cost: draft.cost, cause: draft.cause } : r) },
      { kind: "note", text: `Preventive action updated: ${draft.status}; owner ${draft.owner || "unassigned"}; reference ${draft.reference || "none"}.` });
    setEdit(null);
  };
  return <section id="improvement" tabIndex={-1} aria-label="Continuous improvement" className="space-y-4 border-t pt-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-xl font-semibold">Continuous improvement</h2><Button variant="outline" aria-pressed={examples} onClick={() => { setEdit(null); setExamples((value) => !value); }}>{examples ? "Return to board history" : "View fictional examples"}</Button></div>
    <p className="text-xs text-muted-foreground">{fictional ? "Fictional demo examples included. Costs, causes, people and dates are illustrative, not company results." : "Recorded history · all board parts"}{examples ? " Preview only; your board is unchanged." : ""}</p>
    <dl className="flex flex-wrap gap-6 border-y py-3 text-xs">
      <div><dt className="text-muted-foreground">Recorded recoveries</dt><dd className="mt-1 font-mono text-xl font-semibold">{data.records.length}</dd></div>
      <div><dt className="text-muted-foreground">Open follow-ups</dt><dd className="mt-1 font-mono text-xl font-semibold text-elevated">{data.openActions}</dd></div>
      <div><dt className="text-muted-foreground">Recorded actual recovery cost</dt><dd className="mt-1 font-mono text-xl font-semibold">{eur(data.totalCost)}</dd><dd className="text-muted-foreground">{data.knownCosts} of {data.records.length} costs supplied</dd></div>
    </dl>
    <div className="grid min-w-0 gap-6 lg:grid-cols-2">
      <div className="min-w-0"><h3 className="mb-3 text-sm font-semibold">Root-cause Pareto</h3>
        {!data.pareto.length ? <p className="py-8 text-sm text-muted-foreground">No recovery causes recorded yet. Previously delivered parts have no inferred root cause.</p> : <>
          <div className="h-64 w-full" role="img" aria-label="Root-cause counts and cumulative percentage; exact values in the table below"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.pareto} margin={{ left: 0, right: 0, bottom: 10 }}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="cause" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis allowDecimals={false} width={30} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis yAxisId="pct" orientation="right" domain={[0, 100]} width={40} unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} /><Bar dataKey="count" name="Recoveries" fill="var(--chart-1)" /><Line yAxisId="pct" dataKey="cumulativePct" name="Cumulative %" stroke="var(--chart-2)" strokeWidth={2} /></ComposedChart></ResponsiveContainer></div>
          <table className="w-full text-left text-xs"><caption className="sr-only">Root-cause Pareto values</caption><thead><tr className="border-b"><th className="py-2">Cause</th><th>Count</th><th>Cumulative</th></tr></thead><tbody>{data.pareto.map((r) => <tr key={r.cause} className="border-b"><td>{examples ? <span className="inline-block py-3">{r.label}</span> : <Button variant="link" className="h-auto min-h-11 whitespace-normal px-0 text-left text-xs" onClick={() => focus(r.ids, r.label)}>{r.label}</Button>}</td><td className="font-mono">{r.count}</td><td className="font-mono">{r.cumulativePct}%</td></tr>)}</tbody></table>
        </>}
      </div>
      <div><h3 className="mb-3 text-sm font-semibold">Repeat escalations · past 30 days</h3><p className="mb-3 text-xs text-muted-foreground">More than two recorded escalation starts per supplier or part. Counts include initial detection and reopening, not stage changes.</p>
        {([['Suppliers', data.suppliers], ['Parts', data.parts]] as const).map(([label, rows]) => <div key={label} className="mb-4"><h4 className="text-xs font-semibold">{label}</h4>{rows.length ? <ul className="divide-y">{rows.map((r) => <li key={r.name}>{examples ? <div className="flex justify-between gap-3 py-3 text-xs"><span>{r.name}</span><span className="shrink-0 font-mono text-elevated">{r.count} starts</span></div> : <Button variant="ghost" className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-0 text-left text-xs" onClick={() => focus(r.ids, `${r.name}: repeat escalations`)}><span>{r.name}</span><span className="shrink-0 font-mono text-elevated">{r.count} starts</span></Button>}</li>)}</ul> : <p className="py-2 text-xs text-muted-foreground">No repeat escalations recorded.</p>}</div>)}
      </div>
    </div>
    <h3 className="text-sm font-semibold">Recovery & preventive-action register</h3>
    {!data.records.length ? <p className="text-sm text-muted-foreground">No recovery records yet.</p> : <div role="region" aria-label="Scrollable recovery register" tabIndex={0} className="max-w-full overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b"><th className="py-3">Recovered / part</th><th>Cause</th><th>Actual cost</th><th>Owner / reference</th><th>Follow-up</th></tr></thead><tbody>{[...data.records].sort((a, b) => b.recoveredAt.localeCompare(a.recoveredAt)).map((r) => <tr key={r.id} className="border-b"><td className="py-3"><div>{new Date(r.recoveredAt).toLocaleDateString("en-GB")}</div><div className="font-mono">{r.partNumber}</div></td><td>{ROOT_CAUSES[r.cause]}</td><td>{r.cost === null ? "Not recorded" : eur(r.cost)}</td><td><div>{r.owner || "Unassigned"}</div><div className="text-muted-foreground">{r.reference || "No reference"}</div></td><td>{examples ? <span>{r.status === "in_progress" ? "In progress" : r.status === "closed" ? "Closed" : "Open"}</span> : <Button variant="outline" onClick={() => setEdit({ partId: r.partId, recordId: r.id })}> {r.status === "in_progress" ? "In progress" : r.status === "closed" ? "Closed" : "Open"}</Button>}</td></tr>)}</tbody></table></div>}
    {part && record && <RecoveryDialog key={record.id} part={part} record={record} onSave={save} onCancel={() => setEdit(null)} />}
  </section>;
}