/**
 * Time zone math and a small German/English natural-language date parser for the timestamp tool.
 * Pure functions: every "now" and time zone is passed in, so tests are deterministic.
 */
import { decodeSnowflake, isSnowflake } from "./snowflake";
import { isValidMs, isValidUnix, MAX_DATE_MS, type TimestampStyle } from "./timestamp";

/** Instants this close to the JS date limit leave no room for the ±1 day zone math below. */
const SAFE_MS = MAX_DATE_MS - 2 * 864e5;

export interface Wall {
  y: number;
  mo: number; // 1–12
  d: number;
  h: number;
  mi: number;
  s: number;
}

export interface WallWithDay extends Wall {
  /** 0 = Sunday … 6 = Saturday */
  wd: number;
}

const DTF = new Map<string, Intl.DateTimeFormat>();
function dtf(tz: string): Intl.DateTimeFormat {
  let f = DTF.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    DTF.set(tz, f);
  }
  return f;
}

export function isValidTimeZone(tz: string): boolean {
  try {
    dtf(tz);
    return true;
  } catch {
    return false;
  }
}

/** Wall-clock reading of an instant in a time zone. */
export function wallClock(ms: number, tz: string): WallWithDay {
  const p: Record<string, number> = {};
  for (const part of dtf(tz).formatToParts(new Date(ms))) {
    if (part.type !== "literal") p[part.type] = Number(part.value);
  }
  const w = { y: p.year!, mo: p.month!, d: p.day!, h: p.hour! % 24, mi: p.minute!, s: p.second! };
  return { ...w, wd: new Date(Date.UTC(w.y, w.mo - 1, w.d)).getUTCDay() };
}

