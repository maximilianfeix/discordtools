import { describe, expect, it } from "vitest";
import {
  NAME_RE,
  commandPayload,
  exampleCommand,
  importCommand,
  newCommand,
  newOption,
  toCurl,
  toDiscordJs,
  totalChars,
  validateCommand,
  type CommandDraft,
  type OptionDraft,
} from "../src/lib/slash-commands";

const errors = (c: CommandDraft) => validateCommand(c).filter((i) => i.level === "error").map((i) => i.en);
const base = (): CommandDraft => ({ ...newCommand(1), name: "ping", description: "Pong!" });

describe("naming", () => {
  it("follows the documented regex", () => {
    expect(NAME_RE.test("ping")).toBe(true);
    expect(NAME_RE.test("nachrichten-löschen")).toBe(true);
    expect(NAME_RE.test("名前")).toBe(true);
    expect(NAME_RE.test("with space")).toBe(false);
    expect(NAME_RE.test("a".repeat(33))).toBe(false);
    expect(NAME_RE.test("")).toBe(false);
  });

  it("requires lowercase for chat input but not for context menus", () => {
    expect(errors({ ...base(), name: "Ping" }).join()).toMatch(/lowercase/);
    const user = { ...newCommand(2), name: "Show Profile" };
    expect(errors(user)).toEqual([]);
    expect(errors({ ...user, name: "x".repeat(33) }).join()).toMatch(/32/);
  });

  it("checks description length", () => {
    expect(errors({ ...base(), description: "" }).join()).toMatch(/missing/);
    expect(errors({ ...base(), description: "x".repeat(101) }).join()).toMatch(/100/);
    expect(errors({ ...base(), description: "x".repeat(100) })).toEqual([]);
  });

  it("validates localizations", () => {
    expect(errors({ ...base(), nameLoc: { de: "Pingen" } }).join()).toMatch(/lowercase/);
    expect(errors({ ...base(), nameLoc: { xx: "ping" } }).join()).toMatch(/Unknown locale/);
    expect(errors({ ...base(), nameLoc: { de: "" } })).toEqual([]);
  });
});

describe("options", () => {
  it("allows max 25 options and unique names", () => {
    const c = base();
    c.options = Array.from({ length: 26 }, (_, i) => ({ ...newOption(3, `o${i}`), description: "d" }));
    expect(errors(c).join()).toMatch(/At most 25 options/);
    c.options = [{ ...newOption(3, "a"), description: "d" }, { ...newOption(5, "a"), description: "d" }];
    expect(errors(c).join()).toMatch(/used twice/);
  });

  it("requires required options first", () => {
    const c = base();
    c.options = [{ ...newOption(3, "a"), description: "d" }, { ...newOption(3, "b"), description: "d", required: true }];
    expect(errors(c).join()).toMatch(/before optional/);
    c.options.reverse();
    expect(errors(c)).toEqual([]);
  });

  it("validates choices", () => {
    const c = base();
    const o = { ...newOption(4, "n"), description: "d" };
    o.choices = Array.from({ length: 26 }, (_, i) => ({ name: `c${i}`, nameLoc: {}, value: String(i) }));
    c.options = [o];
    expect(errors(c).join()).toMatch(/At most 25 choices/);
    o.choices = [{ name: "x", nameLoc: {}, value: "1.5" }];
    expect(errors(c).join()).toMatch(/integer/);
    o.choices = [{ name: "x", nameLoc: {}, value: "1" }];
    o.autocomplete = true;
    expect(errors(c).join()).toMatch(/Autocomplete/);
  });

  it("validates min/max", () => {
    const c = base();
    c.options = [{ ...newOption(4, "n"), description: "d", minValue: "10", maxValue: "5" }];
    expect(errors(c).join()).toMatch(/greater/);
    c.options = [{ ...newOption(4, "n"), description: "d", minValue: String(2 ** 53) }];
    expect(errors(c).join()).toMatch(/min_value/);
    c.options = [{ ...newOption(3, "s"), description: "d", minLength: "0", maxLength: "6001" }];
    expect(errors(c).join()).toMatch(/max_length/);
    c.options = [{ ...newOption(3, "s"), description: "d", minLength: "0", maxLength: "6000" }];
    expect(errors(c)).toEqual([]);
  });

  it("enforces subcommand structure", () => {
    const c = base();
    const sub = { ...newOption(1, "add"), description: "d" };
    c.options = [sub, { ...newOption(3, "x"), description: "d" }];
    expect(errors(c).join()).toMatch(/cannot be mixed/);
    const group: OptionDraft = { ...newOption(2, "role"), description: "d", options: [] };
    c.options = [group];
    expect(errors(c).join()).toMatch(/at least one subcommand/);
    group.options = [{ ...newOption(3, "x"), description: "d" }];
    expect(errors(c).join()).toMatch(/only contain subcommands/);
    group.options = [{ ...sub, options: [{ ...newOption(1, "deep"), description: "d" }] }];
    expect(errors(c).join()).toMatch(/cannot contain more subcommands/);
    group.options = [{ ...sub, options: [{ ...newOption(6, "user"), description: "d", required: true }] }];
    expect(errors(c)).toEqual([]);
  });

  it("counts characters toward the 8000 limit", () => {
    const c = base();
    expect(totalChars(c)).toBe(4 + 5);
    c.nameLoc = { de: "pingpong" };
    expect(totalChars(c)).toBe(8 + 5);
    c.description = "x".repeat(100);
    c.options = Array.from({ length: 25 }, (_, i) => ({
      ...newOption(3, `option-${i}`),
      description: "y".repeat(100),
      choices: Array.from({ length: 25 }, (_, j) => ({ name: "z".repeat(100), nameLoc: {}, value: `v${j}` })),
    }));
    expect(errors(c).join()).toMatch(/Too much text/);
  });
});

