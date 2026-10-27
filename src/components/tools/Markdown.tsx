import { useRef, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Preview, { type PreviewTheme } from "../discord/Preview";
import MarkdownView from "../discord/Markdown";
import { Bold, Code, EyeOff, Heading1, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, SquareCode, Strikethrough, Underline } from "lucide-preact";
import { codeBlock, diffRange, escapeMarkdown, maskedLink, toggleLinePrefix, wrapSelection, type Edit } from "../../lib/markdown-tools";
import "./Markdown.css";

const LANGS = ["", "js", "ts", "py", "json", "diff", "css", "html", "bash", "yaml", "sql", "ansi"];
const HEAD = /^(#{1,3} |-# )/;

const L = {
  de: {
    edit: "Bearbeiten",
    preview: "Vorschau",
    toolbar: "Formatierung",
    textLabel: "Deine Nachricht",
    hint: "Text markieren und Knopf drücken. Nochmal drücken entfernt die Formatierung. Strg/⌘ + B, I, U, K (Link), E (Code).",
    b: "Fett",
    i: "Kursiv",
    u: "Unterstrichen",
    s: "Durchgestrichen",
    spoiler: "Spoiler",
    code: "Inline-Code",
    block: "Codeblock",
    lang: "Sprache des Codeblocks",
    none: "keine",
    quote: "Zitat",
    h1: "Überschrift 1",
    h2: "Überschrift 2",
    h3: "Überschrift 3",
    sub: "Kleiner Text (Subtext)",
    list: "Liste",
    olist: "Nummerierte Liste",
    link: "Maskierter Link",
    ph: { b: "fett", i: "kursiv", u: "unterstrichen", s: "durchgestrichen", spoiler: "geheim", code: "code", link: "Linktext" },
    count: "Zeichen",
    limit: (n: number, nitro: boolean) => (nitro ? `Mit Nitro: ${n.toLocaleString("de-DE")} frei` : `${n.toLocaleString("de-DE")} frei bis 2.000`),
    over: (n: number) => `${n.toLocaleString("de-DE")} Zeichen zu viel – auch mit Nitro (4.000).`,
    overFree: "Über 2.000 Zeichen: Senden geht nur mit Nitro (bis 4.000).",
    mode: "Ausgabe",
    formatted: "Formatiert",
    literal: "Wörtlich (escaped)",
    literalHint: "Alle Formatierungszeichen bekommen ein \\ davor – Discord zeigt den Text dann genau so, wie er dasteht.",
    copy: "Nachricht kopieren",
    previewLabel: "Discord-Vorschau",
    note: "Annäherung an den Desktop-Client. Erwähnungen und Links bleiben in der Vorschau inaktiv.",
    user: "Kanalwerk",
    cheat: "Spickzettel: alle Formatierungen",
    what: "Was",
    syntax: "Syntax",
    result: "Ergebnis",
    copyRow: "Syntax kopieren",
    rows: [
      ["Kursiv", "*kursiv* oder _kursiv_"],
      ["Fett", "**fett**"],
      ["Fett + kursiv", "***fett und kursiv***"],
      ["Unterstrichen", "__unterstrichen__"],
      ["Unterstrichen + fett", "__**beides**__"],
      ["Durchgestrichen", "~~durchgestrichen~~"],
      ["Spoiler", "||geheim||"],
      ["Inline-Code", "`code`"],
      ["Codeblock mit Sprache", "```js\nconsole.log(\"Hallo\");\n```"],
      ["Zitat (eine Zeile)", "> Zitat"],
      ["Zitat (alles danach)", ">>> Alles ab hier\nist ein Zitat"],
      ["Überschrift 1", "# Große Überschrift"],
      ["Überschrift 2", "## Mittlere Überschrift"],
      ["Überschrift 3", "### Kleine Überschrift"],
      ["Kleiner Text", "-# Kleiner grauer Text"],
      ["Liste", "- Punkt\n  - Unterpunkt"],
      ["Nummerierte Liste", "1. Erstens\n2. Zweitens"],
      ["Maskierter Link", "[discordtools.de](https://discordtools.de)"],
      ["Link ohne Vorschau", "<https://discordtools.de>"],
      ["Zeichen escapen", "\\*kein kursiv\\*"],
      ["Zeitstempel", "<t:1798761600:R>"],
    ] as [string, string][],
    example: `# Willkommen auf dem Server!
Schön, dass du da bist. Ein paar **Regeln**:
- Sei *freundlich* und respektvoll
- Kein Spam, keine __Werbung__
- Spoiler so markieren: ||Der Kuchen ist eine Lüge||
> Fragen? Schreib in den Support-Kanal.
\`\`\`js
console.log("Hallo Discord");
\`\`\`
-# Zuletzt aktualisiert: Oktober 2026 · [Mehr Tools](https://discordtools.de)`,
  },
  en: {
    edit: "Edit",
    preview: "Preview",
    toolbar: "Formatting",
    textLabel: "Your message",
    hint: "Select text and press a button. Press again to remove the formatting. Ctrl/⌘ + B, I, U, K (link), E (code).",
    b: "Bold",
    i: "Italic",
    u: "Underline",
    s: "Strikethrough",
    spoiler: "Spoiler",
    code: "Inline code",
    block: "Code block",
    lang: "Code block language",
    none: "none",
    quote: "Quote",
    h1: "Heading 1",
    h2: "Heading 2",
    h3: "Heading 3",
    sub: "Small text (subtext)",
    list: "List",
    olist: "Numbered list",
    link: "Masked link",
    ph: { b: "bold", i: "italic", u: "underline", s: "strikethrough", spoiler: "secret", code: "code", link: "link text" },
    count: "characters",
    limit: (n: number, nitro: boolean) => (nitro ? `With Nitro: ${n.toLocaleString("en-US")} left` : `${n.toLocaleString("en-US")} left until 2,000`),
    over: (n: number) => `${n.toLocaleString("en-US")} characters too many – even with Nitro (4,000).`,
    overFree: "Over 2,000 characters: you can only send this with Nitro (up to 4,000).",
    mode: "Output",
    formatted: "Formatted",
    literal: "Literal (escaped)",
    literalHint: "Every formatting character gets a \\ in front – Discord then shows the text exactly as written.",
    copy: "Copy message",
    previewLabel: "Discord preview",
    note: "Approximation of the desktop client. Mentions and links stay inactive in the preview.",
    user: "Kanalwerk",
    cheat: "Cheat sheet: every format",
    what: "What",
    syntax: "Syntax",
    result: "Result",
    copyRow: "Copy syntax",
    rows: [
      ["Italic", "*italic* or _italic_"],
      ["Bold", "**bold**"],
      ["Bold italic", "***bold italic***"],
      ["Underline", "__underline__"],
      ["Underline + bold", "__**both**__"],
      ["Strikethrough", "~~strikethrough~~"],
      ["Spoiler", "||secret||"],
      ["Inline code", "`code`"],
      ["Code block with language", "```js\nconsole.log(\"Hello\");\n```"],
      ["Quote (one line)", "> Quote"],
      ["Quote (everything after)", ">>> Everything from here\nis quoted"],
      ["Heading 1", "# Big heading"],
      ["Heading 2", "## Medium heading"],
      ["Heading 3", "### Small heading"],
      ["Small text", "-# Small gray text"],
      ["List", "- Item\n  - Sub-item"],
      ["Numbered list", "1. First\n2. Second"],
      ["Masked link", "[discordtools.de](https://discordtools.de)"],
      ["Link without embed", "<https://discordtools.de>"],
      ["Escape a character", "\\*not italic\\*"],
      ["Timestamp", "<t:1798761600:R>"],
    ] as [string, string][],
    example: `# Welcome to the server!
Glad you're here. A few **rules**:
- Be *kind* and respectful
- No spam, no __advertising__
- Mark spoilers like this: ||The cake is a lie||
> Questions? Ask in the support channel.
\`\`\`js
console.log("Hello Discord");
\`\`\`
-# Last updated: October 2026 · [More tools](https://discordtools.de)`,
  },
};

function Meter({ n, lang }: { n: number; lang: Lang }) {
  const s = L[lang];
  const pct = Math.min(100, (n / 4000) * 100);
  const cls = n > 4000 ? "md-bar bad" : n > 2000 ? "md-bar warn" : "md-bar";
  return (
    <div class="md-meter" aria-live="polite">
      <div class="md-meter-row">
        <span>
          <strong>{n.toLocaleString(lang === "de" ? "de-DE" : "en-US")}</strong> / {lang === "de" ? "2.000 (4.000 mit Nitro)" : "2,000 (4,000 with Nitro)"} {s.count}
        </span>
        <span>{n <= 2000 ? s.limit(2000 - n, false) : n <= 4000 ? s.limit(4000 - n, true) : ""}</span>
      </div>
      <div class={cls} role="presentation">
        <span style={{ width: `${pct}%` }} />
        <i />
      </div>
      {n > 4000 ? <p class="notice error">{s.over(n - 4000)}</p> : n > 2000 ? <p class="notice">{s.overFree}</p> : null}
    </div>
  );
}

export default function Markdown({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [text, setText] = useState(s.example);
  const [codeLang, setCodeLang] = useState("js");
  const [literal, setLiteral] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const ta = useRef<HTMLTextAreaElement>(null);
  const locale = lang === "de" ? "de-DE" : "en-US";

  /** Applies an edit as a single native, undoable text change where the browser supports it. */
  const apply = (fn: (t: string, a: number, b: number) => Edit) => {
    const el = ta.current;
    if (!el) return;
    const before = el.value;
    const edit = fn(before, el.selectionStart, el.selectionEnd);
    const d = diffRange(before, edit.text);
    el.focus();
    el.setSelectionRange(d.start, d.end);
    let ok = false;
    try {
      ok = document.execCommand("insertText", false, d.insert);
    } catch {
      ok = false;
    }
    if (!ok || el.value !== edit.text) {
      el.value = edit.text;
    }
    setText(edit.text);
    el.setSelectionRange(edit.start, edit.end);
  };

  const wrap = (m: string, ph: string, after = m) => apply((t, a, b) => wrapSelection(t, a, b, m, after, ph));
  const prefix = (p: string | ((i: number) => string), ex?: RegExp) => apply((t, a, b) => toggleLinePrefix(t, a, b, p, ex));

  const onKeyDown = (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    const map: Record<string, () => void> = {
      b: () => wrap("**", s.ph.b),
      i: () => wrap("*", s.ph.i),
      u: () => wrap("__", s.ph.u),
      k: () => apply((t, a, b) => maskedLink(t, a, b, s.ph.link)),
      e: () => wrap("`", s.ph.code),
    };
    if (map[k] && !e.shiftKey) {
      e.preventDefault();
      map[k]!();
    }
  };

  const tb = (label: string, onClick: () => void, icon: ComponentChildren) => (
    <button type="button" class="md-tb" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {icon}
    </button>
  );
  const ic = { size: 18, strokeWidth: 1.9, "aria-hidden": true } as const;

  const output = literal ? escapeMarkdown(text) : text;

  return (
    <div class="tool-layout split md" data-view={view}>
      <div class="segmented md-switch" role="group" aria-label={`${s.edit} / ${s.preview}`}>
        <button type="button" aria-pressed={view === "edit"} onClick={() => setView("edit")}>{s.edit}</button>
        <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}>{s.preview}</button>
      </div>

      <section class="panel stack md-view-edit" aria-label={s.edit}>
        <div class="md-toolbar" role="toolbar" aria-label={s.toolbar}>
          {tb(s.b, () => wrap("**", s.ph.b), <Bold {...ic} strokeWidth={2.4} />)}
          {tb(s.i, () => wrap("*", s.ph.i), <Italic {...ic} />)}
          {tb(s.u, () => wrap("__", s.ph.u), <Underline {...ic} />)}
          {tb(s.s, () => wrap("~~", s.ph.s), <Strikethrough {...ic} />)}
          {tb(s.spoiler, () => wrap("||", s.ph.spoiler), <EyeOff {...ic} />)}
          <span class="md-sep" />
          {tb(s.code, () => wrap("`", s.ph.code), <Code {...ic} />)}
          <span class="md-code-group">
            {tb(s.block, () => apply((t, a, b) => codeBlock(t, a, b, codeLang)), <SquareCode {...ic} />)}
            <select class="select md-lang" aria-label={s.lang} value={codeLang} onChange={(e) => setCodeLang(e.currentTarget.value)}>
              {LANGS.map((l) => (
                <option key={l} value={l}>{l || s.none}</option>
              ))}
            </select>
          </span>
          {tb(s.quote, () => prefix("> ", HEAD), <Quote {...ic} />)}
          <span class="md-sep" />
          {tb(s.h1, () => prefix("# ", HEAD), <Heading1 {...ic} />)}
          {tb(s.h2, () => prefix("## ", HEAD), <Heading2 {...ic} />)}
          {tb(s.h3, () => prefix("### ", HEAD), <Heading3 {...ic} />)}
          {tb(s.sub, () => prefix("-# ", HEAD), <span class="md-tb-text">-#</span>)}
          <span class="md-sep" />
          {tb(s.list, () => prefix("- "), <List {...ic} />)}
          {tb(s.olist, () => prefix((i) => `${i + 1}. `), <ListOrdered {...ic} />)}
          {tb(s.link, () => apply((t, a, b) => maskedLink(t, a, b, s.ph.link)), <Link2 {...ic} />)}
        </div>
        <div class="field">
          <label for="md-text">{s.textLabel}</label>
          <textarea
            id="md-text"
            ref={ta}
            class="textarea md-text"
            value={text}
            onInput={(e) => setText(e.currentTarget.value)}
            onKeyDown={onKeyDown}
            aria-describedby="md-hint"
          />
          <span class="hint" id="md-hint">{s.hint}</span>
        </div>
        <Meter n={output.length} lang={lang} />
      </section>

      <div class="stack sticky md-view-preview">
        <section class="panel stack" aria-label={s.mode}>
          <div class="md-out-head">
            <div class="segmented" role="group" aria-label={s.mode}>
              <button type="button" aria-pressed={!literal} onClick={() => setLiteral(false)}>{s.formatted}</button>
              <button type="button" aria-pressed={literal} onClick={() => setLiteral(true)}>{s.literal}</button>
            </div>
            <CopyButton text={output} lang={lang} variant="primary" label={s.copy} />
          </div>
          {literal && <p class="hint" style={{ margin: 0 }}>{s.literalHint}</p>}
          <Preview
            messages={[{ username: s.user, content: output, color: "#3ee0a8" }]}
            theme={theme}
            onTheme={setTheme}
            locale={locale}
            label={s.previewLabel}
            note={s.note}
          />
        </section>
      </div>

      <section class="panel md-cheat" aria-labelledby="md-cheat">
        <h2 class="panel-title" id="md-cheat">{s.cheat}</h2>
        <div class="md-table-wrap">
          <table class="data md-table">
            <thead>
              <tr>
                <th scope="col">{s.what}</th>
                <th scope="col">{s.syntax}</th>
                <th scope="col">{s.result}</th>
                <th scope="col"><span class="sr-only">{s.copyRow}</span></th>
              </tr>
            </thead>
            <tbody>
              {s.rows.map(([what, syntax]) => (
                <tr key={what}>
                  <td>{what}</td>
                  <td><code class="md-syntax">{syntax}</code></td>
                  <td class="md-res">
                    <div class={`dp dp-theme-${theme} md-cell`}>
                      <MarkdownView text={syntax} opts={{ locale }} />
                    </div>
                  </td>
                  <td class="md-copy">
                    <CopyButton text={syntax} lang={lang} size="sm" variant="icon" label={`${s.copyRow}: ${what}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
