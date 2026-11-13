import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/lib/session", () => ({ $getIdentityToken: async () => null }));
import { diffParts } from "./cloud-board";
import { buildSeed } from "./shortages";

describe("shared board sync diff", () => {
  it("sends only parts that changed and removes deleted ones", () => {
    const parts = buildSeed();
    const synced = new Map(parts.map((p) => [p.id, JSON.stringify(p)]));
    const edited = parts.slice(1).map((p, i) => (i === 0 ? { ...p, daysLate: p.daysLate + 1 } : p));
    const { upserts, deletes } = diffParts(synced, edited);
    expect(upserts.map((p) => p.id)).toEqual([parts[1]!.id]);
    expect(deletes).toEqual([parts[0]!.id]);
  });
  it("sends nothing when the board matches the cloud", () => {
    const parts = buildSeed();
    expect(diffParts(new Map(parts.map((p) => [p.id, JSON.stringify(p)])), parts)).toEqual({ upserts: [], deletes: [] });
  });
});
