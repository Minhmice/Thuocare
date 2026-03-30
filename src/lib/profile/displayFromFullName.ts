/**
 * Short display handle: last word of full name + its last character again, lowercased.
 * e.g. "Trần Tuệ Minh" → "minhh"
 */
export function profileDisplayFromFullName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const last =
    parts.length > 0 ? (parts[parts.length - 1] ?? "") : fullName.trim();
  if (last.length === 0) {
    return "";
  }
  const lastCh = last[last.length - 1] ?? "";
  return `${last}${lastCh}`.toLowerCase();
}
