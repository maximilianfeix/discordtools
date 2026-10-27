import type { Lang } from "../i18n/ui";

export type CategoryId = "messages" | "webhooks" | "lookup" | "developers" | "server" | "profile";

export interface Category {
  id: CategoryId;
  name: Record<Lang, string>;
  blurb: Record<Lang, string>;
}

export const CATEGORIES: Category[] = [
  {
    id: "messages",
    name: { de: "Nachrichten & Formatierung", en: "Messages & formatting" },
    blurb: { de: "Zeitstempel, farbiger Text, Markdown und Erwähnungen.", en: "Timestamps, colored text, markdown and mentions." },
  },
  {
    id: "webhooks",
    name: { de: "Webhooks & Embeds", en: "Webhooks & embeds" },
    blurb: { de: "Nachrichten bauen, senden und verwalten.", en: "Build, send and manage messages." },
  },
  {
    id: "lookup",
    name: { de: "IDs & Lookup", en: "IDs & lookup" },
    blurb: { de: "IDs, Einladungen, Server und Emojis nachschlagen.", en: "Look up IDs, invites, servers and emojis." },
  },
  {
    id: "developers",
    name: { de: "Bots & Entwickler", en: "Bots & developers" },
    blurb: { de: "Rechte, Intents, Einladungslinks und Befehle.", en: "Permissions, intents, invite links and commands." },
  },
  {
    id: "server",
    name: { de: "Server einrichten", en: "Server setup" },
    blurb: { de: "Kanalnamen, Rollenfarben und Regeln.", en: "Channel names, role colors and rules." },
  },
  {
    id: "profile",
    name: { de: "Profil & Spaß", en: "Profile & fun" },
    blurb: { de: "Schriften, unsichtbare Zeichen und Profilbilder.", en: "Fonts, invisible characters and avatars." },
  },
];

export interface Tool {
  /** Stable id, used as the component key and in storage. */
  id: string;
  /** Localized URL slug: /zeitstempel and /en/timestamp. */
  slug: Record<Lang, string>;
  category: CategoryId;
  /** lucide icon name in PascalCase */
  icon: string;
  name: Record<Lang, string>;
  /** One line under the name in cards and search. */
  short: Record<Lang, string>;
  /** Search aliases (both languages). */
  keywords: string[];
  /** true: nothing leaves the browser. false: the browser asks Discord's public API directly. */
  local: boolean;
  popular?: boolean;
  isNew?: boolean;
}

