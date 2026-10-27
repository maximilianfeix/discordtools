export type TimestampStyle = "t" | "T" | "d" | "D" | "f" | "F" | "s" | "S" | "R";

export const TIMESTAMP_STYLES: TimestampStyle[] = ["R", "t", "T", "d", "D", "s", "S", "f", "F"];

/** Largest |ms| a JS Date can hold (±100,000,000 days around 1970). */
export const MAX_DATE_MS = 8.64e15;

/** True if `ms` is a representable JS Date instant. */
export function isValidMs(ms: number): boolean {
  return Number.isFinite(ms) && Math.abs(ms) <= MAX_DATE_MS;
}

/** True if Unix seconds can be shown as a date (Discord's client has the same limit as JS). */
export function isValidUnix(unix: number): boolean {
  return isValidMs(unix * 1000);
}

export function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function timestampTag(unix: number, style?: TimestampStyle): string {
  return style && style !== "f" ? `<t:${unix}:${style}>` : `<t:${unix}${style === "f" ? ":f" : ""}>`;
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

export function formatRelative(unix: number, locale: string, now = Date.now()): string {
  const diff = unix - Math.floor(now / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  for (const [unit, secs] of RELATIVE_UNITS) {
    if (abs >= secs || unit === "second") return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(diff, "second");
}

/** Renders a timestamp the way the Discord client shows it for the viewer's locale and time zone. */
export function formatTimestamp(unix: number, style: TimestampStyle, locale: string, timeZone?: string, now = Date.now()): string {
  if (!isValidUnix(unix)) return "Invalid Date";
  const date = new Date(unix * 1000);
  const base: Intl.DateTimeFormatOptions = timeZone ? { timeZone } : {};
  const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...base, ...o }).format(date);
  const time = (seconds: boolean) => fmt({ timeStyle: seconds ? "medium" : "short" });
  const shortDate = () => fmt({ day: "2-digit", month: "2-digit", year: "numeric" });
  switch (style) {
    case "t":
      return time(false);
    case "T":
      return time(true);
    case "d":
      return shortDate();
    case "D":
      return fmt({ dateStyle: "long" });
    case "f":
      return fmt({ dateStyle: "long", timeStyle: "short" });
    case "F":
      return fmt({ dateStyle: "full", timeStyle: "short" });
    case "s":
      return `${shortDate()}, ${time(false)}`;
    case "S":
      return `${shortDate()}, ${time(true)}`;
    case "R":
      return formatRelative(unix, locale, now);
  }
}

/** Finds every <t:…> tag in a message so the decoder can explain it. */
export function parseTimestampTags(text: string): { tag: string; unix: number; style: TimestampStyle }[] {
  const out: { tag: string; unix: number; style: TimestampStyle }[] = [];
  for (const m of text.matchAll(/<t:(-?\d{1,13})(?::([tTdDfFRsS]))?>/g)) {
    if (!isValidUnix(Number(m[1]))) continue;
    out.push({ tag: m[0], unix: Number(m[1]), style: (m[2] as TimestampStyle | undefined) ?? "f" });
  }
  return out;
}
