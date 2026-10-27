import { describe, expect, it } from "vitest";
import {
  decodeTimestampInput,
  formatOffset,
  inputsToWall,
  parseNaturalDate,
  tzOffsetMinutes,
  wallClock,
  wallToInputs,
  zonedToUtc,
} from "../src/lib/timestamp-parse";

const TZ = "Europe/Berlin";
// Tuesday 2026-10-27 15:12:30 in Berlin (CET, UTC+1 after the 25 Oct switch)
const NOW = Date.UTC(2026, 9, 27, 14, 12, 30);

function wallOf(ms: number, tz = TZ) {
  const w = wallClock(ms, tz);
  return `${w.y}-${String(w.mo).padStart(2, "0")}-${String(w.d).padStart(2, "0")} ${String(w.h).padStart(2, "0")}:${String(w.mi).padStart(2, "0")}`;
}
function p(text: string, now = NOW, tz = TZ) {
  const r = parseNaturalDate(text, { now, tz, defaultTime: { h: 20, mi: 0 } });
  return r ? wallOf(r.ms, tz) : null;
}

describe("time zone math", () => {
  it("reads wall clocks and offsets", () => {
    expect(wallClock(NOW, TZ)).toMatchObject({ y: 2026, mo: 10, d: 27, h: 15, mi: 12, wd: 2 });
    expect(tzOffsetMinutes(NOW, TZ)).toBe(60);
    expect(tzOffsetMinutes(Date.UTC(2026, 6, 1), TZ)).toBe(120);
    expect(tzOffsetMinutes(NOW, "Asia/Kolkata")).toBe(330);
    expect(formatOffset(330)).toBe("UTC+05:30");
    expect(formatOffset(-300)).toBe("UTC−05:00");
  });
  it("converts wall time to UTC", () => {
    expect(zonedToUtc({ y: 2026, mo: 10, d: 31, h: 20, mi: 0, s: 0 }, TZ)).toEqual({ kind: "ok", ms: Date.UTC(2026, 9, 31, 19) });
  });
  it("detects the spring-forward gap", () => {
    const r = zonedToUtc({ y: 2026, mo: 3, d: 29, h: 2, mi: 30, s: 0 }, TZ);
    expect(r.kind).toBe("gap");
    expect(wallOf(r.ms)).toBe("2026-03-29 03:30");
  });
  it("detects the fall-back overlap", () => {
    const r = zonedToUtc({ y: 2026, mo: 10, d: 25, h: 2, mi: 30, s: 0 }, TZ);
    expect(r.kind).toBe("ambiguous");
    if (r.kind !== "ambiguous") return;
    expect(r.ms).toBe(Date.UTC(2026, 9, 25, 0, 30));
    expect(r.alt).toBe(Date.UTC(2026, 9, 25, 1, 30));
  });
  it("round-trips input strings", () => {
    expect(wallToInputs({ y: 2026, mo: 1, d: 5, h: 7, mi: 3, s: 0 })).toEqual({ date: "2026-01-05", time: "07:03" });
    expect(inputsToWall("2026-02-30", "10:00")).toBeNull();
    expect(inputsToWall("2026-02-28", "10:00:05")).toEqual({ y: 2026, mo: 2, d: 28, h: 10, mi: 0, s: 5 });
  });
});

describe("decodeTimestampInput", () => {
  it("decodes tags, seconds, ms, snowflakes and ISO", () => {
    expect(decodeTimestampInput("Start: <t:1700000000:R>")).toEqual({ source: "tag", unix: 1700000000, style: "R", explicitStyle: true });
    expect(decodeTimestampInput("<t:1700000000>")).toMatchObject({ style: "f", explicitStyle: false });
    expect(decodeTimestampInput("1700000000")).toEqual({ source: "seconds", unix: 1700000000 });
    expect(decodeTimestampInput("1700000000123")).toEqual({ source: "milliseconds", unix: 1700000000 });
    expect(decodeTimestampInput("175928847299117063")).toEqual({ source: "snowflake", unix: 1462015105 });
    expect(decodeTimestampInput("2026-10-31T20:00:00Z")).toEqual({ source: "iso", unix: Date.UTC(2026, 9, 31, 20) / 1000 });
    expect(decodeTimestampInput("morgen")).toBeNull();
  });
});

