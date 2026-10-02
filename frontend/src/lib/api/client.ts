import type { ApiErrorEnvelope, ErrorCode } from "@/lib/api/types";

export class ApiError extends Error {
  status: number;
  code: ErrorCode | string;
  details: Record<string, unknown> | undefined;
  retryAfterSeconds: number | undefined;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    details?: Record<string, unknown>;
    retryAfterSeconds?: number;
  }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.retryAfterSeconds = opts.retryAfterSeconds;
  }
}

function baseUrl(serverSide: boolean): string {
  if (serverSide || typeof window === "undefined") {
    return process.env.API_BASE_URL ?? "http://localhost:8000";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
}

export function isMockingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
}

interface RequestOptions extends RequestInit {
  revalidate?: number;
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const serverSide = typeof window === "undefined";
  const url = `${baseUrl(serverSide)}/api/v1${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const { revalidate, ...init } = opts;

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
      ...(serverSide
        ? revalidate !== undefined
          ? { next: { revalidate } }
          : { cache: "no-store" }
        : {}),
    });

    const retryAfter = res.headers.get("Retry-After");
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }

    if (!res.ok || (body as ApiErrorEnvelope)?.success === false) {
      const err = body as ApiErrorEnvelope;
      throw new ApiError({
        status: res.status,
        code: err?.error?.code ?? "internal_error",
        message: err?.error?.message ?? `Request failed (${res.status})`,
        details: err?.error?.details,
        retryAfterSeconds:
          retryAfter !== null
            ? Number(retryAfter)
            : typeof err?.error?.details?.retry_after_seconds === "number"
              ? (err.error.details.retry_after_seconds as number)
              : undefined,
      });
    }

    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new ApiError({ status: 0, code: "internal_error", message: "Request timed out. Try again." });
    }
    throw new ApiError({
      status: 0,
      code: "internal_error",
      message: "Network error. Check your connection and try again.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
