import type { Embed, MessagePayload } from "./discord-types";
import { LIMITS, embedLength } from "./discord-types";

export type RulesLang = "de" | "en";
export type RulesStyle = "numbered" | "headings" | "emoji";

export interface RuleBlock {
  id: string;
  emoji: string;
  title: Record<RulesLang, string>;
  text: Record<RulesLang, string>;
  /** Selected by default */
  preset?: boolean;
}

export const TOS_URL = "https://discord.com/terms";
export const GUIDELINES_URL = "https://discord.com/guidelines";

export const BLOCKS: RuleBlock[] = [
  {
    id: "respect", emoji: "🤝", preset: true,
    title: { de: "Respekt", en: "Respect" },
    text: {
      de: "Behandle alle freundlich. Keine Beleidigungen, kein Mobbing, keine Hetze gegen Herkunft, Religion, Geschlecht, Sexualität oder Behinderung.",
      en: "Be kind to everyone. No insults, bullying or hate based on origin, religion, gender, sexuality or disability.",
    },
  },
  {
    id: "spam", emoji: "🚫", preset: true,
    title: { de: "Kein Spam", en: "No spam" },
    text: {
      de: "Kein Spam, keine Kettenbriefe, kein Flooden mit Emojis, Stickern oder GIFs. Eine Nachricht reicht.",
      en: "No spam, chain messages or flooding with emojis, stickers or GIFs. One message is enough.",
    },
  },
  {
    id: "ads", emoji: "📢", preset: true,
    title: { de: "Keine Werbung", en: "No advertising" },
    text: {
      de: "Werbung für andere Server, Kanäle oder Produkte nur mit Erlaubnis des Teams – auch nicht per Privatnachricht an Mitglieder.",
      en: "No ads for other servers, channels or products without staff permission – that includes DMs to members.",
    },
  },
  {
    id: "nsfw", emoji: "🔞", preset: true,
    title: { de: "Kein NSFW", en: "No NSFW" },
    text: {
      de: "Keine sexuellen, brutalen oder verstörenden Inhalte – auch nicht in Profilbildern, Namen oder als Spoiler.",
      en: "No sexual, gory or disturbing content – not in avatars, names or behind spoilers either.",
    },
  },
  {
    id: "privacy", emoji: "🔒", preset: true,
    title: { de: "Datenschutz & kein Doxxing", en: "Privacy & no doxxing" },
    text: {
      de: "Teile keine privaten Daten von dir oder anderen (Adresse, Telefonnummer, Fotos, Klarnamen). Doxxing führt zum sofortigen Bann.",
      en: "Don't share private information about yourself or others (address, phone number, photos, real names). Doxxing means an instant ban.",
    },
  },
  {
    id: "channels", emoji: "📂", preset: true,
    title: { de: "Kanäle richtig nutzen", en: "Use the right channels" },
    text: {
      de: "Schreib im passenden Kanal und lies die Kanalbeschreibung. Bot-Befehle gehören in den Bot-Kanal.",
      en: "Post in the matching channel and read the channel topic. Bot commands go in the bot channel.",
    },
  },
  {
    id: "language", emoji: "🗣️",
    title: { de: "Sprache", en: "Language" },
    text: {
      de: "Auf diesem Server schreiben wir Deutsch, damit alle mitlesen und die Mods moderieren können.",
      en: "Please write in English on this server so everyone can follow and the mods can moderate.",
    },
  },
  {
    id: "pings", emoji: "🔔",
    title: { de: "Keine unnötigen Pings", en: "No unnecessary pings" },
    text: {
      de: "Pinge Mitglieder, Rollen oder das Team nur, wenn es wirklich nötig ist. @everyone und @here sind tabu.",
      en: "Only ping members, roles or staff when it's really needed. @everyone and @here are off-limits.",
    },
  },
  {
    id: "names", emoji: "🪪",
    title: { de: "Namen & Profilbilder", en: "Names & avatars" },
    text: {
      de: "Namen und Profilbilder müssen angemessen sein. Gib dich nicht als Teammitglied oder andere Personen aus.",
      en: "Names and avatars must be appropriate. Don't impersonate staff or other people.",
    },
  },
  {
    id: "voice", emoji: "🎙️",
    title: { de: "Sprachkanäle", en: "Voice channels" },
    text: {
      de: "Kein Schreien, keine Soundboards oder Stimmverzerrer, die andere stören. Aufnahmen nur, wenn alle zustimmen.",
      en: "No screaming, soundboards or voice changers that bother others. Recording only if everyone agrees.",
    },
  },
  {
    id: "drama", emoji: "🕊️",
    title: { de: "Kein Drama", en: "No drama" },
    text: {
      de: "Streit klärt ihr privat oder mit dem Team, nicht im Chat. Politische und religiöse Diskussionen bitte woanders.",
      en: "Settle arguments privately or with staff, not in chat. Please keep political and religious debates elsewhere.",
    },
  },
  {
    id: "age", emoji: "🎂",
    title: { de: "Mindestalter", en: "Minimum age" },
    text: {
      de: "Du musst das Mindestalter von Discord erfüllen (mindestens 13 Jahre, in manchen Ländern höher).",
      en: "You must meet Discord's minimum age (at least 13, higher in some countries).",
    },
  },
  {
    id: "mods", emoji: "🛡️", preset: true,
    title: { de: "Das Team entscheidet", en: "Staff decide" },
    text: {
      de: "Folge den Anweisungen des Teams. Was hier nicht steht, kann trotzdem verboten sein – im Zweifel entscheiden die Mods.",
      en: "Follow staff instructions. Things not listed here can still be against the rules – when in doubt, the mods decide.",
    },
  },
  {
    id: "punish", emoji: "⚖️", preset: true,
    title: { de: "Strafen", en: "Consequences" },
    text: {
      de: "Verstöße führen je nach Schwere zu Verwarnung → Timeout → Kick → Bann. Schwere Verstöße können sofort zum Bann führen.",
      en: "Depending on severity, breaking the rules leads to warning → timeout → kick → ban. Serious violations can mean an instant ban.",
    },
  },
  {
    id: "report", emoji: "📩",
    title: { de: "Probleme melden", en: "Report problems" },
    text: {
      de: "Siehst du einen Regelverstoß? Melde ihn dem Team per Ticket oder Privatnachricht, statt selbst zu reagieren.",
      en: "See someone breaking the rules? Report it to staff via ticket or DM instead of reacting yourself.",
    },
  },
  {
    id: "tos", emoji: "📜", preset: true,
    title: { de: "Discord-Regeln", en: "Discord rules" },
    text: {
      de: `Es gelten außerdem die [Nutzungsbedingungen](${TOS_URL}) und [Community-Richtlinien](${GUIDELINES_URL}) von Discord.`,
      en: `Discord's [Terms of Service](${TOS_URL}) and [Community Guidelines](${GUIDELINES_URL}) apply as well.`,
    },
  },
];

