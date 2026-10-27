import { describe, expect, it } from "vitest";
import {
  BLOCKS, DEFAULT_OPTIONS, activeRules, base64url, defaultRules, embedBuilderHash, embedIssues, moveRule, splitMessage, toEmbed,
  toMarkdown, toPayload, translateRules, type RulesOptions,
} from "../src/lib/rules-generator";

const opts = (style: RulesOptions["style"] = "numbered"): RulesOptions => ({ ...DEFAULT_OPTIONS.de, style, color: 0x3ee0a8 });

function decodeHash(h: string): unknown {
  const b64 = h.slice(4).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "===".slice((b64.length + 3) % 4));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}

describe("rules-generator", () => {
  it("has de and en text for every block", () => {
    for (const b of BLOCKS) {
      expect(b.title.de && b.title.en && b.text.de && b.text.en).toBeTruthy();
    }
    expect(defaultRules("de").filter((r) => r.on).length).toBeGreaterThanOrEqual(6);
  });

  it("renders the three markdown styles", () => {
    const rules = defaultRules("de");
    const num = toMarkdown(rules, opts("numbered"));
    expect(num.startsWith("# 📜 Serverregeln")).toBe(true);
    expect(num).toContain("**1. Respekt**");
    expect(num).toContain("-# Mit deiner Teilnahme");
    expect(toMarkdown(rules, opts("headings"))).toContain("### 1. Respekt");
    expect(toMarkdown(rules, opts("emoji"))).toContain("**🤝 Respekt**");
  });

  it("numbers only active rules", () => {
    const rules = defaultRules("en").map((r) => ({ ...r, on: r.blockId === "nsfw" || r.blockId === "tos" }));
    const md = toMarkdown(rules, { ...opts(), ...DEFAULT_OPTIONS.en });
    expect(md).toContain("**1. No NSFW**");
    expect(md).toContain("**2. Discord rules**");
    expect(md).toContain("https://discord.com/guidelines");
  });

  it("moves rules up and down", () => {
    const r = defaultRules("de");
    const m = moveRule(r, 0, 1);
    expect(m[1].blockId).toBe(r[0].blockId);
    expect(moveRule(r, 0, -1)).toBe(r);
  });

  it("translates built-in rules and keeps custom ones", () => {
    const r = [...defaultRules("de"), { key: "c1", blockId: "", emoji: "⭐", title: "Eigene", text: "Text", on: true }];
    const t = translateRules(r, "en");
    expect(t[0].title).toBe("Respect");
    expect(t[t.length - 1].title).toBe("Eigene");
  });

  it("builds an embed with fields and suppresses mentions", () => {
    const p = toPayload(defaultRules("de"), opts());
    expect(p.allowed_mentions).toEqual({ parse: [] });
    const e = p.embeds![0];
    expect(e.title).toBe("📜 Serverregeln");
    expect(e.fields!.length).toBe(activeRules(defaultRules("de")).length);
    expect(e.fields![0].name).toBe("1. Respekt");
    expect(e.color).toBe(0x3ee0a8);
    expect(toEmbed(defaultRules("de"), opts("emoji")).fields![0].name).toBe("🤝 Respekt");
  });

  it("reports embed limit problems", () => {
    expect(embedIssues(defaultRules("de"), opts())).toEqual([]);
    const long = defaultRules("de").map((r, i) => (i === 0 ? { ...r, text: "x".repeat(1100) } : r));
    expect(embedIssues(long, opts()).map((i) => i.kind)).toContain("fieldValue");
  });

  it("encodes the embed-builder hash as base64url UTF-8 JSON", () => {
    expect(base64url("ä")).toBe("w6Q");
    const payload = toPayload(defaultRules("de"), opts());
    const h = embedBuilderHash(payload);
    expect(h.startsWith("m=j.")).toBe(true);
    expect(h.slice(4)).not.toMatch(/[+/=]/);
    expect(decodeHash(h)).toEqual(payload);
  });

  it("splits long messages at paragraphs", () => {
    const text = Array.from({ length: 30 }, (_, i) => `Absatz ${i} ` + "x".repeat(100)).join("\n\n");
    const parts = splitMessage(text, 2000);
    expect(parts.length).toBeGreaterThan(1);
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(2000);
    expect(parts.join("\n\n")).toBe(text);
    expect(splitMessage("short")).toEqual(["short"]);
    const huge = splitMessage("y".repeat(4500), 2000);
    expect(huge.map((p) => p.length)).toEqual([2000, 2000, 500]);
  });
});
