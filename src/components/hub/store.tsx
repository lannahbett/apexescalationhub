import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { buildSeed, CURRENT_USER, type Part, type TimelineEntry } from "@/lib/shortages";

const KEY = "apex-hub-v1";
type Ctx = {
  parts: Part[];
  update: (id: string, patch: Partial<Part>, log?: Omit<TimelineEntry, "at" | "by">) => void;
  reset: () => void;
};
const HubCtx = createContext<Ctx | null>(null);

export function HubProvider({ children }: { children: ReactNode }) {
  const [parts, setParts] = useState<Part[]>(() => buildSeed());
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setParts(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(parts));
  }, [parts, loaded]);

  const update: Ctx["update"] = (id, patch, log) =>
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
  return (
    <HubCtx.Provider value={{ parts, update, reset: () => setParts(buildSeed()) }}>{children}</HubCtx.Provider>
  );
}

export function useHub() {
  const c = useContext(HubCtx);
  if (!c) throw new Error("useHub outside provider");
  return c;
}
