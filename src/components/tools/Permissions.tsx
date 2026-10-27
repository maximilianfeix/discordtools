import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Output from "../ui/Output";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import PermissionPicker from "./PermissionPicker";
import { PARSE_ERRORS, bit, bitsOf, exceedsSafeInteger, parseBitfield, toHex, toggleBit } from "../../lib/bitfield";
import {
  ALL_PERMISSIONS,
  PERMISSION_BY_BIT,
  comparePermissions,
  decodePermissions,
  hasAdministrator,
  presetValue,
  toDiscordJsFlags,
} from "../../lib/permissions";
import { readHash, writeHash } from "../../lib/hash-state";
import "./Permissions.css";

const INVITE_PATH = { de: "/bot-einladen", en: "/en/bot-invite-link" } as const;

const L = {
  de: {
    modeCalc: "Rechner",
    modeCompare: "Vergleichen",
    mode: "Modus",
    pick: "Rechte auswählen",
    result: "Ergebnis",
    value: "Rechte-Wert",
    valueHint: "Zahl einfügen zum Entschlüsseln – Dezimal, Hex (0x…) oder Binär (0b…). Auch über 2^53 exakt.",
    hex: "Hexadezimal",
    count: (n: number) => (n === 1 ? "1 Recht" : `${n} Rechte`),
    risky: (n: number) => `${n} riskant`,
    twoFA: (n: number) => `${n} mit 2FA-Pflicht`,
    adminTitle: "Administrator gibt alle Rechte",
    adminText:
      "Mit Administrator ignoriert der Bot jede Kanal-Sperre und darf alles – auch Rollen und Webhooks ändern. Wird der Bot-Token geklaut, ist der ganze Server offen. Wähle lieber nur die Rechte, die der Bot wirklich nutzt.",
    adminOthers: "Die anderen Häkchen sind neben Administrator wirkungslos.",
    riskyTitle: "Riskante Rechte",
    riskyText: "Diese Rechte geben Macht über andere Mitglieder oder den Server. Nur aktivieren, wenn der Bot sie braucht.",
    twoFANote:
      "Auf Servern mit 2FA-Pflicht für Moderation braucht der Besitzer der App 2FA, damit diese Rechte wirken:",
    unknownTitle: "Unbekannte Bits",
    unknownText:
      "Diese Bits sind (noch) nicht dokumentiert. Sie bleiben im Wert erhalten, bis du sie entfernst – so geht nichts verloren, falls Discord neue Rechte einführt.",
    remove: "Entfernen",
    bit: "Bit",
    toInvite: "Im Bot-Einladungslink verwenden",
    share: "Link zu diesen Rechten",
    reset: "Zurücksetzen",
    resetDone: "Auf Beispiel zurückgesetzt",
    code: "Code-Schnipsel",
    unsafe:
      "Achtung: Der Wert ist größer als 2^53. In JavaScript als Number (statt String/BigInt) wird er gerundet – sende ihn immer als String.",
    empty: "Keine Rechte ausgewählt. Der Wert ist 0 – ein Bot bekommt damit keine eigene Rolle.",
    before: "Vorher (A)",
    after: "Nachher (B)",
    added: "Hinzugefügt",
    removed: "Entfernt",
    kept: "Unverändert",
    same: "Beide Werte sind gleich.",
    useB: "B in den Rechner übernehmen",
    useCurrent: "Aktuellen Wert als A",
    compareHint: "Füge zwei Rechte-Werte ein, z. B. alt und neu, und sieh, was sich ändert.",
    copied: "Übernommen",
    selected: "Ausgewählt",
    allPerms: "Alle Rechte",
    mobileValue: "Wert",
  },
  en: {
    modeCalc: "Calculator",
    modeCompare: "Compare",
    mode: "Mode",
    pick: "Pick permissions",
    result: "Result",
    value: "Permissions value",
    valueHint: "Paste a number to decode it – decimal, hex (0x…) or binary (0b…). Exact even above 2^53.",
    hex: "Hexadecimal",
    count: (n: number) => (n === 1 ? "1 permission" : `${n} permissions`),
    risky: (n: number) => `${n} risky`,
    twoFA: (n: number) => `${n} need 2FA`,
    adminTitle: "Administrator grants everything",
    adminText:
      "With Administrator the bot bypasses every channel lock and can do anything – including editing roles and webhooks. If the bot token leaks, the whole server is open. Prefer picking only what the bot really uses.",
    adminOthers: "Other ticks have no extra effect next to Administrator.",
    riskyTitle: "Risky permissions",
    riskyText: "These give power over other members or the server. Only enable them if the bot needs them.",
    twoFANote: "On servers that require 2FA for moderation, the app owner needs 2FA for these to work:",
    unknownTitle: "Unknown bits",
    unknownText:
      "These bits are not documented (yet). They stay in the value until you remove them, so nothing is lost if Discord adds new permissions.",
    remove: "Remove",
    bit: "Bit",
    toInvite: "Use in bot invite link",
    share: "Link to these permissions",
    reset: "Reset",
    resetDone: "Reset to example",
    code: "Code snippets",
    unsafe:
      "Careful: the value is above 2^53. As a JavaScript Number (instead of string/BigInt) it gets rounded – always send it as a string.",
    empty: "No permissions selected. The value is 0 – a bot gets no managed role with it.",
    before: "Before (A)",
    after: "After (B)",
    added: "Added",
    removed: "Removed",
    kept: "Unchanged",
    same: "Both values are equal.",
    useB: "Load B into the calculator",
    useCurrent: "Use current value as A",
    compareHint: "Paste two permission values, e.g. old and new, and see what changes.",
    copied: "Loaded",
    selected: "Selected",
    allPerms: "All permissions",
    mobileValue: "Value",
  },
};

