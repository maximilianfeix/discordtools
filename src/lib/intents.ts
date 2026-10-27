/**
 * Gateway intents. Source: docs.discord.com/developers/events/gateway#list-of-intents (docs repo, 2026-10).
 * Bits 17–19 and 22–23 are not assigned. Privileged: GUILD_MEMBERS, GUILD_PRESENCES, MESSAGE_CONTENT.
 */
import { bit, bitsOf, fromBits, unknownBits } from "./bitfield";

export interface Intent {
  key: string;
  bit: number;
  privileged: boolean;
  events: string[];
  /** discord.js GatewayIntentBits name */
  djs: string;
  /** discord.py discord.Intents attribute */
  dpy: string;
  name: { de: string; en: string };
  desc: { de: string; en: string };
}

export const INTENTS: Intent[] = [
  {
    key: "GUILDS", bit: 0, privileged: false, djs: "Guilds", dpy: "guilds",
    events: ["GUILD_CREATE", "GUILD_UPDATE", "GUILD_DELETE", "GUILD_ROLE_CREATE", "GUILD_ROLE_UPDATE", "GUILD_ROLE_DELETE", "CHANNEL_CREATE",
      "CHANNEL_UPDATE", "CHANNEL_DELETE", "CHANNEL_PINS_UPDATE", "THREAD_CREATE", "THREAD_UPDATE", "THREAD_DELETE", "THREAD_LIST_SYNC",
      "THREAD_MEMBER_UPDATE", "THREAD_MEMBERS_UPDATE", "STAGE_INSTANCE_CREATE", "STAGE_INSTANCE_UPDATE", "STAGE_INSTANCE_DELETE",
      "VOICE_CHANNEL_STATUS_UPDATE", "VOICE_CHANNEL_START_TIME_UPDATE"],
    name: { de: "Server", en: "Guilds" },
    desc: { de: "Server, Rollen, Kanäle und Threads. Fast jeder Bot braucht das – ohne fehlt der Cache.", en: "Servers, roles, channels and threads. Almost every bot needs it – without it the cache is empty." },
  },
  {
    key: "GUILD_MEMBERS", bit: 1, privileged: true, djs: "GuildMembers", dpy: "members",
    events: ["GUILD_MEMBER_ADD", "GUILD_MEMBER_UPDATE", "GUILD_MEMBER_REMOVE", "THREAD_MEMBERS_UPDATE"],
    name: { de: "Mitglieder", en: "Guild members" },
    desc: { de: "Beitritte, Austritte und Änderungen an Mitgliedern, plus die komplette Mitgliederliste. Für Willkommensnachrichten und Auto-Rollen.", en: "Joins, leaves and member updates, plus the full member list. For welcome messages and auto roles." },
  },
  {
    key: "GUILD_MODERATION", bit: 2, privileged: false, djs: "GuildModeration", dpy: "moderation",
    events: ["GUILD_AUDIT_LOG_ENTRY_CREATE", "GUILD_BAN_ADD", "GUILD_BAN_REMOVE"],
    name: { de: "Moderation", en: "Moderation" },
    desc: { de: "Banns, Entbannungen und neue Audit-Log-Einträge (früher GUILD_BANS).", en: "Bans, unbans and new audit log entries (formerly GUILD_BANS)." },
  },
  {
    key: "GUILD_EXPRESSIONS", bit: 3, privileged: false, djs: "GuildExpressions", dpy: "expressions",
    events: ["GUILD_EMOJIS_UPDATE", "GUILD_STICKERS_UPDATE", "GUILD_SOUNDBOARD_SOUND_CREATE", "GUILD_SOUNDBOARD_SOUND_UPDATE",
      "GUILD_SOUNDBOARD_SOUND_DELETE", "GUILD_SOUNDBOARD_SOUNDS_UPDATE"],
    name: { de: "Ausdrücke", en: "Expressions" },
    desc: { de: "Änderungen an Emojis, Stickern und Soundboard-Sounds (früher GUILD_EMOJIS_AND_STICKERS).", en: "Changes to emojis, stickers and soundboard sounds (formerly GUILD_EMOJIS_AND_STICKERS)." },
  },
  {
    key: "GUILD_INTEGRATIONS", bit: 4, privileged: false, djs: "GuildIntegrations", dpy: "integrations",
    events: ["GUILD_INTEGRATIONS_UPDATE", "INTEGRATION_CREATE", "INTEGRATION_UPDATE", "INTEGRATION_DELETE"],
    name: { de: "Integrationen", en: "Integrations" },
    desc: { de: "Wenn Bots, Twitch- oder YouTube-Integrationen hinzugefügt oder geändert werden.", en: "When bots, Twitch or YouTube integrations are added or changed." },
  },
  {
    key: "GUILD_WEBHOOKS", bit: 5, privileged: false, djs: "GuildWebhooks", dpy: "webhooks",
    events: ["WEBHOOKS_UPDATE"],
    name: { de: "Webhooks", en: "Webhooks" },
    desc: { de: "Meldet, wenn sich die Webhooks eines Kanals ändern.", en: "Fires when a channel's webhooks change." },
  },
  {
    key: "GUILD_INVITES", bit: 6, privileged: false, djs: "GuildInvites", dpy: "invites",
    events: ["INVITE_CREATE", "INVITE_DELETE"],
    name: { de: "Einladungen", en: "Invites" },
    desc: { de: "Neue und gelöschte Einladungen – für Invite-Tracker.", en: "Created and deleted invites – for invite trackers." },
  },
  {
    key: "GUILD_VOICE_STATES", bit: 7, privileged: false, djs: "GuildVoiceStates", dpy: "voice_states",
    events: ["VOICE_CHANNEL_EFFECT_SEND", "VOICE_STATE_UPDATE"],
    name: { de: "Sprachstatus", en: "Voice states" },
    desc: { de: "Wer in welchem Sprachkanal ist. Pflicht für Musik-Bots, sonst kann der Bot nicht beitreten.", en: "Who is in which voice channel. Required for music bots, otherwise the bot can't join." },
  },
  {
    key: "GUILD_PRESENCES", bit: 8, privileged: true, djs: "GuildPresences", dpy: "presences",
    events: ["PRESENCE_UPDATE"],
    name: { de: "Online-Status", en: "Presences" },
    desc: { de: "Online-Status, Aktivitäten („Spielt …“) und Geräte aller Mitglieder. Erzeugt sehr viel Traffic.", en: "Online status, activities (“Playing …”) and devices of all members. Creates a lot of traffic." },
  },
  {
    key: "GUILD_MESSAGES", bit: 9, privileged: false, djs: "GuildMessages", dpy: "guild_messages",
    events: ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "MESSAGE_DELETE_BULK"],
    name: { de: "Server-Nachrichten", en: "Guild messages" },
    desc: { de: "Nachrichten in Servern. Ohne MESSAGE_CONTENT sind Text, Embeds und Anhänge leer.", en: "Messages in servers. Without MESSAGE_CONTENT the text, embeds and attachments are empty." },
  },
  {
    key: "GUILD_MESSAGE_REACTIONS", bit: 10, privileged: false, djs: "GuildMessageReactions", dpy: "guild_reactions",
    events: ["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE", "MESSAGE_REACTION_REMOVE_ALL", "MESSAGE_REACTION_REMOVE_EMOJI"],
    name: { de: "Server-Reaktionen", en: "Guild reactions" },
    desc: { de: "Reaktionen in Servern – für Reaction-Roles.", en: "Reactions in servers – for reaction roles." },
  },
  {
    key: "GUILD_MESSAGE_TYPING", bit: 11, privileged: false, djs: "GuildMessageTyping", dpy: "guild_typing",
    events: ["TYPING_START"],
    name: { de: "Tippen im Server", en: "Guild typing" },
    desc: { de: "„… schreibt gerade“ in Server-Kanälen.", en: "“… is typing” in server channels." },
  },
  {
    key: "DIRECT_MESSAGES", bit: 12, privileged: false, djs: "DirectMessages", dpy: "dm_messages",
    events: ["MESSAGE_CREATE", "MESSAGE_UPDATE", "MESSAGE_DELETE", "CHANNEL_PINS_UPDATE"],
    name: { de: "Direktnachrichten", en: "Direct messages" },
    desc: { de: "Nachrichten in DMs mit dem Bot. Inhalt kommt hier auch ohne MESSAGE_CONTENT an.", en: "Messages in DMs with the bot. Content arrives here even without MESSAGE_CONTENT." },
  },
  {
    key: "DIRECT_MESSAGE_REACTIONS", bit: 13, privileged: false, djs: "DirectMessageReactions", dpy: "dm_reactions",
    events: ["MESSAGE_REACTION_ADD", "MESSAGE_REACTION_REMOVE", "MESSAGE_REACTION_REMOVE_ALL", "MESSAGE_REACTION_REMOVE_EMOJI"],
    name: { de: "DM-Reaktionen", en: "DM reactions" },
    desc: { de: "Reaktionen in DMs mit dem Bot.", en: "Reactions in DMs with the bot." },
  },
  {
    key: "DIRECT_MESSAGE_TYPING", bit: 14, privileged: false, djs: "DirectMessageTyping", dpy: "dm_typing",
    events: ["TYPING_START"],
    name: { de: "Tippen in DMs", en: "DM typing" },
    desc: { de: "„… schreibt gerade“ in DMs mit dem Bot.", en: "“… is typing” in DMs with the bot." },
  },
  {
    key: "MESSAGE_CONTENT", bit: 15, privileged: true, djs: "MessageContent", dpy: "message_content",
    events: [],
    name: { de: "Nachrichteninhalt", en: "Message content" },
    desc: { de: "Kein eigenes Event: füllt content, embeds, attachments, components und poll in Nachrichten. Für Präfix-Befehle wie !help nötig – Slash-Befehle brauchen es nicht.", en: "No events of its own: fills content, embeds, attachments, components and poll in messages. Needed for prefix commands like !help – slash commands don't need it." },
  },
  {
    key: "GUILD_SCHEDULED_EVENTS", bit: 16, privileged: false, djs: "GuildScheduledEvents", dpy: "guild_scheduled_events",
    events: ["GUILD_SCHEDULED_EVENT_CREATE", "GUILD_SCHEDULED_EVENT_UPDATE", "GUILD_SCHEDULED_EVENT_DELETE", "GUILD_SCHEDULED_EVENT_USER_ADD",
      "GUILD_SCHEDULED_EVENT_USER_REMOVE"],
    name: { de: "Geplante Events", en: "Scheduled events" },
    desc: { de: "Server-Events und wer sich dafür interessiert.", en: "Server events and who is interested in them." },
  },
  {
    key: "AUTO_MODERATION_CONFIGURATION", bit: 20, privileged: false, djs: "AutoModerationConfiguration", dpy: "auto_moderation_configuration",
    events: ["AUTO_MODERATION_RULE_CREATE", "AUTO_MODERATION_RULE_UPDATE", "AUTO_MODERATION_RULE_DELETE"],
    name: { de: "AutoMod-Regeln", en: "AutoMod configuration" },
    desc: { de: "Wenn AutoMod-Regeln erstellt, geändert oder gelöscht werden.", en: "When AutoMod rules are created, updated or deleted." },
  },
  {
    key: "AUTO_MODERATION_EXECUTION", bit: 21, privileged: false, djs: "AutoModerationExecution", dpy: "auto_moderation_execution",
    events: ["AUTO_MODERATION_ACTION_EXECUTION"],
    name: { de: "AutoMod-Aktionen", en: "AutoMod execution" },
    desc: { de: "Wenn AutoMod eingreift, z. B. eine Nachricht blockiert.", en: "When AutoMod takes action, e.g. blocks a message." },
  },
  {
    key: "GUILD_MESSAGE_POLLS", bit: 24, privileged: false, djs: "GuildMessagePolls", dpy: "guild_polls",
    events: ["MESSAGE_POLL_VOTE_ADD", "MESSAGE_POLL_VOTE_REMOVE"],
    name: { de: "Umfragen im Server", en: "Guild polls" },
    desc: { de: "Stimmen für Umfragen in Servern.", en: "Poll votes in servers." },
  },
  {
    key: "DIRECT_MESSAGE_POLLS", bit: 25, privileged: false, djs: "DirectMessagePolls", dpy: "dm_polls",
    events: ["MESSAGE_POLL_VOTE_ADD", "MESSAGE_POLL_VOTE_REMOVE"],
    name: { de: "Umfragen in DMs", en: "DM polls" },
    desc: { de: "Stimmen für Umfragen in DMs.", en: "Poll votes in DMs." },
  },
];

