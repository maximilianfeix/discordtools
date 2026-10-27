import { describe, expect, it } from "vitest";
import {
  commandMention,
  emojiMarkup,
  emojiUrl,
  findReferences,
  guildNav,
  isCommandName,
  isEmojiName,
  messageLink,
  referenceIds,
  roleMention,
  userMention,
} from "../src/lib/mentions";

const U = "80351110224678912";
const C = "1100000000000000000";
const G = "1000000000000000000";
const M = "1200000000000000000";

describe("builders", () => {
  it("builds mentions", () => {
    expect(userMention(U)).toBe(`<@${U}>`);
    expect(roleMention(U)).toBe(`<@&${U}>`);
    expect(commandMention("ping", C)).toBe(`</ping:${C}>`);
    expect(commandMention("ticket", C, "open")).toBe(`</ticket open:${C}>`);
    expect(commandMention("config", C, "set", "roles")).toBe(`</config roles set:${C}>`);
    expect(emojiMarkup("wave", C)).toBe(`<:wave:${C}>`);
    expect(emojiMarkup("party", C, true)).toBe(`<a:party:${C}>`);
    expect(emojiUrl(C, true, 48)).toBe(`https://cdn.discordapp.com/emojis/${C}.webp?size=48&animated=true`);
    expect(guildNav("browse")).toBe("<id:browse>");
    expect(guildNav("linked-roles", U)).toBe(`<id:linked-roles:${U}>`);
    expect(messageLink(G, C, M)).toBe(`https://discord.com/channels/${G}/${C}/${M}`);
    expect(messageLink("@me", C)).toBe(`https://discord.com/channels/@me/${C}`);
  });
  it("validates names", () => {
    expect(isCommandName("ping")).toBe(true);
    expect(isCommandName("über-cmd_2")).toBe(true);
    expect(isCommandName("Ping")).toBe(false);
    expect(isCommandName("has space")).toBe(false);
    expect(isEmojiName("ok_hand")).toBe(true);
    expect(isEmojiName("a")).toBe(false);
  });
});

describe("findReferences", () => {
  it("explains everything in a message", () => {
    const text = `Hi <@!${U}> & <@&${U}>, see <#${C}> or https://discord.com/channels/${G}/${C}/${M}. Use </ticket open:${C}> <a:wave:${C}> at <t:1700000000:R> in <id:customize> @everyone ${U}`;
    const refs = findReferences(text);
    expect(refs.map((r) => r.kind)).toEqual(["user", "role", "channel", "message", "command", "emoji", "timestamp", "nav", "everyone", "id"]);
    const cmd = refs[4]!;
    expect(cmd).toMatchObject({ kind: "command", name: "ticket", sub: "open", id: C });
    expect(refs[5]).toMatchObject({ kind: "emoji", name: "wave", animated: true });
    expect(refs[6]).toMatchObject({ kind: "timestamp", unix: 1700000000, style: "R" });
  });
  it("handles channel links, DM links, game mentions and groups", () => {
    const refs = findReferences(`https://ptb.discord.com/channels/${G}/${C} https://discord.com/channels/@me/${C}/${M} <@$123456> </a b c:${C}>`);
    expect(refs[0]).toMatchObject({ kind: "channel-link", guildId: G, channelId: C });
    expect(refs[1]).toMatchObject({ kind: "message", guildId: "@me" });
    expect(refs[2]).toMatchObject({ kind: "game", id: "123456" });
    expect(refs[3]).toMatchObject({ kind: "command", name: "a", group: "b", sub: "c" });
  });
  it("lists ids with creation dates", () => {
    const [ref] = findReferences(`https://discord.com/channels/@me/${C}/${M}`);
    const ids = referenceIds(ref!);
    expect(ids.map((i) => i.role)).toEqual(["channel", "message"]);
    expect(referenceIds(findReferences(`<@${U}>`)[0]!)[0]!.created).toBe(1439227597529);
  });
  it("ignores plain text", () => {
    expect(findReferences("nothing here 12345")).toEqual([]);
  });
});