/** UTC offset of the zone at that instant, in minutes (Berlin summer = 120). */
export function tzOffsetMinutes(ms: number, tz: string): number {
  const w = wallClock(ms, tz);
  const asUtc = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

export function formatOffset(minutes: number): string {
  const sign = minutes < 0 ? "−" : "+";
  const a = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(a / 60)).padStart(2, "0")}:${String(a % 60).padStart(2, "0")}`;
}

export type ZonedResult =
  | { kind: "ok"; ms: number }
  /** The clock time does not exist (spring forward). `ms` is the time shifted forward by the gap. */
  | { kind: "gap"; ms: number }
  /** The clock time happens twice (fall back). `ms` is the first occurrence, `alt` the second. */
  | { kind: "ambiguous"; ms: number; alt: number };

function sameWall(a: Wall, b: Wall): boolean {
  return a.y === b.y && a.mo === b.mo && a.d === b.d && a.h === b.h && a.mi === b.mi && a.s === b.s;
}

/** Converts a wall-clock time in a zone to an instant, detecting DST gaps and overlaps. */
export function zonedToUtc(w: Wall, tz: string): ZonedResult {
  const guess = Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s);
  // Normalise overflow (e.g. day 32) the way Date.UTC does.
  const n = new Date(guess);
  const norm: Wall = { y: n.getUTCFullYear(), mo: n.getUTCMonth() + 1, d: n.getUTCDate(), h: n.getUTCHours(), mi: n.getUTCMinutes(), s: n.getUTCSeconds() };
  const offsets = new Set([tzOffsetMinutes(guess - 864e5, tz), tzOffsetMinutes(guess, tz), tzOffsetMinutes(guess + 864e5, tz)]);
  const hits: number[] = [];
  for (const o of offsets) {
    const t = guess - o * 60000;
    if (sameWall(wallClock(t, tz), norm) && !hits.includes(t)) hits.push(t);
  }
  hits.sort((a, b) => a - b);
  if (hits.length === 1) return { kind: "ok", ms: hits[0]! };
  if (hits.length >= 2) return { kind: "ambiguous", ms: hits[0]!, alt: hits[hits.length - 1]! };
  return { kind: "gap", ms: guess - tzOffsetMinutes(guess - 864e5, tz) * 60000 };
}

function addDays(w: Wall, days: number): Wall {
  const t = new Date(Date.UTC(w.y, w.mo - 1, w.d + days));
  return { ...w, y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() };
}

function addMonths(w: Wall, months: number): Wall {
  const total = w.y * 12 + (w.mo - 1) + months;
  const y = Math.floor(total / 12);
  const mo = (total % 12) + 1;
  const last = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return { ...w, y, mo, d: Math.min(w.d, last) };
}

function validDate(y: number, mo: number, d: number): boolean {
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= new Date(Date.UTC(y, mo, 0)).getUTCDate();
}

// ---------------------------------------------------------------- paste-to-decode

export type DecodedInput =
  | { source: "tag"; unix: number; style: TimestampStyle; explicitStyle: boolean }
  | { source: "seconds" | "milliseconds" | "snowflake" | "iso"; unix: number };

/** Recognises `<t:…>` markup, Unix seconds/milliseconds, a Discord snowflake or an ISO date. */
export function decodeTimestampInput(raw: string): DecodedInput | null {
  const s = raw.trim();
  if (!s) return null;
  const tag = s.match(/<t:(-?\d{1,13})(?::([tTdDfFRsS]))?>/);
  if (tag && !isValidUnix(Number(tag[1]))) return null;
  if (tag) return { source: "tag", unix: Number(tag[1]), style: (tag[2] as TimestampStyle | undefined) ?? "f", explicitStyle: !!tag[2] };
  const num = s.replace(/[\s_'’]/g, "");
  if (/^-?\d{1,11}$/.test(num)) return { source: "seconds", unix: Number(num) };
  if (/^-?\d{12,14}$/.test(num)) return { source: "milliseconds", unix: Math.floor(Number(num) / 1000) };
  if (/^\d{15,21}$/.test(num) && isSnowflake(num)) return { source: "snowflake", unix: Math.floor(decodeSnowflake(num).timestamp / 1000) };
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/i.test(s)) {
    const t = Date.parse(s);
    if (!isNaN(t)) return { source: "iso", unix: Math.floor(t / 1000) };
  }
  return null;
}

// ---------------------------------------------------------------- natural language

export interface ParseOptions {
  now: number;
  tz: string;
  /** Time used when the text names a day but no time (defaults to the current wall time). */
  defaultTime?: { h: number; mi: number };
}

export interface ParseResult {
  ms: number;
  kind: ZonedResult["kind"];
  alt?: number;
  /** true if the text contained a clock time or day part */
  hasTime: boolean;
}

const NUM_WORDS: Record<string, number> = {
  ein: 1, eine: 1, einer: 1, einem: 1, einen: 1, a: 1, an: 1, one: 1,
  zwei: 2, two: 2, drei: 3, three: 3, vier: 4, four: 4, fuenf: 5, five: 5, sechs: 6, six: 6,
  sieben: 7, seven: 7, acht: 8, eight: 8, neun: 9, nine: 9, zehn: 10, ten: 10, elf: 11, eleven: 11,
  zwoelf: 12, twelve: 12, fifteen: 15, fuenfzehn: 15, twenty: 20, zwanzig: 20, thirty: 30, dreissig: 30,
  anderthalb: 1.5, eineinhalb: 1.5,
};

type Unit = "s" | "m" | "h" | "d" | "w" | "mo" | "y";
const UNIT_RE =
  "(sekunden|sekunde|sek|seconds|second|secs|sec|s|minuten|minute|minutes|mins|min|m|stunden|stunde|std|hours|hour|hrs|hr|h|tagen|tage|tag|days|day|d|wochen|woche|weeks|week|wks|wk|w|monaten|monate|monat|months|month|jahren|jahre|jahr|years|year|yrs|y)";
function unitOf(u: string): Unit {
  if (/^(sek|sec|s$|second)/.test(u)) return "s";
  if (/^(min|m$)/.test(u)) return "m";
  if (/^(std|stunde|hour|hr|h$)/.test(u)) return "h";
  if (/^(tag|day|d$)/.test(u)) return "d";
  if (/^(woche|week|wk|w$)/.test(u)) return "w";
  if (/^(monat|month)/.test(u)) return "mo";
  return "y";
}
const AMOUNT = `(\\d+(?:[.,]\\d+)?|${Object.keys(NUM_WORDS).join("|")})`;
const REL_PART = `${AMOUNT}\\s*${UNIT_RE}\\b`;
const REL_CHAIN = `${REL_PART}(?:\\s*(?:,|und|and)?\\s*${REL_PART})*`;

const MONTHS: [RegExp, number][] = [
  [/^jan/, 1], [/^feb/, 2], [/^(maer|mar|mrz)/, 3], [/^apr/, 4], [/^(mai|may)/, 5], [/^jun/, 6],
  [/^jul/, 7], [/^aug/, 8], [/^sep/, 9], [/^(okt|oct)/, 10], [/^nov/, 11], [/^(dez|dec)/, 12],
];
const MONTH_RE =
  "(januar|january|jan|februar|february|feb|maerz|march|mrz|mar|april|apr|mai|may|juni|june|jun|juli|july|jul|august|aug|september|sept|sep|oktober|october|okt|oct|november|nov|dezember|december|dez|dec)";
function monthOf(name: string): number {
  return MONTHS.find(([re]) => re.test(name))![1];
}

const WEEKDAYS: [RegExp, number][] = [
  [/^(sonntag|sunday|sun|so)$/, 0],
  [/^(montag|monday|mon|mo)$/, 1],
  [/^(dienstag|tuesday|tues|tue|di)$/, 2],
  [/^(mittwoch|wednesday|wed|mi)$/, 3],
  [/^(donnerstag|thursday|thurs|thur|thu|do)$/, 4],
  [/^(freitag|friday|fri|fr)$/, 5],
  [/^(samstag|sonnabend|saturday|sat|sa)$/, 6],
];
const WEEKDAY_RE =
  "(sonntag|sonnabend|sunday|montag|monday|dienstag|tuesday|mittwoch|wednesday|donnerstag|thursday|freitag|friday|samstag|saturday|sun|mon|tues|tue|wed|thurs|thur|thu|fri|sat|so|mo|di|mi|do|fr|sa)";

const DAYPARTS: [RegExp, number][] = [
  [/^(frueh|morgens|morning|in the morning)$/, 8],
  [/^(vormittag|vormittags)$/, 10],
  [/^(mittag|mittags|noon|midday)$/, 12],
  [/^(nachmittag|nachmittags|afternoon|in the afternoon)$/, 15],
  [/^(abend|abends|evening|in the evening|tonight)$/, 20],
  [/^(nacht|nachts|night|at night)$/, 22],
  [/^(mitternacht|midnight)$/, 24],
];

function normalise(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/(\d)t(\d)/g, "$1 $2")
    .replace(/[!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const FILLER = new Set([
  "um", "am", "at", "on", "the", "den", "der", "dem", "des", "ab", "gegen", "around", "by", "uhr", "and", "und", "of", "o'clock",
  "this", "diesen", "dieser", "diese", "dieses", "kommenden", "kommender", "kommende", "next", "naechsten", "naechster", "naechste",
  "naechstes", "coming", "zum", "zur", "for", "fuer", "time", "zeit", "es", "is", "ist",
]);

/**
 * Parses phrases like "morgen 18 uhr", "in 2 stunden", "next friday 8pm", "31.10. 20:00",
 * "nächsten Samstag", "halb 9", "tomorrow evening". Returns null if any word is not understood.
 */
export function parseNaturalDate(input: string, opts: ParseOptions): ParseResult | null {
  let r: ParseResult | null;
  try {
    r = parseNaturalDateUnsafe(input, opts);
  } catch (e) {
    // Huge offsets ("in 999999999 days") leave the Date range inside the zone math.
    if (e instanceof RangeError) return null;
    throw e;
  }
  if (!r || Math.abs(r.ms) > SAFE_MS || (r.alt !== undefined && !isValidMs(r.alt))) return null;
  return r;
}

function parseNaturalDateUnsafe(input: string, opts: ParseOptions): ParseResult | null {
  let s = " " + normalise(input) + " ";
  if (!s.trim()) return null;
  const { now, tz } = opts;
  const nowWall = wallClock(now, tz);
  const take = (re: RegExp): RegExpMatchArray | null => {
    const m = s.match(re);
    if (m) s = s.slice(0, m.index!) + " " + s.slice(m.index! + m[0].length);
    return m;
  };

  if (/^\s*(jetzt|now|sofort|right now|gerade|grad)\s*$/.test(s)) return { ms: Math.floor(now / 1000) * 1000, kind: "ok", hasTime: true };

  // --- relative offsets: "in 2 stunden", "2 hours from now", "vor 3 tagen", "3 days ago", "+90m"
  const rel: Record<Unit, number> = { s: 0, m: 0, h: 0, d: 0, w: 0, mo: 0, y: 0 };
  let hasRel = false;
  s = s
    .replace(/\b(?:in )?(?:einer |eine |einem |a )?halben? (stunde|minute)\b/g, "in 0.5 $1")
    .replace(/\bhalf an? (hour|minute)\b/g, "0.5 $1")
    .replace(/\ban? hour and a half\b/g, "1.5 hours");
  const relRes = [
    { re: new RegExp(`(?:^|\\s)(?:in|\\+)\\s*(${REL_CHAIN})(?=\\s)`), sign: 1 },
    { re: new RegExp(`(?:^|\\s)(${REL_CHAIN})\\s+(?:from now|ab jetzt|later|spaeter)(?=\\s)`), sign: 1 },
    { re: new RegExp(`(?:^|\\s)vor\\s+(${REL_CHAIN})(?=\\s)`), sign: -1 },
    { re: new RegExp(`(?:^|\\s)(${REL_CHAIN})\\s+ago(?=\\s)`), sign: -1 },
    { re: new RegExp(`(?:^|\\s)-\\s*(${REL_CHAIN})(?=\\s)`), sign: -1 },
  ];
  for (const { re, sign } of relRes) {
    const m = take(re);
    if (!m) continue;
    hasRel = true;
    for (const part of m[1]!.matchAll(new RegExp(REL_PART, "g"))) {
      const raw = part[1]!;
      const amount = NUM_WORDS[raw] ?? Number(raw.replace(",", "."));
      rel[unitOf(part[2]!)] += sign * amount;
    }
    break;
  }

  // --- explicit dates
  let date: { y?: number; mo: number; d: number } | null = null;
  let m: RegExpMatchArray | null;
  if ((m = take(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/))) date = { y: +m[1]!, mo: +m[2]!, d: +m[3]! };
  else if ((m = take(/\b(\d{1,2})\.(\d{1,2})\.(\d{4}|\d{2})?(?!\d)(?!\s*uhr)/))) date = { d: +m[1]!, mo: +m[2]!, y: m[3] ? fullYear(+m[3]) : undefined };
  else if ((m = take(/\b(\d{1,2})\.(\d{1,2})\b(?!\s*uhr)(?!\.)/)) && +m[1]! > 0) date = { d: +m[1]!, mo: +m[2]! };
  else if ((m = take(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?\b/))) {
    const a = +m[1]!, b = +m[2]!;
    date = a > 12 ? { d: a, mo: b } : { mo: a, d: b };
    if (m[3]) date.y = fullYear(+m[3]);
  } else if ((m = take(new RegExp(`\\b(\\d{1,2})(?:\\.|st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\.?(?:,?\\s+(\\d{4}))?(?=\\s)`)))) {
    date = { d: +m[1]!, mo: monthOf(m[2]!), y: m[3] ? +m[3] : undefined };
  } else if ((m = take(new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th|\\.)?(?:,?\\s+(\\d{4}))?(?=\\s)`)))) {
    date = { mo: monthOf(m[1]!), d: +m[2]!, y: m[3] ? +m[3] : undefined };
  }

  // --- day words (order matters: "heute morgen" = this morning, "morgen früh" = tomorrow morning)
  let dayOffset: number | null = null;
  let daypart: number | null = null;
  if (take(/\bheute (?:morgen|frueh)\b/)) { dayOffset = 0; daypart = 8; }
  else if (take(/\bmorgen (?:frueh|morgen)\b/)) { dayOffset = 1; daypart = 8; }
  else if (take(/\bvorgestern\b/)) dayOffset = -2;
  else if (take(/\b(?:uebermorgen|day after tomorrow)\b/)) dayOffset = 2;
  else if (take(/\b(?:morgen|tomorrow|tmrw|tmr)\b/)) dayOffset = 1;
  else if (take(/\b(?:heute|today)\b/)) dayOffset = 0;
  else if (take(/\b(?:gestern|yesterday)\b/)) dayOffset = -1;
  else if (take(/\btonight\b/)) { dayOffset = 0; daypart = 20; }
  if (take(/\b(?:naechste|kommende|next) woche\b/)) dayOffset = (dayOffset ?? 0) + 7;

  // --- weekday
  let weekday: { wd: number; strict: boolean } | null = null;
  m = take(new RegExp(`(?:\\b(next|naechsten|naechster|naechste|naechstes|kommenden|kommender|kommende|coming|this|diesen|dieser|diese)\\s+)?\\b${WEEKDAY_RE}\\b\\.?`));
  if (m) {
    const wd = WEEKDAYS.find(([re]) => re.test(m![2]!))![1];
    weekday = { wd, strict: !!m[1] && !/^(this|diese)/.test(m[1]) };
  }

  // --- day parts
  m = take(/\b(in the morning|in the afternoon|in the evening|at night|frueh|morgens|morning|vormittags?|mittags?|noon|midday|nachmittags?|afternoon|abends?|evening|nachts?|night|mitternacht|midnight)\b/);
  if (m) daypart = DAYPARTS.find(([re]) => re.test(m![1]!))![1];

  // --- clock time
  let time: { h: number; mi: number; s: number } | null = null;
  const ampm = (h: number, mer?: string) => {
    if (!mer) return h;
    const pm = mer.startsWith("p");
    if (h === 12) return pm ? 12 : 0;
    return pm ? h + 12 : h;
  };
  if ((m = take(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?(?:\s*uhr)?(?=\s|$)/))) time = { h: ampm(+m[1]!, m[4]), mi: +m[2]!, s: m[3] ? +m[3] : 0 };
  else if ((m = take(/\b(\d{1,2})\.(\d{2})\s*uhr\b/))) time = { h: +m[1]!, mi: +m[2]!, s: 0 };
  else if ((m = take(/\b(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)(?=\s|$)/))) time = { h: ampm(+m[1]!, m[2]), mi: 0, s: 0 };
  else if ((m = take(/\b(\d{1,2})\s*uhr(?:\s+(\d{1,2}))?\b/))) time = { h: +m[1]!, mi: m[2] ? +m[2] : 0, s: 0 };
  else if ((m = take(/\bhalb\s+(\d{1,2})\b/))) time = { h: (+m[1]! + 23) % 24, mi: 30, s: 0 };
  else if ((m = take(/\bviertel nach\s+(\d{1,2})\b/))) time = { h: +m[1]! % 24, mi: 15, s: 0 };
  else if ((m = take(/\bviertel vor\s+(\d{1,2})\b/))) time = { h: (+m[1]! + 23) % 24, mi: 45, s: 0 };
  else if ((m = take(/\b(\d{1,2})h(\d{2})?\b/))) time = { h: +m[1]!, mi: m[2] ? +m[2] : 0, s: 0 };
  else if ((m = take(/(?:\b(?:um|at|gegen|ab)|@)\s*(\d{1,2})(?=\s|$)/))) time = { h: +m[1]!, mi: 0, s: 0 };
  else if (daypart !== null && (m = take(/\b(\d{1,2})\b/))) time = { h: +m[1]!, mi: 0, s: 0 };

  // Leftover words must all be filler, otherwise we did not understand the phrase.
  const rest = s.replace(/[.,@\-–]/g, " ").split(" ").filter(Boolean);
  if (rest.some((w) => !FILLER.has(w))) return null;
  if (!hasRel && !date && dayOffset === null && !weekday && daypart === null && !time) return null;

  if (time && daypart !== null && time.h < 12) {
    if (daypart >= 15 && daypart < 24 && !(daypart === 22 && time.h < 5)) time.h += 12;
  }
  if (time && (time.h > 23 || time.mi > 59 || time.s > 59)) return null;

  // Only an offset like "in 2 hours": plain arithmetic on the instant.
  const calendarRel = rel.d || rel.w || rel.mo || rel.y;
  const msRel = (rel.h * 3600 + rel.m * 60 + rel.s) * 1000;
  if (hasRel && !calendarRel && !date && dayOffset === null && !weekday && daypart === null && !time) {
    return { ms: Math.round((now + msRel) / 1000) * 1000, kind: "ok", hasTime: true };
  }

  let base: Wall = { ...nowWall };
  delete (base as Partial<WallWithDay>).wd;
  const explicitDay = !!date || dayOffset !== null || !!weekday || !!calendarRel;
  if (date) {
    let y = date.y ?? nowWall.y;
    if (!validDate(y, date.mo, date.d)) return null;
    if (date.y === undefined) {
      const today = Date.UTC(nowWall.y, nowWall.mo - 1, nowWall.d);
      if (Date.UTC(y, date.mo - 1, date.d) < today) y += 1;
      if (!validDate(y, date.mo, date.d)) return null;
    }
    base = { ...base, y, mo: date.mo, d: date.d };
  }
  if (dayOffset !== null) base = addDays(base, dayOffset);
  if (weekday) {
    let diff = (weekday.wd - nowWall.wd + 7) % 7;
    if (weekday.strict && diff === 0) diff = 7;
    base = addDays(base, diff);
  }
  if (calendarRel) {
    base = addMonths(base, rel.mo + rel.y * 12);
    base = addDays(base, rel.d + rel.w * 7);
  }

  const hasTime = !!time || daypart !== null;
  if (time) base = { ...base, ...time };
  else if (daypart !== null) {
    if (daypart === 24) base = { ...addDays(base, 1), h: 0, mi: 0, s: 0 };
    else base = { ...base, h: daypart, mi: 0, s: 0 };
  } else if (explicitDay && !hasRel) {
    const t = opts.defaultTime ?? { h: nowWall.h, mi: nowWall.mi };
    base = { ...base, h: t.h, mi: t.mi, s: 0 };
  } else if (!hasRel) {
    base = { ...base, s: 0 };
  }

  let res = zonedToUtc(base, tz);
  // A bare time ("20 uhr") or weekday that already passed today means the next one.
  if (!date && dayOffset === null && !calendarRel && res.ms + msRel <= now) {
    if (weekday) base = addDays(base, 7);
    else if (hasTime) base = addDays(base, 1);
    if (weekday || hasTime) res = zonedToUtc(base, tz);
  }
  return {
    ms: res.ms + msRel,
    kind: res.kind,
    alt: res.kind === "ambiguous" ? res.alt + msRel : undefined,
    hasTime: hasTime || hasRel,
  };
}

function fullYear(y: number): number {
  return y < 100 ? 2000 + y : y;
}

/** `YYYY-MM-DD` and `HH:MM[:SS]` strings for native date/time inputs. */
export function wallToInputs(w: Wall): { date: string; time: string } {
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return { date: `${p(w.y, 4)}-${p(w.mo)}-${p(w.d)}`, time: `${p(w.h)}:${p(w.mi)}${w.s ? ":" + p(w.s) : ""}` };
}

export function inputsToWall(date: string, time: string): Wall | null {
  const d = date.match(/^(\d{4,6})-(\d{2})-(\d{2})$/);
  const t = time.match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!d || !t) return null;
  const w = { y: +d[1]!, mo: +d[2]!, d: +d[3]!, h: +t[1]!, mi: +t[2]!, s: t[3] ? +t[3] : 0 };
  if (Math.abs(Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s)) > SAFE_MS) return null;
  return validDate(w.y, w.mo, w.d) && w.h < 24 && w.mi < 60 && w.s < 60 ? w : null;
}
