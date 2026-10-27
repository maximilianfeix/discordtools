import { describe, expect, it } from "vitest";
import { ansiToSpans, spansToAnsi } from "../src/lib/ansi";
import { formatTimestamp, parseTimestampTags, timestampTag } from "../src/lib/timestamp";

describe("ansi", () => {
  it("round-trips spans", () => {
    const spans = [
      { text: "Hello ", style: { fg: 31, bold: true } },
      { text: "world", style: { fg: 34 } },
    ];
    const out = spansToAnsi(spans);
    expect(out.startsWith("```ansi\n")).toBe(true);
    expect(ansiToSpans(out)).toEqual(spans);
  });
});

describe("timestamp", () => {
  it("builds tags", () => {
    expect(timestampTag(1700000000, "R")).toBe("<t:1700000000:R>");
    expect(timestampTag(1700000000, "f")).toBe("<t:1700000000:f>");
  });
  it("parses tags", () => {
    expect(parseTimestampTags("at <t:1700000000:R> and <t:1>")).toEqual([
      { tag: "<t:1700000000:R>", unix: 1700000000, style: "R" },
      { tag: "<t:1>", unix: 1, style: "f" },
    ]);
  });
  it("formats like the client", () => {
    expect(formatTimestamp(1700000000, "D", "en-US", "UTC")).toBe("November 14, 2023");
    expect(formatTimestamp(1700000000, "R", "en-US", "UTC", 1700000000_000 + 3 * 3600_000)).toBe("3 hours ago");
  });
});

describe("new timestamp styles", () => {
  it("formats s and S", () => {
    expect(formatTimestamp(1618935630, "s", "en-GB", "UTC")).toBe("20/04/2021, 16:20");
    expect(formatTimestamp(1618935630, "S", "en-GB", "UTC")).toBe("20/04/2021, 16:20:30");
    expect(formatTimestamp(1618935630, "f", "en-GB", "UTC")).toBe("20 April 2021 at 16:20");
  });
});
