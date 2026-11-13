import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { $getIdentityToken } from "@/lib/session";
import type { Part } from "@/lib/shortages";

let identityClient: SupabaseClient | null = null;
let cachedToken: string | null = null;
let tokenExp = 0;

/** Client for teammates recognised by their Lovable workspace identity. */
function getIdentitySupabase(): SupabaseClient {
  if (!identityClient) {
    const url = import.meta.env["VITE_SUPABASE_URL"];
    const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Cloud is not configured");
    identityClient = createClient(url, key, {
      accessToken: async () => {
        const now = Math.floor(Date.now() / 1000);
        if (!cachedToken || now >= tokenExp - 30) {
          cachedToken = await $getIdentityToken();
          try { tokenExp = cachedToken ? JSON.parse(atob(cachedToken.split(".")[1] ?? "")).exp ?? 0 : 0; } catch { tokenExp = 0; }
        }
        if (!cachedToken) throw new Error("Not signed in");
        return cachedToken;
      },
    });
  }
  return identityClient;
}

export function boardClient(door: "lovable" | "account"): SupabaseClient {
  return door === "lovable" ? getIdentitySupabase() : (supabase as unknown as SupabaseClient);
}

export type Viewer = { door: "lovable" | "account"; id: string; name: string };
export type Activity = { id: string; at: string; actor_name: string; summary: string };

/** Rows that differ from what the cloud last confirmed; drives minimal upserts and deletes. */
export function diffParts(synced: Map<string, string>, parts: Part[]) {
  const upserts = parts.filter((p) => synced.get(p.id) !== JSON.stringify(p));
  const ids = new Set(parts.map((p) => p.id));
  const deletes = [...synced.keys()].filter((id) => !ids.has(id));
  return { upserts, deletes };
}
