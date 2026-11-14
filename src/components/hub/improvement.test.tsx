import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Improvement } from "./improvement";
import { buildSeed } from "@/lib/shortages";

const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("./store", () => ({ useHub: () => ({ parts: [{ ...buildSeed({ improvementExamples: false })[0], id: "existing-team-part" }], update: state.update }) }));
vi.mock("recharts", () => ({ ResponsiveContainer: () => null, ComposedChart: () => null, Bar: () => null, Line: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("previews three fictional recoveries without exposing edits or targeting existing team parts", () => {
  const focus = vi.fn();
  render(<Improvement onFocus={focus} />);
  fireEvent.click(screen.getByRole("button", { name: "View fictional examples" }));
  expect(screen.getByText("€5,700")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "In progress" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Supplier machine / tooling breakdown" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Return to board history" }));
  expect(screen.queryByText("€5,700")).not.toBeInTheDocument();
  expect(state.update).not.toHaveBeenCalled();
  expect(focus).not.toHaveBeenCalled();
});