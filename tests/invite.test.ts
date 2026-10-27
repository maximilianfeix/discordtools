import { describe, expect, it } from "vitest";
import { featureLabel, guildIconUrl, parseInviteCode, sortFeatures } from "../src/lib/invite";

describe("parseInviteCode", () => {
  it("accepts all common invite forms", () => {
    for (const s of [
      "discord.gg/discord-developers",
      "https://discord.gg/discord-developers",
      "https://discord.com/invite/discord-developers",
      "https://discordapp.com/invite/discord-developers?event=123",
      "https://ptb.discord.com/invite/discord-developers/",
      "  discord-developers ",
    ]) expect(parseInviteCode(s)).toBe("discord-developers");
  });
  it("rejects junk", () => {
    expect(parseInviteCode("")).toBeNull();
    expect(parseInviteCode("https://example.com/x y")).toBeNull();
    expect(parseInviteCode("hello world")).toBeNull();
  });
});

describe("labels and urls", () => {
  it("translates known features and humanizes others", () => {
    expect(featureLabel("VERIFIED", "de")).toBe("Verifiziert");
    expect(featureLabel("SOME_NEW_THING", "en")).toBe("Some new thing");
    expect(sortFeatures(["ZED", "COMMUNITY", "VERIFIED"])).toEqual({ known: ["VERIFIED", "COMMUNITY"], other: ["ZED"] });
  });
  it("builds animated icon urls", () => {
    expect(guildIconUrl("1", "a_abc")).toBe("https://cdn.discordapp.com/icons/1/a_abc.gif?size=256");
    expect(guildIconUrl("1", "abc", 64)).toBe("https://cdn.discordapp.com/icons/1/abc.png?size=64");
  });
});
