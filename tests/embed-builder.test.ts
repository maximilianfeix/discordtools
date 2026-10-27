import { describe, expect, it } from "vitest";
import {
  countChars, decodeShare, discordPathToDraft, draftToEditPayload, draftToPayload, emptyDraft, emptyEmbed, emptyField,
  encodeShare, flattenDiscordErrors, getTemplate, importJson, isoToLocalInput, listExtras, localInputToIso, looksLikeToken,
  messageToDraft, parseMessageRef, parseWebhookUrl, removeUnknown, TEMPLATE_IDS, totalEmbedChars, validate, webhookEndpoint,
  withQuery, shareSafety, type Draft,
} from "../src/lib/embed-builder";

const codes = (d: Draft) => validate(d).map((i) => `${i.level}:${i.path}:${i.code}`);

function draftWith(p: Partial<Draft>): Draft {
  return { ...emptyDraft(), ...p };
}

describe("countChars", () => {
  it("trims and counts code points", () => {
    expect(countChars("  abc  ")).toBe(3);
    expect(countChars("😀😀")).toBe(2);
    expect(countChars("")).toBe(0);
  });
});

describe("draftToPayload (cleaning)", () => {
  it("drops empty strings, empty objects and empty embeds/fields", () => {
    const e = emptyEmbed();
    e.title = "Hi";
    e.authorUrl = "https://x.dev"; // no name → no author object
    e.fields = [emptyField(), { ...emptyField(), name: "A", value: "B", inline: true }];
    const d = draftWith({ content: "", username: "  ", embeds: [e, emptyEmbed()] });
    expect(draftToPayload(d)).toEqual({
      embeds: [{ title: "Hi", fields: [{ name: "A", value: "B", inline: true }] }],
      allowed_mentions: { parse: [] },
    });
  });

  it("adds flags, thread_name and mentions", () => {
    const d = draftWith({ content: "x", suppressNotifications: true, suppressEmbeds: true, threadName: " Post ", allowMentions: true });
    expect(draftToPayload(d)).toEqual({
      content: "x",
      allowed_mentions: { parse: ["users", "roles", "everyone"] },
      flags: 4100,
      thread_name: "Post",
    });
  });

  it("keeps color 0 (black)", () => {
    const e = { ...emptyEmbed(), title: "t", color: 0 };
    expect((draftToPayload(draftWith({ embeds: [e] })).embeds as { color: number }[])[0].color).toBe(0);
  });

  it("edit payload always clears content/embeds and never sends username", () => {
    const d = draftWith({ username: "Bot", embeds: [{ ...emptyEmbed(), title: "a" }] });
    const p = draftToEditPayload(d);
    expect(p.content).toBe("");
    expect(p.embeds).toEqual([{ title: "a" }]);
    expect(p).not.toHaveProperty("username");
    expect(p.flags).toBe(0);
  });
});

describe("validate", () => {
  it("flags an empty message", () => {
    expect(codes(emptyDraft())).toContain("error:content:emptyMessage");
  });

  it("checks content and per-field limits", () => {
    const e = emptyEmbed();
    e.title = "t".repeat(257);
    e.fields = [{ ...emptyField(), name: "n", value: "" }];
    const issues = codes(draftWith({ content: "a".repeat(2001), embeds: [e] }));
    expect(issues).toContain("error:content:tooLong");
    expect(issues).toContain("error:embeds.0.title:tooLong");
    expect(issues).toContain("error:embeds.0.fields.0.value:required");
  });

  it("checks the 6000 total across embeds", () => {
    const mk = () => ({ ...emptyEmbed(), description: "x".repeat(4000) });
    const d = draftWith({ embeds: [mk(), mk()] });
    expect(totalEmbedChars(d)).toBe(8000);
    expect(codes(d)).toContain("error:embeds:total");
  });

  it("warns about empty embeds and fields", () => {
    const e = { ...emptyEmbed(), title: "x", fields: [emptyField()] };
    const issues = codes(draftWith({ content: "hi", embeds: [emptyEmbed(), e] }));
    expect(issues).toContain("warn:embeds.0:emptyEmbed");
    expect(issues).toContain("warn:embeds.1.fields.0:emptyField");
  });

  it("rejects too many embeds and fields, bad urls and timestamps", () => {
    const e = { ...emptyEmbed(), title: "x", url: "not a url", timestamp: "nope", image: "attachment://a.png" };
    e.fields = Array.from({ length: 26 }, () => ({ ...emptyField(), name: "a", value: "b" }));
    const d = draftWith({ embeds: Array.from({ length: 11 }, () => ({ ...e })) });
    const issues = codes(d);
    expect(issues).toContain("error:embeds:tooManyEmbeds");
    expect(issues).toContain("error:embeds.0.fields:tooManyFields");
    expect(issues).toContain("error:embeds.0.url:badUrl");
    expect(issues).toContain("error:embeds.0.timestamp:badTimestamp");
    expect(issues).toContain("warn:embeds.0.image:attachmentUrl");
  });

  it("blocks forbidden usernames and tokens", () => {
    const tok = ["MTA4NzY1NDMyMTA5ODc2NTQzMg", "GaBcDe", "abcdefghijklmnopqrstuvwxyz0123456789"].join(".");
    expect(looksLikeToken(tok)).toBe(true);
    const issues = codes(draftWith({ content: `my token ${tok}`, username: "Discord Bot" }));
    expect(issues).toContain("error:content:token");
    expect(issues).toContain("error:username:usernameForbidden");
  });

  it("passes all templates in both languages", () => {
    for (const lang of ["de", "en"] as const)
      for (const id of TEMPLATE_IDS) expect(validate(getTemplate(id, lang)).filter((i) => i.level === "error")).toEqual([]);
  });
});

