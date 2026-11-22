export const CI_SECTIONS = [
  { id: "kpis", label: "Summary numbers" },
  { id: "pareto", label: "Root-cause Pareto" },
  { id: "repeats", label: "Repeat escalations" },
  { id: "register", label: "Preventive-action register" },
] as const;
export type CiSectionId = typeof CI_SECTIONS[number]["id"];
export type CiLayout = { order: CiSectionId[]; hidden: CiSectionId[]; collapsed: CiSectionId[]; compact: boolean };
export const defaultCiLayout = (): CiLayout => ({ order: CI_SECTIONS.map((s) => s.id), hidden: [], collapsed: [], compact: true });
const valid = (v: unknown): v is CiSectionId => CI_SECTIONS.some((s) => s.id === v);
const list = (v: unknown) => (Array.isArray(v) ? [...new Set(v.filter(valid))] : []);
/** Validates a stored layout; unknown ids are dropped and missing sections are appended. */
export function readCiLayout(raw: unknown): CiLayout {
  if (!raw || typeof raw !== "object") return defaultCiLayout();
  const p = raw as Record<string, unknown>;
  const order = list(p["order"]);
  return { order: [...order, ...defaultCiLayout().order.filter((id) => !order.includes(id))], hidden: list(p["hidden"]), collapsed: list(p["collapsed"]), compact: p["compact"] !== false };
}
export function moveCiSection(layout: CiLayout, id: CiSectionId, delta: -1 | 1): CiLayout {
  const order = [...layout.order]; const i = order.indexOf(id); const other = order[i + delta];
  if (i < 0 || !other) return layout;
  order[i] = other; order[i + delta] = id; return { ...layout, order };
}
export function toggleIn(list: CiSectionId[], id: CiSectionId) { return list.includes(id) ? list.filter((x) => x !== id) : [...list, id]; }
