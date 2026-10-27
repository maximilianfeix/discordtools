/** Color parsing and conversion for Discord embed and role colors (24-bit integers). */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export type ColorSource = "hex" | "decimal" | "rgb" | "hsl" | "0x";

export interface ParsedColor {
  int: number;
  source: ColorSource;
  /** e.g. pure digits like "123456" are read as decimal; we tell the user */
  ambiguous?: boolean;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function parseColor(input: string): ParsedColor | null {
  const s = input.trim().toLowerCase().replace(/;$/, "");
  if (!s) return null;
  let m = s.match(/^0x([0-9a-f]{1,6})$/);
  if (m) return { int: parseInt(m[1]!, 16), source: "0x" };
  m = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) return { int: hexBody(m[1]!), source: "hex" };
  if (/^\d{1,8}$/.test(s)) {
    const n = Number(s);
    if (n > 0xffffff) return null;
    return { int: n, source: "decimal", ambiguous: s.length === 6 || s.length === 3 };
  }
  m = s.match(/^([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (m) return { int: hexBody(m[1]!), source: "hex" };
  m = s.match(/^rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/) ?? s.match(/^(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})$/);
  if (m) {
    const [r, g, b] = [m[1], m[2], m[3]].map(Number) as [number, number, number];
    if (r > 255 || g > 255 || b > 255) return null;
    return { int: rgbToInt({ r, g, b }), source: "rgb" };
  }
  m = s.match(/^hsla?\(\s*(-?[\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/);
  if (m) {
    const h = Number(m[1]);
    const sat = Number(m[2]);
    const l = Number(m[3]);
    if (sat > 100 || l > 100) return null;
    return { int: rgbToInt(hslToRgb({ h, s: sat, l })), source: "hsl" };
  }
  return null;
}

function hexBody(h: string): number {
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return parseInt(full, 16);
}

export function intToRgb(n: number): Rgb {
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
export function rgbToInt({ r, g, b }: Rgb): number {
  return ((clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255)) >>> 0;
}
export function intToHex(n: number, upper = true): string {
  const h = "#" + (n & 0xffffff).toString(16).padStart(6, "0");
  return upper ? h.toUpperCase() : h;
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const max = Math.max(R, G, B),
    min = Math.min(R, G, B);
  const l = (max + min) / 2;
  let h = 0,
    s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === R) h = (G - B) / d + (G < B ? 6 : 0);
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const S = clamp(s, 0, 100) / 100;
  const L = clamp(l, 0, 100) / 100;
  const H = (((h % 360) + 360) % 360) / 360;
  if (S === 0) {
    const v = Math.round(L * 255);
    return { r: v, g: v, b: v };
  }
  const q = L < 0.5 ? L * (1 + S) : L + S - L * S;
  const p = 2 * L - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return { r: Math.round(f(H + 1 / 3) * 255), g: Math.round(f(H) * 255), b: Math.round(f(H - 1 / 3) * 255) };
}

export function formatRgb(n: number): string {
  const { r, g, b } = intToRgb(n);
  return `rgb(${r}, ${g}, ${b})`;
}
export function formatHsl(n: number): string {
  const { h, s, l } = rgbToHsl(intToRgb(n));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** WCAG relative luminance */
export function luminance(n: number): number {
  const { r, g, b } = intToRgb(n);
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrastRatio(a: number, b: number): number {
  const la = luminance(a),
    lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export type ContrastGrade = "good" | "ok" | "poor";
/** good ≥ 4.5 (body text, AA), ok ≥ 3 (large/bold text like usernames), else poor. */
export function grade(ratio: number): ContrastGrade {
  return ratio >= 4.5 ? "good" : ratio >= 3 ? "ok" : "poor";
}

/** Chat backgrounds of Discord's four themes (live client, 2026-10). */
export const DISCORD_BACKGROUNDS = [
  { id: "dark", name: "Dark", bg: 0x1a1a1e },
  { id: "ash", name: "Ash", bg: 0x323339 },
  { id: "onyx", name: "Onyx", bg: 0x000000 },
  { id: "light", name: "Light", bg: 0xfbfbfb },
] as const;

/** Black or white, whichever reads better on the color (for swatch labels). */
export function readableOn(n: number): "#000000" | "#FFFFFF" {
  return contrastRatio(n, 0x000000) >= contrastRatio(n, 0xffffff) ? "#000000" : "#FFFFFF";
}

export interface PaletteColor {
  hex: string;
  name: { de: string; en: string };
}

/** Semantic colors that read well in all themes, for bot replies. */
export const SEMANTIC: PaletteColor[] = [
  { hex: "#57F287", name: { de: "Erfolg", en: "Success" } },
  { hex: "#FEE75C", name: { de: "Warnung", en: "Warning" } },
  { hex: "#ED4245", name: { de: "Fehler", en: "Error" } },
  { hex: "#5865F2", name: { de: "Info (Blurple)", en: "Info (Blurple)" } },
  { hex: "#EB459E", name: { de: "Hervorheben", en: "Highlight" } },
  { hex: "#99AAB5", name: { de: "Neutral", en: "Neutral" } },
];

/** The 20 preset swatches of Discord's role color picker. */
export const ROLE_PRESETS: PaletteColor[] = [
  { hex: "#1ABC9C", name: { de: "Türkis", en: "Aqua" } },
  { hex: "#2ECC71", name: { de: "Grün", en: "Green" } },
  { hex: "#3498DB", name: { de: "Blau", en: "Blue" } },
  { hex: "#9B59B6", name: { de: "Lila", en: "Purple" } },
  { hex: "#E91E63", name: { de: "Pink", en: "Vivid pink" } },
  { hex: "#F1C40F", name: { de: "Gold", en: "Gold" } },
  { hex: "#E67E22", name: { de: "Orange", en: "Orange" } },
  { hex: "#E74C3C", name: { de: "Rot", en: "Red" } },
  { hex: "#95A5A6", name: { de: "Grau", en: "Grey" } },
  { hex: "#607D8B", name: { de: "Blaugrau", en: "Blue grey" } },
  { hex: "#11806A", name: { de: "Dunkeltürkis", en: "Dark aqua" } },
  { hex: "#1F8B4C", name: { de: "Dunkelgrün", en: "Dark green" } },
  { hex: "#206694", name: { de: "Dunkelblau", en: "Dark blue" } },
  { hex: "#71368A", name: { de: "Dunkellila", en: "Dark purple" } },
  { hex: "#AD1457", name: { de: "Dunkelpink", en: "Dark vivid pink" } },
  { hex: "#C27C0E", name: { de: "Dunkelgold", en: "Dark gold" } },
  { hex: "#A84300", name: { de: "Dunkelorange", en: "Dark orange" } },
  { hex: "#992D22", name: { de: "Dunkelrot", en: "Dark red" } },
  { hex: "#979C9F", name: { de: "Dunkelgrau", en: "Dark grey" } },
  { hex: "#546E7A", name: { de: "Schiefer", en: "Slate" } },
];

/** Hand-picked embed accents that look good on dark and light themes. */
export const EMBED_PICKS: PaletteColor[] = [
  { hex: "#3EE0A8", name: { de: "Minze", en: "Mint" } },
  { hex: "#00B0F4", name: { de: "Himmelblau", en: "Sky" } },
  { hex: "#7C5CFF", name: { de: "Violett", en: "Violet" } },
  { hex: "#FF7A59", name: { de: "Koralle", en: "Coral" } },
  { hex: "#FFB020", name: { de: "Bernstein", en: "Amber" } },
  { hex: "#2DD4BF", name: { de: "Petrol", en: "Teal" } },
  { hex: "#F472B6", name: { de: "Rosa", en: "Rose" } },
  { hex: "#A3E635", name: { de: "Limette", en: "Lime" } },
  { hex: "#242429", name: { de: "Fast unsichtbar (Dark)", en: "Near invisible (Dark)" } },
  { hex: "#FFFFFF", name: { de: "Weiß", en: "White" } },
];

/** Code snippets for the common libraries. */
export function snippets(n: number): { label: string; code: string }[] {
  const hex = intToHex(n).slice(1);
  return [
    { label: "JSON (Webhook / API)", code: `"color": ${n}` },
    { label: "discord.js", code: `.setColor(0x${hex})` },
    { label: "discord.py", code: `discord.Color(0x${hex})` },
    { label: "JDA / Java", code: `.setColor(0x${hex})` },
  ];
}
