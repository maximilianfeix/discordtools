/**
 * Pure logic for the embed builder: draft model, payload cleaning, validation, JSON import,
 * share-hash encoding, webhook/message-link parsing, Discord error flattening and templates.
 * Nothing in here touches the DOM, so all of it is unit-tested.
 */
import { LIMITS, type Embed, type EmbedField } from "./discord-types";
import type { Lang } from "../i18n/ui";

export const FLAG_SUPPRESS_EMBEDS = 1 << 2;
export const FLAG_SUPPRESS_NOTIFICATIONS = 1 << 12;
export const FLAG_COMPONENTS_V2 = 1 << 15;
export const THREAD_NAME_MAX = 100;
/** Share links longer than this get a warning (some chat apps and browsers cut long URLs). */
export const SHARE_WARN_CHARS = 8000;

type Rec = Record<string, unknown>;

export interface DraftField {
  id: string;
  name: string;
  value: string;
  inline: boolean;
  extra: Rec;
}

export interface DraftEmbed {
  id: string;
  color: number | null;
  authorName: string;
  authorUrl: string;
  authorIcon: string;
  title: string;
  url: string;
  description: string;
  fields: DraftField[];
  thumbnail: string;
  image: string;
  footerText: string;
  footerIcon: string;
  /** ISO 8601 or "" */
  timestamp: string;
  /** Unknown keys on the embed itself, kept verbatim */
  extra: Rec;
  /** Unknown keys inside author/footer/image/thumbnail */
  nested: { author?: Rec; footer?: Rec; image?: Rec; thumbnail?: Rec };
}

export interface Draft {
  content: string;
  username: string;
  avatarUrl: string;
  embeds: DraftEmbed[];
  threadName: string;
  suppressEmbeds: boolean;
  suppressNotifications: boolean;
  /** false → `{ parse: [] }` (nobody gets pinged) */
  allowMentions: boolean;
  /** Imported allowed_mentions that is neither "none" nor "all" – sent verbatim while allowMentions is on */
  mentionsCustom: Rec | null;
  /** Flag bits we don't edit (e.g. IS_COMPONENTS_V2) */
  otherFlags: number;
  /** Unknown / not-editable top-level keys (tts, components, poll …), kept verbatim */
  extra: Rec;
}

