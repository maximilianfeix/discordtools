import { useMemo, useState } from "preact/hooks";
import { ChevronDown, Hash, Volume2 } from "lucide-preact";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import { PREVIEW_THEMES, type PreviewTheme } from "../discord/Preview";
import { STYLES } from "../../lib/fancy-text";
import {
  DEFAULT_PATTERN, EMOJI_GROUPS, SEPARATORS, TEMPLATES, buildName, finalName, parseList, renderList, textChannelChanges,
  type CaseMode, type ChannelKind, type Pattern,
} from "../../lib/channel-names";
import "./ChannelNames.css";

const L = {
  de: {
    modes: { single: "Einzelner Kanal", list: "Liste / Vorlage" },
    modeLabel: "Modus",
    kind: "Kanaltyp",
    kinds: { text: "Textkanal", voice: "Sprachkanal", category: "Kategorie" } as Record<ChannelKind, string>,
    emoji: "Emoji",
    emojiHint: "Aus der Liste wählen oder selbst eintippen. Leer lassen für keins.",
    emojiGroup: "Emoji-Gruppe",
    pick: (e: string) => `Emoji ${e} wählen`,
    name: "Name",
    nameExample: "allgemein",
    pattern: "Muster",
    sep: "Trenner",
    spaced: "Leerzeichen um den Trenner",
    spacedHint: "In Textkanälen macht Discord daraus Bindestriche.",
    font: "Schrift",
    fontNone: "Normal",
    case: "Schreibweise",
    cases: { keep: "Original", lower: "klein", upper: "GROSS", title: "Titel" } as Record<CaseMode, string>,
    result: "Kanalname",
    resultHint: "So speichert Discord den Namen. Kopieren und beim Erstellen oder Bearbeiten des Kanals einfügen.",
    changed: "Discord ändert bei Textkanälen:",
    chUpper: "Großbuchstaben werden klein",
    chSpaces: "Leerzeichen werden zu Bindestrichen",
    chRemoved: (c: string) => `Diese Zeichen fliegen raus: ${c}`,
    textRule:
      "Textkanäle: Discord schreibt alles klein, macht aus Leerzeichen Bindestriche und entfernt die meisten Satzzeichen wie ! ? . , – Emojis, Trenner wie ┃ und Unicode-Schriften bleiben (𝐅𝐞𝐭𝐭 wird nicht klein). Sprachkanäle und Kategorien behalten Groß-/Kleinschreibung und Leerzeichen; Kategorien zeigt Discord in GROSSBUCHSTABEN an. Unsere Umrechnung ist eine Näherung.",
    list: "Kanäle",
    listHint: "Eine Zeile pro Kanal. Zeile mit „:“ am Ende = Kategorie, „+“ am Anfang = Sprachkanal. Ein Emoji am Zeilenanfang wird übernommen.",
    templates: "Vorlagen",
    defaultEmoji: "Emoji für Zeilen ohne Emoji",
    decorate: "Kategorien auch mit Emoji und Trenner",
    output: "Fertige Namen",
    copyAll: "Alle kopieren",
    reset: "Zurücksetzen",
    preview: "Vorschau der Kanalliste",
    previewNote: "Vorschau – kann leicht vom echten Discord abweichen.",
    server: "Mein Server",
    demo: { cat: "Info", a: "regeln", b: "ankündigungen", v: "Lounge" },
    counted: (n: number) => `${n} Kanäle`,
    kindShort: { text: "#", voice: "🔊", category: "Kat." } as Record<ChannelKind, string>,
  },
  en: {
    modes: { single: "Single channel", list: "List / template" },
    modeLabel: "Mode",
    kind: "Channel type",
    kinds: { text: "Text channel", voice: "Voice channel", category: "Category" } as Record<ChannelKind, string>,
    emoji: "Emoji",
    emojiHint: "Pick one or type your own. Leave empty for none.",
    emojiGroup: "Emoji group",
    pick: (e: string) => `Pick emoji ${e}`,
    name: "Name",
    nameExample: "general",
    pattern: "Pattern",
    sep: "Separator",
    spaced: "Spaces around the separator",
    spacedHint: "Discord turns them into dashes in text channels.",
    font: "Font",
    fontNone: "Normal",
    case: "Case",
    cases: { keep: "Original", lower: "lower", upper: "UPPER", title: "Title" } as Record<CaseMode, string>,
    result: "Channel name",
    resultHint: "This is how Discord saves the name. Copy it and paste it when you create or edit the channel.",
    changed: "Discord changes in text channels:",
    chUpper: "Capital letters become lowercase",
    chSpaces: "Spaces become dashes",
    chRemoved: (c: string) => `These characters get removed: ${c}`,
    textRule:
      "Text channels: Discord lowercases everything, turns spaces into dashes and removes most punctuation like ! ? . , – emojis, separators like ┃ and Unicode fonts stay (𝐁𝐨𝐥𝐝 is not lowercased). Voice channels and categories keep case and spaces; Discord shows categories in UPPERCASE. Our conversion is an approximation.",
    list: "Channels",
    listHint: "One channel per line. A line ending in “:” is a category, a leading “+” makes a voice channel. A leading emoji is used.",
    templates: "Templates",
    defaultEmoji: "Emoji for lines without one",
    decorate: "Decorate categories with emoji and separator too",
    output: "Finished names",
    copyAll: "Copy all",
    reset: "Reset",
    preview: "Channel list preview",
    previewNote: "Preview – may differ slightly from Discord.",
    server: "My server",
    demo: { cat: "Info", a: "rules", b: "announcements", v: "Lounge" },
    counted: (n: number) => `${n} channels`,
    kindShort: { text: "#", voice: "🔊", category: "Cat." } as Record<ChannelKind, string>,
  },
};

