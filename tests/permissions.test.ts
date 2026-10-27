import { describe, expect, it } from "vitest";
import { bitsOf, diffBits, fromBits, parseBitfield, toggleBit, toHex, unknownBits } from "../src/lib/bitfield";
import {
  ALL_PERMISSIONS,
  CATEGORIES,
  PERMISSIONS,
  PRESETS,
  comparePermissions,
  decodePermissions,
  presetValue,
  toDiscordJsFlags,
  valueOf,
} from "../src/lib/permissions";

describe("bitfield parsing", () => {
  it("parses decimal, hex, binary and quoted strings", () => {
    expect(parseBitfield("8")).toEqual({ ok: true, value: 8n });
    expect(parseBitfield("0x1F")).toEqual({ ok: true, value: 31n });
    expect(parseBitfield("0b1000")).toEqual({ ok: true, value: 8n });
    expect(parseBitfield(' "2147483648" ')).toEqual({ ok: true, value: 2147483648n });
    expect(parseBitfield("2 147 483 648")).toEqual({ ok: true, value: 2147483648n });
    expect(parseBitfield("8n")).toEqual({ ok: true, value: 8n });
  });

  it("keeps values above 2^53 exact", () => {
    const big = "9007199254740993"; // 2^53 + 1, not representable as a JS number
    const r = parseBitfield(big);
    expect(r.ok && r.value.toString()).toBe(big);
    const all = parseBitfield("8866461766385663");
    expect(all.ok && all.value).toBe(ALL_PERMISSIONS);
  });

  it("rejects garbage, negatives, exponent notation and > 64 bit", () => {
    expect(parseBitfield("")).toEqual({ ok: false, error: "empty" });
    expect(parseBitfield("abc")).toEqual({ ok: false, error: "invalid" });
    expect(parseBitfield("-8")).toEqual({ ok: false, error: "negative" });
    expect(parseBitfield("8.86646e+15")).toEqual({ ok: false, error: "unsafe-number" });
    expect(parseBitfield("1.5")).toEqual({ ok: false, error: "invalid" });
    expect(parseBitfield((1n << 64n).toString())).toEqual({ ok: false, error: "too-large" });
    expect(parseBitfield(((1n << 64n) - 1n).toString()).ok).toBe(true);
  });

  it("works with bits above 31 (where JS bitwise ops break)", () => {
    expect(bitsOf(1n << 52n)).toEqual([52]);
    expect(fromBits([0, 31, 32, 52])).toBe((1n << 52n) | (1n << 32n) | (1n << 31n) | 1n);
    expect(toggleBit(0n, 40)).toBe(1n << 40n);
    expect(toggleBit(1n << 40n, 40)).toBe(0n);
    expect(toggleBit(1n << 40n, 40, true)).toBe(1n << 40n);
    expect(toHex(ALL_PERMISSIONS)).toBe("0x1F7FFFFFFFFFFF");
  });

  it("diffs two values", () => {
    expect(diffBits(0b0110n, 0b1100n)).toEqual({ added: [3], removed: [1], kept: [2] });
  });
});

describe("permissions data", () => {
  it("covers bits 0–52 except 47, with no duplicates", () => {
    const bits = PERMISSIONS.map((p) => p.bit).sort((a, b) => a - b);
    const expected = Array.from({ length: 53 }, (_, i) => i).filter((i) => i !== 47);
    expect(bits).toEqual(expected);
    expect(new Set(PERMISSIONS.map((p) => p.key)).size).toBe(PERMISSIONS.length);
  });

  it("matches the documented ALL value", () => {
    expect(ALL_PERMISSIONS).toBe(0x1f7fffffffffffn);
    expect(ALL_PERMISSIONS.toString()).toBe("8866461766385663");
  });

  it("has names and descriptions in both languages and a valid category", () => {
    const cats = new Set(CATEGORIES.map((c) => c.id));
    for (const p of PERMISSIONS) {
      expect(p.name.de && p.name.en && p.desc.de && p.desc.en).toBeTruthy();
      expect(cats.has(p.category)).toBe(true);
    }
  });

  it("marks 2FA and dangerous permissions", () => {
    const by = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p]));
    expect(by.ADMINISTRATOR!.twoFA && by.ADMINISTRATOR!.dangerous).toBe(true);
    expect(by.MANAGE_THREADS!.twoFA).toBe(true);
    expect(by.MODERATE_MEMBERS!.twoFA).toBe(false);
    expect(by.VIEW_CHANNEL!.dangerous).toBe(false);
    expect(by.ADMINISTRATOR!.scope).toEqual([]);
    expect(by.PIN_MESSAGES!.scope).toEqual(["T"]);
  });

  it("maps discord.js names", () => {
    const by = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.djs]));
    expect(by.SEND_TTS_MESSAGES).toBe("SendTTSMessages");
    expect(by.USE_VAD).toBe("UseVAD");
    expect(by.VIEW_CREATOR_MONETIZATION_ANALYTICS).toBe("ViewCreatorMonetizationAnalytics");
    expect(by.BYPASS_SLOWMODE).toBe("BypassSlowmode");
  });
});

describe("encode / decode", () => {
  it("encodes known values", () => {
    expect(valueOf(["ADMINISTRATOR"])).toBe(8n);
    expect(valueOf(["VIEW_CHANNEL", "SEND_MESSAGES"])).toBe(3072n);
    expect(valueOf(["BYPASS_SLOWMODE"]).toString()).toBe("4503599627370496");
    expect(() => valueOf(["NOPE"])).toThrow();
  });

  it("decodes and preserves unknown bits", () => {
    const v = (1n << 47n) | (1n << 60n) | 8n;
    const d = decodePermissions(v);
    expect(d.known.map((p) => p.key)).toEqual(["ADMINISTRATOR"]);
    expect(d.unknown).toEqual([47, 60]);
    expect(unknownBits(v, ALL_PERMISSIONS)).toEqual([47, 60]);
  });

  it("round-trips every single permission", () => {
    for (const p of PERMISSIONS) {
      const v = 1n << BigInt(p.bit);
      expect(decodePermissions(v).known[0]!.key).toBe(p.key);
    }
    expect(decodePermissions(ALL_PERMISSIONS).known.length).toBe(PERMISSIONS.length);
    expect(decodePermissions(0n)).toEqual({ known: [], unknown: [] });
  });

  it("compares two values", () => {
    const d = comparePermissions(valueOf(["VIEW_CHANNEL", "MANAGE_MESSAGES"]), valueOf(["VIEW_CHANNEL", "PIN_MESSAGES"]));
    expect(d.added).toEqual([51]);
    expect(d.removed).toEqual([13]);
    expect(d.kept).toEqual([10]);
  });

  it("builds presets without administrator except the admin preset", () => {
    for (const p of PRESETS) {
      const v = presetValue(p.id);
      expect(v > 0n).toBe(true);
      expect(((v & 8n) !== 0n) === (p.id === "admin")).toBe(true);
    }
  });

  it("prints discord.js flags", () => {
    expect(toDiscordJsFlags(3072n)).toBe("PermissionFlagsBits.ViewChannel | PermissionFlagsBits.SendMessages");
    expect(toDiscordJsFlags(0n)).toBe("0n");
    expect(toDiscordJsFlags(1n << 47n)).toBe("(1n << 47n)");
  });
});
