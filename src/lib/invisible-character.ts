/**
 * Invisible and blank characters for Discord, plus a detector for hidden characters in text.
 * "Works" values are community experience (Oct 2026), not documented by Discord – Discord can block any of them.
 */

export type Support = "yes" | "often" | "no" | "unknown";

export interface InvisibleChar {
  cp: number;
  name: string;
  /** Takes up space like a letter (true) or has zero width (false). */
  wide: boolean;
  /** Blank display name / nickname on its own */
  name_: Support;
  /** Message that looks empty / blank lines */
  message: Support;
  note: { de: string; en: string };
}

export const CANDIDATES: InvisibleChar[] = [
  {
    cp: 0x3164, name: "HANGUL FILLER", wide: true, name_: "often", message: "yes",
    note: { de: "Der Klassiker für leere Namen. Discord blockt ihn zeitweise für Benutzernamen, im Anzeigenamen klappt er meist.", en: "The classic for blank names. Discord has blocked it at times; in display names it usually works." },
  },
  {
    cp: 0x2800, name: "BRAILLE PATTERN BLANK", wide: true, name_: "often", message: "yes",
    note: { de: "Beste Wahl für leere Nachrichten und Leerzeilen. Wird nicht weggekürzt wie normale Leerzeichen.", en: "Best choice for empty messages and blank lines. Not trimmed like normal spaces." },
  },
  {
    cp: 0xffa0, name: "HALFWIDTH HANGUL FILLER", wide: true, name_: "unknown", message: "yes",
    note: { de: "Schmalere Variante des Hangul-Füllzeichens. Ausweichkandidat, wenn U+3164 abgelehnt wird.", en: "Narrower Hangul filler. A fallback when U+3164 is rejected." },
  },
  {
    cp: 0x115f, name: "HANGUL CHOSEONG FILLER", wide: true, name_: "unknown", message: "often",
    note: { de: "Wird je nach Schrift unterschiedlich breit dargestellt.", en: "Width depends on the font." },
  },
  {
    cp: 0x200b, name: "ZERO WIDTH SPACE", wide: false, name_: "no", message: "unknown",
    note: { de: "Standard für Bots: leere Embed-Feldnamen (\\u200b) und @\u200beveryone ohne Ping. Allein wertet Discord Name oder Nachricht oft als leer.", en: "Standard for bots: empty embed field names (\\u200b) and @\u200beveryone without a ping. On its own Discord often treats the name or message as empty." },
  },
  {
    cp: 0x200c, name: "ZERO WIDTH NON-JOINER", wide: false, name_: "no", message: "unknown",
    note: { de: "Null Breite. Trennt Buchstaben, ohne Platz zu brauchen.", en: "Zero width. Separates letters without taking space." },
  },
  {
    cp: 0x2060, name: "WORD JOINER", wide: false, name_: "no", message: "unknown",
    note: { de: "Null Breite, verhindert Zeilenumbrüche.", en: "Zero width, prevents line breaks." },
  },
  {
    cp: 0x00ad, name: "SOFT HYPHEN", wide: false, name_: "no", message: "no",
    note: { de: "Nur ein Trennvorschlag – erscheint als „-“, wenn das Wort umbricht. Discord filtert es oft.", en: "Just a hyphenation hint – shows as “-” at a line break. Discord often filters it." },
  },
  {
    cp: 0x3000, name: "IDEOGRAPHIC SPACE", wide: true, name_: "no", message: "no",
    note: { de: "Breites Leerzeichen. Am Anfang und Ende wird es wie normale Leerzeichen entfernt.", en: "Wide space. Trimmed at the start and end like normal spaces." },
  },
  {
    cp: 0x2003, name: "EM SPACE", wide: true, name_: "no", message: "no",
    note: { de: "Gut für Abstände mitten im Text (z. B. Kanalnamen), aber nicht allein.", en: "Good for spacing inside text (e.g. channel names), not on its own." },
  },
  {
    cp: 0x00a0, name: "NO-BREAK SPACE", wide: true, name_: "no", message: "no",
    note: { de: "Geschütztes Leerzeichen. Hält zwei Wörter zusammen, wird an den Rändern entfernt.", en: "Keeps two words together, trimmed at the edges." },
  },
];