type Mode = "single" | "list";
const SEP_SAMPLE = "🎮";

export default function ChannelNames({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [mode, setMode] = useState<Mode>("single");
  const [kind, setKind] = useState<ChannelKind>("text");
  const [emoji, setEmoji] = useState("💬");
  const [group, setGroup] = useState("chat");
  const [name, setName] = useState(s.nameExample);
  const [pattern, setPattern] = useState<Pattern>(DEFAULT_PATTERN);
  const [listText, setListText] = useState(TEMPLATES[0].list[lang]);
  const [defEmoji, setDefEmoji] = useState("✨");
  const [decorate, setDecorate] = useState(false);
  const [theme, setTheme] = useState<PreviewTheme>("dark");

  const set = (p: Partial<Pattern>) => setPattern((x) => ({ ...x, ...p }));
  const raw = buildName(emoji, name, kind === "category" && !emoji ? { ...pattern, sep: "none" } : pattern, lang);
  const final = finalName(raw, kind);
  const changes = kind === "text" ? textChannelChanges(raw) : null;
  const hasChanges = !!changes && (changes.upper || changes.spaces || changes.removed.length > 0);

  const items = useMemo(() => renderList(parseList(listText), pattern, defEmoji, lang, decorate), [listText, pattern, defEmoji, lang, decorate]);
  const channelsOnly = items.filter((i) => i.kind !== "category");

  const demo = useMemo(() => {
    const mk = (k: ChannelKind, e: string, n: string) => ({ kind: k, final: finalName(buildName(e, n, pattern, lang), k) });
    return { a: mk("text", "📜", s.demo.a), b: mk("text", "📢", s.demo.b), v: mk("voice", "🎧", s.demo.v) };
  }, [pattern, lang]);

  const reset = () => {
    setPattern(DEFAULT_PATTERN);
    setEmoji("💬");
    setName(s.nameExample);
    setKind("text");
    setListText(TEMPLATES[0].list[lang]);
    setDefEmoji("✨");
    setDecorate(false);
  };

  const groupEmoji = EMOJI_GROUPS.find((g) => g.id === group)?.emoji ?? [];

  return (
    <div class="tool-layout split cn">
      <div class="stack">
        <div class="row cn-top">
          <div class="segmented" role="group" aria-label={s.modeLabel}>
            {(["single", "list"] as Mode[]).map((m) => (
              <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{s.modes[m]}</button>
            ))}
          </div>
          <button type="button" class="btn btn-sm btn-ghost" onClick={reset}>
            <Icon name="RefreshCw" size={15} /> {s.reset}
          </button>
        </div>

        {mode === "single" ? (
          <section class="panel stack" aria-label={s.modes.single}>
            <div class="field">
              <span class="label" id="cn-kind-l">{s.kind}</span>
              <div class="segmented" role="group" aria-labelledby="cn-kind-l">
                {(["text", "voice", "category"] as ChannelKind[]).map((k) => (
                  <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{s.kinds[k]}</button>
                ))}
              </div>
            </div>
            <div class="cn-emoji-row">
              <div class="field cn-emoji-field">
                <label for="cn-emoji">{s.emoji}</label>
                <input id="cn-emoji" class="input cn-emoji-input" value={emoji} autocomplete="off" maxLength={16} onInput={(e) => setEmoji((e.target as HTMLInputElement).value)} />
              </div>
              <div class="field cn-name-field">
                <label for="cn-name">{s.name}</label>
                <input id="cn-name" class="input" value={name} autocomplete="off" spellcheck={false} maxLength={100} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
              </div>
            </div>
            <div class="field">
              <div class="segmented cn-groups" role="group" aria-label={s.emojiGroup}>
                {EMOJI_GROUPS.map((g) => (
                  <button type="button" key={g.id} aria-pressed={group === g.id} onClick={() => setGroup(g.id)}>{g.name[lang]}</button>
                ))}
              </div>
              <div class="cn-emoji-grid">
                {groupEmoji.map((e) => (
                  <button type="button" key={e} class={emoji === e ? "cn-emo is-on" : "cn-emo"} aria-label={s.pick(e)} aria-pressed={emoji === e} onClick={() => setEmoji(e)}>
                    {e}
                  </button>
                ))}
                <button type="button" class={!emoji ? "cn-emo is-on" : "cn-emo"} aria-pressed={!emoji} aria-label={lang === "de" ? "Kein Emoji" : "No emoji"} onClick={() => setEmoji("")}>
                  <Icon name="X" size={16} />
                </button>
              </div>
              <span class="hint">{s.emojiHint}</span>
            </div>
          </section>
        ) : (
          <section class="panel stack" aria-label={s.modes.list}>
            <div class="field">
              <span class="label">{s.templates}</span>
              <div class="row">
                {TEMPLATES.map((t) => (
                  <button type="button" class="btn btn-sm" key={t.id} aria-pressed={listText === t.list[lang]} onClick={() => setListText(t.list[lang])}>
                    {t.name[lang]}
                  </button>
                ))}
              </div>
            </div>
            <div class="field">
              <label for="cn-list">{s.list}</label>
              <textarea id="cn-list" class="textarea cn-list" value={listText} spellcheck={false} rows={10} aria-describedby="cn-list-h" onInput={(e) => setListText((e.target as HTMLTextAreaElement).value)} />
              <span class="hint" id="cn-list-h">{s.listHint}</span>
            </div>
            <div class="cn-emoji-row">
              <div class="field cn-emoji-field">
                <label for="cn-def">{s.defaultEmoji}</label>
                <input id="cn-def" class="input cn-emoji-input" value={defEmoji} autocomplete="off" maxLength={16} onInput={(e) => setDefEmoji((e.target as HTMLInputElement).value)} />
              </div>
            </div>
            <label class="check">
              <input type="checkbox" checked={decorate} onChange={(e) => setDecorate((e.target as HTMLInputElement).checked)} />
              <span>{s.decorate}</span>
            </label>
          </section>
        )}

        <section class="panel stack" aria-labelledby="cn-pat">
          <h2 class="panel-title" id="cn-pat">{s.pattern}</h2>
          <div class="field">
            <span class="label" id="cn-sep-l">{s.sep}</span>
            <div class="cn-seps" role="group" aria-labelledby="cn-sep-l">
              {SEPARATORS.map((sep) => (
                <button
                  type="button"
                  key={sep.id}
                  class="cn-sep"
                  aria-pressed={pattern.sep === sep.id}
                  aria-label={sep.id === "none" ? (lang === "de" ? "Kein Trenner" : "No separator") : undefined}
                  onClick={() => set({ sep: sep.id })}
                >
                  {sep.id === "none" ? <Icon name="X" size={15} /> : sep.left ? `${sep.left}${SEP_SAMPLE}${sep.right}` : sep.mid}
                </button>
              ))}
            </div>
          </div>
          <label class="check">
            <input type="checkbox" checked={pattern.spaced} onChange={(e) => set({ spaced: (e.target as HTMLInputElement).checked })} />
            <span>
              {s.spaced}
              <span class="hint cn-block">{s.spacedHint}</span>
            </span>
          </label>
          <div class="cn-fc">
            <div class="field">
              <label for="cn-font">{s.font}</label>
              <select id="cn-font" class="select" value={pattern.font} onChange={(e) => set({ font: (e.target as HTMLSelectElement).value })}>
                <option value="">{s.fontNone}</option>
                {STYLES.map((st) => (
                  <option key={st.id} value={st.id}>{st.name[lang]}</option>
                ))}
              </select>
            </div>
            <div class="field">
              <span class="label" id="cn-case-l">{s.case}</span>
              <div class="segmented" role="group" aria-labelledby="cn-case-l">
                {(["keep", "lower", "upper", "title"] as CaseMode[]).map((c) => (
                  <button type="button" key={c} aria-pressed={pattern.caseMode === c} onClick={() => set({ caseMode: c })}>{s.cases[c]}</button>
                ))}
              </div>
            </div>
          </div>
          <p class="notice cn-rule">
            <Icon name="Info" size={16} />
            <span>{s.textRule}</span>
          </p>
        </section>
      </div>

      <div class="stack sticky">
        {mode === "single" ? (
          <div class="field">
            <span class="label">{s.result}</span>
            <div class="output cn-output">
              <code>{final || " "}</code>
              <CopyButton text={final} lang={lang} variant="primary" />
            </div>
            <span class="hint">{s.resultHint}</span>
            {hasChanges && changes && (
              <div class="notice cn-changes" aria-live="polite">
                <strong>{s.changed}</strong>
                <ul>
                  {changes.upper && <li>{s.chUpper}</li>}
                  {changes.spaces && <li>{s.chSpaces}</li>}
                  {changes.removed.length > 0 && <li>{s.chRemoved(changes.removed.join(" "))}</li>}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div class="field">
            <div class="cn-out-head">
              <span class="label">{s.output} <span class="hint">· {s.counted(channelsOnly.length)}</span></span>
              <CopyButton text={items.map((i) => i.final).join("\n")} lang={lang} size="sm" variant="primary" label={s.copyAll} />
            </div>
            <ul class="cn-outlist">
              {items.map((i, idx) => (
                <li key={idx} class={i.kind === "category" ? "is-cat" : undefined}>
                  <span class="cn-k" aria-hidden="true">{s.kindShort[i.kind]}</span>
                  <code>{i.final}</code>
                  <span class="sr-only">{s.kinds[i.kind]}</span>
                  <CopyButton text={i.final} lang={lang} size="sm" variant="icon" />
                </li>
              ))}
            </ul>
          </div>
        )}

        <section class="cn-preview" aria-label={s.preview}>
          <div class="dp-bar">
            <span class="dp-label">{s.preview}</span>
            <div class="segmented" role="group" aria-label="Theme">
              {PREVIEW_THEMES.map((t) => (
                <button type="button" key={t.id} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>
          <div class={`cn-side cn-t-${theme}`}>
            <div class="cn-server">
              {s.server}
              <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
            </div>
            <div class="cn-channels">
              {mode === "single" ? (
                kind === "category" ? (
                  <>
                    <Cat name={final} />
                    <Chan kind="text" name={demo.a.final} />
                    <Chan kind="text" name={demo.b.final} />
                    <Chan kind="voice" name={demo.v.final} />
                  </>
                ) : (
                  <>
                    <Cat name={s.demo.cat} />
                    <Chan kind="text" name={demo.a.final} />
                    <Chan kind="text" name={demo.b.final} />
                    <Chan kind={kind} name={final} selected />
                    {kind === "text" && <Chan kind="voice" name={demo.v.final} />}
                  </>
                )
              ) : (
                items.map((i, idx) => (i.kind === "category" ? <Cat key={idx} name={i.final} /> : <Chan key={idx} kind={i.kind} name={i.final} selected={idx === items.findIndex((x) => x.kind === "text")} />))
              )}
            </div>
          </div>
          <p class="hint dp-note">{s.previewNote}</p>
        </section>
      </div>
    </div>
  );
}

function Cat({ name }: { name: string }) {
  return (
    <div class="cn-cat">
      <ChevronDown size={12} strokeWidth={2.5} aria-hidden="true" />
      <span>{name}</span>
    </div>
  );
}

function Chan({ kind, name, selected }: { kind: ChannelKind; name: string; selected?: boolean }) {
  return (
    <div class={selected ? "cn-ch is-sel" : "cn-ch"}>
      {kind === "voice" ? <Volume2 size={20} strokeWidth={1.75} aria-hidden="true" /> : <Hash size={20} strokeWidth={1.75} aria-hidden="true" />}
      <span>{name}</span>
    </div>
  );
}

