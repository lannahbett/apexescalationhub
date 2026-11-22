/** Returns a lower-cased, trimmed email suitable for a board invite, or null when invalid. */
export function normalizeInviteEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return null;
  return v;
}
