/**
 * Application command model, validation and code generation.
 * Source: docs.discord.com/developers/interactions/application-commands (docs repo, 2026-10).
 */
import { parseBitfield } from "./bitfield";
import { decodePermissions } from "./permissions";

export type CommandType = 1 | 2 | 3;
export type OptionType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type Loc = Record<string, string>;

export interface ChoiceDraft {
  name: string;
  nameLoc: Loc;
  value: string;
}

export interface OptionDraft {
  uid: string;
  type: OptionType;
  name: string;
  nameLoc: Loc;
  description: string;
  descLoc: Loc;
  required: boolean;
  choices: ChoiceDraft[];
  minValue: string;
  maxValue: string;
  minLength: string;
  maxLength: string;
  channelTypes: number[];
  autocomplete: boolean;
  options: OptionDraft[];
}

export interface CommandDraft {
  type: CommandType;
  name: string;
  nameLoc: Loc;
  description: string;
  descLoc: Loc;
  options: OptionDraft[];
  /** everyone = no restriction (null), admins = "0", custom = bitfield */
  permMode: "everyone" | "admins" | "custom";
  permissions: string;
  /** 0 GUILD, 1 BOT_DM, 2 PRIVATE_CHANNEL */
  contexts: number[];
  /** 0 GUILD_INSTALL, 1 USER_INSTALL */
  integrationTypes: number[];
  nsfw: boolean;
  scope: "global" | "guild";
}

export const MAX_OPTIONS = 25;
export const MAX_CHOICES = 25;
export const MAX_TOTAL_CHARS = 8000;
const SAFE = 2 ** 53 - 1;

export const NAME_RE = /^[-_ʼ\p{L}\p{N}\p{sc=Deva}\p{sc=Thai}]{1,32}$/u;

export const OPTION_TYPES: { type: OptionType; key: string; de: string; en: string; djs: string }[] = [
  { type: 1, key: "SUB_COMMAND", de: "Unterbefehl", en: "Subcommand", djs: "Subcommand" },
  { type: 2, key: "SUB_COMMAND_GROUP", de: "Unterbefehl-Gruppe", en: "Subcommand group", djs: "SubcommandGroup" },
  { type: 3, key: "STRING", de: "Text", en: "String", djs: "String" },
  { type: 4, key: "INTEGER", de: "Ganzzahl", en: "Integer", djs: "Integer" },
  { type: 5, key: "BOOLEAN", de: "Ja/Nein", en: "Boolean", djs: "Boolean" },
  { type: 6, key: "USER", de: "Nutzer", en: "User", djs: "User" },
  { type: 7, key: "CHANNEL", de: "Kanal", en: "Channel", djs: "Channel" },
  { type: 8, key: "ROLE", de: "Rolle", en: "Role", djs: "Role" },
  { type: 9, key: "MENTIONABLE", de: "Nutzer oder Rolle", en: "Mentionable", djs: "Mentionable" },
  { type: 10, key: "NUMBER", de: "Kommazahl", en: "Number", djs: "Number" },
  { type: 11, key: "ATTACHMENT", de: "Datei", en: "Attachment", djs: "Attachment" },
];

export const CHANNEL_TYPES: { id: number; key: string; djs: string; de: string; en: string }[] = [
  { id: 0, key: "GUILD_TEXT", djs: "GuildText", de: "Textkanal", en: "Text" },
  { id: 2, key: "GUILD_VOICE", djs: "GuildVoice", de: "Sprachkanal", en: "Voice" },
  { id: 4, key: "GUILD_CATEGORY", djs: "GuildCategory", de: "Kategorie", en: "Category" },
  { id: 5, key: "GUILD_ANNOUNCEMENT", djs: "GuildAnnouncement", de: "Ankündigungen", en: "Announcement" },
  { id: 10, key: "ANNOUNCEMENT_THREAD", djs: "AnnouncementThread", de: "Ankündigungs-Thread", en: "Announcement thread" },
  { id: 11, key: "PUBLIC_THREAD", djs: "PublicThread", de: "Öffentlicher Thread", en: "Public thread" },
  { id: 12, key: "PRIVATE_THREAD", djs: "PrivateThread", de: "Privater Thread", en: "Private thread" },
  { id: 13, key: "GUILD_STAGE_VOICE", djs: "GuildStageVoice", de: "Stage", en: "Stage" },
  { id: 15, key: "GUILD_FORUM", djs: "GuildForum", de: "Forum", en: "Forum" },
  { id: 16, key: "GUILD_MEDIA", djs: "GuildMedia", de: "Medien", en: "Media" },
  { id: 1, key: "DM", djs: "DM", de: "DM", en: "DM" },
  { id: 3, key: "GROUP_DM", djs: "GroupDM", de: "Gruppen-DM", en: "Group DM" },
];

