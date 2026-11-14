import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useHub } from "./store";
import { noteSchema, readNotes, readTracked, trackedSchema, type TrackedReschedule, type WorkNote } from "@/lib/work-notes";

interface NotesContext { notes: WorkNote[]; ready: boolean; save: (note: Omit<WorkNote, "id" | "updatedAt">, id?: string) => boolean; remove: (id: string) => void; tracked: TrackedReschedule[]; track: (item: Omit<TrackedReschedule, "id" | "createdAt" | "updatedAt"> & Partial<Pick<TrackedReschedule, "id" | "createdAt">>) => boolean; untrack: (id: string) => void }
const Context = createContext<NotesContext | null>(null);
export function WorkspaceNotes({ children }: { children: ReactNode }) {
  const { viewer, sync } = useHub();
  const scope = sync === "checking" || sync === "connecting" ? null : `apex-notes:${viewer ? `${viewer.door}:${viewer.id}` : "private"}`;
  const [state, setState] = useState<{ scope: string | null; notes: WorkNote[] }>({ scope: null, notes: [] });
  useEffect(() => { if (!scope) return; try { setState({ scope, notes: readNotes(localStorage.getItem(scope)) }); } catch { toast.error("Browser storage is unavailable. Notes cannot be saved."); } }, [scope]);
  const [tr, setTr] = useState<{ scope: string | null; items: TrackedReschedule[] }>({ scope: null, items: [] });
  useEffect(() => { if (!scope) return; try { setTr({ scope, items: readTracked(localStorage.getItem(`${scope}:reschedules`)) }); } catch { /* storage unavailable; toast shown above */ } }, [scope]);
  const ready = !!scope && state.scope === scope && tr.scope === scope;
  const persistTr = (items: TrackedReschedule[]) => { if (!scope || !ready) return false; try { localStorage.setItem(`${scope}:reschedules`, JSON.stringify(items)); setTr({ scope, items }); return true; } catch { toast.error("Tracker could not be saved."); return false; } };
  const track: NotesContext["track"] = (item) => { const now = new Date().toISOString(); const parsed = trackedSchema.safeParse({ ...item, id: item.id ?? crypto.randomUUID(), createdAt: item.createdAt ?? now, updatedAt: now }); if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Check the request details."); return false; } if (!item.id && tr.items.length >= 200) { toast.error("Tracker holds 200 requests. Remove one first."); return false; } return persistTr([parsed.data, ...tr.items.filter((r) => r.id !== parsed.data.id)]); };
  const persist = (notes: WorkNote[]) => { if (!scope || !ready) return false; try { localStorage.setItem(scope, JSON.stringify(notes)); setState({ scope, notes }); return true; } catch { toast.error("Notes could not be saved. Copy your text before closing."); return false; } };
  const save: NotesContext["save"] = (note, id) => { const parsed = noteSchema.safeParse({ ...note, id: id ?? crypto.randomUUID(), updatedAt: new Date().toISOString() }); if (!parsed.success) { toast.error("Enter a title and note within the allowed length."); return false; } if (!id && state.notes.length >= 200) { toast.error("This browser holds 200 notes. Delete a note before adding another."); return false; } return persist([parsed.data, ...state.notes.filter((n) => n.id !== parsed.data.id)]); };
  return <Context.Provider value={{ notes: ready ? state.notes : [], ready, save, remove: (id) => { persist(state.notes.filter((n) => n.id !== id)); }, tracked: ready ? tr.items : [], track, untrack: (id) => { persistTr(tr.items.filter((r) => r.id !== id)); } }}>{children}</Context.Provider>;
}
export function useWorkNotes() { const context = useContext(Context); if (!context) throw new Error("Notes provider missing"); return context; }