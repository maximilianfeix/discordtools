import type { ComponentChildren } from "preact";
import Markdown, { type RenderOptions } from "./Markdown";
import { intToHex, type Embed } from "../../lib/discord-types";
import "@fontsource-variable/noto-sans/index.css";
import "@fontsource/source-code-pro/400.css";
import "./preview.css";

export type PreviewTheme = "dark" | "ash" | "onyx" | "light";
export const PREVIEW_THEMES: { id: PreviewTheme; label: string }[] = [
  { id: "dark", label: "Dark" },
  { id: "ash", label: "Ash" },
  { id: "onyx", label: "Onyx" },
  { id: "light", label: "Light" },
];

export interface PreviewMessage {
  username: string;
  avatarUrl?: string;
  /** "APP" for webhooks and bots */
  tag?: string;
  color?: string;
  date?: Date;
  content?: string;
  embeds?: Embed[];
  /** Extra content under the message (e.g. a rendered poll) */
  extra?: ComponentChildren;
}

const DEFAULT_AVATAR = "data:image/svg+xml," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#3ee0a8"/><path fill="#04140e" fill-rule="evenodd" transform="translate(8 8) scale(0.047)" d="M152 64H360C409 64 448 103 448 152V296C448 345 409 384 360 384H192L88 448V362C73 346 64 322 64 296V152C64 103 103 64 152 64ZM278 144L182 304H234L330 144Z"/></svg>`,
);

function headerTime(date: Date, locale: string): string {
  const now = new Date();
  const time = new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(date);
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return locale.startsWith("de") ? `Heute um ${time}` : `Today at ${time}`;
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(date);
}

function safeUrl(url?: string): string | undefined {
  return url && /^https?:\/\//i.test(url) ? url : undefined;
}

export function EmbedView({ embed, opts }: { embed: Embed; opts: RenderOptions }) {
  const fields = embed.fields ?? [];
  const thumb = safeUrl(embed.thumbnail?.url);
  // Discord groups up to 3 consecutive inline fields per row.
  const rows: typeof fields[] = [];
  for (const f of fields) {
    const last = rows[rows.length - 1];
    if (f.inline && last && last.length < 3 && last.every((x) => x.inline)) last.push(f);
    else rows.push([f]);
  }
  const footerTs = embed.timestamp ? new Date(embed.timestamp) : null;
  const hasFooter = embed.footer?.text || footerTs;
  return (
    <article class="dp-embed" style={{ borderInlineStartColor: embed.color !== undefined ? intToHex(embed.color) : undefined }}>
      <div class={thumb ? "dp-embed-grid has-thumb" : "dp-embed-grid"}>
        {embed.author?.name && (
          <div class="dp-author">
            {safeUrl(embed.author.icon_url) && <img src={embed.author.icon_url} alt="" loading="lazy" />}
            {safeUrl(embed.author.url) ? (
              <a href={embed.author.url} target="_blank" rel="noopener noreferrer nofollow">{embed.author.name}</a>
            ) : (
              <span>{embed.author.name}</span>
            )}
          </div>
        )}
        {embed.title && (
          <div class="dp-title">
            {safeUrl(embed.url) ? (
              <a href={embed.url} target="_blank" rel="noopener noreferrer nofollow">
                <Markdown text={embed.title} opts={{ ...opts, headings: false }} />
              </a>
            ) : (
              <Markdown text={embed.title} opts={{ ...opts, headings: false }} />
            )}
          </div>
        )}
        {embed.description && (
          <div class="dp-desc">
            <Markdown text={embed.description} opts={opts} />
          </div>
        )}
        {rows.length > 0 && (
          <div class="dp-fields">
            {rows.map((row, i) => (
              <div class="dp-field-row" key={i} style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
                {row.map((f, j) => (
                  <div class="dp-field" key={j}>
                    <div class="dp-field-name"><Markdown text={f.name || "​"} opts={{ ...opts, headings: false }} /></div>
                    <div class="dp-field-value"><Markdown text={f.value || "​"} opts={opts} /></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        {thumb && <img class="dp-thumb" src={thumb} alt="" loading="lazy" />}
        {safeUrl(embed.image?.url) && <img class="dp-image" src={embed.image!.url} alt="" loading="lazy" />}
        {hasFooter && (
          <div class="dp-footer">
            {safeUrl(embed.footer?.icon_url) && <img src={embed.footer!.icon_url} alt="" loading="lazy" />}
            <span>
              {embed.footer?.text}
              {embed.footer?.text && footerTs && !isNaN(footerTs.getTime()) && <span class="dp-dot">•</span>}
              {footerTs && !isNaN(footerTs.getTime()) && headerTime(footerTs, opts.locale)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export function MessageView({ msg, opts }: { msg: PreviewMessage; opts: RenderOptions }) {
  return (
    <div class="dp-message">
      <img class="dp-avatar" src={safeUrl(msg.avatarUrl) ?? DEFAULT_AVATAR} alt="" width={40} height={40} />
      <div class="dp-body">
        <div class="dp-header">
          <span class="dp-username" style={{ color: msg.color }}>{msg.username || "Webhook"}</span>
          {msg.tag && <span class="dp-tag">{msg.tag}</span>}
          <time class="dp-time">{headerTime(msg.date ?? new Date(), opts.locale)}</time>
        </div>
        {msg.content && (
          <div class="dp-content">
            <Markdown text={msg.content} opts={opts} />
          </div>
        )}
        {msg.embeds?.map((e, i) => <EmbedView key={i} embed={e} opts={opts} />)}
        {msg.extra}
      </div>
    </div>
  );
}

interface PreviewProps {
  messages: PreviewMessage[];
  theme: PreviewTheme;
  onTheme?: (t: PreviewTheme) => void;
  locale: string;
  names?: Record<string, string>;
  label: string;
  note?: string;
}

/** The Discord-like chat surface. It is themed separately from our site and always labelled as a preview. */
export default function Preview({ messages, theme, onTheme, locale, names, label, note }: PreviewProps) {
  const opts: RenderOptions = { locale, names };
  return (
    <section class="dp-wrap" aria-label={label}>
      <div class="dp-bar">
        <span class="dp-label">{label}</span>
        {onTheme && (
          <div class="segmented" role="group" aria-label="Theme">
            {PREVIEW_THEMES.map((t) => (
              <button type="button" key={t.id} aria-pressed={theme === t.id} onClick={() => onTheme(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div class={`dp dp-theme-${theme}`}>
        {messages.map((m, i) => <MessageView key={i} msg={m} opts={opts} />)}
      </div>
      {note && <p class="hint dp-note">{note}</p>}
    </section>
  );
}