export const CONTEXTS = [
  { id: 0, key: "GUILD", djs: "Guild", de: "Server", en: "Servers" },
  { id: 1, key: "BOT_DM", djs: "BotDM", de: "DM mit dem Bot", en: "DM with the bot" },
  { id: 2, key: "PRIVATE_CHANNEL", djs: "PrivateChannel", de: "Andere DMs & Gruppen", en: "Other DMs & groups" },
];

export const INTEGRATION_TYPES = [
  { id: 0, key: "GUILD_INSTALL", djs: "GuildInstall", de: "Server-Installation", en: "Server install" },
  { id: 1, key: "USER_INSTALL", djs: "UserInstall", de: "Nutzer-Installation", en: "User install" },
];

export const LOCALES: { id: string; name: string }[] = [
  { id: "de", name: "Deutsch" }, { id: "en-US", name: "English, US" }, { id: "en-GB", name: "English, UK" },
  { id: "fr", name: "Français" }, { id: "es-ES", name: "Español" }, { id: "es-419", name: "Español, LATAM" },
  { id: "it", name: "Italiano" }, { id: "nl", name: "Nederlands" }, { id: "pl", name: "Polski" },
  { id: "pt-BR", name: "Português do Brasil" }, { id: "tr", name: "Türkçe" }, { id: "ru", name: "Pусский" },
  { id: "uk", name: "Українська" }, { id: "cs", name: "Čeština" }, { id: "da", name: "Dansk" },
  { id: "sv-SE", name: "Svenska" }, { id: "no", name: "Norsk" }, { id: "fi", name: "Suomi" },
  { id: "hu", name: "Magyar" }, { id: "ro", name: "Română" }, { id: "hr", name: "Hrvatski" },
  { id: "lt", name: "Lietuviškai" }, { id: "el", name: "Ελληνικά" }, { id: "bg", name: "български" },
  { id: "id", name: "Bahasa Indonesia" }, { id: "vi", name: "Tiếng Việt" }, { id: "hi", name: "हिन्दी" },
  { id: "th", name: "ไทย" }, { id: "ja", name: "日本語" }, { id: "ko", name: "한국어" },
  { id: "zh-CN", name: "中文" }, { id: "zh-TW", name: "繁體中文" },
];
const LOCALE_IDS = new Set(LOCALES.map((l) => l.id));

export const isSub = (t: OptionType) => t === 1 || t === 2;
export const hasChoices = (t: OptionType) => t === 3 || t === 4 || t === 10;

