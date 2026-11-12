import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { exportReport } from "@/lib/data-exchange";
import type { Part } from "@/lib/shortages";
import { useHub } from "./store";

export function ExportDialog({ shown }: { shown: Part[] }) {
  const { parts } = useHub();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState("all");
  const [format, setFormat] = useState<"csv" | "xlsx">("xlsx");
  const [busy, setBusy] = useState(false);
  const selected = scope === "all" ? parts : shown;
  const download = async () => {
    setBusy(true);
    try { await exportReport(selected, format, scope === "all" ? "full-board" : "filtered-board"); toast.success(`${selected.length} shortages exported`); setOpen(false); }
    catch { toast.error("Export failed. Please try again."); }
    finally { setBusy(false); }
  };
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild><Button variant="outline"><Download className="size-4" /> Export</Button></DialogTrigger>
    <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Export shortage board</DialogTitle><DialogDescription>EUR · one row per part/order link. Excel includes a standup snapshot. Notes and checklists are not included.</DialogDescription></DialogHeader>
      <label className="flex flex-col gap-2 text-sm">Scope<select aria-label="Export scope" value={scope} onChange={(e) => setScope(e.target.value)} className="min-h-11 rounded-md border border-input bg-card px-3"><option value="all">Entire board ({parts.length} shortages)</option><option value="filtered">Current filters ({shown.length} shortages)</option></select></label>
      <label className="flex flex-col gap-2 text-sm">Format<select aria-label="Export format" value={format} onChange={(e) => setFormat(e.target.value === "csv" ? "csv" : "xlsx")} className="min-h-11 rounded-md border border-input bg-card px-3"><option value="xlsx">Excel (.xlsx) + standup</option><option value="csv">CSV (.csv)</option></select></label>
      <DialogFooter><Button disabled={busy || !selected.length} onClick={() => void download()}>{busy ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Download className="size-4" />} Download {format.toUpperCase()}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}