export const PRIMARY = 0x3164;
export const MESSAGE_BLANK = 0x2800;

export function charOf(cp: number): string {
  return String.fromCodePoint(cp);
}

export function hex(cp: number): string {
  return "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
}

/** Repeat a character. `lines` puts each one on its own line (blank lines in a message). */
export function repeatChar(cp: number, count: number, lines = false): string {
  const n = Math.max(1, Math.min(2000, Math.floor(count) || 1));
  return Array.from({ length: n }, () => charOf(cp)).join(lines ? "\n" : "");
}

const NAMES: Record<number, string> = {
  0x0009: "TAB", 0x00a0: "NO-BREAK SPACE", 0x00ad: "SOFT HYPHEN", 0x034f: "COMBINING GRAPHEME JOINER", 0x061c: "ARABIC LETTER MARK",
  0x115f: "HANGUL CHOSEONG FILLER", 0x1160: "HANGUL JUNGSEONG FILLER", 0x17b4: "KHMER VOWEL INHERENT AQ", 0x17b5: "KHMER VOWEL INHERENT AA",
  0x180e: "MONGOLIAN VOWEL SEPARATOR", 0x2000: "EN QUAD", 0x2001: "EM QUAD", 0x2002: "EN SPACE", 0x2003: "EM SPACE", 0x2004: "THREE-PER-EM SPACE",
  0x2005: "FOUR-PER-EM SPACE", 0x2006: "SIX-PER-EM SPACE", 0x2007: "FIGURE SPACE", 0x2008: "PUNCTUATION SPACE", 0x2009: "THIN SPACE", 0x200a: "HAIR SPACE",
  0x200b: "ZERO WIDTH SPACE", 0x200c: "ZERO WIDTH NON-JOINER", 0x200d: "ZERO WIDTH JOINER", 0x200e: "LEFT-TO-RIGHT MARK", 0x200f: "RIGHT-TO-LEFT MARK",
  0x2028: "LINE SEPARATOR", 0x2029: "PARAGRAPH SEPARATOR", 0x202a: "LEFT-TO-RIGHT EMBEDDING", 0x202b: "RIGHT-TO-LEFT EMBEDDING", 0x202c: "POP DIRECTIONAL FORMATTING",
  0x202d: "LEFT-TO-RIGHT OVERRIDE", 0x202e: "RIGHT-TO-LEFT OVERRIDE", 0x202f: "NARROW NO-BREAK SPACE", 0x205f: "MEDIUM MATHEMATICAL SPACE", 0x2060: "WORD JOINER",
  0x2061: "FUNCTION APPLICATION", 0x2062: "INVISIBLE TIMES", 0x2063: "INVISIBLE SEPARATOR", 0x2064: "INVISIBLE PLUS", 0x2066: "LEFT-TO-RIGHT ISOLATE",
  0x2067: "RIGHT-TO-LEFT ISOLATE", 0x2068: "FIRST STRONG ISOLATE", 0x2069: "POP DIRECTIONAL ISOLATE", 0x206a: "INHIBIT SYMMETRIC SWAPPING", 0x206f: "NOMINAL DIGIT SHAPES",
  0x2800: "BRAILLE PATTERN BLANK", 0x3000: "IDEOGRAPHIC SPACE", 0x3164: "HANGUL FILLER", 0xfeff: "ZERO WIDTH NO-BREAK SPACE (BOM)", 0xffa0: "HALFWIDTH HANGUL FILLER",
  0x1d159: "MUSICAL SYMBOL NULL NOTEHEAD", 0x1d173: "MUSICAL SYMBOL BEGIN BEAM",
};

export type HiddenKind = "blank" | "zero-width" | "bidi" | "tag" | "variation" | "control";

