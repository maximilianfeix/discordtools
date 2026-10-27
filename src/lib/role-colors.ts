/** Role color helpers: parsing, WCAG contrast against Discord's themes and automatic lightness fixes. */

export interface Rgb { r: number; g: number; b: number }
export interface Hsl { h: number; s: number; l: number }

export type ThemeId = "dark" | "ash" | "onyx" | "light";

/** Chat backgrounds of the current Discord client (see design research, section 5). */
export const THEMES: { id: ThemeId; label: string; bg: string; text: string; muted: string; embed: string }[] = [
  { id: "dark", label: "Dark", bg: "#1A1A1E", text: "#EFEFF1", muted: "#96979E", embed: "#242429" },
  { id: "ash", label: "Ash", bg: "#323339", text: "#F3F3F4", muted: "#ABACB2", embed: "#393A41" },
  { id: "onyx", label: "Onyx", bg: "#000000", text: "#D4D5D8", muted: "#81828A", embed: "#0A0A0C" },
  { id: "light", label: "Light", bg: "#FBFBFB", text: "#2E2E34", muted: "#6C6D76", embed: "#FFFFFF" },
];

export function normalizeHex(input: string): string | null {
  const m = input.trim().replace(/^#/, "").replace(/^0x/i, "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return /^[0-9a-f]{6}$/i.test(full) ? "#" + full.toUpperCase() : null;
}

/** Accepts #hex, hex without # or a decimal role color (0–16777215). */
export function parseColorInput(input: string): string | null {
  const t = input.trim();
  if (/^\d{1,8}$/.test(t) && !/^[0-9a-f]{6}$/i.test(t) && !/^[0-9a-f]{3}$/i.test(t)) {
    const n = parseInt(t, 10);
    return n <= 0xffffff ? decimalToHex(n) : null;
  }
  return normalizeHex(t);
}

export function hexToRgb(hex: string): Rgb {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const h = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return ("#" + h(r) + h(g) + h(b)).toUpperCase();
}

export function hexToDecimal(hex: string): number {
  return parseInt(hex.replace("#", ""), 16);
}

export function decimalToHex(n: number): string {
  return "#" + Math.max(0, Math.min(0xffffff, Math.floor(n))).toString(16).padStart(6, "0").toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === R ? (G - B) / d + (G < B ? 6 : 0) : max === G ? (B - R) / d + 2 : (R - G) / d + 4;
  h *= 60;
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const S = s / 100, Lv = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(Lv, 1 - Lv);
  const f = (n: number) => Lv - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export type Level = "AA" | "AA-large" | "fail";

/** Usernames are 16px/500 – that counts as normal text, so 4.5:1 is the real target; 3:1 is the bare minimum. */
export function level(ratio: number): Level {
  return ratio >= 4.5 ? "AA" : ratio >= 3 ? "AA-large" : "fail";
}

/**
 * Finds the closest color (same hue and saturation, only lightness changes) that reaches `target` against `bg`.
 * Returns the original color if it already passes, or null if no lightness works.
 */
export function adjustToContrast(hex: string, bg: string, target: number): string | null {
  if (contrast(hex, bg) >= target) return hex;
  const hsl = rgbToHsl(hexToRgb(hex));
  const darkBg = luminance(bg) < 0.18;
  // Move away from the background: lighter on dark themes, darker on light themes.
  let lo = hsl.l, hi = darkBg ? 100 : 0;
  const at = (l: number) => rgbToHex(hslToRgb({ ...hsl, l }));
  if (contrast(at(hi), bg) < target) return null;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (contrast(at(mid), bg) >= target) hi = mid;
    else lo = mid;
  }
  // Rounding to hex can drop the ratio by a hair – nudge until it passes.
  let l = hi;
  let out = at(l);
  for (let i = 0; i < 20 && contrast(out, bg) < target; i++) {
    l += darkBg ? 0.5 : -0.5;
    out = at(Math.max(0, Math.min(100, l)));
  }
  return contrast(out, bg) >= target ? out : null;
}

/** Default role color in Discord (no color set) shows as the normal username color. */
export const NO_COLOR = 0;

export interface PaletteSet {
  id: string;
  name: { de: string; en: string };
  colors: { name: { de: string; en: string }; hex: string }[];
}

const c = (de: string, en: string, hex: string) => ({ name: { de, en }, hex });

export const PALETTES: PaletteSet[] = [
  {
    id: "ranks", name: { de: "Rang-Leiter", en: "Rank ladder" },
    colors: [
      c("Owner", "Owner", "#E74C3C"), c("Admin", "Admin", "#E67E22"), c("Moderator", "Moderator", "#F1C40F"),
      c("Supporter", "Supporter", "#2ECC71"), c("VIP", "VIP", "#9B59B6"), c("Aktiv", "Active", "#3498DB"), c("Mitglied", "Member", "#95A5A6"),
    ],
  },
  {
    id: "pastel", name: { de: "Pastell", en: "Pastel" },
    colors: [
      c("Rosa", "Pink", "#FFB3C7"), c("Pfirsich", "Peach", "#FFCBA4"), c("Vanille", "Vanilla", "#FFF1A8"), c("Minze", "Mint", "#B5F2D0"),
      c("Himmel", "Sky", "#AFD8FF"), c("Lavendel", "Lavender", "#D3C4FF"), c("Flieder", "Lilac", "#F0C2F0"),
    ],
  },
  {
    id: "neon", name: { de: "Neon", en: "Neon" },
    colors: [
      c("Neon-Pink", "Neon pink", "#FF2E97"), c("Neon-Orange", "Neon orange", "#FF7A00"), c("Neon-Gelb", "Neon yellow", "#F5FF3B"),
      c("Neon-Grün", "Neon green", "#39FF14"), c("Cyan", "Cyan", "#00F0FF"), c("Neon-Blau", "Neon blue", "#4D6BFF"), c("Neon-Lila", "Neon purple", "#B026FF"),
    ],
  },
  {
    id: "discord", name: { de: "Discord-Standard", en: "Discord defaults" },
    colors: [
      c("Türkis", "Teal", "#1ABC9C"), c("Grün", "Green", "#2ECC71"), c("Blau", "Blue", "#3498DB"), c("Lila", "Purple", "#9B59B6"),
      c("Magenta", "Magenta", "#E91E63"), c("Gold", "Gold", "#F1C40F"), c("Orange", "Orange", "#E67E22"), c("Rot", "Red", "#E74C3C"),
      c("Grau", "Grey", "#95A5A6"), c("Blaugrau", "Navy grey", "#607D8B"),
    ],
  },
  {
    id: "medals", name: { de: "Level & Medaillen", en: "Levels & medals" },
    colors: [
      c("Bronze", "Bronze", "#CD7F32"), c("Silber", "Silver", "#C0C0C0"), c("Gold", "Gold", "#FFD700"), c("Platin", "Platinum", "#9FE2E8"),
      c("Diamant", "Diamond", "#7FB8FF"), c("Meister", "Master", "#C77DFF"), c("Legende", "Legend", "#FF5C5C"),
    ],
  },
  {
    id: "earth", name: { de: "Natur", en: "Earthy" },
    colors: [
      c("Moos", "Moss", "#8A9A5B"), c("Salbei", "Sage", "#A3B18A"), c("Sand", "Sand", "#D8C3A5"), c("Terrakotta", "Terracotta", "#E07A5F"),
      c("Ozean", "Ocean", "#3D8FB0"), c("Wald", "Forest", "#4F7942"), c("Holz", "Wood", "#A0785A"),
    ],
  },
];

/** Popular two-color gradients for Enhanced Role Styles. */
export const GRADIENTS: { name: { de: string; en: string }; a: string; b: string }[] = [
  { name: { de: "Sonnenuntergang", en: "Sunset" }, a: "#FF6B6B", b: "#FFD93D" },
  { name: { de: "Ozean", en: "Ocean" }, a: "#00C6FF", b: "#0072FF" },
  { name: { de: "Aurora", en: "Aurora" }, a: "#43E97B", b: "#38F9D7" },
  { name: { de: "Zuckerwatte", en: "Cotton candy" }, a: "#FF9A9E", b: "#A18CD1" },
  { name: { de: "Feuer", en: "Fire" }, a: "#F83600", b: "#F9D423" },
  { name: { de: "Galaxie", en: "Galaxy" }, a: "#8E2DE2", b: "#4A00E0" },
  { name: { de: "Minze", en: "Mint" }, a: "#3EE0A8", b: "#7FB8FF" },
  { name: { de: "Kirsche", en: "Cherry" }, a: "#EB3349", b: "#F45C43" },
];
