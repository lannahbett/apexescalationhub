import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { applyOrderPatch, applyReportParts, buildSeed, CURRENT_USER, ROLE_VIEWS, type CommercialMode, type RoleView, type CustomerOrder, type Part, type TimelineEntry } from "@/lib/shortages";
import { validateReport, type Grid, type Mapping } from "@/lib/data-exchange";
import { toast } from "sonner";

const KEY = "apex-hub-v1";
type Ctx = {
  parts: Part[];
  roleView: RoleView;
  setRoleView: (role: RoleView) => void;
  updateOrder: (so: string, patch: Partial<CustomerOrder>, text: string) => void;
  commercialMode: CommercialMode;
  setCommercialMode: (mode: CommercialMode) => void;
  update: (id: string, patch: Partial<Part>, log?: Omit<TimelineEntry, "at" | "by">) => void;
  reset: () => void;
  importReport: (grid: Grid, mapping: Mapping, mode: "merge" | "replace") => number;
};
const HubCtx = createContext<Ctx | null>(null);

export function HubProvider({ children }: { children: ReactNode }) {
  const [parts, setParts] = useState<Part[]>(() => buildSeed());
  const [roleView, setRoleView] = useState<RoleView>("planner");
  const [loaded, setLoaded] = useState(false);
  const [commercialMode, setCommercialMode] = useState<CommercialMode>("dual");
  useEffect(() => {
    try {
      const role = ROLE_VIEWS.find((r) => r.id === localStorage.getItem("apex-role-view"));
      if (role) setRoleView(role.id);
      const mode = localStorage.getItem("apex-commercial-mode");
      if (mode === "dual" || mode === "tiers" || mode === "penalties") setCommercialMode(mode);
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
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(KEY, JSON.stringify(parts)); }
      catch { toast.error("The browser could not save the board. Export a copy before closing this page."); }
    }
  }, [parts, loaded]);
  useEffect(() => { if (loaded) localStorage.setItem("apex-commercial-mode", commercialMode); }, [commercialMode, loaded]);

  useEffect(() => { if (loaded) localStorage.setItem("apex-role-view", roleView); }, [roleView, loaded]);

  const [announce, setAnnounce] = useState("");
  const update: Ctx["update"] = (id, patch, log) => {
    if (log) {
      const pn = parts.find((p) => p.id === id)?.partNumber ?? "Part";
      setAnnounce(`${pn}: ${log.text}`);
    }
    setParts((ps) =>
      ps.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              ...patch,
              timeline: log
                ? [{ ...log, at: new Date().toISOString(), by: CURRENT_USER }, ...(patch.timeline ?? p.timeline)]
                : (patch.timeline ?? p.timeline),
            },
      ),
    );
  };
  const updateOrder: Ctx["updateOrder"] = (so, patch, text) => {
    setParts((ps) => applyOrderPatch(ps, so, patch, { kind: "date", text, at: new Date().toISOString(), by: CURRENT_USER }));
    setAnnounce(`${so}: ${text}`);
  };
  const importReport: Ctx["importReport"] = (grid, mapping, mode) => {
    const result = validateReport(grid, mapping, parts, mode);
    if (result.errors.length || !result.parts.length) throw new Error("The report has validation errors. No changes were applied.");
    const text = `ERP import: ${grid.name}, ${result.parts.length} shortages (${mode}).`;
    const next = applyReportParts(parts, result.parts, mode, { kind: "note", text, at: new Date().toISOString(), by: CURRENT_USER });
    try { localStorage.setItem(KEY, JSON.stringify(next)); }
    catch { throw new Error("Not enough browser storage. Export your board or use a smaller report. No changes were applied."); }
    setParts(next);
    setAnnounce(text);
    return result.parts.length;
  };
  return (
    <HubCtx.Provider value={{ importReport, roleView, setRoleView, updateOrder, parts, commercialMode, setCommercialMode, update, reset: () => { setParts(buildSeed()); setAnnounce("Sample data restored"); } }}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">{announce}</div>
    </HubCtx.Provider>
  );
}

export function useHub() {
  const c = useContext(HubCtx);
  if (!c) throw new Error("useHub outside provider");
  return c;
}
