import { describe, expect, it } from "vitest";
import { countText, splitMessage, TEXT_LIMITS } from "../src/lib/character-counter";

describe("countText", () => {
  it("counts like Discord (UTF-16) and explains emoji", () => {
    const s = countText("Hi 👋🏽 🇩🇪!");
    expect(s.length).toBe("Hi 👋🏽 🇩🇪!".length);
    expect(s.length).toBe(13);
    expect(s.visible).toBe(7);
    expect(s.emoji).toBe(2);
    expect(s.emojiExtra).toBe(6);
    expect(s.words).toBe(1);
  });
  it("counts custom emoji, invisible characters, lines and bytes", () => {
    const s = countText("a​b\n<:wave:1067157240457003048> ä");
    expect(s.invisible).toBe(1);
    expect(s.customEmoji).toBe(1);
    expect(s.lines).toBe(2);
    expect(s.bytes).toBe(new TextEncoder().encode("a​b\n<:wave:1067157240457003048> ä").length);
    expect(countText("").lines).toBe(0);
  });
  it("has the limits we show", () => {
    expect(Object.fromEntries(TEXT_LIMITS.map((l) => [l.id, l.max]))).toMatchObject({ message: 2000, nitro: 4000, "embed-desc": 4096, bio: 190, nickname: 32 });
  });
});

describe("splitMessage", () => {
  const words = (n: number) => Array.from({ length: n }, (_, i) => `word${i}`).join(" ");

  it("returns short text unchanged", () => {
    expect(splitMessage("hello")).toEqual(["hello"]);
    expect(splitMessage("   ")).toEqual([]);
  });
  it("keeps every chunk within the limit and never breaks words", () => {
    const text = words(1500);
    const chunks = splitMessage(text, { max: 2000 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(2000);
    expect(chunks.join(" ")).toBe(text);
  });
  it("prefers paragraph breaks", () => {
    const p1 = "a".repeat(1200);
    const p2 = "b".repeat(1200);
    expect(splitMessage(`${p1}\n\n${p2}`)).toEqual([p1, p2]);
  });
  it("closes and reopens code fences", () => {
    const code = Array.from({ length: 300 }, (_, i) => `console.log(${i});`).join("\n");
    const chunks = splitMessage("Intro\n```js\n" + code + "\n```\nOutro", { max: 2000 });
    expect(chunks.length).toBeGreaterThan(2);
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(2000);
      expect((c.match(/```/g) ?? []).length % 2).toBe(0);
    }
    expect(chunks[1]!.startsWith("```js\n")).toBe(true);
    expect(chunks[chunks.length - 1]!.endsWith("Outro")).toBe(true);
    const rebuilt = chunks.join("\n").replace(/\n```\n```js\n/g, "\n");
    expect(rebuilt).toBe("Intro\n```js\n" + code + "\n```\nOutro");
  });
  it("hard-cuts a single giant word without splitting surrogates", () => {
    const chunks = splitMessage("😀".repeat(1500), { max: 2000 });
    for (const c of chunks) {
      expect(c.length).toBeLessThanOrEqual(2000);
      expect(c.length % 2).toBe(0);
    }
    expect(chunks.join("")).toBe("😀".repeat(1500));
  });
  it("numbers chunks within the limit", () => {
    const chunks = splitMessage(words(800), { max: 2000, numbered: true });
    expect(chunks[0]!.endsWith(`\n-# 1/${chunks.length}`)).toBe(true);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(2000);
  });
  it("supports the Nitro limit", () => {
    const chunks = splitMessage(words(1500), { max: 4000 });
    expect(chunks.length).toBe(Math.ceil(words(1500).length / 4000));
  });
});

describe("splitMessage robustness", () => {
  it("terminates on a fence with a huge language tag (review repro)", () => {
    const src = "```" + "a".repeat(1993) + "\n" + "x".repeat(30) + "\n```";
    const chunks = splitMessage(src);
    expect(chunks.length).toBeGreaterThan(0);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(2000);
    expect(chunks.join("")).toContain("x".repeat(30));
  }, 2000);

  it("terminates on random fence-heavy input (fuzz)", () => {
    let seed = 1234567;
    const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    const pieces = ["```", "```js", "```" + "z".repeat(500), "\n", " ", "word", "😀", "a".repeat(700), "b".repeat(2100), "\n\n"];
    for (let n = 0; n < 60; n++) {
      let s = "";
      while (s.length < 6000) s += pieces[Math.floor(rnd() * pieces.length)]!;
      for (const max of [40, 100, 2000]) {
        const chunks = splitMessage(s, { max, numbered: rnd() < 0.3 && max > 50 });
        for (const c of chunks) expect(c.length).toBeLessThanOrEqual(max);
      }
    }
  }, 10000);
});