let uidCounter = 0;
export const uid = () => `o${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

export function newOption(type: OptionType = 3, name = ""): OptionDraft {
  return {
    uid: uid(), type, name, nameLoc: {}, description: "", descLoc: {}, required: false, choices: [],
    minValue: "", maxValue: "", minLength: "", maxLength: "", channelTypes: [], autocomplete: false, options: [],
  };
}

export function newCommand(type: CommandType = 1): CommandDraft {
  return {
    type, name: "", nameLoc: {}, description: "", descLoc: {}, options: [], permMode: "everyone", permissions: "0",
    contexts: [0, 1], integrationTypes: [0], nsfw: false, scope: "global",
  };
}

// ---------------------------------------------------------------- payload

const cleanLoc = (l: Loc): Loc | undefined => {
  const out: Loc = {};
  for (const [k, v] of Object.entries(l)) if (v.trim()) out[k] = v.trim();
  return Object.keys(out).length ? out : undefined;
};

const num = (s: string): number | undefined => (s.trim() === "" ? undefined : Number(s.trim()));

function choiceValue(type: OptionType, v: string): string | number {
  return type === 3 ? v : Number(v);
}

export function optionPayload(o: OptionDraft): Record<string, unknown> {
  const p: Record<string, unknown> = { type: o.type, name: o.name.trim() };
  const nl = cleanLoc(o.nameLoc);
  if (nl) p.name_localizations = nl;
  p.description = o.description.trim();
  const dl = cleanLoc(o.descLoc);
  if (dl) p.description_localizations = dl;
  if (isSub(o.type)) {
    p.options = o.options.map(optionPayload);
    return p;
  }
  if (o.required) p.required = true;
  if (hasChoices(o.type)) {
    if (o.choices.length) {
      p.choices = o.choices.map((c) => {
        const cp: Record<string, unknown> = { name: c.name.trim() };
        const cl = cleanLoc(c.nameLoc);
        if (cl) cp.name_localizations = cl;
        cp.value = choiceValue(o.type, c.value);
        return cp;
      });
    } else if (o.autocomplete) p.autocomplete = true;
  }
  if (o.type === 4 || o.type === 10) {
    const mn = num(o.minValue);
    const mx = num(o.maxValue);
    if (mn !== undefined) p.min_value = mn;
    if (mx !== undefined) p.max_value = mx;
  }
  if (o.type === 3) {
    const mn = num(o.minLength);
    const mx = num(o.maxLength);
    if (mn !== undefined) p.min_length = mn;
    if (mx !== undefined) p.max_length = mx;
  }
  if (o.type === 7 && o.channelTypes.length) p.channel_types = [...o.channelTypes];
  return p;
}

export function permissionsValue(c: CommandDraft): string | null {
  if (c.permMode === "everyone") return null;
  if (c.permMode === "admins") return "0";
  const r = parseBitfield(c.permissions);
  return r.ok ? r.value.toString() : c.permissions.trim();
}

export function commandPayload(c: CommandDraft): Record<string, unknown> {
  const p: Record<string, unknown> = { name: c.name.trim() };
  if (c.type !== 1) p.type = c.type;
  else p.type = 1;
  const nl = cleanLoc(c.nameLoc);
  if (nl) p.name_localizations = nl;
  p.description = c.type === 1 ? c.description.trim() : "";
  const dl = c.type === 1 ? cleanLoc(c.descLoc) : undefined;
  if (dl) p.description_localizations = dl;
  if (c.type === 1 && c.options.length) p.options = c.options.map(optionPayload);
  const perms = permissionsValue(c);
  if (perms !== null) p.default_member_permissions = perms;
  if (c.scope === "global") {
    p.integration_types = [...c.integrationTypes].sort();
    p.contexts = [...c.contexts].sort();
  }
  if (c.nsfw) p.nsfw = true;
  return p;
}

// ---------------------------------------------------------------- validation

export interface Issue {
  /** human path like "/remind › text" */
  path: string;
  level: "error" | "warn";
  de: string;
  en: string;
}

function nameIssues(name: string, path: string, chat: boolean, what: { de: string; en: string }, out: Issue[]) {
  const n = name.trim();
  if (!n) {
    out.push({ path, level: "error", de: `${what.de}: Name fehlt.`, en: `${what.en}: name is missing.` });
    return;
  }
  if (chat) {
    if (!NAME_RE.test(n)) {
      out.push({ path, level: "error", de: `${what.de}: „${n}“ – erlaubt sind 1–32 Buchstaben, Ziffern, - und _ (keine Leerzeichen).`, en: `${what.en}: “${n}” – use 1–32 letters, digits, - and _ (no spaces).` });
    } else if (n !== n.toLowerCase()) {
      out.push({ path, level: "error", de: `${what.de}: „${n}“ muss kleingeschrieben sein.`, en: `${what.en}: “${n}” must be lowercase.` });
    }
  } else if ([...n].length > 32) {
    out.push({ path, level: "error", de: `${what.de}: höchstens 32 Zeichen.`, en: `${what.en}: at most 32 characters.` });
  }
}

function descIssues(desc: string, path: string, what: { de: string; en: string }, out: Issue[]) {
  const d = desc.trim();
  if (!d) out.push({ path, level: "error", de: `${what.de}: Beschreibung fehlt (1–100 Zeichen).`, en: `${what.en}: description is missing (1–100 chars).` });
  else if ([...d].length > 100) out.push({ path, level: "error", de: `${what.de}: Beschreibung ist länger als 100 Zeichen.`, en: `${what.en}: description is longer than 100 characters.` });
}

function locIssues(nameLoc: Loc, descLoc: Loc | null, path: string, chat: boolean, out: Issue[]) {
  for (const [loc, v] of Object.entries(nameLoc)) {
    if (!LOCALE_IDS.has(loc)) out.push({ path, level: "error", de: `Unbekannte Sprache „${loc}“.`, en: `Unknown locale “${loc}”.` });
    if (v.trim()) nameIssues(v, path, chat, { de: `Name (${loc})`, en: `Name (${loc})` }, out);
  }
  if (descLoc)
    for (const [loc, v] of Object.entries(descLoc)) {
      if (v.trim()) descIssues(v, path, { de: `Beschreibung (${loc})`, en: `Description (${loc})` }, out);
    }
}

function levelIssues(opts: OptionDraft[], path: string, out: Issue[]) {
  if (opts.length > MAX_OPTIONS)
    out.push({ path, level: "error", de: `Höchstens ${MAX_OPTIONS} Optionen pro Ebene (jetzt ${opts.length}).`, en: `At most ${MAX_OPTIONS} options per level (now ${opts.length}).` });
  const seen = new Set<string>();
  for (const o of opts) {
    const n = o.name.trim();
    if (n && seen.has(n)) out.push({ path, level: "error", de: `Der Name „${n}“ kommt doppelt vor.`, en: `The name “${n}” is used twice.` });
    seen.add(n);
  }
  let optionalSeen = false;
  for (const o of opts) {
    if (isSub(o.type)) continue;
    if (!o.required) optionalSeen = true;
    else if (optionalSeen) {
      out.push({ path, level: "error", de: `Pflicht-Optionen müssen vor optionalen stehen („${o.name || "?"}“).`, en: `Required options must come before optional ones (“${o.name || "?"}”).` });
      break;
    }
  }
}

function numberOk(type: OptionType, s: string): boolean {
  const t = s.trim();
  if (!/^-?\d+(\.\d+)?$/.test(t)) return false;
  const n = Number(t);
  if (type === 4 && !Number.isInteger(n)) return false;
  return Math.abs(n) <= (type === 4 ? SAFE : 2 ** 53);
}

function optionIssues(o: OptionDraft, path: string, depth: number, parentType: OptionType | null, out: Issue[]) {
  const label = o.name.trim() || "?";
  const p = `${path} › ${label}`;
  const what = { de: "Option", en: "Option" };
  nameIssues(o.name, p, true, what, out);
  descIssues(o.description, p, what, out);
  locIssues(o.nameLoc, o.descLoc, p, true, out);

  if (o.type === 2) {
    if (depth > 0) out.push({ path: p, level: "error", de: "Gruppen sind nur auf oberster Ebene erlaubt.", en: "Groups are only allowed at the top level." });
    if (!o.options.length) out.push({ path: p, level: "error", de: "Die Gruppe braucht mindestens einen Unterbefehl.", en: "The group needs at least one subcommand." });
    if (o.options.some((c) => c.type !== 1)) out.push({ path: p, level: "error", de: "Eine Gruppe darf nur Unterbefehle enthalten.", en: "A group may only contain subcommands." });
  }
  if (o.type === 1) {
    if (depth > 0 && parentType !== 2) out.push({ path: p, level: "error", de: "Unterbefehle gehören auf die oberste Ebene oder in eine Gruppe.", en: "Subcommands belong at the top level or in a group." });
    if (o.options.some((c) => isSub(c.type))) out.push({ path: p, level: "error", de: "Ein Unterbefehl darf keine weiteren Unterbefehle enthalten.", en: "A subcommand cannot contain more subcommands." });
  }
  if (isSub(o.type)) {
    levelIssues(o.options, p, out);
    for (const c of o.options) optionIssues(c, p, depth + 1, o.type, out);
    return;
  }

  if (hasChoices(o.type)) {
    if (o.choices.length > MAX_CHOICES)
      out.push({ path: p, level: "error", de: `Höchstens ${MAX_CHOICES} Auswahlmöglichkeiten (jetzt ${o.choices.length}).`, en: `At most ${MAX_CHOICES} choices (now ${o.choices.length}).` });
    if (o.choices.length && o.autocomplete)
      out.push({ path: p, level: "error", de: "Autocomplete geht nicht zusammen mit festen Auswahlmöglichkeiten.", en: "Autocomplete cannot be combined with fixed choices." });
    const names = new Set<string>();
    o.choices.forEach((c, i) => {
      const cp = `${p} › #${i + 1}`;
      const cn = c.name.trim();
      if (!cn || [...cn].length > 100) out.push({ path: cp, level: "error", de: "Name der Auswahl: 1–100 Zeichen.", en: "Choice name: 1–100 characters." });
      if (cn && names.has(cn)) out.push({ path: cp, level: "warn", de: `Auswahl „${cn}“ kommt doppelt vor.`, en: `Choice “${cn}” appears twice.` });
      names.add(cn);
      for (const [loc, v] of Object.entries(c.nameLoc)) if (v.trim() && [...v.trim()].length > 100) out.push({ path: cp, level: "error", de: `Name (${loc}): höchstens 100 Zeichen.`, en: `Name (${loc}): at most 100 characters.` });
      if (o.type === 3) {
        if (!c.value.length || [...c.value].length > 100) out.push({ path: cp, level: "error", de: "Wert der Auswahl: 1–100 Zeichen.", en: "Choice value: 1–100 characters." });
      } else if (!numberOk(o.type, c.value)) {
        out.push({ path: cp, level: "error", de: o.type === 4 ? "Wert muss eine Ganzzahl sein." : "Wert muss eine Zahl sein.", en: o.type === 4 ? "Value must be an integer." : "Value must be a number." });
      }
    });
  }
  if (o.type === 4 || o.type === 10) {
    const okMin = !o.minValue.trim() || numberOk(o.type, o.minValue);
    const okMax = !o.maxValue.trim() || numberOk(o.type, o.maxValue);
    if (!okMin) out.push({ path: p, level: "error", de: "min_value ist keine gültige Zahl.", en: "min_value is not a valid number." });
    if (!okMax) out.push({ path: p, level: "error", de: "max_value ist keine gültige Zahl.", en: "max_value is not a valid number." });
    if (okMin && okMax && o.minValue.trim() && o.maxValue.trim() && Number(o.minValue) > Number(o.maxValue))
      out.push({ path: p, level: "error", de: "min_value ist größer als max_value.", en: "min_value is greater than max_value." });
  }
  if (o.type === 3) {
    const int = (s: string, lo: number) => s.trim() === "" || (/^\d+$/.test(s.trim()) && Number(s) >= lo && Number(s) <= 6000);
    if (!int(o.minLength, 0)) out.push({ path: p, level: "error", de: "min_length: ganze Zahl von 0 bis 6000.", en: "min_length: whole number from 0 to 6000." });
    if (!int(o.maxLength, 1)) out.push({ path: p, level: "error", de: "max_length: ganze Zahl von 1 bis 6000.", en: "max_length: whole number from 1 to 6000." });
    if (o.minLength.trim() && o.maxLength.trim() && Number(o.minLength) > Number(o.maxLength))
      out.push({ path: p, level: "error", de: "min_length ist größer als max_length.", en: "min_length is greater than max_length." });
  }
}

