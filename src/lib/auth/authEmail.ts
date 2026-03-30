import { normalizeVnPhoneForDisplay } from "../phone/vnDisplay";

/** Domain for phone-only accounts (auth email must be unique). Configure deliverability in Supabase if needed. */
const SYNTHETIC_EMAIL_DOMAIN = "phone.thuocare.app";

export function digitsFromPhoneIdentifier(raw: string): string {
  const normalized = normalizeVnPhoneForDisplay(raw.trim());
  return normalized.replace(/\D/g, "");
}

export function syntheticEmailFromPhone(phone: string): string {
  const digits = digitsFromPhoneIdentifier(phone);
  if (digits.length < 8) {
    throw new Error("Enter a valid phone number.");
  }
  return `phone_${digits}@${SYNTHETIC_EMAIL_DOMAIN}`;
}

export function resolveAuthEmailFromIdentifier(identifier: string): string {
  const t = identifier.trim();
  if (t.includes("@")) {
    return t.toLowerCase();
  }
  return syntheticEmailFromPhone(t);
}

export function isLikelyEmailIdentifier(identifier: string): boolean {
  return identifier.trim().includes("@");
}
