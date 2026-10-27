import { describe, expect, it } from "vitest";
import {
  PALETTES, THEMES, adjustToContrast, contrast, decimalToHex, hexToDecimal, hexToRgb, hslToRgb, level, normalizeHex,
  parseColorInput, rgbToHex, rgbToHsl,
} from "../src/lib/role-colors";

describe("role-colors", () => {
  it("parses hex and decimal", () => {
    expect(normalizeHex("3ee0a8")).toBe("#3EE0A8");
    expect(normalizeHex("#abc")).toBe("#AABBCC");
    expect(normalizeHex("xyz")).toBeNull();
    expect(parseColorInput("16777215")).toBe("#FFFFFF");
    expect(parseColorInput("0")).toBe("#000000");
    expect(parseColorInput("99999999")).toBeNull();
    expect(parseColorInput("123456")).toBe("#123456"); // 6 hex digits win over decimal
  });

  it("converts between hex and decimal", () => {
    expect(hexToDecimal("#3498DB")).toBe(3447003);
    expect(decimalToHex(3447003)).toBe("#3498DB");
  });

  it("round-trips through HSL", () => {
    for (const hex of ["#3498DB", "#E74C3C", "#000000", "#FFFFFF", "#95A5A6"]) {
      expect(rgbToHex(hslToRgb(rgbToHsl(hexToRgb(hex))))).toBe(hex);
    }
  });

  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#777777")).toBe(1);
    expect(level(4.6)).toBe("AA");
    expect(level(3.2)).toBe("AA-large");
    expect(level(2)).toBe("fail");
  });

  it("lightens on dark themes and darkens on light themes", () => {
    const dark = THEMES.find((t) => t.id === "dark")!.bg;
    const light = THEMES.find((t) => t.id === "light")!.bg;
    const navy = "#1F2A6B";
    const fixed = adjustToContrast(navy, dark, 4.5)!;
    expect(contrast(fixed, dark)).toBeGreaterThanOrEqual(4.5);
    expect(rgbToHsl(hexToRgb(fixed)).l).toBeGreaterThan(rgbToHsl(hexToRgb(navy)).l);
    const yellow = "#F1C40F";
    const fixed2 = adjustToContrast(yellow, light, 4.5)!;
    expect(contrast(fixed2, light)).toBeGreaterThanOrEqual(4.5);
    expect(rgbToHsl(hexToRgb(fixed2)).l).toBeLessThan(rgbToHsl(hexToRgb(yellow)).l);
  });

  it("keeps a color that already passes", () => {
    expect(adjustToContrast("#FFFFFF", "#000000", 4.5)).toBe("#FFFFFF");
  });

  it("palettes contain valid hex", () => {
    for (const p of PALETTES) for (const col of p.colors) expect(normalizeHex(col.hex)).toBe(col.hex);
  });
});
