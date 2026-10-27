import { describe, expect, it } from "vitest";
import { emojiUrl, fileName, isAnimatedWebp, isApng, parseAssets, stickerUrl } from "../src/lib/emoji";

describe("parseAssets", () => {
  it("finds emoji markup inside a message", () => {
    const r = parseAssets("gg <:pepe:216154654256398347> and <a:party:216154654256398348>!");
    expect(r.items).toMatchObject([
      { kind: "emoji", id: "216154654256398347", name: "pepe", animated: false },
      { kind: "emoji", id: "216154654256398348", name: "party", animated: true },
    ]);
    expect(r.invalid).toEqual(["gg", "and", "!"]);
  });
  it("reads CDN urls for emojis and stickers", () => {
    const r = parseAssets(
      "https://cdn.discordapp.com/emojis/216154654256398347.gif?size=48\nhttps://cdn.discordapp.com/emojis/216154654256398349.webp?size=96&animated=true&name=wave\nhttps://media.discordapp.net/stickers/749054660769218631.png?size=160\nhttps://cdn.discordapp.com/stickers/749054660769218632.json",
    );
    expect(r.items.map((i) => [i.kind, i.animated, i.stickerFormat, i.name])).toEqual([
      ["emoji", true, undefined, undefined],
      ["emoji", true, undefined, "wave"],
      ["sticker", undefined, undefined, undefined],
      ["sticker", undefined, "lottie", undefined],
    ]);
  });
  it("treats bare IDs as emoji or sticker and dedupes", () => {
    expect(parseAssets("216154654256398347 216154654256398347").items).toHaveLength(1);
    expect(parseAssets("216154654256398347", "sticker").items[0]!.kind).toBe("sticker");
    expect(parseAssets("sticker:749054660769218631").items[0]!.kind).toBe("sticker");
  });
});

describe("urls and files", () => {
  it("builds emoji and sticker urls", () => {
    expect(emojiUrl("1", { format: "webp", size: 128, animated: true })).toBe("https://cdn.discordapp.com/emojis/1.webp?size=128&quality=lossless&animated=true");
    expect(emojiUrl("1", { format: "png", size: 64 })).toBe("https://cdn.discordapp.com/emojis/1.png?size=64");
    expect(stickerUrl("2", "gif")).toBe("https://media.discordapp.net/stickers/2.gif");
    expect(stickerUrl("2", "lottie")).toBe("https://cdn.discordapp.com/stickers/2.json");
  });
  it("makes safe file names", () => {
    expect(fileName("pepe hands!", "1", "128", "png")).toBe("pepe_hands_128.png");
    expect(fileName(undefined, "1", "", "gif")).toBe("1.gif");
  });
  it("detects animated webp and apng", () => {
    const webp = new Uint8Array(32);
    webp.set([...("RIFF")].map((c) => c.charCodeAt(0)), 0);
    webp.set([...("WEBPVP8X")].map((c) => c.charCodeAt(0)), 8);
    expect(isAnimatedWebp(webp)).toBe(false);
    webp[20] = 0x02;
    expect(isAnimatedWebp(webp)).toBe(true);
    const chunk = (type: string, len = 0) => [0, 0, 0, len, ...[...type].map((c) => c.charCodeAt(0)), ...new Array(len + 4).fill(0)];
    const sig = [137, 80, 78, 71, 13, 10, 26, 10];
    expect(isApng(new Uint8Array([...sig, ...chunk("IHDR", 13), ...chunk("acTL", 8), ...chunk("IDAT")]))).toBe(true);
    expect(isApng(new Uint8Array([...sig, ...chunk("IHDR", 13), ...chunk("IDAT")]))).toBe(false);
  });
});
