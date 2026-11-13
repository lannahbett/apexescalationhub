import { useMemo, useState } from "react";
import { Copy, Database, FolderSync, Mail, MessageSquare, BarChart3, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useHub } from "@/components/hub/store";
import { computeKpis, riskTier } from "@/lib/shortages";

const CONNECTORS = [
  { id: "sap", name: "SAP ECC", icon: Database, role: "System of record", how: "Daily MD04 / ME2M / VA05 extract (scheduled job) loaded through Import.", today: "Use Import with an SAP export file." },
  { id: "sharepoint", name: "SharePoint", icon: FolderSync, role: "Shared file handover", how: "Watch a folder such as /Supply Chain/Daily Shortages and load new versions automatically.", today: "Download the file from SharePoint, then use Import." },
  { id: "outlook", name: "Outlook", icon: Mail, role: "Supplier replies", how: "Forward supplier emails from a shared mailbox to the AI update reader.", today: "Paste the email into “Read supplier update”." },
  { id: "teams", name: "Microsoft Teams", icon: MessageSquare, role: "Standup channel", how: "Post the morning summary to your standup channel automatically.", today: "Copy the summary below and paste it in Teams." },
  { id: "powerbi", name: "Power BI", icon: BarChart3, role: "Monthly reporting", how: "Feed the cleaned board data into your Power BI reports.", today: "Use Export (Excel) as a Power BI data source." },
] as const;

const eur = (n: number) => `€${Math.round(n).toLocaleString("en-GB")}`;

export function ConnectorsHub() {
  const { parts } = useHub();
  const [copied, setCopied] = useState(false);
  const summary = useMemo(() => {
    const k = computeKpis(parts);
    const top = parts.filter((p) => p.stage !== "delivered" && riskTier(p.riskScore) === "critical")
      .sort((a, b) => a.hoursToLineStop - b.hoursToLineStop).slice(0, 3);
    return [
      `Apex standup · ${new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}`,
      `Open shortages: ${k.activeCount} · Production value at risk: ${eur(k.valueAtRisk)} · Stalled: ${k.stalledCount}`,
      "Top critical parts:",
      ...(top.length ? top.map((p) => `• ${p.partNumber} (${p.line}) – ${p.hoursToLineStop}h to line stop – ${p.supplier}`) : ["• None"]),
    ].join("\n");
  }, [parts]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary); setCopied(true); toast.success("Summary copied, paste it in Teams."); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("Copy failed, select the text and copy it manually."); }
  };
  return (
    <section id="connectors" tabIndex={-1} aria-labelledby="connectors-title" className="space-y-3 border-t pt-5">
      <div>
        <h2 id="connectors-title" className="text-lg font-semibold">Enterprise connectors</h2>
        <p className="text-xs text-muted-foreground">How Apex fits your SAP ECC and Microsoft 365 tools. These are not connected yet in this prototype, each card shows what works today.</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {CONNECTORS.map(({ id, name, icon: Icon, role, how, today }) => (
          <li key={id} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
            <div className="flex items-center gap-2"><Icon aria-hidden className="size-4 text-primary" /><span className="text-sm font-semibold">{name}</span></div>
            <span className="w-fit rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">○ Not connected · planned</span>
            <p className="text-[11px] font-medium text-muted-foreground">{role}</p>
            <p className="text-xs">{how}</p>
            <p className="mt-auto text-xs"><span className="font-semibold">Today: </span>{today}</p>
          </li>
        ))}
      </ul>
      <div className="rounded-lg border bg-card p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Teams standup message preview</h3>
          <Button onClick={copy} className="min-h-11">{copied ? <Check aria-hidden /> : <Copy aria-hidden />} Copy for Teams</Button>
        </div>
        <pre className="mt-2 whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs">{summary}</pre>
        <p className="mt-1 text-[11px] text-muted-foreground">Built from the current board. Nothing is sent automatically.</p>
      </div>
    </section>
  );
}
