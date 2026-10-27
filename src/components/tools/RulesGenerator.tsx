import { useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import Preview, { type PreviewMessage, type PreviewTheme } from "../discord/Preview";
import { LIMITS, hexToInt, intToHex } from "../../lib/discord-types";
import { toolById, toolPath } from "../../tools/registry";
import {
  DEFAULT_OPTIONS, activeRules, defaultRules, embedBuilderHash, embedIssues, moveRule, splitMessage, toMarkdown, toPayload,
  translateRules, type Rule, type RulesLang, type RulesStyle,
} from "../../lib/rules-generator";
import "./RulesGenerator.css";

const L = {
  de: {
    view: "Ansicht",
    views: { edit: "Bearbeiten", preview: "Vorschau" },
    settings: "Einstellungen",
    rulesLang: "Sprache der Regeln",
    style: "Stil",
    styles: { numbered: "Nummeriert", headings: "Überschriften", emoji: "Emoji-Punkte" } as Record<RulesStyle, string>,
    title: "Überschrift",
    intro: "Einleitung",
    footer: "Schlusssatz",
    color: "Embed-Farbe",
    pickColor: "Farbe auswählen",
    rules: "Regeln",
    rulesHint: "Haken setzen, Reihenfolge mit den Pfeilen ändern, Texte frei bearbeiten.",
    up: (t: string) => `„${t}“ nach oben`,
    down: (t: string) => `„${t}“ nach unten`,
    remove: (t: string) => `„${t}“ löschen`,
    ruleEmoji: "Emoji",
    ruleTitle: "Titel",
    ruleText: "Text",
    add: "Eigene Regel",
    newTitle: "Neue Regel",
    newText: "Beschreibe hier, was gilt.",
    reset: "Zurücksetzen",
    resetDone: "Auf die Vorlage zurückgesetzt",
    langDone: "Regeltexte auf Deutsch umgestellt",
    output: "Ausgabe",
    outputs: { text: "Text", embed: "Embed" },
    copyText: "Text kopieren",
    copyJson: "JSON kopieren",
    openBuilder: "Im Embed-Builder öffnen",
    chars: (n: number) => `${n} / ${LIMITS.content} Zeichen`,
    over: (n: number) => `Zu lang für eine Nachricht – wird in ${n} Nachrichten aufgeteilt (Nitro: 4000 Zeichen).`,
    part: (i: number, n: number) => `Nachricht ${i} von ${n}`,
    preview: "Vorschau der Regeln",
    previewNote: "Vorschau – kann leicht vom echten Discord abweichen.",
    bot: "Server-Team",
    issues: {
      fields: `Mehr als ${LIMITS.fields} Regeln – ein Embed hat höchstens ${LIMITS.fields} Felder.`,
      fieldValue: (t: string) => `„${t}“ ist länger als ${LIMITS.fieldValue} Zeichen und wird im Embed gekürzt.`,
      fieldName: (t: string) => `Der Titel „${t}“ ist zu lang (max. ${LIMITS.fieldName}).`,
      total: `Das Embed ist länger als ${LIMITS.embedTotal} Zeichen insgesamt.`,
      title: `Die Überschrift ist länger als ${LIMITS.title} Zeichen.`,
    },
    embedHint: "Das Embed unterdrückt Pings (allowed_mentions leer). Im Embed-Builder kannst du es weiter anpassen und per Webhook senden.",
    legal:
      "Das ist eine Vorlage, keine Rechtsberatung. Passe die Regeln an deinen Server an. Die Nutzungsbedingungen und Community-Richtlinien von Discord gelten immer zusätzlich.",
    none: "Wähle mindestens eine Regel aus.",
  },
  en: {
    view: "View",
    views: { edit: "Edit", preview: "Preview" },
    settings: "Settings",
    rulesLang: "Rules language",
    style: "Style",
    styles: { numbered: "Numbered", headings: "Headings", emoji: "Emoji bullets" } as Record<RulesStyle, string>,
    title: "Heading",
    intro: "Intro",
    footer: "Closing line",
    color: "Embed color",
    pickColor: "Pick color",
    rules: "Rules",
    rulesHint: "Tick rules, reorder with the arrows, edit any text.",
    up: (t: string) => `Move “${t}” up`,
    down: (t: string) => `Move “${t}” down`,
    remove: (t: string) => `Delete “${t}”`,
    ruleEmoji: "Emoji",
    ruleTitle: "Title",
    ruleText: "Text",
    add: "Custom rule",
    newTitle: "New rule",
    newText: "Describe what applies.",
    reset: "Reset",
    resetDone: "Reset to the template",
    langDone: "Rule texts switched to English",
    output: "Output",
    outputs: { text: "Text", embed: "Embed" },
    copyText: "Copy text",
    copyJson: "Copy JSON",
    openBuilder: "Open in embed builder",
    chars: (n: number) => `${n} / ${LIMITS.content} characters`,
    over: (n: number) => `Too long for one message – split into ${n} messages (Nitro: 4000 characters).`,
    part: (i: number, n: number) => `Message ${i} of ${n}`,
    preview: "Rules preview",
    previewNote: "Preview – may differ slightly from Discord.",
    bot: "Server staff",
    issues: {
      fields: `More than ${LIMITS.fields} rules – an embed holds at most ${LIMITS.fields} fields.`,
      fieldValue: (t: string) => `“${t}” is longer than ${LIMITS.fieldValue} characters and gets cut in the embed.`,
      fieldName: (t: string) => `The title “${t}” is too long (max ${LIMITS.fieldName}).`,
      total: `The embed is longer than ${LIMITS.embedTotal} characters in total.`,
      title: `The heading is longer than ${LIMITS.title} characters.`,
    },
    embedHint: "The embed suppresses pings (empty allowed_mentions). Fine-tune it in the embed builder and send it via webhook.",
    legal: "This is a template, not legal advice. Adapt the rules to your server. Discord's Terms of Service and Community Guidelines always apply on top.",
    none: "Pick at least one rule.",
  },
};

type Out = "text" | "embed";

export default function RulesGenerator({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [rulesLang, setRulesLang] = useState<RulesLang>(lang);
  const [rules, setRules] = useState<Rule[]>(() => defaultRules(lang));
  const [style, setStyle] = useState<RulesStyle>("emoji");
  const [title, setTitle] = useState(DEFAULT_OPTIONS[lang].title);
  const [intro, setIntro] = useState(DEFAULT_OPTIONS[lang].intro);
  const [footer, setFooter] = useState(DEFAULT_OPTIONS[lang].footer);
  const [color, setColor] = useState("#3EE0A8");
  const [out, setOut] = useState<Out>("text");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [theme, setTheme] = useState<PreviewTheme>("dark");

  const opts = { title, intro, footer, style, color: hexToInt(color) ?? 0x3ee0a8 };
  const md = useMemo(() => toMarkdown(rules, opts), [rules, title, intro, footer, style]);
  const parts = useMemo(() => splitMessage(md), [md]);
  const payload = useMemo(() => toPayload(rules, opts), [rules, title, intro, footer, style, color]);
  const issues = useMemo(() => embedIssues(rules, opts), [rules, title, intro, footer, style]);
  const json = JSON.stringify(payload, null, 2);
  const builderUrl = toolPath(toolById("embed-builder"), lang) + "#" + embedBuilderHash(payload);
  const count = activeRules(rules).length;

  const update = (i: number, patch: Partial<Rule>) => setRules((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const switchLang = (l: RulesLang) => {
    if (l === rulesLang) return;
    setRulesLang(l);
    setRules((r) => translateRules(r, l));
    // Swap default texts only if the user hasn't changed them.
    const from = DEFAULT_OPTIONS[rulesLang], to = DEFAULT_OPTIONS[l];
    if (title === from.title) setTitle(to.title);
    if (intro === from.intro) setIntro(to.intro);
    if (footer === from.footer) setFooter(to.footer);
    toast(l === "de" ? L.de.langDone : L.en.langDone);
  };

  const reset = () => {
    setRules(defaultRules(rulesLang));
    setTitle(DEFAULT_OPTIONS[rulesLang].title);
    setIntro(DEFAULT_OPTIONS[rulesLang].intro);
    setFooter(DEFAULT_OPTIONS[rulesLang].footer);
    setStyle("emoji");
    setColor("#3EE0A8");
    toast(s.resetDone);
  };

  const addCustom = () => {
    const key = "c" + Date.now().toString(36);
    setRules((r) => [...r, { key, blockId: "", emoji: "⭐", title: s.newTitle, text: s.newText, on: true }]);
    setTimeout(() => (document.getElementById(`rg-t-${key}`) as HTMLInputElement | null)?.select(), 30);
  };

  let n = 0;
  const messages: PreviewMessage[] =
    out === "text"
      ? parts.map((p) => ({ username: s.bot, color: color, content: p }))
      : [{ username: s.bot, tag: "APP", embeds: payload.embeds }];

  return (
    <div class="stack rg" data-view={view}>
      <div class="segmented rg-view" role="tablist" aria-label={s.view}>
        {(["edit", "preview"] as const).map((v) => (
          <button type="button" role="tab" key={v} aria-selected={view === v} onClick={() => setView(v)}>{s.views[v]}</button>
        ))}
      </div>
      <div class="tool-layout split">
        <div class="stack rg-edit">
          <section class="panel stack" aria-labelledby="rg-set">
            <div class="row" style={{ justifyContent: "space-between" }}>
              <h2 class="panel-title" id="rg-set" style={{ margin: 0 }}>{s.settings}</h2>
              <button type="button" class="btn btn-sm btn-ghost" onClick={reset}>
                <Icon name="RefreshCw" size={15} /> {s.reset}
              </button>
            </div>
            <div class="row">
              <div class="field">
                <span class="label" id="rg-lang-l">{s.rulesLang}</span>
                <div class="segmented" role="group" aria-labelledby="rg-lang-l">
                  <button type="button" aria-pressed={rulesLang === "de"} onClick={() => switchLang("de")} lang="de">Deutsch</button>
                  <button type="button" aria-pressed={rulesLang === "en"} onClick={() => switchLang("en")} lang="en">English</button>
                </div>
              </div>
              <div class="field">
                <span class="label" id="rg-style-l">{s.style}</span>
                <div class="segmented" role="group" aria-labelledby="rg-style-l">
                  {(["numbered", "headings", "emoji"] as RulesStyle[]).map((st) => (
                    <button type="button" key={st} aria-pressed={style === st} onClick={() => setStyle(st)}>{s.styles[st]}</button>
                  ))}
                </div>
              </div>
            </div>
            <div class="field">
              <label for="rg-title">{s.title}</label>
              <input id="rg-title" class="input" value={title} maxLength={256} onInput={(e) => setTitle((e.target as HTMLInputElement).value)} />
            </div>
            <div class="field">
              <label for="rg-intro">{s.intro}</label>
              <input id="rg-intro" class="input" value={intro} maxLength={500} onInput={(e) => setIntro((e.target as HTMLInputElement).value)} />
            </div>
            <div class="field">
              <label for="rg-footer">{s.footer}</label>
              <input id="rg-footer" class="input" value={footer} maxLength={300} onInput={(e) => setFooter((e.target as HTMLInputElement).value)} />
            </div>
            <div class="field">
              <label for="rg-color">{s.color}</label>
              <div class="rg-color">
                <label class="rg-swatch" style={{ background: color }}>
                  <span class="sr-only">{s.pickColor}</span>
                  <input type="color" value={color.toLowerCase()} onInput={(e) => setColor((e.target as HTMLInputElement).value.toUpperCase())} />
                </label>
                <input
                  id="rg-color"
                  class="input mono"
                  value={color}
                  spellcheck={false}
                  autocomplete="off"
                  onInput={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    const i = hexToInt(v);
                    if (i !== null) setColor(intToHex(i).toUpperCase());
                  }}
                />
              </div>
            </div>
          </section>

          <section class="panel stack" aria-labelledby="rg-rules">
            <div>
              <h2 class="panel-title" id="rg-rules">{s.rules} · {count}</h2>
              <p class="hint" style={{ margin: "-6px 0 0" }}>{s.rulesHint}</p>
            </div>
            <ol class="rg-rules">
              {rules.map((r, i) => {
                const num = r.on && (r.title.trim() || r.text.trim()) ? ++n : 0;
                const label = r.title || "…";
                return (
                  <li key={r.key} class={r.on ? "rg-rule is-on" : "rg-rule"}>
                    <div class="rg-rule-head">
                      <span class="rg-num" aria-hidden="true">{num ? `${num}.` : ""}</span>
                      <label class="check">
                        <input type="checkbox" checked={r.on} onChange={(e) => update(i, { on: (e.target as HTMLInputElement).checked })} />
                        <span>{r.emoji} {label}</span>
                      </label>
                      <button type="button" class="btn btn-sm btn-ghost btn-icon" aria-label={s.up(label)} disabled={i === 0} onClick={() => setRules((x) => moveRule(x, i, -1))}>
                        <Icon name="ArrowUp" size={16} />
                      </button>
                      <button type="button" class="btn btn-sm btn-ghost btn-icon" aria-label={s.down(label)} disabled={i === rules.length - 1} onClick={() => setRules((x) => moveRule(x, i, 1))}>
                        <Icon name="ArrowDown" size={16} />
                      </button>
                      {!r.blockId && (
                        <button type="button" class="btn btn-sm btn-ghost btn-icon" aria-label={s.remove(label)} onClick={() => setRules((x) => x.filter((_, j) => j !== i))}>
                          <Icon name="Trash2" size={16} />
                        </button>
                      )}
                    </div>
                    {r.on && (
                      <div class="rg-edit-body">
                        <div class="rg-title-row">
                          <input class="input rg-emoji" aria-label={`${s.ruleEmoji}: ${label}`} value={r.emoji} maxLength={16} onInput={(e) => update(i, { emoji: (e.target as HTMLInputElement).value })} />
                          <input id={`rg-t-${r.key}`} class="input" aria-label={`${s.ruleTitle}: ${label}`} value={r.title} maxLength={200} onInput={(e) => update(i, { title: (e.target as HTMLInputElement).value })} />
                        </div>
                        <textarea class="textarea" aria-label={`${s.ruleText}: ${label}`} value={r.text} rows={3} onInput={(e) => update(i, { text: (e.target as HTMLTextAreaElement).value })} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            <button type="button" class="btn rg-add" onClick={addCustom}>
              <Icon name="Plus" size={16} /> {s.add}
            </button>
          </section>
        </div>

        <div class="stack sticky rg-out">
          <div class="row" style={{ justifyContent: "space-between" }}>
            <div class="segmented" role="group" aria-label={s.output}>
              {(["text", "embed"] as Out[]).map((o) => (
                <button type="button" key={o} aria-pressed={out === o} onClick={() => setOut(o)}>{s.outputs[o]}</button>
              ))}
            </div>
            {out === "text" && <span class={md.length > LIMITS.content ? "rg-count is-over" : "rg-count"}>{s.chars(md.length)}</span>}
          </div>

          {count === 0 && <p class="notice">{s.none}</p>}

          {out === "text" ? (
            <div class="stack">
              {parts.length > 1 ? (
                <>
                  <p class="notice" role="status">{s.over(parts.length)}</p>
                  <div class="rg-parts">
                    {parts.map((p, i) => (
                      <div class="rg-part" key={i}>
                        <span>{s.part(i + 1, parts.length)} · {p.length}</span>
                        <CopyButton text={p} lang={lang} size="sm" variant={i === 0 ? "primary" : "default"} />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div class="rg-actions">
                  <CopyButton text={md} lang={lang} variant="primary" label={s.copyText} />
                </div>
              )}
            </div>
          ) : (
            <div class="stack">
              <div class="rg-actions">
                <a class="btn btn-primary" href={builderUrl}>
                  <Icon name="ExternalLink" size={16} /> {s.openBuilder}
                </a>
                <CopyButton text={json} lang={lang} label={s.copyJson} />
              </div>
              {issues.length > 0 && (
                <div class="notice error" role="status">
                  {issues.map((iss, i) => (
                    <div key={i}>
                      {iss.kind === "fieldValue" ? s.issues.fieldValue(iss.detail ?? "") : iss.kind === "fieldName" ? s.issues.fieldName(iss.detail ?? "") : s.issues[iss.kind]}
                    </div>
                  ))}
                </div>
              )}
              <p class="hint" style={{ margin: 0 }}>{s.embedHint}</p>
            </div>
          )}

          <Preview
            messages={messages}
            theme={theme}
            onTheme={setTheme}
            locale={rulesLang === "de" ? "de-DE" : "en-US"}
            label={s.preview}
            note={s.previewNote}
          />

          {out === "embed" && (
            <details class="panel">
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>JSON</summary>
              <pre class="rg-json mono">{json}</pre>
            </details>
          )}

          <p class="notice rg-legal">
            <Icon name="TriangleAlert" size={16} />
            <span>{s.legal}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
