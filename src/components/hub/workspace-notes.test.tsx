import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { WorkspaceNotes, useWorkNotes } from "./workspace-notes";

const state = vi.hoisted(() => ({ viewer: null as null | { door: string; id: string }, sync: "local" }));
vi.mock("./store", () => ({ useHub: () => state }));
function Probe() { const notes = useWorkNotes(); return <><output data-testid="notes">{JSON.stringify(notes.notes)}</output><button disabled={!notes.ready} onClick={() => notes.save({ title: "Private SAP review", body: "Check date mapping", category: "sap_review", reference: "SO-104820", pinned: true })}>Save</button></>; }
afterEach(() => { cleanup(); localStorage.clear(); state.viewer = null; state.sync = "local"; });
it("keeps private and teammate notes isolated and does not write the board", async () => {
  const view = render(<WorkspaceNotes><Probe /></WorkspaceNotes>);
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
  await act(async () => screen.getByRole("button").click());
  expect(JSON.parse(localStorage.getItem("apex-notes:private") ?? "[]")).toHaveLength(1);
  expect(localStorage.getItem("apex-hub-v1")).toBeNull();
  state.viewer = { door: "lovable", id: "teammate" }; state.sync = "live";
  view.rerender(<WorkspaceNotes><Probe /></WorkspaceNotes>);
  await waitFor(() => expect(screen.getByTestId("notes")).toHaveTextContent("[]"));
  await act(async () => screen.getByRole("button").click());
  expect(JSON.parse(localStorage.getItem("apex-notes:lovable:teammate") ?? "[]")).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem("apex-notes:private") ?? "[]")).toHaveLength(1);
});
it("blocks note saving while identity is pending", () => { state.sync = "checking"; render(<WorkspaceNotes><Probe /></WorkspaceNotes>); expect(screen.getByRole("button")).toBeDisabled(); expect(localStorage.length).toBe(0); });