/** Counts name + description + choice name/value, using the longest localization per field. */
export function totalChars(c: CommandDraft): number {
  const longest = (base: string, loc: Loc) => Math.max([...base.trim()].length, ...Object.values(loc).map((v) => [...v.trim()].length));
  let n = longest(c.name, c.nameLoc) + (c.type === 1 ? longest(c.description, c.descLoc) : 0);
  const walk = (opts: OptionDraft[]) => {
    for (const o of opts) {
      n += longest(o.name, o.nameLoc) + longest(o.description, o.descLoc);
      if (!isSub(o.type) && hasChoices(o.type)) for (const ch of o.choices) n += longest(ch.name, ch.nameLoc) + [...ch.value].length;
      walk(o.options);
    }
  };
  if (c.type === 1) walk(c.options);
  return n;
}

export function validateCommand(c: CommandDraft): Issue[] {
  const out: Issue[] = [];
  const chat = c.type === 1;
  const root = chat ? `/${c.name.trim() || "?"}` : c.name.trim() || "?";
  nameIssues(c.name, root, chat, { de: "Befehl", en: "Command" }, out);
  if (chat) descIssues(c.description, root, { de: "Befehl", en: "Command" }, out);
  locIssues(c.nameLoc, chat ? c.descLoc : null, root, chat, out);

  if (chat) {
    const subs = c.options.filter((o) => isSub(o.type)).length;
    if (subs && subs !== c.options.length)
      out.push({ path: root, level: "error", de: "Unterbefehle und normale Optionen lassen sich auf einer Ebene nicht mischen.", en: "Subcommands and regular options cannot be mixed on one level." });
    levelIssues(c.options, root, out);
    for (const o of c.options) optionIssues(o, root, 0, null, out);
    // regular options at top level are valid (depth 0, no parent)
  }
  if (c.permMode === "custom") {
    const r = parseBitfield(c.permissions);
    if (!r.ok) out.push({ path: root, level: "error", de: "default_member_permissions ist keine gültige Zahl.", en: "default_member_permissions is not a valid number." });
    else if (r.value === 0n) out.push({ path: root, level: "warn", de: "Keine Rechte gewählt: 0 bedeutet „nur Admins“.", en: "No permissions picked: 0 means “admins only”." });
  }
  if (c.scope === "global") {
    if (!c.integrationTypes.length) out.push({ path: root, level: "error", de: "Wähle mindestens eine Installationsart.", en: "Pick at least one install type." });
    if (!c.contexts.length) out.push({ path: root, level: "error", de: "Wähle mindestens einen Ort, an dem der Befehl nutzbar ist.", en: "Pick at least one context where the command can be used." });
    if (c.contexts.includes(2) && !c.integrationTypes.includes(1))
      out.push({ path: root, level: "warn", de: "„Andere DMs & Gruppen“ wirkt nur mit Nutzer-Installation.", en: "“Other DMs & groups” only works with user install." });
  }
  const total = totalChars(c);
  if (total > MAX_TOTAL_CHARS)
    out.push({ path: root, level: "error", de: `Zu viel Text: ${total} von ${MAX_TOTAL_CHARS} Zeichen (Namen, Beschreibungen, Auswahlen).`, en: `Too much text: ${total} of ${MAX_TOTAL_CHARS} characters (names, descriptions, choices).` });
  return out;
}

