/**
 * Bitfield flag tables for users, messages, channels, applications, guild system channels and guild members.
 * Source: docs.discord.com (docs repo, 2026-10): resources/user, message, channel, application, guild.
 */
import { bitsOf, fromBits, unknownBits } from "./bitfield";

export type FlagType = "user" | "message" | "channel" | "application" | "system-channel" | "member";

export interface FlagDef {
  bit: number;
  key: string;
  name: { de: string; en: string };
  desc: { de: string; en: string };
  /** Not (or no longer) in the official docs */
  undocumented?: boolean;
}

export interface FlagSet {
  id: FlagType;
  label: { de: string; en: string };
  /** where the value lives in API objects */
  field: string;
  about: { de: string; en: string };
  example: bigint;
  flags: FlagDef[];
}

type R = [bit: number, key: string, de: string, en: string, deDesc: string, enDesc: string, undocumented?: boolean];
const mk = (rows: R[]): FlagDef[] =>
  rows.map(([b, key, de, en, deDesc, enDesc, undocumented]) => ({ bit: b, key, name: { de, en }, desc: { de: deDesc, en: enDesc }, undocumented }));

export const FLAG_SETS: FlagSet[] = [
  {
    id: "user",
    label: { de: "Nutzer (Badges)", en: "User (badges)" },
    field: "user.public_flags",
    about: {
      de: "Die Abzeichen eines Kontos. Nitro- und Boost-Abzeichen stehen nicht im Bitfeld.",
      en: "An account's badges. Nitro and boost badges are not part of the bitfield.",
    },
    example: (1n << 8n) | (1n << 22n),
    flags: mk([
      [0, "STAFF", "Discord-Mitarbeiter", "Discord Staff", "Arbeitet bei Discord.", "Works at Discord."],
      [1, "PARTNER", "Partner-Server-Besitzer", "Partnered Server Owner", "Besitzt einen Discord-Partner-Server.", "Owns a Discord partnered server."],
      [2, "HYPESQUAD", "HypeSquad Events", "HypeSquad Events", "Mitglied bei HypeSquad Events.", "HypeSquad Events member."],
      [3, "BUG_HUNTER_LEVEL_1", "Bug Hunter Stufe 1", "Bug Hunter Level 1", "Hat bestätigte Fehler gemeldet.", "Reported confirmed bugs."],
      [6, "HYPESQUAD_ONLINE_HOUSE_1", "HypeSquad Bravery", "HypeSquad Bravery", "Haus Bravery (lila).", "House Bravery (purple)."],
      [7, "HYPESQUAD_ONLINE_HOUSE_2", "HypeSquad Brilliance", "HypeSquad Brilliance", "Haus Brilliance (orange).", "House Brilliance (orange)."],
      [8, "HYPESQUAD_ONLINE_HOUSE_3", "HypeSquad Balance", "HypeSquad Balance", "Haus Balance (türkis).", "House Balance (teal)."],
      [9, "PREMIUM_EARLY_SUPPORTER", "Früher Unterstützer", "Early Supporter", "Hatte Nitro vor Oktober 2018.", "Had Nitro before October 2018."],
      [10, "TEAM_PSEUDO_USER", "Team-Nutzer", "Team user", "Das Konto ist ein Entwickler-Team, kein Mensch.", "The account is a developer team, not a person."],
      [14, "BUG_HUNTER_LEVEL_2", "Bug Hunter Stufe 2", "Bug Hunter Level 2", "Goldener Bug Hunter.", "Gold bug hunter."],
      [16, "VERIFIED_BOT", "Verifizierter Bot", "Verified Bot", "Bot mit Haken-Abzeichen.", "Bot with the verified checkmark."],
      [17, "VERIFIED_DEVELOPER", "Früher verifizierter Bot-Entwickler", "Early Verified Bot Developer", "Hat vor August 2020 einen Bot verifizieren lassen.", "Got a bot verified before August 2020."],
      [18, "CERTIFIED_MODERATOR", "Moderator-Programm-Alumni", "Moderator Programs Alumni", "Hat am Discord-Moderator-Programm teilgenommen.", "Took part in Discord's moderator programs."],
      [19, "BOT_HTTP_INTERACTIONS", "Bot nur mit HTTP-Interaktionen", "Bot uses HTTP interactions only", "Der Bot läuft ohne Gateway und wird trotzdem in der Mitgliederliste als online gezeigt.", "The bot runs without the gateway and is still shown online in the member list."],
      [22, "ACTIVE_DEVELOPER", "Aktiver Entwickler", "Active Developer", "Hat eine App mit kürzlich genutztem Befehl. Wird von der API geliefert, steht aber nicht mehr in den Docs.", "Owns an app with a recently used command. Returned by the API but no longer listed in the docs.", true],
    ]),
  },
  {
    id: "message",
    label: { de: "Nachricht", en: "Message" },
    field: "message.flags",
    about: {
      de: "Beim Senden per Webhook oder Bot darfst du nur SUPPRESS_EMBEDS, SUPPRESS_NOTIFICATIONS, IS_COMPONENTS_V2 (und bei Interaktionen EPHEMERAL) setzen.",
      en: "When sending via webhook or bot you may only set SUPPRESS_EMBEDS, SUPPRESS_NOTIFICATIONS, IS_COMPONENTS_V2 (and EPHEMERAL for interactions).",
    },
    example: 4n | 4096n,
    flags: mk([
      [0, "CROSSPOSTED", "Veröffentlicht", "Crossposted", "Wurde an folgende Kanäle verteilt (Ankündigungskanal).", "Was published to following channels."],
      [1, "IS_CROSSPOST", "Ist ein Crosspost", "Is crosspost", "Stammt aus einem gefolgten Kanal eines anderen Servers.", "Came from a followed channel in another server."],
      [2, "SUPPRESS_EMBEDS", "Embeds ausblenden", "Suppress embeds", "Link-Vorschauen und Embeds werden nicht angezeigt.", "Link previews and embeds are hidden."],
      [3, "SOURCE_MESSAGE_DELETED", "Quelle gelöscht", "Source deleted", "Die Originalnachricht des Crossposts wurde gelöscht.", "The crosspost's original message was deleted."],
      [4, "URGENT", "Dringend", "Urgent", "Systemnachricht von Discord (Trust & Safety).", "System message from Discord (Trust & Safety)."],
      [5, "HAS_THREAD", "Hat Thread", "Has thread", "Zu der Nachricht gehört ein Thread mit gleicher ID.", "There is a thread with the same ID as the message."],
      [6, "EPHEMERAL", "Nur für dich sichtbar", "Ephemeral", "Nur der Nutzer, der die Interaktion ausgelöst hat, sieht sie.", "Only the user who triggered the interaction sees it."],
      [7, "LOADING", "Lädt („denkt nach“)", "Loading", "Aufgeschobene Interaktions-Antwort: Der Bot „denkt nach“.", "Deferred interaction response: the bot is “thinking”."],
      [8, "FAILED_TO_MENTION_SOME_ROLES_IN_THREAD", "Rollen-Erwähnung im Thread fehlgeschlagen", "Failed to mention roles in thread", "Einige erwähnte Rollen konnten nicht zum Thread hinzugefügt werden.", "Some mentioned roles could not be added to the thread."],
      [12, "SUPPRESS_NOTIFICATIONS", "Stumm (@silent)", "Silent (@silent)", "Löst keine Push- oder Desktop-Benachrichtigung aus.", "Triggers no push or desktop notification."],
      [13, "IS_VOICE_MESSAGE", "Sprachnachricht", "Voice message", "Die Nachricht ist eine Sprachnachricht.", "The message is a voice message."],
      [14, "HAS_SNAPSHOT", "Weitergeleitet", "Forwarded", "Enthält eine weitergeleitete Nachricht (Snapshot).", "Contains a forwarded message (snapshot)."],
      [15, "IS_COMPONENTS_V2", "Components V2", "Components V2", "Nachricht besteht nur aus Komponenten. Lässt sich nicht mehr entfernen.", "Message is made only of components. Cannot be removed again."],
    ]),
  },
  {
    id: "channel",
    label: { de: "Kanal", en: "Channel" },
    field: "channel.flags",
    about: {
      de: "Flags für Kanäle, Threads und Forenbeiträge.",
      en: "Flags for channels, threads and forum posts.",
    },
    example: 16n,
    flags: mk([
      [1, "PINNED", "Angepinnter Beitrag", "Pinned post", "Der Thread ist oben im Forum- oder Medienkanal angepinnt.", "The thread is pinned to the top of its forum or media channel."],
      [4, "REQUIRE_TAG", "Tag erforderlich", "Require tag", "Neue Beiträge im Forum brauchen mindestens einen Tag.", "New forum posts need at least one tag."],
      [15, "HIDE_MEDIA_DOWNLOAD_OPTIONS", "Download ausblenden", "Hide media download", "Blendet die Download-Optionen im Medienkanal aus.", "Hides download options in media channels."],
      [17, "CHANNEL_OBFUSCATED", "Verschleiert", "Obfuscated", "Nur über das Gateway: Der Bot darf den Kanal nicht sehen, Name und Details sind verborgen.", "Gateway only: the bot cannot view the channel, so its name and details are hidden."],
      [21, "IS_SPOILER_CHANNEL", "Spoiler-Kanal", "Spoiler channel", "Mitglieder müssen sich aktiv dafür entscheiden, den Inhalt zu sehen. Nicht zusammen mit NSFW.", "Members must opt in to view the content. Not combined with NSFW."],
    ]),
  },
  {
    id: "application",
    label: { de: "App", en: "Application" },
    field: "application.flags_new",
    about: {
      de: "„flags“ bleibt unter 31 Bit. Neue Bits ab Bit 31 stehen nur in „flags_new“ (als String). „_LIMITED“ heißt: Intent per Schalter aktiv, ohne Prüfung.",
      en: "“flags” stays below 31 bits. New bits from 31 up only appear in “flags_new” (a string). “_LIMITED” means the intent is enabled by toggle, without review.",
    },
    example: (1n << 15n) | (1n << 19n) | (1n << 23n),
    flags: mk([
      [6, "APPLICATION_AUTO_MODERATION_RULE_CREATE_BADGE", "Nutzt AutoMod", "Uses AutoMod", "Die App nutzt die AutoMod-API (Abzeichen im Profil).", "The app uses the AutoMod API (profile badge)."],
      [12, "GATEWAY_PRESENCE", "Presence-Intent (geprüft)", "Presence intent (reviewed)", "Freigegebener Zugriff auf GUILD_PRESENCES.", "Approved access to GUILD_PRESENCES."],
      [13, "GATEWAY_PRESENCE_LIMITED", "Presence-Intent (Schalter)", "Presence intent (toggle)", "GUILD_PRESENCES per Schalter im Portal aktiv.", "GUILD_PRESENCES enabled by toggle in the portal."],
      [14, "GATEWAY_GUILD_MEMBERS", "Members-Intent (geprüft)", "Members intent (reviewed)", "Freigegebener Zugriff auf GUILD_MEMBERS.", "Approved access to GUILD_MEMBERS."],
      [15, "GATEWAY_GUILD_MEMBERS_LIMITED", "Members-Intent (Schalter)", "Members intent (toggle)", "GUILD_MEMBERS per Schalter im Portal aktiv.", "GUILD_MEMBERS enabled by toggle in the portal."],
      [16, "VERIFICATION_PENDING_GUILD_LIMIT", "Verifizierung blockiert", "Verification blocked", "Ungewöhnliches Wachstum verhindert die Verifizierung.", "Unusual growth prevents verification."],
      [17, "EMBEDDED", "Aktivität", "Embedded", "Die App läuft eingebettet im Client (Activity).", "The app runs embedded in the client (Activity)."],
      [18, "GATEWAY_MESSAGE_CONTENT", "Message-Content-Intent (geprüft)", "Message content intent (reviewed)", "Freigegebener Zugriff auf MESSAGE_CONTENT.", "Approved access to MESSAGE_CONTENT."],
      [19, "GATEWAY_MESSAGE_CONTENT_LIMITED", "Message-Content-Intent (Schalter)", "Message content intent (toggle)", "MESSAGE_CONTENT per Schalter im Portal aktiv.", "MESSAGE_CONTENT enabled by toggle in the portal."],
      [23, "APPLICATION_COMMAND_BADGE", "Hat Befehle", "Has commands", "Die App hat globale Befehle registriert (Abzeichen im Profil).", "The app registered global commands (profile badge)."],
    ]),
  },
  {
    id: "system-channel",
    label: { de: "Systemkanal", en: "System channel" },
    field: "guild.system_channel_flags",
    about: {
      de: "Welche automatischen Nachrichten im Systemkanal eines Servers unterdrückt werden. Gesetztes Bit = ausgeschaltet.",
      en: "Which automatic messages are suppressed in a server's system channel. Set bit = turned off.",
    },
    example: 4n | 8n,
    flags: mk([
      [0, "SUPPRESS_JOIN_NOTIFICATIONS", "Keine Beitritts-Nachrichten", "No join messages", "Unterdrückt „X ist beigetreten“.", "Suppresses “X joined”."],
      [1, "SUPPRESS_PREMIUM_SUBSCRIPTIONS", "Keine Boost-Nachrichten", "No boost messages", "Unterdrückt Server-Boost-Meldungen.", "Suppresses server boost messages."],
      [2, "SUPPRESS_GUILD_REMINDER_NOTIFICATIONS", "Keine Einrichtungs-Tipps", "No setup tips", "Unterdrückt Tipps zur Server-Einrichtung.", "Suppresses server setup tips."],
      [3, "SUPPRESS_JOIN_NOTIFICATION_REPLIES", "Keine Sticker-Antwort beim Beitritt", "No join sticker replies", "Blendet den „Winken“-Sticker-Button aus.", "Hides the wave sticker reply button."],
      [4, "SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATIONS", "Keine Rollen-Abo-Nachrichten", "No role subscription messages", "Unterdrückt Kauf- und Verlängerungs-Meldungen für Rollen-Abos.", "Suppresses role subscription purchase and renewal messages."],
      [5, "SUPPRESS_ROLE_SUBSCRIPTION_PURCHASE_NOTIFICATION_REPLIES", "Keine Sticker-Antwort bei Rollen-Abos", "No role subscription sticker replies", "Blendet den Sticker-Button bei Rollen-Abo-Meldungen aus.", "Hides the sticker reply button on role subscription messages."],
    ]),
  },
  {
    id: "member",
    label: { de: "Mitglied", en: "Member" },
    field: "member.flags",
    about: {
      de: "Flags eines Server-Mitglieds. Nur BYPASSES_VERIFICATION kann ein Bot ändern.",
      en: "Flags of a server member. Bots can only change BYPASSES_VERIFICATION.",
    },
    example: 2n | 8n,
    flags: mk([
      [0, "DID_REJOIN", "Erneut beigetreten", "Rejoined", "Hat den Server verlassen und ist wieder beigetreten.", "Left and rejoined the server."],
      [1, "COMPLETED_ONBOARDING", "Onboarding abgeschlossen", "Completed onboarding", "Hat das Onboarding abgeschlossen.", "Finished onboarding."],
      [2, "BYPASSES_VERIFICATION", "Verifizierung umgehen", "Bypasses verification", "Ist von der Verifizierungsstufe ausgenommen. Als einziges Flag änderbar.", "Is exempt from verification requirements. The only editable flag."],
      [3, "STARTED_ONBOARDING", "Onboarding begonnen", "Started onboarding", "Hat das Onboarding begonnen.", "Started onboarding."],
      [4, "IS_GUEST", "Gast", "Guest", "Darf nur den Sprachkanal nutzen, in den er eingeladen wurde.", "Can only use the voice channel they were invited to."],
      [5, "STARTED_HOME_ACTIONS", "Server-Guide begonnen", "Started home actions", "Hat mit den Aufgaben im Server-Guide angefangen.", "Started the Server Guide new member actions."],
      [6, "COMPLETED_HOME_ACTIONS", "Server-Guide abgeschlossen", "Completed home actions", "Hat die Aufgaben im Server-Guide erledigt.", "Completed the Server Guide new member actions."],
      [7, "AUTOMOD_QUARANTINED_USERNAME", "Name von AutoMod blockiert", "Name quarantined by AutoMod", "Nutzername, Anzeigename oder Nickname ist durch AutoMod blockiert.", "Username, display name or nickname is blocked by AutoMod."],
      [9, "DM_SETTINGS_UPSELL_ACKNOWLEDGED", "DM-Hinweis geschlossen", "DM upsell dismissed", "Hat den Hinweis zu DM-Einstellungen weggeklickt.", "Dismissed the DM settings upsell."],
      [10, "AUTOMOD_QUARANTINED_GUILD_TAG", "Server-Tag von AutoMod blockiert", "Guild tag quarantined by AutoMod", "Der Server-Tag des Mitglieds ist durch AutoMod blockiert.", "The member's guild tag is blocked by AutoMod."],
    ]),
  },
];

export const FLAG_SET_BY_ID: Record<FlagType, FlagSet> = Object.fromEntries(FLAG_SETS.map((f) => [f.id, f])) as Record<FlagType, FlagSet>;

export function knownMask(set: FlagSet): bigint {
  return fromBits(set.flags.map((f) => f.bit));
}

export function decodeFlags(type: FlagType, value: bigint): { known: FlagDef[]; unknown: number[] } {
  const set = FLAG_SET_BY_ID[type];
  const byBit = new Map(set.flags.map((f) => [f.bit, f]));
  return {
    known: bitsOf(value).map((b) => byBit.get(b)).filter((f): f is FlagDef => !!f),
    unknown: unknownBits(value, knownMask(set)),
  };
}

export function encodeFlags(type: FlagType, keys: string[]): bigint {
  const set = FLAG_SET_BY_ID[type];
  let v = 0n;
  for (const k of keys) {
    const f = set.flags.find((x) => x.key === k);
    if (!f) throw new Error(`unknown flag ${k} for ${type}`);
    v |= 1n << BigInt(f.bit);
  }
  return v;
}

export function isFlagType(s: string | null): s is FlagType {
  return !!s && s in FLAG_SET_BY_ID;
}
