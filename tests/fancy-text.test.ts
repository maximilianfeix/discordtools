import { describe, expect, it } from "vitest";
import { STYLES, applyStyle, codePointLength, coverage, isValidUsername, styleById, toUsername } from "../src/lib/fancy-text";

const s = (id: string) => styleById(id)!;

describe("fancy-text", () => {
  it("has about 25 styles with unique ids", () => {
    expect(STYLES.length).toBeGreaterThanOrEqual(25);
    expect(new Set(STYLES.map((x) => x.id)).size).toBe(STYLES.length);
  });

  it("maps math alphabets including the historic holes", () => {
    expect(applyStyle("Abc 1", s("bold"))).toBe("𝐀𝐛𝐜 𝟏");
    expect(applyStyle("h", s("italic"))).toBe("ℎ");
    expect(applyStyle("BEH", s("script"))).toBe("ℬℰℋ");
    expect(applyStyle("CHIRZ", s("fraktur"))).toBe("ℭℌℑℜℨ");
    expect(applyStyle("NQR1", s("double"))).toBe("ℕℚℝ𝟙");
    expect(applyStyle("az09", s("mono"))).toBe("𝚊𝚣𝟶𝟿");
  });

  it("keeps umlauts as combining marks and leaves ß alone", () => {
    const out = applyStyle("Grüße", s("bold"));
    expect(out).toBe("𝐆𝐫𝐮̈ß𝐞");
    expect(out.normalize("NFKC")).toBe("Grüße");
  });

  it("keeps characters without mapping", () => {
    expect(applyStyle("hi 🎮!", s("circled"))).toBe("ⓗⓘ 🎮!");
    expect(applyStyle("ä", s("squared"))).toBe("ä");
  });

  it("enclosed styles", () => {
    expect(applyStyle("Ab0", s("circled"))).toBe("Ⓐⓑ⓪");
    expect(applyStyle("ab", s("squared"))).toBe("🄰🄱");
    expect(applyStyle("a1", s("circled-neg"))).toBe("🅐❶");
    expect(applyStyle("a1", s("parens"))).toBe("⒜⑴");
  });

  it("fullwidth converts spaces too", () => {
    expect(applyStyle("Hi !", s("fullwidth"))).toBe("Ｈｉ　！");
  });

  it("flips and reverses text", () => {
    expect(applyStyle("Hallo!", s("upside-down"))).toBe("¡ollɐH");
    expect(applyStyle("ä", s("upside-down"))).toBe("ɐ̤");
  });

  it("combining styles put a mark after every character", () => {
    expect(applyStyle("ab", s("strike"))).toBe("a̶b̶");
  });

  it("reports partial coverage", () => {
    expect(coverage("abc", s("bold"))).toBe(1);
    expect(coverage("q", s("subscript"))).toBe(0);
  });

  it("counts code points", () => {
    expect(codePointLength("𝐀𝐁")).toBe(2);
    expect("𝐀𝐁".length).toBe(4);
  });

  it("builds valid usernames", () => {
    expect(toUsername("Max Müller")).toBe("max_mueller");
    expect(toUsername("𝐁𝐨𝐥𝐝..Name!")).toBe("bold.name");
    expect(toUsername("__Straße__")).toBe("strasse");
    expect(isValidUsername("max_mueller")).toBe(true);
    expect(isValidUsername("a..b")).toBe(false);
    expect(isValidUsername("A")).toBe(false);
  });
});