// ---------------------------------------------------------------- code generation

const q = (s: string) => JSON.stringify(s);
const locObj = (l: Loc) => {
  const c = cleanLoc(l);
  return c ? "{ " + Object.entries(c).map(([k, v]) => `${/^[a-z]+$/.test(k) ? k : q(k)}: ${q(v)}`).join(", ") + " }" : null;
};

export function toDiscordJs(c: CommandDraft): string {
  const imports = new Set<string>();
  const ind = (n: number) => "  ".repeat(n);
  const common = (name: string, desc: string | null, nameLoc: Loc, descLoc: Loc, depth: number): string[] => {
    const l = [`${ind(depth)}.setName(${q(name.trim())})`];
    const nl = locObj(nameLoc);
    if (nl) l.push(`${ind(depth)}.setNameLocalizations(${nl})`);
    if (desc !== null) {
      l.push(`${ind(depth)}.setDescription(${q(desc.trim())})`);
      const dl = locObj(descLoc);
      if (dl) l.push(`${ind(depth)}.setDescriptionLocalizations(${dl})`);
    }
    return l;
  };
  const opt = (o: OptionDraft, depth: number, v: string): string[] => {
    const t = OPTION_TYPES.find((x) => x.type === o.type)!;
    const method = o.type === 1 ? "addSubcommand" : o.type === 2 ? "addSubcommandGroup" : `add${t.djs}Option`;
    const lines = [`${ind(depth)}.${method}((${v}) =>`, `${ind(depth + 1)}${v}`];
    const body = common(o.name, o.description, o.nameLoc, o.descLoc, depth + 2);
    if (isSub(o.type)) {
      for (const ch of o.options) body.push(...opt(ch, depth + 2, ch.type === 1 ? "sub" : "o"));
    } else {
      if (o.required) body.push(`${ind(depth + 2)}.setRequired(true)`);
      if (hasChoices(o.type) && o.choices.length) {
        const items = o.choices.map((ch) => {
          const nl = locObj(ch.nameLoc);
          const val = o.type === 3 ? q(ch.value) : String(Number(ch.value));
          return `${ind(depth + 3)}{ name: ${q(ch.name.trim())}${nl ? `, name_localizations: ${nl}` : ""}, value: ${val} },`;
        });
        body.push(`${ind(depth + 2)}.addChoices(`, ...items, `${ind(depth + 2)})`);
      } else if (hasChoices(o.type) && o.autocomplete) body.push(`${ind(depth + 2)}.setAutocomplete(true)`);
      if ((o.type === 4 || o.type === 10) && o.minValue.trim()) body.push(`${ind(depth + 2)}.setMinValue(${Number(o.minValue)})`);
      if ((o.type === 4 || o.type === 10) && o.maxValue.trim()) body.push(`${ind(depth + 2)}.setMaxValue(${Number(o.maxValue)})`);
      if (o.type === 3 && o.minLength.trim()) body.push(`${ind(depth + 2)}.setMinLength(${Number(o.minLength)})`);
      if (o.type === 3 && o.maxLength.trim()) body.push(`${ind(depth + 2)}.setMaxLength(${Number(o.maxLength)})`);
      if (o.type === 7 && o.channelTypes.length) {
        imports.add("ChannelType");
        const names = o.channelTypes.map((id) => `ChannelType.${CHANNEL_TYPES.find((x) => x.id === id)?.djs ?? id}`);
        body.push(`${ind(depth + 2)}.addChannelTypes(${names.join(", ")})`);
      }
    }
    lines.push(...body, `${ind(depth)})`);
    return lines;
  };

  const chain: string[] = [];
  let head: string;
  if (c.type === 1) {
    imports.add("SlashCommandBuilder");
    head = "new SlashCommandBuilder()";
    chain.push(...common(c.name, c.description, c.nameLoc, c.descLoc, 1));
  } else {
    imports.add("ContextMenuCommandBuilder");
    imports.add("ApplicationCommandType");
    head = "new ContextMenuCommandBuilder()";
    chain.push(...common(c.name, null, c.nameLoc, {}, 1));
    chain.push(`${ind(1)}.setType(ApplicationCommandType.${c.type === 2 ? "User" : "Message"})`);
  }
  const perms = permissionsValue(c);
  if (perms !== null) {
    if (perms === "0") chain.push(`${ind(1)}.setDefaultMemberPermissions(0)`);
    else {
      const r = parseBitfield(perms);
      const d = r.ok ? decodePermissions(r.value) : null;
      if (d && d.known.length && !d.unknown.length) {
        imports.add("PermissionFlagsBits");
        chain.push(`${ind(1)}.setDefaultMemberPermissions(${d.known.map((p) => `PermissionFlagsBits.${p.djs}`).join(" | ")})`);
      } else chain.push(`${ind(1)}.setDefaultMemberPermissions(${q(perms)})`);
    }
  }
  if (c.scope === "global") {
    imports.add("InteractionContextType");
    imports.add("ApplicationIntegrationType");
    chain.push(`${ind(1)}.setIntegrationTypes(${[...c.integrationTypes].sort().map((i) => `ApplicationIntegrationType.${INTEGRATION_TYPES[i]!.djs}`).join(", ")})`);
    chain.push(`${ind(1)}.setContexts(${[...c.contexts].sort().map((i) => `InteractionContextType.${CONTEXTS[i]!.djs}`).join(", ")})`);
  }
  if (c.nsfw) chain.push(`${ind(1)}.setNSFW(true)`);
  if (c.type === 1) for (const o of c.options) chain.push(...opt(o, 1, o.type === 1 ? "sub" : o.type === 2 ? "group" : "option"));

  const order = ["SlashCommandBuilder", "ContextMenuCommandBuilder", "ApplicationCommandType", "ChannelType", "PermissionFlagsBits", "InteractionContextType", "ApplicationIntegrationType"];
  const imp = order.filter((x) => imports.has(x));
  return `import { ${imp.join(", ")} } from "discord.js";\n\nexport const data = ${head}\n${chain.join("\n")};\n\n// data.toJSON() → JSON payload for rest.put(Routes.applicationCommands(clientId), { body: [data.toJSON()] })\n`;
}

