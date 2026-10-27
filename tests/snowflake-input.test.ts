import { describe, expect, it } from "vitest";
import { calendarDiff, compareSnowflakes, formatDiff, parseSnowflakeInput, snowflakeRange } from "../src/lib/snowflake-input";
import { decodeSnowflake } from "../src/lib/snowflake";

const NOW = Date.UTC(2026, 9, 27);

describe("parseSnowflakeInput", () => {
  it("parses several IDs, one per line, and dedupes", () => {
    const r = parseSnowflakeInput("175928847299117063\n613425648685547541\n175928847299117063", NOW);
    expect(r.groups.map((g) => g.ids[0]!.id)).toEqual(["175928847299117063", "613425648685547541"]);
    expect(r.problems).toEqual([]);
  });

  it("splits a message link into guild, channel and message", () => {
    const r = parseSnowflakeInput("https://discord.com/channels/613425648685547541/613430047285706767/1000000000000000123", NOW);
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0]!.link).toBe("message");
    expect(r.groups[0]!.ids.map((i) => i.kind)).toEqual(["guild", "channel", "message"]);
  });

  it("handles DM links without a guild", () => {
    const r = parseSnowflakeInput("https://discord.com/channels/@me/613430047285706767/613430047285706999", NOW);
    expect(r.groups[0]!.ids.map((i) => i.kind)).toEqual(["dm", "message"]);
  });

  it("recognises mentions and emoji", () => {
    const r = parseSnowflakeInput("<@!175928847299117063> <@&613425648685547541>, <#613430047285706767> <a:party:175928847299117064>", NOW);
    expect(r.groups.map((g) => g.ids[0]!.kind)).toEqual(["user", "role", "channel", "emoji"]);
    expect(r.groups[3]!.ids[0]!.name).toBe("party");
  });

  it("flags rounded spreadsheet numbers", () => {
    const r = parseSnowflakeInput("1.75929E+17\n1,75929E+17", NOW);
    expect(r.problems.map((p) => p.problem)).toEqual(["scientific", "scientific"]);
    expect(r.problems[0]!.approx).toBe("175929000000000000");
  });

  it("warns about trailing zeros and thousands separators", () => {
    const r = parseSnowflakeInput("175928847299117000", NOW);
    expect(r.groups[0]!.ids[0]!.warnings).toContain("trailing-zeros");
    const g = parseSnowflakeInput("175,928,847,299,117,063", NOW);
    expect(g.groups[0]!.ids[0]!.id).toBe("175928847299117063");
    expect(g.groups[0]!.ids[0]!.warnings).toContain("trailing-zeros");
  });

  it("warns about future IDs and rejects junk, invites and tokens", () => {
    const future = parseSnowflakeInput("9223372036854775807", NOW);
    expect(future.groups[0]!.ids[0]!.warnings).toContain("future");
    const bad = parseSnowflakeInput("hello 12345 https://discord.gg/abc 99999999999999999999999", NOW);
    expect(bad.problems.map((p) => p.problem)).toEqual(["invalid", "too-short", "invite", "too-large"]);
    const tok = parseSnowflakeInput(["MTc1OTI4ODQ3Mjk5MTE3MDYz", "GaBcDe", "abcdefghijklmnopqrstuvwxyz123456"].join("."), NOW);
    expect(tok.problems[0]!.problem).toBe("token");
  });
});

describe("snowflakeRange / compare", () => {
  it("gives min and max for a millisecond", () => {
    const ms = Date.UTC(2026, 0, 1);
    const { min, max } = snowflakeRange(ms);
    expect(decodeSnowflake(min).timestamp).toBe(ms);
    expect(decodeSnowflake(max).timestamp).toBe(ms);
    expect(BigInt(max) - BigInt(min)).toBe(0x3fffffn);
    expect(() => snowflakeRange(0)).toThrow();
  });
  it("compares two IDs", () => {
    const c = compareSnowflakes("175928847299117063", "613425648685547541");
    expect(c.older).toBe("a");
    expect(c.diffMs).toBe(decodeSnowflake("613425648685547541").timestamp - decodeSnowflake("175928847299117063").timestamp);
    expect(compareSnowflakes("1", "1").older).toBe("same");
  });
});

describe("calendarDiff / formatDiff", () => {
  it("counts calendar units", () => {
    const d = calendarDiff(Date.UTC(2020, 0, 31), Date.UTC(2021, 2, 1, 5));
    expect(d).toMatchObject({ years: 1, months: 1, days: 1, hours: 5 });
    expect(formatDiff(d, "de")).toBe("1 Jahr, 1 Monat, 1 Tag");
    expect(formatDiff(d, "en", 2)).toBe("1 year, 1 month");
  });
  it("is order-independent and handles zero", () => {
    expect(calendarDiff(10_000, 0)).toEqual(calendarDiff(0, 10_000));
    expect(formatDiff(calendarDiff(0, 0), "en")).toBe("0 seconds");
  });
});
