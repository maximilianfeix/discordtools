/** Subset of Discord's message payload that our builders edit and preview. */
export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  author?: { name: string; url?: string; icon_url?: string };
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  fields?: EmbedField[];
}

export interface MessagePayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: Embed[];
  thread_name?: string;
  flags?: number;
  allowed_mentions?: { parse?: ("users" | "roles" | "everyone")[]; users?: string[]; roles?: string[] };
}

export const LIMITS = {
  content: 2000,
  embeds: 10,
  embedTotal: 6000,
  title: 256,
  description: 4096,
  fields: 25,
  fieldName: 256,
  fieldValue: 1024,
  footer: 2048,
  author: 256,
  username: 80,
} as const;

export function embedLength(e: Embed): number {
  return (
    (e.title?.length ?? 0) +
    (e.description?.length ?? 0) +
    (e.footer?.text.length ?? 0) +
    (e.author?.name.length ?? 0) +
    (e.fields ?? []).reduce((n, f) => n + f.name.length + f.value.length, 0)
  );
}

export function intToHex(n: number): string {
  return "#" + Math.max(0, Math.min(0xffffff, n | 0)).toString(16).padStart(6, "0");
}

export function hexToInt(hex: string): number | null {
  const m = hex.trim().replace(/^#/, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return /^[0-9a-f]{6}$/i.test(full) ? parseInt(full, 16) : null;
}