describe("importJson", () => {
  it("reports syntax errors with line and column", () => {
    const r = importJson('{\n  "content": "hi",\n}');
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.code === "syntax") expect(r.error.line).toBe(3);
    else throw new Error("expected syntax error");
  });

  it("reports type problems with paths", () => {
    const r = importJson('{"embeds":[{"title":{"x":1},"fields":"no"}]}');
    expect(r.ok).toBe(false);
    if (!r.ok && r.error.code === "types") expect(r.error.problems.map((p) => p.path)).toEqual(["embeds.0.title", "embeds.0.fields"]);
  });

  it("round-trips a payload and preserves unknown fields", () => {
    const input = {
      content: "Hallo",
      tts: false,
      embeds: [{ title: "T", color: 255, author: { name: "A", foo: 1 }, fields: [{ name: "n", value: "v", inline: true, bar: 2 }], video: { url: "x" } }],
      allowed_mentions: { parse: [] },
    };
    const r = importJson(JSON.stringify(input));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.unknown.sort()).toEqual(["embeds.0.author.foo", "embeds.0.fields.0.bar", "embeds.0.video", "tts"]);
    expect(listExtras(r.draft).sort()).toEqual(r.unknown.sort());
    const out = draftToPayload(r.draft);
    expect(out).toEqual(input);
    const cleaned = removeUnknown(r.draft, "embeds.0.author.foo");
    expect(listExtras(cleaned)).not.toContain("embeds.0.author.foo");
  });

  it("accepts a bare embed, an embed array, hex colors and discohook backups", () => {
    const a = importJson('{"title":"x","color":"#ff0000"}');
    expect(a.ok && a.draft.embeds[0].color === 0xff0000 && a.notes.includes("wrappedEmbed") && a.notes.includes("colorString")).toBe(true);
    const b = importJson('[{"title":"x"},{"title":"y"}]');
    expect(b.ok && b.draft.embeds.length).toBe(2);
    const c = importJson('{"messages":[{"data":{"content":"hi"}}]}');
    expect(c.ok && c.draft.content).toBe("hi");
  });

  it("maps flags and mentions", () => {
    const r = importJson('{"content":"x","flags":4096,"allowed_mentions":{"parse":["users"]}}');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.draft.suppressNotifications).toBe(true);
    expect(r.draft.allowMentions).toBe(true);
    expect(draftToPayload(r.draft).allowed_mentions).toEqual({ parse: ["users"] });
  });
});

describe("messageToDraft", () => {
  it("strips read-only fields from a received message", () => {
    const msg = {
      id: "1", type: 0, content: "hi", channel_id: "2", flags: 4 | 2,
      author: { id: "123456789012345678", username: "Hook", avatar: "abc" },
      embeds: [{ type: "rich", title: "T", image: { url: "https://x/y.png", proxy_url: "p", width: 1, height: 1 } }],
    };
    const r = messageToDraft(msg);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.unknown).toEqual([]);
    expect(r.draft.username).toBe("Hook");
    expect(r.draft.avatarUrl).toBe("https://cdn.discordapp.com/avatars/123456789012345678/abc.png");
    expect(r.draft.suppressEmbeds).toBe(true);
    expect(r.draft.otherFlags).toBe(0);
    expect(draftToPayload(r.draft).embeds).toEqual([{ title: "T", image: { url: "https://x/y.png" } }]);
  });
});

describe("share hash", () => {
  it("round-trips through the compressed hash and never needs the webhook", async () => {
    const p = draftToPayload(getTemplate("rules", "de"));
    const h = await encodeShare(p);
    expect(h.startsWith("m=z.")).toBe(true);
    expect(h.slice(4)).not.toMatch(/[+/=]/);
    expect(await decodeShare("#" + h)).toEqual(p);
  });

  it("refuses oversized hashes and decompression bombs", async () => {
    expect(await decodeShare("#m=j." + "A".repeat(20_000))).toBeNull();
    // ~2 MiB of whitespace compresses to a tiny hash but must not be inflated completely.
    const bomb = await encodeShare({ content: "x", pad: " ".repeat(2 * 1024 * 1024) });
    expect(bomb.length).toBeLessThan(16 * 1024);
    expect(await decodeShare("#" + bomb)).toBeNull();
    // normal sized payloads still work
    const ok = await encodeShare({ content: "y".repeat(5000) });
    expect(await decodeShare("#" + ok)).toEqual({ content: "y".repeat(5000) });
  });

  it("returns null for foreign or broken hashes", async () => {
    expect(await decodeShare("#section")).toBeNull();
    expect(await decodeShare("#m=z.!!!")).toBeNull();
  });
});

