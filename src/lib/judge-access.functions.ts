import { createServerFn } from "@tanstack/react-start";

export const JUDGE_EMAIL = "judge@apex-evaluator.app";

/** One-click evaluator access: returns a one-time sign-in token for a shared account that only gets a private browser board. */
export const startJudgeSession = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const opts = { type: "magiclink" as const, email: JUDGE_EMAIL };
  let link = await supabaseAdmin.auth.admin.generateLink(opts);
  if (link.error) {
    await supabaseAdmin.auth.admin.createUser({ email: JUDGE_EMAIL, email_confirm: true, user_metadata: { full_name: "Hackathon judge" } });
    link = await supabaseAdmin.auth.admin.generateLink(opts);
  }
  const token = link.data?.properties?.hashed_token;
  if (link.error || !token) throw new Error("Judge access is unavailable right now.");
  return { token };
});
