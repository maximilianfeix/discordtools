/**
 * Tiny wrappers around web storage. We only ever store tool ids and settings the visitor
 * explicitly asked us to keep – never inputs like IDs, messages or webhook URLs.
 */
export function readJson<T>(key: string, fallback: T, store: "local" | "session" = "local"): T {
  try {
    const raw = (store === "local" ? localStorage : sessionStorage).getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown, store: "local" | "session" = "local"): void {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, JSON.stringify(value));
  } catch {
    /* storage disabled – the feature simply does not persist */
  }
}

export const FAVORITES_KEY = "dt-favorites";
export const RECENT_KEY = "dt-recent";

export function getFavorites(): string[] {
  return readJson<string[]>(FAVORITES_KEY, []);
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const on = !favs.includes(id);
  writeJson(FAVORITES_KEY, on ? [id, ...favs] : favs.filter((f) => f !== id));
  window.dispatchEvent(new CustomEvent("dt:favorites"));
  return on;
}

/** Recent tools live in sessionStorage only, so nothing outlives the tab. */
export function pushRecent(id: string): void {
  const recent = readJson<string[]>(RECENT_KEY, [], "session").filter((r) => r !== id);
  writeJson(RECENT_KEY, [id, ...recent].slice(0, 6), "session");
}

export function getRecent(): string[] {
  return readJson<string[]>(RECENT_KEY, [], "session");
}
