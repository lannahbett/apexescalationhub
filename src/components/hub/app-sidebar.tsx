import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Table2,
  Users,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  Sparkles,
  ChartNoAxesCombined,
  Compass,
  Plug,
  Truck,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ApexLogo } from "@/components/brand/apex-logo";
import { initials } from "@/lib/shortages";
import { useHub } from "./store";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "dashboard", label: "Today’s priorities", icon: LayoutDashboard },
  { id: "analytics", label: "Visual analytics", icon: ChartNoAxesCombined },
  { id: "board", label: "Shortage board", icon: Table2 },
  { id: "tools", label: "AI & data tools", icon: Sparkles },
  { id: "shipping", label: "Shipping & customs", icon: Truck },
  { id: "connectors", label: "Connectors", icon: Plug },
  { id: "perspective", label: "Role perspective", icon: Users },
] as const;

function go(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "start",
  });
  el.focus({ preventScroll: true });
}

function NavList({ collapsed, onPick }: { collapsed: boolean; onPick?: () => void }) {
  const [active, setActive] = useState<string>("dashboard");
  return (
    <ul className="space-y-1">
      {NAV.map(({ id, label, icon: Icon }) => (
        <li key={id}>
          <Button
            variant="ghost"
            type="button"
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            aria-current={active === id ? "location" : undefined}
            onClick={() => {
              setActive(id);
              onPick?.();
              requestAnimationFrame(() => go(id));
            }}
            className={cn(
              "flex min-h-11 w-full justify-start items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:outline-sidebar-ring",
              active === id && "bg-sidebar-accent text-sidebar-accent-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon aria-hidden className="size-4 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Button>
        </li>
      ))}
      <li className="mt-4 border-t border-sidebar-border pt-4">
        <Button
          asChild
          variant="ghost"
          title={collapsed ? "Business vision" : undefined}
          className={cn(
            "min-h-11 w-full justify-start gap-3 px-3 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          <Link
            to="/"
            onClick={onPick}
            aria-label={collapsed ? "Business vision" : undefined}
          >
            <Compass aria-hidden className="size-4 shrink-0" />
            {!collapsed && <span>Business vision</span>}
          </Link>
        </Button>
      </li>
    </ul>
  );
}

function UserBadge({ collapsed }: { collapsed: boolean }) {
  const { actor } = useHub();
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-t border-sidebar-border pt-3",
        collapsed && "justify-center",
      )}
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-sidebar-accent text-[11px] font-semibold"
      >
        {initials(actor)}
      </span>
      {!collapsed && <span className="truncate text-xs">{actor}</span>}
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem("apex-sidebar") === "collapsed");
  }, []);
  const toggle = () =>
    setCollapsed((c) => {
      localStorage.setItem("apex-sidebar", c ? "open" : "collapsed");
      return !c;
    });
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col gap-4 bg-sidebar p-3 text-sidebar-foreground md:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
        <ApexLogo compact={collapsed} />
      </div>
      <nav aria-label="Main navigation" className="flex-1">
        <NavList collapsed={collapsed} />
      </nav>
      <Button
        variant="ghost"
        onClick={toggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        className="min-h-11 justify-center text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        {collapsed ? (
          <ChevronsRight />
        ) : (
          <>
            <ChevronsLeft /> Collapse
          </>
        )}
      </Button>
      <UserBadge collapsed={collapsed} />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-11 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground md:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <Menu />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4 text-sidebar-foreground">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="mb-6">
            <ApexLogo />
          </div>
          <nav aria-label="Main navigation">
            <NavList collapsed={false} onPick={() => setOpen(false)} />
          </nav>
          <div className="mt-6">
            <UserBadge collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
