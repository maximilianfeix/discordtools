import { describe, expect, it } from "vitest";
import { DEFAULT_PATTERN, TEMPLATES, applyCase, buildName, finalName, parseList, renderList, serializeList, textChannelChanges, toTextChannel } from "../src/lib/channel-names";

describe("channel-names", () => {
  it("builds names with separators", () => {
    expect(buildName("💬", "allgemein", DEFAULT_PATTERN)).toBe("💬┃allgemein");
    expect(buildName("💬", "allgemein", { ...DEFAULT_PATTERN, spaced: true })).toBe("💬 ┃ allgemein");
    expect(buildName("🎮", "zocken", { ...DEFAULT_PATTERN, sep: "kawaii" })).toBe("꒰🎮꒱zocken");
    expect(buildName("", "zocken", { ...DEFAULT_PATTERN, sep: "kawaii" })).toBe("꒰zocken꒱");
    expect(buildName("", "chat", DEFAULT_PATTERN)).toBe("chat");
    expect(buildName("💬", "chat", { ...DEFAULT_PATTERN, sep: "none" })).toBe("💬chat");
  });

  it("applies fonts and case", () => {
    expect(buildName("", "chat", { ...DEFAULT_PATTERN, font: "small-caps" })).toBe("ᴄʜᴀᴛ");
    expect(applyCase("hallo welt", "title")).toBe("Hallo Welt");
    expect(applyCase("Straße", "upper")).toBe("STRASSE");
  });

  it("approximates Discord's text channel rules", () => {
    expect(toTextChannel("General Chat!")).toBe("general-chat");
    expect(toTextChannel("💬 ┃ Allgemein")).toBe("💬-┃-allgemein");
    expect(toTextChannel("a  --  b")).toBe("a-b");
    expect(toTextChannel("Grüße")).toBe("grüße");
    expect(toTextChannel("𝐁𝐎𝐋𝐃")).toBe("𝐁𝐎𝐋𝐃");
    expect(finalName("Voice Lounge", "voice")).toBe("Voice Lounge");
    expect(Array.from(finalName("x".repeat(150), "text")).length).toBe(100);
  });

  it("explains changes", () => {
    const c = textChannelChanges("Hi there!?");
    expect(c.upper).toBe(true);
    expect(c.spaces).toBe(true);
    expect(c.removed).toEqual(["!", "?"]);
  });

  it("parses the list syntax", () => {
    const items = parseList("Info:\n📜 regeln\n+ 🔊 Lounge\nplain\n\n👩‍💻 dev");
    expect(items).toEqual([
      { kind: "category", emoji: "", name: "Info" },
      { kind: "text", emoji: "📜", name: "regeln" },
      { kind: "voice", emoji: "🔊", name: "Lounge" },
      { kind: "text", emoji: "", name: "plain" },
      { kind: "text", emoji: "👩‍💻", name: "dev" },
    ]);
    expect(parseList(serializeList(items))).toEqual(items);
  });

  it("renders a list with a default emoji", () => {
    const r = renderList(parseList("Chat:\nplain\n+ Lounge"), DEFAULT_PATTERN, "✨");
    expect(r.map((x) => x.final)).toEqual(["Chat", "✨┃plain", "✨┃Lounge"]);
  });

  it("templates parse in both languages", () => {
    for (const t of TEMPLATES) {
      for (const l of ["de", "en"] as const) {
        const items = parseList(t.list[l]);
        expect(items.length).toBeGreaterThan(5);
        expect(items[0].kind).toBe("category");
      }
    }
  });
});
