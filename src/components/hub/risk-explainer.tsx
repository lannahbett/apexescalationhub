import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { explainRisk } from "@/lib/ai.functions";
import type { Part } from "@/lib/shortages";
import { summarize } from "./ai-tools";
import { useHub } from "./store";

export function RiskExplainer({ part }: { part: Part }) {
  const { commercialMode } = useHub();
  const run = useServerFn(explainRisk);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<{ drivers: string[]; nextSteps: string[] } | null>(null);
  const go = async () => {
    setBusy(true); setErr("");
    try { setRes(await run({ data: { part: summarize(part, commercialMode), commercialMode: commercialMode } })); }
    catch (e) { setErr(e instanceof Error ? e.message : "AI unavailable."); }
    finally { setBusy(false); }
  };
  return (
    <section aria-label="Risk score explanation" className="rounded border bg-muted/40 p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="font-semibold">Why risk {part.riskScore}? <span className="ml-1 rounded bg-elevated-soft px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-elevated">Advisory · AI</span></div>
        <Button variant="outline" size="sm" onClick={go} disabled={busy}>
          {busy ? <Loader2 aria-hidden className="animate-spin" /> : <Sparkles aria-hidden />}{res ? "Refresh" : "Explain score"}
        </Button>
      </div>
      <div aria-live="polite">
        {err && <p role="alert" className="mt-2 text-critical">{err}</p>}
        {res && <div className="mt-2 space-y-2">
          <div><div className="font-medium">Main drivers</div><ul className="list-disc pl-4">{res.drivers.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
          <div><div className="font-medium">Suggested next steps</div><ul className="list-disc pl-4">{res.nextSteps.map((d, i) => <li key={i}>{d}</li>)}</ul></div>
          <p className="text-muted-foreground">Advisory only, generated from the board data. Verify before acting; nothing on the board was changed.</p>
        </div>}
      </div>
    </section>
  );
}
