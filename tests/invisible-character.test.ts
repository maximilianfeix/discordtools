import { describe, expect, it } from "vitest";
import { CANDIDATES, charOf, clean, classify, decodeTags, hex, repeatChar, scan, summarize } from "../src/lib/invisible-character";

describe("invisible-character", () => {
  it("formats code points", () => {
    expect(hex(0x3164)).toBe("U+3164");
    expect(hex(0xad)).toBe("U+00AD");
    expect(charOf(0x2800)).toBe("⠀");
  });

  it("every candidate is detected as hidden", () => {
    for (const c of CANDIDATES) expect(classify(c.cp), c.name).not.toBeNull();
  });

  it("repeats with optional line breaks and clamps", () => {
    expect(repeatChar(0x2800, 3)).toBe("⠀⠀⠀");
    expect(repeatChar(0x2800, 2, true)).toBe("⠀\n⠀");
    expect(repeatChar(0x2800, 0)).toBe("⠀");
    expect(Array.from(repeatChar(0x2800, 99999)).length).toBe(2000);
  });

  it("finds zero-width characters and keeps normal text", () => {
    const seg = scan("he​llo worㅤld");
    expect(seg.filter((s) => s.type === "hidden").length).toBe(2);
    const f = summarize(seg);
    expect(f.map((x) => x.name)).toContain("ZERO WIDTH SPACE");
    expect(clean(seg)).toBe("hello wor ld");
    expect(clean(seg, true)).toBe("hello world");
  });

  it("does not flag emoji sequences", () => {
    expect(summarize(scan("❤️ 👩‍💻"))).toEqual([]);
    expect(summarize(scan("a‍b"))).toHaveLength(1);
  });

  it("flags bidi overrides and tag characters", () => {
    expect(classify(0x202e)).toBe("bidi");
    const hidden = "hi" + Array.from("secret").map((c) => String.fromCodePoint(0xe0000 + c.charCodeAt(0))).join("");
    expect(decodeTags(hidden)).toBe("secret");
    expect(summarize(scan(hidden))[0].kind).toBe("tag");
  });

  it("ignores spaces and newlines", () => {
    expect(scan("a b\nc")).toEqual([{ type: "text", value: "a b\nc" }]);
  });
});
