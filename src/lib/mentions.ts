/**
 * Builders and a decoder for Discord's mention / reference syntax.
 * The decoder finds every reference in a pasted text and explains it.
 */
import { decodeSnowflake, isSnowflake, parseDiscordReference } from "./snowflake";
import type { TimestampStyle } from "./timestamp";

export type GuildNav = "customize" | "browse" | "guide" | "linked-roles";
export const GUILD_NAV: GuildNav[] = ["customize", "browse", "guide", "linked-roles"];

export const userMention = (id: string) => `<@${id}>`;
export const roleMention = (id: string) => `<@&${id}>`;
export const channelMention = (id: string) => `<#${id}>`;

/** Slash command names: 1–32 chars, lowercase letters/digits/-/_ (Unicode letters allowed). */
export function isCommandName(name: string): boolean {
  return /^[-_\p{Ll}\p{Lo}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u.test(name);
}

export function commandMention(name: string, id: string, sub?: string, group?: string): string {
  const parts = [name, group, sub].map((p) => p?.trim()).filter(Boolean);
  return `</${parts.join(" ")}:${id}>`;
}

export function isEmojiName(name: string): boolean {
  return /^\w{2,32}$/.test(name);
}

export function emojiMarkup(name: string, id: string, animated = false): string {
  return `<${animated ? "a" : ""}:${name}:${id}>`;
}

export function emojiUrl(id: string, animated = false, size = 96): string {
  return `https://cdn.discordapp.com/emojis/${id}.webp?size=${size}${animated ? "&animated=true" : ""}`;
}

export function guildNav(kind: GuildNav, roleId?: string): string {
  return kind === "linked-roles" && roleId ? `<id:linked-roles:${roleId}>` : `<id:${kind}>`;
}

export function messageLink(guildId: string, channelId: string, messageId?: string): string {
  return `https://discord.com/channels/${guildId}/${channelId}${messageId ? `/${messageId}` : ""}`;
}

export type Reference =
  | { kind: "user" | "role" | "channel"; raw: string; id: string }
  | { kind: "emoji"; raw: string; id: string; name: string; animated: boolean }
  | { kind: "command"; raw: string; id: string; name: string; sub?: string; group?: string }
  | { kind: "timestamp"; raw: string; unix: number; style: TimestampStyle }
  | { kind: "nav"; raw: string; nav: GuildNav; id?: string }
  | { kind: "everyone" | "here"; raw: string }
  | { kind: "message"; raw: string; guildId: string; channelId: string; messageId: string }
  | { kind: "channel-link"; raw: string; guildId: string; channelId: string }
  | { kind: "game"; raw: string; id: string }
  | { kind: "id"; raw: string; id: string };

const TOKEN = new RegExp(
  [
    String.raw`https?:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/channels\/(?:\d{15,21}|@me)\/\d{15,21}(?:\/\d{15,21})?`,
    String.raw`<@!?\d{15,21}>`,
    String.raw`<@&\d{15,21}>`,
    String.raw`<@\$\d{1,21}>`,
    String.raw`<#\d{15,21}>`,
    String.raw`<a?:\w{2,32}:\d{15,21}>`,
    String.raw`<\/[-_\p{L}\p{N} ]{1,98}:\d{15,21}>`,
    String.raw`<t:-?\d{1,13}(?::[tTdDfFRsS])?>`,
    String.raw`<id:(?:customize|browse|guide|linked-roles)(?::\d{15,21})?>`,
    String.raw`@everyone|@here`,
    String.raw`\b\d{17,21}\b`,
  ].join("|"),
  "gu",
);

/** Finds and classifies every Discord reference in a text, in order. */
export function findReferences(text: string): Reference[] {
  const out: Reference[] = [];
  for (const m of text.matchAll(TOKEN)) {
    const raw = m[0];
    const ref = classify(raw);
    if (ref) out.push(ref);
    if (out.length >= 50) break;
  }
  return out;
}

function classify(raw: string): Reference | null {
  if (raw === "@everyone") return { kind: "everyone", raw };
  if (raw === "@here") return { kind: "here", raw };
  let m = raw.match(/^<\/([-_\p{L}\p{N} ]{1,98}):(\d{15,21})>$/u);
  if (m) {
    const [name, a, b] = m[1]!.trim().split(/\s+/);
    return { kind: "command", raw, id: m[2]!, name: name!, group: b ? a : undefined, sub: b ?? a };
  }
  m = raw.match(/^<t:(-?\d{1,13})(?::([tTdDfFRsS]))?>$/);
  if (m) return { kind: "timestamp", raw, unix: Number(m[1]), style: (m[2] as TimestampStyle | undefined) ?? "f" };
  m = raw.match(/^<id:(customize|browse|guide|linked-roles)(?::(\d{15,21}))?>$/);
  if (m) return { kind: "nav", raw, nav: m[1] as GuildNav, id: m[2] };
  m = raw.match(/^<@\$(\d{1,21})>$/);
  if (m) return { kind: "game", raw, id: m[1]! };

  const ref = parseDiscordReference(raw);
  if (!ref) return null;
  switch (ref.kind) {
    case "message":
      return { kind: "message", raw, guildId: ref.guildId, channelId: ref.channelId, messageId: ref.messageId };
    case "channel":
      return { kind: "channel-link", raw, guildId: ref.guildId, channelId: ref.channelId };
    case "user":
    case "role":
      return { kind: ref.kind, raw, id: ref.id };
    case "channel-mention":
      return { kind: "channel", raw, id: ref.id };
    case "emoji":
      return { kind: "emoji", raw, id: ref.id, name: ref.name ?? "", animated: !!ref.animated };
    case "id":
      return isSnowflake(ref.id) ? { kind: "id", raw, id: ref.id } : null;
  }
}

/** All snowflakes in a reference, each with its creation time (ms). */
export function referenceIds(ref: Reference): { role: string; id: string; created?: number }[] {
  const ids: { role: string; id: string }[] = [];
  switch (ref.kind) {
    case "message":
      ids.push({ role: "guild", id: ref.guildId }, { role: "channel", id: ref.channelId }, { role: "message", id: ref.messageId });
      break;
    case "channel-link":
      ids.push({ role: "guild", id: ref.guildId }, { role: "channel", id: ref.channelId });
      break;
    case "user":
    case "role":
    case "channel":
    case "emoji":
    case "command":
    case "id":
      ids.push({ role: ref.kind, id: ref.id });
      break;
    case "nav":
      if (ref.id) ids.push({ role: "role", id: ref.id });
      break;
  }
  return ids
    .filter((x) => x.id !== "@me")
    .map((x) => ({ ...x, created: isSnowflake(x.id) ? decodeSnowflake(x.id).timestamp : undefined }));
}
