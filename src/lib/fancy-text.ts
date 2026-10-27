/**
 * Unicode "fonts" for Discord display names, nicknames, bios and channel names.
 * They are not fonts: every letter is swapped for a different Unicode code point
 * (mostly from the Mathematical Alphanumeric Symbols block). Characters without a
 * mapping (umlauts, ß, emoji, punctuation) are kept, so nothing gets lost.
 */

export type Lang2 = "de" | "en";

/** How screen readers cope: "poor" = read as symbol names or letter by letter, "bad" = mostly skipped or nonsense. */
export type ScreenReader = "poor" | "bad";

export interface FancyStyle {
  id: string;
  name: Record<Lang2, string>;
  sr: ScreenReader;
  /** Only some letters exist in this style (e.g. superscript, subscript). */
  partial?: boolean;
  /** Turns the text upside down: the result is reversed. */
  reverse?: boolean;
  /** Apply the style to the base letter of ä/ö/ü/é … and keep the accent as a combining mark. */
  keepMarks: boolean;
  map: (ch: string) => string | undefined;
}

const A = 65, a = 97, ZERO = 48;
const cp = (n: number) => String.fromCodePoint(n);

/** Mathematical alphanumeric block: upper/lower/digit start points plus the historic "holes". */
function mathMap(upper: number, lower: number, digit: number | null, holes: Record<string, number> = {}) {
  return (ch: string): string | undefined => {
    if (holes[ch] !== undefined) return cp(holes[ch]);
    const c = ch.charCodeAt(0);
    if (ch.length !== 1) return undefined;
    if (c >= 65 && c <= 90) return cp(upper + c - A);
    if (c >= 97 && c <= 122) return cp(lower + c - a);
    if (digit !== null && c >= 48 && c <= 57) return cp(digit + c - ZERO);
    return undefined;
  };
}

function tableMap(table: Record<string, string>, fallbackLower = false) {
  return (ch: string): string | undefined => {
    if (table[ch] !== undefined) return table[ch];
    if (fallbackLower) {
      const lo = ch.toLowerCase();
      if (lo !== ch && table[lo] !== undefined) return table[lo];
    }
    return undefined;
  };
}

function zip(from: string, to: string): Record<string, string> {
  const f = Array.from(from), t = Array.from(to);
  const out: Record<string, string> = {};
  f.forEach((c, i) => {
    if (t[i] !== undefined && t[i] !== "_") out[c] = t[i];
  });
  return out;
}

const SMALL_CAPS = zip("abcdefghijklmnopqrstuvwxyz", "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀꜱᴛᴜᴠᴡxʏᴢ");
const SUPER = {
  ...zip("abcdefghijklmnoprstuvwxyz0123456789+-=()", "ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁼⁽⁾"),
  ...zip("ABDEGHIJKLMNOPRTUVW", "ᴬᴮᴰᴱᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴿᵀᵁⱽᵂ"),
};
const SUB = zip("aehijklmnoprstuvx0123456789+-=()", "ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ₀₁₂₃₄₅₆₇₈₉₊₋₌₍₎");
const FLIP = {
  ...zip("abcdefghijklmnopqrstuvwxyz", "ɐqɔpǝɟƃɥᴉɾʞlɯuodbɹsʇnʌʍxʎz"),
  ...zip("ABCDEFGHIJKLMNOPQRSTUVWXYZ", "∀ᗺƆᗡƎℲ⅁HIſꓘ˥WNOԀῸᴚS⊥∩ΛMX⅄Z"),
  ...zip("0123456789", "0ƖᄅƐㄣϛ9ㄥ86"),
  ...zip(".,?!'\"()[]{}<>_&;", "˙'¿¡,„)(][}{><‾⅋؛"),
};

function enclosed(upper: number | null, lower: number | null, digits: (n: number) => number | undefined) {
  return (ch: string): string | undefined => {
    const c = ch.length === 1 ? ch.charCodeAt(0) : -1;
    if (c >= 65 && c <= 90) return upper !== null ? cp(upper + c - A) : lower !== null ? cp(lower + c - A) : undefined;
    if (c >= 97 && c <= 122) return lower !== null ? cp(lower + c - a) : upper !== null ? cp(upper + c - a) : undefined;
    if (c >= 48 && c <= 57) {
      const d = digits(c - ZERO);
      return d !== undefined ? cp(d) : undefined;
    }
    return undefined;
  };
}

function combining(mark: string) {
  return (ch: string): string | undefined => (ch === "\n" ? undefined : ch + mark);
}