export function toCurl(c: CommandDraft): string {
  const json = JSON.stringify(commandPayload(c), null, 2);
  const url =
    c.scope === "global"
      ? "https://discord.com/api/v10/applications/$APPLICATION_ID/commands"
      : "https://discord.com/api/v10/applications/$APPLICATION_ID/guilds/$GUILD_ID/commands";
  return `# Token nur als Umgebungsvariable setzen – nie in Dateien oder Chats.
# Keep the token in an environment variable – never in files or chats.
export APPLICATION_ID="123456789012345678"${c.scope === "guild" ? '\nexport GUILD_ID="123456789012345678"' : ""}

curl -X POST "${url}" \\
  -H "Authorization: Bot $DISCORD_TOKEN" \\
  -H "Content-Type: application/json" \\
  --data-binary @- <<'JSON'
${json}
JSON`;
}

// ---------------------------------------------------------------- import

export type ImportResult = { ok: true; draft: CommandDraft; warnings: string[] } | { ok: false; error: "json" | "shape" };

const asLoc = (v: unknown): Loc => {
  const out: Loc = {};
  if (v && typeof v === "object") for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (typeof x === "string") out[k] = x;
  return out;
};
const str = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");

/** Thrown inside the importer when a value is not one of Discord's enum members. */
class ShapeError extends Error {}

