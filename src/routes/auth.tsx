import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { ApexLogo } from "@/components/brand/apex-logo";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { getViewer } from "@/lib/viewer.functions";

export const Route = createFileRoute("/auth")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Sign in | Apex Escalation Hub" },
      { name: "description", content: "Sign in to work on your team's shared, live shortage board." },
      { property: "og:title", content: "Sign in | Apex Escalation Hub" },
      { property: "og:description", content: "Join your team's shared, live shortage board." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const GoogleG = () => (
  <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
);

function AuthPage() {
  const navigate = useNavigate();
  const fetchViewer = useServerFn(getViewer);
  const viewer = useQuery({ queryKey: ["viewer"], queryFn: () => fetchViewer(), retry: false });
  const [error, setError] = useState("");
  useEffect(() => { if (viewer.data) navigate({ to: "/demo", replace: true }); }, [viewer.data, navigate]);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "SIGNED_IN") viewer.refetch(); });
    return () => data.subscription.unsubscribe();
  }, []);
  const google = async () => {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/auth` });
    if (result.error) setError("Google sign-in did not complete. Please try again.");
  };
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <div className="w-full max-w-sm space-y-5 rounded-lg border bg-card p-6">
        <ApexLogo />
        <div>
          <h1 className="text-lg font-semibold">Sign in to Apex Escalation Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Teammates in your Lovable workspace are recognised automatically. Everyone else can sign in with Google.</p>
        </div>
        {viewer.isPending && <p role="status" className="text-sm text-muted-foreground">Checking whether you are already signed in…</p>}
        {!viewer.data && (
          <Button type="button" variant="outline" onClick={google} className="min-h-11 w-full gap-[10px] border-google-border bg-google-background px-3 text-sm font-medium text-google-foreground hover:bg-google-background hover:text-google-foreground [&_svg]:size-[18px]">
            <GoogleG /> Continue with Google
          </Button>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">Signing in is required to use Apex. By continuing you accept the <Link to="/terms" className="underline">Terms of Use</Link> and <Link to="/privacy" className="underline">Privacy Notice</Link>.</p>
      </div>
    </main>
  );
}
