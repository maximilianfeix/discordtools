import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Output from "../ui/Output";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import BitValueInput from "./BitValueInput";
import { bit, parseBitfield, toHex, toggleBit } from "../../lib/bitfield";
import {
  INTENTS,
  INTENT_PRESETS,
  decodeIntents,
  discordJsSnippet,
  discordPySnippet,
  identifySnippet,
  intentNotes,
  intentsValue,
  type IntentNote,
} from "../../lib/intents";
import { readHash, writeHash } from "../../lib/hash-state";
import "./Intents.css";

const L = {
  de: {
    pick: "Intents auswählen",
    presets: "Vorlagen",
    search: "Intent oder Event suchen",
    searchPh: "z. B. MESSAGE_CREATE, Mitglieder, voice",
    noHits: "Nichts gefunden. Events ohne Intent (z. B. READY, INTERACTION_CREATE) kommen immer an.",
    privileged: "Privilegiert",
    events: (n: number) => (n === 1 ? "1 Event" : `${n} Events`),
    noEvents: "Keine eigenen Events",
    result: "Ergebnis",
    value: "Intents-Wert",
    hint: "Zahl einfügen zum Entschlüsseln (Dezimal, Hex oder Binär).",
    hex: "Hexadezimal",
    count: (n: number) => (n === 1 ? "1 Intent" : `${n} Intents`),
    privCount: (n: number) => `${n} privilegiert`,
    unknown: "Unbekannte Bits",
    unknownText: "Diese Bits sind keinem Intent zugeordnet. Discord schließt die Verbindung dann mit Code 4013 (ungültige Intents).",
    remove: "Entfernen",
    code: "Code",
    reset: "Zurücksetzen",
    resetDone: "Auf Beispiel zurückgesetzt",
    share: "Link zu dieser Auswahl",
    clear: "Alles abwählen",
    note: {
      privileged:
        "Privilegierte Intents musst du im Developer Portal unter „Bot → Privileged Gateway Intents“ einschalten. Sonst trennt Discord die Verbindung mit Code 4014. Bis 10.000 Nutzer reicht der Schalter. Darüber musst du den Zugriff beantragen und jährlich erneuern – das gilt seit dem 10. Juni 2026; vorher lag die Grenze bei 100 Servern.",
      "content-without-messages":
        "MESSAGE_CONTENT allein bringt keine Nachrichten. Du brauchst zusätzlich GUILD_MESSAGES und/oder DIRECT_MESSAGES.",
      "messages-without-content":
        "Ohne MESSAGE_CONTENT sind content, embeds, attachments, components und poll leer – außer in DMs, bei Erwähnungen des Bots und bei eigenen Nachrichten. Für Slash-Befehle reicht das.",
      "presences-heavy": "GUILD_PRESENCES erzeugt sehr viele Events. Aktiviere es nur, wenn du Status oder Aktivitäten wirklich brauchst.",
    } as Record<IntentNote, string>,
  },
  en: {
    pick: "Pick intents",
    presets: "Presets",
    search: "Search intent or event",
    searchPh: "e.g. MESSAGE_CREATE, members, voice",
    noHits: "Nothing found. Events without an intent (e.g. READY, INTERACTION_CREATE) are always sent.",
    privileged: "Privileged",
    events: (n: number) => (n === 1 ? "1 event" : `${n} events`),
    noEvents: "No events of its own",
    result: "Result",
    value: "Intents value",
    hint: "Paste a number to decode it (decimal, hex or binary).",
    hex: "Hexadecimal",
    count: (n: number) => (n === 1 ? "1 intent" : `${n} intents`),
    privCount: (n: number) => `${n} privileged`,
    unknown: "Unknown bits",
    unknownText: "These bits belong to no intent. Discord then closes the connection with code 4013 (invalid intents).",
    remove: "Remove",
    code: "Code",
    reset: "Reset",
    resetDone: "Reset to example",
    share: "Link to this selection",
    clear: "Clear all",
    note: {
      privileged:
        "Privileged intents must be switched on in the Developer Portal under “Bot → Privileged Gateway Intents”, otherwise Discord closes the connection with code 4014. Up to 10,000 users the toggle is enough. Above that you have to apply for access and reapply every year – this applies since June 10, 2026; before, the limit was 100 servers.",
      "content-without-messages": "MESSAGE_CONTENT alone delivers no messages. You also need GUILD_MESSAGES and/or DIRECT_MESSAGES.",
      "messages-without-content":
        "Without MESSAGE_CONTENT, content, embeds, attachments, components and poll are empty – except in DMs, when the bot is mentioned, and for its own messages. Fine for slash commands.",
      "presences-heavy": "GUILD_PRESENCES creates a lot of events. Only enable it if you really need status or activities.",
    } as Record<IntentNote, string>,
  },
};

type Tab = "djs" | "dpy" | "raw";
const EXAMPLE = () => intentsValue(["GUILDS", "GUILD_MESSAGES", "MESSAGE_CONTENT"]);

