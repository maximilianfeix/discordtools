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
});