const OPTION_TYPE_IDS = new Set<number>(OPTION_TYPES.map((t) => t.type));
const CHANNEL_TYPE_IDS = new Set(CHANNEL_TYPES.map((t) => t.id));
const CONTEXT_IDS = new Set(CONTEXTS.map((t) => t.id));
const INTEGRATION_TYPE_IDS = new Set(INTEGRATION_TYPES.map((t) => t.id));

/** `v` must be an integer that is in `allowed` – otherwise the whole import fails with a shape error. */
function member(v: unknown, allowed: Set<number>): number {
  if (typeof v !== "number" || !Number.isInteger(v) || !allowed.has(v)) throw new ShapeError();
  return v;
}
const members = (v: unknown[], allowed: Set<number>) => [...new Set(v.map((x) => member(x, allowed)))];

function importOption(raw: Record<string, unknown>, depth = 0): OptionDraft {
  if (depth > 2) throw new ShapeError(); // Discord allows group → subcommand → option, nothing deeper
  const type = (raw.type === undefined ? 3 : member(raw.type, OPTION_TYPE_IDS)) as OptionType;
  const o = newOption(type, str(raw.name));
  o.nameLoc = asLoc(raw.name_localizations);
  o.description = str(raw.description);
  o.descLoc = asLoc(raw.description_localizations);
  o.required = raw.required === true;
  o.autocomplete = raw.autocomplete === true;
  if (Array.isArray(raw.choices))
    o.choices = raw.choices.map((c: Record<string, unknown>) => ({ name: str(c?.name), nameLoc: asLoc(c?.name_localizations), value: str(c?.value) }));
  o.minValue = str(raw.min_value);
  o.maxValue = str(raw.max_value);
  o.minLength = str(raw.min_length);
  o.maxLength = str(raw.max_length);
  if (Array.isArray(raw.channel_types)) o.channelTypes = members(raw.channel_types, CHANNEL_TYPE_IDS);
  if (Array.isArray(raw.options)) o.options = raw.options.filter((x) => x && typeof x === "object").map((x) => importOption(x, depth + 1));
  return o;
}

/** Loads an existing command JSON (object or array – first entry) into the builder. */
export function importCommand(text: string): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "json" };
  }
  const warnings: string[] = [];
  if (Array.isArray(data)) {
    if (data.length > 1) warnings.push(`array:${data.length}`);
    data = data[0];
  }
  if (!data || typeof data !== "object" || typeof (data as { name?: unknown }).name !== "string") return { ok: false, error: "shape" };
  try {
    return importShape(data as Record<string, unknown>, warnings);
  } catch (e) {
    if (e instanceof ShapeError) return { ok: false, error: "shape" };
    throw e;
  }
}

