import { router } from "expo-router";
import { supabase } from "../supabase/client";

export function isLikelyAuthStorageError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("native module is null") ||
    m.includes("asyncstorage") ||
    m.includes("legacy storage") ||
    m.includes("cannot access legacy storage")
  );
}

/**
 * Clears local auth state and opens sign-in. Use when session restore or storage fails.
 */
export async function resetAuthAndGoToSignIn(): Promise<void> {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    /* storage may be broken; still navigate */
  }

  try {
    router.replace("/sign-in");
  } catch {
    /* router may not be mounted yet */
  }
}