export const INTENT_BY_BIT = new Map(INTENTS.map((i) => [i.bit, i]));
export const INTENT_BY_KEY: Record<string, Intent> = Object.fromEntries(INTENTS.map((i) => [i.key, i]));
export const ALL_INTENTS = fromBits(INTENTS.map((i) => i.bit));
export const PRIVILEGED_INTENTS = fromBits(INTENTS.filter((i) => i.privileged).map((i) => i.bit));
export const NON_PRIVILEGED_INTENTS = ALL_INTENTS & ~PRIVILEGED_INTENTS;

export function intentsValue(keys: string[]): bigint {
  let v = 0n;
  for (const k of keys) {
    const i = INTENT_BY_KEY[k];
    if (!i) throw new Error(`unknown intent ${k}`);
    v |= bit(i.bit);
  }
  return v;
}

export function decodeIntents(value: bigint): { known: Intent[]; unknown: number[] } {
  return {
    known: bitsOf(value).map((b) => INTENT_BY_BIT.get(b)).filter((i): i is Intent => !!i),
    unknown: unknownBits(value, ALL_INTENTS),
  };
}

export interface IntentPreset {
  id: string;
  name: { de: string; en: string };
  value: bigint;
}

export const INTENT_PRESETS: IntentPreset[] = [
  { id: "minimal", name: { de: "Nur Slash-Befehle", en: "Slash commands only" }, value: intentsValue(["GUILDS"]) },
  { id: "prefix", name: { de: "Präfix-Befehle (!help)", en: "Prefix commands (!help)" }, value: intentsValue(["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"]) },
  { id: "music", name: { de: "Musik-Bot", en: "Music bot" }, value: intentsValue(["GUILDS", "GUILD_VOICE_STATES"]) },
  {
    id: "moderation",
    name: { de: "Moderations-Bot", en: "Moderation bot" },
    value: intentsValue(["GUILDS", "GUILD_MEMBERS", "GUILD_MODERATION", "GUILD_MESSAGES", "MESSAGE_CONTENT", "AUTO_MODERATION_EXECUTION"]),
  },
  { id: "unprivileged", name: { de: "Alle ohne privilegierte", en: "All non-privileged" }, value: NON_PRIVILEGED_INTENTS },
  { id: "all", name: { de: "Alle", en: "All" }, value: ALL_INTENTS },
];

