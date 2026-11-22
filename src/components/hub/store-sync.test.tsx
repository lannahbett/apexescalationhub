import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HubProvider, useHub } from "./store";
import { buildSeed, type Part } from "@/lib/shortages";

const state = vi.hoisted(() => ({
  load: Promise.resolve({ data: [] as { id: string; data: Part }[], error: null as null | { message: string } }),
  callbacks: [] as ((payload: { eventType: string; new: { data: Part }; old: { id: string } }) => void)[],
  writes: vi.fn(async (_rows: unknown) => ({ error: null })),
  member: [{ sub: "test-viewer" }] as { sub: string }[],
}));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => vi.fn() }));
vi.mock("@tanstack/react-query", async (original) => ({ ...await original<typeof import("@tanstack/react-query")>(), useQuery: () => ({ isPending: false, data: { door: "lovable", id: "test-viewer", name: "Tester" } }) }));
vi.mock("@/lib/viewer.functions", () => ({ getViewer: vi.fn() }));
vi.mock("@/lib/session", () => ({ $getIdentityToken: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) } } }));
vi.mock("@/lib/cloud-board", async (original) => ({ ...await original<typeof import("@/lib/cloud-board")>(), boardClient: () => {
  const channel = {
    on: (_event: string, filter: { table: string }, callback: typeof state.callbacks[number]) => { if (filter.table === "board_parts") state.callbacks.push(callback); return channel; },
    subscribe: () => channel,
  };
  return {
    from: (table: string) => {
      const query = { select: () => query, order: () => query, limit: () => query,
        then: (resolve: (value: unknown) => void, reject: (error: unknown) => void) => (table === "board_parts" ? state.load : table === "board_members" ? Promise.resolve({ data: state.member, error: null }) : Promise.resolve({ data: [], error: null })).then(resolve, reject),
        upsert: state.writes, delete: () => ({ in: state.writes }), insert: state.writes,
      };
      return query;
    },
    channel: () => channel, removeChannel: vi.fn(),
  };
} }));

function Probe() {
  const hub = useHub();
  return <><output data-testid="sync">{hub.sync}</output><output data-testid="parts">{JSON.stringify(hub.parts)}</output>
    <button onClick={() => { const part = hub.parts[0]; if (part) hub.update(part.id, { description: "Planner edit" }); }}>Edit</button>
    <button onClick={() => void hub.loadSampleIntoCloud()}>Load samples</button></>;
}
function mount() { render(<QueryClientProvider client={new QueryClient()}><HubProvider><Probe /></HubProvider></QueryClientProvider>); }
function sample() { const part = buildSeed()[0]; if (!part) throw new Error("Missing fixture"); return part; }
async function incoming(callback = state.callbacks[0]) {
  if (!callback) throw new Error("No realtime subscription");
  await act(async () => callback({ eventType: "UPDATE", new: { data: { ...sample(), description: "Colleague edit" } }, old: { id: sample().id } }));
}
afterEach(() => { cleanup(); localStorage.clear(); state.callbacks = []; state.writes.mockClear(); state.member = [{ sub: "test-viewer" }]; });

describe("shared board initial-load protection", () => {
  it.each([false, true])("does not upload fallback data after failed load and realtime update (browser copy: %s)", async (browserCopy) => {
    if (browserCopy) localStorage.setItem("apex-hub-v1", JSON.stringify(buildSeed().slice(0, 2).map((part) => ({ ...part, description: "Private browser edit" }))));
    state.load = Promise.resolve({ data: [], error: { message: "Load failed" } });
    mount(); await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("error"));
    const before = screen.getByTestId("parts").textContent;
    await incoming();
    expect(state.writes).not.toHaveBeenCalled();
    expect(screen.getByTestId("sync")).toHaveTextContent("error");
    expect(screen.getByTestId("parts").textContent).toBe(before);
    await act(async () => screen.getByRole("button", { name: "Load samples" }).click());
    expect(state.writes).not.toHaveBeenCalled();
  });
  it("ignores realtime events while the full initial snapshot is pending", async () => {
    let finish: ((value: Awaited<typeof state.load>) => void) | undefined;
    state.load = new Promise((resolve) => { finish = resolve; });
    mount(); await incoming();
    expect(screen.getByTestId("sync")).toHaveTextContent("connecting");
    expect(state.writes).not.toHaveBeenCalled();
    const resolve = finish; if (!resolve) throw new Error("Missing load resolver");
    await act(async () => resolve({ data: [{ id: "team-only", data: { ...sample(), id: "team-only" } }], error: null }));
    await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("live"));
    expect(state.writes).not.toHaveBeenCalled();
  });
  it("still accepts realtime updates and saves only planner changes after a successful load", async () => {
    state.load = Promise.resolve({ data: [{ id: sample().id, data: sample() }], error: null });
    mount(); await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("live"));
    const callback = state.callbacks[0];
    await incoming(); expect(state.writes).not.toHaveBeenCalled();
    await act(async () => screen.getByRole("button", { name: "Edit" }).click());
    await waitFor(() => expect(state.writes).toHaveBeenCalledTimes(1));
    expect(state.writes.mock.calls[0]?.[0]).toEqual([expect.objectContaining({ id: sample().id, data: expect.objectContaining({ description: "Planner edit" }) })]);
    cleanup(); state.writes.mockClear(); await incoming(callback);
    expect(state.writes).not.toHaveBeenCalled();
  });
  it("gives a signed-in non-member a private working board without writing team data", async () => {
    state.member = [];
    state.load = Promise.resolve({ data: [], error: null });
    mount(); await waitFor(() => expect(screen.getByTestId("sync")).toHaveTextContent("local"));
    expect(JSON.parse(screen.getByTestId("parts").textContent ?? "[]").length).toBeGreaterThan(0);
    await act(async () => screen.getByRole("button", { name: "Edit" }).click());
    expect(state.writes).not.toHaveBeenCalled();
  });
});
