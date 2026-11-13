import type { RoleView } from "./shortages";

export const WIDGETS = [
  { id: "critical", label: "Production bottlenecks" },
  { id: "commercial", label: "Commercial exposure" },
  { id: "suppliers", label: "Supplier delivery drift" },
  { id: "actions", label: "Action queue" },
  { id: "freight", label: "Freight mix" },
  { id: "customers", label: "Customer commitments" },
  { id: "improvement", label: "Continuous improvement" },
] as const;
export type WidgetId = typeof WIDGETS[number]["id"];
export type DashboardPreferences = { order: WidgetId[]; hidden: WidgetId[]; density: "compact" | "expanded"; scope: "open" | "all" | "mine" };
export function defaultDashboard(role: RoleView): DashboardPreferences {
  const first: WidgetId[] = role === "om" ? ["customers", "commercial", "critical"] : role === "buyer" ? ["suppliers", "actions", "freight"] : ["critical", "commercial", "actions"];
  return { order: [...first, ...WIDGETS.map((w) => w.id).filter((id) => !first.includes(id))], hidden: [], density: "expanded", scope: "open" };
}
export function readDashboard(raw: unknown, role: RoleView): DashboardPreferences {
  const fallback = defaultDashboard(role);
  if (!raw || typeof raw !== "object") return fallback;
  const p = raw as Record<string, unknown>;
  const valid = (value: unknown): value is WidgetId => WIDGETS.some((w) => w.id === value);
  const order = Array.isArray(p['order']) ? [...new Set(p['order'].filter(valid))] : [];
  return { order: [...order, ...fallback.order.filter((id) => !order.includes(id))],
    hidden: Array.isArray(p['hidden']) ? [...new Set(p['hidden'].filter(valid))] : [],
    density: p['density'] === "compact" ? "compact" : "expanded",
    scope: p['scope'] === "all" || p['scope'] === "mine" ? p['scope'] : "open" };
}