/** Discord epoch: 2015-01-01T00:00:00.000Z */
export const DISCORD_EPOCH = 1420070400000n;

export interface SnowflakeParts {
  id: string;
  timestamp: number;
  date: Date;
  workerId: number;
  processId: number;
  increment: number;
  binary: string;
}

const SNOWFLAKE_RE = /^\d{15,21}$/;

/** Pulls the first snowflake out of a mention, URL or raw ID. */
export function extractSnowflake(input: string): string | null {
  const match = input.trim().match(/\d{15,21}/g);
  if (!match) return null;
  // For message links (…/channels/guild/channel/message) the last ID is usually the interesting one.
  return match[match.length - 1] ?? null;
}

export function isSnowflake(value: string): boolean {
  if (!SNOWFLAKE_RE.test(value)) return false;
  const n = BigInt(value);
  return n > 0n && n < 1n << 64n;
}

export function decodeSnowflake(value: string): SnowflakeParts {
  if (!isSnowflake(value)) throw new Error("invalid snowflake");
  const n = BigInt(value);
  const timestamp = Number((n >> 22n) + DISCORD_EPOCH);
  return {
    id: value,
    timestamp,
    date: new Date(timestamp),
    workerId: Number((n & 0x3e0000n) >> 17n),
    processId: Number((n & 0x1f000n) >> 12n),
    increment: Number(n & 0xfffn),
    binary: n.toString(2).padStart(64, "0"),
  };
}

/** Smallest snowflake for a moment in time – handy for API pagination (before/after). */
export function snowflakeFromDate(date: Date | number): string {
  const ms = BigInt(typeof date === "number" ? date : date.getTime());
  if (ms < DISCORD_EPOCH) throw new Error("date before Discord epoch");
  return ((ms - DISCORD_EPOCH) << 22n).toString();
}

/** Parses all Discord links and mentions in a string to typed IDs. */
export function parseDiscordReference(input: string):
  | { kind: "message"; guildId: string; channelId: string; messageId: string }
  | { kind: "channel"; guildId: string; channelId: string }
  | { kind: "user" | "role" | "channel-mention" | "emoji"; id: string; name?: string; animated?: boolean }
  | { kind: "id"; id: string }
  | null {
  const s = input.trim();
  let m = s.match(/discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)\/(\d+)/);
  if (m) return { kind: "message", guildId: m[1]!, channelId: m[2]!, messageId: m[3]! };
  m = s.match(/discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)/);
  if (m) return { kind: "channel", guildId: m[1]!, channelId: m[2]! };
  m = s.match(/^<@!?(\d+)>$/);
  if (m) return { kind: "user", id: m[1]! };
  m = s.match(/^<@&(\d+)>$/);
  if (m) return { kind: "role", id: m[1]! };
  m = s.match(/^<#(\d+)>$/);
  if (m) return { kind: "channel-mention", id: m[1]! };
  m = s.match(/^<(a?):(\w{2,32}):(\d+)>$/);
  if (m) return { kind: "emoji", id: m[3]!, name: m[2]!, animated: m[1] === "a" };
  const id = extractSnowflake(s);
  return id && isSnowflake(id) ? { kind: "id", id } : null;
}
