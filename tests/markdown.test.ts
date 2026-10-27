import { describe, expect, it } from "vitest";
import { parseInline, parseMarkdown, isEmojiOnly } from "../src/lib/discord-markdown";

describe("discord markdown", () => {
  it("parses nested inline formatting", () => {
    expect(parseInline("**bold *it*** and ||secret||")).toEqual([
      { type: "bold", children: [{ type: "text", value: "bold " }, { type: "italic", children: [{ type: "text", value: "it" }] }] },
      { type: "text", value: " and " },
      { type: "spoiler", children: [{ type: "text", value: "secret" }] },
    ]);
  });
  it("parses mentions, timestamps and emoji", () => {
    const out = parseInline("<@175928847299117063> <t:1700000000:R> <a:wave:175928847299117063>");
    expect(out.map((n) => n.type)).toEqual(["mention", "text", "timestamp", "text", "emoji"]);
  });
  it("parses blocks", () => {
    const blocks = parseMarkdown("# Title\n-# small\n> quote\n- a\n  - b\n```js\nx()\n```\ntext");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "subtext", "quote", "list", "codeblock", "paragraph"]);
  });
  it("keeps code literal", () => {
    expect(parseInline("`**no**`")).toEqual([{ type: "code", value: "**no**" }]);
  });
  it("detects jumbo emoji", () => {
    expect(isEmojiOnly("🔥 <:ab:175928847299117063>")).toBe(true);
    expect(isEmojiOnly("hi 🔥")).toBe(false);
  });
  it("does not nest quotes (Discord shows inner '> ' literally)", () => {
    const b = parseMarkdown("> > inner");
    expect(b).toEqual([{ type: "quote", children: [{ type: "paragraph", children: [{ type: "text", value: "> inner" }] }] }]);
    const multi = parseMarkdown(">>> > x\n>>> y");
    expect(multi).toHaveLength(1);
    expect(multi[0]!.type).toBe("quote");
  });
  it("survives 6000 nested quotes without a stack overflow", () => {
    const b = parseMarkdown("> ".repeat(6000) + "x");
    expect(b).toHaveLength(1);
    expect(b[0]!.type).toBe("quote");
  });
  it("survives deeply nested inline formatting", () => {
    const deep = "||**".repeat(3000) + "x" + "**||".repeat(3000);
    expect(() => parseInline(deep)).not.toThrow();
    expect(() => parseMarkdown(deep)).not.toThrow();
  });
  it("keeps out-of-range timestamps as literal text", () => {
    expect(parseInline("<t:9999999999999>")).toEqual([{ type: "text", value: "<t:9999999999999>" }]);
    expect(parseInline("<t:1700000000>")[0]!.type).toBe("timestamp");
  });
});
