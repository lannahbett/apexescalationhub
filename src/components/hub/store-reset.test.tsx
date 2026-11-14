import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HubProvider, useHub } from "./store";
import { buildSeed } from "@/lib/shortages";

const state = vi.hoisted(() => ({ pending: false, viewer: null as null | { door: "lovable"; id: string; name: string }, writes: vi.fn() }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => vi.fn() }));
vi.mock("@tanstack/react-query", async (original) => ({ ...await original<typeof import("@tanstack/react-query")>(), useQuery: () => ({ isPending: state.pending, data: state.viewer }) }));
vi.mock("@/lib/viewer.functions", () => ({ getViewer: vi.fn() }));
vi.mock("@/lib/session", () => ({ $getIdentityToken: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) } } }));
vi.mock("@/lib/cloud-board", async (original) => ({ ...await original<typeof import("@/lib/cloud-board")>(), boardClient: () => {
  const query = { select: () => query, order: () => query, limit: () => query, then: (resolve: (value: unknown) => void) => Promise.resolve({ data: [{ id: "team-only", data: { ...buildSeed()[0], id: "team-only", description: "Team custom part" } }], error: null }).then(resolve), upsert: state.writes, delete: state.writes };
  const channel = { on: () => channel, subscribe: () => channel };
  return { from: () => query, channel: () => channel, removeChannel: vi.fn() };
} }));

function Probe() {
  const hub = useHub();
  return <><output data-testid="board">{JSON.stringify(hub.parts)}</output><output data-testid="sync">{hub.sync}</output><button onClick={hub.reset}>Invoke reset directly</button></>;
}
function mount() { return render(<QueryClientProvider client={new QueryClient()}><HubProvider><Probe /></HubProvider></QueryClientProvider>); }
afterEach(() => { cleanup(); localStorage.clear(); state.viewer = null; state.pending = false; state.writes.mockClear(); });

describe("baseline reset mutation safety", () => {
  it("restores 14 clean parts on a private local board", async () => {
    localStorage.setItem("apex-hub-v1", JSON.stringify([{ ...buildSeed()[0], description: "Private experiment" }]));
    mount(); await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("local"));
    await act(async () => screen.getByRole("button").click());
    const parts = JSON.parse(screen.getByTestId("board").textContent ?? "[]");
    expect(parts).toHaveLength(14); expect(parts[0].description).not.toBe("Private experiment");
  });
  it("cannot erase a live team's custom data even when invoked directly", async () => {
    state.viewer = { door: "lovable", id: "test-viewer", name: "Tester" };
    mount(); await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("live"));
    const before = screen.getByTestId("board").textContent;
    await act(async () => screen.getByRole("button").click());
    expect(screen.getByTestId("board").textContent).toBe(before);
    expect(JSON.parse(before ?? "[]")[0].id).toBe("team-only");
    expect(state.writes).not.toHaveBeenCalled();
  });
  it("blocks reset when a previously private board is checking identity", async () => {
    localStorage.setItem("apex-hub-v1", JSON.stringify([{ ...buildSeed()[0], description: "Keep this part" }]));
    const view = mount(); await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("local"));
    state.pending = true; view.rerender(<QueryClientProvider client={new QueryClient()}><HubProvider><Probe /></HubProvider></QueryClientProvider>);
    const before = screen.getByTestId("board").textContent;
    await act(async () => screen.getByRole("button").click());
    expect(screen.getByTestId("board").textContent).toBe(before);
  });
});