import { describe, expect, it } from "vitest";
import { contrastRatio, formatHsl, formatRgb, grade, hslToRgb, intToHex, parseColor, rgbToHsl, readableOn } from "../src/lib/color";

describe("parseColor", () => {
  it("accepts every common notation", () => {
    expect(parseColor("0x5865F2")).toEqual({ int: 0x5865f2, source: "0x" });
    expect(parseColor("#abc")?.int).toBe(0xaabbcc);
    expect(parseColor("#5865f2")?.int).toBe(0x5865f2);
    expect(parseColor("5865F2")?.int).toBe(0x5865f2);
    expect(parseColor("16711680")).toMatchObject({ int: 0xff0000, source: "decimal" });
    expect(parseColor("rgb(88, 101, 242)")?.int).toBe(0x5865f2);
    expect(parseColor("rgb(88 101 242 / 50%)")?.int).toBe(0x5865f2);
    expect(parseColor("88, 101, 242")?.int).toBe(0x5865f2);
    expect(parseColor("hsl(0, 100%, 50%)")?.int).toBe(0xff0000);
    expect(parseColor("  #FFF; ")?.int).toBe(0xffffff);
  });
  it("marks pure 6-digit numbers as ambiguous and rejects junk", () => {
    expect(parseColor("123456")).toMatchObject({ int: 123456, ambiguous: true });
    expect(parseColor("16777216")).toBeNull();
    expect(parseColor("rgb(300,0,0)")).toBeNull();
    expect(parseColor("blue")).toBeNull();
    expect(parseColor("")).toBeNull();
  });
});

describe("conversions", () => {
  it("round-trips hsl", () => {
    for (const n of [0x5865f2, 0x000000, 0xffffff, 0x3ee0a8, 0xed4245]) {
      const back = hslToRgb(rgbToHsl({ r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }));
      const m = (back.r << 16) | (back.g << 8) | back.b;
      expect(Math.abs(((m >> 16) & 255) - ((n >> 16) & 255))).toBeLessThanOrEqual(3);
    }
  });
  it("formats", () => {
    expect(intToHex(0x5865f2)).toBe("#5865F2");
    expect(intToHex(255, false)).toBe("#0000ff");
    expect(formatRgb(0x5865f2)).toBe("rgb(88, 101, 242)");
    expect(formatHsl(0xff0000)).toBe("hsl(0, 100%, 50%)");
  });
  it("computes WCAG contrast", () => {
    expect(contrastRatio(0x000000, 0xffffff)).toBeCloseTo(21, 1);
    expect(contrastRatio(0x5865f2, 0x5865f2)).toBeCloseTo(1);
    expect(grade(4.6)).toBe("good");
    expect(grade(3.2)).toBe("ok");
    expect(grade(1.5)).toBe("poor");
    expect(readableOn(0xfee75c)).toBe("#000000");
    expect(readableOn(0x206694)).toBe("#FFFFFF");
  });
});
