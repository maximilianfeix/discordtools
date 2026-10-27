import { applyStyle, styleById } from "./fancy-text";

export type ChannelKind = "text" | "voice" | "category";
export type CaseMode = "keep" | "lower" | "upper" | "title";

export interface Separator {
  id: string;
  /** Between emoji and name */
  mid?: string;
  /** Wraps the emoji (or the name when there is no emoji) */
  left?: string;
  right?: string;
}

export const SEPARATORS: Separator[] = [
  { id: "bar", mid: "┃" },
  { id: "thin", mid: "│" },
  { id: "kdot", mid: "・" },
  { id: "wave", mid: "⌇" },
  { id: "dashed", mid: "╏" },
  { id: "star", mid: "⋆" },
  { id: "kbar", mid: "〡" },
  { id: "dotted", mid: "┊" },
  { id: "smalldot", mid: "﹒" },
  { id: "guill", mid: "»" },
  { id: "arrow", mid: "➜" },
  { id: "sparkle", mid: "✦" },
  { id: "kawaii", left: "꒰", right: "꒱" },
  { id: "lens", left: "【", right: "】" },
  { id: "corner", left: "「", right: "」" },
  { id: "dots", left: "・", right: "・" },
  { id: "none", mid: "" },
];

export const EMOJI_GROUPS: { id: string; name: { de: string; en: string }; emoji: string[] }[] = [
  { id: "info", name: { de: "Info", en: "Info" }, emoji: ["📜", "📢", "📌", "👋", "📣", "ℹ️", "✅", "🎉", "📅", "🔔"] },
  { id: "chat", name: { de: "Chat", en: "Chat" }, emoji: ["💬", "🗨️", "🖼️", "😂", "🤖", "🔗", "📷", "🎨", "💡", "❓"] },
  { id: "fun", name: { de: "Spaß", en: "Fun" }, emoji: ["🎮", "🎧", "🎵", "🎬", "🍿", "🏆", "🎲", "⚽", "🕹️", "👾"] },
  { id: "deco", name: { de: "Deko", en: "Decor" }, emoji: ["✨", "🌸", "⭐", "💜", "🌙", "🔥", "🍀", "🦋", "☁️", "🫧"] },
  { id: "work", name: { de: "Lernen & Shop", en: "Study & shop" }, emoji: ["📚", "✏️", "🧠", "💻", "🛒", "💰", "📦", "🎫", "🛠️", "🔒"] },
  { id: "voice", name: { de: "Sprache", en: "Voice" }, emoji: ["🔊", "🎙️", "🎤", "🎶", "🛋️", "☕", "🌃", "💤"] },
];

export function applyCase(text: string, mode: CaseMode, lang: "de" | "en" = "de"): string {
  const loc = lang === "de" ? "de-DE" : "en-US";
  if (mode === "lower") return text.toLocaleLowerCase(loc);
  if (mode === "upper") return text.toLocaleUpperCase(loc);
  if (mode === "title") return text.toLocaleLowerCase(loc).replace(/(^|[\s\-_])(\p{L})/gu, (_m, p, ch: string) => p + ch.toLocaleUpperCase(loc));
  return text;
}

export interface Pattern {
  sep: string;
  spaced: boolean;
  font: string; // "" = normal
  caseMode: CaseMode;
}

export const DEFAULT_PATTERN: Pattern = { sep: "bar", spaced: false, font: "", caseMode: "keep" };

export function separatorById(id: string): Separator {
  return SEPARATORS.find((s) => s.id === id) ?? SEPARATORS[0];
}

/** Puts emoji, separator and (styled) name together. */
export function buildName(emoji: string, name: string, p: Pattern, lang: "de" | "en" = "de"): string {
  const sep = separatorById(p.sep);
  const e = emoji.trim();
  let n = applyCase(name.trim(), p.caseMode, lang);
  const style = p.font ? styleById(p.font) : undefined;
  if (style) n = applyStyle(n, style);
  const sp = p.spaced ? " " : "";
  if (sep.left !== undefined) {
    if (e) return `${sep.left}${e}${sep.right ?? ""}${sp}${n}`;
    return `${sep.left}${n}${sep.right ?? ""}`;
  }
  if (!e) return n;
  if (!sep.mid) return `${e}${sp}${n}`;
  return `${e}${sp}${sep.mid}${sp}${n}`;
}

/**
 * Approximation of what Discord saves for a text channel name: lowercase, spaces become dashes,
 * most ASCII punctuation is removed, doubled dashes collapse. Emoji and other Unicode symbols stay.
 * Fancy letters (𝐀) are not touched by lowercasing. Max 100 characters.
 */
export function toTextChannel(name: string): string {
  return Array.from(
    name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "")
      .replace(/-{2,}/g, "-")
      .replace(/^-+|-+$/g, ""),
  )
    .slice(0, 100)
    .join("");
}

/** What a channel of this kind will actually be called in Discord. */
export function finalName(raw: string, kind: ChannelKind): string {
  const trimmed = Array.from(raw.trim()).slice(0, 100).join("");
  return kind === "text" ? toTextChannel(trimmed) : trimmed;
}

/** Characters Discord changes in a text channel name (for the explanation under the output). */
export function textChannelChanges(raw: string): { upper: boolean; spaces: boolean; removed: string[] } {
  const removed = Array.from(new Set(raw.match(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g) ?? []));
  return { upper: raw !== raw.toLowerCase(), spaces: /\s/.test(raw.trim()), removed };
}