export interface Rule {
  key: string;
  /** Built-in block id, or "" for a custom rule */
  blockId: string;
  emoji: string;
  title: string;
  text: string;
  on: boolean;
}

export function defaultRules(lang: RulesLang): Rule[] {
  return BLOCKS.map((b) => ({ key: b.id, blockId: b.id, emoji: b.emoji, title: b.title[lang], text: b.text[lang], on: !!b.preset }));
}

/** Switches built-in texts to another language, keeps order, on/off and custom rules. */
export function translateRules(rules: Rule[], lang: RulesLang): Rule[] {
  return rules.map((r) => {
    const b = BLOCKS.find((x) => x.id === r.blockId);
    return b ? { ...r, title: b.title[lang], text: b.text[lang] } : r;
  });
}

export function moveRule(rules: Rule[], index: number, dir: -1 | 1): Rule[] {
  const j = index + dir;
  if (j < 0 || j >= rules.length) return rules;
  const out = rules.slice();
  [out[index], out[j]] = [out[j], out[index]];
  return out;
}

export interface RulesOptions {
  title: string;
  intro: string;
  footer: string;
  style: RulesStyle;
  color: number;
}

export const DEFAULT_OPTIONS: Record<RulesLang, Omit<RulesOptions, "style" | "color">> = {
  de: { title: "📜 Serverregeln", intro: "Damit sich hier alle wohlfühlen, gelten diese Regeln:", footer: "Mit deiner Teilnahme akzeptierst du diese Regeln." },
  en: { title: "📜 Server rules", intro: "To keep this a good place for everyone, these rules apply:", footer: "By taking part you agree to these rules." },
};