describe("payload and code", () => {
  it("builds the documented JSON shape", () => {
    const p = commandPayload(exampleCommand("remind"));
    expect(p).toMatchObject({
      name: "remind",
      type: 1,
      name_localizations: { de: "erinnern" },
      description: "Set a reminder",
      integration_types: [0, 1],
      contexts: [0, 1, 2],
    });
    const opts = p.options as Record<string, unknown>[];
    expect(opts[0]).toMatchObject({ type: 3, name: "text", required: true, max_length: 200 });
    expect(opts[1]).toMatchObject({ type: 4, min_value: 1, max_value: 10080 });
    expect(opts[2]).toMatchObject({ type: 7, channel_types: [0, 5] });
    expect(opts[2]!.required).toBeUndefined();
    expect(p.default_member_permissions).toBeUndefined();
  });

  it("all examples are valid", () => {
    for (const id of ["remind", "mod", "user", "message"] as const) expect(errors(exampleCommand(id))).toEqual([]);
  });

  it("handles permissions, guild scope and context menus", () => {
    expect(commandPayload({ ...base(), permMode: "admins" }).default_member_permissions).toBe("0");
    expect(commandPayload({ ...base(), permMode: "custom", permissions: "4503599627370496" }).default_member_permissions).toBe("4503599627370496");
    const g = commandPayload({ ...base(), scope: "guild" });
    expect(g.contexts).toBeUndefined();
    expect(g.integration_types).toBeUndefined();
    const m = commandPayload(exampleCommand("message"));
    expect(m).toMatchObject({ type: 3, description: "" });
    expect(m.options).toBeUndefined();
  });

  it("converts choice values per type", () => {
    const p = commandPayload(exampleCommand("mod"));
    const timeout = (p.options as { options: { choices?: { value: unknown }[] }[] }[])[0]!;
    expect(timeout.options[1]!.choices![0]!.value).toBe(5);
  });

  it("generates discord.js builder code", () => {
    const js = toDiscordJs(exampleCommand("mod"));
    expect(js).toContain('import { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ApplicationIntegrationType } from "discord.js";');
    expect(js).toContain(".addSubcommand((sub) =>");
    expect(js).toContain(".addUserOption((o) =>");
    expect(js).toContain("PermissionFlagsBits.KickMembers | PermissionFlagsBits.BanMembers | PermissionFlagsBits.ModerateMembers");
    expect(js).toContain('{ name: "1 hour", name_localizations: { de: "1 Stunde" }, value: 60 },');
    const ctx = toDiscordJs(exampleCommand("user"));
    expect(ctx).toContain("new ContextMenuCommandBuilder()");
    expect(ctx).toContain(".setType(ApplicationCommandType.User)");
    expect(toDiscordJs(exampleCommand("remind"))).toContain(".addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)");
    // parentheses balance
    const open = (js.match(/\(/g) ?? []).length;
    const close = (js.match(/\)/g) ?? []).length;
    expect(open).toBe(close);
  });

  it("generates a curl snippet without a real token", () => {
    const sh = toCurl({ ...base(), scope: "guild" });
    expect(sh).toContain("/guilds/$GUILD_ID/commands");
    expect(sh).toContain('"Authorization: Bot $DISCORD_TOKEN"');
    expect(sh).toContain('"name": "ping"');
  });
});

describe("import", () => {
  it("round-trips the examples", () => {
    for (const id of ["remind", "mod", "user", "message"] as const) {
      const c = exampleCommand(id);
      const r = importCommand(JSON.stringify(commandPayload(c)));
      expect(r.ok).toBe(true);
      if (r.ok) expect(commandPayload(r.draft)).toEqual(commandPayload(c));
    }
  });

  it("accepts arrays and reports bad input", () => {
    const r = importCommand(JSON.stringify([{ name: "a", description: "b" }, { name: "c" }]));
    expect(r.ok && r.warnings).toEqual(["array:2"]);
    expect(importCommand("{")).toEqual({ ok: false, error: "json" });
    expect(importCommand("[1]")).toEqual({ ok: false, error: "shape" });
  });

  it("maps legacy dm_permission", () => {
    const r = importCommand(JSON.stringify({ name: "a", description: "b", dm_permission: false }));
    expect(r.ok && r.draft.contexts).toEqual([0]);
  });
});
