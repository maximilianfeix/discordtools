import { useEffect, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Output from "../ui/Output";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import BitValueInput from "./BitValueInput";
import { bit, parseBitfield, toBinary, toHex, toggleBit } from "../../lib/bitfield";
import { FLAG_SETS, FLAG_SET_BY_ID, decodeFlags, isFlagType, type FlagType } from "../../lib/flags";
import { readHash, writeHash } from "../../lib/hash-state";
import "./Flags.css";

const L = {
  de: {
    type: "Flag-Typ",
    value: "Wert",
    hint: "Zahl aus dem JSON einfügen – Dezimal, Hex oder Binär. Auch große Werte bleiben exakt.",
    flags: "Flags",
    set: "Gesetzte Flags",
    none: "Keine Flags gesetzt (Wert 0).",
    hex: "Hexadezimal",
    binary: "Binär",
    unknown: "Unbekannte Bits",
    unknownText: "Diese Bits sind nicht dokumentiert. Sie bleiben im Wert erhalten.",
    undocumented: "nicht dokumentiert",
    field: "Feld",
    reset: "Beispiel laden",
    resetDone: "Beispiel geladen",
    share: "Link zu diesem Wert",
    remove: "Entfernen",
  },
  en: {
    type: "Flag type",
    value: "Value",
    hint: "Paste the number from the JSON – decimal, hex or binary. Large values stay exact.",
    flags: "Flags",
    set: "Set flags",
    none: "No flags set (value 0).",
    hex: "Hexadecimal",
    binary: "Binary",
    unknown: "Unknown bits",
    unknownText: "These bits are not documented. They stay in the value.",
    undocumented: "undocumented",
    field: "Field",
    reset: "Load example",
    resetDone: "Example loaded",
    share: "Link to this value",
    remove: "Remove",
  },
};

const initialValues = () => Object.fromEntries(FLAG_SETS.map((f) => [f.id, f.example])) as Record<FlagType, bigint>;

export default function Flags({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [type, setType] = useState<FlagType>("user");
  const [values, setValues] = useState<Record<FlagType, bigint>>(initialValues);
  const [text, setText] = useState(() => FLAG_SETS[0]!.example.toString());
  const touched = useRef(false);

  useEffect(() => {
    const h = readHash();
    const t = h.get("type");
    const v = h.get("value");
    if (isFlagType(t)) {
      setType(t);
      const r = v ? parseBitfield(v) : null;
      if (r?.ok) {
        setValues((cur) => ({ ...cur, [t]: r.value }));
        setText(r.value.toString());
      } else setText(FLAG_SET_BY_ID[t].example.toString());
    }
  }, []);

  const value = values[type];
  useEffect(() => {
    if (touched.current) writeHash({ type, value: value.toString() });
  }, [type, value]);

  const setValue = (v: bigint) => {
    touched.current = true;
    setValues((cur) => ({ ...cur, [type]: v }));
    setText(v.toString());
  };
  const onText = (t: string) => {
    touched.current = true;
    setText(t);
    const r = parseBitfield(t);
    if (r.ok) setValues((cur) => ({ ...cur, [type]: r.value }));
  };
  const switchType = (t: FlagType) => {
    touched.current = true;
    setType(t);
    setText(values[t].toString());
  };

  const set = FLAG_SET_BY_ID[type];
  const decoded = decodeFlags(type, value);
  const shareUrl = typeof location !== "undefined" ? `${location.origin}${location.pathname}#type=${type}&value=${value}` : "";

  return (
    <div class="fl">
      <div class="fl-tabs-wrap">
        <div class="fl-tabs" role="tablist" aria-label={s.type}>
          {FLAG_SETS.map((f) => (
            <button
              type="button"
              role="tab"
              key={f.id}
              id={`fl-tab-${f.id}`}
              aria-selected={type === f.id}
              aria-controls="fl-panel"
              class="fl-tab"
              onClick={() => switchType(f.id)}
            >
              {f.label[lang]}
            </button>
          ))}
        </div>
        <button type="button" class="btn btn-sm btn-ghost" onClick={() => { setValue(set.example); toast(s.resetDone); }}>
          <Icon name="RefreshCw" size={15} />
          {s.reset}
        </button>
      </div>

      <div class="tool-layout split" id="fl-panel" role="tabpanel" aria-labelledby={`fl-tab-${type}`}>
        <div class="panel stack">
          <p class="fl-about">
            <code class="mono fl-field">{set.field}</code>
            <span>{set.about[lang]}</span>
          </p>
          <BitValueInput id="fl-value" label={`${s.value} (${set.field})`} text={text} onText={onText} lang={lang} hint={s.hint} />
          <p class="fl-mobile-summary" aria-hidden="true">
            {decoded.known.length + decoded.unknown.length === 0
              ? s.none
              : [...decoded.known.map((f) => f.name[lang]), ...decoded.unknown.map((b) => `1 << ${b}`)].join(" · ")}
          </p>
          <h2 class="panel-title fl-list-title">{s.flags}</h2>
          <ul class="fl-list">
            {set.flags.map((f) => {
              const on = (value & bit(f.bit)) !== 0n;
              const id = `fl-${type}-${f.bit}`;
              return (
                <li key={f.key} class={`fl-item ${on ? "is-on" : ""}`}>
                  <input id={id} type="checkbox" checked={on} onChange={() => setValue(toggleBit(value, f.bit))} />
                  <label for={id} class="fl-label">
                    <span class="fl-name">{f.name[lang]}</span>
                    {f.undocumented && <span class="fl-badge">{s.undocumented}</span>}
                    <span class="fl-desc">{f.desc[lang]}</span>
                    <code class="mono fl-key">
                      {f.key} · 1 &lt;&lt; {f.bit} = {bit(f.bit).toString()}
                    </code>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div class="sticky stack">
          <div class="panel stack" aria-live="polite">
            <h2 class="panel-title">{s.set}</h2>
            {decoded.known.length === 0 && decoded.unknown.length === 0 ? (
              <p class="notice">{s.none}</p>
            ) : (
              <ul class="fl-result">
                {decoded.known.map((f) => (
                  <li key={f.key}>
                    <span class="fl-result-name">
                      <Icon name="Check" size={15} />
                      {f.name[lang]}
                    </span>
                    <code class="mono">{f.key}</code>
                    <span class="mono fl-result-val">{bit(f.bit).toString()}</span>
                  </li>
                ))}
              </ul>
            )}
            {decoded.unknown.length > 0 && (
              <div class="notice fl-warn">
                <strong>{s.unknown}</strong>
                <p>{s.unknownText}</p>
                <div class="row">
                  {decoded.unknown.map((b) => (
                    <button type="button" key={b} class="chip fl-chip-btn mono" onClick={() => setValue(toggleBit(value, b, false))} aria-label={`${s.remove}: 1 << ${b}`}>
                      1 &lt;&lt; {b}
                      <Icon name="X" size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Output value={value.toString()} lang={lang} label={s.value} />
            <Output value={toHex(value)} lang={lang} label={s.hex} />
            <Output value={toBinary(value)} lang={lang} label={s.binary} />
            <CopyButton text={shareUrl} lang={lang} label={s.share} />
          </div>
        </div>
      </div>
    </div>
  );
}
