import { createServerFn } from "@tanstack/react-start";

export const getViewer = createServerFn({ method: "POST" }).handler(async () => {
  const { resolveViewer } = await import("./viewer.server");
  return resolveViewer();
});
