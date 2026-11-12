import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ApexLogo } from "@/components/brand/apex-logo";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-sidebar text-sidebar-foreground">
        <nav aria-label="Legal page navigation" className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Link to="/" aria-label="Apex Escalation Hub home"><ApexLogo /></Link>
          <Link to="/demo" className="text-sm underline underline-offset-4">View the demo</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-10 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="text-sm">Last updated: {updated}</p>
        {children}
      </main>
      <footer className="mx-auto flex max-w-3xl flex-wrap gap-4 px-5 py-6 text-xs text-muted-foreground">
        <span>© 2026 Apex Escalation Hub. All rights reserved.</span>
        <Link to="/terms" className="underline">Terms of use</Link>
        <Link to="/privacy" className="underline">Privacy notice</Link>
      </footer>
    </div>
  );
}
