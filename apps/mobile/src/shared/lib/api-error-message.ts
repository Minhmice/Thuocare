/**
 * Supabase/PostgREST often throws plain objects; instanceof Error can be false.
 */
export function extractApiErrorMessage(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  if (typeof error !== "object") return null;
  const o = error as Record<string, unknown>;
  for (const key of ["message", "error_description", "details", "hint"] as const) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

/** Short Vietnamese hints for common DB/RLS failures on personal medication save. */
export function friendlyPersonalMedicationSaveMessage(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("row-level security") || s.includes("rls") || s.includes("policy")) {
    return "Không thể lưu: tài khoản chưa đủ quyền (bảo mật dữ liệu). Hãy hoàn tất thiết lập hồ sơ cá nhân, hoặc đăng xuất và đăng nhập lại.";
  }
  if (s.includes("personal_profile") || s.includes("foreign key")) {
    return "Không tìm thấy hồ sơ cá nhân gắn với tài khoản. Hãy hoàn tất thiết lập tài khoản hoặc liên hệ hỗ trợ.";
  }
  if (s.includes("end_after_start") || s.includes("check constraint")) {
    return "Ngày hoặc lịch uống không hợp lệ. Kiểm tra ngày bắt đầu / kết thúc và giờ uống.";
  }
  const trimmed = raw.trim();
  return trimmed.length > 320 ? `${trimmed.slice(0, 317)}…` : trimmed;
}
