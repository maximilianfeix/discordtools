/** Tiny helpers for shareable, secret-free tool state in `location.hash` (`#a=1&b=2`). */

export function readHash(hash: string = typeof location !== "undefined" ? location.hash : ""): URLSearchParams {
  return new URLSearchParams(hash.replace(/^#/, ""));
}

export function hashString(params: Record<string, string | null | undefined>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  }
  return parts.length ? "#" + parts.join("&") : "";
}

/** Replaces the hash without adding history entries or scrolling. */
export function writeHash(params: Record<string, string | null | undefined>): void {
  if (typeof history === "undefined") return;
  const h = hashString(params);
  const url = location.pathname + location.search + h;
  if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, "", url);
}
