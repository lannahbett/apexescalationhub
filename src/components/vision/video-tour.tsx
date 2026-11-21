import { useState } from "react";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import video from "@/assets/apex-platform-tour.mp4.asset.json";
import poster from "@/assets/platform-tour-poster.jpg";
import { Button } from "@/components/ui/button";

export function VideoTour() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost"
        type="button"
        onClick={() => setOpen(true)}
        className="group flex h-auto min-h-11 w-full max-w-sm justify-start whitespace-normal items-center gap-4 rounded-lg border border-vision-foreground/20 bg-vision-scrim p-2 pr-4 text-left text-vision-foreground transition hover:bg-vision-scrim hover:text-vision-foreground hover:border-vision-foreground/50 focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Watch the one-minute platform tour"
      >
        <span className="relative block h-16 w-28 shrink-0 overflow-hidden rounded-md">
          <img src={poster} alt="" className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute inset-0 grid place-items-center bg-vision-base/40">
            <span className="grid size-8 place-items-center rounded-full bg-vision-foreground text-primary">
              <Play className="size-4 fill-current" />
            </span>
          </span>
        </span>
        <span>
          <span className="block text-sm font-semibold">Watch the 1 minute tour</span>
          <span className="block text-xs text-vision-muted">Explore shortage-to-recovery workflows</span>
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-2 sm:p-3">
          <DialogTitle className="sr-only">Apex Escalation Hub platform tour</DialogTitle>
          <DialogDescription className="sr-only">One-minute video showing the problem and the main features.</DialogDescription>
          {open && (
            <video src={video.url} poster={poster} controls autoPlay playsInline className="aspect-video w-full rounded-md bg-vision-base" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
