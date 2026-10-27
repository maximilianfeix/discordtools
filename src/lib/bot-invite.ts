/**
 * Builds and parses Discord OAuth2 authorize URLs for bot / app installs.
 * Source: docs.discord.com/developers/topics/oauth2 (bot authorization flow, scopes, integration types).
 */
import { isSnowflake } from "./snowflake";
import { parseBitfield } from "./bitfield";

export type InstallType = 0 | 1;

export interface InviteState {
  clientId: string;
  /** 0 = GUILD_INSTALL (server), 1 = USER_INSTALL */
  integrationType: InstallType;
  scopes: string[];
  /** decimal string */
  permissions: string;
  guildId: string;
  disableGuildSelect: boolean;
  redirectUri: string;
  /** code-grant only */
  prompt: "" | "consent" | "none";
}

export interface ScopeInfo {
  id: string;
  /** Works in the simple "add app" flow without redirect_uri */
  simple: boolean;
  de: string;
  en: string;
  /** Only for approved partners or not available to most apps */
  restricted?: boolean;
}

export const SCOPES: ScopeInfo[] = [
  { id: "bot", simple: true, de: "Fügt den Bot-Nutzer dem Server hinzu.", en: "Adds the bot user to the server." },
  {
    id: "applications.commands",
    simple: true,
    de: "Erlaubt Slash- und Kontextmenü-Befehle. Bei „bot“ automatisch dabei, für User-Installation Pflicht.",
    en: "Allows slash and context menu commands. Included with “bot”, required for user installs.",
  },
  { id: "identify", simple: false, de: "Liest Name, Avatar und ID über /users/@me (ohne E-Mail).", en: "Reads name, avatar and ID via /users/@me (no email)." },
  { id: "email", simple: false, de: "Liefert zusätzlich die E-Mail-Adresse.", en: "Also returns the email address." },
  { id: "guilds", simple: false, de: "Listet die Server des Nutzers (Basisdaten).", en: "Lists the user's servers (basic data)." },
  { id: "guilds.join", simple: false, de: "Darf den Nutzer einem Server hinzufügen, in dem dein Bot ist.", en: "Lets your bot add the user to a server it is in." },
  { id: "guilds.members.read", simple: false, de: "Liest die Mitgliedsdaten des Nutzers in einem Server.", en: "Reads the user's member data in a server." },
  { id: "connections", simple: false, de: "Liest verknüpfte Konten (z. B. Twitch, Steam).", en: "Reads linked accounts (e.g. Twitch, Steam)." },
  { id: "role_connections.write", simple: false, de: "Schreibt Metadaten für verknüpfte Rollen (Linked Roles).", en: "Writes metadata for linked roles." },
  { id: "webhook.incoming", simple: false, de: "Erstellt beim Autorisieren einen Webhook in einem Kanal.", en: "Creates a webhook in a channel during authorization." },
  { id: "gdm.join", simple: false, de: "Darf den Nutzer in Gruppen-DMs aufnehmen.", en: "Lets your app add the user to group DMs." },
  {
    id: "applications.commands.permissions.update",
    simple: false,
    de: "Darf Befehls-Rechte in Servern ändern, die der Nutzer verwaltet.",
    en: "Lets your app update command permissions in servers the user manages.",
  },
  { id: "applications.entitlements", simple: false, de: "Liest Berechtigungen (Käufe) des Nutzers für deine App.", en: "Reads the user's entitlements for your app." },
];

export const SIMPLE_SCOPES = new Set(SCOPES.filter((s) => s.simple).map((s) => s.id));

export const DEFAULT_STATE: InviteState = {
  clientId: "",
  integrationType: 0,
  scopes: ["bot", "applications.commands"],
  permissions: "0",
  guildId: "",
  disableGuildSelect: false,
  redirectUri: "",
  prompt: "",
};

/** A Discord bot / user token: three base64url parts separated by dots. Never accept it. */
export function looksLikeToken(input: string): boolean {
  const s = input.trim().replace(/^(Bot|Bearer)\s+/i, "");
  return /^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{20,}$/.test(s);
}

/** Client secrets are 32 url-safe characters with letters – not a numeric ID. */
export function looksLikeSecret(input: string): boolean {
  const s = input.trim();
  return /^[A-Za-z0-9_-]{32}$/.test(s) && /[A-Za-z_-]/.test(s);
}

export type IssueCode =
  | "client-missing"
  | "client-invalid"
  | "client-token"
  | "client-secret"
  | "scope-empty"
  | "user-needs-commands"
  | "user-no-bot"
  | "user-no-permissions"
  | "user-no-guild"
  | "permissions-without-bot"
  | "permissions-invalid"
  | "admin"
  | "needs-redirect"
  | "redirect-invalid"
  | "redirect-insecure"
  | "guild-invalid"
  | "lock-without-guild"
  | "redirect-unused"
  | "restricted-scope";

export interface Issue {
  code: IssueCode;
  level: "error" | "warn" | "info";
}

export interface BuildResult {
  url: string;
  issues: Issue[];
  /** parameters actually put in the URL, in order */
  params: [string, string][];
  codeGrant: boolean;
}

export function isCodeGrant(scopes: string[]): boolean {
  return scopes.some((s) => !SIMPLE_SCOPES.has(s));
}