const fullwidth = (ch: string): string | undefined => {
  if (ch === " ") return "　";
  const c = ch.length === 1 ? ch.charCodeAt(0) : -1;
  return c >= 0x21 && c <= 0x7e ? cp(c - 0x21 + 0xff01) : undefined;
};

export const STYLES: FancyStyle[] = [
  { id: "bold", name: { de: "Fett (Serif)", en: "Bold (serif)" }, sr: "poor", keepMarks: true, map: mathMap(0x1d400, 0x1d41a, 0x1d7ce) },
  { id: "italic", name: { de: "Kursiv (Serif)", en: "Italic (serif)" }, sr: "poor", keepMarks: true, map: mathMap(0x1d434, 0x1d44e, null, { h: 0x210e }) },
  { id: "bold-italic", name: { de: "Fett kursiv (Serif)", en: "Bold italic (serif)" }, sr: "poor", keepMarks: true, map: mathMap(0x1d468, 0x1d482, null) },
  { id: "sans", name: { de: "Sans", en: "Sans" }, sr: "poor", keepMarks: true, map: mathMap(0x1d5a0, 0x1d5ba, 0x1d7e2) },
  { id: "sans-bold", name: { de: "Sans fett", en: "Sans bold" }, sr: "poor", keepMarks: true, map: mathMap(0x1d5d4, 0x1d5ee, 0x1d7ec) },
  { id: "sans-italic", name: { de: "Sans kursiv", en: "Sans italic" }, sr: "poor", keepMarks: true, map: mathMap(0x1d608, 0x1d622, null) },
  { id: "sans-bold-italic", name: { de: "Sans fett kursiv", en: "Sans bold italic" }, sr: "poor", keepMarks: true, map: mathMap(0x1d63c, 0x1d656, null) },
  {
    id: "script", name: { de: "Schreibschrift", en: "Script" }, sr: "poor", keepMarks: true,
    map: mathMap(0x1d49c, 0x1d4b6, null, { B: 0x212c, E: 0x2130, F: 0x2131, H: 0x210b, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211b, e: 0x212f, g: 0x210a, o: 0x2134 }),
  },
  { id: "bold-script", name: { de: "Schreibschrift fett", en: "Bold script" }, sr: "poor", keepMarks: true, map: mathMap(0x1d4d0, 0x1d4ea, null) },
  {
    id: "fraktur", name: { de: "Fraktur", en: "Fraktur" }, sr: "poor", keepMarks: true,
    map: mathMap(0x1d504, 0x1d51e, null, { C: 0x212d, H: 0x210c, I: 0x2111, R: 0x211c, Z: 0x2128 }),
  },
  { id: "bold-fraktur", name: { de: "Fraktur fett", en: "Bold fraktur" }, sr: "poor", keepMarks: true, map: mathMap(0x1d56c, 0x1d586, null) },
  {
    id: "double", name: { de: "Doppelstrich", en: "Double-struck" }, sr: "poor", keepMarks: true,
    map: mathMap(0x1d538, 0x1d552, 0x1d7d8, { C: 0x2102, H: 0x210d, N: 0x2115, P: 0x2119, Q: 0x211a, R: 0x211d, Z: 0x2124 }),
  },
  { id: "mono", name: { de: "Monospace", en: "Monospace" }, sr: "poor", keepMarks: true, map: mathMap(0x1d670, 0x1d68a, 0x1d7f6) },
  { id: "small-caps", name: { de: "Kapitälchen", en: "Small caps" }, sr: "bad", keepMarks: true, map: tableMap(SMALL_CAPS, true) },
  { id: "fullwidth", name: { de: "Breit (Vaporwave)", en: "Fullwidth (vaporwave)" }, sr: "poor", keepMarks: true, map: fullwidth },
  {
    id: "circled", name: { de: "Blasen", en: "Bubble" }, sr: "bad", keepMarks: false,
    map: enclosed(0x24b6, 0x24d0, (d) => (d === 0 ? 0x24ea : 0x2460 + d - 1)),
  },
  {
    id: "circled-neg", name: { de: "Blasen dunkel", en: "Dark bubble" }, sr: "bad", keepMarks: false,
    map: enclosed(0x1f150, null, (d) => (d === 0 ? 0x24ff : 0x2776 + d - 1)),
  },
  { id: "squared", name: { de: "Kästchen", en: "Squared" }, sr: "bad", keepMarks: false, map: enclosed(0x1f130, null, () => undefined) },
  { id: "squared-neg", name: { de: "Kästchen dunkel", en: "Dark squared" }, sr: "bad", keepMarks: false, map: enclosed(0x1f170, null, () => undefined) },
  {
    id: "parens", name: { de: "In Klammern", en: "Parenthesized" }, sr: "bad", keepMarks: false,
    map: enclosed(null, 0x249c, (d) => (d === 0 ? undefined : 0x2474 + d - 1)),
  },
  { id: "superscript", name: { de: "Hochgestellt", en: "Superscript" }, sr: "bad", partial: true, keepMarks: true, map: tableMap(SUPER, true) },
  { id: "subscript", name: { de: "Tiefgestellt", en: "Subscript" }, sr: "bad", partial: true, keepMarks: true, map: tableMap(SUB, true) },
  { id: "upside-down", name: { de: "Kopfüber", en: "Upside down" }, sr: "bad", reverse: true, keepMarks: true, map: tableMap(FLIP) },
  { id: "strike", name: { de: "Durchgestrichen", en: "Strikethrough" }, sr: "poor", keepMarks: true, map: combining("̶") },
  { id: "underline", name: { de: "Unterstrichen", en: "Underline" }, sr: "poor", keepMarks: true, map: combining("̲") },
  { id: "double-underline", name: { de: "Doppelt unterstrichen", en: "Double underline" }, sr: "poor", keepMarks: true, map: combining("̳") },
  { id: "slash", name: { de: "Schräg durchgestrichen", en: "Slashed" }, sr: "poor", keepMarks: true, map: combining("̸") },
];

