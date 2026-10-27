import { useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import PermissionPicker from "./PermissionPicker";
import { parseBitfield } from "../../lib/bitfield";
import {
  CHANNEL_TYPES,
  CONTEXTS,
  INTEGRATION_TYPES,
  LOCALES,
  MAX_TOTAL_CHARS,
  OPTION_TYPES,
  commandPayload,
  exampleCommand,
  hasChoices,
  importCommand,
  isSub,
  newOption,
  toCurl,
  toDiscordJs,
  totalChars,
  validateCommand,
  type CommandDraft,
  type CommandType,
  type Loc,
  type OptionDraft,
  type OptionType,
} from "../../lib/slash-commands";
import "./SlashCommands.css";

const L = {
  de: {
    edit: "Bearbeiten",
    preview: "Vorschau",
    view: "Ansicht",
    examples: "Beispiel",
    exRemind: "/remind – Optionen",
    exMod: "/mod – Unterbefehle",
    exUser: "Nutzer-Kontextmenü",
    exMessage: "Nachrichten-Kontextmenü",
    empty: "Leer anfangen",
    import: "JSON importieren",
    importLabel: "Befehls-JSON einfügen",
    importHint: "Ein Objekt oder ein Array aus GET /applications/{id}/commands. Nur das erste wird geladen.",
    importDo: "Laden",
    importCancel: "Abbrechen",
    importOk: "Befehl geladen",
    importJson: "Das ist kein gültiges JSON.",
    importShape: "Kein Befehl gefunden – es fehlt ein „name“.",
    importArray: (n: number) => `Array mit ${n} Befehlen – nur der erste wurde geladen.`,
    importDm: "dm_permission ist veraltet und wurde in contexts umgewandelt.",
    importEntry: "PRIMARY_ENTRY_POINT (Typ 4) wird nicht unterstützt und als Slash-Befehl geladen.",
    command: "Befehl",
    type: "Art",
    t1: "Slash-Befehl",
    t2: "Nutzer-Menü",
    t3: "Nachrichten-Menü",
    typeHint: {
      1: "Erscheint, wenn man / tippt.",
      2: "Rechtsklick auf einen Nutzer → Apps.",
      3: "Rechtsklick auf eine Nachricht → Apps.",
    } as Record<CommandType, string>,
    name: "Name",
    nameHintChat: "1–32 Zeichen, klein, keine Leerzeichen. Erlaubt: Buchstaben, Ziffern, - und _.",
    nameHintCtx: "1–32 Zeichen, Groß-/Kleinschreibung und Leerzeichen erlaubt.",
    desc: "Beschreibung",
    languages: "Übersetzungen",
    languagesHint: "Der Name oben ist die Standard-Sprache (meist Englisch). Wähle Sprachen, in denen Discord eine Übersetzung zeigen soll.",
    addLang: "Sprache hinzufügen",
    options: "Optionen",
    noOptions: "Noch keine Optionen.",
    addOption: "Option hinzufügen",
    addSub: "Unterbefehl hinzufügen",
    addGroup: "Gruppe hinzufügen",
    optType: "Typ",
    required: "Pflichtfeld",
    autocomplete: "Autocomplete (Vorschläge vom Bot)",
    choices: "Feste Auswahl",
    choiceName: "Anzeigename",
    choiceValue: "Wert",
    addChoice: "Auswahl hinzufügen",
    minValue: "Minimum",
    maxValue: "Maximum",
    minLength: "Min. Länge",
    maxLength: "Max. Länge",
    channelTypes: "Erlaubte Kanaltypen",
    channelTypesHint: "Nichts gewählt = alle.",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    remove: "Entfernen",
    settings: "Einstellungen",
    perms: "Wer darf den Befehl standardmäßig nutzen?",
    permEveryone: "Alle",
    permAdmins: "Nur Admins",
    permCustom: "Mit bestimmten Rechten",
    permHint: "Server-Admins können das später unter Integrationen ändern. Das ist nur der Standard.",
    scope: "Registrierung",
    global: "Global",
    guild: "Nur ein Server",
    scopeHint: "Server-Befehle sind sofort da und gut zum Testen. Installationsart und Orte gelten nur für globale Befehle.",
    install: "Installationsart",
    contexts: "Nutzbar in",
    nsfw: "Altersbeschränkt (NSFW)",
    nsfwHint: "Nur in NSFW-Kanälen und für Nutzer ab 18 sichtbar.",
    issues: "Prüfung",
    valid: "Alles gültig – bereit zum Registrieren.",
    chars: "Zeichen",
    output: "Ausgabe",
    curlHint: "Ersetze APPLICATION_ID und setze DISCORD_TOKEN als Umgebungsvariable. Gib deinen Token nie in eine Website ein – auch nicht in diese.",
    previewLocale: "Vorschau-Sprache",
    base: "Standard",
    pickerTitle: "Befehle passend zu",
    apps: "Apps",
    optional: (n: number) => `+${n} optionale`,
    previewNote: "Vereinfachte Vorschau in unserem Stil – nicht pixelgenau.",
    reset: "Zurücksetzen",
    resetDone: "Beispiel geladen",
    optionN: (n: number) => `Option ${n}`,
  },
  en: {
    edit: "Edit",
    preview: "Preview",
    view: "View",
    examples: "Example",
    exRemind: "/remind – options",
    exMod: "/mod – subcommands",
    exUser: "User context menu",
    exMessage: "Message context menu",
    empty: "Start empty",
    import: "Import JSON",
    importLabel: "Paste command JSON",
    importHint: "An object or an array from GET /applications/{id}/commands. Only the first one is loaded.",
    importDo: "Load",
    importCancel: "Cancel",
    importOk: "Command loaded",
    importJson: "That is not valid JSON.",
    importShape: "No command found – “name” is missing.",
    importArray: (n: number) => `Array with ${n} commands – only the first was loaded.`,
    importDm: "dm_permission is deprecated and was converted to contexts.",
    importEntry: "PRIMARY_ENTRY_POINT (type 4) is not supported and was loaded as a slash command.",
    command: "Command",
    type: "Kind",
    t1: "Slash command",
    t2: "User menu",
    t3: "Message menu",
    typeHint: {
      1: "Shows up when you type /.",
      2: "Right-click a user → Apps.",
      3: "Right-click a message → Apps.",
    } as Record<CommandType, string>,
    name: "Name",
    nameHintChat: "1–32 characters, lowercase, no spaces. Letters, digits, - and _.",
    nameHintCtx: "1–32 characters, mixed case and spaces allowed.",
    desc: "Description",
    languages: "Translations",
    languagesHint: "The name above is the default language (usually English). Pick languages Discord should show a translation for.",
    addLang: "Add language",
    options: "Options",
    noOptions: "No options yet.",
    addOption: "Add option",
    addSub: "Add subcommand",
    addGroup: "Add group",
    optType: "Type",
    required: "Required",
    autocomplete: "Autocomplete (suggestions from the bot)",
    choices: "Fixed choices",
    choiceName: "Display name",
    choiceValue: "Value",
    addChoice: "Add choice",
    minValue: "Minimum",
    maxValue: "Maximum",
    minLength: "Min length",
    maxLength: "Max length",
    channelTypes: "Allowed channel types",
    channelTypesHint: "None picked = all.",
    moveUp: "Move up",
    moveDown: "Move down",
    remove: "Remove",
    settings: "Settings",
    perms: "Who can use the command by default?",
    permEveryone: "Everyone",
    permAdmins: "Admins only",
    permCustom: "With specific permissions",
    permHint: "Server admins can change this later under Integrations. This is only the default.",
    scope: "Registration",
    global: "Global",
    guild: "One server only",
    scopeHint: "Guild commands show up instantly and are good for testing. Install type and contexts only apply to global commands.",
    install: "Install type",
    contexts: "Usable in",
    nsfw: "Age-restricted (NSFW)",
    nsfwHint: "Only visible in NSFW channels and to users 18+.",
    issues: "Validation",
    valid: "All valid – ready to register.",
    chars: "characters",
    output: "Output",
    curlHint: "Replace APPLICATION_ID and set DISCORD_TOKEN as an environment variable. Never paste your token into a website – this one included.",
    previewLocale: "Preview language",
    base: "Default",
    pickerTitle: "Commands matching",
    apps: "Apps",
    optional: (n: number) => `+${n} optional`,
    previewNote: "Simplified preview in our own style – not pixel-perfect.",
    reset: "Reset",
    resetDone: "Example loaded",
    optionN: (n: number) => `Option ${n}`,
  },
};

const typeName = (t: OptionType, lang: Lang) => OPTION_TYPES.find((x) => x.type === t)![lang];

// ------------------------------------------------------------ small inputs

function Counter({ value, max }: { value: string; max: number }) {
  const n = [...value.trim()].length;
  return <span class={`sc-count ${n > max ? "is-over" : ""}`}>{n}/{max}</span>;
}

function TextField({ id, label, value, onInput, hint, max, mono, placeholder, invalid }: {
  id: string; label: string; value: string; onInput: (v: string) => void; hint?: string; max?: number; mono?: boolean; placeholder?: string; invalid?: boolean;
}) {
  return (
    <div class="field">
      <div class="sc-label-row">
        <label for={id}>{label}</label>
        {max && <Counter value={value} max={max} />}
      </div>
      <input id={id} class={`input ${mono ? "mono" : ""}`} type="text" value={value} autocomplete="off" spellcheck={!mono} placeholder={placeholder}
        aria-invalid={invalid ? "true" : undefined}
        onInput={(e) => onInput((e.target as HTMLInputElement).value)} />
      {hint && <span class="hint">{hint}</span>}
    </div>
  );
}

function LocFields({ idBase, locales, nameLoc, descLoc, onName, onDesc, withDesc, lang }: {
  idBase: string; locales: string[]; nameLoc: Loc; descLoc?: Loc; onName: (l: Loc) => void; onDesc?: (l: Loc) => void; withDesc: boolean; lang: Lang;
}) {
  if (!locales.length) return null;
  const s = L[lang];
  return (
    <div class="sc-loc">
      {locales.map((loc) => (
        <div class="sc-loc-row" key={loc}>
          <span class="sc-loc-tag mono">{loc}</span>
          <div class="sc-loc-fields">
            <input class="input mono" aria-label={`${s.name} (${loc})`} id={`${idBase}-n-${loc}`} type="text" autocomplete="off" spellcheck={false}
              value={nameLoc[loc] ?? ""} placeholder={s.name}
              onInput={(e) => onName({ ...nameLoc, [loc]: (e.target as HTMLInputElement).value })} />
            {withDesc && descLoc && onDesc && (
              <input class="input" aria-label={`${s.desc} (${loc})`} id={`${idBase}-d-${loc}`} type="text" autocomplete="off"
                value={descLoc[loc] ?? ""} placeholder={s.desc}
                onInput={(e) => onDesc({ ...descLoc, [loc]: (e.target as HTMLInputElement).value })} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ option editor

function allowedTypes(parent: "root" | "group" | "sub", rootHasSubs: boolean, rootHasPlain: boolean): OptionType[] {
  if (parent === "group") return [1];
  if (parent === "sub") return [3, 4, 5, 6, 7, 8, 9, 10, 11];
  if (rootHasSubs && !rootHasPlain) return [1, 2];
  if (rootHasPlain && !rootHasSubs) return [3, 4, 5, 6, 7, 8, 9, 10, 11];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}

function OptionEditor({ o, onChange, onRemove, onMove, index, count, parent, locales, lang, siblings }: {
  o: OptionDraft; onChange: (o: OptionDraft) => void; onRemove: () => void; onMove: (d: -1 | 1) => void;
  index: number; count: number; parent: "root" | "group" | "sub"; locales: string[]; lang: Lang; siblings: OptionDraft[];
}) {
  const s = L[lang];
  const set = (p: Partial<OptionDraft>) => onChange({ ...o, ...p });
  const id = `sc-${o.uid}`;
  const others = siblings.filter((x) => x.uid !== o.uid);
  const types = allowedTypes(parent, others.some((x) => isSub(x.type)), others.some((x) => !isSub(x.type)));
  const childParent = o.type === 2 ? "group" : "sub";
  const updateChild = (i: number, c: OptionDraft) => set({ options: o.options.map((x, j) => (j === i ? c : x)) });
  const moveChild = (i: number, d: -1 | 1) => {
    const arr = [...o.options];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    set({ options: arr });
  };

  return (
    <details class={`sc-opt sc-opt-${isSub(o.type) ? "sub" : "plain"}`} open>
      <summary class="sc-opt-head">
        <span class="sc-opt-title">
          <span class="sc-opt-type">{typeName(o.type, lang)}</span>
          <code class="mono">{o.name || s.optionN(index + 1)}</code>
          {o.required && <span class="sc-req">*</span>}
        </span>
        <span class="sc-opt-actions" onClick={(e) => e.preventDefault()}>
          <button type="button" class="btn btn-sm btn-ghost btn-icon" aria-label={s.moveUp} disabled={index === 0} onClick={() => onMove(-1)}>
            <Icon name="ArrowUp" size={15} />
          </button>
          <button type="button" class="btn btn-sm btn-ghost btn-icon" aria-label={s.moveDown} disabled={index === count - 1} onClick={() => onMove(1)}>
            <Icon name="ArrowDown" size={15} />
          </button>
          <button type="button" class="btn btn-sm btn-ghost btn-icon sc-del" aria-label={`${s.remove}: ${o.name}`} onClick={onRemove}>
            <Icon name="Trash2" size={15} />
          </button>
        </span>
      </summary>
      <div class="sc-opt-body stack">
        <div class="grid-2">
          <div class="field">
            <label for={`${id}-type`}>{s.optType}</label>
            <select id={`${id}-type`} class="select" value={o.type}
              onChange={(e) => {
                const t = Number((e.target as HTMLSelectElement).value) as OptionType;
                set({ type: t, options: isSub(t) ? o.options.filter((c) => (t === 2 ? c.type === 1 : !isSub(c.type))) : [], choices: hasChoices(t) ? o.choices : [], required: isSub(t) ? false : o.required });
              }}>
              {types.map((t) => (
                <option key={t} value={t}>{typeName(t, lang)} ({t})</option>
              ))}
            </select>
          </div>
          <TextField id={`${id}-name`} label={s.name} value={o.name} max={32} mono onInput={(v) => set({ name: v })} />
        </div>
        <TextField id={`${id}-desc`} label={s.desc} value={o.description} max={100} onInput={(v) => set({ description: v })} />
        <LocFields idBase={id} locales={locales} nameLoc={o.nameLoc} descLoc={o.descLoc} withDesc lang={lang}
          onName={(l) => set({ nameLoc: l })} onDesc={(l) => set({ descLoc: l })} />

        {!isSub(o.type) && (
          <label class="check">
            <input type="checkbox" checked={o.required} onChange={(e) => set({ required: (e.target as HTMLInputElement).checked })} />
            <span>{s.required}</span>
          </label>
        )}

        {(o.type === 4 || o.type === 10) && (
          <div class="grid-2">
            <TextField id={`${id}-min`} label={s.minValue} value={o.minValue} mono onInput={(v) => set({ minValue: v })} />
            <TextField id={`${id}-max`} label={s.maxValue} value={o.maxValue} mono onInput={(v) => set({ maxValue: v })} />
          </div>
        )}
        {o.type === 3 && (
          <div class="grid-2">
            <TextField id={`${id}-minl`} label={s.minLength} value={o.minLength} mono placeholder="0" onInput={(v) => set({ minLength: v })} />
            <TextField id={`${id}-maxl`} label={s.maxLength} value={o.maxLength} mono placeholder="6000" onInput={(v) => set({ maxLength: v })} />
          </div>
        )}
        {o.type === 7 && (
          <fieldset class="sc-fieldset">
            <legend class="label">{s.channelTypes}</legend>
            <div class="sc-chips">
              {CHANNEL_TYPES.map((c) => {
                const on = o.channelTypes.includes(c.id);
                return (
                  <button type="button" key={c.id} class="sc-chip" aria-pressed={on}
                    onClick={() => set({ channelTypes: on ? o.channelTypes.filter((x) => x !== c.id) : [...o.channelTypes, c.id].sort((a, b) => a - b) })}>
                    {c[lang]}
                  </button>
                );
              })}
            </div>
            <span class="hint">{s.channelTypesHint}</span>
          </fieldset>
        )}
        {hasChoices(o.type) && (
          <div class="stack sc-choices">
            {o.choices.length === 0 && (
              <label class="check">
                <input type="checkbox" checked={o.autocomplete} onChange={(e) => set({ autocomplete: (e.target as HTMLInputElement).checked })} />
                <span>{s.autocomplete}</span>
              </label>
            )}
            {!o.autocomplete && (
              <fieldset class="sc-fieldset">
                <legend class="label">{s.choices} ({o.choices.length}/25)</legend>
                {o.choices.map((c, i) => (
                  <div class="sc-choice" key={i}>
                    <input class="input" aria-label={`${s.choiceName} ${i + 1}`} value={c.name} placeholder={s.choiceName}
                      onInput={(e) => set({ choices: o.choices.map((x, j) => (j === i ? { ...x, name: (e.target as HTMLInputElement).value } : x)) })} />
                    <input class="input mono" aria-label={`${s.choiceValue} ${i + 1}`} value={c.value} placeholder={s.choiceValue}
                      inputMode={o.type === 3 ? "text" : "decimal"}
                      onInput={(e) => set({ choices: o.choices.map((x, j) => (j === i ? { ...x, value: (e.target as HTMLInputElement).value } : x)) })} />
                    <button type="button" class="btn btn-sm btn-ghost btn-icon sc-del" aria-label={`${s.remove}: ${c.name}`}
                      onClick={() => set({ choices: o.choices.filter((_, j) => j !== i) })}>
                      <Icon name="X" size={15} />
                    </button>
                    {locales.map((loc) => (
                      <input key={loc} class="input sc-choice-loc" aria-label={`${s.choiceName} ${i + 1} (${loc})`} value={c.nameLoc[loc] ?? ""} placeholder={`${s.choiceName} (${loc})`}
                        onInput={(e) => set({ choices: o.choices.map((x, j) => (j === i ? { ...x, nameLoc: { ...x.nameLoc, [loc]: (e.target as HTMLInputElement).value } } : x)) })} />
                    ))}
                  </div>
                ))}
                <button type="button" class="btn btn-sm" disabled={o.choices.length >= 25}
                  onClick={() => set({ choices: [...o.choices, { name: "", nameLoc: {}, value: "" }], autocomplete: false })}>
                  <Icon name="Plus" size={15} />
                  {s.addChoice}
                </button>
              </fieldset>
            )}
          </div>
        )}

        {isSub(o.type) && (
          <div class="sc-children stack">
            {o.options.map((c, i) => (
              <OptionEditor key={c.uid} o={c} index={i} count={o.options.length} parent={childParent} locales={locales} lang={lang} siblings={o.options}
                onChange={(x) => updateChild(i, x)} onMove={(d) => moveChild(i, d)}
                onRemove={() => set({ options: o.options.filter((_, j) => j !== i) })} />
            ))}
            <button type="button" class="btn btn-sm sc-add" disabled={o.options.length >= 25}
              onClick={() => set({ options: [...o.options, { ...newOption(o.type === 2 ? 1 : 3), required: false }] })}>
              <Icon name="Plus" size={15} />
              {o.type === 2 ? s.addSub : s.addOption}
            </button>
          </div>
        )}
      </div>
    </details>
  );
}

// ------------------------------------------------------------ preview

function locName(base: string, loc: Loc, locale: string) {
  return (locale && loc[locale]?.trim()) || base.trim();
}

function Preview({ c, locale, lang }: { c: CommandDraft; locale: string; lang: Lang }) {
  const s = L[lang];
  if (c.type !== 1) {
    return (
      <div class="sc-pv sc-pv-menu" aria-label={s.preview}>
        <div class="sc-pv-ctx">
          <div class="sc-pv-ctx-item is-muted">{c.type === 2 ? (lang === "de" ? "Profil" : "Profile") : (lang === "de" ? "Antworten" : "Reply")}</div>
          <div class="sc-pv-ctx-item is-muted">{lang === "de" ? "Kopieren" : "Copy"}</div>
          <div class="sc-pv-ctx-item is-open">
            {s.apps}
            <Icon name="ChevronRight" size={14} />
          </div>
        </div>
        <div class="sc-pv-ctx sc-pv-sub">
          <div class="sc-pv-ctx-item is-active">{locName(c.name, c.nameLoc, locale) || "…"}</div>
        </div>
      </div>
    );
  }
  const name = locName(c.name, c.nameLoc, locale) || "…";
  type Entry = { path: string; desc: string; opts: OptionDraft[] };
  const entries: Entry[] = [];
  const hasSubs = c.options.some((o) => isSub(o.type));
  if (!hasSubs) entries.push({ path: `/${name}`, desc: locName(c.description, c.descLoc, locale), opts: c.options });
  for (const o of c.options) {
    if (o.type === 1) entries.push({ path: `/${name} ${locName(o.name, o.nameLoc, locale)}`, desc: locName(o.description, o.descLoc, locale), opts: o.options });
    if (o.type === 2)
      for (const sub of o.options)
        entries.push({ path: `/${name} ${locName(o.name, o.nameLoc, locale)} ${locName(sub.name, sub.nameLoc, locale)}`, desc: locName(sub.description, sub.descLoc, locale), opts: sub.options });
  }
  const first = entries[0];
  return (
    <div class="sc-pv" aria-label={s.preview}>
      <div class="sc-pv-picker">
        <div class="sc-pv-picker-head">
          {s.pickerTitle} <strong>/{name}</strong>
        </div>
        <ul>
          {entries.slice(0, 8).map((e, i) => {
            const req = e.opts.filter((o) => o.required);
            const opt = e.opts.length - req.length;
            return (
              <li key={i} class={i === 0 ? "is-active" : ""}>
                <span class="sc-pv-icon" aria-hidden="true">
                  <Icon name="SquareSlash" size={16} />
                </span>
                <span class="sc-pv-main">
                  <span class="sc-pv-line">
                    <span class="sc-pv-cmd">{e.path}</span>
                    {req.map((o) => (
                      <span class="sc-pv-arg" key={o.uid}>{locName(o.name, o.nameLoc, locale)}</span>
                    ))}
                    {opt > 0 && <span class="sc-pv-more">{s.optional(opt)}</span>}
                  </span>
                  <span class="sc-pv-desc">{e.desc}</span>
                </span>
                <span class="sc-pv-app">{lang === "de" ? "Dein Bot" : "Your bot"}</span>
              </li>
            );
          })}
        </ul>
      </div>
      {first && (
        <div class="sc-pv-input">
          <span class="sc-pv-cmd">{first.path}</span>
          {first.opts.map((o) => (
            <span class={`sc-pv-field ${o.required ? "" : "is-opt"}`} key={o.uid}>
              {locName(o.name, o.nameLoc, locale)}:
              <span class="sc-pv-type">{typeName(o.type, lang)}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ main

type Tab = "json" | "djs" | "curl";

export default function SlashCommands({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [c, setC] = useState<CommandDraft>(() => exampleCommand("remind"));
  const [locales, setLocales] = useState<string[]>(["de"]);
  const [tab, setTab] = useState<Tab>("json");
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [importing, setImporting] = useState(false);
  const [importText, setImportText] = useState("");
  const [importErr, setImportErr] = useState("");
  const [pvLocale, setPvLocale] = useState("");
  const [example, setExample] = useState("remind");

  const set = (p: Partial<CommandDraft>) => setC((cur) => ({ ...cur, ...p }));
  const issues = useMemo(() => validateCommand(c), [c]);
  const errors = issues.filter((i) => i.level === "error");
  const json = useMemo(() => JSON.stringify(commandPayload(c), null, 2), [c]);
  const code = tab === "json" ? json : tab === "djs" ? toDiscordJs(c) : toCurl(c);
  const chars = totalChars(c);
  const chat = c.type === 1;

  const loadExample = (id: string) => {
    setExample(id);
    setLocales(id === "empty" ? [] : ["de"]);
    if (id === "empty") setC({ ...exampleCommand("remind"), name: "", nameLoc: {}, description: "", descLoc: {}, options: [], integrationTypes: [0] });
    else setC(exampleCommand(id as "remind"));
  };

  const doImport = () => {
    const r = importCommand(importText);
    if (!r.ok) {
      setImportErr(r.error === "json" ? s.importJson : s.importShape);
      return;
    }
    setC(r.draft);
    const used = new Set<string>();
    const collect = (l: Loc) => Object.keys(l).forEach((k) => used.add(k));
    collect(r.draft.nameLoc);
    collect(r.draft.descLoc);
    const walk = (os: OptionDraft[]) => os.forEach((o) => { collect(o.nameLoc); collect(o.descLoc); o.choices.forEach((ch) => collect(ch.nameLoc)); walk(o.options); });
    walk(r.draft.options);
    setLocales(LOCALES.map((l) => l.id).filter((id) => used.has(id)));
    setImporting(false);
    setImportText("");
    setImportErr("");
    const notes = r.warnings.map((w) => (w.startsWith("array:") ? s.importArray(Number(w.split(":")[1])) : w === "dm_permission" ? s.importDm : s.importEntry));
    toast([s.importOk, ...notes].join(" · "));
  };

  const updateOpt = (i: number, o: OptionDraft) => set({ options: c.options.map((x, j) => (j === i ? o : x)) });
  const moveOpt = (i: number, d: -1 | 1) => {
    const arr = [...c.options];
    const j = i + d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    set({ options: arr });
  };
  const rootSubs = c.options.some((o) => isSub(o.type));
  const rootPlain = c.options.some((o) => !isSub(o.type));
  const permValue = (() => {
    const r = parseBitfield(c.permissions);
    return r.ok ? r.value : 0n;
  })();

  return (
    <div class="sc">
      <div class="sc-top">
        <div class="field sc-example">
          <label for="sc-example">{s.examples}</label>
          <select id="sc-example" class="select" value={example} onChange={(e) => loadExample((e.target as HTMLSelectElement).value)}>
            <option value="remind">{s.exRemind}</option>
            <option value="mod">{s.exMod}</option>
            <option value="user">{s.exUser}</option>
            <option value="message">{s.exMessage}</option>
            <option value="empty">{s.empty}</option>
          </select>
        </div>
        <button type="button" class="btn" aria-expanded={importing} onClick={() => setImporting(!importing)}>
          <Icon name="Upload" size={16} />
          {s.import}
        </button>
        <button type="button" class="btn btn-ghost" onClick={() => { loadExample("remind"); setLocales(["de"]); toast(s.resetDone); }}>
          <Icon name="RefreshCw" size={15} />
          {s.reset}
        </button>
        <div class="segmented sc-view" role="group" aria-label={s.view}>
          <button type="button" aria-pressed={view === "edit"} onClick={() => setView("edit")}>{s.edit}</button>
          <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}>
            {s.preview}
            {errors.length > 0 && <span class="sc-badge-err">{errors.length}</span>}
          </button>
        </div>
      </div>

      {importing && (
        <div class="panel stack">
          <div class="field">
            <label for="sc-import">{s.importLabel}</label>
            <textarea id="sc-import" class="textarea mono" spellcheck={false} value={importText} rows={6}
              placeholder='{ "name": "ping", "description": "Pong!" }'
              onInput={(e) => { setImportText((e.target as HTMLTextAreaElement).value); setImportErr(""); }} />
            <span class="hint" style={importErr ? { color: "var(--danger)" } : undefined} aria-live="polite">{importErr || s.importHint}</span>
          </div>
          <div class="row">
            <button type="button" class="btn btn-primary" onClick={doImport} disabled={!importText.trim()}>{s.importDo}</button>
            <button type="button" class="btn btn-ghost" onClick={() => setImporting(false)}>{s.importCancel}</button>
          </div>
        </div>
      )}

      <div class="tool-layout split sc-layout">
        <div class={`stack ${view === "preview" ? "sc-hide-mobile" : ""}`}>
          <section class="panel stack" aria-labelledby="sc-h-cmd">
            <h2 class="panel-title" id="sc-h-cmd">{s.command}</h2>
            <div class="field">
              <span class="label" id="sc-type-l">{s.type}</span>
              <div class="segmented sc-types" role="group" aria-labelledby="sc-type-l">
                {([1, 2, 3] as CommandType[]).map((t) => (
                  <button type="button" key={t} aria-pressed={c.type === t} onClick={() => set({ type: t })}>
                    {t === 1 ? s.t1 : t === 2 ? s.t2 : s.t3}
                  </button>
                ))}
              </div>
              <span class="hint">{s.typeHint[c.type]}</span>
            </div>
            <TextField id="sc-name" label={s.name} value={c.name} max={32} mono onInput={(v) => set({ name: v })} hint={chat ? s.nameHintChat : s.nameHintCtx} />
            {chat && <TextField id="sc-desc" label={s.desc} value={c.description} max={100} onInput={(v) => set({ description: v })} />}

            <details class="sc-langs" open={locales.length > 0 || undefined}>
              <summary>
                {s.languages}
                <span class="chip">{locales.length}</span>
              </summary>
              <p class="hint">{s.languagesHint}</p>
              <div class="sc-chips">
                {locales.map((l) => (
                  <button type="button" key={l} class="sc-chip" aria-pressed="true" aria-label={`${s.remove}: ${l}`} onClick={() => setLocales(locales.filter((x) => x !== l))}>
                    <span class="mono">{l}</span>
                    <Icon name="X" size={12} />
                  </button>
                ))}
                <select class="select sc-addlang" aria-label={s.addLang} value=""
                  onChange={(e) => { const v = (e.target as HTMLSelectElement).value; if (v) setLocales([...locales, v]); }}>
                  <option value="">+ {s.addLang}</option>
                  {LOCALES.filter((l) => !locales.includes(l.id)).map((l) => (
                    <option key={l.id} value={l.id}>{l.id} – {l.name}</option>
                  ))}
                </select>
              </div>
              <LocFields idBase="sc-cmd" locales={locales} nameLoc={c.nameLoc} descLoc={c.descLoc} withDesc={chat} lang={lang}
                onName={(l) => set({ nameLoc: l })} onDesc={(l) => set({ descLoc: l })} />
            </details>
          </section>

          {chat && (
            <section class="panel stack" aria-labelledby="sc-h-opts">
              <h2 class="panel-title" id="sc-h-opts">
                <span>{s.options}</span>
                <span class="sc-count">{c.options.length}/25</span>
              </h2>
              {c.options.length === 0 && <p class="hint">{s.noOptions}</p>}
              {c.options.map((o, i) => (
                <OptionEditor key={o.uid} o={o} index={i} count={c.options.length} parent="root" locales={locales} lang={lang} siblings={c.options}
                  onChange={(x) => updateOpt(i, x)} onMove={(d) => moveOpt(i, d)} onRemove={() => set({ options: c.options.filter((_, j) => j !== i) })} />
              ))}
              <div class="row">
                {!rootSubs && (
                  <button type="button" class="btn btn-sm sc-add" disabled={c.options.length >= 25} onClick={() => set({ options: [...c.options, newOption(3)] })}>
                    <Icon name="Plus" size={15} />
                    {s.addOption}
                  </button>
                )}
                {!rootPlain && (
                  <>
                    <button type="button" class="btn btn-sm sc-add" disabled={c.options.length >= 25} onClick={() => set({ options: [...c.options, newOption(1)] })}>
                      <Icon name="Plus" size={15} />
                      {s.addSub}
                    </button>
                    <button type="button" class="btn btn-sm sc-add" disabled={c.options.length >= 25} onClick={() => set({ options: [...c.options, { ...newOption(2), options: [newOption(1)] }] })}>
                      <Icon name="Plus" size={15} />
                      {s.addGroup}
                    </button>
                  </>
                )}
              </div>
            </section>
          )}

          <section class="panel stack" aria-labelledby="sc-h-set">
            <h2 class="panel-title" id="sc-h-set">{s.settings}</h2>
            <div class="field">
              <span class="label" id="sc-perm-l">{s.perms}</span>
              <div class="segmented" role="group" aria-labelledby="sc-perm-l">
                {(["everyone", "admins", "custom"] as const).map((m) => (
                  <button type="button" key={m} aria-pressed={c.permMode === m} onClick={() => set({ permMode: m })}>
                    {m === "everyone" ? s.permEveryone : m === "admins" ? s.permAdmins : s.permCustom}
                  </button>
                ))}
              </div>
              <span class="hint">{s.permHint}</span>
            </div>
            {c.permMode === "custom" && (
              <div class="stack">
                <TextField id="sc-perm" label="default_member_permissions" value={c.permissions} mono onInput={(v) => set({ permissions: v })} />
                <PermissionPicker value={permValue} onChange={(v) => set({ permissions: v.toString() })} lang={lang} compact showPresets={false} idPrefix="sc-pp" />
              </div>
            )}
            <div class="field">
              <span class="label" id="sc-scope-l">{s.scope}</span>
              <div class="segmented" role="group" aria-labelledby="sc-scope-l">
                <button type="button" aria-pressed={c.scope === "global"} onClick={() => set({ scope: "global" })}>{s.global}</button>
                <button type="button" aria-pressed={c.scope === "guild"} onClick={() => set({ scope: "guild" })}>{s.guild}</button>
              </div>
              <span class="hint">{s.scopeHint}</span>
            </div>
            {c.scope === "global" && (
              <div class="grid-2">
                <fieldset class="sc-fieldset">
                  <legend class="label">{s.install} <code class="mono sc-small">integration_types</code></legend>
                  {INTEGRATION_TYPES.map((t) => (
                    <label class="check" key={t.id}>
                      <input type="checkbox" checked={c.integrationTypes.includes(t.id)}
                        onChange={(e) => set({ integrationTypes: (e.target as HTMLInputElement).checked ? [...c.integrationTypes, t.id] : c.integrationTypes.filter((x) => x !== t.id) })} />
                      <span>{t[lang]} <code class="mono sc-small">{t.id}</code></span>
                    </label>
                  ))}
                </fieldset>
                <fieldset class="sc-fieldset">
                  <legend class="label">{s.contexts} <code class="mono sc-small">contexts</code></legend>
                  {CONTEXTS.map((t) => (
                    <label class="check" key={t.id}>
                      <input type="checkbox" checked={c.contexts.includes(t.id)}
                        onChange={(e) => set({ contexts: (e.target as HTMLInputElement).checked ? [...c.contexts, t.id] : c.contexts.filter((x) => x !== t.id) })} />
                      <span>{t[lang]} <code class="mono sc-small">{t.id}</code></span>
                    </label>
                  ))}
                </fieldset>
              </div>
            )}
            <label class="check">
              <input type="checkbox" checked={c.nsfw} onChange={(e) => set({ nsfw: (e.target as HTMLInputElement).checked })} />
              <span>
                {s.nsfw}
                <span class="hint sc-block">{s.nsfwHint}</span>
              </span>
            </label>
          </section>
        </div>

        <div class={`sticky stack ${view === "edit" ? "sc-hide-mobile" : ""}`}>
          <section class="panel stack" aria-labelledby="sc-h-pv">
            <div class="sc-pv-head">
              <h2 class="panel-title" id="sc-h-pv">{s.preview}</h2>
              {locales.length > 0 && (
                <select class="select sc-pv-locale" aria-label={s.previewLocale} value={pvLocale} onChange={(e) => setPvLocale((e.target as HTMLSelectElement).value)}>
                  <option value="">{s.base}</option>
                  {locales.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              )}
            </div>
            <Preview c={c} locale={pvLocale} lang={lang} />
            <span class="hint">{s.previewNote}</span>
          </section>

          <section class="panel stack" aria-labelledby="sc-h-iss" aria-live="polite">
            <h2 class="panel-title" id="sc-h-iss">
              <span>{s.issues}</span>
              <span class={`sc-count ${chars > MAX_TOTAL_CHARS ? "is-over" : ""}`}>{chars}/{MAX_TOTAL_CHARS} {s.chars}</span>
            </h2>
            {issues.length === 0 ? (
              <p class="sc-ok"><Icon name="Check" size={16} />{s.valid}</p>
            ) : (
              <ul class="sc-issues">
                {issues.map((i, k) => (
                  <li key={k} class={`sc-issue sc-issue-${i.level}`}>
                    <Icon name="TriangleAlert" size={15} />
                    <span>
                      <code class="mono">{i.path}</code>
                      {i[lang]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section class="panel stack" aria-labelledby="sc-h-out">
            <div class="sc-out-head">
              <h2 class="panel-title" id="sc-h-out">{s.output}</h2>
              <div class="segmented" role="group" aria-label={s.output}>
                <button type="button" aria-pressed={tab === "json"} onClick={() => setTab("json")}>JSON</button>
                <button type="button" aria-pressed={tab === "djs"} onClick={() => setTab("djs")}>discord.js</button>
                <button type="button" aria-pressed={tab === "curl"} onClick={() => setTab("curl")}>curl</button>
              </div>
            </div>
            {tab === "curl" && <p class="hint">{s.curlHint}</p>}
            <div class="sc-code">
              <pre class="mono">{code}</pre>
              <div class="sc-code-copy">
                <CopyButton text={code} lang={lang} size="sm" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

