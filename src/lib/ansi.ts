/** SGR codes Discord renders inside ```ansi code blocks (desktop + web clients). */
export const ANSI_FG = [
  { code: 30, name: "gray", hex: "#4f545c" },
  { code: 31, name: "red", hex: "#dc322f" },
  { code: 32, name: "green", hex: "#859900" },
  { code: 33, name: "yellow", hex: "#b58900" },
  { code: 34, name: "blue", hex: "#268bd2" },
  { code: 35, name: "pink", hex: "#d33682" },
  { code: 36, name: "cyan", hex: "#2aa198" },
  { code: 37, name: "white", hex: "#ffffff" },
] as const;

export const ANSI_BG = [
  { code: 40, name: "firefly-dark-blue", hex: "#002b36" },
  { code: 41, name: "orange", hex: "#cb4b16" },
  { code: 42, name: "marble-blue", hex: "#586e75" },
  { code: 43, name: "greyish-turquoise", hex: "#657b83" },
  { code: 44, name: "gray", hex: "#839496" },
  { code: 45, name: "indigo", hex: "#6c71c4" },
  { code: 46, name: "light-gray", hex: "#93a1a1" },
  { code: 47, name: "white", hex: "#fdf6e3" },
] as const;

export interface AnsiStyle {
  fg?: number;
  bg?: number;
  bold?: boolean;
  underline?: boolean;
}

export interface AnsiSpan {
  text: string;
  style: AnsiStyle;
}

const ESC = "\u001b";

function sgr(style: AnsiStyle): string {
  const codes = [0];
  if (style.bold) codes.push(1);
  if (style.underline) codes.push(4);
  if (style.fg) codes.push(style.fg);
  if (style.bg) codes.push(style.bg);
  return `${ESC}[${codes.join(";")}m`;
}

function sameStyle(a: AnsiStyle, b: AnsiStyle): boolean {
  return !!a.bold === !!b.bold && !!a.underline === !!b.underline && a.fg === b.fg && a.bg === b.bg;
}

/** Turns styled spans into the text a user pastes into Discord (wrapped in an ansi code block). */
export function spansToAnsi(spans: AnsiSpan[], wrap = true): string {
  let out = "";
  let current: AnsiStyle = {};
  for (const span of spans) {
    if (!span.text) continue;
    if (!sameStyle(span.style, current)) {
      out += sgr(span.style);
      current = span.style;
    }
    out += span.text;
  }
  if (Object.keys(current).length) out += `${ESC}[0m`;
  return wrap ? "```ansi\n" + out + "\n```" : out;
}

/** Parses ANSI text (with or without the code fence) back into spans for editing/preview. */
export function ansiToSpans(input: string): AnsiSpan[] {
  const body = input.replace(/^```ansi\n?/, "").replace(/\n?```\s*$/, "");
  const spans: AnsiSpan[] = [];
  let style: AnsiStyle = {};
  const re = /\u001b\[([\d;]*)m/g;
  let last = 0;
  for (const m of body.matchAll(re)) {
    if (m.index! > last) spans.push({ text: body.slice(last, m.index), style: { ...style } });
    for (const raw of (m[1] || "0").split(";")) {
      const c = Number(raw);
      if (c === 0) style = {};
      else if (c === 1) style.bold = true;
      else if (c === 4) style.underline = true;
      else if (c >= 30 && c <= 37) style.fg = c;
      else if (c >= 40 && c <= 47) style.bg = c;
    }
    last = m.index! + m[0].length;
  }
  if (last < body.length) spans.push({ text: body.slice(last), style: { ...style } });
  return spans;
}
