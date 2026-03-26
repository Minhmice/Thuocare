import type { Med, MedStatus } from "@/shared/types/meds";
import { createMed, getMedsSnapshot } from "@/shared/mock/med-store";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function isValidHHmm(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return false;
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function normalizeTimes(times: unknown): string[] | null {
  if (!Array.isArray(times)) return null;
  const parts = times.map((t) => String(t).trim()).filter(Boolean);
  if (parts.some((p) => !isValidHHmm(p))) return null;
  const unique = Array.from(new Set(parts));
  unique.sort();
  return unique;
}

function isMedStatus(value: unknown): value is MedStatus {
  return value === "active" || value === "paused" || value === "stopped";
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const status = url.searchParams.get("status") ?? "all";

  let meds = getMedsSnapshot();
  if (status !== "all" && isMedStatus(status)) {
    meds = meds.filter((m) => m.status === status);
  }
  if (q) {
    meds = meds.filter((m) => `${m.displayName} ${m.strengthText ?? ""}`.toLowerCase().includes(q));
  }

  return json({ meds });
}

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const displayName = String(body?.displayName ?? "").trim();
  if (!displayName) return json({ error: "displayName is required" }, { status: 400 });

  const scheduleTimes = normalizeTimes(body?.scheduleTimes) ?? [];
  const status: MedStatus = isMedStatus(body?.status) ? body.status : "active";

  const med: Omit<Med, "id"> = {
    displayName,
    strengthText: body?.strengthText ? String(body.strengthText).trim() : null,
    dosageForm: body?.dosageForm ? String(body.dosageForm).trim() : null,
    doseAmount: typeof body?.doseAmount === "number" ? body.doseAmount : null,
    doseUnit: body?.doseUnit ? String(body.doseUnit).trim() : null,
    scheduleTimes,
    notes: body?.notes ? String(body.notes).trim() : null,
    status,
  };

  const created = createMed(med);
  return json({ med: created }, { status: 201 });
}

