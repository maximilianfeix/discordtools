/** Webhook URL parsing and validation for the webhook manager. The URL is a secret: never persist it. */

export interface WebhookRef {
  id: string;
  token: string;
  /** canonical API URL used for every request */
  url: string;
  threadId?: string;
}

export interface WebhookInfo {
  id: string;
  type: number;
  name: string | null;
  avatar: string | null;
  channel_id: string | null;
  guild_id?: string | null;
  application_id: string | null;
  token?: string;
}

export function parseWebhookUrl(input: string): WebhookRef | null {
  const s = input.trim();
  const m = s.match(/^(?:https?:\/\/)?(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/api(?:\/v\d{1,2})?\/webhooks\/(\d{15,21})\/([A-Za-z0-9_-]{30,100})(?:\/?(?:\?([^#\s]*))?)?$/i);
  if (!m) return null;
  const threadId = new URLSearchParams(m[3] ?? "").get("thread_id") ?? undefined;
  return {
    id: m[1]!,
    token: m[2]!,
    url: `https://discord.com/api/v10/webhooks/${m[1]}/${m[2]}`,
    threadId: threadId && /^\d{15,21}$/.test(threadId) ? threadId : undefined,
  };
}

/** Looks like a webhook URL but something is off (cut off, extra text) – used for a friendlier hint. */
export function looksLikeWebhookAttempt(input: string): boolean {
  return /discord(?:app)?\.com\/api\/(?:v\d+\/)?webhooks/i.test(input);
}

/** Masks the token for display: …/webhooks/123/abcd…wxyz */
export function maskToken(token: string): string {
  return token.length <= 10 ? "•••" : `${token.slice(0, 4)}…${token.slice(-4)}`;
}

export const WEBHOOK_TYPE: Record<number, { de: string; en: string }> = {
  1: { de: "Eingehend (normaler Webhook)", en: "Incoming (regular webhook)" },
  2: { de: "Kanal-Follower (Ankündigungen)", en: "Channel follower (announcements)" },
  3: { de: "Anwendung (Interaktionen)", en: "Application (interactions)" },
};

export type NameProblem = "empty" | "too-long" | "reserved" | "forbidden-word";

/** Discord's webhook name rules: 1–80 chars, not everyone/here, no "clyde" or "discord". */
export function validateWebhookName(name: string): NameProblem | null {
  const n = name.trim();
  if (!n) return "empty";
  if ([...n].length > 80) return "too-long";
  if (/^(everyone|here)$/i.test(n)) return "reserved";
  if (/clyde|discord/i.test(n)) return "forbidden-word";
  return null;
}

export function webhookAvatarUrl(id: string, hash: string, size = 128): string {
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/avatars/${id}/${hash}.${ext}?size=${size}`;
}