export default function Intents({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [value, setValue] = useState<bigint>(EXAMPLE);
  const [text, setText] = useState(() => EXAMPLE().toString());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("djs");
  const touched = useRef(false);

  useEffect(() => {
    const v = readHash().get("intents");
    if (v) {
      const r = parseBitfield(v);
      if (r.ok) {
        setValue(r.value);
        setText(r.value.toString());
      }
    }
  }, []);

  useEffect(() => {
    if (touched.current) writeHash({ intents: value.toString() });
  }, [value]);

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

  const q = query.trim().toLowerCase();
  const list = useMemo(
    () =>
      INTENTS.filter((i) => {
        if (!q) return true;
        const hay = [i.key, i.name.de, i.name.en, i.desc[lang], i.djs, i.dpy, ...i.events].join(" ").toLowerCase();
        return q.split(/\s+/).every((w) => hay.includes(w));
      }),
    [q, lang],
  );
  const decoded = decodeIntents(value);
  const notes = intentNotes(value);
  const privCount = decoded.known.filter((i) => i.privileged).length;
  const code = tab === "djs" ? discordJsSnippet(value) : tab === "dpy" ? discordPySnippet(value) : identifySnippet(value);
  const shareUrl = typeof location !== "undefined" ? `${location.origin}${location.pathname}#intents=${value}` : "";

  return (
    <div class="it">
      <div class="it-top">
        <button type="button" class="btn btn-sm btn-ghost" onClick={() => { update(EXAMPLE()); toast(s.resetDone); }}>
          <Icon name="RefreshCw" size={15} />
          {s.reset}
        </button>
      </div>
      <div class="tool-layout split">
        <div class="panel stack">
          <h2 class="panel-title">{s.pick}</h2>
          <div class="field">
            <span class="label">{s.presets}</span>
            <div class="it-presets">
              {INTENT_PRESETS.map((p) => (
                <button type="button" key={p.id} class="it-preset" aria-pressed={p.value === value} onClick={() => update(p.value)}>
                  {p.name[lang]}
                </button>
              ))}
            </div>
          </div>
          <div class="it-toolbar">
            <div class="field it-search">
              <label for="it-search">{s.search}</label>
              <input id="it-search" class="input" type="search" autocomplete="off" spellcheck={false} placeholder={s.searchPh} value={query}
                onInput={(e) => setQuery((e.target as HTMLInputElement).value)} />
            </div>
            <button type="button" class="btn btn-sm btn-ghost" onClick={() => update(0n)}>{s.clear}</button>
          </div>
          <ul class="it-list">
            {list.map((i) => {
              const on = (value & bit(i.bit)) !== 0n;
              const id = `it-${i.bit}`;
              const hitEvents = q ? i.events.filter((e) => e.toLowerCase().includes(q)) : [];
              return (
                <li key={i.key} class={`it-item ${on ? "is-on" : ""} ${i.privileged ? "is-priv" : ""}`}>
                  <input id={id} type="checkbox" checked={on} onChange={() => update(toggleBit(value, i.bit))} />
                  <div class="it-body">
                    <label for={id} class="it-label">
                      <span class="it-name">{i.name[lang]}</span>
                      {i.privileged && (
                        <span class="it-badge">
                          <Icon name="Lock" size={12} />
                          {s.privileged}
                        </span>
                      )}
                      <code class="mono it-key">
                        {i.key} · 1 &lt;&lt; {i.bit} = {bit(i.bit).toString()}
                      </code>
                    </label>
                    <p class="it-desc">{i.desc[lang]}</p>
                    {i.events.length > 0 ? (
                      <details class="it-events" open={hitEvents.length > 0 || undefined}>
                        <summary>{s.events(i.events.length)}</summary>
                        <ul>
                          {i.events.map((e) => (
                            <li key={e}>
                              <code class={`mono ${hitEvents.includes(e) ? "is-hit" : ""}`}>{e}</code>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <span class="hint">{s.noEvents}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {list.length === 0 && <p class="notice">{s.noHits}</p>}
          <div class="it-mobilebar">
            <span class="it-mobilebar-label">{s.value}</span>
            <code class="mono">{value.toString()}</code>
            <CopyButton text={value.toString()} lang={lang} size="sm" />
          </div>
        </div>

        <div class="sticky stack">
          <div class="panel stack">
            <h2 class="panel-title">{s.result}</h2>
            <BitValueInput id="it-value" label={s.value} text={text} onText={onText} lang={lang} hint={s.hint} />
            <Output value={toHex(value)} lang={lang} label={s.hex} />
            <div class="row it-stats">
              <span class="chip">{s.count(decoded.known.length)}</span>
              {privCount > 0 && <span class="chip it-chip-priv">{s.privCount(privCount)}</span>}
            </div>
            {notes.map((n) => (
              <p key={n} class={`notice it-note ${n === "privileged" || n === "content-without-messages" ? "it-warn" : ""}`}>
                {s.note[n]}
              </p>
            ))}
            {decoded.unknown.length > 0 && (
              <div class="notice error it-note">
                <strong>{s.unknown}</strong>
                <p>{s.unknownText}</p>
                <div class="row">
                  {decoded.unknown.map((b) => (
                    <button type="button" key={b} class="chip it-chip-btn mono" onClick={() => update(toggleBit(value, b, false))} aria-label={`${s.remove}: 1 << ${b}`}>
                      1 &lt;&lt; {b}
                      <Icon name="X" size={12} />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <CopyButton text={shareUrl} lang={lang} label={s.share} />
          </div>

          <div class="panel stack">
            <div class="it-code-head">
              <h2 class="panel-title">{s.code}</h2>
              <div class="segmented" role="group" aria-label={s.code}>
                <button type="button" aria-pressed={tab === "djs"} onClick={() => setTab("djs")}>discord.js</button>
                <button type="button" aria-pressed={tab === "dpy"} onClick={() => setTab("dpy")}>discord.py</button>
                <button type="button" aria-pressed={tab === "raw"} onClick={() => setTab("raw")}>IDENTIFY</button>
              </div>
            </div>
            <div class="it-code">
              <pre class="mono">{code}</pre>
              <div class="it-code-copy">
                <CopyButton text={code} lang={lang} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
