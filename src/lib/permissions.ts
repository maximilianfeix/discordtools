/**
 * Discord permission flags, bits 0–52 (bit 47 is unused).
 * Source: docs.discord.com/developers/topics/permissions (docs repo, 2026-10).
 * Everything is BigInt: bits ≥ 31 break JS bitwise operators and values exceed 2^53.
 */
import { bit, bitsOf, diffBits, fromBits, unknownBits, type BitDiff } from "./bitfield";

export type PermCategory = "general" | "membership" | "text" | "voice" | "stage" | "events" | "apps" | "advanced";
/** Channel types a permission can be set on in overwrites: Text, Voice, Stage. Empty = server-wide only. */
export type ChannelScope = "T" | "V" | "S";

export interface Permission {
  key: string;
  bit: number;
  category: PermCategory;
  /** Requires the owner account to use 2FA on servers with server-wide 2FA. */
  twoFA: boolean;
  /** Grants power over other members, the server or mass pings. */
  dangerous: boolean;
  scope: ChannelScope[];
  name: { de: string; en: string };
  desc: { de: string; en: string };
  /** discord.js PermissionFlagsBits name */
  djs: string;
}

type Row = [key: string, bit: number, cat: PermCategory, scope: string, marks: string, de: string, en: string, deDesc: string, enDesc: string];

