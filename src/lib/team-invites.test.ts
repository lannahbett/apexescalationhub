import { describe, expect, it } from "vitest";
import { normalizeInviteEmail } from "./team-invites";
describe("teammate invite email", () => {
  it("lower-cases and trims so the database match is exact", () => { expect(normalizeInviteEmail("  Marco.R@Company.COM ")).toBe("marco.r@company.com"); });
  it("rejects addresses without a domain", () => { expect(normalizeInviteEmail("marco@")).toBeNull(); expect(normalizeInviteEmail("marco")).toBeNull(); });
});
