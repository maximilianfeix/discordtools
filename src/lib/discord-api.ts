/**
 * Tiny fetch wrapper for the public, token-free Discord endpoints our lookup tools call
 * straight from the browser (invites, widget.json, webhooks, discordstatus.com).
 * It never retries on its own and never sends credentials.
 */

export type ApiErrorKind =
  | "offline" // navigator says we are offline, or the request never reached Discord
  | "notfound" // 404 (unknown invite / guild / webhook) – also CDN 404s, which surface as CORS errors
  | "ratelimit" // 429
  | "forbidden" // 403 (e.g. widget disabled)
  | "unauthorized" // 401 (e.g. invalid webhook token)
  | "badrequest" // 400 (validation error)
  | "server" // 5xx
  | "aborted";

export interface ApiError {
  kind: ApiErrorKind;
  status?: number;
  /** Discord JSON error code, e.g. 10006 Unknown Invite, 50004 Widget Disabled */
  code?: number;
  message?: string;
  /** seconds, from the 429 body or Retry-After header */
  retryAfter?: number;
  /** flattened validation errors from a 400 body */
  details?: string[];
}

export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; error: ApiError };

interface ErrorBody {
  message?: string;
  code?: number;
  retry_after?: number;
  errors?: unknown;
}

/** Flattens Discord's nested `errors` object (`{name:{_errors:[{message}]}}`) into readable lines. */
export function flattenErrors(errors: unknown, path = ""): string[] {
  if (!errors || typeof errors !== "object") return [];
  const out: string[] = [];
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    if (key === "_errors" && Array.isArray(value)) {
      for (const e of value) {
        const msg = (e as { message?: string })?.message;
        if (msg) out.push(path ? `${path}: ${msg}` : msg);
      }
    } else {
      out.push(...flattenErrors(value, path ? `${path}.${key}` : key));
    }
  }
  return out;
}

export function classifyStatus(status: number, body: ErrorBody | null, retryAfterHeader?: string | null): ApiError {
  const base = { status, code: body?.code, message: body?.message };
  if (status === 404) return { kind: "notfound", ...base };
  if (status === 429) {
    const header = retryAfterHeader ? Number(retryAfterHeader) : NaN;
    const retryAfter = typeof body?.retry_after === "number" ? body.retry_after : Number.isFinite(header) ? header : undefined;
    return { kind: "ratelimit", ...base, retryAfter };
  }
  if (status === 403) return { kind: "forbidden", ...base };
  if (status === 401) return { kind: "unauthorized", ...base };
  if (status >= 500) return { kind: "server", ...base };
  return { kind: "badrequest", ...base, details: flattenErrors(body?.errors) };
}

export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return { ok: false, error: { kind: "offline" } };
  let res: Response;
  try {
    res = await fetch(url, { ...init, credentials: "omit", referrerPolicy: "no-referrer" });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return { ok: false, error: { kind: "aborted" } };
    return { ok: false, error: { kind: "offline" } };
  }
  let body: unknown = null;
  if (res.status !== 204) {
    const text = await res.text().catch(() => "");
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = null;
    }
  }
  if (res.ok) return { ok: true, status: res.status, data: body as T };
  return { ok: false, error: classifyStatus(res.status, body as ErrorBody | null, res.headers.get("Retry-After")) };
}

/**
 * Detects strings shaped like a Discord user/bot token (three base64url parts separated by dots,
 * or the legacy `mfa.` form). We refuse those everywhere – never paste a token into a website.
 */
export function looksLikeToken(input: string): boolean {
  return /(?:^|[^\w.-])(?:[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}|mfa\.[A-Za-z0-9_-]{80,})(?:$|[^\w.-])/.test(input);
}
