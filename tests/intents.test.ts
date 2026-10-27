import { describe, expect, it } from "vitest";
import {
  ALL_INTENTS,
  INTENTS,
  INTENT_PRESETS,
  NON_PRIVILEGED_INTENTS,
  PRIVILEGED_INTENTS,
  decodeIntents,
  discordJsSnippet,
  discordPySnippet,
  identifySnippet,
  intentNotes,
  intentsValue,
} from "../src/lib/intents";

describe("intents data", () => {
  it("has the documented bits", () => {
    expect(INTENTS.map((i) => i.bit)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 24, 25]);
    expect(ALL_INTENTS).toBe(53608447n);
    expect(PRIVILEGED_INTENTS).toBe(2n | 256n | 32768n);
    expect(NON_PRIVILEGED_INTENTS).toBe(53575421n);
  });

  it("matches discord.js GatewayIntentBits values", () => {
    const by = Object.fromEntries(INTENTS.map((i) => [i.djs, 1n << BigInt(i.bit)]));
    expect(by.GuildExpressions).toBe(8n);
    expect(by.MessageContent).toBe(32768n);
    expect(by.AutoModerationExecution).toBe(2097152n);
    expect(by.DirectMessagePolls).toBe(33554432n);
  });

  it("has unique keys and names in both languages", () => {
    expect(new Set(INTENTS.map((i) => i.key)).size).toBe(INTENTS.length);
    for (const i of INTENTS) expect(i.name.de && i.name.en && i.desc.de && i.desc.en && i.dpy).toBeTruthy();
  });
});

describe("encode / decode", () => {
  it("encodes the classic prefix bot", () => {
    expect(intentsValue(["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"])).toBe(33281n);
    expect(() => intentsValue(["NOPE"])).toThrow();
  });

  it("decodes and keeps unknown bits", () => {
    const d = decodeIntents(513n | (1n << 17n) | (1n << 40n));
    expect(d.known.map((i) => i.key)).toEqual(["GUILDS", "GUILD_MESSAGES"]);
    expect(d.unknown).toEqual([17, 40]);
  });

  it("presets are subsets of all intents", () => {
    for (const p of INTENT_PRESETS) expect(p.value & ~ALL_INTENTS).toBe(0n);
  });

  it("notes common mistakes", () => {
    expect(intentNotes(intentsValue(["GUILDS", "MESSAGE_CONTENT"]))).toEqual(["privileged", "content-without-messages"]);
    expect(intentNotes(intentsValue(["GUILDS", "GUILD_MESSAGES"]))).toEqual(["messages-without-content"]);
    expect(intentNotes(intentsValue(["GUILD_PRESENCES"]))).toEqual(["privileged", "presences-heavy"]);
    expect(intentNotes(1n)).toEqual([]);
  });
});

describe("snippets", () => {
  it("builds discord.js and discord.py code", () => {
    const v = intentsValue(["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"]);
    const js = discordJsSnippet(v);
    expect(js).toContain("GatewayIntentBits.Guilds,");
    expect(js).toContain("GatewayIntentBits.MessageContent,");
    const py = discordPySnippet(v);
    expect(py).toContain("intents.guild_messages = True");
    expect(py).toContain("intents.message_content = True  # privilegiert / privileged");
    expect(identifySnippet(v)).toContain('"intents": 33281');
  });
});
