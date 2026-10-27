import { describe, expect, it } from "vitest";
import { codeBlock, diffRange, escapeMarkdown, maskedLink, toggleLinePrefix, unescapeMarkdown, wrapSelection } from "../src/lib/markdown-tools";
import { parseMarkdown } from "../src/lib/discord-markdown";

describe("wrapSelection", () => {
  it("wraps and selects the inner text", () => {
    expect(wrapSelection("say hello now", 4, 9, "**")).toEqual({ text: "say **hello** now", start: 6, end: 11 });
  });
  it("toggles off when markers are outside or inside", () => {
    expect(wrapSelection("say **hello** now", 6, 11, "**")).toEqual({ text: "say hello now", start: 4, end: 9 });
    expect(wrapSelection("say **hello** now", 4, 13, "**")).toEqual({ text: "say hello now", start: 4, end: 9 });
  });
  it("keeps whitespace outside the markers", () => {
    expect(wrapSelection("a word b", 1, 7, "*").text).toBe("a *word* b");
  });
  it("inserts a placeholder without selection", () => {
    expect(wrapSelection("x ", 2, 2, "||", "||", "spoiler")).toEqual({ text: "x ||spoiler||", start: 4, end: 11 });
  });
});

describe("toggleLinePrefix", () => {
  it("adds and removes quote prefixes on all lines", () => {
    const r = toggleLinePrefix("one\ntwo", 0, 7, "> ");
    expect(r.text).toBe("> one\n> two");
    expect(toggleLinePrefix(r.text, r.start, r.end, "> ").text).toBe("one\ntwo");
  });
  it("switches heading levels", () => {
    expect(toggleLinePrefix("# Title", 3, 3, "## ", /^(#{1,3} |-# )/).text).toBe("## Title");
  });
  it("numbers lists", () => {
    expect(toggleLinePrefix("a\nb\nc", 0, 5, (i) => `${i + 1}. `).text).toBe("1. a\n2. b\n3. c");
    expect(toggleLinePrefix("1. a\n2. b", 0, 9, (i) => `${i + 1}. `).text).toBe("a\nb");
  });
  it("works on the caret line only", () => {
    expect(toggleLinePrefix("a\nb\nc", 2, 2, "-# ").text).toBe("a\n-# b\nc");
  });
});

describe("codeBlock and links", () => {
  it("fences a selection on its own lines", () => {
    expect(codeBlock("see x() here", 4, 7, "js").text).toBe("see \n```js\nx()\n```\n here");
    expect(codeBlock("```js\nx\n```", 0, 11).text).toBe("x");
  });
  it("builds masked links", () => {
    expect(maskedLink("go https://a.de", 3, 15, "Text")).toEqual({ text: "go [Text](https://a.de)", start: 4, end: 8 });
    expect(maskedLink("Docs", 0, 4).text).toBe("[Docs](https://)");
  });
});

describe("escapeMarkdown", () => {
  it("escapes inline and line markers", () => {
    expect(escapeMarkdown("**bold** _x_ ||s|| `c`")).toBe("\\*\\*bold\\*\\* \\_x\\_ \\|\\|s\\|\\| \\`c\\`");
    expect(escapeMarkdown("# Title\n> quote\n- item\n-# small")).toBe("\\# Title\n\\> quote\n\\- item\n\\-# small");
    expect(escapeMarkdown("<@123> [a](https://x.de)")).toBe("\\<@123> \\[a\\](https://x.de)");
  });
  it("renders literally in the parser", () => {
    const blocks = parseMarkdown(escapeMarkdown("**bold** and # not a title"));
    expect(blocks).toHaveLength(1);
    const b = blocks[0]!;
    expect(b.type).toBe("paragraph");
    if (b.type !== "paragraph") return;
    expect(b.children.every((c) => c.type === "text")).toBe(true);
    expect(b.children.map((c) => (c.type === "text" ? c.value : "")).join("")).toBe("**bold** and # not a title");
  });
  it("round-trips", () => {
    const src = "**a** _b_ ~~c~~ ||d|| `e`\n# h\n> q";
    expect(unescapeMarkdown(escapeMarkdown(src))).toBe(src);
  });
});

describe("diffRange", () => {
  it("finds the minimal change", () => {
    expect(diffRange("hello world", "hello **world**")).toEqual({ start: 6, end: 11, insert: "**world**" });
    expect(diffRange("abc", "abc")).toEqual({ start: 3, end: 3, insert: "" });
  });
});
