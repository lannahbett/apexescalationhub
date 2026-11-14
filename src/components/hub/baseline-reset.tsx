import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { useHub } from "./store";

export function BaselineReset({ onReset }: { onReset: () => void }) {
  const { reset, viewer, sync } = useHub();
  const [open, setOpen] = useState(false);
  // A portfolio reset must never overwrite a team's shared board.
  if (viewer || sync !== "local") return null;
  return <><Button variant="outline" onClick={() => setOpen(true)}><RotateCcw aria-hidden className="size-4" />Reset Plant Baseline</Button><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Restore the plant baseline?</DialogTitle><DialogDescription>Replace this browser's board with 14 sample parts. Notes, sourcing requests, imports and recovery records on this private board will be removed. No team board is changed.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { reset(); onReset(); setOpen(false); }}>Restore 14 sample parts</Button></DialogFooter></DialogContent></Dialog></>;
}