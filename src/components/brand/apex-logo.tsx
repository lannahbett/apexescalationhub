import { cn } from "@/lib/utils";

/** Apex mark: a rising delta (the apex) cut by an escalation signal pulse. */
export function ApexMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" role="img" aria-label="Apex Escalation Hub logo" className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" className="fill-sidebar-primary" />
      <path d="M16 6 L26 25 H21.5 L16 14.5 L10.5 25 H6 Z" className="fill-sidebar-primary-foreground" />
      <path d="M7 20.5 H12 L14 17.5 L16.5 22.5 L18.5 19 H25" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="stroke-sidebar-primary" />
      <circle cx="16" cy="6" r="1.6" className="fill-critical" />
    </svg>
  );
}

export function ApexLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <ApexMark />
      {!compact && (
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-bold tracking-tight">APEX</div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-sidebar-foreground/80">Escalation Hub</div>
        </div>
      )}
    </div>
  );
}