describe("shareSafety (share link + autosave)", () => {
  const TOKEN = ["MTAxMjM0NTY3ODkwMTIzNDU2Nzg5", "GaBcDe", "abcdefghijklmnopqrstuvwxyz0123456789"].join(".");
  const HOOK = "https://discord.com/api/webhooks/123456789012345678/" + "a".repeat(68);

  it("blocks tokens and webhook URLs anywhere in the payload, also nested and in unknown keys", () => {
    expect(shareSafety({ content: `hi ${TOKEN}` }).block.map((h) => h.path)).toEqual(["content"]);
    expect(shareSafety({ embeds: [{ fields: [{ name: "a", value: HOOK }] }] }).block).toEqual([{ path: "embeds.0.fields.0.value", kind: "webhook" }]);
    expect(shareSafety({ components: [{ custom: { deep: [TOKEN] } }] }).block[0]).toEqual({ path: "components.0.custom.deep.0", kind: "token" });
    expect(shareSafety({ content: "discordapp.com/api/v10/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz" }).block).toHaveLength(1);
  });

  it("strips and reports unknown keys that look like secrets", () => {
    const r = shareSafety({ content: "hi", webhook_url: "x", embeds: [{ title: "t", api_token: "y", url_with_token: "z", secret: 1 }] });
    expect(r.block).toEqual([]);
    expect(r.warn.map((h) => h.path).sort()).toEqual(["embeds.0.api_token", "embeds.0.secret", "embeds.0.url_with_token", "webhook_url"]);
    expect(r.payload).toEqual({ content: "hi", embeds: [{ title: "t" }] });
  });

  it("passes normal messages unchanged", () => {
    const p = draftToPayload(getTemplate("rules", "de"));
    expect(shareSafety(p)).toEqual({ block: [], warn: [], payload: p });
  });
});

describe("webhook + message links", () => {
  const tok = "a".repeat(68);
  it("accepts the official hosts only", () => {
    for (const host of ["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"])
      expect(parseWebhookUrl(`https://${host}/api/webhooks/123456789012345678/${tok}`)?.id).toBe("123456789012345678");
    expect(parseWebhookUrl(`https://discord.com/api/v10/webhooks/123456789012345678/${tok}?thread_id=223456789012345678`)?.threadId).toBe("223456789012345678");
    expect(parseWebhookUrl(`http://discord.com/api/webhooks/123456789012345678/${tok}`)).toBeNull();
    expect(parseWebhookUrl(`https://discord.com.evil.dev/api/webhooks/123456789012345678/${tok}`)).toBeNull();
    expect(parseWebhookUrl("https://discord.com/api/webhooks/123/abc")).toBeNull();
  });

  it("builds endpoints", () => {
    const w = { id: "1", token: "t" };
    expect(withQuery(webhookEndpoint(w), { wait: "true", thread_id: undefined })).toBe("https://discord.com/api/v10/webhooks/1/t?wait=true");
    expect(webhookEndpoint(w, "9")).toBe("https://discord.com/api/v10/webhooks/1/t/messages/9");
  });

  it("parses message links and IDs", () => {
    expect(parseMessageRef("123456789012345678")).toEqual({ messageId: "123456789012345678" });
    expect(parseMessageRef("https://discord.com/channels/111111111111111111/222222222222222222/333333333333333333")).toEqual({
      channelId: "222222222222222222", messageId: "333333333333333333",
    });
    expect(parseMessageRef("hello")).toBeNull();
  });
});

describe("discord errors", () => {
  it("flattens nested error objects", () => {
    const body = {
      code: 50035, message: "Invalid Form Body",
      errors: { embeds: { "0": { fields: { "1": { value: { _errors: [{ code: "BASE_TYPE_REQUIRED", message: "This field is required" }] } } } } } },
    };
    expect(flattenDiscordErrors(body)).toEqual([{ path: "embeds.0.fields.1.value", code: "BASE_TYPE_REQUIRED", message: "This field is required" }]);
    expect(discordPathToDraft("embeds.0.footer.text")).toBe("embeds.0.footerText");
  });
});

describe("dates", () => {
  it("converts between ISO and datetime-local", () => {
    const iso = localInputToIso("2026-10-27T18:30");
    expect(isoToLocalInput(iso)).toBe("2026-10-27T18:30");
    expect(isoToLocalInput("garbage")).toBe("");
  });
});
