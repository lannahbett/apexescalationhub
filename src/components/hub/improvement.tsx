import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Maximize2, Minimize2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { CI_SECTIONS, defaultCiLayout, moveCiSection, readCiLayout, toggleIn, type CiLayout, type CiSectionId } from "@/lib/improvement-layout";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Button } from "@/components/ui/button";
import { buildSeed, improvementAnalysis, ROOT_CAUSES, eur, validRecovery, type RecoveryRecord } from "@/lib/shortages";
import { RecoveryDialog } from "./recovery-dialog";
import { useHub } from "./store";

const LAYOUT_KEY = "apex-improvement-layout-v1";

export function Improvement({ onFocus }: { onFocus: (ids: string[], label: string) => void }) {
  const { parts, update } = useHub();
  const [examples, setExamples] = useState(false);
  const [exampleParts] = useState(() => buildSeed());
  const [layout, setLayout] = useState<CiLayout>(defaultCiLayout);
  const [layoutLoaded, setLayoutLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => { try { setLayout(readCiLayout(JSON.parse(localStorage.getItem(LAYOUT_KEY) ?? "null"))); } catch { /* defaults */ } setLayoutLoaded(true); }, []);
  useEffect(() => { if (layoutLoaded) { try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout)); } catch { /* layout stays for this visit */ } } }, [layout, layoutLoaded]);
  // Never show an empty dashboard: with no recorded recoveries, fall back to the read-only fictional preview.
  const noHistory = improvementAnalysis(parts).records.length === 0;
  const showExamples = examples || noHistory;
  const data = improvementAnalysis(showExamples ? exampleParts : parts);
  const fictional = showExamples || data.records.some((r) => r.id.startsWith("demo-recovery-"));
  const [edit, setEdit] = useState<{ partId: string; recordId: string } | null>(null);
  const part = parts.find((p) => p.id === edit?.partId);
  const record = part?.recoveries?.find((r) => r.id === edit?.recordId);
  const focus = (ids: string[], text: string) => { if (!showExamples) onFocus(ids, text); };
  const label = (id: CiSectionId) => CI_SECTIONS.find((x) => x.id === id)?.label ?? id;
  const save = (draft: RecoveryRecord) => {
    if (!part || !record || !validRecovery(draft)) return;
    update(part.id, { recoveries: (part.recoveries ?? []).map((r) => r.id === record.id ? { ...r, why: draft.why, owner: draft.owner, reference: draft.reference, action: draft.action, status: draft.status, cost: draft.cost, cause: draft.cause } : r) },
      { kind: "note", text: `Preventive action updated: ${draft.status}; owner ${draft.owner || "unassigned"}; reference ${draft.reference || "none"}.` });
    setEdit(null);
  };
  const sections: Record<CiSectionId, React.ReactNode> = {
    kpis: <>
    <dl className="flex flex-wrap gap-6 border-y py-3 text-xs">
      <div><dt className="text-muted-foreground">Recorded recoveries</dt><dd className="mt-1 font-mono text-xl font-semibold">{data.records.length}</dd></div>
      <div><dt className="text-muted-foreground">Open follow-ups</dt><dd className="mt-1 font-mono text-xl font-semibold text-elevated">{data.openActions}</dd></div>
      <div><dt className="text-muted-foreground">Recorded actual recovery cost</dt><dd className="mt-1 font-mono text-xl font-semibold">{eur(data.totalCost)}</dd><dd className="text-muted-foreground">{data.knownCosts} of {data.records.length} costs supplied</dd></div>
    </dl>
    </>,
    pareto: <>
      <div className="min-w-0">
        {!data.pareto.length ? <p className="py-8 text-sm text-muted-foreground">No recovery causes recorded yet. Previously delivered parts have no inferred root cause.</p> : <>
          <div className={layout.compact ? "h-44 w-full" : "h-64 w-full"} role="img" aria-label="Root-cause counts and cumulative percentage; exact values in the table below"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={data.pareto} margin={{ left: 0, right: 0, bottom: 10 }}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="cause" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis allowDecimals={false} width={30} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><YAxis yAxisId="pct" orientation="right" domain={[0, 100]} width={40} unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--card)", color: "var(--foreground)", borderColor: "var(--border)" }} /><Bar dataKey="count" name="Recoveries" fill="var(--chart-1)" /><Line yAxisId="pct" dataKey="cumulativePct" name="Cumulative %" stroke="var(--chart-2)" strokeWidth={2} /></ComposedChart></ResponsiveContainer></div>
          <table className="w-full text-left text-xs"><caption className="sr-only">Root-cause Pareto values</caption><thead><tr className="border-b"><th className="py-2">Cause</th><th>Count</th><th>Cumulative</th></tr></thead><tbody>{data.pareto.map((r) => <tr key={r.cause} className="border-b"><td>{showExamples ? <span className="inline-block py-3">{r.label}</span> : <Button variant="link" className="h-auto min-h-11 whitespace-normal px-0 text-left text-xs" onClick={() => focus(r.ids, r.label)}>{r.label}</Button>}</td><td className="font-mono">{r.count}</td><td className="font-mono">{r.cumulativePct}%</td></tr>)}</tbody></table>
        </>}
      </div>
    </>,
    repeats: <>
      <div>{!layout.compact && <p className="mb-3 text-xs text-muted-foreground">More than two recorded escalation starts per supplier or part. Counts include initial detection and reopening, not stage changes.</p>}
        {([['Suppliers', data.suppliers], ['Parts', data.parts]] as const).map(([label, rows]) => <div key={label} className="mb-4"><h4 className="text-xs font-semibold">{label}</h4>{rows.length ? <ul className="divide-y">{rows.map((r) => <li key={r.name}>{showExamples ? <div className="flex justify-between gap-3 py-3 text-xs"><span>{r.name}</span><span className="shrink-0 font-mono text-elevated">{r.count} starts</span></div> : <Button variant="ghost" className="h-auto min-h-11 w-full justify-between gap-3 whitespace-normal px-0 text-left text-xs" onClick={() => focus(r.ids, `${r.name}: repeat escalations`)}><span>{r.name}</span><span className="shrink-0 font-mono text-elevated">{r.count} starts</span></Button>}</li>)}</ul> : <p className="py-2 text-xs text-muted-foreground">No repeat escalations recorded.</p>}</div>)}
      </div>
    </>,
    register: <>
    {!data.records.length ? <p className="text-sm text-muted-foreground">No recovery records yet.</p> : <div role="region" aria-label="Scrollable recovery register" tabIndex={0} className="max-w-full overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b"><th className="py-3">Recovered / part</th><th>Cause</th><th>Actual cost</th><th>Owner / reference</th><th>Follow-up</th></tr></thead><tbody>{(layout.compact ? [...data.records].sort((a, b) => b.recoveredAt.localeCompare(a.recoveredAt)).slice(0, 3) : [...data.records]).sort((a, b) => b.recoveredAt.localeCompare(a.recoveredAt)).map((r) => <tr key={r.id} className="border-b"><td className="py-3"><div>{new Date(r.recoveredAt).toLocaleDateString("en-GB")}</div><div className="font-mono">{r.partNumber}</div></td><td>{ROOT_CAUSES[r.cause]}</td><td>{r.cost === null ? "Not recorded" : eur(r.cost)}</td><td><div>{r.owner || "Unassigned"}</div><div className="text-muted-foreground">{r.reference || "No reference"}</div></td><td>{showExamples ? <span>{r.status === "in_progress" ? "In progress" : r.status === "closed" ? "Closed" : "Open"}</span> : <Button variant="outline" onClick={() => setEdit({ partId: r.partId, recordId: r.id })}> {r.status === "in_progress" ? "In progress" : r.status === "closed" ? "Closed" : "Open"}</Button>}</td></tr>)}</tbody></table></div>}
      {layout.compact && data.records.length > 3 && <Button variant="link" className="px-0 text-xs" onClick={() => setLayout((l) => ({ ...l, compact: false }))}>Show all {data.records.length} records</Button>}
    </>,
  };
  const visible = layout.order.filter((id) => !layout.hidden.includes(id));
  return <section id="improvement" tabIndex={-1} aria-label="Continuous improvement" className="space-y-3 border-t pt-5">
    <div className="flex flex-wrap items-end justify-between gap-2"><h2 className="text-xl font-semibold">Continuous improvement</h2><div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" aria-pressed={layout.compact} onClick={() => setLayout((l) => ({ ...l, compact: !l.compact }))}>{layout.compact ? <><Maximize2 /> Detailed view</> : <><Minimize2 /> Simple view</>}</Button>
      <Button variant="outline" size="sm" aria-expanded={editing} onClick={() => setEditing((v) => !v)}><SlidersHorizontal /> Arrange sections</Button>
      {!noHistory && <Button variant="outline" size="sm" aria-pressed={examples} onClick={() => { setEdit(null); setExamples((value) => !value); }}>{examples ? "Return to board history" : "View fictional examples"}</Button>}
    </div></div>
    <p className="text-xs text-muted-foreground">{fictional ? "Fictional demo examples. Costs, causes, people and dates are illustrative, not company results." : "Recorded history · all board parts"}{showExamples ? (noHistory ? " Your board has no recorded recoveries yet, so examples are shown. Record one by moving a part to Cleared & Delivered." : " Preview only; your board is unchanged.") : ""}</p>
    {editing && <ol aria-label="Arrange continuous improvement sections" className="divide-y rounded-md border bg-card px-3 text-xs">{layout.order.map((id, index) => <li key={id} className="flex items-center justify-between gap-2 py-1"><label className="flex min-h-11 items-center gap-2"><input type="checkbox" className="size-5 accent-primary" checked={!layout.hidden.includes(id)} onChange={() => setLayout((l) => ({ ...l, hidden: toggleIn(l.hidden, id) }))} />{label(id)}</label><div className="flex"><Button variant="ghost" size="icon" disabled={index === 0} aria-label={`Move ${label(id)} up`} onClick={() => setLayout((l) => moveCiSection(l, id, -1))}><ArrowUp /></Button><Button variant="ghost" size="icon" disabled={index === layout.order.length - 1} aria-label={`Move ${label(id)} down`} onClick={() => setLayout((l) => moveCiSection(l, id, 1))}><ArrowDown /></Button></div></li>)}<li className="py-2"><Button variant="link" size="sm" className="px-0" onClick={() => setLayout(defaultCiLayout())}><RotateCcw /> Reset layout</Button></li></ol>}
    {!visible.length && <p className="py-4 text-sm text-muted-foreground">All sections are hidden. Use Arrange sections to show them again.</p>}
    <div className={layout.compact ? "grid min-w-0 gap-3 lg:grid-cols-2" : "grid min-w-0 gap-3"}>{visible.map((id) => { const closed = layout.collapsed.includes(id); return <article key={id} className={"min-w-0 rounded-md border bg-card " + (id === "kpis" || id === "register" ? "lg:col-span-2" : "")}>
      <h3><button type="button" aria-expanded={!closed} onClick={() => setLayout((l) => ({ ...l, collapsed: toggleIn(l.collapsed, id) }))} className="flex min-h-11 w-full items-center justify-between gap-2 px-3 text-left text-sm font-semibold">{label(id)}<ChevronDown aria-hidden className={"size-4 transition-transform " + (closed ? "-rotate-90" : "")} /></button></h3>
      {!closed && <div className="min-w-0 px-3 pb-3">{sections[id]}</div>}
    </article>; })}</div>
    {part && record && <RecoveryDialog key={record.id} part={part} record={record} onSave={save} onCancel={() => setEdit(null)} />}
  </section>;
}