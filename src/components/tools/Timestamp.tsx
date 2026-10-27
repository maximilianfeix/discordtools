import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { copyText } from "../ui/toast";
import Preview, { type PreviewTheme } from "../discord/Preview";
import { formatTimestamp, timestampTag, type TimestampStyle } from "../../lib/timestamp";
import {
  decodeTimestampInput,
  formatOffset,
  inputsToWall,
  isValidTimeZone,
  parseNaturalDate,
  tzOffsetMinutes,
  wallClock,
  wallToInputs,
  zonedToUtc,
} from "../../lib/timestamp-parse";
import "./Timestamp.css";

const ORDER: TimestampStyle[] = ["t", "T", "d", "D", "f", "F", "s", "S", "R"];

const L = {
  de: {
    when: "Wann?",
    smart: "Schnell-Eingabe",
    smartPh: "z. B. morgen 18 Uhr, in 2 Stunden, 31.10. 20:00, <t:…>",
    smartHint: "Deutsch oder Englisch. Du kannst auch Unix-Zeit, Millisekunden, eine Discord-ID oder einen <t:…>-Code einfügen.",
    understood: "Erkannt",
    notUnderstood: "Nicht verstanden – probier z. B. „Freitag 20 Uhr“ oder „in 3 Tagen“.",
    src: { tag: "Discord-Zeitstempel", seconds: "Unix-Sekunden", milliseconds: "Unix-Millisekunden", snowflake: "Discord-ID (Erstellungszeit)", iso: "ISO-Datum" },
    quick: "Schnellwahl",
    now: "Jetzt",
    plus1h: "+1 Std.",
    plus1d: "+1 Tag",
    tomorrow: "Morgen 20 Uhr",
    saturday: "Nächster Samstag 20 Uhr",
    tomorrowText: "morgen 20 Uhr",
    saturdayText: "nächster Samstag 20 Uhr",
    date: "Datum",
    time: "Uhrzeit",
    tz: "Zeitzone",
    tzHint: "Die Zeitzone, in der du das Datum oben meinst. Tippe eine Stadt, z. B. Berlin oder New York.",
    myTz: "Meine",
    gap: (t: string) => `Diese Uhrzeit gibt es wegen der Zeitumstellung nicht. Wir nehmen ${t}.`,
    ambiguous: "Diese Uhrzeit gibt es wegen der Zeitumstellung zweimal. Welche meinst du?",
    first: "Erste",
    second: "Zweite",
    unix: "Unix-Zeit",
    share: "Link kopieren",
    shareOk: "Link kopiert",
    formats: "Alle 9 Formate",
    formatsHint: "Klick auf einen Code kopiert ihn. Jeder sieht die Zeit in seiner eigenen Zeitzone und Sprache.",
    previewAs: "Vorschau als",
    browser: "Dein Browser",
    viewerTz: "Zeitzone des Lesers",
    yourTz: "Deine",
    names: {
      t: "Kurze Uhrzeit",
      T: "Uhrzeit mit Sekunden",
      d: "Kurzes Datum",
      D: "Langes Datum",
      f: "Datum und Uhrzeit (Standard)",
      F: "Wochentag, Datum, Uhrzeit",
      s: "Kurzes Datum, Uhrzeit",
      S: "Kurzes Datum, Uhrzeit mit Sek.",
      R: "Relativ (zählt live)",
    } as Record<TimestampStyle, string>,
    copyCode: (c: string) => `${c} kopieren`,
    copied: "In die Zwischenablage kopiert",
    copyFail: "Kopieren fehlgeschlagen",
    announce: "Ankündigung",
    template: "Vorlage",
    templateDefault: "**Spieleabend** 🎮\nWir starten {F} ({R}).",
    templateHint: "Platzhalter: {t} {T} {d} {D} {f} {F} {s} {S} {R} – werden durch den passenden Code ersetzt.",
    output: "Zum Einfügen in Discord",
    preview: "Vorschau",
    previewNote: "Annäherung: Discord zeigt Zeitstempel in der Sprache und Zeitzone jedes Lesers.",
    user: "Kanalwerk",
    pasted: "eingefügt",
  },
  en: {
    when: "When?",
    smart: "Quick input",
    smartPh: "e.g. tomorrow 6pm, in 2 hours, next friday 8pm, <t:…>",
    smartHint: "English or German. You can also paste Unix time, milliseconds, a Discord ID or a <t:…> code.",
    understood: "Understood",
    notUnderstood: "Not understood – try e.g. “friday 8pm” or “in 3 days”.",
    src: { tag: "Discord timestamp", seconds: "Unix seconds", milliseconds: "Unix milliseconds", snowflake: "Discord ID (creation time)", iso: "ISO date" },
    quick: "Quick picks",
    now: "Now",
    plus1h: "+1 hour",
    plus1d: "+1 day",
    tomorrow: "Tomorrow 8 pm",
    saturday: "Next Saturday 8 pm",
    tomorrowText: "tomorrow 8pm",
    saturdayText: "next saturday 8pm",
    date: "Date",
    time: "Time",
    tz: "Time zone",
    tzHint: "The time zone you mean the date above in. Type a city, e.g. London or New York.",
    myTz: "Mine",
    gap: (t: string) => `This time doesn't exist because of the DST switch. Using ${t} instead.`,
    ambiguous: "This time happens twice because of the DST switch. Which one do you mean?",
    first: "First",
    second: "Second",
    unix: "Unix time",
    share: "Copy link",
    shareOk: "Link copied",
    formats: "All 9 styles",
    formatsHint: "Click a code to copy it. Everyone sees the time in their own time zone and language.",
    previewAs: "Preview as",
    browser: "Your browser",
    viewerTz: "Reader's time zone",
    yourTz: "Yours",
    names: {
      t: "Short time",
      T: "Long time (seconds)",
      d: "Short date",
      D: "Long date",
      f: "Date and time (default)",
      F: "Weekday, date, time",
      s: "Short date, time",
      S: "Short date, time with seconds",
      R: "Relative (updates live)",
    } as Record<TimestampStyle, string>,
    copyCode: (c: string) => `Copy ${c}`,
    copied: "Copied to clipboard",
    copyFail: "Copy failed",
    announce: "Announcement",
    template: "Template",
    templateDefault: "**Game night** 🎮\nWe start {F} ({R}).",
    templateHint: "Placeholders: {t} {T} {d} {D} {f} {F} {s} {S} {R} – replaced with the matching code.",
    output: "Paste this into Discord",
    preview: "Preview",
    previewNote: "Approximation: Discord shows timestamps in each reader's language and time zone.",
    user: "Kanalwerk",
    pasted: "pasted",
  },
};

