import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROOT_CAUSES, validRecovery, type Part, type RecoveryRecord, type RootCause } from "@/lib/shortages";

export function RecoveryDialog({ part, record, onSave, onCancel }: {
  part: Part; record?: RecoveryRecord; onSave: (r: RecoveryRecord) => void; onCancel: () => void;
}) {
  const [cause, setCause] = useState<RootCause | "">(record?.cause ?? "");
  const [why, setWhy] = useState(record?.why ?? "");
  const [cost, setCost] = useState(record?.cost == null ? "" : String(record.cost));
  const [owner, setOwner] = useState(record?.owner ?? "");
  const [reference, setReference] = useState(record?.reference ?? "");
  const [action, setAction] = useState(record?.action ?? "");
  const [status, setStatus] = useState<RecoveryRecord["status"]>(record?.status ?? "open");
  const draft: RecoveryRecord = { id: record?.id ?? "", recoveredAt: record?.recoveredAt ?? "", by: record?.by ?? "", cause: cause as RootCause,
    why: why.trim(), cost: cost.trim() ? Number(cost) : null, owner: owner.trim(), reference: reference.trim(), action: action.trim(), status,
    supplier: record?.supplier ?? part.supplier, partNumber: record?.partNumber ?? part.partNumber };
  return <Dialog open onOpenChange={(open) => { if (!open) onCancel(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>{record ? "Preventive action" : "Confirm recovery"}</DialogTitle><DialogDescription>{part.partNumber} · {record ? "CAPA / 8D follow-up" : "Cleared & Delivered"}</DialogDescription></DialogHeader>
    <form onSubmit={(e) => { e.preventDefault(); if (validRecovery(draft)) onSave(draft); }} className="space-y-4">
      <label className="block text-xs font-medium">Primary root cause (required)
        <select aria-label="Primary root cause" required value={cause} onChange={(e) => setCause(e.target.value as RootCause)} className="mt-1 h-11 w-full rounded-md border border-input bg-card px-2 text-foreground">
          <option value="">Choose a cause</option>{Object.entries(ROOT_CAUSES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select></label>
      <label className="block text-xs font-medium">5-Why summary (optional)<Textarea aria-label="5-Why summary" className="mt-1" maxLength={2000} value={why} onChange={(e) => setWhy(e.target.value)} /></label>
      <label className="block text-xs font-medium">Actual recovery cost, EUR (optional)<Input aria-label="Actual recovery cost, EUR" className="mt-1 h-11" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
      <details open={!!record}><summary className="min-h-11 cursor-pointer text-xs font-semibold">Preventive action / CAPA / 8D</summary><div className="space-y-3">
        <label className="block text-xs">Action owner<Input aria-label="Action owner" className="mt-1 h-11" maxLength={80} value={owner} onChange={(e) => setOwner(e.target.value)} /></label>
        <label className="block text-xs">8D / ticket reference<Input aria-label="8D / ticket reference" className="mt-1 h-11" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} /></label>
        <label className="block text-xs">Preventive action<Textarea aria-label="Preventive action description" className="mt-1" maxLength={2000} value={action} onChange={(e) => setAction(e.target.value)} /></label>
        <label className="block text-xs">Action status<select aria-label="Action status" className="mt-1 h-11 w-full rounded-md border border-input bg-card px-2" value={status} onChange={(e) => setStatus(e.target.value as RecoveryRecord["status"])}><option value="open">Open</option><option value="in_progress">In progress</option><option value="closed">Closed</option></select></label>
        {status === "closed" && <p className="text-xs text-muted-foreground">An owner and preventive action are required to close the follow-up.</p>}
      </div></details>
      <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={!validRecovery(draft)}>{record ? "Save follow-up" : "Confirm recovery"}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}