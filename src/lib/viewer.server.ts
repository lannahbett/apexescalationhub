import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionUser } from "./auth.server";

import type { Viewer } from "./cloud-board";
export type { Viewer };

/** One resolver for both sign-in doors. IDs from different doors are never compared. */
export async function resolveViewer(): Promise<Viewer | null> {
  const lovableUser = await getSessionUser();
  if (lovableUser) return { door: "lovable", id: lovableUser.userId, name: lovableUser.displayName || lovableUser.email || "Teammate" };
  const auth = getRequest()?.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient(process.env["SUPABASE_URL"]!, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return null;
  const meta = data.user.user_metadata as Record<string, string | undefined>;
  return { door: "account", id: data.user.id, name: meta["full_name"] || meta["name"] || data.user.email || "Teammate" };
}
