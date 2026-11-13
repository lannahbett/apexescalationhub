import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { applyOrderPatch, applyReportParts, buildSeed, CURRENT_USER, ROLE_VIEWS, STAGES, validRecovery, type RecoveryRecord, type Stage, type CommercialMode, type RoleView, type CustomerOrder, type Part, type TimelineEntry } from "@/lib/shortages";
import { validateReport, type Grid, type Mapping } from "@/lib/data-exchange";
import { getViewer } from "@/lib/viewer.functions";
import { boardClient, diffParts, type Activity, type Viewer } from "@/lib/cloud-board";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RecoveryDialog } from "./recovery-dialog";

const KEY = "apex-hub-v1";
export type SyncStatus = "checking" | "local" | "connecting" | "live" | "empty" | "error";
type Ctx = {
  parts: Part[];
  roleView: RoleView;
  setRoleView: (role: RoleView) => void;
  updateOrder: (so: string, patch: Partial<CustomerOrder>, text: string) => void;
  commercialMode: CommercialMode;
  setCommercialMode: (mode: CommercialMode) => void;
  update: (id: string, patch: Partial<Part>, log?: Omit<TimelineEntry, "at" | "by">) => void;
  moveStage: (id: string, stage: Stage) => void;
  reset: () => void;
  importReport: (grid: Grid, mapping: Mapping, mode: "merge" | "replace") => number;
  viewer: Viewer | null;
  actor: string;
  sync: SyncStatus;
  activity: Activity[];
  loadSampleIntoCloud: () => Promise<void>;
};
const HubCtx = createContext<Ctx | null>(null);
export const viewerQuery = ["viewer"] as const;