// marks: "2" = 2FA, "!" = dangerous
const ROWS: Row[] = [
  ["CREATE_INSTANT_INVITE", 0, "membership", "TVS", "", "Einladung erstellen", "Create Invite",
    "Darf Einladungslinks für den Server erstellen.", "Allows creating invite links."],
  ["KICK_MEMBERS", 1, "membership", "", "2!", "Mitglieder kicken", "Kick Members",
    "Darf Mitglieder vom Server werfen (sie können mit Einladung zurückkommen).", "Allows removing members from the server (they can rejoin with an invite)."],
  ["BAN_MEMBERS", 2, "membership", "", "2!", "Mitglieder bannen", "Ban Members",
    "Darf Mitglieder dauerhaft sperren und ihre letzten Nachrichten löschen.", "Allows permanently banning members and deleting their recent messages."],
  ["ADMINISTRATOR", 3, "advanced", "", "2!", "Administrator", "Administrator",
    "Gibt alle Rechte und ignoriert jede Kanal-Überschreibung. Für Bots fast nie nötig.", "Grants every permission and bypasses all channel overwrites. Bots almost never need it."],
  ["MANAGE_CHANNELS", 4, "general", "TVS", "2!", "Kanäle verwalten", "Manage Channels",
    "Darf Kanäle erstellen, bearbeiten und löschen.", "Allows creating, editing and deleting channels."],
  ["MANAGE_GUILD", 5, "general", "", "2!", "Server verwalten", "Manage Server",
    "Darf Name, Region, Einstellungen und Integrationen des Servers ändern und Bots hinzufügen.", "Allows changing the server name, settings and integrations, and adding bots."],
  ["ADD_REACTIONS", 6, "text", "TVS", "", "Reaktionen hinzufügen", "Add Reactions",
    "Darf neue Reaktionen setzen. Auf bestehende Reaktionen klicken geht auch ohne.", "Allows adding new reactions. Clicking an existing reaction works without it."],
  ["VIEW_AUDIT_LOG", 7, "general", "", "", "Audit-Log anzeigen", "View Audit Log",
    "Darf das Audit-Log des Servers lesen.", "Allows reading the server's audit log."],
  ["PRIORITY_SPEAKER", 8, "voice", "V", "", "Vorrangiger Sprecher", "Priority Speaker",
    "Andere werden leiser, wenn dieses Mitglied spricht.", "Lowers other speakers' volume while this member talks."],
  ["STREAM", 9, "voice", "VS", "", "Video", "Video",
    "Darf Kamera und Bildschirmübertragung im Sprachkanal nutzen.", "Allows sharing camera or screen (going live)."],
  ["VIEW_CHANNEL", 10, "general", "TVS", "", "Kanäle ansehen", "View Channels",
    "Darf Kanäle sehen, Textkanäle lesen und Sprachkanäle sehen. Grundlage für fast alles.", "Allows seeing channels, reading text channels and seeing voice channels. Needed for almost everything."],
  ["SEND_MESSAGES", 11, "text", "TVS", "", "Nachrichten senden", "Send Messages",
    "Darf Nachrichten senden und Forenbeiträge erstellen – aber nicht in Threads schreiben.", "Allows sending messages and creating forum posts – not sending in threads."],
  ["SEND_TTS_MESSAGES", 12, "text", "TVS", "", "Text-zu-Sprache senden", "Send Text-to-Speech Messages",
    "Darf /tts-Nachrichten senden, die vorgelesen werden.", "Allows sending /tts messages that are read aloud."],
  ["MANAGE_MESSAGES", 13, "text", "TVS", "2!", "Nachrichten verwalten", "Manage Messages",
    "Darf Nachrichten anderer löschen. Anpinnen braucht seit 2026 eigenes Recht.", "Allows deleting other people's messages. Pinning needs its own permission since 2026."],
  ["EMBED_LINKS", 14, "text", "TVS", "", "Links einbetten", "Embed Links",
    "Links zeigen eine Vorschau. Bots brauchen es für Embeds.", "Links show a preview. Bots need it to send embeds."],
  ["ATTACH_FILES", 15, "text", "TVS", "", "Dateien anhängen", "Attach Files",
    "Darf Bilder und Dateien hochladen.", "Allows uploading images and files."],
  ["READ_MESSAGE_HISTORY", 16, "text", "TVS", "", "Nachrichtenverlauf lesen", "Read Message History",
    "Darf ältere Nachrichten sehen. Ohne sieht man nur, was ab jetzt kommt.", "Allows seeing earlier messages. Without it you only see new ones."],
  ["MENTION_EVERYONE", 17, "text", "TVS", "!", "@everyone, @here und alle Rollen erwähnen", "Mention @everyone, @here, and All Roles",
    "Darf alle Mitglieder auf einmal anpingen – auch Rollen, die nicht erwähnbar sind.", "Allows pinging everyone at once, including roles that are not mentionable."],
  ["USE_EXTERNAL_EMOJIS", 18, "text", "TVS", "", "Externe Emojis verwenden", "Use External Emoji",
    "Darf Emojis aus anderen Servern nutzen.", "Allows using emojis from other servers."],
  ["VIEW_GUILD_INSIGHTS", 19, "general", "", "", "Server-Einblicke anzeigen", "View Server Insights",
    "Darf die Server-Statistiken sehen.", "Allows viewing server insights (analytics)."],
  ["CONNECT", 20, "voice", "VS", "", "Verbinden", "Connect",
    "Darf Sprach- und Stage-Kanälen beitreten.", "Allows joining voice and stage channels."],
  ["SPEAK", 21, "voice", "V", "", "Sprechen", "Speak",
    "Darf im Sprachkanal reden.", "Allows talking in voice channels."],
  ["MUTE_MEMBERS", 22, "voice", "VS", "", "Mitglieder stummschalten", "Mute Members",
    "Darf anderen im Sprachkanal das Mikro abschalten.", "Allows muting other members in voice."],
  ["DEAFEN_MEMBERS", 23, "voice", "V", "", "Mitglieder taub schalten", "Deafen Members",
    "Darf anderen im Sprachkanal den Ton abschalten.", "Allows deafening other members in voice."],
  ["MOVE_MEMBERS", 24, "voice", "VS", "", "Mitglieder verschieben", "Move Members",
    "Darf Mitglieder zwischen Sprachkanälen verschieben oder rauswerfen.", "Allows moving members between voice channels or disconnecting them."],
  ["USE_VAD", 25, "voice", "V", "", "Sprachaktivierung verwenden", "Use Voice Activity",
    "Darf ohne Push-to-Talk sprechen.", "Allows talking without push-to-talk."],
  ["CHANGE_NICKNAME", 26, "membership", "", "", "Nickname ändern", "Change Nickname",
    "Darf den eigenen Nickname auf dem Server ändern.", "Allows changing your own nickname."],
  ["MANAGE_NICKNAMES", 27, "membership", "", "", "Nicknames verwalten", "Manage Nicknames",
    "Darf die Nicknames anderer Mitglieder ändern.", "Allows changing other members' nicknames."],
  ["MANAGE_ROLES", 28, "general", "TVS", "2!", "Rollen verwalten", "Manage Roles",
    "Darf Rollen unterhalb der eigenen höchsten Rolle erstellen, ändern und vergeben.", "Allows creating, editing and assigning roles below your highest role."],
  ["MANAGE_WEBHOOKS", 29, "general", "TVS", "2!", "Webhooks verwalten", "Manage Webhooks",
    "Darf Webhooks erstellen, ändern und löschen – und damit als beliebiger Name posten.", "Allows creating, editing and deleting webhooks – and posting under any name with them."],
  ["MANAGE_GUILD_EXPRESSIONS", 30, "general", "", "2!", "Ausdrücke verwalten", "Manage Expressions",
    "Darf Emojis, Sticker und Sounds aller Mitglieder bearbeiten und löschen.", "Allows editing and deleting emojis, stickers and sounds created by anyone."],
  ["USE_APPLICATION_COMMANDS", 31, "apps", "TVS", "", "Anwendungsbefehle verwenden", "Use Application Commands",
    "Darf Slash-Befehle und Kontextmenü-Befehle nutzen.", "Allows using slash commands and context menu commands."],
  ["REQUEST_TO_SPEAK", 32, "stage", "S", "", "Redeanfrage", "Request to Speak",
    "Darf in Stage-Kanälen um das Wort bitten.", "Allows requesting to speak in stage channels."],
  ["MANAGE_EVENTS", 33, "events", "VS", "", "Events verwalten", "Manage Events",
    "Darf Events aller Mitglieder bearbeiten und löschen.", "Allows editing and deleting events created by anyone."],
  ["MANAGE_THREADS", 34, "text", "T", "2", "Threads verwalten", "Manage Threads and Posts",
    "Darf Threads löschen, archivieren und alle privaten Threads sehen.", "Allows deleting and archiving threads and viewing all private threads."],
  ["CREATE_PUBLIC_THREADS", 35, "text", "T", "", "Öffentliche Threads erstellen", "Create Public Threads",
    "Darf öffentliche Threads und Ankündigungs-Threads starten.", "Allows starting public and announcement threads."],
  ["CREATE_PRIVATE_THREADS", 36, "text", "T", "", "Private Threads erstellen", "Create Private Threads",
    "Darf private Threads starten, die nur Eingeladene sehen.", "Allows starting invite-only private threads."],
  ["USE_EXTERNAL_STICKERS", 37, "text", "TVS", "", "Externe Sticker verwenden", "Use External Stickers",
    "Darf Sticker aus anderen Servern nutzen.", "Allows using stickers from other servers."],
  ["SEND_MESSAGES_IN_THREADS", 38, "text", "T", "", "In Threads schreiben", "Send Messages in Threads and Posts",
    "Darf in Threads und Forenbeiträgen schreiben.", "Allows sending messages in threads and forum posts."],
  ["USE_EMBEDDED_ACTIVITIES", 39, "apps", "TV", "", "Aktivitäten verwenden", "Use Activities",
    "Darf Aktivitäten (eingebettete Apps und Spiele) starten.", "Allows launching Activities (embedded apps and games)."],
  ["MODERATE_MEMBERS", 40, "membership", "", "!", "Timeout für Mitglieder", "Timeout Members",
    "Darf Mitglieder in den Timeout schicken: kein Schreiben, Reagieren oder Sprechen.", "Allows timing members out: no chatting, reacting or speaking."],
  ["VIEW_CREATOR_MONETIZATION_ANALYTICS", 41, "general", "", "2", "Monetarisierungs-Analysen ansehen", "View Creator Monetization Analytics",
    "Darf die Statistiken zu Rollen-Abos sehen.", "Allows viewing role subscription insights."],
  ["USE_SOUNDBOARD", 42, "voice", "V", "", "Soundboard verwenden", "Use Soundboard",
    "Darf Sounds aus dem Soundboard abspielen.", "Allows playing soundboard sounds."],
  ["CREATE_GUILD_EXPRESSIONS", 43, "general", "", "", "Ausdrücke erstellen", "Create Expressions",
    "Darf Emojis, Sticker und Sounds hochladen und die eigenen bearbeiten.", "Allows uploading emojis, stickers and sounds and editing your own."],
  ["CREATE_EVENTS", 44, "events", "VS", "", "Events erstellen", "Create Events",
    "Darf Events anlegen und die eigenen bearbeiten.", "Allows creating events and editing your own."],
  ["USE_EXTERNAL_SOUNDS", 45, "voice", "V", "", "Externe Sounds verwenden", "Use External Sounds",
    "Darf Soundboard-Sounds aus anderen Servern nutzen.", "Allows using soundboard sounds from other servers."],
  ["SEND_VOICE_MESSAGES", 46, "text", "TVS", "", "Sprachnachrichten senden", "Send Voice Messages",
    "Darf Sprachnachrichten aufnehmen und senden.", "Allows recording and sending voice messages."],
  ["SET_VOICE_CHANNEL_STATUS", 48, "voice", "V", "", "Sprachkanal-Status festlegen", "Set Voice Channel Status",
    "Darf den Status-Text eines Sprachkanals setzen.", "Allows setting a voice channel's status text."],
  ["SEND_POLLS", 49, "text", "TVS", "", "Umfragen erstellen", "Create Polls",
    "Darf Umfragen in Nachrichten erstellen.", "Allows creating polls."],
  ["USE_EXTERNAL_APPS", 50, "apps", "TVS", "", "Externe Apps verwenden", "Use External Apps",
    "Antworten von selbst installierten Apps sind öffentlich. Ohne: nur für den Nutzer sichtbar.", "User-installed apps may reply publicly. Without it their replies are ephemeral."],
  ["PIN_MESSAGES", 51, "text", "T", "", "Nachrichten anpinnen", "Pin Messages",
    "Darf Nachrichten an- und abpinnen. Seit Feb. 2026 nicht mehr in „Nachrichten verwalten“ enthalten.", "Allows pinning and unpinning. Since Feb 2026 no longer part of Manage Messages."],
  ["BYPASS_SLOWMODE", 52, "text", "TVS", "", "Slowmode umgehen", "Bypass Slowmode",
    "Darf trotz Slowmode schreiben. Seit Feb. 2026 ein eigenes Recht.", "Allows sending despite slowmode. Its own permission since Feb 2026."],
];

