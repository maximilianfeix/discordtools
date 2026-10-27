/** Guild widget helpers: input parsing, the official embed snippets and widget.png banner URLs. */
import { isSnowflake } from "./snowflake";

export interface WidgetChannel {
  id: string;
  name: string;
  position: number;
}
export interface WidgetMember {
  id: string;
  username: string;
  discriminator?: string;
  avatar: string | null;
  status: "online" | "idle" | "dnd" | string;
  avatar_url?: string;
  game?: { name: string };
  channel_id?: string;
  deaf?: boolean;
  mute?: boolean;
  self_deaf?: boolean;
  self_mute?: boolean;
}
export interface Widget {
  id: string;
  name: string;
  instant_invite: string | null;
  channels: WidgetChannel[];
  members: WidgetMember[];
  presence_count: number;
}

export const WIDGET_STYLES = ["shield", "banner1", "banner2", "banner3", "banner4"] as const;
export type WidgetStyle = (typeof WIDGET_STYLES)[number];

/** Accepts a raw ID, a channel/message link, a widget URL or a widget.json URL. Returns the guild ID. */
export function parseGuildId(input: string): string | null {
  const s = input.trim();
  const m =
    s.match(/discord(?:app)?\.com\/channels\/(\d{15,21})/i) ??
    s.match(/[?&]id=(\d{15,21})/) ??
    s.match(/guilds\/(\d{15,21})/i) ??
    s.match(/^(\d{15,21})$/);
  const id = m?.[1];
  return id && isSnowflake(id) ? id : null;
}

export function widgetJsonUrl(id: string): string {
  return `https://discord.com/api/guilds/${id}/widget.json`;
}

export function widgetPngUrl(id: string, style: WidgetStyle): string {
  return `https://discord.com/api/guilds/${id}/widget.png?style=${style}`;
}

/** The iframe Discord shows under Server Settings → Widget, with a configurable theme. */
export function widgetIframe(id: string, theme: "dark" | "light", width = 350, height = 500): string {
  return `<iframe src="https://discord.com/widget?id=${id}&theme=${theme}" width="${width}" height="${height}" allowtransparency="true" frameborder="0" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>`;
}

export function widgetMarkdown(id: string, style: WidgetStyle, invite?: string | null): string {
  const img = `![Discord](${widgetPngUrl(id, style)})`;
  return invite ? `[${img}](${invite})` : img;
}

export function widgetHtml(id: string, style: WidgetStyle, invite?: string | null): string {
  const img = `<img src="${widgetPngUrl(id, style)}" alt="Discord">`;
  return invite ? `<a href="${invite}">${img}</a>` : img;
}

/** Counts by status, for the summary chips. */
export function statusCounts(members: WidgetMember[]): Record<"online" | "idle" | "dnd" | "other", number> {
  const c = { online: 0, idle: 0, dnd: 0, other: 0 };
  for (const m of members) {
    if (m.status === "online" || m.status === "idle" || m.status === "dnd") c[m.status]++;
    else c.other++;
  }
  return c;
}
