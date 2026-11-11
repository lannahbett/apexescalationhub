import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MODEL = "openai/gpt-oss-120b";

async function groq(system: string, user: string, json = false): Promise<string> {
  const key = process.env["GROQ_API_KEY"];
  if (!key) throw new Error("AI is not configured.");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      ...(json ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    console.error("Groq error", res.status, await res.text());
    throw new Error(res.status === 429 ? "AI rate limit reached — try again in a minute." : "AI service unavailable.");
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

const partSummary = z.object({
  partNumber: z.string(), description: z.string(), line: z.string(), stage: z.string(),
  confidence: z.string(), daysLate: z.number(), hoursToLineStop: z.number(), valueAtRisk: z.number(),
  riskScore: z.number(), planner: z.string(), supplier: z.string(),
  demandSurgePct: z.number().optional(), leadTimeDriftPct: z.number().optional(),
  customerOrders: z.array(z.object({ so: z.string(), customer: z.string(), committed: z.string(), value: z.number(), slipDays: z.number() })).max(10).optional(),
});

export const generateBriefing = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ parts: z.array(partSummary).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const text = await groq(
      "You are a senior material planning lead preparing a 60-second morning standup briefing for a manufacturing plant. Use ONLY the data given; never invent parts, numbers, dates or suppliers. Format: 'Top risks' (max 3 bullets, part number, line, hours to line stop, € at risk), 'Stalled cases' (bullets), 'Customer impact' (orders with slipDays>0: customer, SO, committed date), 'Demand & lead-time alerts' (demandSurgePct>=30 or leadTimeDriftPct>=50), 'Decisions needed today' (max 3 bullets). Plain text, concise.",
      JSON.stringify(data.parts),
    );
    return { text };
  });

export const draftEscalation = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ part: partSummary.extend({ po: z.string(), qtyPending: z.number(), uom: z.string(), targetBuild: z.string() }), tone: z.enum(["firm", "collaborative", "executive"]), sender: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const text = await groq(
      `Write a supplier expedite escalation email in a ${data.tone} tone. Use ONLY the facts provided; do not invent tracking numbers, prices or commitments. Start with 'Subject: '. Request a confirmed ship date with tracking within 24 hours and partial-shipment options. Sign as ${data.sender}, Material Planning – Apex Manufacturing.`,
      JSON.stringify(data.part),
    );
    return { text };
  });

export const parseInboundUpdate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ message: z.string().min(1).max(8000), partNumbers: z.array(z.string()).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const raw = await groq(
      `Extract shortage status updates from a supplier/carrier message. Known part numbers: ${data.partNumbers.join(", ")}. Return JSON {"updates":[{"partNumber":string,"stage"?:"detected"|"sourcing"|"transit"|"customs"|"delivered","confidence"?:"high"|"at_risk"|"stalled","daysLate"?:integer,"evidence":string}]}. Only include fields explicitly supported by the message; evidence is the exact quoted sentence. Use only known part numbers. If nothing applies return {"updates":[]}.`,
      data.message,
      true,
    );
    return { json: raw };
  });
