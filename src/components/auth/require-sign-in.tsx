import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getViewer } from "@/lib/viewer.functions";

/** Blocks the workspace until a signed-in viewer resolves; otherwise sends visitors to /auth. */
export function RequireSignIn({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const fetchViewer = useServerFn(getViewer);
  const viewer = useQuery({ queryKey: ["viewer"], queryFn: () => fetchViewer(), retry: false });
  const signedOut = !viewer.isPending && !viewer.data;
  useEffect(() => { if (signedOut) navigate({ to: "/auth", replace: true }); }, [signedOut, navigate]);
  if (!viewer.data) {
    return <main className="grid min-h-dvh place-items-center bg-background"><p role="status" className="text-sm text-muted-foreground">{signedOut ? "Redirecting to sign in…" : "Checking your sign-in…"}</p></main>;
  }
  return <>{children}</>;
}
