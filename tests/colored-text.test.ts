import { describe, expect, it } from "vitest";
import {
  applyStyle,
  applyTextEdit,
  commonStyle,
  spliceDoc,
  concat,
  contrastRatio,
  fromAnsi,
  lowContrastSpans,
  rainbow,
  styled,
  toAnsi,
  toggleTypingStyle,
  toSpans,
  visualizeEscapes,
} from "../src/lib/colored-text";

const ESC = "\u001b";

describe("colored-text model", () => {
  it("applies and toggles colours on a range", () => {
    let doc = styled("Hello world");
    doc = applyStyle(doc, 0, 5, { type: "fg", code: 31 });
    expect(toSpans(doc)).toEqual([
      { text: "Hello", style: { fg: 31 } },
      { text: " world", style: {} },
    ]);
    doc = applyStyle(doc, 0, 5, { type: "fg", code: 31 });
    expect(toSpans(doc)).toEqual([{ text: "Hello world", style: {} }]);
  });

  it("toggles bold only off when the whole range is bold", () => {
    let doc = applyStyle(styled("abcd"), 0, 2, { type: "bold" });
    doc = applyStyle(doc, 0, 4, { type: "bold" });
    expect(doc.styles.every((s) => s.bold)).toBe(true);
    doc = applyStyle(doc, 0, 4, { type: "bold" });
    expect(doc.styles.every((s) => !s.bold)).toBe(true);
  });

  it("resets a range", () => {
    const doc = applyStyle(styled("abc", { fg: 32, bold: true }), 1, 2, { type: "reset" });
    expect(toSpans(doc).map((s) => s.style)).toEqual([{ fg: 32, bold: true }, {}, { fg: 32, bold: true }]);
  });

  it("keeps styles aligned when typing, deleting and pasting", () => {
    const doc = concat(styled("red", { fg: 31 }), styled(" blue", { fg: 34 }));
    const typed = applyTextEdit(doc, "redX blue", { fg: 31 });
    expect(toSpans(typed)).toEqual([
      { text: "redX", style: { fg: 31 } },
      { text: " blue", style: { fg: 34 } },
    ]);
    const deleted = applyTextEdit(doc, "re blue", {});
    expect(toSpans(deleted)).toEqual([
      { text: "re", style: { fg: 31 } },
      { text: " blue", style: { fg: 34 } },
    ]);
    const replaced = applyTextEdit(doc, "red green", { fg: 32 });
    expect(toSpans(replaced)).toEqual([
      { text: "red", style: { fg: 31 } },
      { text: " ", style: { fg: 34 } },
      { text: "green", style: { fg: 32 } },
    ]);
  });

  it("handles repeated characters in edits", () => {
    const doc = styled("aaa", { fg: 31 });
    const next = applyTextEdit(doc, "aaaa", { fg: 32 });
    expect(next.styles).toHaveLength(4);
    expect(next.styles.filter((s) => s.fg === 32)).toHaveLength(1);
  });

  it("exports with the ESC character and parses it back", () => {
    const doc = concat(styled("Hi ", { fg: 31, bold: true }), styled("there", { bg: 45 }));
    const ansi = toAnsi(doc);
    expect(ansi).toBe("```ansi\n" + `${ESC}[0;1;31mHi ${ESC}[0;45mthere${ESC}[0m` + "\n```");
    expect(ansi.includes(ESC)).toBe(true);
    expect(toSpans(fromAnsi(ansi))).toEqual(toSpans(doc));
    expect(visualizeEscapes(ansi)).toContain("\\u001b[0;45m");
  });

  it("toggles the typing style", () => {
    expect(toggleTypingStyle({}, { type: "fg", code: 33 })).toEqual({ fg: 33 });
    expect(toggleTypingStyle({ fg: 33 }, { type: "fg", code: 33 })).toEqual({});
    expect(toggleTypingStyle({ fg: 33, bold: true }, { type: "reset" })).toEqual({});
  });

  it("builds a rainbow without colouring spaces", () => {
    const r = rainbow("ab c");
    expect(r.styles.map((s) => s.fg)).toEqual([31, 33, undefined, 32]);
  });

  it("flags low contrast", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 0);
    const doc = concat(styled("ok", { fg: 37, bg: 40 }), styled("bad", { fg: 37, bg: 47 }));
    expect(lowContrastSpans(doc)).toEqual(["bad"]);
  });
});

describe("splice and summary", () => {
  it("splices styled text and summarises a range", () => {
    const doc = spliceDoc(styled("ab"), 1, 1, styled("XY", { fg: 32, bold: true }));
    expect(doc.text).toBe("aXYb");
    expect(commonStyle(doc, 1, 3)).toEqual({ fg: 32, bold: true });
    expect(commonStyle(doc, 0, 3)).toEqual({});
  });
});