const DJS_SPECIAL: Record<string, string> = { SEND_TTS_MESSAGES: "SendTTSMessages", USE_VAD: "UseVAD" };
const pascal = (key: string) =>
  DJS_SPECIAL[key] ?? key.toLowerCase().split("_").map((w) => w[0]!.toUpperCase() + w.slice(1)).join("");

export const PERMISSIONS: Permission[] = ROWS.map(([key, b, category, scope, marks, de, en, deDesc, enDesc]) => ({
  key,
  bit: b,
  category,
  twoFA: marks.includes("2"),
  dangerous: marks.includes("!"),
  scope: scope.split("").filter(Boolean) as ChannelScope[],
  name: { de, en },
  desc: { de: deDesc, en: enDesc },
  djs: pascal(key),
}));

export const PERMISSION_BY_KEY: Record<string, Permission> = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p]));
export const PERMISSION_BY_BIT: Map<number, Permission> = new Map(PERMISSIONS.map((p) => [p.bit, p]));

/** Every documented permission: bits 0–52 without 47 = 0x1F7FFFFFFFFFFF. */
export const ALL_PERMISSIONS: bigint = fromBits(PERMISSIONS.map((p) => p.bit));

export const CATEGORIES: { id: PermCategory; name: { de: string; en: string } }[] = [
  { id: "general", name: { de: "Allgemeine Serverrechte", en: "General server" } },
  { id: "membership", name: { de: "Mitgliedschaft", en: "Membership" } },
  { id: "text", name: { de: "Textkanal", en: "Text channel" } },
  { id: "voice", name: { de: "Sprachkanal", en: "Voice channel" } },
  { id: "stage", name: { de: "Stage-Kanal", en: "Stage channel" } },
  { id: "events", name: { de: "Events", en: "Events" } },
  { id: "apps", name: { de: "Apps", en: "Apps" } },
  { id: "advanced", name: { de: "Erweitert", en: "Advanced" } },
];

