import { useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { parseMarkdown, isEmojiOnly, type Block, type Inline } from "../../lib/discord-markdown";
import { formatTimestamp } from "../../lib/timestamp";
import { ANSI_BG, ANSI_FG } from "../../lib/ansi";

export interface RenderOptions {
  locale: string;
  /** Names to show for mention IDs; unknown IDs fall back to generic labels. */
  names?: Record<string, string>;
  headings?: boolean;
}

function Spoiler({ children }: { children: ComponentChildren }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      class={open ? "dm-spoiler open" : "dm-spoiler"}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen(true)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
    >
      <span class="dm-spoiler-inner">{children}</span>
    </span>
  );
}

function mentionLabel(node: Extract<Inline, { type: "mention" }>, opts: RenderOptions): string {
  const known = opts.names?.[node.id];
  switch (node.kind) {
    case "user":
      return "@" + (known ?? (opts.locale.startsWith("de") ? "Nutzer" : "user"));
    case "role":
      return "@" + (known ?? (opts.locale.startsWith("de") ? "Rolle" : "role"));
    case "channel":
      return "#" + (known ?? (opts.locale.startsWith("de") ? "kanal" : "channel"));
    case "command":
      return "/" + (node.label ?? "command");
    case "everyone":
      return "@everyone";
    case "here":
      return "@here";
    case "guild-nav":
      return { customize: "Channels & Roles", browse: "Browse Channels", guide: "Server Guide", "linked-roles": "Linked Roles" }[node.id] ?? node.id;
  }
}

export function InlineNodes({ nodes, opts, jumbo = false }: { nodes: Inline[]; opts: RenderOptions; jumbo?: boolean }) {
  return (
    <>
      {nodes.map((n, i) => {
        switch (n.type) {
          case "text":
            return n.value;
          case "br":
            return <br key={i} />;
          case "bold":
            return <strong key={i}><InlineNodes nodes={n.children} opts={opts} /></strong>;
          case "italic":
            return <em key={i}><InlineNodes nodes={n.children} opts={opts} /></em>;
          case "underline":
            return <u key={i}><InlineNodes nodes={n.children} opts={opts} /></u>;
          case "strike":
            return <s key={i}><InlineNodes nodes={n.children} opts={opts} /></s>;
          case "spoiler":
            return <Spoiler key={i}><InlineNodes nodes={n.children} opts={opts} /></Spoiler>;
          case "code":
            return <code key={i} class="dm-code">{n.value}</code>;
          case "link":
            return (
              <a key={i} class="dm-link" href={n.href} target="_blank" rel="noopener noreferrer nofollow">
                <InlineNodes nodes={n.children} opts={opts} />
              </a>
            );
          case "mention":
            return <span key={i} class="dm-mention">{mentionLabel(n, opts)}</span>;
          case "timestamp":
            return (
              <span key={i} class="dm-timestamp" title={new Date(n.unix * 1000).toLocaleString(opts.locale, { dateStyle: "full", timeStyle: "medium" })}>
                {formatTimestamp(n.unix, n.style, opts.locale)}
              </span>
            );
          case "emoji":
            return (
              <img
                key={i}
                class={jumbo ? "dm-emoji jumbo" : "dm-emoji"}
                src={`https://cdn.discordapp.com/emojis/${n.id}.webp?size=${jumbo ? 96 : 44}${n.animated ? "&animated=true" : ""}`}
                alt={`:${n.name}:`}
                loading="lazy"
                draggable={false}
              />
            );
        }
      })}
    </>
  );
}

function fg(code?: number) {
  return ANSI_FG.find((c) => c.code === code)?.hex;
}
function bg(code?: number) {
  return ANSI_BG.find((c) => c.code === code)?.hex;
}

export function Blocks({ blocks, opts, jumbo = false }: { blocks: Block[]; opts: RenderOptions; jumbo?: boolean }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "paragraph":
            return <div key={i} class="dm-p"><InlineNodes nodes={b.children} opts={opts} jumbo={jumbo} /></div>;
          case "heading": {
            const H = `h${b.level}` as "h1" | "h2" | "h3";
            return <H key={i} class={`dm-h dm-h${b.level}`}><InlineNodes nodes={b.children} opts={opts} /></H>;
          }
          case "subtext":
            return <small key={i} class="dm-sub"><InlineNodes nodes={b.children} opts={opts} /></small>;
          case "quote":
            return (
              <div key={i} class="dm-quote">
                <div class="dm-quote-bar" />
                <blockquote><Blocks blocks={b.children} opts={opts} /></blockquote>
              </div>
            );
          case "list": {
            const L = b.ordered ? "ol" : "ul";
            return (
              <L key={i} class="dm-list" start={b.ordered ? b.start : undefined}>
                {b.items.map((it, j) => (
                  <li key={j} style={{ marginInlineStart: `${it.depth * 16}px` }}>
                    <InlineNodes nodes={it.children} opts={opts} />
                  </li>
                ))}
              </L>
            );
          }
          case "codeblock":
            return (
              <pre key={i} class="dm-pre">
                <code>
                  {b.ansi
                    ? b.ansi.map((s, j) => (
                        <span
                          key={j}
                          style={{
                            color: fg(s.style.fg),
                            background: bg(s.style.bg),
                            fontWeight: s.style.bold ? 700 : undefined,
                            textDecoration: s.style.underline ? "underline" : undefined,
                          }}
                        >
                          {s.text}
                        </span>
                      ))
                    : b.value}
                </code>
              </pre>
            );
        }
      })}
    </>
  );
}

export default function Markdown({ text, opts }: { text: string; opts: RenderOptions }) {
  const jumbo = isEmojiOnly(text);
  return <Blocks blocks={parseMarkdown(text, { headings: opts.headings })} opts={opts} jumbo={jumbo} />;
}