export type IntentNote = "content-without-messages" | "messages-without-content" | "presences-heavy" | "privileged";

export function intentNotes(value: bigint): IntentNote[] {
  const has = (k: string) => (value & bit(INTENT_BY_KEY[k]!.bit)) !== 0n;
  const notes: IntentNote[] = [];
  if ((value & PRIVILEGED_INTENTS) !== 0n) notes.push("privileged");
  if (has("MESSAGE_CONTENT") && !has("GUILD_MESSAGES") && !has("DIRECT_MESSAGES")) notes.push("content-without-messages");
  if (has("GUILD_MESSAGES") && !has("MESSAGE_CONTENT")) notes.push("messages-without-content");
  if (has("GUILD_PRESENCES")) notes.push("presences-heavy");
  return notes;
}

/** discord.js v14 client snippet */
export function discordJsSnippet(value: bigint): string {
  const { known, unknown } = decodeIntents(value);
  const lines = known.map((i) => `    GatewayIntentBits.${i.djs},`);
  for (const u of unknown) lines.push(`    1 << ${u}, // unbekannt / unknown`);
  return `import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
${lines.length ? lines.join("\n") : "    // keine / none"}
  ],
});
// = ${value.toString()}`;
}

/** discord.py 2.x snippet */
export function discordPySnippet(value: bigint): string {
  const { known } = decodeIntents(value);
  const lines = known.map((i) => `intents.${i.dpy} = True${i.privileged ? "  # privilegiert / privileged" : ""}`);
  return `import discord

intents = discord.Intents.none()
${lines.length ? lines.join("\n") : "# keine / none"}

client = discord.Client(intents=intents)
# intents.value == ${value.toString()}`;
}

export function identifySnippet(value: bigint): string {
  return `{
  "op": 2,
  "d": {
    "token": "DEIN_TOKEN / YOUR_TOKEN",
    "intents": ${value.toString()},
    "properties": { "os": "linux", "browser": "my_bot", "device": "my_bot" }
  }
}`;
}
