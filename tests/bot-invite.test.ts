import { describe, expect, it } from "vitest";
import { DEFAULT_STATE, buildInviteUrl, looksLikeSecret, looksLikeToken, parseInviteUrl, type InviteState } from "../src/lib/bot-invite";

const ID = "1234567890123456789";
const st = (p: Partial<InviteState>): InviteState => ({ ...DEFAULT_STATE, clientId: ID, ...p });
const codes = (s: InviteState) => buildInviteUrl(s).issues.map((i) => i.code);

describe("buildInviteUrl", () => {
  it("builds a server install link with permissions as decimal string", () => {
    const r = buildInviteUrl(st({ permissions: "8866461766385663" }));
    expect(r.url).toBe(
      `https://discord.com/oauth2/authorize?client_id=${ID}&permissions=8866461766385663&integration_type=0&scope=bot%20applications.commands`,
    );
    expect(r.issues.map((i) => i.code)).toEqual(["admin"]);
    expect(r.codeGrant).toBe(false);
    expect(buildInviteUrl(st({ permissions: "3072" })).issues).toEqual([]);
  });

  it("omits permissions=0 and keeps big values exact", () => {
    expect(buildInviteUrl(st({ permissions: "0" })).url).not.toContain("permissions=");
    const big = ((1n << 52n) | 8n).toString();
    expect(buildInviteUrl(st({ permissions: big })).url).toContain(`permissions=${big}`);
  });

  it("warns on administrator", () => {
    expect(codes(st({ permissions: "8" }))).toContain("admin");
  });

  it("user install drops bot and permissions", () => {
    const r = buildInviteUrl(st({ integrationType: 1, permissions: "2048", guildId: ID }));
    expect(r.url).toBe(`https://discord.com/oauth2/authorize?client_id=${ID}&integration_type=1&scope=applications.commands`);
    expect(r.issues.map((i) => i.code)).toEqual(["user-no-bot", "user-no-permissions", "user-no-guild"]);
  });

  it("user install requires applications.commands", () => {
    expect(codes(st({ integrationType: 1, scopes: ["bot"] }))).toContain("user-needs-commands");
  });

  it("adds guild_id and disable_guild_select", () => {
    const r = buildInviteUrl(st({ guildId: "81384788765712384", disableGuildSelect: true }));
    expect(r.url).toContain("&guild_id=81384788765712384&disable_guild_select=true");
    expect(codes(st({ disableGuildSelect: true }))).toContain("lock-without-guild");
    expect(codes(st({ guildId: "abc" }))).toContain("guild-invalid");
  });

  it("switches to code grant for OAuth scopes and requires redirect_uri", () => {
    expect(codes(st({ scopes: ["bot", "identify"] }))).toContain("needs-redirect");
    const r = buildInviteUrl(st({ scopes: ["identify", "guilds"], redirectUri: "https://example.com/cb?x=1" }));
    expect(r.codeGrant).toBe(true);
    expect(r.url).toContain("scope=identify%20guilds&response_type=code&redirect_uri=https%3A%2F%2Fexample.com%2Fcb%3Fx%3D1");
    expect(codes(st({ scopes: ["identify"], redirectUri: "ftp://x" }))).toContain("redirect-invalid");
    expect(codes(st({ scopes: ["identify"], redirectUri: "http://example.com" }))).toContain("redirect-insecure");
    expect(codes(st({ scopes: ["identify"], redirectUri: "http://localhost:3000/cb" }))).not.toContain("redirect-insecure");
  });

  it("validates the client ID and refuses tokens and secrets", () => {
    expect(codes(st({ clientId: "" }))).toContain("client-missing");
    expect(codes(st({ clientId: "12345" }))).toContain("client-invalid");
    expect(codes(st({ clientId: ["MTIzNDU2Nzg5MDEyMzQ1Njc4OQ", "GhIjKl", "abcdefghijklmnopqrstuvwxyz0123456789AB"].join(".") }))).toContain("client-token");
    expect(codes(st({ clientId: "aB3dE5fG7hI9jK1lM3nO5pQ7rS9tU1vW" }))).toContain("client-secret");
  });

  it("warns when permissions are set without bot scope", () => {
    expect(codes(st({ scopes: ["applications.commands"], permissions: "8" }))).toContain("permissions-without-bot");
    expect(codes(st({ permissions: "nope" }))).toContain("permissions-invalid");
  });
});

describe("token detection", () => {
  it("detects token-shaped strings", () => {
    expect(looksLikeToken(["MTIzNDU2Nzg5MDEyMzQ1Njc4OQ", "GhIjKl", "abcdefghijklmnopqrstuvwxyz0123456789AB"].join("."))).toBe(true);
    expect(looksLikeToken("Bot " + ["MTIzNDU2Nzg5MDEyMzQ1Njc4OQ", "GhIjKl", "abcdefghijklmnopqrstuvwxyz0123456789AB"].join("."))).toBe(true);
    expect(looksLikeToken(ID)).toBe(false);
    expect(looksLikeSecret(ID + "1234567890123")).toBe(false);
  });
});

describe("parseInviteUrl", () => {
  it("round-trips a built URL", () => {
    const s = st({ permissions: "277025770560", guildId: "81384788765712384", disableGuildSelect: true });
    const r = parseInviteUrl(buildInviteUrl(s).url);
    expect(r.ok && r.state).toEqual(s);
  });

  it("parses legacy and + encoded URLs", () => {
    const r = parseInviteUrl(`https://discordapp.com/api/oauth2/authorize?client_id=${ID}&permissions=8&scope=bot+applications.commands`);
    expect(r.ok && r.state.scopes).toEqual(["bot", "applications.commands"]);
    expect(r.ok && r.state.permissions).toBe("8");
    const r2 = parseInviteUrl(`discord.com/oauth2/authorize?client_id=${ID}&scope=applications.commands&integration_type=1&foo=bar`);
    expect(r2.ok && r2.state.integrationType).toBe(1);
    expect(r2.ok && r2.unknown).toEqual(["foo"]);
  });

  it("rejects other URLs", () => {
    expect(parseInviteUrl("https://example.com/oauth2/authorize")).toEqual({ ok: false, reason: "not-oauth" });
    expect(parseInviteUrl("https://discord.gg/abc")).toEqual({ ok: false, reason: "not-oauth" });
    expect(parseInviteUrl("::::")).toEqual({ ok: false, reason: "not-url" });
  });
});
