import { useState } from "react";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const SECTIONS = [
  ["Identity & access", "The workspace identity is checked first, followed by a Google account session. Signed-in members use the shared board; anonymous visitors keep a private browser copy. Database policies restrict shared-board reads to members."],
  ["Board persistence", "One JSON row per part, realtime updates and an append-only activity feed. Only changed part rows are sent. This limits overwrites but is not a transaction-based conflict-resolution system."],
  ["Groq AI safeguards", "Groq calls run in server functions with a stored secret. Fixed system prompts separate instructions from input data. Extracted changes are validated and require planner confirmation. Risk explanations are advisory."],
  ["Consistent order decisions", "Commercial calculations are centralized. Customer terms and confirmed order changes update every pegging occurrence together. Expedite comparisons are read-only and preserve other order blockers."],
  ["Runtime & data exchange", "React 19 and TanStack Start run with a Cloudflare Worker-compatible server boundary. CSV and Excel validation runs client-side before confirmed imports. Enterprise connector cards do not imply active SAP or carrier integrations."],
  ["Accessibility & verification", "Keyboard controls, labelled forms, 44px primary targets and bounded board scrolling are built in. Earlier automated checks measured WCAG AA contrast and reported zero axe violations; full manual screen-reader certification remains outstanding."],
];
export function ArchitectureDrawer() {
  const [open, setOpen] = useState(false);
  return <><Button variant="outline" onClick={() => setOpen(true)}><Code2 aria-hidden className="size-4" />Under the hood</Button>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="overflow-y-auto sm:max-w-xl"><SheetHeader><SheetTitle>Under the hood</SheetTitle><SheetDescription>Apex Escalation Hub architecture and boundaries</SheetDescription></SheetHeader><div className="mt-6 space-y-5">{SECTIONS.map(([title, text]) => <section key={title} className="border-t pt-4"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p></section>)}</div></SheetContent></Sheet></>;
}