export interface ListItem {
  kind: ChannelKind;
  emoji: string;
  name: string;
}

const LEADING_EMOJI = /^((?:\p{Extended_Pictographic}|\p{Regional_Indicator}|[#*0-9]️?⃣)(?:️|‍(?:\p{Extended_Pictographic})️?|\p{Emoji_Modifier})*)\s*/u;

/**
 * List syntax, one channel per line:
 *   "Info:"          → category (line ends with a colon)
 *   "📜 regeln"       → text channel, leading emoji is used as its emoji
 *   "+ 🔊 Lounge"     → voice channel (line starts with +)
 */
export function parseList(text: string): ListItem[] {
  const out: ListItem[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;
    let kind: ChannelKind = "text";
    if (/:$/.test(line) && !line.startsWith("+")) {
      kind = "category";
      line = line.slice(0, -1).trim();
    } else if (line.startsWith("+")) {
      kind = "voice";
      line = line.slice(1).trim();
    }
    const m = line.match(LEADING_EMOJI);
    const emoji = m ? m[1] : "";
    const name = m ? line.slice(m[0].length).trim() : line;
    if (!name && !emoji) continue;
    out.push({ kind, emoji, name });
  }
  return out;
}

export function serializeList(items: ListItem[]): string {
  return items
    .map((i) => (i.kind === "category" ? `${i.name}:` : `${i.kind === "voice" ? "+ " : ""}${i.emoji ? i.emoji + " " : ""}${i.name}`))
    .join("\n");
}

export interface RenderedItem extends ListItem {
  raw: string;
  final: string;
}

/** Applies the pattern to every channel. Categories get the font and case but no emoji/separator by default. */
export function renderList(items: ListItem[], p: Pattern, defaultEmoji: string, lang: "de" | "en" = "de", decorateCategories = false): RenderedItem[] {
  return items.map((i) => {
    let raw: string;
    if (i.kind === "category") {
      raw = decorateCategories ? buildName(i.emoji, i.name, p, lang) : buildName(i.emoji, i.name, { ...p, sep: "none", spaced: true }, lang);
    } else raw = buildName(i.emoji || defaultEmoji, i.name, p, lang);
    return { ...i, raw, final: finalName(raw, i.kind) };
  });
}

export const TEMPLATES: { id: string; name: { de: string; en: string }; list: { de: string; en: string } }[] = [
  {
    id: "gaming",
    name: { de: "Gaming", en: "Gaming" },
    list: {
      de: "Info:\n📜 regeln\n📢 ankündigungen\n🎉 events\nCommunity:\n💬 allgemein\n🎮 zocken\n🖼️ clips-und-screens\n🤖 bot-befehle\nSprachkanäle:\n+ 🎧 Lounge\n+ 🎮 Squad 1\n+ 🎮 Squad 2\n+ 💤 AFK",
      en: "Info:\n📜 rules\n📢 announcements\n🎉 events\nCommunity:\n💬 general\n🎮 gaming\n🖼️ clips-and-screens\n🤖 bot-commands\nVoice:\n+ 🎧 Lounge\n+ 🎮 Squad 1\n+ 🎮 Squad 2\n+ 💤 AFK",
    },
  },
  {
    id: "community",
    name: { de: "Community", en: "Community" },
    list: {
      de: "Willkommen:\n👋 willkommen\n📜 regeln\n🎭 rollen\nTreffpunkt:\n💬 plaudern\n📷 fotos\n🐾 haustiere\n🎵 musik\n💡 vorschläge\nSprachkanäle:\n+ ☕ Café\n+ 🛋️ Wohnzimmer",
      en: "Welcome:\n👋 welcome\n📜 rules\n🎭 roles\nHangout:\n💬 chat\n📷 photos\n🐾 pets\n🎵 music\n💡 suggestions\nVoice:\n+ ☕ Café\n+ 🛋️ Living room",
    },
  },
  {
    id: "study",
    name: { de: "Lernen", en: "Study" },
    list: {
      de: "Start:\n📌 infos\n📅 termine\nFächer:\n📐 mathe\n🧪 chemie\n💻 informatik\n📚 deutsch\n❓ fragen\nLernräume:\n+ 🤫 Stilles Lernen\n+ 📚 Lerngruppe\n+ ☕ Pause",
      en: "Start:\n📌 info\n📅 dates\nSubjects:\n📐 math\n🧪 chemistry\n💻 computer-science\n📚 english\n❓ questions\nStudy rooms:\n+ 🤫 Silent study\n+ 📚 Study group\n+ ☕ Break",
    },
  },
  {
    id: "shop",
    name: { de: "Shop", en: "Shop" },
    list: {
      de: "Shop:\n📢 neuigkeiten\n🛒 produkte\n💰 preise\n⭐ bewertungen\nSupport:\n🎫 ticket-erstellen\n❓ faq\n📦 bestellstatus\nSprachkanäle:\n+ 🎙️ Support-Call",
      en: "Shop:\n📢 news\n🛒 products\n💰 pricing\n⭐ reviews\nSupport:\n🎫 open-a-ticket\n❓ faq\n📦 order-status\nVoice:\n+ 🎙️ Support call",
    },
  },
];