export function HubProvider({ children }: { children: ReactNode }) {
  const [parts, setParts] = useState<Part[]>(() => buildSeed());
  const [roleView, setRoleView] = useState<RoleView>("planner");
  const [loaded, setLoaded] = useState(false);
  const [commercialMode, setCommercialMode] = useState<CommercialMode>("dual");
  const fetchViewer = useServerFn(getViewer);
  const viewerQ = useQuery({ queryKey: viewerQuery, queryFn: () => fetchViewer(), staleTime: 5 * 60_000, retry: false });
  const viewer = viewerQ.data ?? null;
  const actor = viewer?.name ?? CURRENT_USER;
  const [sync, setSync] = useState<SyncStatus>("checking");
  const [activity, setActivity] = useState<Activity[]>([]);
  const db = useRef<SupabaseClient | null>(null);
  const synced = useRef(new Map<string, string>());
  const qc = useQueryClient();

  // Refresh who is signed in when a Google account session starts or ends.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") qc.invalidateQueries({ queryKey: viewerQuery });
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  useEffect(() => {
    try {
      const role = ROLE_VIEWS.find((r) => r.id === localStorage.getItem("apex-role-view"));
      if (role) setRoleView(role.id);
      const mode = localStorage.getItem("apex-commercial-mode");
      if (mode === "dual" || mode === "tiers" || mode === "penalties") setCommercialMode(mode);
    } catch {}
  }, []);

  const loadLocal = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const seed = buildSeed();
        // Backfill new signal fields onto boards saved before they existed, keeping planner edits.
        setParts((JSON.parse(raw) as Part[]).map((p) => {
          const s = seed.find((x) => x.id === p.id);
          return { ...p, orders: p.orders ?? s?.orders ?? [], demand: p.demand ?? s?.demand, leadTime: p.leadTime ?? s?.leadTime };
        }));
      }
    } catch {}
  };

  // Choose the shared cloud board for signed-in teammates; otherwise keep the private browser board.
  useEffect(() => {
    if (viewerQ.isPending) return;
    if (!viewer) { db.current = null; synced.current = new Map(); loadLocal(); setSync("local"); setLoaded(true); return; }
    const client = boardClient(viewer.door);
    db.current = client;
    setSync("connecting");
    let alive = true;
    (async () => {
      const [{ data, error }, act] = await Promise.all([
        client.from("board_parts").select("id, data").order("id"),
        client.from("board_activity").select("id, at, actor_name, summary").order("at", { ascending: false }).limit(30),
      ]);
      if (!alive) return;
      if (error) { setSync("error"); toast.error("The shared board could not be loaded. Showing this browser's copy."); loadLocal(); setLoaded(true); return; }
      const rows = (data ?? []).map((r) => r.data as Part);
      synced.current = new Map(rows.map((p) => [p.id, JSON.stringify(p)]));
      setParts(rows);
      setActivity((act.data ?? []) as Activity[]);
      setSync(rows.length ? "live" : "empty");
      setLoaded(true);
    })();
    const channel = client
      .channel(`board-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "board_parts" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string }).id;
          if (!id) return;
          synced.current.delete(id);
          setParts((ps) => ps.filter((p) => p.id !== id));
          return;
        }
        const part = (payload.new as { data: Part }).data;
        synced.current.set(part.id, JSON.stringify(part));
        setParts((ps) => (ps.some((p) => p.id === part.id) ? ps.map((p) => (p.id === part.id ? part : p)) : [...ps, part]));
        setSync("live");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "board_activity" }, (payload) => {
        const a = payload.new as Activity;
        setActivity((list) => (list.some((x) => x.id === a.id) ? list : [a, ...list].slice(0, 30)));
      })
      .subscribe();
    return () => { alive = false; client.removeChannel(channel); };
  }, [viewer?.door, viewer?.id, viewerQ.isPending]);

  // Push local edits: shared board for signed-in teammates, browser storage otherwise.
  useEffect(() => {
    if (!loaded) return;
    if (!db.current) {
      try { localStorage.setItem(KEY, JSON.stringify(parts)); }
      catch { toast.error("The browser could not save the board. Export a copy before closing this page."); }
      return;
    }
    if (sync !== "live" && sync !== "empty") return;
    const { upserts, deletes } = diffParts(synced.current, parts);
    if (!upserts.length && !deletes.length) return;
    upserts.forEach((p) => synced.current.set(p.id, JSON.stringify(p)));
    deletes.forEach((id) => synced.current.delete(id));
    const client = db.current;
    (async () => {
      const results = await Promise.all([
        upserts.length ? client.from("board_parts").upsert(upserts.map((p) => ({ id: p.id, data: p, updated_at: new Date().toISOString(), updated_by: actor }))) : null,
        deletes.length ? client.from("board_parts").delete().in("id", deletes) : null,
      ]);
      if (results.some((r) => r?.error)) { setSync("error"); toast.error("A change could not be saved to the shared board. Reload to see the latest version."); }
    })();
  }, [parts, loaded, sync, actor]);

  useEffect(() => { if (loaded) localStorage.setItem("apex-commercial-mode", commercialMode); }, [commercialMode, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem("apex-role-view", roleView); }, [roleView, loaded]);

  const logActivity = useCallback((summary: string) => {
    const client = db.current;
    if (!client) return;
    client.from("board_activity").insert({ actor_name: actor, summary: summary.slice(0, 500) }).select("id, at, actor_name, summary").single()
      .then(({ data }) => { if (data) setActivity((list) => (list.some((x) => x.id === data.id) ? list : [data as Activity, ...list].slice(0, 30))); });
  }, [actor]);

  const [announce, setAnnounce] = useState("");
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const recoveryPart = parts.find((p) => p.id === recoveryId);
  const update: Ctx["update"] = (id, patch, log) => {
    if (log) {
      const pn = parts.find((p) => p.id === id)?.partNumber ?? "Part";
      setAnnounce(`${pn}: ${log.text}`);
      logActivity(`${pn}: ${log.text}`);
    }
    setParts((ps) =>
      ps.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              ...patch,
              timeline: log
                ? [{ ...log, at: new Date().toISOString(), by: actor }, ...(patch.timeline ?? p.timeline)]
                : (patch.timeline ?? p.timeline),
            },
      ),
    );
  };
  const updateOrder: Ctx["updateOrder"] = (so, patch, text) => {
    setParts((ps) => applyOrderPatch(ps, so, patch, { kind: "date", text, at: new Date().toISOString(), by: actor }));
    setAnnounce(`${so}: ${text}`);
    logActivity(`${so}: ${text}`);
  };
  const moveStage: Ctx["moveStage"] = (id, stage) => {
    const part = parts.find((p) => p.id === id);
    const next = STAGES.find((s) => s.id === stage);
    if (!part || !next || part.stage === stage) return;
    if (stage === "delivered") { setRecoveryId(id); return; }
    update(id, { stage }, { kind: "stage", text: `${part.stage === "delivered" ? "Escalation reopened: " : ""}Stage moved to ${next.n}. ${next.label}` });
  };
  const confirmRecovery = (draft: RecoveryRecord) => {
    if (!recoveryPart || recoveryPart.stage === "delivered" || !validRecovery(draft)) return;
    const record = { ...draft, id: crypto.randomUUID(), recoveredAt: new Date().toISOString(), by: actor };
    update(recoveryPart.id, { stage: "delivered", recoveries: [...(recoveryPart.recoveries ?? []), record] },
      { kind: "stage", text: `Recovery confirmed: ${record.cause}. Stage moved to 5. Cleared & Delivered.` });
    setRecoveryId(null);
  };
  const importReport: Ctx["importReport"] = (grid, mapping, mode) => {
    const result = validateReport(grid, mapping, parts, mode);
    if (result.errors.length || !result.parts.length) throw new Error("The report has validation errors. No changes were applied.");
    const text = `ERP import: ${grid.name}, ${result.parts.length} shortages (${mode}).`;
    const next = applyReportParts(parts, result.parts, mode, { kind: "note", text, at: new Date().toISOString(), by: actor });
    if (!db.current) {
      try { localStorage.setItem(KEY, JSON.stringify(next)); }
      catch { throw new Error("Not enough browser storage. Export your board or use a smaller report. No changes were applied."); }
    }
    setParts(next);
    setAnnounce(text);
    logActivity(text);
    return result.parts.length;
  };
  const reset = () => {
    setParts(buildSeed());
    setAnnounce("Sample data restored");
    logActivity("Restored the sample data on the shared board.");
  };
  const loadSampleIntoCloud = async () => {
    if (!db.current) return;
    const seed = buildSeed();
    const { error } = await db.current.from("board_parts").upsert(seed.map((p) => ({ id: p.id, data: p, updated_by: actor })));
    if (error) { toast.error("The sample parts could not be added. Try again."); return; }
    seed.forEach((p) => synced.current.set(p.id, JSON.stringify(p)));
    setParts(seed);
    setSync("live");
    logActivity(`Loaded ${seed.length} sample parts into the shared board.`);
  };
  return (
    <HubCtx.Provider value={{ moveStage, importReport, roleView, setRoleView, updateOrder, parts, commercialMode, setCommercialMode, update, reset, viewer, actor, sync, activity, loadSampleIntoCloud }}>
      {children}
      {recoveryPart && <RecoveryDialog key={recoveryPart.id} part={recoveryPart} onCancel={() => setRecoveryId(null)} onSave={confirmRecovery} />}
      <div role="status" aria-live="polite" className="sr-only">{announce}</div>
    </HubCtx.Provider>
  );
}

export function useHub() {
  const c = useContext(HubCtx);
  if (!c) throw new Error("useHub outside provider");
  return c;
}