function heading(r: Rule, n: number, style: RulesStyle): string {
  const t = r.title.trim() || "…";
  if (style === "emoji") return `${r.emoji ? r.emoji + " " : ""}${t}`;
  return `${n}. ${t}`;
}

export function activeRules(rules: Rule[]): Rule[] {
  return rules.filter((r) => r.on && (r.title.trim() || r.text.trim()));
}

export function toMarkdown(rules: Rule[], o: RulesOptions): string {
  const parts: string[] = [];
  if (o.title.trim()) parts.push(`# ${o.title.trim()}`);
  if (o.intro.trim()) parts.push(o.intro.trim());
  activeRules(rules).forEach((r, i) => {
    const h = heading(r, i + 1, o.style);
    const body = r.text.trim();
    if (o.style === "headings") parts.push(`### ${h}\n${body}`);
    else parts.push(`**${h}**\n${body}`);
  });
  if (o.footer.trim()) parts.push(`-# ${o.footer.trim()}`);
  return parts.join("\n\n");
}

export function toEmbed(rules: Rule[], o: RulesOptions): Embed {
  const fields = activeRules(rules)
    .slice(0, LIMITS.fields)
    .map((r, i) => ({ name: heading(r, i + 1, o.style === "headings" ? "numbered" : o.style).slice(0, LIMITS.fieldName), value: (r.text.trim() || "​").slice(0, LIMITS.fieldValue) }));
  const e: Embed = { color: o.color };
  if (o.title.trim()) e.title = o.title.trim().slice(0, LIMITS.title);
  if (o.intro.trim()) e.description = o.intro.trim().slice(0, LIMITS.description);
  if (fields.length) e.fields = fields;
  if (o.footer.trim()) e.footer = { text: o.footer.trim().slice(0, LIMITS.footer) };
  return e;
}

/** Message payload for the embed builder: no pings, even if a rule mentions @everyone. */
export function toPayload(rules: Rule[], o: RulesOptions): MessagePayload {
  return { embeds: [toEmbed(rules, o)], allowed_mentions: { parse: [] } };
}

export interface EmbedIssue {
  kind: "fields" | "fieldValue" | "fieldName" | "total" | "title";
  detail?: string;
}

export function embedIssues(rules: Rule[], o: RulesOptions): EmbedIssue[] {
  const act = activeRules(rules);
  const out: EmbedIssue[] = [];
  if (act.length > LIMITS.fields) out.push({ kind: "fields" });
  for (const r of act) {
    if (r.text.trim().length > LIMITS.fieldValue) out.push({ kind: "fieldValue", detail: r.title });
    if (r.title.trim().length + 4 > LIMITS.fieldName) out.push({ kind: "fieldName", detail: r.title });
  }
  if (o.title.trim().length > LIMITS.title) out.push({ kind: "title" });
  if (embedLength(toEmbed(rules, o)) > LIMITS.embedTotal) out.push({ kind: "total" });
  return out;
}

/** Splits long text into Discord messages at paragraph boundaries (2000 characters each by default). */
export function splitMessage(text: string, limit: number = LIMITS.content): string[] {
  if (text.length <= limit) return [text];
  const out: string[] = [];
  let cur = "";
  for (const para of text.split("\n\n")) {
    const add = cur ? cur + "\n\n" + para : para;
    if (add.length <= limit) {
      cur = add;
      continue;
    }
    if (cur) out.push(cur);
    if (para.length <= limit) cur = para;
    else {
      // A single paragraph longer than the limit: hard split at line breaks, then characters.
      let rest = para;
      while (rest.length > limit) {
        let cut = rest.lastIndexOf("\n", limit);
        if (cut <= 0) cut = rest.lastIndexOf(" ", limit);
        if (cut <= 0) cut = limit;
        out.push(rest.slice(0, cut));
        rest = rest.slice(cut).replace(/^\s+/, "");
      }
      cur = rest;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64url(text: string): string {
  return bytesToB64url(new TextEncoder().encode(text));
}

/**
 * Hash for the embed builder link: "m=j." + base64url(UTF-8 JSON of the MessagePayload).
 * This matches the plain (uncompressed) share format of src/lib/embed-builder.ts.
 */
export function embedBuilderHash(payload: MessagePayload): string {
  return "m=j." + base64url(JSON.stringify(payload));
}
