import type { UserProfile } from "../../types/medication";
import { normalizeVnPhoneForDisplay } from "../../lib/phone/vnDisplay";
import { supabase } from "../../lib/supabase/client";
import { getQueryUserId } from "../../lib/supabase/queryUser";

const PROFILE_COLUMNS =
  "profile_slug, full_name, email, phone, timezone, created_at" as const;

type ProfileRow = {
  profile_slug: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  created_at: string | null;
};

function mapProfileRow(row: ProfileRow): UserProfile {
  const profile: UserProfile = {
    id: row.profile_slug,
    fullName: row.full_name,
    email: (row.email ?? "").trim(),
    phone: normalizeVnPhoneForDisplay(row.phone ?? ""),
    timezone: row.timezone
  };
  if (row.created_at) {
    profile.joinedAt = row.created_at;
  }
  return profile;
}

export async function getProfile(): Promise<UserProfile | null> {
  const userId = await getQueryUserId();
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const raw = data as ProfileRow | null;
  if (!raw) {
    return null;
  }

  return mapProfileRow(raw);
}