let seq = 0;
export function uid(): string {
  seq += 1;
  return `k${seq.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function emptyField(): DraftField {
  return { id: uid(), name: "", value: "", inline: false, extra: {} };
}

export function emptyEmbed(): DraftEmbed {
  return {
    id: uid(), color: null, authorName: "", authorUrl: "", authorIcon: "", title: "", url: "", description: "",
    fields: [], thumbnail: "", image: "", footerText: "", footerIcon: "", timestamp: "", extra: {}, nested: {},
  };
}

export function emptyDraft(): Draft {
  return {
    content: "", username: "", avatarUrl: "", embeds: [], threadName: "", suppressEmbeds: false,
    suppressNotifications: false, allowMentions: false, mentionsCustom: null, otherFlags: 0, extra: {},
  };
}

export function cloneEmbed(e: DraftEmbed): DraftEmbed {
  const copy: DraftEmbed = JSON.parse(JSON.stringify(e));
  copy.id = uid();
  copy.fields = copy.fields.map((f) => ({ ...f, id: uid() }));
  return copy;
}

/** Characters as Discord counts them: Unicode code points after trimming. */
export function countChars(s: string | undefined | null): number {
  if (!s) return 0;
  let n = 0;
  for (const _ of s.trim()) n++;
  return n;
}

export function embedChars(e: DraftEmbed): number {
  return (
    countChars(e.title) + countChars(e.description) + countChars(e.footerText) + countChars(e.authorName) +
    e.fields.reduce((n, f) => n + countChars(f.name) + countChars(f.value), 0)
  );
}

export function totalEmbedChars(d: Draft): number {
  return d.embeds.reduce((n, e) => n + embedChars(e), 0);
}

const has = (s: string) => s.trim().length > 0;

export function isFieldEmpty(f: DraftField): boolean {
  return !has(f.name) && !has(f.value);
}

export function isEmbedEmpty(e: DraftEmbed): boolean {
  return !(
    has(e.title) || has(e.description) || has(e.authorName) || has(e.footerText) || has(e.image) ||
    has(e.thumbnail) || has(e.timestamp) || e.fields.some((f) => !isFieldEmpty(f)) || Object.keys(e.extra).length > 0
  );
}

/* ------------------------------------------------------------------ payload */

function withExtra(base: Rec, extra?: Rec): Rec {
  return extra && Object.keys(extra).length ? { ...base, ...extra } : base;
}

/** One draft embed → clean Discord JSON (empty strings and empty objects dropped). null if nothing is left. */
export function embedToJson(e: DraftEmbed): (Embed & Rec) | null {
  if (isEmbedEmpty(e)) return null;
  const out: Rec = {};
  if (has(e.authorName)) {
    const a: Rec = { name: e.authorName };
    if (has(e.authorUrl)) a.url = e.authorUrl.trim();
    if (has(e.authorIcon)) a.icon_url = e.authorIcon.trim();
    out.author = withExtra(a, e.nested.author);
  }
  if (has(e.title)) out.title = e.title;
  if (has(e.url)) out.url = e.url.trim();
  if (has(e.description)) out.description = e.description;
  if (e.color !== null) out.color = e.color;
  const fields = e.fields.filter((f) => !isFieldEmpty(f));
  if (fields.length) {
    out.fields = fields.map((f) => {
      const o: Rec = { name: f.name, value: f.value };
      if (f.inline) o.inline = true;
      return withExtra(o, f.extra);
    });
  }
  if (has(e.thumbnail)) out.thumbnail = withExtra({ url: e.thumbnail.trim() }, e.nested.thumbnail);
  if (has(e.image)) out.image = withExtra({ url: e.image.trim() }, e.nested.image);
  if (has(e.footerText)) {
    const f: Rec = { text: e.footerText };
    if (has(e.footerIcon)) f.icon_url = e.footerIcon.trim();
    out.footer = withExtra(f, e.nested.footer);
  }
  if (has(e.timestamp)) out.timestamp = e.timestamp.trim();
  return withExtra(out, e.extra) as Embed & Rec;
}

export function flagsOf(d: Draft): number {
  return (d.otherFlags | (d.suppressEmbeds ? FLAG_SUPPRESS_EMBEDS : 0) | (d.suppressNotifications ? FLAG_SUPPRESS_NOTIFICATIONS : 0)) >>> 0;
}

export function allowedMentionsOf(d: Draft): Rec {
  if (!d.allowMentions) return { parse: [] };
  return d.mentionsCustom ?? { parse: ["users", "roles", "everyone"] };
}

/**
 * The request body for "execute webhook" (POST). Empty values are dropped, unknown keys are kept.
 * `forShare` leaves out allowed_mentions so the link stays short (the default is restored on load).
 */
export function draftToPayload(d: Draft): Rec {
  const out: Rec = {};
  if (has(d.content)) out.content = d.content;
  if (has(d.username)) out.username = d.username.trim();
  if (has(d.avatarUrl)) out.avatar_url = d.avatarUrl.trim();
  const embeds = d.embeds.map(embedToJson).filter((e): e is Embed & Rec => e !== null);
  if (embeds.length) out.embeds = embeds;
  out.allowed_mentions = allowedMentionsOf(d);
  const flags = flagsOf(d);
  if (flags) out.flags = flags;
  if (has(d.threadName)) out.thread_name = d.threadName.trim();
  return withExtra(out, d.extra);
}

/** PATCH body for editing a sent message. Content/embeds are always sent so that removing them clears them. */
export function draftToEditPayload(d: Draft): Rec {
  const p = draftToPayload(d);
  const out: Rec = {
    content: (p.content as string | undefined) ?? "",
    embeds: (p.embeds as unknown[] | undefined) ?? [],
    allowed_mentions: p.allowed_mentions,
    // Only SUPPRESS_EMBEDS can be toggled on edit; V2 can only be kept.
    flags: (d.suppressEmbeds ? FLAG_SUPPRESS_EMBEDS : 0) | (d.otherFlags & FLAG_COMPONENTS_V2),
  };
  for (const k of ["components", "attachments", "poll"]) if (k in d.extra) out[k] = d.extra[k];
  return out;
}

/** Fields that are not part of the editable message and therefore not shown in the share link. */
export function payloadForShare(d: Draft): Rec {
  const p = draftToPayload(d);
  if (!d.allowMentions) delete p.allowed_mentions;
  return p;
}

/* --------------------------------------------------------------- validation */

export type IssueCode =
  | "tooLong" | "required" | "badUrl" | "attachmentUrl" | "tooManyEmbeds" | "tooManyFields" | "total" | "emptyEmbed"
  | "emptyField" | "emptyMessage" | "authorNeedsName" | "footerIconNeedsText" | "badTimestamp" | "usernameForbidden"
  | "token" | "webhookInText" | "componentsV2" | "componentsV2Content";

export interface Issue {
  level: "error" | "warn";
  /** Draft path: content, username, avatarUrl, threadName, embeds, embeds.0.title, embeds.0.fields.2.value … */
  path: string;
  code: IssueCode;
  n?: number;
  max?: number;
}

const TOKEN_RE = /\b[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,40}\b/;
const WEBHOOK_RE = /discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/\d{17,20}\/[\w-]{20,}/i;

export function looksLikeToken(s: string): boolean {
  return TOKEN_RE.test(s);
}

function urlState(s: string): "ok" | "bad" | "attachment" | "empty" {
  const v = s.trim();
  if (!v) return "empty";
  if (/^attachment:\/\/\S+$/i.test(v)) return "attachment";
  if (!/^https?:\/\/\S+$/i.test(v)) return "bad";
  try {
    new URL(v);
    return "ok";
  } catch {
    return "bad";
  }
}

export function validate(d: Draft): Issue[] {
  const out: Issue[] = [];
  const len = (path: string, s: string, max: number) => {
    const n = countChars(s);
    if (n > max) out.push({ level: "error", path, code: "tooLong", n, max });
  };
  const url = (path: string, s: string, media = false) => {
    const st = urlState(s);
    if (st === "bad") out.push({ level: "error", path, code: "badUrl" });
    else if (st === "attachment") out.push({ level: media ? "warn" : "error", path, code: media ? "attachmentUrl" : "badUrl" });
  };
  const secrets = (path: string, s: string) => {
    if (looksLikeToken(s)) out.push({ level: "error", path, code: "token" });
    else if (WEBHOOK_RE.test(s)) out.push({ level: "warn", path, code: "webhookInText" });
  };

  len("content", d.content, LIMITS.content);
  secrets("content", d.content);
  len("username", d.username, LIMITS.username);
  const u = d.username.trim().toLowerCase();
  if (u && (/clyde|discord/.test(u) || u === "everyone" || u === "here")) out.push({ level: "error", path: "username", code: "usernameForbidden" });
  url("avatarUrl", d.avatarUrl, true);
  len("threadName", d.threadName, THREAD_NAME_MAX);

  if (d.embeds.length > LIMITS.embeds) out.push({ level: "error", path: "embeds", code: "tooManyEmbeds", n: d.embeds.length, max: LIMITS.embeds });

  d.embeds.forEach((e, i) => {
    const p = `embeds.${i}`;
    if (isEmbedEmpty(e)) {
      out.push({ level: "warn", path: p, code: "emptyEmbed" });
      return;
    }
    len(`${p}.authorName`, e.authorName, LIMITS.author);
    len(`${p}.title`, e.title, LIMITS.title);
    len(`${p}.description`, e.description, LIMITS.description);
    len(`${p}.footerText`, e.footerText, LIMITS.footer);
    for (const k of ["authorName", "title", "description", "footerText"] as const) secrets(`${p}.${k}`, e[k]);
    url(`${p}.authorUrl`, e.authorUrl);
    url(`${p}.authorIcon`, e.authorIcon, true);
    url(`${p}.url`, e.url);
    url(`${p}.thumbnail`, e.thumbnail, true);
    url(`${p}.image`, e.image, true);
    url(`${p}.footerIcon`, e.footerIcon, true);
    if (!has(e.authorName) && (has(e.authorUrl) || has(e.authorIcon))) out.push({ level: "warn", path: `${p}.authorName`, code: "authorNeedsName" });
    if (!has(e.footerText) && has(e.footerIcon)) out.push({ level: "warn", path: `${p}.footerText`, code: "footerIconNeedsText" });
    if (has(e.timestamp) && isNaN(Date.parse(e.timestamp))) out.push({ level: "error", path: `${p}.timestamp`, code: "badTimestamp" });
    if (e.fields.length > LIMITS.fields) out.push({ level: "error", path: `${p}.fields`, code: "tooManyFields", n: e.fields.length, max: LIMITS.fields });
    e.fields.forEach((f, j) => {
      const fp = `${p}.fields.${j}`;
      if (isFieldEmpty(f)) {
        out.push({ level: "warn", path: fp, code: "emptyField" });
        return;
      }
      if (!has(f.name)) out.push({ level: "error", path: `${fp}.name`, code: "required" });
      if (!has(f.value)) out.push({ level: "error", path: `${fp}.value`, code: "required" });
      len(`${fp}.name`, f.name, LIMITS.fieldName);
      len(`${fp}.value`, f.value, LIMITS.fieldValue);
      secrets(`${fp}.value`, f.value);
    });
  });

  const total = totalEmbedChars(d);
  if (total > LIMITS.embedTotal) out.push({ level: "error", path: "embeds", code: "total", n: total, max: LIMITS.embedTotal });

  const sendsSomething =
    has(d.content) || d.embeds.some((e) => !isEmbedEmpty(e)) || ["components", "poll", "attachments", "sticker_ids"].some((k) => k in d.extra);
  if (!sendsSomething) out.push({ level: "error", path: "content", code: "emptyMessage" });

  if (d.otherFlags & FLAG_COMPONENTS_V2) {
    out.push({ level: "warn", path: "flags", code: "componentsV2" });
    if (has(d.content) || d.embeds.some((e) => !isEmbedEmpty(e))) out.push({ level: "error", path: "flags", code: "componentsV2Content" });
  }
  return out;
}

/* ------------------------------------------------------------------- import */

export type ImportError =
  | { code: "empty" }
  | { code: "syntax"; line?: number; col?: number; detail: string }
  | { code: "notObject" }
  | { code: "types"; problems: { path: string; expected: string }[] };

export type ImportNote = "colorString" | "wrappedEmbed" | "wrappedArray" | "discohook" | "receivedFieldsRemoved" | "firstMessageOnly";

export type ImportResult =
  | { ok: true; draft: Draft; unknown: string[]; notes: ImportNote[] }
  | { ok: false; error: ImportError };

const isObj = (v: unknown): v is Rec => typeof v === "object" && v !== null && !Array.isArray(v);
const TOP_KNOWN = new Set(["content", "username", "avatar_url", "embeds", "flags", "thread_name", "allowed_mentions"]);
const EMBED_KNOWN = new Set(["title", "description", "url", "color", "timestamp", "author", "footer", "image", "thumbnail", "fields"]);
const NESTED_KNOWN: Record<string, Set<string>> = {
  author: new Set(["name", "url", "icon_url"]),
  footer: new Set(["text", "icon_url"]),
  image: new Set(["url"]),
  thumbnail: new Set(["url"]),
};
const FIELD_KNOWN = new Set(["name", "value", "inline"]);
/** Keys Discord adds to received messages/embeds that can't be sent back. */
const RECEIVED_EMBED_KEYS = new Set(["type", "provider", "video", "content_scan_version", "reference_id", "flags"]);
const RECEIVED_MEDIA_KEYS = new Set(["proxy_url", "proxy_icon_url", "width", "height", "placeholder", "placeholder_version", "content_type", "flags"]);

function positionToLineCol(text: string, pos: number): { line: number; col: number } {
  const before = text.slice(0, pos).split("\n");
  return { line: before.length, col: before[before.length - 1].length + 1 };
}

export function parseJsonText(text: string): { ok: true; value: unknown } | { ok: false; error: ImportError } {
  if (!text.trim()) return { ok: false, error: { code: "empty" } };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const lc = msg.match(/line (\d+) column (\d+)/i);
    if (lc) return { ok: false, error: { code: "syntax", line: +lc[1], col: +lc[2], detail: msg } };
    const pos = msg.match(/position (\d+)/i);
    if (pos) return { ok: false, error: { code: "syntax", ...positionToLineCol(text, +pos[1]), detail: msg } };
    return { ok: false, error: { code: "syntax", detail: msg } };
  }
}

interface Ctx {
  problems: { path: string; expected: string }[];
  unknown: string[];
  notes: Set<ImportNote>;
  received: boolean;
}

function str(ctx: Ctx, v: unknown, path: string): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  ctx.problems.push({ path, expected: "string" });
  return "";
}

function nestedUrl(ctx: Ctx, v: unknown, path: string, key: "image" | "thumbnail", nested: DraftEmbed["nested"]): string {
  if (v === undefined || v === null) return "";
  if (!isObj(v)) {
    ctx.problems.push({ path, expected: "object" });
    return "";
  }
  const rest = pickUnknown(ctx, v, NESTED_KNOWN[key], path, ctx.received ? RECEIVED_MEDIA_KEYS : undefined);
  if (Object.keys(rest).length) nested[key] = rest;
  return str(ctx, v.url, `${path}.url`);
}

function pickUnknown(ctx: Ctx, obj: Rec, known: Set<string>, path: string, strip?: Set<string>): Rec {
  const rest: Rec = {};
  for (const [k, v] of Object.entries(obj)) {
    if (known.has(k)) continue;
    if (strip?.has(k)) {
      ctx.notes.add("receivedFieldsRemoved");
      continue;
    }
    rest[k] = v;
    ctx.unknown.push(path ? `${path}.${k}` : k);
  }
  return rest;
}

function readEmbed(ctx: Ctx, raw: unknown, path: string): DraftEmbed | null {
  if (!isObj(raw)) {
    ctx.problems.push({ path, expected: "object" });
    return null;
  }
  const e = emptyEmbed();
  e.extra = pickUnknown(ctx, raw, EMBED_KNOWN, path, ctx.received ? RECEIVED_EMBED_KEYS : undefined);
  e.title = str(ctx, raw.title, `${path}.title`);
  e.description = str(ctx, raw.description, `${path}.description`);
  e.url = str(ctx, raw.url, `${path}.url`);
  e.timestamp = str(ctx, raw.timestamp, `${path}.timestamp`);
  if (raw.color !== undefined && raw.color !== null) {
    if (typeof raw.color === "number" && Number.isInteger(raw.color) && raw.color >= 0 && raw.color <= 0xffffff) e.color = raw.color;
    else if (typeof raw.color === "string" && /^#?[0-9a-f]{6}$/i.test(raw.color.trim())) {
      e.color = parseInt(raw.color.trim().replace("#", ""), 16);
      ctx.notes.add("colorString");
    } else ctx.problems.push({ path: `${path}.color`, expected: "color" });
  }
  if (raw.author !== undefined && raw.author !== null) {
    if (!isObj(raw.author)) ctx.problems.push({ path: `${path}.author`, expected: "object" });
    else {
      const a = raw.author;
      e.authorName = str(ctx, a.name, `${path}.author.name`);
      e.authorUrl = str(ctx, a.url, `${path}.author.url`);
      e.authorIcon = str(ctx, a.icon_url, `${path}.author.icon_url`);
      const rest = pickUnknown(ctx, a, NESTED_KNOWN.author, `${path}.author`, ctx.received ? RECEIVED_MEDIA_KEYS : undefined);
      if (Object.keys(rest).length) e.nested.author = rest;
    }
  }
  if (raw.footer !== undefined && raw.footer !== null) {
    if (!isObj(raw.footer)) ctx.problems.push({ path: `${path}.footer`, expected: "object" });
    else {
      const f = raw.footer;
      e.footerText = str(ctx, f.text, `${path}.footer.text`);
      e.footerIcon = str(ctx, f.icon_url, `${path}.footer.icon_url`);
      const rest = pickUnknown(ctx, f, NESTED_KNOWN.footer, `${path}.footer`, ctx.received ? RECEIVED_MEDIA_KEYS : undefined);
      if (Object.keys(rest).length) e.nested.footer = rest;
    }
  }
  e.image = nestedUrl(ctx, raw.image, `${path}.image`, "image", e.nested);
  e.thumbnail = nestedUrl(ctx, raw.thumbnail, `${path}.thumbnail`, "thumbnail", e.nested);
  if (raw.fields !== undefined && raw.fields !== null) {
    if (!Array.isArray(raw.fields)) ctx.problems.push({ path: `${path}.fields`, expected: "array" });
    else {
      raw.fields.forEach((rf, j) => {
        const fp = `${path}.fields.${j}`;
        if (!isObj(rf)) {
          ctx.problems.push({ path: fp, expected: "object" });
          return;
        }
        const f = emptyField();
        f.name = str(ctx, rf.name, `${fp}.name`);
        f.value = str(ctx, rf.value, `${fp}.value`);
        f.inline = rf.inline === true;
        f.extra = pickUnknown(ctx, rf, FIELD_KNOWN, fp);
        e.fields.push(f);
      });
    }
  }
  return e;
}

/** Turn any supported JSON value into a draft. `received` = it came from Discord (GET message). */
export function valueToDraft(value: unknown, received = false): ImportResult {
  const ctx: Ctx = { problems: [], unknown: [], notes: new Set(), received };
  let v = value;
  // Discohook share/backup format: { messages: [{ data: {...} }] }
  if (isObj(v) && Array.isArray(v.messages) && v.messages.length && isObj(v.messages[0]) && isObj((v.messages[0] as Rec).data)) {
    ctx.notes.add("discohook");
    if (v.messages.length > 1) ctx.notes.add("firstMessageOnly");
    v = (v.messages[0] as Rec).data;
  }
  if (Array.isArray(v)) {
    ctx.notes.add("wrappedArray");
    v = { embeds: v };
  } else if (isObj(v) && !("content" in v) && !("embeds" in v) && [...EMBED_KNOWN].some((k) => k in (v as Rec))) {
    ctx.notes.add("wrappedEmbed");
    v = { embeds: [v] };
  }
  if (!isObj(v)) return { ok: false, error: { code: "notObject" } };

  const d = emptyDraft();
  const strip = received
    ? new Set(["id", "type", "channel_id", "author", "attachments", "timestamp", "edited_timestamp", "tts", "mention_everyone", "mentions",
      "mention_roles", "mention_channels", "pinned", "webhook_id", "application_id", "position", "reactions", "nonce", "message_reference",
      "referenced_message", "thread", "interaction", "interaction_metadata", "role_subscription_data", "resolved", "call", "sticker_items",
      "stickers", "components", "poll"])
    : undefined;
  d.extra = pickUnknown(ctx, v, TOP_KNOWN, "", strip);
  d.content = str(ctx, v.content, "content");
  d.username = str(ctx, v.username, "username");
  d.avatarUrl = str(ctx, v.avatar_url, "avatar_url");
  d.threadName = str(ctx, v.thread_name, "thread_name");
  if (v.flags !== undefined && v.flags !== null) {
    if (typeof v.flags !== "number" || !Number.isInteger(v.flags) || v.flags < 0) ctx.problems.push({ path: "flags", expected: "integer" });
    else {
      d.suppressEmbeds = (v.flags & FLAG_SUPPRESS_EMBEDS) !== 0;
      d.suppressNotifications = (v.flags & FLAG_SUPPRESS_NOTIFICATIONS) !== 0;
      // Received messages carry read-only flags (crossposted, has thread …); only keep the V2 bit there.
      const rest = v.flags & ~(FLAG_SUPPRESS_EMBEDS | FLAG_SUPPRESS_NOTIFICATIONS);
      d.otherFlags = received ? rest & FLAG_COMPONENTS_V2 : rest;
    }
  }
  if (v.allowed_mentions !== undefined && v.allowed_mentions !== null) {
    const am = v.allowed_mentions;
    if (!isObj(am)) ctx.problems.push({ path: "allowed_mentions", expected: "object" });
    else {
      const parse = Array.isArray(am.parse) ? am.parse : [];
      const keys = Object.keys(am);
      const none = parse.length === 0 && keys.every((k) => k === "parse" || (Array.isArray(am[k]) && (am[k] as unknown[]).length === 0) || am[k] === false);
      const all = keys.length === 1 && ["users", "roles", "everyone"].every((p) => parse.includes(p)) && parse.length === 3;
      d.allowMentions = !none;
      d.mentionsCustom = none || all ? null : am;
    }
  }
  if (v.embeds !== undefined && v.embeds !== null) {
    if (!Array.isArray(v.embeds)) ctx.problems.push({ path: "embeds", expected: "array" });
    else v.embeds.forEach((re, i) => {
      const e = readEmbed(ctx, re, `embeds.${i}`);
      if (e) d.embeds.push(e);
    });
  }
  if (ctx.problems.length) return { ok: false, error: { code: "types", problems: ctx.problems } };
  return { ok: true, draft: d, unknown: ctx.unknown, notes: [...ctx.notes] };
}

export function importJson(text: string): ImportResult {
  const parsed = parseJsonText(text);
  if (!parsed.ok) return parsed;
  return valueToDraft(parsed.value);
}

/** A message object from GET /webhooks/{id}/{token}/messages/{id} → draft (read-only fields stripped). */
export function messageToDraft(msg: unknown): ImportResult {
  const r = valueToDraft(msg, true);
  if (r.ok && isObj(msg) && isObj(msg.author)) {
    const a = msg.author;
    if (typeof a.username === "string") r.draft.username = a.username;
    if (typeof a.avatar === "string" && typeof a.id === "string")
      r.draft.avatarUrl = `https://cdn.discordapp.com/avatars/${a.id}/${a.avatar}.${a.avatar.startsWith("a_") ? "gif" : "png"}`;
  }
  return r;
}

