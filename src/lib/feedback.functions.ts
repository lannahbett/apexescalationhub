import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable(),
  role: z.string().trim().max(80).nullable(),
  message: z.string().trim().min(3, "Please write a few words").max(2000),
  email: z.union([z.string().trim().email().max(255), z.literal("")]).nullable(),
});

export const sendFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => feedbackSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const db = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error } = await db.from("site_feedback").insert({
      rating: data.rating,
      role: data.role || null,
      message: data.message,
      email: data.email || null,
    });
    if (error) throw new Error("Could not save feedback");
    return { ok: true };
  });
