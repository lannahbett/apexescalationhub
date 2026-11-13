import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedBoardStatus } from "./shared-board";

const state = vi.hoisted(() => ({ sync: "checking", viewer: null as null | { door: "lovable"; id: string } }));
vi.mock("./store", () => ({ useHub: () => state, viewerQuery: ["viewer"] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signOut: vi.fn() } } }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => <a href={to} {...props}>{children}</a> }));

afterEach(cleanup);
describe("Google sign-in access", () => {
  it.each(["checking", "local", "error"])("keeps sign-in available without a resolved viewer in %s state", (sync) => {
    state.sync = sync;
    state.viewer = null;
    render(<QueryClientProvider client={new QueryClient()}><SharedBoardStatus /></QueryClientProvider>);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/auth");
  });
  it("does not offer another sign-in to a resolved workspace viewer", () => {
    state.sync = "live";
    state.viewer = { door: "lovable", id: "workspace-user" };
    render(<QueryClientProvider client={new QueryClient()}><SharedBoardStatus /></QueryClientProvider>);
    expect(screen.queryByRole("link")).toBeNull();
  });
});