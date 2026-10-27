import { describe, expect, it } from "vitest";
import { maskToken, parseWebhookUrl, validateWebhookName } from "../src/lib/webhook";
import { classifyStatus, flattenErrors, looksLikeToken } from "../src/lib/discord-api";

const TOKEN = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_-abcd";

describe("parseWebhookUrl", () => {
  it("accepts canonical, legacy and ptb/canary urls", () => {
    for (const host of ["discord.com/api", "discordapp.com/api", "ptb.discord.com/api", "canary.discord.com/api/v10"]) {
      const r = parseWebhookUrl(`https://${host}/webhooks/1234567890123456789/${TOKEN}`);
      expect(r?.id).toBe("1234567890123456789");
      expect(r?.url).toBe(`https://discord.com/api/v10/webhooks/1234567890123456789/${TOKEN}`);
    }
  });
  it("keeps thread_id and rejects junk", () => {
    expect(parseWebhookUrl(`https://discord.com/api/webhooks/1234567890123456789/${TOKEN}?thread_id=1234567890123456780`)?.threadId).toBe("1234567890123456780");
    expect(parseWebhookUrl("https://discord.com/api/webhooks/123/short")).toBeNull();
    expect(parseWebhookUrl("https://evil.example/api/webhooks/1234567890123456789/" + TOKEN)).toBeNull();
  });
  it("masks tokens", () => {
    expect(maskToken(TOKEN)).toBe("abcd…abcd");
  });
});

describe("validateWebhookName", () => {
  it("applies Discord's rules", () => {
    expect(validateWebhookName("Announcements")).toBeNull();
    expect(validateWebhookName("  ")).toBe("empty");
    expect(validateWebhookName("x".repeat(81))).toBe("too-long");
    expect(validateWebhookName("everyone")).toBe("reserved");
    expect(validateWebhookName("My Discord Bot")).toBe("forbidden-word");
    expect(validateWebhookName("clydeish")).toBe("forbidden-word");
  });
});

describe("discord-api helpers", () => {
  it("classifies statuses", () => {
    expect(classifyStatus(404, { code: 10006, message: "Unknown Invite" })).toMatchObject({ kind: "notfound", code: 10006 });
    expect(classifyStatus(429, { retry_after: 2.5 })).toMatchObject({ kind: "ratelimit", retryAfter: 2.5 });
    expect(classifyStatus(429, null, "7")).toMatchObject({ kind: "ratelimit", retryAfter: 7 });
    expect(classifyStatus(403, { code: 50004 })).toMatchObject({ kind: "forbidden", code: 50004 });
    expect(classifyStatus(502, null).kind).toBe("server");
    expect(classifyStatus(400, { code: 50035, errors: { name: { _errors: [{ message: "Too long" }] } } }).details).toEqual(["name: Too long"]);
  });
  it("flattens nested errors", () => {
    expect(flattenErrors({ embeds: { 0: { title: { _errors: [{ message: "x" }] } } } })).toEqual(["embeds.0.title: x"]);
  });
  it("spots token-shaped strings", () => {
    expect(looksLikeToken(["MTc1OTI4ODQ3Mjk5MTE3MDYz", "GaBcDe", "abcdefghijklmnopqrstuvwxyz123456"].join("."))).toBe(true);
    expect(looksLikeToken("https://discord.com/api/webhooks/1/" + TOKEN)).toBe(false);
    expect(looksLikeToken("175928847299117063")).toBe(false);
  });
});
