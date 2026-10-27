/**
 * Server tags (API: user.primary_guild.tag): up to 4 characters plus a badge.
 * Discord's support article says: "alphanumerical characters and certain special characters",
 * "certain characters, spaces, and emojis are not supported". The exact special-character list is not published,
 * so we only promise A–Z/0–9 and mark everything else honestly.
 */

export const MAX_TAG = 4;

export type CharClass = "alnum" | "symbol" | "space" | "emoji" | "letter" | "invisible";
export type TagStatus = "ok" | "warn" | "invalid";

export type TagIssue =
  | { code: "empty" }
  | { code: "too-long"; length: number }
  | { code: "space" }
  | { code: "emoji"; chars: string[] }
  | { code: "invisible" }
  | { code: "symbol"; chars: string[] }
  | { code: "letter"; chars: string[] };

export interface TagCheck {
  status: TagStatus;
  length: number;
  issues: TagIssue[];
}

/** ASCII punctuation – Discord accepts "certain" of these; which ones isn't documented. */
const ASCII_SYMBOL = /^[!-/:-@[-`{-~]$/;

export function classifyChar(ch: string): CharClass {
  if (/^[A-Za-z0-9]$/.test(ch)) return "alnum";
  if (/^\s$/u.test(ch) || ch === "ㅤ" || ch === "⠀") return "space";
  if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(ch)) return "emoji";
  if (/^[\p{Cf}\p{Cc}\p{M}]+$/u.test(ch)) return "invisible";
  if (ASCII_SYMBOL.test(ch)) return "symbol";
  return "letter"; // ä, é, Greek, Cyrillic, 𝐁𝐨𝐥𝐝, ★ …
}

/** Grapheme-ish split: keeps emoji sequences together so "👩‍💻" counts as one. */
export function splitChars(text: string): string[] {
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  if (Seg) return Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  return Array.from(text);
}

export function checkTag(tag: string): TagCheck {
  const chars = splitChars(tag);
  const issues: TagIssue[] = [];
  if (!chars.length) return { status: "invalid", length: 0, issues: [{ code: "empty" }] };
  if (chars.length > MAX_TAG) issues.push({ code: "too-long", length: chars.length });
  const by = (c: CharClass) => Array.from(new Set(chars.filter((x) => classifyChar(x) === c)));
  if (by("space").length) issues.push({ code: "space" });
  const emoji = by("emoji");
  if (emoji.length) issues.push({ code: "emoji", chars: emoji });
  if (by("invisible").length) issues.push({ code: "invisible" });
  const sym = by("symbol");
  if (sym.length) issues.push({ code: "symbol", chars: sym });
  const letters = by("letter");
  if (letters.length) issues.push({ code: "letter", chars: letters });
  const hard = issues.some((i) => i.code === "too-long" || i.code === "space" || i.code === "emoji" || i.code === "invisible" || i.code === "empty");
  const status: TagStatus = hard ? "invalid" : issues.length ? "warn" : "ok";
  return { status, length: chars.length, issues };
}

/** Turns a server name into plain uppercase words (umlauts → AE/OE/UE, ß → SS). */
export function words(name: string): string[] {
  const t = name
    .normalize("NFC")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2"); // camelCase → camel Case
  return t
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toUpperCase());
}

const STOP = new Set(["THE", "DER", "DIE", "DAS", "DEN", "OF", "AND", "UND", "A", "AN", "EIN", "EINE", "VON", "FUER", "FOR"]);

/** Tag ideas from a server name, best first. All results are 2–4 characters of A–Z/0–9 (optionally one symbol). */
export function generateTags(serverName: string, withSymbols = true): string[] {
  const all = words(serverName);
  const digits = all.filter((w) => /^[0-9]+$/.test(w)).join("");
  const alpha = all.filter((w) => /[A-Z]/.test(w));
  const ws = alpha.filter((w) => !STOP.has(w)).length ? alpha.filter((w) => !STOP.has(w)) : alpha;
  if (!ws.length) return digits.length >= 2 ? [digits.slice(-4)] : [];
  const letters = ws.join("").replace(/[0-9]/g, "") || ws.join("");
  const out: string[] = [];
  const add = (t: string) => {
    const v = t.slice(0, MAX_TAG);
    if (v.length >= 2 && !out.includes(v)) out.push(v);
  };
  const initials = ws.map((w) => w[0]).join("");
  if (ws.length >= 2) add(initials);
  add(ws[0].slice(0, 4));
  add(ws[0].slice(0, 3));
  if (ws.length >= 2) add(ws[0].slice(0, 2) + ws[1].slice(0, 2));
  if (ws.length >= 2) add(ws[0][0] + ws[1].slice(0, 3));
  // Consonant skeleton: "GAMING" → "GMNG"
  const skel = letters[0] + letters.slice(1).replace(/[AEIOU]/g, "");
  add(skel);
  if (ws.length >= 2) add(ws[0][0] + ws[ws.length - 1].slice(-3));
  if (digits) add((initials.length >= 2 ? initials.slice(0, 4 - Math.min(2, digits.length)) : ws[0].slice(0, 2)) + digits.slice(-2));
  else {
    add((ws.length >= 2 ? initials.slice(0, 3) : ws[0].slice(0, 3)) + "1");
    add((ws.length >= 2 ? initials.slice(0, 2) : ws[0].slice(0, 2)) + "24".slice(0, 2));
  }
  add(letters[0] + letters[letters.length - 1]);
  // Mixed case looks softer for community servers.
  const soft = ws[0].slice(0, 4);
  if (soft.length >= 3) add(soft[0] + soft.slice(1).toLowerCase());
  if (withSymbols) {
    const base = ws.length >= 2 ? initials.slice(0, 3) : ws[0].slice(0, 3);
    add(base + "!");
    add("#" + base);
  }
  return out.filter((t) => checkTag(t).status !== "invalid").slice(0, 14);
}

export const IDEAS: { id: string; name: { de: string; en: string }; tags: string[] }[] = [
  { id: "gaming", name: { de: "Gaming", en: "Gaming" }, tags: ["GG", "PRO", "MVP", "EZ", "AFK", "1V1", "GGWP", "FRAG", "LOOT", "RAID", "NOOB", "CLAN"] },
  { id: "community", name: { de: "Community", en: "Community" }, tags: ["CREW", "FAM", "HOME", "VIBE", "SQD", "GANG", "HUB", "CLUB", "TEAM", "MATE"] },
  { id: "fun", name: { de: "Spaß & Memes", en: "Fun & memes" }, tags: ["LOL", "XD", "BRUH", "MEOW", "UWU", "OWO", "W", "SUS", "NPC", "LMAO"] },
  { id: "creative", name: { de: "Kreativ", en: "Creative" }, tags: ["ART", "LOFI", "BEAT", "DJ", "PIXL", "CODE", "DEV", "DRAW", "FILM", "SNAP"] },
  { id: "study", name: { de: "Lernen", en: "Study" }, tags: ["STDY", "EXAM", "NOTE", "MATH", "UNI", "ABI", "IT", "LERN", "BIO", "CS"] },
  { id: "german", name: { de: "Deutsch", en: "German" }, tags: ["MOIN", "DE", "BRO", "LOS", "GEIL", "OIDA", "NRW", "BLN", "HH", "MUC"] },
  { id: "symbols", name: { de: "Mit Zeichen", en: "With symbols" }, tags: ["GG!", "#1", "<3", "XO!", ":D", "VIP+", "EU-1", "LV.9"] },
];
