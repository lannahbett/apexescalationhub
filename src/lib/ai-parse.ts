import { CONFIDENCE, STAGES, type Confidence, type Part, type Stage } from "./shortages";

/** One change the AI proposes; never applied until a planner confirms it. */
export interface ProposedChange {
  partId: string;
  partNumber: string;
  field: "stage" | "confidence" | "daysLate";
  from: string | number;
  to: string | number;
  evidence: string;
}

/** Validates raw model JSON against the board; drops anything unknown, invalid or unchanged. */
export function sanitizeExtraction(raw: unknown, parts: Part[]): ProposedChange[] {
  const items = Array.isArray((raw as { updates?: unknown })?.updates) ? (raw as { updates: unknown[] }).updates : [];
  const out: ProposedChange[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const u = it as Record<string, unknown>;
    const pn = String(u["partNumber"] ?? "").trim().toUpperCase();
    const part = parts.find((p) => p.partNumber.toUpperCase() === pn);
    if (!part) continue;
    const evidence = String(u["evidence"] ?? "").slice(0, 300);
    const stage = u["stage"];
    if (typeof stage === "string" && STAGES.some((s) => s.id === stage) && stage !== part.stage)
      out.push({ partId: part.id, partNumber: part.partNumber, field: "stage", from: part.stage, to: stage as Stage, evidence });
    const conf = u["confidence"];
    if (typeof conf === "string" && conf in CONFIDENCE && conf !== part.confidence)
      out.push({ partId: part.id, partNumber: part.partNumber, field: "confidence", from: part.confidence, to: conf as Confidence, evidence });
    const dl = u["daysLate"];
    if (typeof dl === "number" && Number.isInteger(dl) && dl >= 0 && dl <= 365 && dl !== part.daysLate)
      out.push({ partId: part.id, partNumber: part.partNumber, field: "daysLate", from: part.daysLate, to: dl, evidence });
  }
  return out;
}
