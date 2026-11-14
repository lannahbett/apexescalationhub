import { useState } from "react";
import { NotebookPen, Pin, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { handover, type WorkNote } from "@/lib/work-notes";
import { useWorkNotes } from "./workspace-notes";
import { useHub } from "./store";

export function Scratchpad() {
  const { notes, ready, save, remove } = useWorkNotes();
  const { parts } = useHub();
  const [id, setId] = useState<string>();
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [reference, setReference] = useState("");
  const [category, setCategory] = useState<WorkNote["category"]>("note"); const [pinned, setPinned] = useState(false);
  const [search, setSearch] = useState("");
  const clear = () => { setId(undefined); setTitle(""); setBody(""); setReference(""); setCategory("note"); setPinned(false); };
  const references = [...new Set(parts.flatMap((p) => [p.partNumber, ...(p.orders ?? []).map((o) => o.so)]))];
  return <Sheet><SheetTrigger asChild><Button variant="outline" size="sm"><NotebookPen aria-hidden className="size-4" />Notes & drafts</Button></SheetTrigger>
    <SheetContent className="w-full overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Notes & drafts</SheetTitle><SheetDescription>Private to this browser and viewer. Not shared or backed up. Board reset keeps these notes; clearing site data deletes them.</SheetDescription></SheetHeader>
      <form className="mt-4 space-y-3" onSubmit={(e) => { e.preventDefault(); if (save({ title, body, reference, category, pinned }, id)) { clear(); toast.success("Note saved in this browser"); } }}>
        <label className="block text-xs">Title<Input aria-label="Note title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="block text-xs">Category<select aria-label="Note category" className="h-11 w-full rounded border border-input bg-card px-2" value={category} onChange={(e) => setCategory(e.target.value as WorkNote["category"])}><option value="note">Working note</option><option value="sap_review">SAP date review</option><option value="customer_email">Customer email draft</option><option value="handover">Shift handover</option></select></label>
        <label className="block text-xs">Part or order reference (optional)<Input aria-label="Note reference" list="note-references" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} /><datalist id="note-references">{references.map((r) => <option key={r} value={r} />)}</datalist></label>
        <label className="block text-xs">Draft / note<Textarea aria-label="Note text" required maxLength={12000} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-32" /></label>
        <label className="flex min-h-11 items-center gap-2 text-xs"><input type="checkbox" className="size-5 accent-primary" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />Pin for handover</label>
        <div className="flex flex-wrap gap-2"><Button disabled={!ready || !title.trim() || !body.trim()}>Save note</Button><Button type="button" variant="outline" onClick={() => { if (!body || window.confirm("Discard this unsaved note?")) clear(); }}>New note</Button></div>
      </form>
      <div className="mt-6 space-y-3 border-t pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Saved notes ({notes.length})</h3><Button variant="outline" disabled={!notes.some((n) => n.pinned)} onClick={async () => { try { await navigator.clipboard.writeText(handover(notes)); toast.success("Pinned handover copied"); } catch { toast.error("Clipboard unavailable"); } }}>Copy pinned handover</Button></div>
        <Input type="search" aria-label="Search notes" placeholder="Search notes" value={search} onChange={(e) => setSearch(e.target.value)} />
        {notes.filter((n) => `${n.title} ${n.body} ${n.reference}`.toLowerCase().includes(search.toLowerCase())).map((n) => <article key={n.id} className="rounded border bg-card p-3"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="break-words text-sm font-semibold">{n.title}</h4><p className="break-words text-xs text-muted-foreground">{n.reference} · {new Date(n.updatedAt).toLocaleString()}</p></div><div className="flex shrink-0"><Button variant="ghost" size="icon" title="Pin for handover" aria-label={`Pin ${n.title}`} aria-pressed={n.pinned} disabled={!ready} onClick={() => { save({ ...n, pinned: !n.pinned }, n.id); }}><Pin className={n.pinned ? "text-primary" : "text-muted-foreground"} /></Button><Button variant="ghost" size="icon" title="Edit note" aria-label={`Edit ${n.title}`} onClick={() => { if (body && !window.confirm("Replace your unsaved draft with this note?")) return; setId(n.id); setTitle(n.title); setBody(n.body); setReference(n.reference); setCategory(n.category); setPinned(n.pinned); }}><Pencil /></Button><Button variant="ghost" size="icon" title="Delete note" aria-label={`Delete ${n.title}`} onClick={() => { if (window.confirm("Delete this private note?")) { remove(n.id); if (id === n.id) clear(); } }}><Trash2 /></Button></div></div><p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm">{n.body}</p></article>)}
        {ready && notes.length === 0 && <p className="text-sm text-muted-foreground">No saved notes yet.</p>}
      </div>
    </SheetContent></Sheet>;
}