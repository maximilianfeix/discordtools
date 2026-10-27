import { useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import Preview, { type PreviewTheme } from "../discord/Preview";
import { STYLES, applyStyle, codePointLength, coverage, isValidUsername, styleById, toUsername } from "../../lib/fancy-text";
import "./FancyText.css";

const L = {
  de: {
    input: "Dein Text",
    inputHint: "Umlaute und ß bleiben erhalten, Emojis und Satzzeichen auch.",
    placeholder: "Text eingeben …",
    example: "Willkommen Grüße",
    examples: ["Willkommen", "Max Müller", "Gaming Lounge", "Neuigkeiten"],
    examplesLabel: "Beispiele",
    clear: "Leeren",
    styles: "Stile",
    preview: "Vorschau",
    previewLabel: "Vorschau als Anzeigename",
    previewNote: "Vorschau – kann leicht vom echten Discord abweichen. Am Handy fehlen manchen Schriften einzelne Zeichen.",
    test: "Als Name testen",
    testing: "Wird getestet",
    sr: { poor: "Screenreader: schlecht", bad: "Screenreader: kaum lesbar" },
    srTitle: {
      poor: "Screenreader lesen das oft Buchstabe für Buchstabe oder als „mathematisches fettes A“ vor.",
      bad: "Screenreader überspringen das meist oder lesen Symbolnamen vor.",
    },
    partial: "nur einige Buchstaben",
    noUser: "nicht für Benutzernamen",
    username: "Als gültiger Benutzername",
    usernameHint: "Benutzernamen erlauben nur a–z, 0–9, _ und . (2–32 Zeichen). Schriften gehen nur im Anzeigenamen.",
    usernameEmpty: "Zu kurz – mindestens 2 erlaubte Zeichen.",
    length: (n: number, u: number) => `${n} Zeichen${u !== n ? ` (${u} UTF-16-Einheiten)` : ""} – Anzeigenamen erlauben 32.`,
    tooLong: "Kann zu lang sein: Schrift-Buchstaben belegen oft 2 Einheiten, dann passen nur ca. 16 in einen Anzeigenamen.",
    where: "Wo funktioniert das?",
    whereRows: [
      ["Anzeigename & Server-Spitzname", true],
      ["Nachrichten, Bio („Über mich“), Status", true],
      ["Kanal- und Kategorienamen", true],
      ["Rollen- und Servernamen", true],
      ["Benutzername (@name)", false],
    ] as [string, boolean][],
    a11y: "Tipp: Nutze Schriften sparsam. Für Menschen mit Screenreader wird der Name sonst unlesbar – und die Suche findet dich schlechter.",
    msg: "hab meinen Namen geändert, wie findet ihr ihn?",
  },
  en: {
    input: "Your text",
    inputHint: "Accents, emojis and punctuation are kept.",
    placeholder: "Type something …",
    example: "Welcome friends",
    examples: ["Welcome", "Alex Smith", "Gaming Lounge", "Announcements"],
    examplesLabel: "Examples",
    clear: "Clear",
    styles: "Styles",
    preview: "Preview",
    previewLabel: "Preview as display name",
    previewNote: "Preview – may differ slightly from Discord. Some phones lack single characters of a style.",
    test: "Test as name",
    testing: "Testing",
    sr: { poor: "Screen readers: poor", bad: "Screen readers: unreadable" },
    srTitle: {
      poor: "Screen readers often spell it out or read “mathematical bold capital A”.",
      bad: "Screen readers usually skip it or read symbol names.",
    },
    partial: "some letters only",
    noUser: "not for usernames",
    username: "As a valid username",
    usernameHint: "Usernames only allow a–z, 0–9, _ and . (2–32 characters). Fonts only work in the display name.",
    usernameEmpty: "Too short – at least 2 allowed characters.",
    length: (n: number, u: number) => `${n} characters${u !== n ? ` (${u} UTF-16 units)` : ""} – display names allow 32.`,
    tooLong: "May be too long: styled letters often take 2 units each, so only about 16 fit into a display name.",
    where: "Where does it work?",
    whereRows: [
      ["Display name & server nickname", true],
      ["Messages, bio (“About me”), status", true],
      ["Channel and category names", true],
      ["Role and server names", true],
      ["Username (@name)", false],
    ] as [string, boolean][],
    a11y: "Tip: use fonts sparingly. For people using screen readers the name becomes unreadable – and search finds you less easily.",
    msg: "changed my name, what do you think?",
  },
};

export default function FancyText({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [text, setText] = useState(s.example);
  const [selected, setSelected] = useState("bold-script");
  const [theme, setTheme] = useState<PreviewTheme>("dark");

  const rows = useMemo(() => STYLES.map((st) => ({ st, out: applyStyle(text, st), cov: coverage(text, st) })), [text]);
  const sel = styleById(selected) ?? STYLES[0];
  const selOut = applyStyle(text, sel);
  const selLen = codePointLength(selOut);
  const user = toUsername(text);
  const userOk = isValidUsername(user);

  return (
    <div class="tool-layout split ft">
      <div class="stack sticky">
        <div class="panel stack">
          <div class="field">
            <label for="ft-in">{s.input}</label>
            <textarea
              id="ft-in"
              class="textarea ft-input"
              value={text}
              placeholder={s.placeholder}
              rows={2}
              maxLength={500}
              aria-describedby="ft-in-hint"
              onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
            />
            <span class="hint" id="ft-in-hint">{s.inputHint}</span>
          </div>
          <div class="row ft-examples" role="group" aria-label={s.examplesLabel}>
            {s.examples.map((ex) => (
              <button type="button" class="btn btn-sm" key={ex} onClick={() => setText(ex)}>{ex}</button>
            ))}
            <button type="button" class="btn btn-sm btn-ghost" onClick={() => setText("")} disabled={!text}>
              <Icon name="X" size={15} />
              {s.clear}
            </button>
          </div>
          <div class="field">
            <span class="label">{s.username}</span>
            <div class="output">
              <code>{userOk ? user : <span class="ft-muted">{s.usernameEmpty}</span>}</code>
              <CopyButton text={userOk ? user : ""} lang={lang} size="sm" />
            </div>
            <span class="hint">{s.usernameHint}</span>
          </div>
        </div>

        <Preview
          theme={theme}
          onTheme={setTheme}
          locale={lang === "de" ? "de-DE" : "en-US"}
          label={s.previewLabel}
          note={s.previewNote}
          messages={[{ username: selOut || "…", color: "#3ee0a8", content: s.msg }]}
        />
        <p class={selOut.length > 32 ? "hint ft-warn" : "hint"}>
          {sel.name[lang]}: {s.length(selLen, selOut.length)}
          {selOut.length > 32 && <> {s.tooLong}</>}
        </p>

        <details class="panel ft-where">
          <summary>{s.where}</summary>
          <ul>
            {s.whereRows.map(([label, ok]) => (
              <li key={label}>
                <span class={ok ? "ft-yes" : "ft-no"} aria-hidden="true">
                  <Icon name={ok ? "Check" : "X"} size={15} />
                </span>
                <span>{label}</span>
                <span class="sr-only">{ok ? (lang === "de" ? "ja" : "yes") : lang === "de" ? "nein" : "no"}</span>
              </li>
            ))}
          </ul>
          <p class="hint">{s.a11y}</p>
          <p class="hint">{s.srTitle.poor}</p>
        </details>
      </div>

      <section class="ft-list" aria-label={s.styles}>
        {rows.map(({ st, out, cov }) => (
          <article class={st.id === selected ? "ft-row is-sel" : "ft-row"} key={st.id}>
            <div class="ft-row-head">
              <h3 class="ft-name">{st.name[lang]}</h3>
              {st.sr === "bad" && (
                <span class="ft-badge ft-sr-bad" title={s.srTitle.bad}>
                  <Icon name="TriangleAlert" size={12} />
                  {s.sr.bad}
                </span>
              )}
              {st.partial && cov < 1 && <span class="ft-badge">{s.partial}</span>}
            </div>
            <div class="ft-out" lang="und">{out || " "}</div>
            <div class="ft-actions">
              <button type="button" class="btn btn-sm btn-ghost" aria-pressed={st.id === selected} onClick={() => setSelected(st.id)}>
                <Icon name="Eye" size={15} />
                {st.id === selected ? s.testing : s.test}
              </button>
              <CopyButton text={out} lang={lang} size="sm" variant="primary" />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