/** Remove one preserved unknown key (path as listed by import) from the draft. */
export function removeUnknown(d: Draft, path: string): Draft {
  const parts = path.split(".");
  const next: Draft = JSON.parse(JSON.stringify(d));
  if (parts.length === 1) {
    delete next.extra[parts[0]];
    return next;
  }
  if (parts[0] !== "embeds") return next;
  const e = next.embeds[+parts[1]];
  if (!e) return next;
  if (parts.length === 3) delete e.extra[parts[2]];
  else if (parts[2] === "fields" && parts.length === 5) delete e.fields[+parts[3]]?.extra[parts[4]];
  else if (parts.length === 4) {
    const n = e.nested[parts[2] as keyof DraftEmbed["nested"]];
    if (n) delete n[parts[3]];
  }
  return next;
}

/** Paths of all preserved extra keys currently in the draft (for the "kept fields" list). */
export function listExtras(d: Draft): string[] {
  const out = Object.keys(d.extra);
  d.embeds.forEach((e, i) => {
    for (const k of Object.keys(e.extra)) out.push(`embeds.${i}.${k}`);
    for (const [n, obj] of Object.entries(e.nested)) for (const k of Object.keys(obj ?? {})) out.push(`embeds.${i}.${n}.${k}`);
    e.fields.forEach((f, j) => Object.keys(f.extra).forEach((k) => out.push(`embeds.${i}.fields.${j}.${k}`)));
  });
  return out;
}

