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
});import { agreedDate, pendingSapFields, requiredSapFields, trackedSchema } from "./work-notes";
describe("reschedule tracker", () => {
  const base = { id: "1", so: "SO-1", customer: "C", direction: "push_out" as const, committed: "2026-12-01", proposed: "2026-12-10", firstDate: "2026-12-08", plannedGi: "", response: "awaiting" as const, alternativeDate: "", responseNote: "", sapDone: [] as ("delivery" | "firstDate" | "plannedGi")[], createdAt: "2026-11-14T12:00:00.000Z", updatedAt: "2026-11-14T12:00:00.000Z" };
  it("has no SAP updates pending before the customer agrees", () => { expect(requiredSapFields(base)).toEqual([]); expect(requiredSapFields({ ...base, response: "declined" })).toEqual([]); });
  it("lists delivery plus each proposed SAP date after acceptance", () => { expect(requiredSapFields({ ...base, response: "accepted" })).toEqual(["delivery", "firstDate"]); });
  it("removes ticked fields from pending", () => { expect(pendingSapFields({ ...base, response: "accepted", sapDone: ["delivery"] })).toEqual(["firstDate"]); });
  it("uses the customer's alternative date as agreed date", () => { expect(agreedDate({ ...base, response: "alternative", alternativeDate: "2026-12-15" })).toBe("2026-12-15"); expect(agreedDate(base)).toBeNull(); });
  it("rejects an alternative response without a date", () => { expect(trackedSchema.safeParse({ ...base, response: "alternative" }).success).toBe(false); });
});
