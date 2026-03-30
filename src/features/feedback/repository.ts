import { supabase } from "../../lib/supabase/client";
import { getQueryUserId } from "../../lib/supabase/queryUser";
import type { FeedbackCategory } from "./types";

const BUCKET = "feedback-screenshots";

function extFromUri(uri: string): string {
  const lower = uri.split("?")[0]?.toLowerCase() ?? "";
  if (lower.endsWith(".png")) return "png";
  if (lower.endsWith(".webp")) return "webp";
  return "jpg";
}

function contentTypeForExt(ext: string): string {
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  return "image/jpeg";
}

export type SubmitAppFeedbackInput = {
  id: string;
  rating: number;
  category: FeedbackCategory;
  problemDescription: string;
  imageUri?: string | null;
};

export async function submitAppFeedback(input: SubmitAppFeedbackInput): Promise<void> {
  const userId = await getQueryUserId();
  if (!userId) {
    throw new Error("Not signed in");
  }

  const ext = input.imageUri ? extFromUri(input.imageUri) : "jpg";
  const objectPath = `${userId}/${input.id}.${ext}`;
  let screenshotPath: string | null = null;

  if (input.imageUri) {
    const res = await fetch(input.imageUri);
    const blob = await res.blob();
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, blob, {
        contentType: blob.type || contentTypeForExt(ext),
        upsert: false
      });
    if (upErr) {
      throw new Error(upErr.message);
    }
    screenshotPath = objectPath;
  }

  const { error } = await supabase.from("app_feedback").insert({
    id: input.id,
    user_id: userId,
    rating: input.rating,
    category: input.category,
    problem_description: input.problemDescription.trim(),
    screenshot_storage_path: screenshotPath,
    source: "me_feedback"
  });

  if (error) {
    if (screenshotPath) {
      await supabase.storage.from(BUCKET).remove([screenshotPath]).catch(() => undefined);
    }
    throw new Error(error.message);
  }
}