const MARK = /\p{M}/u;

/** Marks above get flipped to marks below for upside-down text (ä → ɐ̤). */
const FLIP_MARKS: Record<string, string> = { "̈": "̤", "́": "̖", "̀": "̗", "̂": "̭", "̊": "̥", "̃": "̰" };

/** Applies one style. Umlauts and accents keep their mark; ß and unknown characters stay as they are. */
export function applyStyle(text: string, style: FancyStyle): string {
  const out: string[] = [];
  for (const ch of Array.from(text.normalize("NFC"))) {
    const direct = style.map(ch);
    if (direct !== undefined) {
      out.push(direct);
      continue;
    }
    const parts = Array.from(ch.normalize("NFD"));
    if (style.keepMarks && parts.length > 1 && parts.slice(1).every((p) => MARK.test(p))) {
      const base = style.map(parts[0]);
      if (base !== undefined) {
        const marks = parts.slice(1).map((m) => (style.reverse ? FLIP_MARKS[m] ?? m : m));
        // Combining styles already append their own mark to the base, the accent goes on top.
        out.push(base + marks.join(""));
        continue;
      }
    }
    out.push(ch);
  }
  if (!style.reverse) return out.join("");
  // Reverse by cluster, so a letter keeps its combining marks.
  return out.reverse().join("");
}

export function styleById(id: string): FancyStyle | undefined {
  return STYLES.find((s) => s.id === id);
}

/** Fraction of letters/digits the style actually changed (for partial styles like superscript). */
export function coverage(text: string, style: FancyStyle): number {
  const chars = Array.from(text.normalize("NFC")).filter((c) => /[\p{L}\p{N}]/u.test(c));
  if (!chars.length) return 1;
  const hit = chars.filter((c) => {
    if (style.map(c) !== undefined) return true;
    const base = c.normalize("NFD")[0];
    return style.keepMarks && base !== c && style.map(base) !== undefined;
  }).length;
  return hit / chars.length;
}

/** Number of Unicode code points – a styled letter is one code point but often two UTF-16 units. */
export function codePointLength(text: string): number {
  return Array.from(text).length;
}

/**
 * Discord usernames: 2–32 characters, a–z, 0–9, "_" and "." only, no "..".
 * Converts any text into the closest valid username (umlauts become ae/oe/ue, ß becomes ss).
 */
export function toUsername(text: string): string {
  const t = text
    .normalize("NFC")
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
    .replace(/Ä/g, "Ae").replace(/Ö/g, "Oe").replace(/Ü/g, "Ue").replace(/ß/g, "ss")
    .normalize("NFKD") // also folds 𝐁𝐨𝐥𝐝 and ｆｕｌｌｗｉｄｔｈ back to plain letters
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_.]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/_{2,}/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "");
  return t.slice(0, 32);
}

export function isValidUsername(name: string): boolean {
  return /^[a-z0-9_.]{2,32}$/.test(name) && !name.includes("..");
}