export function permissionsInCategory(cat: PermCategory): Permission[] {
  return PERMISSIONS.filter((p) => p.category === cat);
}

export function valueOf(keys: string[]): bigint {
  let v = 0n;
  for (const k of keys) {
    const p = PERMISSION_BY_KEY[k];
    if (!p) throw new Error(`unknown permission ${k}`);
    v |= bit(p.bit);
  }
  return v;
}

export interface Decoded {
  known: Permission[];
  /** Set bits Discord does not document (yet). Preserved, never dropped. */
  unknown: number[];
}

export function decodePermissions(value: bigint): Decoded {
  const known = bitsOf(value)
    .map((b) => PERMISSION_BY_BIT.get(b))
    .filter((p): p is Permission => !!p);
  return { known, unknown: unknownBits(value, ALL_PERMISSIONS) };
}

export function comparePermissions(from: bigint, to: bigint): BitDiff {
  return diffBits(from, to);
}

export function hasAdministrator(value: bigint): boolean {
  return (value & bit(3)) !== 0n;
}

export interface Preset {
  id: string;
  name: { de: string; en: string };
  hint: { de: string; en: string };
  keys: string[];
  warn?: boolean;
}

const BASE = ["VIEW_CHANNEL", "SEND_MESSAGES", "SEND_MESSAGES_IN_THREADS", "EMBED_LINKS", "READ_MESSAGE_HISTORY"];

