/**
 * Input handling for the snowflake decoder: many IDs at once, message links, mentions,
 * rounded spreadsheet numbers, comparisons and human durations. Decoding itself lives in ./snowflake.
 */
import { DISCORD_EPOCH, decodeSnowflake, isSnowflake, type SnowflakeParts } from "./snowflake";

export type IdKind = "id" | "user" | "role" | "channel" | "guild" | "message" | "emoji" | "command" | "dm";

export interface ParsedId {
  /** the raw piece of input this came from (for display) */
  source: string;
  kind: IdKind;
  id: string;
  name?: string;
  parts: SnowflakeParts;
  warnings: IdWarning[];
}

export type IdWarning = "future" | "trailing-zeros" | "very-old" | "small";

export interface ParseProblem {
  source: string;
  problem: "scientific" | "invalid" | "too-short" | "too-large" | "invite" | "token";
  /** for "scientific": the approximate value Excel/JS turned the ID into */
  approx?: string;
}

export interface ParsedInput {
  /** groups – one per line; a message link yields three IDs in one group */
  groups: { source: string; ids: ParsedId[]; link?: "message" | "channel" }[];
  problems: ParseProblem[];
}

const MAX_SNOWFLAKE = (1n << 64n) - 1n;

function idWarnings(id: string, parts: SnowflakeParts, now: number): IdWarning[] {
  const w: IdWarning[] = [];
  if (parts.timestamp > now + 60_000) w.push("future");
  // Spreadsheets keep 15 significant digits; the rest becomes zeros. Real IDs rarely end in 000.
  if (/000$/.test(id) && id.length >= 17) w.push("trailing-zeros");
  // Discord launched in May 2015; IDs from the first months are mostly Discord's own test objects.
  if (parts.timestamp < Date.UTC(2015, 2, 1)) w.push("very-old");
  if (id.length < 17) w.push("small");
  return w;
}

function make(source: string, kind: IdKind, id: string, now: number, name?: string): ParsedId | null {
  if (!isSnowflake(id)) return null;
  const parts = decodeSnowflake(id);
  return { source, kind, id, name, parts, warnings: idWarnings(id, parts, now) };
}

/** Splits a free-form paste into candidate pieces: lines, then whitespace/commas/semicolons. */
function pieces(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    // keep numbers like "1,17593E+17" (German Excel) in one piece
    for (const p of t.split(/[\s;]+|,(?!\d{3}(?:\D|$))(?!\d{1,5}E)/i)) if (p.trim()) out.push(p.trim());
  }
  return out;
}