const EXAMPLE = () => presetValue("basic");

function bitName(b: number, lang: Lang): string {
  const p = PERMISSION_BY_BIT.get(b);
  return p ? p.name[lang] : `${L[lang].bit} ${b}`;
}

function ValueInput({ id, label, text, onText, lang, hint }: { id: string; label: string; text: string; onText: (s: string) => void; lang: Lang; hint?: string }) {
  const r = parseBitfield(text);
  const err = !r.ok && r.error !== "empty" ? PARSE_ERRORS[lang][r.error] : "";
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <div class="pm-value-row">
        <input
          id={id}
          class="input mono pm-value"
          type="text"
          inputMode="text"
          autocomplete="off"
          spellcheck={false}
          value={text}
          aria-invalid={err ? "true" : undefined}
          aria-describedby={`${id}-hint`}
          onInput={(e) => onText((e.target as HTMLInputElement).value)}
        />
        <CopyButton text={r.ok ? r.value.toString() : ""} lang={lang} variant="icon" />
      </div>
      <span id={`${id}-hint`} class={err ? "hint pm-err" : "hint"} aria-live="polite">
        {err || hint}
      </span>
    </div>
  );
}

export default function Permissions({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [mode, setMode] = useState<"calc" | "compare">("calc");
  const [value, setValue] = useState<bigint>(EXAMPLE);
  const [text, setText] = useState(() => EXAMPLE().toString());
  const [aText, setAText] = useState(() => EXAMPLE().toString());
  const [bText, setBText] = useState(() => presetValue("moderation").toString());
  const touched = useRef(false);

  // Read shared state from the hash once.
  useEffect(() => {
    const h = readHash();
    const p = h.get("permissions") ?? h.get("p");
    if (p) {
      const r = parseBitfield(p);
      if (r.ok) {
        setValue(r.value);
        setText(r.value.toString());
        setAText(r.value.toString());
      }
    }
    const a = h.get("a");
    const b = h.get("b");
    if (a && b) {
      setAText(a);
      setBText(b);
      setMode("compare");
    }
  }, []);

  useEffect(() => {
    if (!touched.current) return;
    if (mode === "calc") writeHash({ permissions: value.toString() });
    else {
      const a = parseBitfield(aText);
      const b = parseBitfield(bText);
      writeHash({ a: a.ok ? a.value.toString() : null, b: b.ok ? b.value.toString() : null });
    }
  }, [value, mode, aText, bText]);

  const update = (v: bigint) => {
    touched.current = true;
    setValue(v);
    setText(v.toString());
  };

  const onText = (t: string) => {
    touched.current = true;
    setText(t);
    const r = parseBitfield(t);
    if (r.ok) setValue(r.value);
  };

  const decoded = useMemo(() => decodePermissions(value), [value]);
  const risky = decoded.known.filter((p) => p.dangerous);
  const twoFA = decoded.known.filter((p) => p.twoFA);
  const admin = hasAdministrator(value);
  const dec = value.toString();
  const inviteHref = `${INVITE_PATH[lang]}#permissions=${dec}`;
  const shareUrl = typeof location !== "undefined" ? `${location.origin}${location.pathname}#permissions=${dec}` : `#permissions=${dec}`;

  const codeJs = `import { PermissionsBitField, PermissionFlagsBits } from "discord.js";

const perms = new PermissionsBitField(${dec}n);
// = ${toDiscordJsFlags(value)}`;
  const codePy = `import discord

perms = discord.Permissions(${dec})`;

  const reset = () => {
    update(EXAMPLE());
    toast(s.resetDone);
  };

  return (
    <div class="pm">
      <div class="pm-top">
        <div class="segmented" role="group" aria-label={s.mode}>
          <button type="button" aria-pressed={mode === "calc"} onClick={() => { touched.current = true; setMode("calc"); }}>
            {s.modeCalc}
          </button>
          <button type="button" aria-pressed={mode === "compare"} onClick={() => { touched.current = true; setMode("compare"); }}>
            {s.modeCompare}
          </button>
        </div>
        <button type="button" class="btn btn-sm btn-ghost" onClick={reset}>
          <Icon name="RefreshCw" size={15} />
          {s.reset}
        </button>
      </div>

      {mode === "calc" ? (
        <div class="tool-layout split pm-layout">
          <div class="panel pm-pick">
            <h2 class="panel-title">{s.pick}</h2>
            <PermissionPicker value={value} onChange={update} lang={lang} idPrefix="pm" />
            <div class="pm-mobilebar">
              <span class="pm-mobilebar-label">{s.mobileValue}</span>
              <code class="mono">{dec}</code>
              <CopyButton text={dec} lang={lang} size="sm" />
            </div>
          </div>

          <div class="sticky stack">
            <div class="panel stack">
              <h2 class="panel-title">{s.result}</h2>
              <ValueInput id="pm-value" label={s.value} text={text} onText={onText} lang={lang} hint={s.valueHint} />
              <Output value={toHex(value)} lang={lang} label={s.hex} />
              <div class="row pm-stats">
                <span class="chip">{s.count(decoded.known.length)}</span>
                {risky.length > 0 && <span class="chip pm-chip-danger">{s.risky(risky.length)}</span>}
                {twoFA.length > 0 && <span class="chip">{s.twoFA(twoFA.length)}</span>}
                {value === ALL_PERMISSIONS && <span class="chip">{s.allPerms}</span>}
              </div>

              {value === 0n && <p class="notice">{s.empty}</p>}
              {exceedsSafeInteger(value) && <p class="notice pm-warn">{s.unsafe}</p>}

              {admin && (
                <div class="notice error pm-notice" role="alert">
                  <strong>{s.adminTitle}</strong>
                  <p>{s.adminText}</p>
                  {decoded.known.length > 1 && <p>{s.adminOthers}</p>}
                </div>
              )}

              {!admin && risky.length > 0 && (
                <div class="notice pm-notice pm-warn">
                  <strong>{s.riskyTitle}</strong>
                  <p>{s.riskyText}</p>
                  <div class="pm-chips">
                    {risky.map((p) => (
                      <button type="button" key={p.key} class="chip pm-chip-btn" onClick={() => update(toggleBit(value, p.bit, false))} title={s.remove}>
                        {p.name[lang]}
                        <Icon name="X" size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {twoFA.length > 0 && (
                <p class="hint">
                  {s.twoFANote} {twoFA.map((p) => p.name[lang]).join(", ")}.
                </p>
              )}

              {decoded.unknown.length > 0 && (
                <div class="notice pm-notice pm-warn">
                  <strong>{s.unknownTitle}</strong>
                  <p>{s.unknownText}</p>
                  <div class="pm-chips">
                    {decoded.unknown.map((b) => (
                      <button type="button" key={b} class="chip pm-chip-btn mono" onClick={() => update(toggleBit(value, b, false))} aria-label={`${s.remove}: ${s.bit} ${b}`}>
                        1 &lt;&lt; {b} = {bit(b).toString()}
                        <Icon name="X" size={12} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div class="row pm-actions">
                <a class="btn btn-primary" href={inviteHref}>
                  <Icon name="Link" size={17} />
                  {s.toInvite}
                </a>
                <CopyButton text={shareUrl} lang={lang} label={s.share} />
              </div>
            </div>

            <details class="panel pm-code">
              <summary class="panel-title">
                <span>{s.code}</span>
                <Icon name="Code" size={16} />
              </summary>
              <div class="stack">
                <div class="pm-snippet">
                  <div class="pm-snippet-head">
                    <span class="label">discord.js</span>
                    <CopyButton text={codeJs} lang={lang} size="sm" />
                  </div>
                  <pre class="mono">{codeJs}</pre>
                </div>
                <div class="pm-snippet">
                  <div class="pm-snippet-head">
                    <span class="label">discord.py</span>
                    <CopyButton text={codePy} lang={lang} size="sm" />
                  </div>
                  <pre class="mono">{codePy}</pre>
                </div>
              </div>
            </details>
          </div>
        </div>
      ) : (
        <Compare lang={lang} aText={aText} bText={bText} setAText={(t) => { touched.current = true; setAText(t); }} setBText={(t) => { touched.current = true; setBText(t); }}
          current={value}
          onUseB={(v) => { update(v); setMode("calc"); toast(s.copied); }} />
      )}
    </div>
  );
}

function Compare({ lang, aText, bText, setAText, setBText, current, onUseB }: {
  lang: Lang; aText: string; bText: string; setAText: (s: string) => void; setBText: (s: string) => void; current: bigint; onUseB: (v: bigint) => void;
}) {
  const s = L[lang];
  const a = parseBitfield(aText);
  const b = parseBitfield(bText);
  const diff = a.ok && b.ok ? comparePermissions(a.value, b.value) : null;
  const list = (bits: number[], kind: "add" | "rem" | "keep") => (
    <ul class={`pm-diff pm-diff-${kind}`}>
      {bits.map((x) => {
        const p = PERMISSION_BY_BIT.get(x);
        return (
          <li key={x}>
            <span class="pm-diff-sign" aria-hidden="true">{kind === "add" ? "+" : kind === "rem" ? "−" : "="}</span>
            <span>
              {bitName(x, lang)}
              {p?.dangerous && <span class="pm-diff-risk"> · {lang === "de" ? "riskant" : "risky"}</span>}
            </span>
            <code class="mono">{p?.key ?? `1 << ${x}`}</code>
          </li>
        );
      })}
    </ul>
  );
  return (
    <div class="tool-layout split">
      <div class="panel stack">
        <p class="hint">{s.compareHint}</p>
        <ValueInput id="pm-a" label={s.before} text={aText} onText={setAText} lang={lang} />
        <button type="button" class="btn btn-sm btn-ghost pm-use-current" onClick={() => setAText(current.toString())}>
          {s.useCurrent}
        </button>
        <ValueInput id="pm-b" label={s.after} text={bText} onText={setBText} lang={lang} />
      </div>
      <div class="sticky panel stack" aria-live="polite">
        {diff ? (
          <>
            {diff.added.length === 0 && diff.removed.length === 0 ? (
              <p class="notice">{s.same}</p>
            ) : null}
            {diff.added.length > 0 && (
              <section>
                <h3 class="pm-diff-title">{s.added} ({diff.added.length})</h3>
                {list(diff.added, "add")}
              </section>
            )}
            {diff.removed.length > 0 && (
              <section>
                <h3 class="pm-diff-title">{s.removed} ({diff.removed.length})</h3>
                {list(diff.removed, "rem")}
              </section>
            )}
            {diff.kept.length > 0 && (
              <details>
                <summary class="pm-diff-title pm-diff-summary">{s.kept} ({diff.kept.length})</summary>
                {list(diff.kept, "keep")}
              </details>
            )}
            <div class="row">
              <button type="button" class="btn" onClick={() => b.ok && onUseB(b.value)}>
                {s.useB}
              </button>
              <span class="hint mono">{bitsOf(b.ok ? b.value : 0n).length} · {b.ok ? toHex(b.value) : ""}</span>
            </div>
          </>
        ) : (
          <p class="notice">{s.compareHint}</p>
        )}
      </div>
    </div>
  );
}
