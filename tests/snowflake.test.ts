import { describe, expect, it } from "vitest";
import { decodeSnowflake, parseDiscordReference, snowflakeFromDate } from "../src/lib/snowflake";

describe("snowflake", () => {
  it("decodes the example from the Discord docs", () => {
    const s = decodeSnowflake("175928847299117063");
    expect(s.timestamp).toBe(1462015105796);
    expect(s.workerId).toBe(1);
    expect(s.processId).toBe(0);
    expect(s.increment).toBe(7);
  });
  it("round-trips a date", () => {
    const id = snowflakeFromDate(new Date("2026-01-01T00:00:00Z"));
    expect(decodeSnowflake(id).date.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
  it("rejects garbage", () => {
    expect(() => decodeSnowflake("abc")).toThrow();
  });
  it("parses links and mentions", () => {
    expect(parseDiscordReference("https://discord.com/channels/123456789012345678/223456789012345678/323456789012345678"))
      .toEqual({ kind: "message", guildId: "123456789012345678", channelId: "223456789012345678", messageId: "323456789012345678" });
    expect(parseDiscordReference("<@!175928847299117063>")).toEqual({ kind: "user", id: "175928847299117063" });
    expect(parseDiscordReference("<a:party:175928847299117063>")).toEqual({ kind: "emoji", id: "175928847299117063", name: "party", animated: true });
  });
});
