import { getApiBaseUrl } from "@/core/api/api-base-url";

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;

  constructor(message: string, status: number, data: T | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
};

function buildQueryString(query: ApiFetchOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    if (raw === undefined || raw === null) continue;
    params.set(key, String(raw));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/g, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<TResponse>(path: string, options: ApiFetchOptions = {}): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  if (baseUrl === null) {
    throw new ApiError("Missing API base URL", 0, null);
  }

  const method = options.method ?? "GET";
  const url = joinUrl(baseUrl, `${path}${buildQueryString(options.query)}`);

  const headers: Record<string, string> = {
    ...(options.headers ?? {}),
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = headers["Content-Type"] ?? "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { method, headers, body });

  if (res.status === 204) {
    return undefined as TResponse;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  let data: any = null;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const message =
      (isJson && data && typeof data === "object" && "error" in data && typeof data.error === "string" && data.error) ||
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as TResponse;
}

