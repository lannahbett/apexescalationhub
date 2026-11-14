import { useState } from "react";
import { ClipboardCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RESPONSES, SAP_FIELDS, agreedDate, pendingSapFields, requiredSapFields, type TrackedReschedule } from "@/lib/work-notes";
import { useWorkNotes } from "./workspace-notes";

function Row({ r }: { r: TrackedReschedule }) {
  const { track, untrack, ready } = useWorkNotes();
  const [alt, setAlt] = useState(r.alternativeDate);
  const [note, setNote] = useState(r.responseNote);
  const update = (patch: Partial<TrackedReschedule>) => track({ ...r, alternativeDate: alt, responseNote: note, ...patch });
  const required = requiredSapFields(r); const pending = pendingSapFields(r); const agreed = agreedDate(r);
  const dates: [string, string][] = [["Committed", r.committed], ["Proposed delivery", r.proposed], ...(r.firstDate ? [["Proposed First Date", r.firstDate] as [string, string]] : []), ...(r.plannedGi ? [["Proposed planned GI", r.plannedGi] as [string, string]] : [])];
  return <li className="space-y-3 rounded-md border border-border p-3">
    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{r.so} · {r.customer}</h3><p className="text-xs text-muted-foreground">{r.direction === "pull_in" ? "Pull-in" : "Push-out"} · added {r.createdAt.slice(0, 10)}</p></div>
      <span className={`rounded px-2 py-1 text-xs font-medium ${pending.length ? "bg-warning/15 text-foreground" : "bg-muted"}`}>{r.response === "awaiting" ? "Awaiting customer" : r.response === "declined" ? "Declined, no SAP change" : pending.length ? `${pending.length} manual SAP update${pending.length > 1 ? "s" : ""} pending` : "SAP updates recorded"}</span></div>
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">{dates.map(([k, v]) => <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-mono">{v}</dd></div>)}{agreed && <div><dt className="text-xs text-muted-foreground">Agreed delivery</dt><dd className="font-mono font-semibold">{agreed}</dd></div>}</dl>
    <label className="block text-xs">Customer response<select aria-label={`Customer response for ${r.so}`} disabled={!ready} className="h-11 w-full rounded border border-input bg-card px-2 text-sm" value={r.response} onChange={(e) => { const response = e.target.value as TrackedReschedule["response"]; if (response === "alternative" && !alt) { track({ ...r, response: "awaiting" }); return; } update({ response }); }}>{Object.entries(RESPONSES).map(([k, v]) => <option key={k} value={k} disabled={k === "alternative" && !alt}>{v}{k === "alternative" && !alt ? " (enter date first)" : ""}</option>)}</select></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="block text-xs">Customer's alternative date<Input type="date" aria-label={`Alternative date for ${r.so}`} value={alt} onChange={(e) => setAlt(e.target.value)} onBlur={() => { if (alt !== r.alternativeDate && (alt || r.response !== "alternative")) update({}); }} /></label>
      <label className="block text-xs">Response note<Textarea aria-label={`Response note for ${r.so}`} maxLength={1000} className="min-h-11" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => { if (note !== r.responseNote) update({}); }} /></label></div>
    {required.length > 0 && <fieldset className="space-y-1"><legend className="text-xs font-medium">Manual SAP updates (tick after a colleague updates SAP)</legend>{required.map((f) => <label key={f} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="size-5 accent-primary" checked={r.sapDone.includes(f)} onChange={(e) => update({ sapDone: e.target.checked ? [...r.sapDone, f] : r.sapDone.filter((x) => x !== f) })} />{SAP_FIELDS[f]}{f === "delivery" && agreed ? ` → ${agreed}` : ""}{r.response === "alternative" && f !== "delivery" ? " (recheck against the alternative date)" : ""}</label>)}</fieldset>}
    <Button variant="ghost" size="sm" onClick={() => { if (confirm(`Remove ${r.so} from the tracker?`)) untrack(r.id); }}><Trash2 aria-hidden className="size-4" />Remove</Button>
  </li>;
}

export function RescheduleTracker() {
  const { tracked } = useWorkNotes();
  const [filter, setFilter] = useState<"all" | "awaiting" | "sap">("all");
  const awaiting = tracked.filter((r) => r.response === "awaiting").length;
  const sap = tracked.filter((r) => pendingSapFields(r).length > 0).length;
  const shown = tracked.filter((r) => filter === "all" || (filter === "awaiting" ? r.response === "awaiting" : pendingSapFields(r).length > 0));
  return <Sheet><SheetTrigger asChild><Button variant="secondary" size="sm"><ClipboardCheck aria-hidden className="size-4" />Reschedule tracker{awaiting + sap > 0 && <span className="rounded bg-primary px-1.5 text-xs text-primary-foreground">{awaiting + sap}</span>}</Button></SheetTrigger>
    <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Customer reschedule approvals</SheetTitle><SheetDescription>You record customer replies here by hand. Apex sends no emails and does not change SAP or the board; ticks only record that a colleague updated SAP.</SheetDescription></SheetHeader>
      <div role="group" aria-label="Filter requests" className="mt-4 flex flex-wrap gap-2">{([["all", `All (${tracked.length})`], ["awaiting", `Awaiting customer (${awaiting})`], ["sap", `SAP updates pending (${sap})`]] as const).map(([k, l]) => <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</Button>)}</div>
      {shown.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{tracked.length ? "No requests match this filter." : "No requests yet. Prepare a draft in Customer reschedule, review it, then choose Add to approval tracker."}</p> : <ul className="mt-4 space-y-3">{shown.map((r) => <Row key={`${r.id}-${r.updatedAt}`} r={r} />)}</ul>}
      <p className="mt-4 text-xs text-muted-foreground">Saved privately in this browser with your notes. Not shared with teammates.</p>
    </SheetContent></Sheet>;
}
