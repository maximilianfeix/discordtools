/**
 * A small Discord-flavoured markdown parser. It produces a plain AST that the preview renders
 * as text nodes only (no HTML injection), so pasted content is always inert.
 */
import { parseTimestampTags, type TimestampStyle } from "./timestamp";
import { ansiToSpans, type AnsiSpan } from "./ansi";

export type Inline =
  | { type: "text"; value: string }
  | { type: "bold" | "italic" | "underline" | "strike" | "spoiler"; children: Inline[] }
  | { type: "code"; value: string }
  | { type: "link"; href: string; children: Inline[] }
  | { type: "mention"; kind: "user" | "role" | "channel" | "everyone" | "here" | "command" | "guild-nav"; id: string; label?: string }
  | { type: "timestamp"; unix: number; style: TimestampStyle }
  | { type: "emoji"; id: string; name: string; animated: boolean }
  | { type: "br" };

export type Block =
  | { type: "paragraph"; children: Inline[] }
  | { type: "heading"; level: 1 | 2 | 3; children: Inline[] }
  | { type: "subtext"; children: Inline[] }
  | { type: "quote"; children: Block[] }
  | { type: "list"; ordered: boolean; start: number; items: { depth: number; children: Inline[] }[] }
  | { type: "codeblock"; lang: string; value: string; ansi?: AnsiSpan[] };

interface Rule {
  re: RegExp;
  build: (m: RegExpExecArray, inner: (s: string) => Inline[]) => Inline;
}

const URL_RE = /^https?:\/\/[^\s<]+[^\s<.,:;"')\]!?]/;

const RULES: Rule[] = [
  { re: /^`{2}([\s\S]+?)`{2}|^`([^`\n]+?)`/, build: (m) => ({ type: "code", value: (m[1] ?? m[2] ?? "").trim() || (m[1] ?? m[2] ?? "") }) },
  { re: /^\|\|([\s\S]+?)\|\|/, build: (m, inner) => ({ type: "spoiler", children: inner(m[1]!) }) },
  { re: /^\*\*\*([\s\S]+?)\*\*\*(?!\*)/, build: (m, inner) => ({ type: "bold", children: [{ type: "italic", children: inner(m[1]!) }] }) },
  { re: /^\*\*([\s\S]+?)\*\*(?!\*)/, build: (m, inner) => ({ type: "bold", children: inner(m[1]!) }) },
  { re: /^__([\s\S]+?)__(?!_)/, build: (m, inner) => ({ type: "underline", children: inner(m[1]!) }) },
  { re: /^\*(?=\S)([\s\S]*?\S)\*(?!\*)/, build: (m, inner) => ({ type: "italic", children: inner(m[1]!) }) },
  { re: /^_(?=\S)([\s\S]*?\S)_(?![_\w])/, build: (m, inner) => ({ type: "italic", children: inner(m[1]!) }) },
  { re: /^~~([\s\S]+?)~~/, build: (m, inner) => ({ type: "strike", children: inner(m[1]!) }) },
  {
    re: /^\[([^\]\n]+)\]\(<?(https?:\/\/[^\s)>]+)>?(?:\s+"[^"]*")?\)/,
    build: (m, inner) => ({ type: "link", href: m[2]!, children: inner(m[1]!) }),
  },
  { re: /^<(https?:\/\/[^\s>]+)>/, build: (m) => ({ type: "link", href: m[1]!, children: [{ type: "text", value: m[1]! }] }) },
  { re: URL_RE, build: (m) => ({ type: "link", href: m[0], children: [{ type: "text", value: m[0] }] }) },
  { re: /^<@!?(\d{15,21})>/, build: (m) => ({ type: "mention", kind: "user", id: m[1]! }) },
  { re: /^<@&(\d{15,21})>/, build: (m) => ({ type: "mention", kind: "role", id: m[1]! }) },
  { re: /^<#(\d{15,21})>/, build: (m) => ({ type: "mention", kind: "channel", id: m[1]! }) },
  { re: /^<\/([\w\- ]{1,96}):(\d{15,21})>/, build: (m) => ({ type: "mention", kind: "command", id: m[2]!, label: m[1]! }) },
  { re: /^<id:(customize|browse|guide|linked-roles)(?::\d+)?>/, build: (m) => ({ type: "mention", kind: "guild-nav", id: m[1]! }) },
  { re: /^@everyone/, build: () => ({ type: "mention", kind: "everyone", id: "everyone" }) },
  { re: /^@here/, build: () => ({ type: "mention", kind: "here", id: "here" }) },
  {
    re: /^<t:(-?\d{1,13})(?::([tTdDfFRsS]))?>/,
    build: (m) => ({ type: "timestamp", unix: Number(m[1]), style: (m[2] as TimestampStyle | undefined) ?? "f" }),
  },
  { re: /^<(a?):(\w{2,32}):(\d{15,21})>/, build: (m) => ({ type: "emoji", animated: m[1] === "a", name: m[2]!, id: m[3]! }) },
  // Discord lets a backslash escape any ASCII punctuation (e.g. "1\\." stops a numbered list).
  { re: /^\\([!-/:-@[-`{-~])/, build: (m) => ({ type: "text", value: m[1]! }) },
];

