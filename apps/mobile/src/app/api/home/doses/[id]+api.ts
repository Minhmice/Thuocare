import type { MockDoseStatus } from "@/shared/types/meds";
import { getMockHomeState, setDoseStatus } from "@/features/home/data/mock-home-store";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function isDoseStatus(value: unknown): value is MockDoseStatus {
  return value === "scheduled" || value === "taken" || value === "missed" || value === "skipped";
}

export function GET(_request: Request, { id }: { id: string }) {
  const state = getMockHomeState();
  const dose = state.doseLogs.find((d) => d.id === id) ?? null;
  if (!dose) return json({ error: "Not found" }, { status: 404 });
  return json({ dose });
}

export async function POST(request: Request, { id }: { id: string }) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const nextStatus = body?.status;
  if (!isDoseStatus(nextStatus)) return json({ error: "Invalid status" }, { status: 400 });

  const state = getMockHomeState();
  const exists = state.doseLogs.some((d) => d.id === id);
  if (!exists) return json({ error: "Not found" }, { status: 404 });

  setDoseStatus(id, nextStatus);
  return json({ ok: true });
}

