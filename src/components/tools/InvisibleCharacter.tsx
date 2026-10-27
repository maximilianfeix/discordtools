import { useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import {
  CANDIDATES, MESSAGE_BLANK, PRIMARY, charOf, clean, decodeTags, hex, repeatChar, scan, summarize,
  type HiddenKind, type Support,
} from "../../lib/invisible-character";
import "./InvisibleCharacter.css";

const L = {
  de: {
    heroTitle: "Unsichtbares Zeichen für Discord",
    heroCopy: "Unsichtbares Zeichen kopieren",
    heroSub: "U+3164 Hangul-Füllzeichen – für leere Anzeigenamen und Spitznamen",
    msgCopy: "Für leere Nachrichten",
    msgSub: "U+2800 Braille-Leerzeichen",
    honest:
      "Ehrlich gesagt: Discord dokumentiert nicht, welche Zeichen erlaubt sind, und blockt einzelne immer wieder. Die Angaben unten sind Erfahrungswerte (Stand Oktober 2026). Klappt eins nicht, probier das nächste. Für Benutzernamen (@name) geht keins – dort sind nur a–z, 0–9, _ und . erlaubt.",
    table: "Alle Kandidaten",
    char: "Zeichen",
    code: "Code",
    name: "Name",
    width: "Breite",
    wide: "breit",
    zero: "null",
    inName: "Leerer Name",
    inMsg: "Leere Nachricht",
    note: "Hinweis",
    copy: "Kopieren",
    copyAria: (n: string) => `${n} kopieren`,
    support: { yes: "Ja", often: "Meist", no: "Nein", unknown: "Unklar" } as Record<Support, string>,
    builder: "Mehrfach-Generator",
    builderHint: "Für längere Leerräume, Abstände oder eine Nachricht aus Leerzeilen.",
    which: "Zeichen",
    count: "Anzahl",
    lines: "Jedes Zeichen in eine eigene Zeile (Leerzeilen)",
    result: (n: number) => `${n} Zeichen – sichtbar gemacht:`,
    copyResult: "Ergebnis kopieren",
    detector: "Versteckte Zeichen finden",
    detectorHint: "Text einfügen – unsichtbare Zeichen werden markiert. Nichts verlässt deinen Browser.",
    detectorLabel: "Text prüfen",
    detectorExample: "Hallo\u200b Welt\u3164! Das ist ein\u2060 Test mit \u00adverstecktem Zeug.\u2800",
    none: "Keine versteckten Zeichen gefunden.",
    found: (n: number) => `${n} versteckte${n === 1 ? "s" : ""} Zeichen gefunden`,
    marked: "Markiert",
    kind: {
      blank: "Leerraum", "zero-width": "Null-Breite", bidi: "Richtungszeichen", tag: "Tag-Zeichen (versteckter Text)",
      variation: "Variantenwähler", control: "Steuerzeichen",
    } as Record<HiddenKind, string>,
    hiddenText: "Versteckter Text in Tag-Zeichen:",
    cleaned: "Bereinigter Text",
    cleanedHint: "Unsichtbare Zeichen entfernt, breite Leerzeichen durch normale ersetzt.",
    clear: "Leeren",
    bidiWarn: "Achtung: Richtungszeichen können Text rückwärts anzeigen – ein bekannter Trick bei gefälschten Links und Dateinamen.",
    times: "×",
  },
  en: {
    heroTitle: "Invisible character for Discord",
    heroCopy: "Copy invisible character",
    heroSub: "U+3164 Hangul filler – for blank display names and nicknames",
    msgCopy: "For empty messages",
    msgSub: "U+2800 braille blank",
    honest:
      "To be honest: Discord does not document which characters are allowed and blocks some of them from time to time. The values below are community experience (October 2026). If one fails, try the next. None of them works in usernames (@name) – those only allow a–z, 0–9, _ and .",
    table: "All candidates",
    char: "Char",
    code: "Code",
    name: "Name",
    width: "Width",
    wide: "wide",
    zero: "zero",
    inName: "Blank name",
    inMsg: "Empty message",
    note: "Note",
    copy: "Copy",
    copyAria: (n: string) => `Copy ${n}`,
    support: { yes: "Yes", often: "Mostly", no: "No", unknown: "Unclear" } as Record<Support, string>,
    builder: "Repeat builder",
    builderHint: "For longer gaps, spacing or a message made of blank lines.",
    which: "Character",
    count: "Count",
    lines: "Put every character on its own line (blank lines)",
    result: (n: number) => `${n} characters – made visible:`,
    copyResult: "Copy result",
    detector: "Find hidden characters",
    detectorHint: "Paste text – invisible characters get highlighted. Nothing leaves your browser.",
    detectorLabel: "Text to check",
    detectorExample: "Hello\u200b world\u3164! This is a\u2060 test with \u00adhidden stuff.\u2800",
    none: "No hidden characters found.",
    found: (n: number) => `${n} hidden character${n === 1 ? "" : "s"} found`,
    marked: "Highlighted",
    kind: {
      blank: "Blank", "zero-width": "Zero width", bidi: "Direction mark", tag: "Tag character (hidden text)",
      variation: "Variation selector", control: "Control character",
    } as Record<HiddenKind, string>,
    hiddenText: "Hidden text in tag characters:",
    cleaned: "Cleaned text",
    cleanedHint: "Invisible characters removed, wide spaces replaced by normal ones.",
    clear: "Clear",
    bidiWarn: "Careful: direction marks can display text backwards – a known trick for fake links and file names.",
    times: "×",
  },
};

export default function InvisibleCharacter({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [cp, setCp] = useState(MESSAGE_BLANK);
  const [count, setCount] = useState("5");
  const [lines, setLines] = useState(true);
  const [input, setInput] = useState(s.detectorExample);

  const n = Math.max(1, Math.min(2000, parseInt(count, 10) || 1));
  const repeated = repeatChar(cp, n, lines);
  const segments = useMemo(() => scan(input), [input]);
  const found = useMemo(() => summarize(segments), [segments]);
  const total = found.reduce((x, f) => x + f.count, 0);
  const tagText = decodeTags(input);
  const hasBidi = found.some((f) => f.kind === "bidi");
  const primary = CANDIDATES.find((c) => c.cp === PRIMARY)!;

  return (
    <div class="stack ic">
      <section class="panel ic-hero" aria-labelledby="ic-hero-t">
        <h2 id="ic-hero-t" class="sr-only">{s.heroTitle}</h2>
        <div class="ic-hero-main">
          <span class="ic-glyph ic-glyph-xl" aria-hidden="true">{charOf(PRIMARY)}</span>
          <div class="ic-hero-copy">
            <CopyButton text={charOf(PRIMARY)} lang={lang} variant="primary" label={s.heroCopy} />
            <span class="hint">{s.heroSub}</span>
          </div>
        </div>
        <div class="ic-hero-alt">
          <span class="ic-glyph" aria-hidden="true">{charOf(MESSAGE_BLANK)}</span>
          <div class="ic-hero-copy">
            <CopyButton text={charOf(MESSAGE_BLANK)} lang={lang} label={s.msgCopy} />
            <span class="hint">{s.msgSub}</span>
          </div>
        </div>
        <p class="notice ic-honest">
          <Icon name="Info" size={16} />
          <span>{s.honest}</span>
        </p>
        <span class="sr-only">{primary.name}</span>
      </section>

      <section class="panel" aria-labelledby="ic-table-t">
        <h2 class="panel-title" id="ic-table-t">{s.table}</h2>
        <div class="ic-table-wrap">
          <table class="data ic-table">
            <thead>
              <tr>
                <th scope="col">{s.char}</th>
                <th scope="col">{s.name}</th>
                <th scope="col">{s.width}</th>
                <th scope="col">{s.inName}</th>
                <th scope="col">{s.inMsg}</th>
                <th scope="col">{s.note}</th>
                <th scope="col"><span class="sr-only">{s.copy}</span></th>
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c) => (
                <tr key={c.cp}>
                  <td data-label={s.char}>
                    <span class="ic-glyph" aria-hidden="true">{charOf(c.cp)}</span>
                  </td>
                  <td data-label={s.name}>
                    <code class="ic-cp">{hex(c.cp)}</code>
                    <span class="ic-name">{c.name}</span>
                  </td>
                  <td data-label={s.width}>{c.wide ? s.wide : s.zero}</td>
                  <td data-label={s.inName}><SupportPill v={c.name_} s={s.support} /></td>
                  <td data-label={s.inMsg}><SupportPill v={c.message} s={s.support} /></td>
                  <td data-label={s.note} class="ic-note">{c.note[lang]}</td>
                  <td class="ic-copy">
                    <CopyButton text={charOf(c.cp)} lang={lang} size="sm" label={s.copy} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div class="tool-layout split">
        <section class="panel stack" aria-labelledby="ic-b-t">
          <div>
            <h2 class="panel-title" id="ic-b-t">{s.builder}</h2>
            <p class="hint ic-flat">{s.builderHint}</p>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="ic-which">{s.which}</label>
              <select id="ic-which" class="select" value={cp} onChange={(e) => setCp(parseInt((e.target as HTMLSelectElement).value, 10))}>
                {CANDIDATES.map((c) => (
                  <option key={c.cp} value={c.cp}>{hex(c.cp)} · {c.name}</option>
                ))}
              </select>
            </div>
            <div class="field">
              <label for="ic-count">{s.count}</label>
              <input
                id="ic-count"
                class="input"
                type="text"
                inputMode="numeric"
                autocomplete="off"
                value={count}
                onInput={(e) => setCount((e.target as HTMLInputElement).value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
          </div>
          <label class="check">
            <input type="checkbox" checked={lines} onChange={(e) => setLines((e.target as HTMLInputElement).checked)} />
            <span>{s.lines}</span>
          </label>
          <div class="field">
            <span class="label">{s.result(n)}</span>
            <div class={lines ? "ic-visual is-lines" : "ic-visual"} aria-hidden="true">
              {Array.from({ length: Math.min(n, 60) }, (_, i) => (
                <span class="ic-dot" key={i}>{charOf(cp)}</span>
              ))}
              {n > 60 && <span class="ic-more">+{n - 60}</span>}
            </div>
          </div>
          <CopyButton text={repeated} lang={lang} variant="primary" label={s.copyResult} />
        </section>

        <section class="panel stack" aria-labelledby="ic-d-t">
          <div>
            <h2 class="panel-title" id="ic-d-t">{s.detector}</h2>
            <p class="hint ic-flat">{s.detectorHint}</p>
          </div>
          <div class="field">
            <label for="ic-in">{s.detectorLabel}</label>
            <textarea
              id="ic-in"
              class="textarea"
              value={input}
              spellcheck={false}
              onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
            />
          </div>
          <div class="row">
            <span class={total ? "chip ic-chip-warn" : "chip ic-chip-ok"} role="status">
              <Icon name={total ? "EyeOff" : "Check"} size={14} />
              {total ? s.found(total) : s.none}
            </span>
            <button type="button" class="btn btn-sm btn-ghost" onClick={() => setInput("")} disabled={!input}>
              <Icon name="X" size={15} /> {s.clear}
            </button>
          </div>
          {total > 0 && (
            <>
              <div class="field">
                <span class="label">{s.marked}</span>
                <div class="ic-scan">
                  {segments.map((seg, i) =>
                    seg.type === "text" ? (
                      <span key={i}>{seg.value}</span>
                    ) : (
                      <mark key={i} class={`ic-mark ic-k-${seg.kind}`} title={seg.name}>
                        {hex(seg.cp).slice(2)}
                      </mark>
                    ),
                  )}
                </div>
              </div>
              <ul class="ic-found">
                {found.map((f) => (
                  <li key={f.cp}>
                    <code>{hex(f.cp)}</code>
                    <span class="ic-name">{f.name}</span>
                    <span class={`ic-kind ic-k-${f.kind}`}>{s.kind[f.kind]}</span>
                    <span class="ic-count">{f.count}{s.times}</span>
                  </li>
                ))}
              </ul>
              {hasBidi && <p class="notice error">{s.bidiWarn}</p>}
              {tagText && (
                <div class="notice">
                  {s.hiddenText} <code>{tagText}</code>
                </div>
              )}
              <div class="field">
                <span class="label">{s.cleaned}</span>
                <div class="output">
                  <code class="ic-clean">{clean(segments)}</code>
                  <CopyButton text={clean(segments)} lang={lang} size="sm" />
                </div>
                <span class="hint">{s.cleanedHint}</span>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function SupportPill({ v, s }: { v: Support; s: Record<Support, string> }) {
  return <span class={`ic-pill ic-pill-${v}`}>{s[v]}</span>;
}
