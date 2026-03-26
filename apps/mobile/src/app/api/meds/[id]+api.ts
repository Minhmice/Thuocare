import type { MedStatus } from "@/shared/types/meds";
import { deleteMed, getMedById, updateMed } from "@/shared/mock/med-store";

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

export function GET(_request: Request, { id }: { id: string }) {
  const med = getMedById(id);
  if (!med) return json({ error: "Not found" }, { status: 404 });
  return json({ med });
}

export async function PATCH(request: Request, { id }: { id: string }) {
  const current = getMedById(id);
  if (!current) return json({ error: "Not found" }, { status: 404 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: any = {};
  if (body.displayName !== undefined) {
    const v = String(body.displayName ?? "").trim();
    if (!v) return json({ error: "displayName cannot be empty" }, { status: 400 });
    patch.displayName = v;
  }
  if (body.strengthText !== undefined) patch.strengthText = body.strengthText ? String(body.strengthText).trim() : null;
  if (body.notes !== undefined) patch.notes = body.notes ? String(body.notes).trim() : null;
  if (body.status !== undefined) {
    if (!isMedStatus(body.status)) return json({ error: "Invalid status" }, { status: 400 });
    patch.status = body.status;
  }
  if (body.scheduleTimes !== undefined) {
    const times = normalizeTimes(body.scheduleTimes);
    if (times === null) return json({ error: "Invalid scheduleTimes" }, { status: 400 });
    patch.scheduleTimes = times;
  }

  const updated = updateMed(id, patch);
  return json({ med: updated });
}

export function DELETE(_request: Request, { id }: { id: string }) {
  const ok = deleteMed(id);
  if (!ok) return json({ error: "Not found" }, { status: 404 });
  return new Response(null, { status: 204 });
}

