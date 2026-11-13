import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload, LoaderCircle, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FIELDS, autoMapping, isSapLayout, readReport, validateReport, exportRows, csvContent, downloadBlob, partKey, type Grid, type Mapping } from "@/lib/data-exchange";
import { buildSeed } from "@/lib/shortages";
import { useHub } from "./store";

export function ImportDialog() {
  const { parts, importReport } = useHub();
  const [open, setOpen] = useState(false);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [sheet, setSheet] = useState(0);
  const [mapping, setMapping] = useState<Mapping>({});
  const [mode, setMode] = useState<"merge" | "replace">("merge");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const request = useRef(0);
  const grid = grids[sheet];
  const result = useMemo(() => grid ? validateReport(grid, mapping, parts, mode) : null, [grid, mapping, parts, mode]);
  const updates = result?.parts.filter((p) => parts.some((old) => partKey(old) === partKey(p))).length ?? 0;
  const read = async (file: File) => {
    const id = ++request.current;
    setBusy(true); setError(""); setGrids([]); setConfirmed(false); setName(file.name);
    try {
      const reports = await readReport(file);
      if (id !== request.current) return;
      setGrids(reports); setSheet(0); setMapping(autoMapping(reports[0]?.headers ?? []));
    } catch (e) { if (id === request.current) setError(e instanceof Error ? e.message : "The report could not be read."); }
    finally { if (id === request.current) setBusy(false); }
  };
  const apply = () => {
    if (!grid || !confirmed || busy || result?.errors.length) return;
    try { const count = importReport({ ...grid, name: `${name} / ${grid.name}` }, mapping, mode); toast.success(`${count} shortages imported and saved`); setOpen(false); }
    catch (e) { setError(e instanceof Error ? e.message : "Import failed. No changes applied."); }
  };
  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { request.current++; setGrids([]); setName(""); setError(""); setConfirmed(false); setBusy(false); } }}>
      <DialogTrigger asChild><Button size="sm" variant="secondary"><Upload className="size-3.5" /> Import ERP Report</Button></DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader><DialogTitle>Import ERP shortage report</DialogTitle><DialogDescription>CSV or XLSX · up to 10 MB and 5,000 rows · EUR · dates YYYY-MM-DD. Saved in this browser only; no ERP write-back.</DialogDescription></DialogHeader>
        <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) void read(f); }} className="relative flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-5 text-center hover:bg-muted">
          {busy ? <LoaderCircle className="size-7 animate-spin motion-reduce:animate-none text-muted-foreground" /> : <FileSpreadsheet className="size-7 text-muted-foreground" />}
          <span className="max-w-full break-all text-sm font-medium">{name || "Drop report here or choose a file"}</span>
          <input type="file" accept=".csv,.xlsx" aria-label="Choose ERP report" className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:opacity-100" onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ""; }} />
        </label>
        {error && <p role="alert" className="break-words text-sm text-critical">{error}</p>}
        {grid && <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="text-xs font-semibold">Worksheet <select aria-label="Worksheet" value={sheet} onChange={(e) => { const n = Number(e.target.value); setSheet(n); setMapping(autoMapping(grids[n]?.headers ?? [])); setConfirmed(false); }} className="ml-2 min-h-11 max-w-full rounded-md border border-input bg-card px-2">{grids.map((g, i) => <option key={i} value={i}>{g.name}</option>)}</select></label>
            <label className="text-xs font-semibold">Import mode <select aria-label="Import mode" value={mode} onChange={(e) => { setMode(e.target.value === "replace" ? "replace" : "merge"); setConfirmed(false); }} className="ml-2 min-h-11 rounded-md border border-input bg-card px-2"><option value="merge">Merge into board</option><option value="replace">Replace entire board</option></select></label>
          </div>
          {isSapLayout(grid.headers) && <p role="status" className="rounded-md border bg-muted px-3 py-2 text-sm"><strong>SAP ECC layout detected.</strong> Fields like MATNR, EBELN, LIFNR and EINDT were mapped automatically; dates DD.MM.YYYY and decimal commas (1.234,50) are accepted. Apex-only columns (days late, value at risk, hours to line stop, risk score) still need a column.</p>}
          <details className="border-b pb-3" open={result?.errors.some((e) => e.row === 1) || undefined}>
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">Column mapping ({FIELDS.filter(([k, , required]) => required && mapping[k] !== undefined).length} / {FIELDS.filter((f) => f[2]).length} required)</summary>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{FIELDS.map(([key, label, required]) => <label key={key} className="flex min-w-0 flex-col gap-1 text-xs">{label}{required ? " *" : ""}<select aria-label={`Map ${label}`} value={mapping[key] ?? ""} onChange={(e) => { const value = e.target.value; setMapping((m) => ({ ...m, [key]: value === "" ? undefined : Number(value) })); setConfirmed(false); }} className="min-h-11 w-full min-w-0 rounded-md border border-input bg-card px-2"><option value="">{required ? "Select column" : "Not imported"}</option>{grid.headers.map((h, i) => <option value={i} key={i}>{i + 1}. {h || "Unnamed"}</option>)}</select></label>)}</div>
          </details>
          <div className="max-h-48 overflow-auto rounded border" tabIndex={0} aria-label="Report preview"><table className="w-full text-xs"><thead className="bg-muted"><tr>{grid.headers.map((h, i) => <th key={i} className="whitespace-nowrap px-2 py-2 text-left">{h}</th>)}</tr></thead><tbody>{grid.rows.slice(0, 5).map((r, i) => <tr key={i} className="border-t">{r.map((c, j) => <td key={j} className="max-w-64 truncate px-2 py-2 font-mono" title={c}>{c}</td>)}</tr>)}</tbody></table></div>
          <p role="status" className="text-sm">{grid.rows.length} report rows · {result?.parts.length ?? 0} shortages · {mode === "merge" ? `${updates} updates, ${(result?.parts.length ?? 0) - updates} new` : `${parts.length} existing shortages will be replaced`} · {result?.errors.length ?? 0} errors</p>
          {!!result?.errors.length && <div className="max-h-36 overflow-auto text-xs text-critical" role="alert"><p className="mb-2 font-semibold">No rows will import until all errors are corrected.</p>{result.errors.slice(0, 30).map((e, i) => <p key={i}>Row {e.row}: {e.message}</p>)}{result.errors.length > 30 && <p>{result.errors.length - 30} more errors in the downloadable error report.</p>}<Button variant="outline" onClick={() => downloadBlob(new Blob([csvContent([["row", "error"], ...result.errors.map((e) => [String(e.row), e.message])])], { type: "text/csv" }), "apex-import-errors.csv")}><Download className="size-4" /> Export errors</Button></div>}
          {mode === "replace" && <p className="flex items-start gap-2 text-sm text-critical"><AlertTriangle className="size-4 shrink-0" />Replacement removes existing shortages, notes and checklists. Export a backup first.</p>}
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="size-5 shrink-0 accent-primary" checked={confirmed} disabled={!!result?.errors.length} onChange={(e) => setConfirmed(e.target.checked)} />I confirm these {mode === "replace" ? "replacement" : "merge"} changes, including any customer order terms.</label>
          <p className="text-xs text-muted-foreground">Match: part number + purchase order + line. Merge retains notes, checklists and omitted records. Repeated sales orders must have consistent terms. Blank optional fields retain existing values on merge.</p>
        </>}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={() => downloadBlob(new Blob(["\uFEFF", csvContent([FIELDS.map((f) => f[1]), ...exportRows(buildSeed().slice(0, 2))])], { type: "text/csv" }), "apex-example-template.csv")}><Download className="size-4" /> Sample CSV template</Button>
          <Button disabled={!grid || busy || !confirmed || !!result?.errors.length || !result?.parts.length} onClick={apply}>Confirm & import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}