/** Classifies a code point that renders as nothing (or only as space). Returns null for normal characters. */
export function classify(cp: number): HiddenKind | null {
  if (cp === 0x20 || cp === 0x0a || cp === 0x0d) return null; // normal space and newlines are fine
  if (cp >= 0xe0000 && cp <= 0xe007f) return "tag"; // Unicode tags: invisible ASCII copies ("ASCII smuggling")
  if ((cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0xe0100 && cp <= 0xe01ef)) return "variation";
  if ((cp >= 0x202a && cp <= 0x202e) || (cp >= 0x2066 && cp <= 0x2069) || cp === 0x200e || cp === 0x200f || cp === 0x061c) return "bidi";
  if ([0x200b, 0x200c, 0x200d, 0x2060, 0x2061, 0x2062, 0x2063, 0x2064, 0xfeff, 0x00ad, 0x034f, 0x180e, 0x206a, 0x206b, 0x206c, 0x206d, 0x206e, 0x206f, 0x17b4, 0x17b5, 0x1d173, 0x1d174, 0x1d175, 0x1d176, 0x1d177, 0x1d178, 0x1d179, 0x1d17a].includes(cp)) return "zero-width";
  if ([0x3164, 0x2800, 0xffa0, 0x115f, 0x1160, 0x1d159].includes(cp)) return "blank";
  if (cp === 0x09 || cp === 0x00a0 || (cp >= 0x2000 && cp <= 0x200a) || cp === 0x202f || cp === 0x205f || cp === 0x3000 || cp === 0x2028 || cp === 0x2029) return "blank";
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return "control";
  return null;
}

export function nameOf(cp: number): string {
  if (NAMES[cp]) return NAMES[cp];
  if (cp >= 0xe0020 && cp <= 0xe007e) return `TAG ${JSON.stringify(String.fromCharCode(cp - 0xe0000))}`;
  if (cp >= 0xe0000 && cp <= 0xe007f) return "TAG CHARACTER";
  if (cp >= 0xfe00 && cp <= 0xfe0f) return `VARIATION SELECTOR-${cp - 0xfe00 + 1}`;
  if (cp >= 0xe0100 && cp <= 0xe01ef) return `VARIATION SELECTOR-${cp - 0xe0100 + 17}`;
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return "CONTROL CHARACTER";
  return "INVISIBLE CHARACTER";
}

export type Segment = { type: "text"; value: string } | { type: "hidden"; cp: number; kind: HiddenKind; name: string };

/** Splits text into visible runs and single hidden characters. */
export function scan(text: string): Segment[] {
  const out: Segment[] = [];
  let buf = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const kind = classify(cp);
    // A variation selector right after an emoji is normal (❤️) – keep it as text.
    if (kind === "variation" && cp === 0xfe0f && buf && /\p{Extended_Pictographic}$/u.test(buf)) {
      buf += ch;
      continue;
    }
    // ZWJ inside emoji sequences (👩‍💻) is normal too.
    if (cp === 0x200d && buf && /\p{Extended_Pictographic}️?$/u.test(buf)) {
      buf += ch;
      continue;
    }
    if (kind) {
      if (buf) out.push({ type: "text", value: buf });
      buf = "";
      out.push({ type: "hidden", cp, kind, name: nameOf(cp) });
    } else buf += ch;
  }
  if (buf) out.push({ type: "text", value: buf });
  return out;
}

export interface Found {
  cp: number;
  name: string;
  kind: HiddenKind;
  count: number;
}

export function summarize(segments: Segment[]): Found[] {
  const map = new Map<number, Found>();
  for (const s of segments) {
    if (s.type !== "hidden") continue;
    const f = map.get(s.cp);
    if (f) f.count++;
    else map.set(s.cp, { cp: s.cp, name: s.name, kind: s.kind, count: 1 });
  }
  return [...map.values()].sort((x, y) => y.count - x.count || x.cp - y.cp);
}

/** Removes hidden characters. Blank-looking spaces become a normal space unless `dropBlanks` is set. */
export function clean(segments: Segment[], dropBlanks = false): string {
  return segments
    .map((s) => (s.type === "text" ? s.value : s.kind === "blank" && !dropBlanks && s.cp !== 0x2028 && s.cp !== 0x2029 ? " " : s.cp === 0x2028 || s.cp === 0x2029 ? "\n" : ""))
    .join("");
}

/** Decodes Unicode tag characters (hidden ASCII text), if any. */
export function decodeTags(text: string): string {
  let out = "";
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    if (cp >= 0xe0020 && cp <= 0xe007e) out += String.fromCharCode(cp - 0xe0000);
  }
  return out;
}