export function parseSnowflakeInput(text: string, now = Date.now()): ParsedInput {
  const groups: ParsedInput["groups"] = [];
  const problems: ParseProblem[] = [];
  const seen = new Set<string>();

  for (const raw of pieces(text)) {
    const s = raw.replace(/^[(\["']+/, "").replace(/[)\]"',.]+$/, "");

    if (/^[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}$/.test(s)) {
      problems.push({ source: raw, problem: "token" });
      continue;
    }

    let m = s.match(/discord(?:app)?\.com\/channels\/(\d+|@me)\/(\d+)(?:\/(\d+))?/i);
    if (m) {
      const ids: ParsedId[] = [];
      if (m[1] !== "@me") {
        const g = make(raw, "guild", m[1]!, now);
        if (g) ids.push(g);
      }
      const c = make(raw, m[1] === "@me" ? "dm" : "channel", m[2]!, now);
      if (c) ids.push(c);
      if (m[3]) {
        const msg = make(raw, "message", m[3], now);
        if (msg) ids.push(msg);
      }
      if (ids.length) groups.push({ source: raw, ids, link: m[3] ? "message" : "channel" });
      else problems.push({ source: raw, problem: "invalid" });
      continue;
    }

    if (/(?:discord\.gg|discord(?:app)?\.com\/invite)\//i.test(s)) {
      problems.push({ source: raw, problem: "invite" });
      continue;
    }

    const mention: [RegExp, IdKind][] = [
      [/^<@!?(\d+)>$/, "user"],
      [/^<@&(\d+)>$/, "role"],
      [/^<#(\d+)>$/, "channel"],
    ];
    let matched = false;
    for (const [re, kind] of mention) {
      const mm = s.match(re);
      if (mm) {
        const p = make(raw, kind, mm[1]!, now);
        if (p) groups.push({ source: raw, ids: [p] });
        else problems.push({ source: raw, problem: "invalid" });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    m = s.match(/^<a?:(\w{2,32}):(\d+)>$/);
    if (m) {
      const p = make(raw, "emoji", m[2]!, now, m[1]);
      if (p) groups.push({ source: raw, ids: [p] });
      continue;
    }
    m = s.match(/^<\/([^:>]+):(\d+)>$/);
    if (m) {
      const p = make(raw, "command", m[2]!, now, m[1]);
      if (p) groups.push({ source: raw, ids: [p] });
      continue;
    }
    m = s.match(/cdn\.discordapp\.com\/emojis\/(\d+)/i) ?? s.match(/media\.discordapp\.net\/emojis\/(\d+)/i);
    if (m) {
      const p = make(raw, "emoji", m[1]!, now);
      if (p) groups.push({ source: raw, ids: [p] });
      continue;
    }

    // 1.23457E+17 / 1,17593E+17 – a rounded number from Excel, Sheets or JavaScript
    const sci = s.match(/^(\d)[.,](\d+)e\+?(\d{2})$/i);
    if (sci) {
      const digits = sci[1]! + sci[2]!;
      const exp = Number(sci[3]);
      const approx = exp + 1 >= digits.length ? digits + "0".repeat(exp + 1 - digits.length) : undefined;
      problems.push({ source: raw, problem: "scientific", approx });
      continue;
    }

    // "1.234.567.890.123.456.789" or "1,234,567,…" (thousands separators from a spreadsheet)
    const grouped = /^\d{1,3}(?:[.,' ]\d{3}){4,}$/.test(s) ? s.replace(/[.,' ]/g, "") : null;
    const digits = grouped ?? (s.match(/\d{15,}/)?.[0] ?? (/^\d+$/.test(s) ? s : null));
    if (!digits) {
      problems.push({ source: raw, problem: "invalid" });
      continue;
    }
    if (digits.length < 15) {
      problems.push({ source: raw, problem: "too-short" });
      continue;
    }
    if (digits.length > 20 || BigInt(digits) > MAX_SNOWFLAKE) {
      problems.push({ source: raw, problem: "too-large" });
      continue;
    }
    const p = make(raw, "id", digits, now);
    if (!p) {
      problems.push({ source: raw, problem: "invalid" });
      continue;
    }
    if (grouped) p.warnings.push("trailing-zeros");
    const key = `${p.kind}:${p.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    groups.push({ source: raw, ids: [p] });
  }
  return { groups, problems };
}

/** Lowest and highest snowflake for one millisecond. Use `min` for `after`, `max` for `before`. */
export function snowflakeRange(ms: number): { min: string; max: string } {
  const t = BigInt(Math.floor(ms));
  if (t < DISCORD_EPOCH) throw new Error("before Discord epoch");
  const min = (t - DISCORD_EPOCH) << 22n;
  return { min: min.toString(), max: (min | 0x3fffffn).toString() };
}

export interface Comparison {
  older: "a" | "b" | "same";
  diffMs: number;
}

export function compareSnowflakes(a: string, b: string): Comparison {
  const A = BigInt(a);
  const B = BigInt(b);
  const ta = Number(A >> 22n);
  const tb = Number(B >> 22n);
  return { older: A === B ? "same" : A < B ? "a" : "b", diffMs: Math.abs(ta - tb) };
}

export interface CalendarDiff {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Calendar difference (UTC) between two instants, from < to. */
export function calendarDiff(fromMs: number, toMs: number): CalendarDiff {
  const a = new Date(Math.min(fromMs, toMs));
  const b = new Date(Math.max(fromMs, toMs));
  let years = b.getUTCFullYear() - a.getUTCFullYear();
  let months = b.getUTCMonth() - a.getUTCMonth();
  if (months < 0) {
    years--;
    months += 12;
  }
  const shifted = (y: number, mo: number) => {
    const d = new Date(a.getTime());
    d.setUTCFullYear(a.getUTCFullYear() + y, a.getUTCMonth() + mo, Math.min(a.getUTCDate(), daysIn(a.getUTCFullYear() + y, a.getUTCMonth() + mo)));
    return d;
  };
  let anchor = shifted(years, months);
  if (anchor.getTime() > b.getTime()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
    anchor = shifted(years, months);
  }
  let rest = b.getTime() - anchor.getTime();
  const days = Math.floor(rest / 86_400_000);
  rest -= days * 86_400_000;
  const hours = Math.floor(rest / 3_600_000);
  rest -= hours * 3_600_000;
  const minutes = Math.floor(rest / 60_000);
  rest -= minutes * 60_000;
  return { years, months, days, hours, minutes, seconds: Math.floor(rest / 1000) };
}

function daysIn(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

const UNITS = {
  de: {
    years: ["Jahr", "Jahre"],
    months: ["Monat", "Monate"],
    days: ["Tag", "Tage"],
    hours: ["Stunde", "Stunden"],
    minutes: ["Minute", "Minuten"],
    seconds: ["Sekunde", "Sekunden"],
  },
  en: {
    years: ["year", "years"],
    months: ["month", "months"],
    days: ["day", "days"],
    hours: ["hour", "hours"],
    minutes: ["minute", "minutes"],
    seconds: ["second", "seconds"],
  },
} as const;

/** "3 Jahre, 2 Monate, 5 Tage" – the largest `max` non-zero units. */
export function formatDiff(d: CalendarDiff, lang: "de" | "en", max = 3): string {
  const order = ["years", "months", "days", "hours", "minutes", "seconds"] as const;
  const parts: string[] = [];
  for (const k of order) {
    const v = d[k];
    if (v === 0 && !(parts.length === 0 && k === "seconds")) continue;
    parts.push(`${v.toLocaleString(lang)} ${UNITS[lang][k][v === 1 ? 0 : 1]}`);
    if (parts.length >= max) break;
  }
  return parts.join(", ");
}