function importShape(raw: Record<string, unknown>, warnings: string[]): ImportResult {
  const t = raw.type === undefined ? 1 : member(raw.type, new Set([1, 2, 3, 4]));
  const c = newCommand((t === 2 || t === 3 ? t : 1) as CommandType);
  if (t === 4) warnings.push("entry-point");
  c.name = str(raw.name);
  c.nameLoc = asLoc(raw.name_localizations);
  c.description = str(raw.description);
  c.descLoc = asLoc(raw.description_localizations);
  if (Array.isArray(raw.options)) c.options = raw.options.filter((x) => x && typeof x === "object").map((x) => importOption(x));
  const dmp = raw.default_member_permissions;
  if (dmp === null || dmp === undefined) c.permMode = "everyone";
  else if (String(dmp) === "0") c.permMode = "admins";
  else {
    c.permMode = "custom";
    c.permissions = String(dmp);
  }
  if (Array.isArray(raw.contexts)) c.contexts = members(raw.contexts, CONTEXT_IDS);
  if (Array.isArray(raw.integration_types)) c.integrationTypes = members(raw.integration_types, INTEGRATION_TYPE_IDS);
  c.nsfw = raw.nsfw === true;
  if (raw.guild_id) c.scope = "guild";
  if (raw.dm_permission === false && !Array.isArray(raw.contexts)) {
    c.contexts = [0];
    warnings.push("dm_permission");
  }
  return { ok: true, draft: c, warnings };
}

// ---------------------------------------------------------------- examples

const opt = (type: OptionType, name: string, description: string, extra: Partial<OptionDraft> = {}): OptionDraft => ({
  ...newOption(type, name),
  description,
  ...extra,
});

export function exampleCommand(id: "remind" | "mod" | "user" | "message" = "remind"): CommandDraft {
  if (id === "mod") {
    return {
      ...newCommand(1),
      name: "mod",
      description: "Moderation tools",
      descLoc: { de: "Moderations-Werkzeuge" },
      permMode: "custom",
      permissions: ((1n << 1n) | (1n << 2n) | (1n << 40n)).toString(),
      contexts: [0],
      options: [
        opt(1, "timeout", "Time out a member", {
          descLoc: { de: "Mitglied in den Timeout schicken" },
          options: [
            opt(6, "member", "Who?", { required: true, nameLoc: { de: "mitglied" }, descLoc: { de: "Wer?" } }),
            opt(4, "minutes", "How long", {
              required: true, nameLoc: { de: "minuten" }, descLoc: { de: "Wie lange" },
              choices: [
                { name: "5 minutes", nameLoc: { de: "5 Minuten" }, value: "5" },
                { name: "1 hour", nameLoc: { de: "1 Stunde" }, value: "60" },
                { name: "1 day", nameLoc: { de: "1 Tag" }, value: "1440" },
              ],
            }),
            opt(3, "reason", "Shown in the audit log", { nameLoc: { de: "grund" }, descLoc: { de: "Steht im Audit-Log" }, maxLength: "512" }),
          ],
        }),
        opt(1, "ban", "Ban a member", {
          descLoc: { de: "Mitglied bannen" },
          options: [
            opt(6, "member", "Who?", { required: true, nameLoc: { de: "mitglied" }, descLoc: { de: "Wer?" } }),
            opt(5, "delete-messages", "Delete their messages from the last 24 hours", { nameLoc: { de: "nachrichten-löschen" }, descLoc: { de: "Nachrichten der letzten 24 Stunden löschen" } }),
          ],
        }),
      ],
    };
  }
  if (id === "user") return { ...newCommand(2), name: "Show profile", nameLoc: { de: "Profil anzeigen" }, contexts: [0] };
  if (id === "message") return { ...newCommand(3), name: "Report message", nameLoc: { de: "Nachricht melden" }, contexts: [0] };
  return {
    ...newCommand(1),
    name: "remind",
    nameLoc: { de: "erinnern" },
    description: "Set a reminder",
    descLoc: { de: "Erinnerung stellen" },
    integrationTypes: [0, 1],
    contexts: [0, 1, 2],
    options: [
      opt(3, "text", "What should I remind you of?", { required: true, nameLoc: { de: "text" }, descLoc: { de: "Woran soll ich dich erinnern?" }, maxLength: "200" }),
      opt(4, "minutes", "In how many minutes", { required: true, nameLoc: { de: "minuten" }, descLoc: { de: "In wie vielen Minuten" }, minValue: "1", maxValue: "10080" }),
      opt(7, "channel", "Where to post it (default: DM)", { nameLoc: { de: "kanal" }, descLoc: { de: "Wo posten (Standard: DM)" }, channelTypes: [0, 5] }),
    ],
  };
}
