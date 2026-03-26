import { getMockHomeState, runAutoMiss } from "@/features/home/data/mock-home-store";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

export function GET() {
  // Keep today view fresh.
  runAutoMiss(new Date());
  const state = getMockHomeState();
  return json({
    meds: state.meds,
    doseLogs: state.doseLogs,
  });
}

