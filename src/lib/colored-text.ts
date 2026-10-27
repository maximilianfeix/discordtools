/**
 * Editing model for the ANSI colored-text editor: plain text plus one style per UTF-16 unit.
 * Keeps styles aligned with the text when the user types, pastes or deletes in a textarea.
 */
import { ANSI_BG, ANSI_FG, ansiToSpans, spansToAnsi, type AnsiSpan, type AnsiStyle } from "./ansi";

export interface StyledText {
  text: string;
  styles: AnsiStyle[];
}

export function cleanStyle(s: AnsiStyle): AnsiStyle {
  const out: AnsiStyle = {};
  if (s.fg) out.fg = s.fg;
  if (s.bg) out.bg = s.bg;
  if (s.bold) out.bold = true;
  if (s.underline) out.underline = true;
  return out;
}

export function sameStyle(a: AnsiStyle, b: AnsiStyle): boolean {
  return !!a.bold === !!b.bold && !!a.underline === !!b.underline && (a.fg ?? 0) === (b.fg ?? 0) && (a.bg ?? 0) === (b.bg ?? 0);
}

export function toSpans(doc: StyledText): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  for (let i = 0; i < doc.text.length; i++) {
    const st = doc.styles[i] ?? {};
    const last = spans[spans.length - 1];
    if (last && sameStyle(last.style, st)) last.text += doc.text[i];
    else spans.push({ text: doc.text[i]!, style: cleanStyle(st) });
  }
  return spans;
}

export function fromSpans(spans: AnsiSpan[]): StyledText {
  let text = "";
  const styles: AnsiStyle[] = [];
  for (const sp of spans) {
    text += sp.text;
    for (let i = 0; i < sp.text.length; i++) styles.push(cleanStyle(sp.style));
  }
  return { text, styles };
}

/** Parses pasted ANSI (with or without the ```ansi fence) into the editing model. */
export function fromAnsi(input: string): StyledText {
  return fromSpans(ansiToSpans(input));
}

export function toAnsi(doc: StyledText, wrap = true): string {
  return spansToAnsi(toSpans(doc), wrap);
}

/**
 * Re-aligns styles after a text edit. The changed region is found by common prefix/suffix;
 * inserted characters get `insertStyle`.
 */
export function applyTextEdit(doc: StyledText, next: string, insertStyle: AnsiStyle): StyledText {
  const prev = doc.text;
  if (prev === next) return doc;
  let p = 0;
  const max = Math.min(prev.length, next.length);
  while (p < max && prev[p] === next[p]) p++;
  let s = 0;
  while (s < max - p && prev[prev.length - 1 - s] === next[next.length - 1 - s]) s++;
  const inserted = next.length - p - s;
  const styles = [
    ...doc.styles.slice(0, p),
    ...Array.from({ length: inserted }, () => cleanStyle(insertStyle)),
    ...doc.styles.slice(prev.length - s),
  ];
  return { text: next, styles };
}

export type StyleAction =
  | { type: "fg"; code: number }
  | { type: "bg"; code: number }
  | { type: "bold" }
  | { type: "underline" }
  | { type: "reset" };

/** Applies a style change to [start, end). Clicking the same colour or format again removes it. */
export function applyStyle(doc: StyledText, start: number, end: number, action: StyleAction): StyledText {
  if (end <= start) return doc;
  const range = doc.styles.slice(start, end);
  const styles = doc.styles.slice();
  const all = (fn: (s: AnsiStyle) => boolean) => range.every(fn);
  for (let i = start; i < end; i++) {
    const cur = { ...(styles[i] ?? {}) };
    switch (action.type) {
      case "fg":
        cur.fg = all((s) => s.fg === action.code) ? undefined : action.code;
        break;
      case "bg":
        cur.bg = all((s) => s.bg === action.code) ? undefined : action.code;
        break;
      case "bold":
        cur.bold = !all((s) => !!s.bold);
        break;
      case "underline":
        cur.underline = !all((s) => !!s.underline);
        break;
      case "reset":
        styles[i] = {};
        continue;
    }
    styles[i] = cleanStyle(cur);
  }
  return { text: doc.text, styles };
}

/** Same toggle logic for the "typing style" used when nothing is selected. */
export function toggleTypingStyle(style: AnsiStyle, action: StyleAction): AnsiStyle {
  switch (action.type) {
    case "fg":
      return cleanStyle({ ...style, fg: style.fg === action.code ? undefined : action.code });
    case "bg":
      return cleanStyle({ ...style, bg: style.bg === action.code ? undefined : action.code });
    case "bold":
      return cleanStyle({ ...style, bold: !style.bold });
    case "underline":
      return cleanStyle({ ...style, underline: !style.underline });
    case "reset":
      return {};
  }
}

/** Makes the escape character visible so people can inspect the codes. */
export function visualizeEscapes(ansi: string): string {
  return ansi.replace(/\u001b/g, "\\u001b");
}

// ---------------------------------------------------------------- contrast check

function lum(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
}

export function contrastRatio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/** Default text colour inside a dark-theme code block, used when no foreground is set. */
export const DEFAULT_FG = "#dbdee1";
/** Code block background in the dark theme, used when no background is set. */
export const DEFAULT_BG = "#2b2d31";

/** Returns the text of spans whose foreground/background combination is nearly unreadable (< 1.5:1). */
export function lowContrastSpans(doc: StyledText): string[] {
  const out: string[] = [];
  for (const sp of toSpans(doc)) {
    if (!sp.text.trim()) continue;
    const fg = ANSI_FG.find((c) => c.code === sp.style.fg)?.hex ?? DEFAULT_FG;
    const bg = ANSI_BG.find((c) => c.code === sp.style.bg)?.hex ?? DEFAULT_BG;
    if (contrastRatio(fg, bg) < 1.5) out.push(sp.text.trim());
  }
  return out;
}

// ---------------------------------------------------------------- presets

const RAINBOW = [31, 33, 32, 36, 34, 35];

export function rainbow(text: string, bold = true): StyledText {
  const styles: AnsiStyle[] = [];
  let k = 0;
  for (const ch of text) {
    const st: AnsiStyle = /\s/.test(ch) ? {} : { fg: RAINBOW[k++ % RAINBOW.length], bold: bold || undefined };
    for (let i = 0; i < ch.length; i++) styles.push(cleanStyle(st));
  }
  return { text, styles };
}

export function concat(...parts: StyledText[]): StyledText {
  return { text: parts.map((p) => p.text).join(""), styles: parts.flatMap((p) => p.styles) };
}

export function styled(text: string, style: AnsiStyle = {}): StyledText {
  return { text, styles: Array.from({ length: text.length }, () => cleanStyle(style)) };
}

/** Replaces [start, end) with styled text (used for pasting ANSI). */
export function spliceDoc(doc: StyledText, start: number, end: number, insert: StyledText): StyledText {
  return {
    text: doc.text.slice(0, start) + insert.text + doc.text.slice(end),
    styles: [...doc.styles.slice(0, start), ...insert.styles, ...doc.styles.slice(end)],
  };
}

/** Summary of the styles in a range: a value is set only if every character shares it. */
export function commonStyle(doc: StyledText, start: number, end: number): AnsiStyle {
  const range = doc.styles.slice(start, end);
  if (!range.length) return {};
  const first = range[0]!;
  return cleanStyle({
    fg: range.every((s) => s.fg === first.fg) ? first.fg : undefined,
    bg: range.every((s) => s.bg === first.bg) ? first.bg : undefined,
    bold: range.every((s) => s.bold),
    underline: range.every((s) => s.underline),
  });
}
