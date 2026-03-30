/** Fix common VN mistakes: "+096…" → "+8496…", "0xxxxxxxxx" → "+84…" */
export function normalizeVnPhoneForDisplay(raw: string): string {
  const s = raw.trim();
  if (s.length === 0) return "";
  if (/^\+0\d/.test(s) && s.length >= 11) {
    return `+84${s.slice(2)}`;
  }
  if (/^0\d{9}$/.test(s)) {
    return `+84${s.slice(1)}`;
  }
  return s;
}

/** E.g. +84962969817 → 0962969817 for in-app list rows */
export function vnPhoneToNationalDisplay(normalized: string): string {
  if (normalized.startsWith("+84")) {
    return `0${normalized.slice(3)}`;
  }
  return normalized;
}
