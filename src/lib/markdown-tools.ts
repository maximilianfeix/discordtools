/**
 * Text transforms for the Markdown editor toolbar. Each returns the new text plus the selection
 * to restore, so the component can apply them as one undoable edit.
 */
export interface Edit {
  text: string;
  start: number;
  end: number;
}

/** Wraps the selection in markers, or removes them if they are already there (toggle). */
export function wrapSelection(text: string, start: number, end: number, before: string, after = before, placeholder = ""): Edit {
  const sel = text.slice(start, end);
  // markers just outside the selection
  if (text.slice(start - before.length, start) === before && text.slice(end, end + after.length) === after && start - before.length >= 0) {
    // "**" outside could be part of "***" – still fine to strip the inner pair
    return {
      text: text.slice(0, start - before.length) + sel + text.slice(end + after.length),
      start: start - before.length,
      end: end - before.length,
    };
  }
  // markers inside the selection
  if (sel.length >= before.length + after.length && sel.startsWith(before) && sel.endsWith(after) && sel.length > 0) {
    const inner = sel.slice(before.length, sel.length - after.length);
    return { text: text.slice(0, start) + inner + text.slice(end), start, end: start + inner.length };
  }
  const body = sel || placeholder;
  // keep surrounding whitespace outside the markers ("**word **" does not render)
  const lead = body.match(/^\s*/)![0];
  const trail = body.slice(lead.length).match(/\s*$/)![0];
  const core = body.slice(lead.length, body.length - trail.length);
  const inserted = lead + before + core + after + trail;
  const s = start + lead.length + before.length;
  return { text: text.slice(0, start) + inserted + text.slice(end), start: s, end: s + core.length };
}

function lineBounds(text: string, start: number, end: number): [number, number] {
  const ls = text.lastIndexOf("\n", start - 1) + 1;
  let le = text.indexOf("\n", end > start && text[end - 1] === "\n" ? end - 1 : end);
  if (le === -1) le = text.length;
  return [ls, le];
}

/**
 * Toggles a line prefix ("> ", "# ", "- ", "-# ", numbered) on every selected line.
 * `exclusive` lists prefixes that are replaced (e.g. switching "# " to "## ").
 */
export function toggleLinePrefix(text: string, start: number, end: number, prefix: string | ((i: number) => string), exclusive: RegExp = /^$/): Edit {
  const [ls, le] = lineBounds(text, start, end);
  const lines = text.slice(ls, le).split("\n");
  const pre = (i: number) => (typeof prefix === "function" ? prefix(i) : prefix);
  const has = (l: string, i: number) => (typeof prefix === "function" ? /^\d{1,9}\. /.test(l) : l.startsWith(pre(i)));
  const all = lines.every((l, i) => has(l, i) || l.trim() === "");
  const out = lines.map((l, i) => {
    if (l.trim() === "" && lines.length > 1) return l;
    if (all) return typeof prefix === "function" ? l.replace(/^\d{1,9}\. /, "") : l.slice(pre(i).length);
    return pre(i) + l.replace(exclusive, "").replace(typeof prefix === "function" ? /^\d{1,9}\. / : /^$/, "");
  });
  const block = out.join("\n");
  const next = text.slice(0, ls) + block + text.slice(le);
  if (start === end) {
    const delta = block.length - (le - ls);
    const caret = Math.max(ls, Math.min(ls + block.length, start + delta));
    return { text: next, start: caret, end: caret };
  }
  return { text: next, start: ls, end: ls + block.length };
}

/** Wraps the selection (or a placeholder) in a fenced code block on its own lines. */
export function codeBlock(text: string, start: number, end: number, lang = "", placeholder = "code"): Edit {
  const sel = text.slice(start, end);
  const m = sel.match(/^```[\w+\-.]*\n([\s\S]*)\n```$/);
  if (m) return { text: text.slice(0, start) + m[1] + text.slice(end), start, end: start + m[1]!.length };
  const body = sel || placeholder;
  const lead = start > 0 && text[start - 1] !== "\n" ? "\n" : "";
  const trail = end < text.length && text[end] !== "\n" ? "\n" : "";
  const open = lead + "```" + lang + "\n";
  const inserted = open + body + "\n```" + trail;
  return { text: text.slice(0, start) + inserted + text.slice(end), start: start + open.length, end: start + open.length + body.length };
}

const URLISH = /^(https?:\/\/|www\.)\S+$/i;

/** Builds a masked link `[text](url)`; selects the part the user still has to fill in. */
export function maskedLink(text: string, start: number, end: number, labelPlaceholder = "Text"): Edit {
  const sel = text.slice(start, end).trim();
  if (URLISH.test(sel)) {
    const url = sel.startsWith("www.") ? "https://" + sel : sel;
    const inserted = `[${labelPlaceholder}](${url})`;
    return { text: text.slice(0, start) + inserted + text.slice(end), start: start + 1, end: start + 1 + labelPlaceholder.length };
  }
  const label = sel || labelPlaceholder;
  const inserted = `[${label}](https://)`;
  const urlStart = start + label.length + 3;
  return { text: text.slice(0, start) + inserted + text.slice(end), start: urlStart, end: urlStart + "https://".length };
}

/** Escapes Discord markdown so the text shows up literally. */
export function escapeMarkdown(text: string): string {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/([\\*_~|`])/g, "\\$1")
        .replace(/<(?=[@#:/at]|https?:)/g, "\\<")
        .replace(/^(\s*)(#{1,3} |-# |>>> |> |[-*] )/, (_, sp: string, mk: string) => sp + "\\" + mk)
        .replace(/^(\s*)(\d{1,9})\. /, "$1$2\\. ")
        .replace(/\[([^\]\n]+)\]\(/g, "\\[$1\\]("),
    )
    .join("\n");
}

/** Removes the escapes `escapeMarkdown` adds. */
export function unescapeMarkdown(text: string): string {
  return text.replace(/\\([^0-9A-Za-z\s])/g, "$1");
}

/** Smallest replacement that turns `a` into `b` – lets the editor use execCommand and keep native undo. */
export function diffRange(a: string, b: string): { start: number; end: number; insert: string } {
  let p = 0;
  const max = Math.min(a.length, b.length);
  while (p < max && a[p] === b[p]) p++;
  let s = 0;
  while (s < max - p && a[a.length - 1 - s] === b[b.length - 1 - s]) s++;
  return { start: p, end: a.length - s, insert: b.slice(p, b.length - s) };
}
