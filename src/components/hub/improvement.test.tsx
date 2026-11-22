import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Improvement } from "./improvement";
import { buildSeed } from "@/lib/shortages";

const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("./store", () => ({ useHub: () => ({ parts: [{ ...buildSeed({ improvementExamples: false })[0], id: "existing-team-part" }], update: state.update }) }));
vi.mock("recharts", () => ({ ResponsiveContainer: () => null, ComposedChart: () => null, Bar: () => null, Line: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("prefills a board without recoveries with read-only fictional examples", () => {
  const focus = vi.fn();
  render(<Improvement onFocus={focus} />);
  expect(screen.getByText("€5,700")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "View fictional examples" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "In progress" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Supplier machine / tooling breakdown" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Root-cause Pareto" }));
  expect(screen.getByRole("button", { name: "Root-cause Pareto" })).toHaveAttribute("aria-expanded", "false");
  expect(state.update).not.toHaveBeenCalled();
  expect(focus).not.toHaveBeenCalled();
});