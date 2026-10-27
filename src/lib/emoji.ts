/** Parsing of custom emoji / sticker references and CDN URL building for the emoji downloader. */
import { isSnowflake } from "./snowflake";

export type AssetKind = "emoji" | "sticker";

export interface AssetRef {
  kind: AssetKind;
  id: string;
  name?: string;
  /** emoji: true/false when known from the markup or URL, undefined when we have to probe */
  animated?: boolean;
  /** sticker: known format when the URL tells us */
  stickerFormat?: StickerFormat;
  source: string;
}

export type StickerFormat = "png" | "apng" | "lottie" | "gif";

export const EMOJI_SIZES = [32, 48, 64, 96, 128, 256, 512, 1024] as const;
export type EmojiFormat = "webp" | "png" | "gif";

const CDN = "https://cdn.discordapp.com";
const MEDIA = "https://media.discordapp.net";

/**
 * Finds every emoji/sticker reference in a paste. Bare IDs become `bareAs` (emoji by default).
 * Duplicates (same kind + id) are dropped.
 */
export function parseAssets(text: string, bareAs: AssetKind = "emoji"): { items: AssetRef[]; invalid: string[] } {
  const items: AssetRef[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  const push = (a: AssetRef) => {
    const k = `${a.kind}:${a.id}`;
    if (seen.has(k) || !isSnowflake(a.id)) return;
    seen.add(k);
    items.push(a);
  };

  // 1) emoji markup anywhere in the text, e.g. a copied message "nice <:pepe:123> <a:party:456>"
  let rest = text.replace(/<(a?):(\w{2,32}):(\d{15,21})>/g, (src, a: string, name: string, id: string) => {
    push({ kind: "emoji", id, name, animated: a === "a", source: src });
    return " ";
  });

  // 2) URLs
  rest = rest.replace(/https?:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)\/(emojis|stickers)\/(\d{15,21})(?:\.(\w+))?([^\s<>"']*)/gi, (src, type: string, id: string, ext?: string, query?: string) => {
    const e = (ext ?? "").toLowerCase();
    if (type.toLowerCase() === "emojis") {
      const animated = e === "gif" || /[?&]animated=true/i.test(query ?? "") ? true : undefined;
      const name = (query ?? "").match(/[?&]name=([^&]+)/)?.[1];
      push({ kind: "emoji", id, animated, name: name ? safeDecode(name) : undefined, source: src });
    } else {
      const fmt: StickerFormat | undefined = e === "json" ? "lottie" : e === "gif" ? "gif" : undefined;
      push({ kind: "sticker", id, stickerFormat: fmt, source: src });
    }
    return " ";
  });

  // 3) discord.com sticker / emoji share links and "sticker:ID" prefixes
  rest = rest.replace(/\b(sticker|emoji)[:/ ]\s*(\d{15,21})\b/gi, (src, t: string, id: string) => {
    push({ kind: t.toLowerCase() === "sticker" ? "sticker" : "emoji", id, source: src });
    return " ";
  });

  // 4) bare IDs and :name: leftovers
  for (const tok of rest.split(/[\s,;]+/)) {
    if (!tok) continue;
    if (/^\d{15,21}$/.test(tok)) push({ kind: bareAs, id: tok, source: tok });
    else if (/\S/.test(tok) && !/^:\w+:$/.test(tok)) invalid.push(tok);
  }
  return { items, invalid };
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export function emojiUrl(id: string, opts: { format: EmojiFormat; size?: number; animated?: boolean }): string {
  const q = new URLSearchParams();
  if (opts.size) q.set("size", String(opts.size));
  if (opts.format === "webp") {
    q.set("quality", "lossless");
    if (opts.animated) q.set("animated", "true");
  }
  const qs = q.toString();
  return `${CDN}/emojis/${id}.${opts.format}${qs ? `?${qs}` : ""}`;
}

export function stickerUrl(id: string, format: StickerFormat, size?: number): string {
  if (format === "lottie") return `${CDN}/stickers/${id}.json`;
  if (format === "gif") return `${MEDIA}/stickers/${id}.gif${size ? `?size=${size}` : ""}`;
  return `${CDN}/stickers/${id}.png${size ? `?size=${size}` : ""}`;
}

/** File extension for a sticker format (APNG keeps .png so every viewer opens it). */
export function stickerExt(format: StickerFormat): string {
  return format === "lottie" ? "json" : format === "gif" ? "gif" : "png";
}

/** Safe file name: keeps letters, digits, _ and -, falls back to the ID. */
export function fileName(base: string | undefined, id: string, suffix: string, ext: string): string {
  const clean = (base ?? "").replace(/[^\w-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
  return `${clean || id}${suffix ? `_${suffix}` : ""}.${ext}`;
}

/** True if a WebP file is animated (has the ANIM chunk in its VP8X container). */
export function isAnimatedWebp(bytes: Uint8Array): boolean {
  if (bytes.length < 30) return false;
  const tag = (o: number) => String.fromCharCode(bytes[o]!, bytes[o + 1]!, bytes[o + 2]!, bytes[o + 3]!);
  if (tag(0) !== "RIFF" || tag(8) !== "WEBP") return false;
  if (tag(12) === "VP8X") return ((bytes[20] ?? 0) & 0x02) !== 0;
  return false;
}

/** True if a PNG file is an APNG (has an acTL chunk before IDAT). */
export function isApng(bytes: Uint8Array): boolean {
  let o = 8;
  while (o + 8 <= bytes.length) {
    const len = ((bytes[o]! << 24) | (bytes[o + 1]! << 16) | (bytes[o + 2]! << 8) | bytes[o + 3]!) >>> 0;
    const type = String.fromCharCode(bytes[o + 4]!, bytes[o + 5]!, bytes[o + 6]!, bytes[o + 7]!);
    if (type === "acTL") return true;
    if (type === "IDAT") return false;
    o += 12 + len;
  }
  return false;
}
