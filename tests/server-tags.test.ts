import { describe, expect, it } from "vitest";
import { IDEAS, checkTag, classifyChar, generateTags, splitChars, words } from "../src/lib/server-tags";

describe("server-tags", () => {
  it("classifies characters", () => {
    expect(classifyChar("A")).toBe("alnum");
    expect(classifyChar("7")).toBe("alnum");
    expect(classifyChar("!")).toBe("symbol");
    expect(classifyChar(" ")).toBe("space");
    expect(classifyChar("🎮")).toBe("emoji");
    expect(classifyChar("ä")).toBe("letter");
    expect(classifyChar("​")).toBe("invisible");
  });

  it("counts emoji sequences as one character", () => {
    expect(splitChars("👩‍💻A")).toHaveLength(2);
  });

  it("accepts 1–4 alphanumeric characters", () => {
    expect(checkTag("GG").status).toBe("ok");
    expect(checkTag("ABCD").status).toBe("ok");
    expect(checkTag("ab12").status).toBe("ok");
  });

  it("rejects empty, too long, spaces and emoji", () => {
    expect(checkTag("").status).toBe("invalid");
    expect(checkTag("ABCDE").issues[0]).toEqual({ code: "too-long", length: 5 });
    expect(checkTag("A B").status).toBe("invalid");
    expect(checkTag("GG🎮").status).toBe("invalid");
    expect(checkTag("A​B").status).toBe("invalid");
  });

  it("warns about symbols and non-ASCII letters", () => {
    const s = checkTag("GG!");
    expect(s.status).toBe("warn");
    expect(s.issues).toEqual([{ code: "symbol", chars: ["!"] }]);
    expect(checkTag("MÜN").status).toBe("warn");
  });

  it("splits server names into words", () => {
    expect(words("Nürnberger Gaming-Crew")).toEqual(["NUERNBERGER", "GAMING", "CREW"]);
    expect(words("PixelPalace")).toEqual(["PIXEL", "PALACE"]);
  });

  it("generates valid tag ideas", () => {
    const t = generateTags("Nürnberger Gaming Crew");
    expect(t[0]).toBe("NGC");
    expect(t).toContain("NUER");
    expect(t.length).toBeGreaterThan(5);
    for (const tag of t) expect(checkTag(tag).status).not.toBe("invalid");
    expect(new Set(t).size).toBe(t.length);
  });

  it("uses digits from the name", () => {
    expect(generateTags("Squad 2026")).toContain("SQ26");
  });

  it("drops stop words and handles empty input", () => {
    expect(generateTags("Die Lern Gruppe")[0]).toBe("LG");
    expect(generateTags("")).toEqual([]);
    expect(generateTags("🎮🎮")).toEqual([]);
    expect(generateTags("Pixel", false).every((x) => /^[A-Za-z0-9]+$/.test(x))).toBe(true);
  });

  it("idea lists only contain tags that are not invalid", () => {
    for (const g of IDEAS) for (const tag of g.tags) expect(checkTag(tag).status, tag).not.toBe("invalid");
  });
});
