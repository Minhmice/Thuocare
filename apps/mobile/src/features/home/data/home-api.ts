import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getApiBaseUrl } from "@/core/api/api-base-url";
import { fetchJson } from "@/core/api/fetch-json";
import type { MockDoseLog, MockDoseStatus } from "@/shared/types/meds";

type TodayApiResponse = {
  meds: Array<{
    id: string;
    displayName: string;
    strengthText?: string | null;
  }>;
  doseLogs: MockDoseLog[];
};

function buildUrl(pathname: string) {
  const base = getApiBaseUrl();
  if (!base) return null;
  return `${base}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function useHomeTodayApi() {
  const url = buildUrl("/api/home/today");

  const query = useQuery({
    queryKey: ["home", "today"],
    enabled: !!url,
    queryFn: async () => {
      return fetchJson<TodayApiResponse>(url!);
    },
    // Keep the "auto-miss" state fresh without requiring UI reloads.
    refetchInterval: 30_000,
  });

  return { ...query, apiUrl: url };
}

export function useSetHomeDoseStatusApi() {
  const queryClient = useQueryClient();
  const base = getApiBaseUrl();

  return useMutation({
    mutationFn: async (input: { id: string; status: MockDoseStatus }) => {
      if (!base) throw new Error("API base URL unavailable");
      const url = `${base}/api/home/doses/${encodeURIComponent(input.id)}`;
      return fetchJson<{ ok: true }>(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: input.status }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["home", "today"] });
    },
  });
}

