import { describe, expect, it } from "vitest";
import { FLAG_SETS, decodeFlags, encodeFlags, isFlagType, knownMask } from "../src/lib/flags";

describe("flag tables", () => {
  it("have unique bits and keys and both languages", () => {
    for (const set of FLAG_SETS) {
      expect(new Set(set.flags.map((f) => f.bit)).size).toBe(set.flags.length);
      expect(new Set(set.flags.map((f) => f.key)).size).toBe(set.flags.length);
      for (const f of set.flags) expect(f.name.de && f.name.en && f.desc.de && f.desc.en).toBeTruthy();
      // the example only uses documented bits
      expect(set.example & ~knownMask(set)).toBe(0n);
    }
  });

  it("matches documented values", () => {
    expect(encodeFlags("user", ["HYPESQUAD_ONLINE_HOUSE_3", "ACTIVE_DEVELOPER"])).toBe(4194560n);
    expect(encodeFlags("user", ["VERIFIED_BOT"])).toBe(65536n);
    expect(encodeFlags("message", ["SUPPRESS_NOTIFICATIONS"])).toBe(4096n);
    expect(encodeFlags("message", ["IS_COMPONENTS_V2"])).toBe(32768n);
    expect(encodeFlags("channel", ["CHANNEL_OBFUSCATED"])).toBe(131072n);
    expect(encodeFlags("channel", ["IS_SPOILER_CHANNEL"])).toBe(1n << 21n);
    expect(encodeFlags("application", ["APPLICATION_COMMAND_BADGE"])).toBe(8388608n);
    expect(encodeFlags("system-channel", ["SUPPRESS_JOIN_NOTIFICATIONS"])).toBe(1n);
    expect(encodeFlags("member", ["AUTOMOD_QUARANTINED_GUILD_TAG"])).toBe(1024n);
    expect(() => encodeFlags("user", ["NOPE"])).toThrow();
  });
});

describe("decodeFlags", () => {
  it("decodes known flags and keeps unknown bits", () => {
    const d = decodeFlags("user", 4194560n | (1n << 4n) | (1n << 60n));
    expect(d.known.map((f) => f.key)).toEqual(["HYPESQUAD_ONLINE_HOUSE_3", "ACTIVE_DEVELOPER"]);
    expect(d.unknown).toEqual([4, 60]);
  });

  it("handles 0 and large application flags_new strings", () => {
    expect(decodeFlags("message", 0n)).toEqual({ known: [], unknown: [] });
    const big = (1n << 40n) | (1n << 23n);
    expect(decodeFlags("application", big).unknown).toEqual([40]);
  });

  it("validates type ids", () => {
    expect(isFlagType("user")).toBe(true);
    expect(isFlagType("nope")).toBe(false);
    expect(isFlagType(null)).toBe(false);
  });
});
