export function safeFormatDate(isoDate: string, fallback = "Ngày không xác định") {
  if (!isoDate) return fallback;
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return fallback;
  }
}

export function safeFormatTime(isoDateTime: string | null, fallback = "Chưa rõ") {
  if (!isoDateTime) return fallback;
  try {
    const date = new Date(isoDateTime);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return fallback;
  }
}
