import { useState } from "react";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CSV_TEMPLATE } from "@/lib/shortages";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<string[][] | null>(null);
  const [name, setName] = useState("");

  const read = (f: File) => {
    setName(f.name);
    f.text().then((t) => setRows(t.trim().split(/\r?\n/).slice(0, 8).map((l) => l.split(","))));
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "apex_erp_shortage_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setRows(null); setName(""); } }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary"><Upload className="size-3.5" /> Import ERP Report</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import ERP shortage report</DialogTitle>
          <DialogDescription>Upload a CSV export from your MRP run. This is a preview — no data is changed.</DialogDescription>
        </DialogHeader>
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) read(f); }}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-8 text-center hover:bg-muted"
        >
          <FileSpreadsheet className="size-8 text-muted-foreground" />
          <span className="text-sm font-medium">{name || "Drop CSV here or click to browse"}</span>
          <span className="text-xs text-muted-foreground">SAP MD04 / Oracle shortage export, comma-separated</span>
          <input type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && read(e.target.files[0])} />
        </label>
        {rows && (
          <div className="max-h-56 overflow-auto rounded border">
            <table className="w-full text-[11px]">
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={i === 0 ? "bg-muted font-semibold" : "border-t"}>
                    {r.map((c, j) => <td key={j} className="whitespace-nowrap px-2 py-1 font-mono">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={download}><Download className="size-3.5" /> Download CSV template</Button>
          <Button disabled={!rows} onClick={() => { toast.success(`${(rows?.length ?? 1) - 1} rows validated (demo import)`); setOpen(false); }}>Validate & import</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