export const TOOLS: Tool[] = [
  // ---------- messages ----------
  {
    id: "timestamp",
    slug: { de: "zeitstempel", en: "timestamp" },
    category: "messages",
    icon: "Clock",
    name: { de: "Zeitstempel-Generator", en: "Timestamp generator" },
    short: {
      de: "<t:…>-Zeitstempel, die jeder in seiner Zeitzone sieht.",
      en: "<t:…> timestamps everyone sees in their own time zone.",
    },
    keywords: ["timestamp", "zeitstempel", "hammertime", "unix", "time", "zeit", "countdown", "relative", "datum", "date"],
    local: true,
    popular: true,
  },
  {
    id: "colored-text",
    slug: { de: "farbiger-text", en: "colored-text" },
    category: "messages",
    icon: "Palette",
    name: { de: "Farbiger Text", en: "Colored text" },
    short: {
      de: "Bunter Text per ANSI-Codeblock – mit Live-Vorschau.",
      en: "Colorful text via ANSI code blocks – with live preview.",
    },
    keywords: ["colored text", "farbiger text", "ansi", "color", "farbe", "bunt", "rainbow", "text color", "textfarbe"],
    local: true,
    popular: true,
  },
  {
    id: "markdown",
    slug: { de: "markdown", en: "markdown" },
    category: "messages",
    icon: "Type",
    name: { de: "Markdown-Editor", en: "Markdown editor" },
    short: {
      de: "Fett, Überschriften, Spoiler, Listen – mit echter Vorschau.",
      en: "Bold, headings, spoilers, lists – with a real preview.",
    },
    keywords: ["markdown", "formatting", "formatierung", "bold", "fett", "spoiler", "heading", "subtext", "small text", "kleiner text", "cheat sheet"],
    local: true,
    popular: true,
  },
  {
    id: "mentions",
    slug: { de: "erwaehnungen", en: "mentions" },
    category: "messages",
    icon: "AtSign",
    name: { de: "Erwähnungen & Syntax", en: "Mentions & syntax" },
    short: {
      de: "Syntax für Nutzer, Rollen, Kanäle, Befehle und Emojis bauen.",
      en: "Build syntax for users, roles, channels, commands and emojis.",
    },
    keywords: ["mention", "erwähnung", "ping", "slash command mention", "channel link", "role mention", "<@", "<#", "emoji syntax"],
    local: true,
  },
  {
    id: "character-counter",
    slug: { de: "zeichenzaehler", en: "character-counter" },
    category: "messages",
    icon: "Ruler",
    name: { de: "Zeichenzähler", en: "Character counter" },
    short: {
      de: "Passt der Text? Limits für Nachrichten, Bio, Embeds und mehr.",
      en: "Will it fit? Limits for messages, bios, embeds and more.",
    },
    keywords: ["character limit", "zeichenlimit", "zeichen", "2000", "4000", "nitro", "bio limit", "length", "counter"],
    local: true,
  },

  // ---------- webhooks ----------
  {
    id: "embed-builder",
    slug: { de: "embed-builder", en: "embed-builder" },
    category: "webhooks",
    icon: "LayoutTemplate",
    name: { de: "Embed-Builder", en: "Embed builder" },
    short: {
      de: "Nachrichten mit Embeds bauen, live sehen und per Webhook senden.",
      en: "Build messages with embeds, preview live and send via webhook.",
    },
    keywords: ["embed", "embed builder", "embed generator", "webhook", "discohook", "message builder", "nachricht", "json"],
    local: true,
    popular: true,
  },
  {
    id: "webhook-manager",
    slug: { de: "webhook-manager", en: "webhook-manager" },
    category: "webhooks",
    icon: "Webhook",
    name: { de: "Webhook-Manager", en: "Webhook manager" },
    short: {
      de: "Webhook prüfen, umbenennen, Avatar ändern oder löschen.",
      en: "Inspect, rename, change avatar or delete a webhook.",
    },
    keywords: ["webhook", "webhook tester", "webhook info", "delete webhook", "webhook löschen", "webhook checker"],
    local: true,
  },
  {
    id: "color-converter",
    slug: { de: "embed-farben", en: "embed-colors" },
    category: "webhooks",
    icon: "Pipette",
    name: { de: "Embed-Farben", en: "Embed colors" },
    short: {
      de: "Hex ↔ Dezimal für Embed-Farben, mit Palette und Kontrastcheck.",
      en: "Hex ↔ decimal for embed colors, with palette and contrast check.",
    },
    keywords: ["color", "farbe", "hex", "decimal", "dezimal", "embed color", "int color", "rgb"],
    local: true,
  },

  // ---------- lookup ----------
  {
    id: "server-tags",
    slug: { de: "server-tag", en: "server-tag" },
    category: "profile",
    icon: "Tag",
    name: { de: "Server-Tag-Generator", en: "Server tag generator" },
    short: {
      de: "Ideen und Vorschau für 4-Zeichen-Server-Tags neben dem Namen.",
      en: "Ideas and preview for the 4-character server tags next to names.",
    },
    keywords: ["server tag", "guild tag", "clan tag", "tag ideen", "tag ideas", "symbols", "symbole", "badge", "primary guild"],
    local: true,
    isNew: true,
  },
  {
    id: "snowflake",
    slug: { de: "snowflake", en: "snowflake" },
    category: "lookup",
    icon: "Snowflake",
    name: { de: "Snowflake-Decoder", en: "Snowflake decoder" },
    short: {
      de: "Wann wurde der Account, Server oder die Nachricht erstellt?",
      en: "When was that account, server or message created?",
    },
    keywords: ["snowflake", "id", "creation date", "erstellungsdatum", "account age", "account alter", "when created", "id to date"],
    local: true,
    popular: true,
  },
  {
    id: "invite-lookup",
    slug: { de: "einladung-pruefen", en: "invite-lookup" },
    category: "lookup",
    icon: "Ticket",
    name: { de: "Einladungs-Lookup", en: "Invite lookup" },
    short: {
      de: "Server hinter einem Einladungslink sehen, ohne beizutreten.",
      en: "See the server behind an invite link without joining.",
    },
    keywords: ["invite", "einladung", "invite checker", "server info", "discord.gg", "invite resolver", "member count"],
    local: false,
  },
  {
    id: "server-widget",
    slug: { de: "server-widget", en: "server-widget" },
    category: "lookup",
    icon: "Server",
    name: { de: "Server-Widget", en: "Server widget" },
    short: {
      de: "Online-Mitglieder und Sprachkanäle eines Servers anzeigen.",
      en: "Show online members and voice channels of a server.",
    },
    keywords: ["widget", "server widget", "online members", "online", "guild", "widget.json", "embed server"],
    local: false,
  },
  {
    id: "emoji-downloader",
    slug: { de: "emoji-download", en: "emoji-downloader" },
    category: "lookup",
    icon: "Smile",
    name: { de: "Emoji & Sticker laden", en: "Emoji & sticker downloader" },
    short: {
      de: "Custom-Emojis und Sticker in voller Größe herunterladen.",
      en: "Download custom emojis and stickers in full size.",
    },
    keywords: ["emoji", "sticker", "download", "herunterladen", "emoji downloader", "gif", "png", "cdn"],
    local: true,
  },

  // ---------- developers ----------
  {
    id: "permissions",
    slug: { de: "rechte-rechner", en: "permissions-calculator" },
    category: "developers",
    icon: "ShieldCheck",
    name: { de: "Rechte-Rechner", en: "Permissions calculator" },
    short: {
      de: "Rechte-Bitfeld berechnen und entschlüsseln – immer aktuell.",
      en: "Calculate and decode permission bitfields – always current.",
    },
    keywords: ["permissions", "rechte", "berechtigungen", "permission calculator", "bitfield", "integer", "administrator"],
    local: true,
    popular: true,
  },
  {
    id: "bot-invite",
    slug: { de: "bot-einladen", en: "bot-invite-link" },
    category: "developers",
    icon: "Link",
    name: { de: "Bot-Einladungslink", en: "Bot invite link" },
    short: {
      de: "OAuth2-Link mit Scopes, Rechten und Installationsart bauen.",
      en: "Build an OAuth2 link with scopes, permissions and install type.",
    },
    keywords: ["bot invite", "oauth2", "invite link", "bot einladen", "scopes", "applications.commands", "add bot"],
    local: true,
  },
  {
    id: "intents",
    slug: { de: "intents-rechner", en: "intents-calculator" },
    category: "developers",
    icon: "Radio",
    name: { de: "Intents-Rechner", en: "Intents calculator" },
    short: {
      de: "Gateway-Intents wählen und den Wert berechnen.",
      en: "Pick gateway intents and get the value.",
    },
    keywords: ["intents", "gateway", "intents calculator", "message content", "privileged", "guild members"],
    local: true,
  },
  {
    id: "slash-commands",
    slug: { de: "slash-command-builder", en: "slash-command-builder" },
    category: "developers",
    icon: "SquareSlash",
    name: { de: "Slash-Command-Builder", en: "Slash command builder" },
    short: {
      de: "Befehle mit Optionen visuell bauen und als JSON exportieren.",
      en: "Design commands with options and export JSON.",
    },
    keywords: ["slash command", "application command", "command builder", "json", "options", "befehl"],
    local: true,
    isNew: true,
  },
  {
    id: "flags",
    slug: { de: "flags-decoder", en: "flags-decoder" },
    category: "developers",
    icon: "Flag",
    name: { de: "Flags-Decoder", en: "Flags decoder" },
    short: {
      de: "Nutzer-, Nachrichten- und Kanal-Flags entschlüsseln.",
      en: "Decode user, message and channel flags.",
    },
    keywords: ["flags", "public_flags", "badges", "message flags", "user flags", "bitfield", "decoder"],
    local: true,
  },
  {
    id: "status",
    slug: { de: "status", en: "status" },
    category: "developers",
    icon: "Activity",
    name: { de: "Discord-Status", en: "Discord status" },
    short: {
      de: "Ist Discord down? Live-Status und aktuelle Störungen.",
      en: "Is Discord down? Live status and current incidents.",
    },
    keywords: ["status", "down", "outage", "störung", "is discord down", "ist discord down", "api status"],
    local: false,
  },

  // ---------- server ----------
  {
    id: "channel-names",
    slug: { de: "kanalnamen", en: "channel-names" },
    category: "server",
    icon: "Hash",
    name: { de: "Kanalnamen-Generator", en: "Channel name generator" },
    short: {
      de: "Schöne Kanalnamen mit Emojis, Trennern und Schriften.",
      en: "Pretty channel names with emojis, separators and fonts.",
    },
    keywords: ["channel name", "kanalname", "kanal", "channel", "separator", "trenner", "aesthetic", "server template", "┃"],
    local: true,
    popular: true,
  },
  {
    id: "role-colors",
    slug: { de: "rollenfarben", en: "role-colors" },
    category: "server",
    icon: "Paintbrush",
    name: { de: "Rollenfarben-Vorschau", en: "Role color preview" },
    short: {
      de: "Rollenfarben und Verläufe im hellen und dunklen Theme testen.",
      en: "Test role colors and gradients in light and dark themes.",
    },
    keywords: ["role color", "rollenfarbe", "gradient", "verlauf", "role", "rolle", "color preview", "contrast"],
    local: true,
  },
  {
    id: "rules-generator",
    slug: { de: "regeln", en: "rules-generator" },
    category: "server",
    icon: "ScrollText",
    name: { de: "Regel-Generator", en: "Rules generator" },
    short: {
      de: "Serverregeln aus Bausteinen – als Text oder Embed.",
      en: "Server rules from building blocks – as text or embed.",
    },
    keywords: ["rules", "regeln", "server rules", "serverregeln", "rules template", "vorlage", "community guidelines"],
    local: true,
  },

  // ---------- profile ----------
  {
    id: "fancy-text",
    slug: { de: "schriftarten", en: "fancy-text" },
    category: "profile",
    icon: "Sparkles",
    name: { de: "Schriftarten-Generator", en: "Fancy text generator" },
    short: {
      de: "𝓢𝓬𝓱𝓻𝓲𝓯𝓽𝓮𝓷 für Namen, Bio und Kanäle – kopieren und fertig.",
      en: "𝓕𝓪𝓷𝓬𝔂 fonts for names, bios and channels – copy and done.",
    },
    keywords: ["fancy text", "fonts", "schriftarten", "schrift", "unicode", "font generator", "cool text", "aesthetic", "bubble", "small caps"],
    local: true,
    popular: true,
  },
  {
    id: "invisible-character",
    slug: { de: "unsichtbares-zeichen", en: "invisible-character" },
    category: "profile",
    icon: "EyeOff",
    name: { de: "Unsichtbares Zeichen", en: "Invisible character" },
    short: {
      de: "Leerer Name, leere Nachricht oder Abstand – sofort kopieren.",
      en: "Blank name, empty message or spacing – copy instantly.",
    },
    keywords: ["invisible", "unsichtbar", "blank", "leer", "empty name", "leerer name", "zero width", "space"],
    local: true,
    popular: true,
  },
  {
    id: "avatar-tools",
    slug: { de: "profilbild", en: "avatar-tool" },
    category: "profile",
    icon: "CircleUserRound",
    name: { de: "Profilbild-Werkzeug", en: "Avatar tool" },
    short: {
      de: "Profilbild zuschneiden und mit Status-Ring testen.",
      en: "Crop your avatar and preview it with a status ring.",
    },
    keywords: ["avatar", "profilbild", "pfp", "crop", "zuschneiden", "banner", "profile picture", "resize"],
    local: true,
    isNew: true,
  },
];

export function toolById(id: string): Tool {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) throw new Error(`unknown tool ${id}`);
  return tool;
}

export function toolsIn(category: CategoryId): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

export function toolPath(tool: Tool, lang: Lang): string {
  return lang === "de" ? `/${tool.slug.de}` : `/en/${tool.slug.en}`;
}
