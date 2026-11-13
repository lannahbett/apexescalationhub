import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, ChartNoAxesCombined, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dashboardAnalysis,
  eur,
  expediteComparison,
  type CommercialMode,
  type Part,
} from "@/lib/shortages";

const money = (n: number) => (Math.abs(n) >= 1000 ? `€${(n / 1000).toFixed(0)}k` : `€${n}`);
const axis = { fill: "var(--muted-foreground)", fontSize: 11 };
const names: Record<string, string> = {
  penalty: "Projected penalty",
  count: "Parts",
  atRisk: "Orders at date risk",
  planned: "Planned days",
  actual: "Actual days",
  netSaving: "Net benefit",
  penaltySaving: "Penalty avoided",
};
function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: {
    name?: string;
    value?: number;
    payload?: { name?: string; label?: string; days?: number };
  }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="max-w-64 rounded-md border bg-popover p-3 text-xs text-popover-foreground shadow-sm">
      <strong>
        {payload[0]?.payload?.name ?? payload[0]?.payload?.label ?? `${label} days saved`}
      </strong>
      {payload.map((p) => (
        <div key={p.name} className="mt-1">
          {names[p.name ?? ""] ?? p.name}:{" "}
          {p.name === "penalty" || p.name === "netSaving" || p.name === "penaltySaving"
            ? eur(Number(p.value))
            : Number(p.value).toFixed(1).replace(/\.0$/, "")}
        </div>
      ))}
    </div>
  );
}
function Figure({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <article className="min-w-0 rounded-md border bg-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 mt-1 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </article>
  );
}
export function VisualAnalytics({
  data,
  mode,
  parts,
  onFocus,
}: {
  data: ReturnType<typeof dashboardAnalysis>;
  mode: CommercialMode;
  parts: Part[];
  onFocus: (ids: string[], label: string) => void;
}) {
  const [ready, setReady] = useState(false);
  const [table, setTable] = useState(false);
  const [partId, setPartId] = useState("");
  const [cost, setCost] = useState(1800);
  const [days, setDays] = useState(2);
  useEffect(() => setReady(true), []);
  const open = data.scoped.filter((p) => p.stage !== "delivered");
  const selected = open.find((p) => p.id === partId) ?? data.critical[0] ?? open[0];
  // Use the entire board for scenarios: filters must not hide other blockers of the same order.
  const scenario = useMemo(
    () =>
      Array.from({ length: 15 }, (_, day) => ({
        days: day,
        ...expediteComparison(parts, selected?.id ?? "", day, cost, 0, mode),
      })),
    [parts, selected?.id, cost, mode],
  );
  const result = selected ? expediteComparison(parts, selected.id, days, cost, 0, mode) : null;
  const customers = [...data.customers].sort((a, b) =>
    mode === "tiers" ? b.atRisk - a.atRisk : b.penalty - a.penalty,
  );
  const suppliers = data.suppliers.filter((s) => s.planned !== null && s.actual !== null);
  const focus = (rows: Part[], label: string) =>
    onFocus(
      rows.map((p) => p.id),
      label,
    );
  const reviewCustomer = (name: string) =>
    focus(
      open.filter((p) => p.orders?.some((o) => o.customer === name && o.status !== "cancelled")),
      name,
    );
  const reviewSupplier = (name: string) =>
    focus(
      open.filter((p) => p.supplier === name),
      name,
    );
  const empty = (
    <div className="grid h-64 place-items-center text-sm text-muted-foreground">
      No matching data.
    </div>
  );
  const plot = (rows: unknown[], children: React.ReactElement) =>
    rows.length && ready ? (
      <div className="h-64 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    ) : (
      empty
    );
  return (
    <section id="analytics" tabIndex={-1} aria-label="Visual analytics" className="space-y-3 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <ChartNoAxesCombined className="size-5 text-info" />
          Operational analytics
        </h2>
        <div role="group" aria-label="Analytics display">
          <Button
            variant={table ? "ghost" : "secondary"}
            size="sm"
            aria-pressed={!table}
            onClick={() => setTable(false)}
          >
            <ChartNoAxesCombined /> Charts
          </Button>
          <Button
            variant={table ? "secondary" : "ghost"}
            size="sm"
            aria-pressed={table}
            onClick={() => setTable(true)}
          >
            <Table2 /> Data
          </Button>
        </div>
      </div>
      <div className="grid min-w-0 gap-3 xl:grid-cols-2">
        <Figure
          title={mode === "tiers" ? "Customer delivery risk" : "Projected penalties by customer"}
          subtitle={
            mode === "tiers"
              ? "Unique active orders with projected date risk"
              : "Forecast only · each sales order counted once at its worst open-part delay"
          }
        >
          {table ? (
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th className="py-2">Customer</th>
                    <th className="text-right">
                      {mode === "tiers" ? "At-risk orders" : "Projected penalty"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.name} className="border-t">
                      <td>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto min-h-11 max-w-full whitespace-normal px-0 text-left"
                          onClick={() => reviewCustomer(c.name)}
                        >
                          {c.name}
                        </Button>
                      </td>
                      <td className="text-right font-mono">
                        {mode === "tiers" ? c.atRisk : eur(c.penalty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!customers.length && empty}
            </div>
          ) : (
            plot(
              customers,
              <BarChart
                data={customers}
                layout="vertical"
                margin={{ left: 0, right: 20 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={axis}
                  tickFormatter={mode === "tiers" ? (n: number) => String(n) : money}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={108}
                  tick={axis}
                  tickFormatter={(v: string) => (v.length > 17 ? `${v.slice(0, 16)}…` : v)}
                />
                <Tooltip content={<Tip />} cursor={{ fill: "var(--muted)" }} />
                <Bar
                  isAnimationActive={false}
                  dataKey={mode === "tiers" ? "atRisk" : "penalty"}
                  fill="var(--critical)"
                  radius={[0, 3, 3, 0]}
                  onClick={(row) => reviewCustomer(row.name)}
                />
              </BarChart>,
            )
          )}
          <label className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            Review customer
            <select
              aria-label="Review customer in board"
              className="h-11 min-w-0 max-w-full rounded-md border border-input bg-card px-2"
              value=""
              onChange={(e) => {
                if (e.target.value) reviewCustomer(e.target.value);
              }}
            >
              <option value="">Select customer…</option>
              {customers.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
        </Figure>
        <Figure
          title="Supplier lead-time comparison"
          subtitle="Mean planned versus actual days · measured open parts, not a historical trend"
        >
          {table ? (
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Supplier</th>
                    <th>Planned</th>
                    <th>Actual</th>
                    <th>Drift</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.name} className="border-t">
                      <td className="max-w-40 break-words py-3">{s.name}</td>
                      <td>{s.planned?.toFixed(1)}</td>
                      <td>{s.actual?.toFixed(1)}</td>
                      <td>{s.drift?.toFixed(1)}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!suppliers.length && empty}
            </div>
          ) : (
            plot(
              suppliers,
              <BarChart
                data={suppliers}
                layout="vertical"
                margin={{ right: 12 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={axis} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={108}
                  tick={axis}
                  tickFormatter={(v: string) => `${v.slice(0, 16)}${v.length > 16 ? "…" : ""}`}
                />
                <Tooltip content={<Tip />} cursor={{ fill: "var(--muted)" }} />
                <Legend formatter={(v: string) => names[v] ?? v} />
                <Bar
                  isAnimationActive={false}
                  dataKey="planned"
                  fill="var(--info)"
                  onClick={(row) => reviewSupplier(row.name)}
                />
                <Bar
                  isAnimationActive={false}
                  dataKey="actual"
                  fill="var(--elevated)"
                  onClick={(row) => reviewSupplier(row.name)}
                />
              </BarChart>,
            )
          )}
          <label className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            Review supplier
            <select
              aria-label="Review supplier in board"
              className="h-11 min-w-0 max-w-full rounded-md border border-input bg-card px-2"
              value=""
              onChange={(e) => {
                if (e.target.value) reviewSupplier(e.target.value);
              }}
            >
              <option value="">Select supplier…</option>
              {data.suppliers.map((s) => (
                <option key={s.name}>{s.name}</option>
              ))}
            </select>
          </label>
        </Figure>
        <Figure
          title="Workflow bottlenecks"
          subtitle="Current stage distribution · selected analysis scope, not conversion rates"
        >
          {table ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th className="text-right">Parts</th>
                </tr>
              </thead>
              <tbody>
                {data.stages.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td>
                      <Button
                        variant="link"
                        size="sm"
                        className="whitespace-normal px-0"
                        onClick={() =>
                          focus(
                            data.scoped.filter((p) => p.stage === s.id),
                            s.label,
                          )
                        }
                      >
                        {s.label}
                      </Button>
                    </td>
                    <td className="text-right font-mono">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            plot(
              data.scoped,
              <BarChart
                data={data.stages}
                layout="vertical"
                margin={{ right: 20 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={axis} />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={108}
                  tick={axis}
                  tickFormatter={(v: string) =>
                    v
                      .replace("Expedited / In-Transit", "In transit")
                      .replace("Cleared & Delivered", "Delivered")
                      .replace("Sourcing Alternative", "Sourcing")
                      .replace("Shortage Detected", "Detected")
                  }
                />
                <Tooltip content={<Tip />} cursor={{ fill: "var(--muted)" }} />
                <Bar
                  isAnimationActive={false}
                  dataKey="count"
                  fill="var(--chart-2)"
                  radius={[0, 3, 3, 0]}
                  onClick={(row) =>
                    focus(
                      data.scoped.filter((p) => p.stage === row.id),
                      row.label,
                    )
                  }
                />
              </BarChart>,
            )
          )}
          <label className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            Review stage
            <select
              aria-label="Review stage in board"
              className="h-11 min-w-0 max-w-full rounded-md border border-input bg-card px-2"
              value=""
              onChange={(e) => {
                const s = data.stages.find((s) => s.id === e.target.value);
                if (s)
                  focus(
                    data.scoped.filter((p) => p.stage === s.id),
                    s.label,
                  );
              }}
            >
              <option value="">Select stage…</option>
              {data.stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.count})
                </option>
              ))}
            </select>
          </label>
        </Figure>
        <Figure
          title="Expedite benefit scenario"
          subtitle="Whole-board order blockers retained · penalty savings minus extra freight cost · no booking"
        >
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
            <label className="col-span-2">
              Part
              <select
                aria-label="Scenario part"
                className="mt-1 h-11 w-full rounded-md border border-input bg-card px-2"
                value={selected?.id ?? ""}
                onChange={(e) => setPartId(e.target.value)}
              >
                {!open.length && <option value="">No open parts</option>}
                {open.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.partNumber} · {p.supplier}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Extra freight cost (€)
              <input
                aria-label="Scenario freight cost"
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                className="mt-1 h-11 w-full rounded-md border border-input bg-card px-2"
              />
            </label>
            <label>
              Days saved
              <input
                aria-label="Scenario days saved"
                type="number"
                min="0"
                max="14"
                step="1"
                value={days}
                onChange={(e) =>
                  setDays(Math.min(14, Math.max(0, Math.round(Number(e.target.value)))))
                }
                className="mt-1 h-11 w-full rounded-md border border-input bg-card px-2"
              />
            </label>
          </div>
          {mode === "tiers" && (
            <p className="mb-2 text-xs text-muted-foreground">
              Penalties are disabled in priority-only mode; this comparison includes freight cost
              only.
            </p>
          )}
          {table ? (
            <div className="max-h-64 overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th>Days saved</th>
                    <th>Penalty avoided</th>
                    <th>Net benefit</th>
                  </tr>
                </thead>
                <tbody>
                  {selected &&
                    scenario.map((r) => (
                      <tr key={r.days} className="border-t">
                        <td className="py-2">{r.days}</td>
                        <td>{eur(r.penaltySaving ?? 0)}</td>
                        <td>{eur(r.netSaving ?? 0)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!selected && empty}
            </div>
          ) : (
            plot(
              selected ? scenario : [],
              <LineChart data={scenario} margin={{ right: 12, left: 0 }} accessibilityLayer>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="days" tick={axis} />
                <YAxis tick={axis} width={58} tickFormatter={money} />
                <Tooltip content={<Tip />} />
                <ReferenceLine y={0} stroke="var(--muted-foreground)" />
                <ReferenceLine x={days} stroke="var(--info)" strokeDasharray="3 3" />
                <Line
                  type="linear"
                  dataKey="netSaving"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>,
            )
          )}
          <div
            role="status"
            className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs"
          >
            <span>
              Net benefit at {days}d{" "}
              <strong
                className={
                  result && result.netSaving >= 0
                    ? "font-mono text-success"
                    : "font-mono text-critical"
                }
              >
                {result ? eur(result.netSaving) : "-"}
              </strong>
            </span>
            <Button
              variant="link"
              size="sm"
              className="px-0"
              disabled={!selected}
              onClick={() => {
                if (selected) focus([selected], "Expedite scenario part");
              }}
            >
              Review part <ArrowUpRight />
            </Button>
          </div>
        </Figure>
      </div>
    </section>
  );
}