export const PRESETS: Preset[] = [
  {
    id: "basic",
    name: { de: "Basis-Bot", en: "Basic bot" },
    hint: { de: "Lesen, schreiben, Embeds, Reaktionen", en: "Read, write, embeds, reactions" },
    keys: [...BASE, "ATTACH_FILES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS"],
  },
  {
    id: "read",
    name: { de: "Nur lesen", en: "Read only" },
    hint: { de: "Kanäle sehen und Verlauf lesen", en: "See channels and read history" },
    keys: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"],
  },
  {
    id: "moderation",
    name: { de: "Moderations-Bot", en: "Moderation bot" },
    hint: { de: "Kicken, bannen, Timeout, Nachrichten löschen", en: "Kick, ban, timeout, delete messages" },
    keys: [...BASE, "ADD_REACTIONS", "MANAGE_MESSAGES", "MANAGE_THREADS", "KICK_MEMBERS", "BAN_MEMBERS", "MODERATE_MEMBERS",
      "MANAGE_NICKNAMES", "VIEW_AUDIT_LOG", "BYPASS_SLOWMODE"],
  },
  {
    id: "music",
    name: { de: "Musik-Bot", en: "Music bot" },
    hint: { de: "Sprachkanal beitreten und abspielen", en: "Join voice and play audio" },
    keys: [...BASE, "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "CONNECT", "SPEAK", "USE_VAD", "REQUEST_TO_SPEAK"],
  },
  {
    id: "announcement",
    name: { de: "Ankündigungs-Bot", en: "Announcement bot" },
    hint: { de: "Posten, @everyone, anpinnen, Threads", en: "Post, @everyone, pin, threads" },
    keys: [...BASE, "ATTACH_FILES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "MENTION_EVERYONE", "PIN_MESSAGES",
      "CREATE_PUBLIC_THREADS", "SEND_POLLS"],
  },
  {
    id: "admin",
    name: { de: "Administrator", en: "Administrator" },
    hint: { de: "Alles – nur wenn du es wirklich brauchst", en: "Everything – only if you really need it" },
    keys: ["ADMINISTRATOR"],
    warn: true,
  },
];

export function presetValue(id: string): bigint {
  const p = PRESETS.find((x) => x.id === id);
  if (!p) throw new Error(`unknown preset ${id}`);
  return valueOf(p.keys);
}

/** discord.js expression, e.g. `PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages`. Unknown bits as literal. */
export function toDiscordJsFlags(value: bigint): string {
  const { known, unknown } = decodePermissions(value);
  const parts = known.map((p) => `PermissionFlagsBits.${p.djs}`);
  for (const u of unknown) parts.push(`(1n << ${u}n)`);
  return parts.length ? parts.join(" | ") : "0n";
}

/** Searchable text for a permission (both languages + key + value). */
export function searchText(p: Permission): string {
  return [p.key, p.name.de, p.name.en, p.desc.de, p.desc.en, String(p.bit), bit(p.bit).toString()].join(" ").toLowerCase();
}