const SPECIAL = /[*_`~|[<h@\\\n]/;

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  let text = "";
  const flush = () => {
    if (text) out.push({ type: "text", value: text });
    text = "";
  };
  let i = 0;
  while (i < src.length) {
    const rest = src.slice(i);
    if (rest[0] === "\n") {
      flush();
      out.push({ type: "br" });
      i++;
      continue;
    }
    let matched = false;
    if (SPECIAL.test(rest[0]!)) {
      for (const rule of RULES) {
        const m = rule.re.exec(rest);
        if (m && m[0].length) {
          flush();
          out.push(rule.build(m as RegExpExecArray, parseInline));
          i += m[0].length;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      text += rest[0];
      i++;
    }
  }
  flush();
  return out;
}

/** Parses a message into blocks. `embed` disables headings/subtext like Discord does in some embed fields. */
export function parseMarkdown(src: string, opts: { headings?: boolean } = {}): Block[] {
  const headings = opts.headings ?? true;
  const blocks: Block[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ type: "paragraph", children: parseInline(para.join("\n")) });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    // fenced code block
    const fence = line.match(/^```([\w+\-.]*)\s*(.*)$/);
    if (fence) {
      const body: string[] = [];
      let lang = fence[1] ?? "";
      let first = fence[2] ?? "";
      // ```code``` on one line
      if (first.endsWith("```") && first.length >= 3) {
        flushPara();
        const value = (lang && !first ? "" : first.slice(0, -3)) || lang;
        blocks.push({ type: "codeblock", lang: first ? lang : "", value: first ? first.slice(0, -3) : value });
        continue;
      }
      let j = i + 1;
      let closed = false;
      if (first) body.push(first);
      for (; j < lines.length; j++) {
        const l = lines[j]!;
        const end = l.indexOf("```");
        if (end !== -1) {
          if (end > 0) body.push(l.slice(0, end));
          closed = true;
          break;
        }
        body.push(l);
      }
      if (closed) {
        flushPara();
        const value = body.join("\n");
        blocks.push({ type: "codeblock", lang, value, ansi: lang === "ansi" ? ansiToSpans(value) : undefined });
        i = j;
        continue;
      }
    }

    // block quote: ">>> " quotes everything after it
    if (line.startsWith(">>> ")) {
      flushPara();
      const rest = [line.slice(4), ...lines.slice(i + 1)].join("\n");
      blocks.push({ type: "quote", children: parseMarkdown(rest, opts) });
      break;
    }
    if (line.startsWith("> ") || line === ">") {
      flushPara();
      const quoted: string[] = [];
      while (i < lines.length && (lines[i]!.startsWith("> ") || lines[i] === ">")) {
        quoted.push(lines[i]!.slice(2));
        i++;
      }
      i--;
      blocks.push({ type: "quote", children: parseMarkdown(quoted.join("\n"), opts) });
      continue;
    }

    const h = headings ? line.match(/^(#{1,3}) (.+)$/) : null;
    if (h) {
      flushPara();
      blocks.push({ type: "heading", level: h[1]!.length as 1 | 2 | 3, children: parseInline(h[2]!) });
      continue;
    }
    const sub = headings ? line.match(/^-# (.+)$/) : null;
    if (sub) {
      flushPara();
      blocks.push({ type: "subtext", children: parseInline(sub[1]!) });
      continue;
    }

    const li = line.match(/^(\s*)([-*]|(\d{1,9})\.) (.+)$/);
    if (li) {
      flushPara();
      const ordered = Boolean(li[3]);
      const list: Extract<Block, { type: "list" }> = { type: "list", ordered, start: ordered ? Number(li[3]) : 1, items: [] };
      while (i < lines.length) {
        const m = lines[i]!.match(/^(\s*)([-*]|(\d{1,9})\.) (.+)$/);
        if (!m) break;
        list.items.push({ depth: Math.min(Math.floor(m[1]!.length / 2), 2), children: parseInline(m[4]!) });
        i++;
      }
      i--;
      blocks.push(list);
      continue;
    }

    para.push(line);
  }
  flushPara();
  return blocks;
}

/** True if the message is only custom/unicode emoji (Discord shows them "jumbo"). */
export function isEmojiOnly(src: string): boolean {
  const s = src.trim();
  if (!s) return false;
  const stripped = s.replace(/<a?:\w{2,32}:\d{15,21}>/g, "").replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic}|\p{Emoji_Modifier})*/gu, "").replace(/\s+/g, "");
  return stripped === "" && (s.match(/<a?:\w+:\d+>|\p{Extended_Pictographic}/gu)?.length ?? 0) <= 30;
}

export { parseTimestampTags };
