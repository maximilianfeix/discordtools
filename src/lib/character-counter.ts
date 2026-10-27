/**
 * Counting text the way Discord's limits do (JavaScript string length = UTF-16 code units)
 * and splitting long messages into sendable chunks without breaking code blocks or words.
 */

export interface Limit {
  id: string;
  max: number;
  /** "doc": Discord developer docs; "client": shown by the Discord app / help center, not in the API docs */
  source: "doc" | "client";
  name: { de: string; en: string };
}

export const TEXT_LIMITS: Limit[] = [
  { id: "message", max: 2000, source: "doc", name: { de: "Nachricht", en: "Message" } },
  { id: "nitro", max: 4000, source: "client", name: { de: "Nachricht mit Nitro", en: "Message with Nitro" } },
  { id: "embed-desc", max: 4096, source: "doc", name: { de: "Embed-Beschreibung", en: "Embed description" } },
  { id: "embed-title", max: 256, source: "doc", name: { de: "Embed-Titel", en: "Embed title" } },
  { id: "field-value", max: 1024, source: "doc", name: { de: "Embed-Feld (Wert)", en: "Embed field value" } },
  { id: "bio", max: 190, source: "client", name: { de: "Über mich (Bio)", en: "About me (bio)" } },
  { id: "status", max: 128, source: "client", name: { de: "Benutzerdefinierter Status", en: "Custom status" } },
  { id: "nickname", max: 32, source: "doc", name: { de: "Server-Nickname", en: "Server nickname" } },
  { id: "username", max: 32, source: "doc", name: { de: "Benutzername", en: "Username" } },
  { id: "topic", max: 1024, source: "doc", name: { de: "Kanalthema", en: "Channel topic" } },
  { id: "server", max: 100, source: "doc", name: { de: "Servername", en: "Server name" } },
  { id: "role", max: 100, source: "doc", name: { de: "Rollenname", en: "Role name" } },
];

const INVISIBLE = /[­͏؜ᅟᅠ឴឵᠎​-‏‪-‮⁠-⁤⁪-⁯⠀ㅤ﻿ﾠ]/g;
const PICTO = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

export interface TextStats {
  /** What Discord counts: UTF-16 code units (JavaScript `length`). */
  length: number;
  /** Characters as people see them (grapheme clusters). */
  visible: number;
  codePoints: number;
  words: number;
  lines: number;
  bytes: number;
  emoji: number;
  /** Extra code units the emoji cost on top of one each. */
  emojiExtra: number;
  customEmoji: number;
  invisible: number;
}

function graphemes(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(t: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  return Array.from(text);
}

export function countText(text: string): TextStats {
  const g = graphemes(text);
  let emoji = 0;
  let emojiExtra = 0;
  for (const c of g) {
    if (PICTO.test(c)) {
      emoji++;
      emojiExtra += c.length - 1;
    }
  }
  return {
    length: text.length,
    visible: g.length,
    codePoints: Array.from(text).length,
    words: (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’_-]*/gu) ?? []).length,
    lines: text ? text.split("\n").length : 0,
    bytes: new TextEncoder().encode(text).length,
    emoji,
    emojiExtra,
    customEmoji: (text.match(/<a?:\w{2,32}:\d{15,21}>/g) ?? []).length,
    invisible: (text.match(INVISIBLE) ?? []).length,
  };
}

// ---------------------------------------------------------------- splitting

interface Fence {
  open: boolean;
  lang: string;
}

function stepFence(f: Fence, line: string): Fence {
  const count = (line.match(/```/g) ?? []).length;
  if (count % 2 === 0) return f;
  if (f.open) return { open: false, lang: "" };
  const m = line.match(/```([\w+\-.]*)/);
  return { open: true, lang: m?.[1] ?? "" };
}

/** Cuts a line at the last space that fits, or hard at `budget` (never inside a surrogate pair). */
function cutLine(line: string, budget: number): [string, string] {
  const sp = line.lastIndexOf(" ", budget);
  if (sp > budget * 0.5) return [line.slice(0, sp), line.slice(sp + 1)];
  let cut = budget;
  const code = line.charCodeAt(cut - 1);
  if (code >= 0xd800 && code <= 0xdbff) cut--;
  return [line.slice(0, cut), line.slice(cut)];
}

export interface SplitOptions {
  max?: number;
  /** Append "-# 1/3" to every chunk (counts towards the limit). */
  numbered?: boolean;
}

/**
 * Splits text into chunks of at most `max` characters. Prefers paragraph breaks, never splits
 * words unless one word is longer than a whole chunk, and closes/reopens ``` code blocks across chunks.
 */
export function splitMessage(text: string, opts: SplitOptions = {}): string[] {
  const max = opts.max ?? 2000;
  const src = text.replace(/\r\n?/g, "\n");
  if (!src.trim()) return [];
  if (src.length <= max && !opts.numbered) return [src];
  // reserve room for "\n-# 99/99"
  const limit = opts.numbered ? max - 10 : max;
  if (limit < 40) throw new Error("limit too small");

  const q = src.split("\n");
  const chunks: string[] = [];
  let i = 0;
  let fence: Fence = { open: false, lang: "" };
  while (i < q.length) {
    const prefix = fence.open ? "```" + fence.lang + "\n" : "";
    let st = fence;
    const body: string[] = [];
    const states: Fence[] = [];
    const lens: number[] = [];
    let len = prefix.length;
    let j = i;
    while (j < q.length) {
      const line = q[j]!;
      const after = stepFence(st, line);
      const add = (body.length ? 1 : 0) + line.length;
      const close = after.open ? 4 : 0;
      if (len + add + close <= limit) {
        body.push(line);
        states.push(after);
        len += add;
        lens.push(len);
        st = after;
        j++;
        continue;
      }
      if (body.length === 0) {
        // a single line longer than a chunk: cut it at a word boundary
        const budget = limit - prefix.length - (st.open ? 4 : 0);
        const [head, tail] = cutLine(line, budget);
        body.push(head);
        states.push(st);
        lens.push(len + head.length);
        q[j] = tail;
      }
      break;
    }
    // Prefer to end at a blank line (outside code) in the second half of the chunk.
    if (j < q.length && body.length > 1) {
      for (let k = body.length - 1; k > 0; k--) {
        if (body[k]!.trim() === "" && !states[k]!.open && lens[k - 1]! >= limit * 0.5) {
          body.length = k;
          states.length = k;
          j = i + k + 1;
          break;
        }
      }
    }
    const end = states[states.length - 1] ?? fence;
    let chunk = prefix + body.join("\n") + (end.open ? "\n```" : "");
    chunk = chunk.replace(/^\n+/, "").replace(/\s+$/, "");
    if (chunk.trim() && chunk !== "```" + fence.lang) chunks.push(chunk);
    fence = end;
    i = j;
  }
  if (opts.numbered) return chunks.map((c, n) => `${c}\n-# ${n + 1}/${chunks.length}`);
  return chunks;
}
