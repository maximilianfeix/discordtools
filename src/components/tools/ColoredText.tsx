import { useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import Preview, { type PreviewTheme } from "../discord/Preview";
import { Bold, Redo2, RemoveFormatting, Underline, Undo2 } from "lucide-preact";
import { ANSI_BG, ANSI_FG, type AnsiStyle } from "../../lib/ansi";
import {
  applyStyle,
  applyTextEdit,
  commonStyle,
  concat,
  fromAnsi,
  lowContrastSpans,
  rainbow,
  spliceDoc,
  styled,
  toAnsi,
  toggleTypingStyle,
  toSpans,
  visualizeEscapes,
  type StyleAction,
  type StyledText,
} from "../../lib/colored-text";
import "./ColoredText.css";

const FG_NAMES = {
  de: ["Grau", "Rot", "Grün", "Gelb", "Blau", "Pink", "Cyan", "Weiß"],
  en: ["Gray", "Red", "Green", "Yellow", "Blue", "Pink", "Cyan", "White"],
};
const BG_NAMES = {
  de: ["Dunkelblau", "Orange", "Marmorblau", "Graublau", "Grau", "Indigo", "Hellgrau", "Weiß"],
  en: ["Dark blue", "Orange", "Marble blue", "Slate", "Gray", "Indigo", "Light gray", "White"],
};

const L = {
  de: {
    mobile: "ANSI-Farben zeigt Discord nur am PC und im Browser. In den Handy-Apps (iOS und Android) erscheint derselbe Text als normaler grauer Codeblock.",
    editor: "Editor",
    textColor: "Textfarbe",
    bgColor: "Hintergrund",
    format: "Format",
    bold: "Fett",
    underline: "Unterstrichen",
    reset: "Format entfernen",
    undo: "Rückgängig",
    redo: "Wiederholen",
    textLabel: "Dein Text",
    hint: "Text markieren, dann Farbe oder Format wählen. Ohne Markierung gilt die Auswahl für alles, was du als Nächstes tippst. Strg/⌘ + B fett, Strg/⌘ + U unterstrichen. Du kannst auch fertigen ANSI-Text einfügen.",
    next: "Nächster Text:",
    plain: "normal",
    presets: "Vorlagen",
    pRainbow: "Regenbogen",
    pWarning: "Warnbox",
    pStatus: "Status-Liste",
    pChangelog: "Changelog",
    pClear: "Leeren",
    output: "Ausgabe",
    copy: "Für Discord kopieren",
    copyPlain: "Nur Text",
    chars: (n: number) => `${n.toLocaleString("de-DE")} / 2.000 Zeichen`,
    tooLong: "Zu lang für eine Nachricht ohne Nitro – Farbcodes zählen mit.",
    showEsc: "Escape-Codes sichtbar machen",
    escHint: "Das unsichtbare ESC-Zeichen wird hier als \\u001b angezeigt. Der Kopieren-Knopf kopiert das echte Zeichen – genau das braucht Discord.",
    preview: "Vorschau (Desktop)",
    previewNote: "Annäherung an den Desktop-Client. Am Handy siehst du keine Farben.",
    contrast: (t: string) => `Schwer lesbar: „${t}“ – Text- und Hintergrundfarbe sind sich zu ähnlich.`,
    user: "Kanalwerk",
    welcome: "Willkommen! ",
    colorful: "Bunter Text in Discord",
    boldW: "Fett",
    underW: "unterstrichen",
    bgW: " mit Hintergrund ",
    tip: "Markier ein Wort und klick eine Farbe.",
    rainbowText: "Willkommen auf dem Server!",
    warnTitle: "! ACHTUNG",
    warnLines: ["Wartungsarbeiten heute", "von 22:00 bis 23:00 Uhr."],
    status: [
      ["●", "Online", 32],
      ["●", "Abwesend", 33],
      ["●", "Bitte nicht stören", 31],
      ["●", "Offline", 30],
    ] as [string, string, number][],
    clTitle: "Changelog v2.1",
    clLines: [
      ["+", "Neues Ticket-System", 32],
      ["~", "Rollen überarbeitet", 33],
      ["-", "Alte Befehle entfernt", 31],
    ] as [string, string, number][],
  },
  en: {
    mobile: "Discord only shows ANSI colors on desktop and in the browser. In the mobile apps (iOS and Android) the same text appears as a plain gray code block.",
    editor: "Editor",
    textColor: "Text color",
    bgColor: "Background",
    format: "Format",
    bold: "Bold",
    underline: "Underline",
    reset: "Clear format",
    undo: "Undo",
    redo: "Redo",
    textLabel: "Your text",
    hint: "Select text, then pick a color or format. With nothing selected, the choice applies to what you type next. Ctrl/⌘ + B bold, Ctrl/⌘ + U underline. You can also paste existing ANSI text.",
    next: "Next text:",
    plain: "plain",
    presets: "Templates",
    pRainbow: "Rainbow",
    pWarning: "Warning box",
    pStatus: "Status list",
    pChangelog: "Changelog",
    pClear: "Clear",
    output: "Output",
    copy: "Copy for Discord",
    copyPlain: "Text only",
    chars: (n: number) => `${n.toLocaleString("en-US")} / 2,000 characters`,
    tooLong: "Too long for one message without Nitro – color codes count too.",
    showEsc: "Show escape codes",
    escHint: "The invisible ESC character is shown here as \\u001b. The copy button copies the real character – that's what Discord needs.",
    preview: "Preview (desktop)",
    previewNote: "Approximation of the desktop client. Mobile shows no colors.",
    contrast: (t: string) => `Hard to read: “${t}” – text and background colors are too similar.`,
    user: "Kanalwerk",
    welcome: "Welcome! ",
    colorful: "Colored text in Discord",
    boldW: "Bold",
    underW: "underlined",
    bgW: " with background ",
    tip: "Select a word and click a color.",
    rainbowText: "Welcome to the server!",
    warnTitle: "! WARNING",
    warnLines: ["Maintenance tonight", "from 10 pm to 11 pm."],
    status: [
      ["●", "Online", 32],
      ["●", "Idle", 33],
      ["●", "Do not disturb", 31],
      ["●", "Offline", 30],
    ] as [string, string, number][],
    clTitle: "Changelog v2.1",
    clLines: [
      ["+", "New ticket system", 32],
      ["~", "Reworked roles", 33],
      ["-", "Removed old commands", 31],
    ] as [string, string, number][],
  },
};

type Strings = (typeof L)["de"];

function exampleDoc(s: Strings): StyledText {
  const nl = styled("\n");
  return concat(
    styled(s.welcome, { fg: 36, bold: true }),
    rainbow(s.colorful),
    nl,
    styled(s.boldW, { fg: 33, bold: true }),
    styled(", "),
    styled(s.underW, { fg: 34, underline: true }),
    styled(", "),
    styled(s.bgW, { fg: 37, bg: 45 }),
    nl,
    styled(s.tip, { fg: 32 }),
  );
}

function warningDoc(s: Strings): StyledText {
  const W = 30;
  const line = (content: StyledText) =>
    concat(styled("│ ", { fg: 33 }), content, styled(" ".repeat(Math.max(0, W - 4 - content.text.length))), styled(" │", { fg: 33 }), styled("\n"));
  return concat(
    styled("┌" + "─".repeat(W - 2) + "┐\n", { fg: 33 }),
    line(styled(s.warnTitle, { fg: 31, bold: true })),
    ...s.warnLines.map((l) => line(styled(l, { fg: 37 }))),
    styled("└" + "─".repeat(W - 2) + "┘", { fg: 33 }),
  );
}

function statusDoc(s: Strings): StyledText {
  return concat(...s.status.flatMap(([dot, label, fg], i) => [styled(dot + " ", { fg }), styled(label, { fg: 37 }), styled(i < s.status.length - 1 ? "\n" : "")]));
}

function changelogDoc(s: Strings): StyledText {
  return concat(
    styled(s.clTitle, { fg: 34, bold: true, underline: true }),
    ...s.clLines.flatMap(([sign, text, fg]) => [styled("\n"), styled(sign + " ", { fg, bold: true }), styled(text, { fg })]),
  );
}

export default function ColoredText({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [doc, setDoc] = useState<StyledText>(() => exampleDoc(s));
  const [sel, setSel] = useState({ start: 0, end: 0 });
  const [typing, setTyping] = useState<AnsiStyle>({});
  const [showEsc, setShowEsc] = useState(true);
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const ta = useRef<HTMLTextAreaElement>(null);
  const layer = useRef<HTMLPreElement>(null);
  const caret = useRef(0);
  const history = useRef<{ past: StyledText[]; future: StyledText[]; last: number }>({ past: [], future: [], last: 0 });

  const commit = (next: StyledText, coalesce = false) => {
    const h = history.current;
    const t = Date.now();
    if (!coalesce || t - h.last > 800) {
      h.past.push(doc);
      if (h.past.length > 100) h.past.shift();
    }
    h.last = coalesce ? t : 0;
    h.future = [];
    setDoc(next);
  };

  const undo = () => {
    const h = history.current;
    const prev = h.past.pop();
    if (!prev) return;
    h.future.push(doc);
    h.last = 0;
    setDoc(prev);
  };
  const redo = () => {
    const h = history.current;
    const next = h.future.pop();
    if (!next) return;
    h.past.push(doc);
    h.last = 0;
    setDoc(next);
  };

  const readSel = () => {
    const el = ta.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setSel({ start, end });
    if (start === end && start !== caret.current) {
      caret.current = start;
      // Typing continues the style of the character before the caret.
      setTyping(start > 0 ? { ...(doc.styles[start - 1] ?? {}) } : {});
    }
  };

  const restore = (start: number, end: number) => {
    requestAnimationFrame(() => {
      const el = ta.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(start, end);
    });
  };

  const act = (action: StyleAction) => {
    const el = ta.current;
    const start = el ? el.selectionStart : sel.start;
    const end = el ? el.selectionEnd : sel.end;
    if (start === end) {
      setTyping((t) => toggleTypingStyle(t, action));
      caret.current = start;
    } else commit(applyStyle(doc, start, end, action));
    restore(start, end);
  };

  const onInput = (e: Event) => {
    const el = e.currentTarget as HTMLTextAreaElement;
    const next = applyTextEdit(doc, el.value, typing);
    caret.current = el.selectionStart;
    setSel({ start: el.selectionStart, end: el.selectionEnd });
    commit(next, true);
  };

  const onPaste = (e: ClipboardEvent) => {
    const text = e.clipboardData?.getData("text/plain") ?? "";
    if (!text.includes("\u001b[")) return;
    e.preventDefault();
    const el = e.currentTarget as HTMLTextAreaElement;
    const ins = fromAnsi(text);
    const start = el.selectionStart;
    commit(spliceDoc(doc, start, el.selectionEnd, ins));
    caret.current = start + ins.text.length;
    restore(caret.current, caret.current);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const k = e.key.toLowerCase();
    if (k === "b") {
      e.preventDefault();
      act({ type: "bold" });
    } else if (k === "u") {
      e.preventDefault();
      act({ type: "underline" });
    } else if (k === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((k === "z" && e.shiftKey) || k === "y") {
      e.preventDefault();
      redo();
    }
  };

  const loadPreset = (d: StyledText) => {
    commit(d);
    caret.current = -1;
    setTyping({});
  };

  const spans = useMemo(() => toSpans(doc), [doc]);
  const ansi = useMemo(() => toAnsi(doc), [doc]);
  const lowContrast = useMemo(() => lowContrastSpans(doc), [doc]);
  const current = sel.start === sel.end ? typing : commonStyle(doc, sel.start, sel.end);
  const fgHex = (c?: number) => ANSI_FG.find((x) => x.code === c)?.hex;
  const bgHex = (c?: number) => ANSI_BG.find((x) => x.code === c)?.hex;
  const styleCss = (st: AnsiStyle) => ({
    color: fgHex(st.fg),
    background: bgHex(st.bg),
    fontWeight: st.bold ? 700 : undefined,
    textDecoration: st.underline ? "underline" : undefined,
  });

  return (
    <div class="tool-layout split ct">
      <div class="stack">
        <p class="notice ct-warn" role="note">
          <Icon name="TriangleAlert" size={18} />
          <span>{s.mobile}</span>
        </p>

        <section class="panel stack" aria-labelledby="ct-editor">
          <h2 class="panel-title" id="ct-editor">{s.editor}</h2>

          <div class="field">
            <label for="ct-input">{s.textLabel}</label>
            <div class="ct-editor">
              <pre class="ct-layer" ref={layer} aria-hidden="true">
                {spans.map((sp, i) => (
                  <span key={i} style={styleCss(sp.style)}>{sp.text}</span>
                ))}
                {"\n "}
              </pre>
              <textarea
                id="ct-input"
                ref={ta}
                class="ct-input"
                value={doc.text}
                spellcheck={false}
                autocomplete="off"
                onInput={onInput}
                onSelect={readSel}
                onKeyUp={readSel}
                onMouseUp={readSel}
                onFocus={readSel}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
                aria-describedby="ct-hint"
              />
            </div>
            {sel.start === sel.end && (
              <span class="ct-next" aria-live="polite">
                {s.next}{" "}
                <span class="ct-next-chip" style={styleCss(typing)}>{Object.keys(typing).length ? "Abc" : s.plain}</span>
              </span>
            )}
            <span class="hint" id="ct-hint">{s.hint}</span>
          </div>

          <div class="ct-group" role="group" aria-labelledby="ct-fg-label">
            <span class="label" id="ct-fg-label">{s.textColor}</span>
            <div class="ct-swatches">
              {ANSI_FG.map((c, i) => (
                <button
                  type="button"
                  key={c.code}
                  class="ct-sw"
                  aria-pressed={current.fg === c.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => act({ type: "fg", code: c.code })}
                  title={`${FG_NAMES[lang][i]} (${c.code})`}
                >
                  <span class="ct-dot" style={{ background: c.hex }} />
                  {FG_NAMES[lang][i]}
                </button>
              ))}
            </div>
          </div>

          <div class="ct-group" role="group" aria-labelledby="ct-bg-label">
            <span class="label" id="ct-bg-label">{s.bgColor}</span>
            <div class="ct-swatches">
              {ANSI_BG.map((c, i) => (
                <button
                  type="button"
                  key={c.code}
                  class="ct-sw"
                  aria-pressed={current.bg === c.code}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => act({ type: "bg", code: c.code })}
                  title={`${BG_NAMES[lang][i]} (${c.code})`}
                >
                  <span class="ct-dot ct-dot-bg" style={{ background: c.hex }} />
                  {BG_NAMES[lang][i]}
                </button>
              ))}
            </div>
          </div>

          <div class="ct-group" role="group" aria-label={s.format}>
            <div class="ct-tools">
              <button type="button" class="btn btn-sm" aria-pressed={!!current.bold} onMouseDown={(e) => e.preventDefault()} onClick={() => act({ type: "bold" })}>
                <Bold size={16} strokeWidth={2.25} aria-hidden="true" /> {s.bold}
              </button>
              <button type="button" class="btn btn-sm" aria-pressed={!!current.underline} onMouseDown={(e) => e.preventDefault()} onClick={() => act({ type: "underline" })}>
                <Underline size={16} strokeWidth={2} aria-hidden="true" /> {s.underline}
              </button>
              <button type="button" class="btn btn-sm" onMouseDown={(e) => e.preventDefault()} onClick={() => act({ type: "reset" })}>
                <RemoveFormatting size={16} strokeWidth={1.75} aria-hidden="true" /> {s.reset}
              </button>
              <span class="ct-spacer" />
              <button type="button" class="btn btn-sm btn-icon" aria-label={s.undo} title={s.undo} onClick={undo} disabled={!history.current.past.length}>
                <Undo2 size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
              <button type="button" class="btn btn-sm btn-icon" aria-label={s.redo} title={s.redo} onClick={redo} disabled={!history.current.future.length}>
                <Redo2 size={16} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div class="field">
            <span class="label">{s.presets}</span>
            <div class="ct-tools">
              <button type="button" class="btn btn-sm" onClick={() => loadPreset(rainbow(s.rainbowText))}>{s.pRainbow}</button>
              <button type="button" class="btn btn-sm" onClick={() => loadPreset(warningDoc(s))}>{s.pWarning}</button>
              <button type="button" class="btn btn-sm" onClick={() => loadPreset(statusDoc(s))}>{s.pStatus}</button>
              <button type="button" class="btn btn-sm" onClick={() => loadPreset(changelogDoc(s))}>{s.pChangelog}</button>
              <button type="button" class="btn btn-sm btn-ghost" onClick={() => loadPreset(styled(""))}>
                <Icon name="Trash2" size={15} /> {s.pClear}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="stack sticky">
        <section class="panel stack" aria-labelledby="ct-out">
          <h2 class="panel-title" id="ct-out">
            {s.output}
            <span class={ansi.length > 2000 ? "ct-count bad" : "ct-count"}>{s.chars(ansi.length)}</span>
          </h2>
          <div class="row">
            <CopyButton text={ansi} lang={lang} variant="primary" label={s.copy} />
            <CopyButton text={doc.text} lang={lang} label={s.copyPlain} />
          </div>
          {ansi.length > 2000 && <p class="notice error">{s.tooLong}</p>}
          <label class="check">
            <input type="checkbox" checked={showEsc} onChange={(e) => setShowEsc(e.currentTarget.checked)} />
            <span>{s.showEsc}</span>
          </label>
          <pre class="ct-raw" tabIndex={0}>
            <code>{showEsc ? visualizeEscapes(ansi) : ansi}</code>
          </pre>
          {showEsc && <p class="hint ct-raw-hint">{s.escHint}</p>}
        </section>
        <Preview
          messages={[{ username: s.user, content: ansi, color: "#3ee0a8" }]}
          theme={theme}
          onTheme={setTheme}
          locale={lang === "de" ? "de-DE" : "en-US"}
          label={s.preview}
          note={s.previewNote}
        />
        {lowContrast.length > 0 && (
          <p class="notice ct-contrast" role="status">
            <Icon name="Info" size={16} /> {s.contrast(lowContrast.slice(0, 3).join("“, „"))}
          </p>
        )}
      </div>
    </div>
  );
}