export function buildInviteUrl(state: InviteState): BuildResult {
  const issues: Issue[] = [];
  const add = (code: IssueCode, level: Issue["level"] = "error") => issues.push({ code, level });
  const clientId = state.clientId.trim();
  const user = state.integrationType === 1;

  if (!clientId) add("client-missing");
  else if (looksLikeToken(clientId)) add("client-token");
  else if (looksLikeSecret(clientId)) add("client-secret");
  else if (!isSnowflake(clientId)) add("client-invalid");

  // Scopes: user installs only support applications.commands (plus OAuth scopes in code grant).
  let scopes = [...new Set(state.scopes)];
  if (user) {
    if (scopes.includes("bot")) add("user-no-bot", "warn");
    scopes = scopes.filter((s) => s !== "bot");
    if (!scopes.includes("applications.commands")) add("user-needs-commands");
  }
  if (!scopes.length) add("scope-empty");
  const codeGrant = isCodeGrant(scopes);
  if (scopes.some((s) => SCOPES.find((x) => x.id === s)?.restricted)) add("restricted-scope", "warn");

  // Permissions only matter with the bot scope on a server install.
  let permissions: string | null = null;
  const pr = parseBitfield(state.permissions || "0");
  if (!pr.ok) add("permissions-invalid");
  else if (pr.value > 0n) {
    if (user) add("user-no-permissions", "warn");
    else if (!scopes.includes("bot")) add("permissions-without-bot", "warn");
    else {
      permissions = pr.value.toString();
      if ((pr.value & 8n) !== 0n) add("admin", "warn");
    }
  }

  // Guild preselect
  const guildId = state.guildId.trim();
  let guild: string | null = null;
  if (guildId) {
    if (user) add("user-no-guild", "warn");
    else if (!isSnowflake(guildId)) add("guild-invalid");
    else guild = guildId;
  }
  if (state.disableGuildSelect && !guild && !user) add("lock-without-guild", "warn");

  // Redirect
  const redirect = state.redirectUri.trim();
  if (codeGrant) {
    if (!redirect) add("needs-redirect");
    else {
      let u: URL | null = null;
      try {
        u = new URL(redirect);
      } catch {
        u = null;
      }
      if (!u || !/^https?:$/.test(u.protocol)) add("redirect-invalid");
      else if (u.protocol === "http:" && !["localhost", "127.0.0.1", "[::1]"].includes(u.hostname)) add("redirect-insecure", "warn");
    }
  } else if (redirect) add("redirect-unused", "info");

  const params: [string, string][] = [];
  params.push(["client_id", clientId]);
  if (permissions) params.push(["permissions", permissions]);
  params.push(["integration_type", String(state.integrationType)]);
  params.push(["scope", scopes.join(" ")]);
  if (guild) {
    params.push(["guild_id", guild]);
    if (state.disableGuildSelect) params.push(["disable_guild_select", "true"]);
  }
  if (codeGrant) {
    params.push(["response_type", "code"]);
    if (redirect) params.push(["redirect_uri", redirect]);
    if (state.prompt) params.push(["prompt", state.prompt]);
  }

  const qs = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  return { url: `https://discord.com/oauth2/authorize?${qs}`, issues, params, codeGrant };
}

export type ParseInviteResult = { ok: true; state: InviteState; unknown: string[] } | { ok: false; reason: "not-url" | "not-oauth" };

/** Reads an existing authorize URL back into builder state (discord.com, discordapp.com, ptb/canary, /api/ prefix). */
export function parseInviteUrl(input: string): ParseInviteResult {
  let u: URL;
  const raw = input.trim();
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return { ok: false, reason: "not-url" };
  }
  const host = u.hostname.toLowerCase();
  if (!/^((ptb|canary)\.)?discord(app)?\.com$/.test(host) || !/^\/(api\/(v\d+\/)?)?oauth2\/authorize\/?$/.test(u.pathname)) {
    return { ok: false, reason: "not-oauth" };
  }
  const q = u.searchParams;
  const known = new Set(["client_id", "scope", "permissions", "guild_id", "disable_guild_select", "integration_type", "redirect_uri", "response_type", "prompt", "state"]);
  const unknown = [...q.keys()].filter((k) => !known.has(k));
  const scopes = (q.get("scope") ?? "").split(/[\s+]+/).filter(Boolean);
  const it = q.get("integration_type");
  const prompt = q.get("prompt");
  const pr = parseBitfield(q.get("permissions") ?? "0");
  return {
    ok: true,
    unknown,
    state: {
      clientId: q.get("client_id") ?? "",
      integrationType: it === "1" ? 1 : 0,
      scopes: scopes.length ? scopes : [],
      permissions: pr.ok ? pr.value.toString() : "0",
      guildId: q.get("guild_id") ?? "",
      disableGuildSelect: q.get("disable_guild_select") === "true",
      redirectUri: q.get("redirect_uri") ?? "",
      prompt: prompt === "consent" || prompt === "none" ? prompt : "",
    },
  };
}

/**
 * Secret-free state for `location.hash`. Only validated values are written: a token or webhook URL pasted into
 * the client or guild field must never end up in the URL / browser history.
 */
export function inviteHashParams(st: InviteState): Record<string, string | null> {
  const pr = parseBitfield(st.permissions);
  return {
    client_id: isSnowflake(st.clientId) ? st.clientId : null,
    permissions: pr.ok && pr.value > 0n ? pr.value.toString() : null,
    integration_type: st.integrationType === 1 ? "1" : null,
    scope: st.scopes.filter((x) => /^[a-z0-9_.]+$/.test(x)).join(" "),
    guild_id: isSnowflake(st.guildId) ? st.guildId : null,
    disable_guild_select: st.disableGuildSelect ? "true" : null,
  };
}