const COMMON_ZONES = ["UTC", "Europe/London", "Europe/Berlin", "Europe/Moscow", "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Sao_Paulo", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney"];

function allZones(): string[] {
  let list: string[] = [];
  try {
    list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.("timeZone") ?? [];
  } catch {
    /* old browser */
  }
  if (!list.length) list = COMMON_ZONES.slice();
  if (!list.includes("UTC")) list = ["UTC", ...list];
  return list;
}

function browserZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function findZone(text: string, zones: string[]): string | null {
  const q = text.trim().toLowerCase().replace(/\s+/g, "_");
  if (!q) return null;
  const exact = zones.find((z) => z.toLowerCase() === q);
  if (exact) return exact;
  return zones.find((z) => z.toLowerCase().split("/").pop() === q) ?? zones.find((z) => z.toLowerCase().includes(q)) ?? null;
}

function readHash(): { t?: number; tz?: string } {
  if (typeof location === "undefined") return {};
  const params = new URLSearchParams(location.hash.slice(1) || location.search.slice(1));
  const t = params.get("t");
  const tz = params.get("tz");
  return {
    t: t && /^-?\d{1,12}$/.test(t) ? Number(t) : undefined,
    tz: tz && isValidTimeZone(tz) ? tz : undefined,
  };
}

export default function Timestamp({ lang }: { lang: Lang }) {
  const s = L[lang];
  const myZone = useMemo(browserZone, []);
  const zones = useMemo(allZones, []);
  const [now, setNow] = useState(() => Date.now());
  const [tz, setTz] = useState(myZone);
  const [tzText, setTzText] = useState(myZone);
  const [smart, setSmart] = useState(lang === "de" ? L.de.tomorrowText : L.en.tomorrowText);
  const [unix, setUnix] = useState(() => {
    const r = parseNaturalDate(lang === "de" ? L.de.tomorrowText : L.en.tomorrowText, { now: Date.now(), tz: myZone });
    return Math.floor((r?.ms ?? Date.now()) / 1000);
  });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [gapNote, setGapNote] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<TimestampStyle | null>(null);
  const [viewLocale, setViewLocale] = useState<string>("browser");
  const [viewTz, setViewTz] = useState<string>("mine");
  const [template, setTemplate] = useState(s.templateDefault);
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const [showZones, setShowZones] = useState(false);
  const touched = useRef(false);
  // Set after mount so the server-rendered (disabled) share button updates on hydration.
  const [base, setBase] = useState("");
  useEffect(() => setBase(location.origin + location.pathname), []);

  const browserLocale = typeof navigator !== "undefined" ? navigator.language || "de-DE" : lang === "de" ? "de-DE" : "en-GB";
  const locale = viewLocale === "browser" ? browserLocale : viewLocale;
  const previewTz = viewTz === "mine" ? myZone : viewTz;

  // live clock for the relative style
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // shared link: #t=1700000000&tz=Europe/Berlin
  useEffect(() => {
    const h = readHash();
    if (h.tz) {
      setTz(h.tz);
      setTzText(h.tz);
    }
    if (h.t !== undefined) {
      setUnix(h.t);
      setSmart("");
    } else {
      // The server-rendered example used the build time; recompute it with the visitor's clock and zone.
      const r = parseNaturalDate(s.tomorrowText, { now: Date.now(), tz: h.tz ?? myZone });
      if (r) setUnix(Math.floor(r.ms / 1000));
    }
  }, []);
  useEffect(() => {
    if (!touched.current) return;
    const id = setTimeout(() => {
      const hash = `#t=${unix}${tz !== myZone ? `&tz=${encodeURIComponent(tz)}` : ""}`;
      history.replaceState(null, "", location.pathname + hash);
    }, 300);
    return () => clearTimeout(id);
  }, [unix, tz]);

  const setTime = (u: number) => {
    touched.current = true;
    setUnix(u);
  };

  const wall = useMemo(() => wallClock(unix * 1000, tz), [unix, tz]);
  const inputs = wallToInputs(wall);
  const zoned = useMemo(() => zonedToUtc(wall, tz), [wall, tz]);
  const offset = tzOffsetMinutes(unix * 1000, tz);

  const fmtLocal = (ms: number) =>
    new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", { timeZone: tz, dateStyle: "medium", timeStyle: "short" }).format(new Date(ms));

  const onSmart = (value: string) => {
    setSmart(value);
    setGapNote(null);
    if (!value.trim()) {
      setStatus(null);
      return;
    }
    const dec = decodeTimestampInput(value);
    if (dec) {
      setTime(dec.unix);
      setHighlight(dec.source === "tag" && dec.explicitStyle ? dec.style : null);
      setStatus({ ok: true, text: `${s.understood}: ${s.src[dec.source]} → ${fmtLocal(dec.unix * 1000)}` });
      return;
    }
    const r = parseNaturalDate(value, { now: Date.now(), tz, defaultTime: { h: wall.h, mi: wall.mi } });
    if (r) {
      setTime(Math.floor(r.ms / 1000));
      setHighlight(null);
      if (r.kind === "gap") setGapNote(s.gap(fmtLocal(r.ms)));
      setStatus({ ok: true, text: `${s.understood}: ${fmtLocal(r.ms)}` });
    } else setStatus({ ok: false, text: s.notUnderstood });
  };

  const fromInputs = (date: string, time: string) => {
    const w = inputsToWall(date, time);
    if (!w) return;
    const r = zonedToUtc(w, tz);
    setGapNote(r.kind === "gap" ? s.gap(fmtLocal(r.ms)) : null);
    setSmart("");
    setStatus(null);
    setHighlight(null);
    setTime(Math.floor(r.ms / 1000));
  };

  const changeZone = (z: string) => {
    // Keep the wall-clock time: "20:00" now means 20:00 in the new zone.
    const r = zonedToUtc(wall, z);
    setTz(z);
    setTzText(z);
    setGapNote(r.kind === "gap" ? s.gap(fmtLocal(r.ms)) : null);
    setTime(Math.floor(r.ms / 1000));
  };

  const onTzInput = (value: string) => {
    setTzText(value);
    const exact = zones.find((z) => z.toLowerCase() === value.trim().toLowerCase());
    if (exact) changeZone(exact);
  };
  const onTzBlur = () => {
    const z = findZone(tzText, zones);
    if (z) {
      if (z !== tz) changeZone(z);
      else setTzText(z);
    } else setTzText(tz);
  };

  const quick = (kind: "now" | "1h" | "1d" | "tomorrow" | "saturday") => {
    setGapNote(null);
    setHighlight(null);
    setStatus(null);
    if (kind === "now") {
      setSmart(lang === "de" ? "jetzt" : "now");
      setTime(Math.floor(Date.now() / 1000));
    } else if (kind === "1h") {
      setSmart("");
      setTime(unix + 3600);
    } else if (kind === "1d") {
      setSmart("");
      const r = zonedToUtc({ ...wall, d: wall.d + 1 }, tz);
      setTime(Math.floor(r.ms / 1000));
    } else {
      const text = kind === "tomorrow" ? s.tomorrowText : s.saturdayText;
      setSmart(text);
      const r = parseNaturalDate(text, { now: Date.now(), tz });
      if (r) setTime(Math.floor(r.ms / 1000));
    }
  };

  const copy = (text: string) => copyText(text, s.copied, s.copyFail);

  const announcement = template.replace(/\{([tTdDfFsSR])\}/g, (_, st: TimestampStyle) => timestampTag(unix, st));
  const shareUrl =
    base ? `${base}#t=${unix}${tz !== myZone ? `&tz=${encodeURIComponent(tz)}` : ""}` : "";

  const viewerZones = Array.from(new Set([myZone, ...COMMON_ZONES]));

  return (
    <div class="tool-layout split ts">
        <section class="panel stack ts-when" aria-labelledby="ts-when">
          <h2 class="panel-title" id="ts-when">{s.when}</h2>
          <div class="field">
            <label for="ts-smart">{s.smart}</label>
            <input
              id="ts-smart"
              class="input"
              type="text"
              value={smart}
              placeholder={s.smartPh}
              autocomplete="off"
              spellcheck={false}
              enterKeyHint="done"
              onInput={(e) => onSmart(e.currentTarget.value)}
              aria-describedby="ts-smart-status ts-smart-hint"
            />
            <span id="ts-smart-status" class={status && !status.ok ? "ts-status bad" : "ts-status"} aria-live="polite">
              {status ? (
                <>
                  <Icon name={status.ok ? "Check" : "TriangleAlert"} size={15} />
                  {status.text}
                </>
              ) : null}
            </span>
            <span id="ts-smart-hint" class="hint">{s.smartHint}</span>
          </div>

          <div class="field">
            <span class="label">{s.quick}</span>
            <div class="ts-quick">
              <button type="button" class="btn btn-sm" onClick={() => quick("now")}>{s.now}</button>
              <button type="button" class="btn btn-sm" onClick={() => quick("1h")}>{s.plus1h}</button>
              <button type="button" class="btn btn-sm" onClick={() => quick("1d")}>{s.plus1d}</button>
              <button type="button" class="btn btn-sm" onClick={() => quick("tomorrow")}>{s.tomorrow}</button>
              <button type="button" class="btn btn-sm" onClick={() => quick("saturday")}>{s.saturday}</button>
            </div>
          </div>

          <div class="ts-dt">
            <div class="field">
              <label for="ts-date">{s.date}</label>
              <input id="ts-date" class="input" type="date" value={inputs.date} onChange={(e) => fromInputs(e.currentTarget.value, inputs.time)} />
            </div>
            <div class="field">
              <label for="ts-time">{s.time}</label>
              <input
                id="ts-time"
                class="input"
                type="time"
                step={wall.s ? 1 : 60}
                value={inputs.time}
                onChange={(e) => fromInputs(inputs.date, e.currentTarget.value)}
              />
            </div>
          </div>

          <div class="field">
            <label for="ts-tz">{s.tz}</label>
            <div class="ts-tz-row">
              <input
                id="ts-tz"
                class="input"
                type="text"
                list={showZones ? "ts-zones" : undefined}
                value={tzText}
                autocomplete="off"
                spellcheck={false}
                onFocus={(e) => {
                  setShowZones(true);
                  e.currentTarget.select();
                }}
                onInput={(e) => onTzInput(e.currentTarget.value)}
                onBlur={onTzBlur}
                onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
                aria-describedby="ts-tz-hint"
              />
              <span class="chip ts-offset">{formatOffset(offset)}</span>
              {tz !== myZone && (
                <button type="button" class="btn btn-sm" onClick={() => changeZone(myZone)}>{s.myTz}</button>
              )}
            </div>
            {showZones && (
              <datalist id="ts-zones">
                {zones.map((z) => (
                  <option key={z} value={z}>{formatOffset(tzOffsetMinutes(unix * 1000, z))}</option>
                ))}
              </datalist>
            )}
            <span id="ts-tz-hint" class="hint">{s.tzHint}</span>
          </div>

          {gapNote && (
            <p class="notice ts-notice" role="status">
              <Icon name="Info" size={16} /> {gapNote}
            </p>
          )}
          {zoned.kind === "ambiguous" && (
            <div class="notice ts-notice" role="status">
              <p>{s.ambiguous}</p>
              <div class="segmented" role="group" aria-label={s.ambiguous}>
                <button type="button" aria-pressed={unix * 1000 === zoned.ms} onClick={() => setTime(zoned.ms / 1000)}>
                  {s.first} ({formatOffset(tzOffsetMinutes(zoned.ms, tz))})
                </button>
                <button type="button" aria-pressed={unix * 1000 === zoned.alt} onClick={() => setTime(zoned.alt / 1000)}>
                  {s.second} ({formatOffset(tzOffsetMinutes(zoned.alt, tz))})
                </button>
              </div>
            </div>
          )}

          <div class="ts-unix">
            <div class="field">
              <span class="label">{s.unix}</span>
              <div class="output">
                <code>{unix}</code>
                <CopyButton text={String(unix)} lang={lang} size="sm" variant="icon" label={s.copyCode(s.unix)} />
              </div>
            </div>
            <CopyButton text={shareUrl} lang={lang} label={s.share} />
          </div>
        </section>


      <section class="panel sticky ts-formats" aria-labelledby="ts-formats">
        <h2 class="panel-title" id="ts-formats">{s.formats}</h2>
        <div class="ts-view">
          <div class="field">
            <span class="label" id="ts-view-label">{s.previewAs}</span>
            <div class="segmented" role="group" aria-labelledby="ts-view-label">
              {[
                ["browser", s.browser],
                ["de-DE", "Deutsch"],
                ["en-US", "English (US)"],
                ["en-GB", "English (UK)"],
              ].map(([id, label]) => (
                <button type="button" key={id} aria-pressed={viewLocale === id} onClick={() => setViewLocale(id!)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div class="field">
            <label for="ts-viewtz">{s.viewerTz}</label>
            <select id="ts-viewtz" class="select" value={viewTz} onChange={(e) => setViewTz(e.currentTarget.value)}>
              <option value="mine">{s.yourTz} ({myZone})</option>
              {viewerZones.filter((z) => z !== myZone).map((z) => (
                <option key={z} value={z}>{z.replace(/_/g, " ")} ({formatOffset(tzOffsetMinutes(unix * 1000, z))})</option>
              ))}
            </select>
          </div>
        </div>
        <p class="hint">{s.formatsHint}</p>
        <ul class="ts-rows">
          {ORDER.map((st) => {
            const code = timestampTag(unix, st);
            return (
              <li key={st} class={highlight === st ? "ts-row is-hl" : "ts-row"}>
                <div class="ts-row-main">
                  <span class="ts-row-name">
                    {s.names[st]}
                    {highlight === st && <span class="chip ts-pasted">{s.pasted}</span>}
                  </span>
                  <span class="ts-row-value">{formatTimestamp(unix, st, locale, previewTz, now)}</span>
                </div>
                <button type="button" class="ts-code" onClick={() => copy(code)} aria-label={s.copyCode(code)}>
                  <code>{code}</code>
                  <Icon name="Copy" size={15} />
                </button>
              </li>
            );
          })}
        </ul>
      </section>

        <section class="panel stack ts-ann" aria-labelledby="ts-ann">
          <h2 class="panel-title" id="ts-ann">{s.announce}</h2>
          <div class="field">
            <label for="ts-template">{s.template}</label>
            <textarea id="ts-template" class="textarea" rows={3} value={template} onInput={(e) => setTemplate(e.currentTarget.value)} />
            <span class="hint">{s.templateHint}</span>
          </div>
          <div class="field">
            <span class="label">{s.output}</span>
            <div class="output ts-ann-out">
              <code>{announcement}</code>
              <CopyButton text={announcement} lang={lang} size="sm" />
            </div>
          </div>
          <Preview
            messages={[{ username: s.user, content: announcement, color: "#3ee0a8" }]}
            theme={theme}
            onTheme={setTheme}
            locale={locale}
            label={s.preview}
            note={s.previewNote}
          />
        </section>
    </div>
  );
}
