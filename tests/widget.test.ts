import { describe, expect, it } from "vitest";
import { parseGuildId, statusCounts, widgetIframe, widgetMarkdown, widgetPngUrl } from "../src/lib/widget";

describe("widget", () => {
  it("parses guild ids from many inputs", () => {
    expect(parseGuildId("81384788765712384")).toBe("81384788765712384");
    expect(parseGuildId("https://discord.com/channels/81384788765712384/81384788862181376")).toBe("81384788765712384");
    expect(parseGuildId("https://discord.com/widget?id=81384788765712384&theme=dark")).toBe("81384788765712384");
    expect(parseGuildId("https://discord.com/api/guilds/81384788765712384/widget.json")).toBe("81384788765712384");
    expect(parseGuildId("abc")).toBeNull();
    expect(parseGuildId("123")).toBeNull();
  });
  it("builds embed code", () => {
    expect(widgetIframe("1", "light")).toContain('src="https://discord.com/widget?id=1&theme=light"');
    expect(widgetPngUrl("1", "banner2")).toBe("https://discord.com/api/guilds/1/widget.png?style=banner2");
    expect(widgetMarkdown("1", "shield", "https://discord.gg/x")).toBe("[![Discord](https://discord.com/api/guilds/1/widget.png?style=shield)](https://discord.gg/x)");
  });
  it("counts statuses", () => {
    const m = (status: string) => ({ id: "0", username: "a", avatar: null, status });
    expect(statusCounts([m("online"), m("idle"), m("dnd"), m("dnd"), m("x")])).toEqual({ online: 1, idle: 1, dnd: 2, other: 1 });
  });
});
