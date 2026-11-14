import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useHub } from "./store";
import { noteSchema, readNotes, type WorkNote } from "@/lib/work-notes";

interface NotesContext { notes: WorkNote[]; ready: boolean; save: (note: Omit<WorkNote, "id" | "updatedAt">, id?: string) => boolean; remove: (id: string) => void }
const Context = createContext<NotesContext | null>(null);
export function WorkspaceNotes({ children }: { children: ReactNode }) {
  const { viewer, sync } = useHub();
  const scope = sync === "checking" || sync === "connecting" ? null : `apex-notes:${viewer ? `${viewer.door}:${viewer.id}` : "private"}`;
  const [state, setState] = useState<{ scope: string | null; notes: WorkNote[] }>({ scope: null, notes: [] });
  useEffect(() => { if (!scope) return; try { setState({ scope, notes: readNotes(localStorage.getItem(scope)) }); } catch { toast.error("Browser storage is unavailable. Notes cannot be saved."); } }, [scope]);
  const ready = !!scope && state.scope === scope;
  const persist = (notes: WorkNote[]) => { if (!scope || !ready) return false; try { localStorage.setItem(scope, JSON.stringify(notes)); setState({ scope, notes }); return true; } catch { toast.error("Notes could not be saved. Copy your text before closing."); return false; } };
  const save: NotesContext["save"] = (note, id) => { const parsed = noteSchema.safeParse({ ...note, id: id ?? crypto.randomUUID(), updatedAt: new Date().toISOString() }); if (!parsed.success) { toast.error("Enter a title and note within the allowed length."); return false; } if (!id && state.notes.length >= 200) { toast.error("This browser holds 200 notes. Delete a note before adding another."); return false; } return persist([parsed.data, ...state.notes.filter((n) => n.id !== parsed.data.id)]); };
  return <Context.Provider value={{ notes: ready ? state.notes : [], ready, save, remove: (id) => { persist(state.notes.filter((n) => n.id !== id)); } }}>{children}</Context.Provider>;
}
export function useWorkNotes() { const context = useContext(Context); if (!context) throw new Error("Notes provider missing"); return context; }