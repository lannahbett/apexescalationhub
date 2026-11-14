import { describe, expect, it } from "vitest";
import { customerEmail, handover, readNotes, rescheduleSchema } from "./work-notes";
import { selectedSources } from "./handbook";

const request = { so: "SO-104820", customer: "Customer Example", committed: "2026-11-20", proposed: "2026-11-24", direction: "push_out" as const, reason: "Production readiness is under review.", sender: "OM Lead" };
describe("customer requests and private notes", () => {
  it("rejects push-out that is not later", () => { expect(rescheduleSchema.safeParse({ ...request, proposed: "2026-11-19" }).success).toBe(false); });
  it("rejects pull-in that is not earlier", () => { expect(rescheduleSchema.safeParse({ ...request, direction: "pull_in" }).success).toBe(false); expect(rescheduleSchema.safeParse({ ...request, direction: "pull_in", proposed: "2026-11-19" }).success).toBe(true); });
  it("rejects impossible calendar dates", () => { expect(rescheduleSchema.safeParse({ ...request, proposed: "2026-11-31" }).success).toBe(false); });
  it("rejects planned GI after proposed delivery", () => { expect(rescheduleSchema.safeParse({ ...request, plannedGi: "2026-11-25" }).success).toBe(false); });
  it("preserves supplied customer facts without changing the request", () => { const input = rescheduleSchema.parse(request); const before = JSON.stringify(input); const text = customerEmail(input); expect(text).toContain("Current committed delivery: 2026-11-20"); expect(text).toContain("Proposed delivery: 2026-11-24"); expect(JSON.stringify(input)).toBe(before); });
  it("exports only pinned notes", () => { const notes = [{ id: "1", title: "Pinned", body: "Follow up", category: "note" as const, reference: "SO-104820", pinned: true, updatedAt: "2026-11-14T02:00:00Z" }, { id: "2", title: "Private", body: "Not for handover", category: "note" as const, reference: "", pinned: false, updatedAt: "2026-11-14T02:00:00Z" }]; expect(handover(notes)).toContain("Follow up"); expect(handover(notes)).not.toContain("Not for handover"); expect(readNotes(JSON.stringify(notes))).toEqual(notes); });
  it("rejects malformed stored notes", () => { expect(readNotes('[{"title":"Broken"}]')).toEqual([]); });
  it("ignores invented source IDs and deduplicates citations", () => { const source = { id: "guide:dates", title: "Dates", text: "Verified excerpt" }; expect(selectedSources(["fake", source.id, source.id], [source])).toEqual([source]); expect(selectedSources(["fake"], [source])).toEqual([]); });
});