import { useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { countText, splitMessage, TEXT_LIMITS } from "../../lib/character-counter";
import "./CharacterCounter.css";

const L = {
  de: {
    input: "Dein Text",
    clear: "Leeren",
    stats: "Zählung",
    length: "Zeichen (wie Discord zählt)",
    visible: "sichtbare Zeichen",
    words: "Wörter",
    lines: "Zeilen",
    emoji: "Emoji",
    bytes: "Bytes (UTF-8)",
    emojiNote: (n: number, extra: number) =>
      `${n} Emoji zählen zusammen ${extra} Zeichen extra: Discord zählt UTF-16-Einheiten, und viele Emoji bestehen aus 2 bis 11 davon (Hautfarben, Flaggen, Familien).`,
    customNote: (n: number) => `${n} eigene${n === 1 ? "s" : ""} Server-Emoji: Es zählt die ganze Syntax <:name:id>, also meist über 25 Zeichen pro Emoji.`,
    invisibleNote: (n: number) => `${n} unsichtbare${n === 1 ? "s" : ""} Zeichen gefunden (z. B. Zero-Width Space). Sie zählen mit, obwohl man sie nicht sieht.`,
    limits: "Passt das?",
    left: (n: number) => `${n.toLocaleString("de-DE")} frei`,
    over: (n: number) => `${n.toLocaleString("de-DE")} zu viel`,
    srcDoc: "Doku",
    srcClient: "App",
    srcHint: "„Doku“ = steht in Discords Entwickler-Doku. „App“ = Limit der Discord-App, nicht offiziell dokumentiert (Stand Oktober 2026).",
    split: "Nachricht aufteilen",
    splitHint: "Teilt langen Text in sendbare Stücke – an Absätzen, ohne Wörter zu trennen. Offene ```-Codeblöcke werden am Ende eines Teils geschlossen und im nächsten wieder geöffnet.",
    limit: "Limit pro Teil",
    free: "2.000 (normal)",
    nitro: "4.000 (Nitro)",
    numbered: "Teile nummerieren (-# 1/3)",
    fits: "Passt in eine Nachricht – nichts aufzuteilen.",
    loadLong: "Langes Beispiel laden",
    part: (i: number, n: number) => `Teil ${i} von ${n}`,
    chars: (n: number) => `${n.toLocaleString("de-DE")} Zeichen`,
    copyPart: (i: number) => `Teil ${i} kopieren`,
    example: "Hey, ich bin Mia 👋🏽\nIch zocke gern Minecraft 🎮 und mache Musik 🎧\n🇩🇪 · Sie/ihr · DMs offen für Collabs",
    longPara: [
      "**Serverregeln**",
      "1. Sei respektvoll. Beleidigungen, Hassrede und Diskriminierung führen zu einem sofortigen Bann. Das gilt auch für Sprachkanäle, Profilbilder und Statusmeldungen.",
      "2. Kein Spam. Dazu gehören wiederholte Nachrichten, übermäßige Emojis, Massen-Erwähnungen und unaufgeforderte Werbung für andere Server oder Produkte.",
      "3. Nutze die richtigen Kanäle. Fragen zum Spiel gehören in #hilfe, Clips in #clips und Memes in #memes. Off-Topic-Gespräche bitte in #off-topic.",
      "4. Keine NSFW-Inhalte. Das gilt für Bilder, Links, Namen und Emojis. Verstöße werden ohne Vorwarnung gelöscht.",
      "5. Hör auf das Team. Wenn ein Moderator dich bittet, etwas zu lassen, tu es. Diskussionen über Entscheidungen bitte per Ticket.",
    ],
  },
  en: {
    input: "Your text",
    clear: "Clear",
    stats: "Count",
    length: "characters (as Discord counts)",
    visible: "visible characters",
    words: "words",
    lines: "lines",
    emoji: "emoji",
    bytes: "bytes (UTF-8)",
    emojiNote: (n: number, extra: number) =>
      `${n} emoji cost ${extra} extra characters in total: Discord counts UTF-16 units, and many emoji are made of 2 to 11 of them (skin tones, flags, families).`,
    customNote: (n: number) => `${n} custom server emoji: the whole <:name:id> syntax counts, usually 25+ characters each.`,
    invisibleNote: (n: number) => `${n} invisible character${n === 1 ? "" : "s"} found (e.g. zero-width space). They count even though you can't see them.`,
    limits: "Will it fit?",
    left: (n: number) => `${n.toLocaleString("en-US")} left`,
    over: (n: number) => `${n.toLocaleString("en-US")} over`,
    srcDoc: "Docs",
    srcClient: "App",
    srcHint: "“Docs” = in Discord's developer documentation. “App” = limit enforced by the Discord app, not officially documented (as of October 2026).",
    split: "Split message",
    splitHint: "Splits long text into sendable chunks – at paragraphs, without breaking words. Open ``` code blocks are closed at the end of a chunk and reopened in the next one.",
    limit: "Limit per chunk",
    free: "2,000 (regular)",
    nitro: "4,000 (Nitro)",
    numbered: "Number the chunks (-# 1/3)",
    fits: "Fits in one message – nothing to split.",
    loadLong: "Load long example",
    part: (i: number, n: number) => `Part ${i} of ${n}`,
    chars: (n: number) => `${n.toLocaleString("en-US")} characters`,
    copyPart: (i: number) => `Copy part ${i}`,
    example: "Hey, I'm Mia 👋🏽\nI play Minecraft 🎮 and make music 🎧\n🇬🇧 · she/her · DMs open for collabs",
    longPara: [
      "**Server rules**",
      "1. Be respectful. Insults, hate speech and discrimination lead to an instant ban. This also applies to voice channels, avatars and status messages.",
      "2. No spam. That includes repeated messages, excessive emoji, mass mentions and unsolicited advertising for other servers or products.",
      "3. Use the right channels. Game questions go in #help, clips in #clips and memes in #memes. Please take off-topic chat to #off-topic.",
      "4. No NSFW content. This applies to images, links, names and emoji. Violations are deleted without warning.",
      "5. Listen to the team. If a moderator asks you to stop something, do it. Please discuss decisions via a ticket.",
    ],
  },
};

function longExample(paras: string[]): string {
  const code = "```js\n" + Array.from({ length: 40 }, (_, i) => `client.on("ready", () => console.log("Shard ${i} ready"));`).join("\n") + "\n```";
  return [...paras, ...paras.slice(1), code, ...paras.slice(1)].join("\n\n");
}

export default function CharacterCounter({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [text, setText] = useState(s.example);
  const [max, setMax] = useState(2000);
  const [numbered, setNumbered] = useState(false);
  const nf = new Intl.NumberFormat(lang === "de" ? "de-DE" : "en-US");

  const st = useMemo(() => countText(text), [text]);
  const chunks = useMemo(() => (st.length > max ? splitMessage(text, { max, numbered }) : []), [text, max, numbered, st.length]);

  return (
    <div class="tool-layout split cc">
      <div class="stack">
        <section class="panel stack" aria-label={s.input}>
          <div class="field">
            <div class="panel-title" style={{ margin: 0 }}>
              <label for="cc-text">{s.input}</label>
              <button type="button" class="btn btn-sm btn-ghost" onClick={() => setText("")} disabled={!text}>
                <Icon name="Trash2" size={15} /> {s.clear}
              </button>
            </div>
            <textarea id="cc-text" class="textarea cc-text" value={text} onInput={(e) => setText(e.currentTarget.value)} />
          </div>
          <div class="cc-stats" aria-live="polite" aria-label={s.stats}>
            <div class="cc-stat main"><strong>{nf.format(st.length)}</strong><span>{s.length}</span></div>
            <div class="cc-stat"><strong>{nf.format(st.visible)}</strong><span>{s.visible}</span></div>
            <div class="cc-stat"><strong>{nf.format(st.words)}</strong><span>{s.words}</span></div>
            <div class="cc-stat"><strong>{nf.format(st.lines)}</strong><span>{s.lines}</span></div>
            <div class="cc-stat"><strong>{nf.format(st.emoji)}</strong><span>{s.emoji}</span></div>
            <div class="cc-stat"><strong>{nf.format(st.bytes)}</strong><span>{s.bytes}</span></div>
          </div>
          {(st.emojiExtra > 0 || st.customEmoji > 0 || st.invisible > 0) && (
            <div class="cc-notes">
              {st.emojiExtra > 0 && <p class="notice"><Icon name="Info" size={16} />{s.emojiNote(st.emoji, st.emojiExtra)}</p>}
              {st.customEmoji > 0 && <p class="notice"><Icon name="Info" size={16} />{s.customNote(st.customEmoji)}</p>}
              {st.invisible > 0 && <p class="notice"><Icon name="EyeOff" size={16} />{s.invisibleNote(st.invisible)}</p>}
            </div>
          )}
        </section>
      </div>

      <section class="panel sticky" aria-labelledby="cc-limits">
        <h2 class="panel-title" id="cc-limits">{s.limits}</h2>
        <ul class="cc-limits">
          {TEXT_LIMITS.map((l) => {
            const pct = Math.min(100, (st.length / l.max) * 100);
            const over = st.length > l.max;
            return (
              <li key={l.id} class="cc-limit">
                <div class="cc-limit-row">
                  <span class="cc-limit-name">
                    {l.name[lang]}
                    <span class="chip cc-src">{l.source === "doc" ? s.srcDoc : s.srcClient}</span>
                  </span>
                  <span class={over ? "cc-limit-num bad" : "cc-limit-num ok"}>
                    {nf.format(st.length)} / {nf.format(l.max)} · {over ? s.over(st.length - l.max) : s.left(l.max - st.length)}
                  </span>
                </div>
                <div class={over ? "cc-bar bad" : pct > 90 ? "cc-bar warn" : "cc-bar"} role="presentation">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p class="hint" style={{ margin: "10px 0 0" }}>{s.srcHint}</p>
      </section>

      <section class="panel stack cc-split" aria-labelledby="cc-split">
        <h2 class="panel-title" id="cc-split">{s.split}</h2>
        <p class="hint" style={{ margin: 0 }}>{s.splitHint}</p>
        <div class="cc-split-opts">
          <div class="segmented" role="group" aria-label={s.limit}>
            <button type="button" aria-pressed={max === 2000} onClick={() => setMax(2000)}>{s.free}</button>
            <button type="button" aria-pressed={max === 4000} onClick={() => setMax(4000)}>{s.nitro}</button>
          </div>
          <label class="check">
            <input type="checkbox" checked={numbered} onChange={(e) => setNumbered(e.currentTarget.checked)} />
            <span>{s.numbered}</span>
          </label>
        </div>
        {chunks.length === 0 ? (
          <div class="row">
            <p class="notice" style={{ margin: 0, flex: "1 1 240px" }}>{s.fits}</p>
            <button type="button" class="btn" onClick={() => setText(longExample(s.longPara))}>{s.loadLong}</button>
          </div>
        ) : (
          <ol class="cc-chunks" aria-live="polite">
            {chunks.map((c, i) => (
              <li key={i} class="cc-chunk">
                <div class="cc-chunk-head">
                  <span>
                    {s.part(i + 1, chunks.length)} · <span>{s.chars(c.length)}</span>
                  </span>
                  <CopyButton text={c} lang={lang} size="sm" label={s.copyPart(i + 1)} />
                </div>
                <pre>{c}</pre>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