describe("parseNaturalDate – German", () => {
  it("understands day words and times", () => {
    expect(p("morgen 18 uhr")).toBe("2026-10-28 18:00");
    expect(p("Morgen um 18:30")).toBe("2026-10-28 18:30");
    expect(p("übermorgen")).toBe("2026-10-29 20:00");
    expect(p("heute abend")).toBe("2026-10-27 20:00");
    expect(p("morgen früh")).toBe("2026-10-28 08:00");
    expect(p("heute 9 uhr")).toBe("2026-10-27 09:00");
  });
  it("understands relative offsets", () => {
    expect(p("in 2 stunden")).toBe("2026-10-27 17:12");
    expect(p("in einer halben Stunde")).toBe("2026-10-27 15:42");
    expect(p("in 1h 30m")).toBe("2026-10-27 16:42");
    expect(p("in 3 tagen")).toBe("2026-10-30 15:12");
    expect(p("in zwei wochen um 19 uhr")).toBe("2026-11-10 19:00");
    expect(p("vor 2 stunden")).toBe("2026-10-27 13:12");
  });
  it("understands weekdays", () => {
    expect(p("nächster Samstag")).toBe("2026-10-31 20:00");
    expect(p("am freitag um 20 uhr")).toBe("2026-10-30 20:00");
    expect(p("Sa 21:00")).toBe("2026-10-31 21:00");
    expect(p("dienstag 10 uhr")).toBe("2026-11-03 10:00"); // already passed today
    expect(p("dienstag 18 uhr")).toBe("2026-10-27 18:00"); // still today
    expect(p("nächsten dienstag 18 uhr")).toBe("2026-11-03 18:00");
  });
  it("understands dates", () => {
    expect(p("31.10. 20:00")).toBe("2026-10-31 20:00");
    expect(p("24.12.2026 18 Uhr")).toBe("2026-12-24 18:00");
    expect(p("1.1. 0:00")).toBe("2027-01-01 00:00");
    expect(p("15. märz 2027 halb 8")).toBe("2027-03-15 07:30");
    expect(p("20.30 Uhr")).toBe("2026-10-27 20:30");
    expect(p("8 abends")).toBe("2026-10-27 20:00");
    expect(p("10 Uhr")).toBe("2026-10-28 10:00"); // next 10:00
  });
});

describe("parseNaturalDate – English", () => {
  it("understands common phrases", () => {
    expect(p("next friday 8pm")).toBe("2026-10-30 20:00");
    expect(p("tomorrow at 6:30 pm")).toBe("2026-10-28 18:30");
    expect(p("in 2 hours")).toBe("2026-10-27 17:12");
    expect(p("in an hour")).toBe("2026-10-27 16:12");
    expect(p("3 days from now")).toBe("2026-10-30 15:12");
    expect(p("tonight")).toBe("2026-10-27 20:00");
    expect(p("oct 31 9pm")).toBe("2026-10-31 21:00");
    expect(p("December 24th 2026 6pm")).toBe("2026-12-24 18:00");
    expect(p("2026-11-02 12:00")).toBe("2026-11-02 12:00");
    expect(p("12am")).toBe("2026-10-28 00:00");
    expect(p("noon")).toBe("2026-10-28 12:00");
    expect(p("midnight")).toBe("2026-10-28 00:00");
    expect(p("now")).toBe("2026-10-27 15:12");
  });
  it("works in other zones", () => {
    expect(p("tomorrow 8pm", NOW, "America/New_York")).toBe("2026-10-28 20:00");
  });
  it("rejects nonsense", () => {
    expect(p("banana")).toBeNull();
    expect(p("morgen pizza")).toBeNull();
    expect(p("31.02.")).toBeNull();
    expect(p("25:00")).toBeNull();
    expect(p("")).toBeNull();
  });
  it("flags ambiguous DST times", () => {
    const r = parseNaturalDate("25.10.2026 2:30", { now: NOW, tz: TZ });
    expect(r?.kind).toBe("ambiguous");
  });
});

describe("out-of-range instants", () => {
  it("rejects <t:…> tags and numbers beyond the JS date range", () => {
    expect(decodeTimestampInput("<t:9999999999999>")).toBeNull();
    expect(decodeTimestampInput("<t:8640000000000>")).not.toBeNull();
    expect(decodeTimestampInput("<t:-8640000000001>")).toBeNull();
  });
  it("returns null instead of throwing or returning invalid dates", () => {
    expect(() => parseNaturalDate("in 999999999 days", { now: NOW, tz: TZ })).not.toThrow();
    expect(parseNaturalDate("in 999999999 days", { now: NOW, tz: TZ })).toBeNull();
    expect(parseNaturalDate("in 99999999999 hours", { now: NOW, tz: TZ })).toBeNull();
    expect(parseNaturalDate("vor 999999999 jahren", { now: NOW, tz: TZ })).toBeNull();
    expect(p("in 2 tagen")).toBe("2026-10-29 15:12");
  });
  it("rejects date inputs beyond the range", () => {
    expect(inputsToWall("275760-12-31", "00:00")).toBeNull();
    expect(inputsToWall("275760-09-12", "00:00")).toBeNull(); // last representable day: no room for zone math
    expect(inputsToWall("2026-10-27", "20:00")).not.toBeNull();
  });
});

describe("weekday words", () => {
  it("reads Sonnabend as Saturday", () => {
    // NOW is Tuesday 2026-10-27
    expect(p("sonnabend 18 uhr")).toBe("2026-10-31 18:00");
    expect(p("sonntag 18 uhr")).toBe("2026-11-01 18:00");
  });
});
