import { useEffect, useState } from "react";
import { UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { boardClient } from "@/lib/cloud-board";
import { normalizeInviteEmail } from "@/lib/team-invites";
import { useHub } from "./store";

type Member = { sub: string; email: string | null; added_at: string };
type Invite = { email: string; added_at: string };

/** Shared-board teammates: visible only to approved members; access is enforced by the database. */
export function TeamMembers() {
  const { viewer, sync } = useHub();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const shared = !!viewer && (sync === "live" || sync === "empty");
  const client = viewer ? boardClient(viewer.door) : null;
  const load = async () => {
    if (!client) return;
    const [m, i] = await Promise.all([
      client.from("board_members").select("sub, email, added_at").order("added_at"),
      client.from("board_invites").select("email, added_at").order("added_at"),
    ]);
    if (m.error || i.error) { toast.error("The team list could not be loaded."); return; }
    setMembers((m.data ?? []) as Member[]); setInvites((i.data ?? []) as Invite[]);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) void load(); }, [open]);
  if (!shared || !client) return null;
  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = normalizeInviteEmail(email);
    if (!clean) { toast.error("Enter a valid email address."); return; }
    if (members.some((m) => m.email === clean) || invites.some((i) => i.email === clean)) { toast.info("This person is already on the list."); return; }
    setBusy(true);
    const { error } = await client.from("board_invites").insert({ email: clean });
    setBusy(false);
    if (error) { toast.error("The teammate could not be added."); return; }
    toast.success(`${clean} can now sign in with Google to join the shared board.`);
    setEmail(""); void load();
  };
  const remove = async (kind: "member" | "invite", key: string, label: string) => {
    if (!window.confirm(`Remove ${label} from the shared board?`)) return;
    const { error } = kind === "member" ? await client.from("board_members").delete().eq("sub", key) : await client.from("board_invites").delete().eq("email", key);
    if (error) toast.error("Could not remove access."); else void load();
  };
  return <>
    <Button size="sm" variant="outline" className="min-h-11" onClick={() => setOpen(true)}><Users aria-hidden /> Team</Button>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-full overflow-y-auto sm:max-w-md">
      <SheetHeader className="pr-10"><SheetTitle>Shared board team</SheetTitle><SheetDescription>Add a colleague's Google email. They join automatically the next time they sign in.</SheetDescription></SheetHeader>
      <form onSubmit={invite} className="mt-5 flex gap-2">
        <label className="sr-only" htmlFor="invite-email">Teammate email</label>
        <input id="invite-email" type="email" autoComplete="off" required maxLength={254} placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11 min-w-0 flex-1 rounded-md border border-input bg-card px-3 text-sm" />
        <Button type="submit" disabled={busy} className="min-h-11"><UserPlus aria-hidden /> Add</Button>
      </form>
      <h3 className="mt-6 text-xs font-semibold">Members ({members.length})</h3>
      <ul className="mt-2 divide-y text-sm">{members.map((m) => { const self = m.sub === viewer?.id; const label = m.email ?? "Workspace member"; return <li key={m.sub} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0 break-all">{label}{self && <span className="text-muted-foreground"> (you)</span>}</span>{!self && <Button variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={() => remove("member", m.sub, label)}><X /></Button>}</li>; })}</ul>
      <h3 className="mt-6 text-xs font-semibold">Waiting to sign in ({invites.length})</h3>
      {invites.length === 0 ? <p className="mt-2 text-xs text-muted-foreground">No pending invitations.</p> : <ul className="mt-2 divide-y text-sm">{invites.map((i) => <li key={i.email} className="flex items-center justify-between gap-2 py-2"><span className="min-w-0 break-all">{i.email}</span><Button variant="ghost" size="icon" aria-label={`Cancel invitation for ${i.email}`} onClick={() => remove("invite", i.email, i.email)}><X /></Button></li>)}</ul>}
      <p className="mt-6 text-[11px] text-muted-foreground">No email is sent. Share the app link with your colleague yourself.</p>
    </SheetContent></Sheet>
  </>;
}
