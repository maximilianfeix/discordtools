/** Invite parsing, CDN URLs and human labels for the invite lookup tool. */
import type { Lang } from "../i18n/ui";

const CDN = "https://cdn.discordapp.com";

/** Extracts the invite code from discord.gg/x, discord.com/invite/x, discordapp.com/invite/x or a bare code. */
export function parseInviteCode(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m = s.match(/(?:https?:\/\/)?(?:www\.|ptb\.|canary\.)?(?:discord\.gg|discord(?:app)?\.com\/invite|discord\.com\/api\/(?:v\d+\/)?invites)\/([A-Za-z0-9-]{2,64})/i);
  if (m) return m[1]!;
  if (/^[A-Za-z0-9-]{2,64}$/.test(s)) return s;
  return null;
}

export function inviteApiUrl(code: string): string {
  return `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true&with_expiration=true`;
}

export interface InviteGuild {
  id: string;
  name: string;
  icon: string | null;
  splash: string | null;
  banner: string | null;
  description: string | null;
  features: string[];
  verification_level: number;
  vanity_url_code: string | null;
  nsfw_level: number;
  nsfw?: boolean;
  premium_subscription_count?: number;
  premium_tier?: number;
}

export interface Invite {
  type: number;
  code: string;
  expires_at?: string | null;
  guild?: InviteGuild;
  guild_id?: string;
  channel?: { id: string; type: number; name: string | null; icon?: string | null } | null;
  inviter?: { id: string; username: string; global_name?: string | null; avatar?: string | null };
  target_type?: number;
  target_application?: { id: string; name: string };
  approximate_member_count?: number;
  approximate_presence_count?: number;
  guild_scheduled_event?: { name: string; scheduled_start_time: string };
  profile?: {
    tag?: string | null;
    badge_hash?: string | null;
    member_count?: number;
    online_count?: number;
  };
}

export function guildIconUrl(guildId: string, hash: string, size = 256): string {
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `${CDN}/icons/${guildId}/${hash}.${ext}?size=${size}`;
}
export function guildBannerUrl(guildId: string, hash: string, size = 1024): string {
  const ext = hash.startsWith("a_") ? "gif" : "png";
  return `${CDN}/banners/${guildId}/${hash}.${ext}?size=${size}`;
}
export function guildSplashUrl(guildId: string, hash: string, size = 1024): string {
  return `${CDN}/splashes/${guildId}/${hash}.png?size=${size}`;
}
export function guildTagBadgeUrl(guildId: string, hash: string): string {
  return `${CDN}/guild-tag-badges/${guildId}/${hash}.png?size=32`;
}

type Labels = Record<Lang, string>;

export const VERIFICATION: { label: Labels; desc: Labels }[] = [
  { label: { de: "Keine", en: "None" }, desc: { de: "Jeder kann sofort schreiben.", en: "Anyone can chat right away." } },
  { label: { de: "Niedrig", en: "Low" }, desc: { de: "Bestätigte E-Mail-Adresse nötig.", en: "Verified email required." } },
  {
    label: { de: "Mittel", en: "Medium" },
    desc: { de: "E-Mail bestätigt und länger als 5 Minuten bei Discord.", en: "Verified email and registered for over 5 minutes." },
  },
  {
    label: { de: "Hoch", en: "High" },
    desc: { de: "Zusätzlich länger als 10 Minuten Mitglied des Servers.", en: "Also a member of the server for over 10 minutes." },
  },
  { label: { de: "Sehr hoch", en: "Highest" }, desc: { de: "Bestätigte Telefonnummer nötig.", en: "Verified phone number required." } },
];

export const NSFW_LEVEL: Labels[] = [
  { de: "Standard", en: "Default" },
  { de: "Explizit", en: "Explicit" },
  { de: "Sicher", en: "Safe" },
  { de: "Altersbeschränkt", en: "Age-restricted" },
];

export const BOOST_TIER: Labels[] = [
  { de: "Kein Boost-Level", en: "No boost level" },
  { de: "Level 1", en: "Level 1" },
  { de: "Level 2", en: "Level 2" },
  { de: "Level 3", en: "Level 3" },
];

export const CHANNEL_TYPE: Record<number, Labels> = {
  0: { de: "Textkanal", en: "Text channel" },
  1: { de: "Direktnachricht", en: "Direct message" },
  2: { de: "Sprachkanal", en: "Voice channel" },
  3: { de: "Gruppen-DM", en: "Group DM" },
  4: { de: "Kategorie", en: "Category" },
  5: { de: "Ankündigungskanal", en: "Announcement channel" },
  13: { de: "Stage-Kanal", en: "Stage channel" },
  15: { de: "Forum", en: "Forum" },
  16: { de: "Medienkanal", en: "Media channel" },
};