/* -------------------------------------------------------------------- share */

const SHARE_PREFIX = "m=";

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const res = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await res.arrayBuffer());
}

/** Payload → hash fragment ("m=z.<deflate-raw base64url>" or "m=j.<plain base64url>"), without the leading "#". */
export async function encodeShare(payload: unknown): Promise<string> {
  const raw = new TextEncoder().encode(JSON.stringify(payload));
  if (typeof CompressionStream !== "undefined") {
    try {
      return `${SHARE_PREFIX}z.${bytesToB64url(await pipe(raw, new CompressionStream("deflate-raw")))}`;
    } catch {
      /* fall through to plain */
    }
  }
  return `${SHARE_PREFIX}j.${bytesToB64url(raw)}`;
}

/** Hash ("#m=…" or "m=…") → payload value, or null if it isn't ours / is broken. */
export async function decodeShare(hash: string): Promise<unknown | null> {
  const h = hash.replace(/^#/, "");
  if (!h.startsWith(SHARE_PREFIX)) return null;
  const body = h.slice(SHARE_PREFIX.length);
  const kind = body.slice(0, 2);
  const data = body.slice(2);
  try {
    let bytes = b64urlToBytes(data);
    if (kind === "z.") bytes = await pipe(bytes, new DecompressionStream("deflate-raw"));
    else if (kind !== "j.") return null;
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function isShareHash(hash: string): boolean {
  return hash.replace(/^#/, "").startsWith(SHARE_PREFIX);
}

/* ---------------------------------------------------------- webhook + links */

export interface WebhookRef {
  id: string;
  token: string;
  /** thread_id from the URL query, if the user pasted one */
  threadId?: string;
}

const WEBHOOK_HOSTS = new Set(["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com", "ptb.discordapp.com", "canary.discordapp.com"]);

export function parseWebhookUrl(input: string): WebhookRef | null {
  const s = input.trim();
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !WEBHOOK_HOSTS.has(u.hostname.toLowerCase())) return null;
  const m = u.pathname.match(/^\/api(?:\/v\d{1,2})?\/webhooks\/(\d{17,20})\/([A-Za-z0-9_-]{20,})\/?$/);
  if (!m) return null;
  const thread = u.searchParams.get("thread_id");
  return { id: m[1], token: m[2], threadId: thread && /^\d{17,20}$/.test(thread) ? thread : undefined };
}

/** Always call discord.com/api/v10, whatever host the user pasted. */
export function webhookEndpoint(w: WebhookRef, messageId?: string): string {
  return `https://discord.com/api/v10/webhooks/${w.id}/${w.token}${messageId ? `/messages/${messageId}` : ""}`;
}

export function withQuery(url: string, q: Record<string, string | undefined>): string {
  const parts = Object.entries(q).filter(([, v]) => v !== undefined && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(v!)}`);
  return parts.length ? `${url}?${parts.join("&")}` : url;
}

export interface MessageRef {
  messageId: string;
  channelId?: string;
}

/** A message link (discord.com/channels/guild/channel/message) or a bare message ID. */
export function parseMessageRef(input: string): MessageRef | null {
  const s = input.trim();
  if (/^\d{17,20}$/.test(s)) return { messageId: s };
  const m = s.match(/^https?:\/\/(?:(?:ptb|canary)\.)?discord(?:app)?\.com\/channels\/(?:\d{17,20}|@me)\/(\d{17,20})\/(\d{17,20})\/?(?:[?#].*)?$/i);
  return m ? { channelId: m[1], messageId: m[2] } : null;
}

export function isSnowflake(s: string): boolean {
  return /^\d{17,20}$/.test(s.trim());
}

/** Discord's nested `errors` object → flat list of `path: message`. */
export function flattenDiscordErrors(body: unknown): { path: string; code?: string; message: string }[] {
  const out: { path: string; code?: string; message: string }[] = [];
  const walk = (node: unknown, path: string[]) => {
    if (!isObj(node)) return;
    if (Array.isArray(node._errors)) {
      for (const e of node._errors) if (isObj(e)) out.push({ path: path.join("."), code: typeof e.code === "string" ? e.code : undefined, message: String(e.message ?? "") });
    }
    for (const [k, v] of Object.entries(node)) if (k !== "_errors") walk(v, [...path, k]);
  };
  if (isObj(body)) walk(body.errors, []);
  return out;
}

/** Map a Discord error path (embeds.0.fields.1.value) to our draft path (same shape for most keys). */
export function discordPathToDraft(path: string): string {
  return path
    .replace(/\.author\.name$/, ".authorName").replace(/\.author\.url$/, ".authorUrl").replace(/\.author\.icon_url$/, ".authorIcon")
    .replace(/\.footer\.text$/, ".footerText").replace(/\.footer\.icon_url$/, ".footerIcon")
    .replace(/\.(image|thumbnail)\.url$/, ".$1").replace(/^avatar_url$/, "avatarUrl").replace(/^thread_name$/, "threadName");
}

/* ------------------------------------------------------------------- dates */

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO → value for <input type="datetime-local"> in the visitor's time zone. */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "" : d.toISOString();
}

/* ---------------------------------------------------------------- templates */

export type TemplateId = "announcement" | "rules" | "welcome" | "changelog";
export const TEMPLATE_IDS: TemplateId[] = ["announcement", "rules", "welcome", "changelog"];

function f(name: string, value: string, inline = false): DraftField {
  return { ...emptyField(), name, value, inline };
}

function e(p: Partial<DraftEmbed>): DraftEmbed {
  return { ...emptyEmbed(), ...p };
}

export function templateNames(lang: Lang): Record<TemplateId, string> {
  return lang === "de"
    ? { announcement: "Ankündigung", rules: "Regeln", welcome: "Willkommen", changelog: "Changelog" }
    : { announcement: "Announcement", rules: "Rules", welcome: "Welcome", changelog: "Changelog" };
}

/** Event time used by the announcement template: next Saturday 20:00 local time. */
function nextSaturday(now: Date): number {
  const d = new Date(now);
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  d.setHours(20, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

export function getTemplate(id: TemplateId, lang: Lang, now = new Date()): Draft {
  const de = lang === "de";
  const d = emptyDraft();
  const ts = now.toISOString();
  const ev = nextSaturday(now);
  switch (id) {
    case "announcement":
      d.content = de ? "Neue Ankündigung für alle! 📣" : "New announcement for everyone! 📣";
      d.username = de ? "Server-News" : "Server News";
      d.embeds = [
        e({
          color: 0x3ee0a8,
          authorName: de ? "Team von deinem Server" : "Your server team",
          title: de ? "Community-Abend am Samstag" : "Community night on Saturday",
          description: de
            ? `Wir treffen uns <t:${ev}:F> (<t:${ev}:R>) im **Event-Kanal**.\n\n- Quiz mit Preisen\n- Neue Rollen für alle, die mitmachen\n- Fragen? Schreib sie in #fragen`
            : `We meet <t:${ev}:F> (<t:${ev}:R>) in the **event channel**.\n\n- Quiz with prizes\n- New roles for everyone who joins\n- Questions? Post them in #questions`,
          fields: [f(de ? "Wann" : "When", `<t:${ev}:t>`, true), f(de ? "Wo" : "Where", de ? "Stage-Kanal" : "Stage channel", true), f(de ? "Dauer" : "Length", de ? "ca. 2 Stunden" : "about 2 hours", true)],
          footerText: de ? "Wir freuen uns auf dich" : "See you there",
          timestamp: ts,
        }),
      ];
      break;
    case "rules":
      d.username = de ? "Regeln" : "Rules";
      d.embeds = [
        e({
          color: 0x5865f2,
          title: de ? "📜 Serverregeln" : "📜 Server rules",
          description: de
            ? "Mit dem Beitritt akzeptierst du diese Regeln. Bei Verstößen kann das Team verwarnen, stummschalten oder bannen."
            : "By joining you accept these rules. The team may warn, mute or ban members who break them.",
          fields: [
            f(de ? "1. Respekt" : "1. Be respectful", de ? "Keine Beleidigungen, kein Hass, keine Diskriminierung." : "No insults, hate or discrimination."),
            f(de ? "2. Kein Spam" : "2. No spam", de ? "Keine Werbung, Massen-Pings oder Kettenbriefe." : "No ads, mass pings or chain messages."),
            f(de ? "3. Passende Kanäle" : "3. Use the right channels", de ? "Schreib Themen in den passenden Kanal." : "Keep topics in their channel."),
            f(de ? "4. Discord-Richtlinien" : "4. Discord's rules", de ? "Es gelten die [Community-Richtlinien](https://discord.com/guidelines)." : "Discord's [Community Guidelines](https://discord.com/guidelines) apply."),
          ],
          footerText: de ? "Zuletzt aktualisiert" : "Last updated",
          timestamp: ts,
        }),
      ];
      break;
    case "welcome":
      d.username = de ? "Willkommen" : "Welcome";
      d.embeds = [
        e({
          color: 0xf5b84a,
          title: de ? "Willkommen auf dem Server! 👋" : "Welcome to the server! 👋",
          description: de
            ? "Schön, dass du da bist. So legst du los:\n\n1. Lies die Regeln in #regeln\n2. Hol dir deine Rollen in #rollen\n3. Stell dich in #vorstellung vor"
            : "Great to have you here. Here's how to get started:\n\n1. Read the rules in #rules\n2. Pick your roles in #roles\n3. Introduce yourself in #introductions",
          fields: [f(de ? "Hilfe" : "Help", de ? "Frag einfach im Support-Kanal." : "Just ask in the support channel.", true), f(de ? "Events" : "Events", de ? "Jeden Samstag um 20 Uhr" : "Every Saturday at 8 pm", true)],
          footerText: de ? "Viel Spaß!" : "Have fun!",
        }),
      ];
      break;
    case "changelog":
      d.username = "Changelog";
      d.embeds = [
        e({
          color: 0x8fd3ff,
          title: "Version 2.4",
          description: de ? "Das ist neu in diesem Update:" : "Here's what's new in this update:",
          fields: [
            f(de ? "✨ Neu" : "✨ New", de ? "- Ticket-System für den Support\n- Neue Level-Rollen" : "- Ticket system for support\n- New level roles"),
            f(de ? "🛠️ Verbessert" : "🛠️ Improved", de ? "- Schnellere Musik-Befehle\n- Übersichtlichere Kanäle" : "- Faster music commands\n- Tidier channel list"),
            f(de ? "🐛 Behoben" : "🐛 Fixed", de ? "- `/rank` zeigt wieder das richtige Level" : "- `/rank` shows the right level again"),
          ],
          footerText: de ? "Feedback gern in #feedback" : "Feedback welcome in #feedback",
          timestamp: ts,
        }),
      ];
      break;
  }
  return d;
}
