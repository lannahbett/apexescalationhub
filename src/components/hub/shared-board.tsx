import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Cloud, CloudOff, History, LoaderCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useHub, viewerQuery } from "./store";
import { TeamMembers } from "./team-members";

const LABEL = {
  checking: "Checking sign-in…",
  local: "Private board · saved in this browser only",
  connecting: "Connecting to the shared board…",
  live: "Shared board · live for signed-in teammates",
  empty: "Shared board is empty",
  error: "Shared board unavailable · changes may not be saved",
} as const;

export function SharedBoardStatus() {
  const { sync, viewer } = useHub();
  const qc = useQueryClient();
  const Icon = sync === "live" ? Cloud : sync === "checking" || sync === "connecting" ? LoaderCircle : CloudOff;
  const signOut = async () => { await supabase.auth.signOut(); qc.invalidateQueries({ queryKey: viewerQuery }); };
  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
      <span role="status" className="inline-flex items-center gap-1.5">
        <Icon aria-hidden className={sync === "checking" || sync === "connecting" ? "size-3.5 animate-spin" : "size-3.5"} />
        {LABEL[sync]}
      </span>
      {!viewer && <Button asChild size="sm" variant="outline" className="min-h-11"><Link to="/auth">Sign in with Google</Link></Button>}
      <TeamMembers />
      {viewer?.door === "account" && <Button size="sm" variant="ghost" className="min-h-11" onClick={signOut}><LogOut aria-hidden /> Sign out</Button>}
    </div>
  );
}

export function SharedBoardEmpty() {
  const { sync, loadSampleIntoCloud } = useHub();
  if (sync !== "empty") return null;
  return (
    <section aria-label="Empty shared board" className="rounded-lg border border-dashed bg-card p-4 text-sm">
      <p className="font-semibold">Your team's shared board has no parts yet.</p>
      <p className="mt-1 text-xs text-muted-foreground">Load the 14 sample parts for everyone, or import your SAP or Excel report with Import.</p>
      <Button className="mt-3 min-h-11" onClick={loadSampleIntoCloud}>Load sample parts for the team</Button>
    </section>
  );
}

export function ActivityFeed() {
  const { activity, viewer } = useHub();
  if (!viewer) return null;
  return (
    <section id="activity" tabIndex={-1} aria-labelledby="activity-title" className="rounded-lg border bg-card p-4">
      <h2 id="activity-title" className="flex items-center gap-2 text-sm font-semibold"><History aria-hidden className="size-4" /> Team activity</h2>
      {activity.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">No changes yet. Updates from any teammate appear here instantly.</p>
      ) : (
        <ol className="mt-2 max-h-64 space-y-2 overflow-y-auto text-xs">
          {activity.map((a) => (
            <li key={a.id} className="border-l-2 border-border pl-2">
              <span className="font-medium">{a.actor_name}</span> <span className="text-muted-foreground">· {new Date(a.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              <div className="break-words">{a.summary}</div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
