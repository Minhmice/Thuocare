import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  careIntentFromUserMetadata,
  landingRouteForCareIntent,
} from "@/lib/workflow/care-intent";

export default async function RootPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const intent = careIntentFromUserMetadata(meta) ?? "personal";
  redirect(landingRouteForCareIntent(intent));
}