export const INVITE_TYPE: Labels[] = [
  { de: "Server-Einladung", en: "Server invite" },
  { de: "Gruppen-DM-Einladung", en: "Group DM invite" },
  { de: "Freundschaftseinladung", en: "Friend invite" },
];

/** The features people actually care about; everything else gets a readable fallback. */
export const FEATURES: Record<string, Labels> = {
  VERIFIED: { de: "Verifiziert", en: "Verified" },
  PARTNERED: { de: "Discord-Partner", en: "Discord Partner" },
  COMMUNITY: { de: "Community-Server", en: "Community server" },
  DISCOVERABLE: { de: "In „Entdecken“ gelistet", en: "Listed in Discovery" },
  VANITY_URL: { de: "Eigene Einladungs-URL", en: "Custom invite URL" },
  ANIMATED_ICON: { de: "Animiertes Icon", en: "Animated icon" },
  ANIMATED_BANNER: { de: "Animiertes Banner", en: "Animated banner" },
  BANNER: { de: "Server-Banner", en: "Server banner" },
  INVITE_SPLASH: { de: "Einladungs-Hintergrund", en: "Invite splash" },
  NEWS: { de: "Ankündigungskanäle", en: "Announcement channels" },
  ROLE_ICONS: { de: "Rollen-Icons", en: "Role icons" },
  WELCOME_SCREEN_ENABLED: { de: "Willkommensbildschirm", en: "Welcome screen" },
  MEMBER_VERIFICATION_GATE_ENABLED: { de: "Regel-Bestätigung beim Beitritt", en: "Membership screening" },
  GUILD_ONBOARDING: { de: "Onboarding", en: "Onboarding" },
  PREVIEW_ENABLED: { de: "Vorschau ohne Beitritt", en: "Preview without joining" },
  AUTO_MODERATION: { de: "AutoMod", en: "AutoMod" },
  ROLE_SUBSCRIPTIONS_ENABLED: { de: "Server-Abos", en: "Server subscriptions" },
  CREATOR_MONETIZABLE_PROVISIONAL: { de: "Monetarisierung", en: "Monetization" },
  TICKETED_EVENTS_ENABLED: { de: "Ticket-Events", en: "Ticketed events" },
  GUILD_TAGS: { de: "Server-Tag", en: "Server tag" },
  SOUNDBOARD: { de: "Soundboard", en: "Soundboard" },
  RAID_ALERTS_DISABLED: { de: "Raid-Warnungen aus", en: "Raid alerts off" },
  INVITES_DISABLED: { de: "Einladungen pausiert", en: "Invites paused" },
  THREADS_ENABLED: { de: "Threads", en: "Threads" },
  TEXT_IN_VOICE_ENABLED: { de: "Text in Sprachkanälen", en: "Text in voice" },
  HAS_DIRECTORY_ENTRY: { de: "Im Hub-Verzeichnis", en: "In a hub directory" },
  HUB: { de: "Studenten-Hub", en: "Student hub" },
  ENHANCED_ROLE_COLORS: { de: "Verlaufs-Rollenfarben", en: "Gradient role colors" },
  GUILD_WEB_PAGE_VANITY_URL: { de: "Server-Webseite", en: "Server web page" },
  MORE_EMOJI: { de: "Mehr Emoji-Plätze", en: "More emoji slots" },
  MORE_STICKERS: { de: "Mehr Sticker-Plätze", en: "More sticker slots" },
  MORE_SOUNDBOARD: { de: "Mehr Soundboard-Plätze", en: "More soundboard slots" },
  TIERLESS_BOOSTING: { de: "Boosten ohne Level", en: "Tierless boosting" },
};

/** Features that are worth highlighting at the top (badges). The rest go into a collapsible list. */
export const KEY_FEATURES = ["VERIFIED", "PARTNERED", "COMMUNITY", "DISCOVERABLE", "VANITY_URL", "INVITES_DISABLED"];

export function featureLabel(feature: string, lang: Lang): string {
  const known = FEATURES[feature];
  if (known) return known[lang];
  const words = feature.toLowerCase().split("_").filter(Boolean);
  const s = words.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Sorts features: known ones first (in our order), then the rest alphabetically. */
export function sortFeatures(features: string[]): { known: string[]; other: string[] } {
  const order = Object.keys(FEATURES);
  const known = features.filter((f) => f in FEATURES).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const other = features.filter((f) => !(f in FEATURES)).sort();
  return { known, other };
}

export function inviteUrl(code: string): string {
  return `https://discord.gg/${code}`;
}
