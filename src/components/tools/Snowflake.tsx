import { useEffect, useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { Notice, localeOf, toolHref } from "./lookup-ui";
import { calendarDiff, compareSnowflakes, formatDiff, idsFromHash, parseSnowflakeInput, snowflakeRange, type IdKind, type ParsedId, type ParseProblem } from "../../lib/snowflake-input";
import { decodeSnowflake, isSnowflake, DISCORD_EPOCH } from "../../lib/snowflake";
import "./Snowflake.css";

const EXAMPLE = "https://discord.com/channels/613425648685547541/613430047285706767/1234567891234567890\n175928847299117063";

const L = {
  de: {
    inputLabel: "IDs, Erwähnungen oder Nachrichtenlinks",
    inputHint: "Eine oder mehrere – je Zeile eine. Erkennt auch <@…>, <#…>, <@&…>, <:emoji:…> und Excel-Zahlen.",
    examples: "Beispiele:",
    exId: "Nutzer-ID",
    exLink: "Nachrichtenlink",
    exMention: "Erwähnung",
    exExcel: "Excel-Zahl",
    clear: "Leeren",
    empty: "Füg oben eine Discord-ID ein. Du findest sie mit aktiviertem Entwicklermodus per Rechtsklick → „ID kopieren“.",
    kinds: {
      id: "ID",
      user: "Nutzer",
      role: "Rolle",
      channel: "Kanal",
      guild: "Server",
      message: "Nachricht",
      emoji: "Emoji",
      command: "Slash-Befehl",
      dm: "DM-Kanal",
    } as Record<IdKind, string>,
    meaning: {
      id: "Erstellungszeitpunkt des Objekts mit dieser ID. Ob das ein Account, Server, eine Nachricht oder Rolle ist, verrät die ID selbst nicht – nur bei einer Nutzer-ID ist es das Account-Alter.",
      user: "Wann dieser Account erstellt wurde.",
      role: "Wann diese Rolle erstellt wurde. Die @everyone-Rolle hat dieselbe ID wie der Server.",
      channel: "Wann dieser Kanal erstellt wurde. Ein Thread aus einer Nachricht hat die ID dieser Nachricht.",
      guild: "Wann dieser Server erstellt wurde.",
      message: "Wann diese Nachricht gesendet wurde.",
      emoji: "Wann dieses Emoji hochgeladen wurde.",
      command: "Wann dieser Slash-Befehl registriert wurde.",
      dm: "Wann dieser DM-Kanal entstanden ist.",
    } as Record<IdKind, string>,
    link: "Nachrichtenlink",
    channelLink: "Kanallink",
    local: "Deine Zeit",
    utc: "UTC",
    age: "Alter",
    unix: "Unix",
    discordTs: "Discord-Zeitstempel",
    internals: "Interne Bits",
    worker: "Worker",
    process: "Prozess",
    increment: "Zähler",
    binary: "Binär (64 Bit)",
    internalsNote: "Worker und Prozess sagen nur, welcher Discord-Server die ID vergeben hat – nichts über Standort oder Person.",
    warnings: {
      future: "Liegt in der Zukunft – das ist vermutlich keine echte Discord-ID.",
      "trailing-zeros": "Endet auf 000 – wurde die Zahl in Excel/Sheets oder JavaScript gerundet? Dann stimmen die letzten Stellen nicht mehr. Kopier die ID direkt aus Discord.",
      "very-old": "Aus den ersten Wochen nach dem Discord-Start (Anfang 2015) – meist interne Test-IDs.",
      small: "Ungewöhnlich kurz für eine Discord-ID.",
    },
    problems: {
      scientific: "wurde zu einer gerundeten Zahl (wissenschaftliche Schreibweise). Die echte ID ist verloren – Excel speichert nur 15 Stellen. Formatier die Spalte als Text oder kopier die ID neu aus Discord.",
      invalid: "ist keine ID, kein Link und keine Erwähnung.",
      "too-short": "ist zu kurz – Discord-IDs haben 17 bis 20 Ziffern.",
      "too-large": "ist zu groß für eine Discord-ID (max. 64 Bit).",
      invite: "ist ein Einladungslink. Einladungscodes sind keine Snowflakes – nutz den Einladungs-Lookup.",
      token: "sieht aus wie ein Discord-Token. Gib deinen Token niemals auf einer Website ein! Wenn du ihn geteilt hast: Passwort ändern.",
    } as Record<ParseProblem["problem"], string>,
    approx: "ungefähr",
    inviteTool: "Zum Einladungs-Lookup",
    reverseTitle: "Datum → Snowflake",
    reverseHint: "Für API-Parameter wie before, after und around oder um Nachrichten ab einem Zeitpunkt zu laden.",
    dateLabel: "Datum und Uhrzeit (deine Zeitzone)",
    now: "Jetzt",
    minId: "Kleinste ID (für after=)",
    maxId: "Größte ID (für before=)",
    beforeEpoch: "Vor dem 1. Januar 2015 gibt es keine Snowflakes.",
    compareTitle: "Zwei IDs vergleichen",
    a: "ID A",
    b: "ID B",
    older: (x: string) => `${x} ist älter`,
    same: "Beide IDs sind identisch.",
    sameMs: "In derselben Millisekunde erstellt.",
    diff: "Abstand",
    exact: "genau",
    invalidId: "Keine gültige ID (17–20 Ziffern).",
    ms: "ms",
    seconds: "Sekunden",
    copyId: "ID kopieren",
  },
  en: {
    inputLabel: "IDs, mentions or message links",
    inputHint: "One or more – one per line. Also understands <@…>, <#…>, <@&…>, <:emoji:…> and spreadsheet numbers.",
    examples: "Examples:",
    exId: "User ID",
    exLink: "Message link",
    exMention: "Mention",
    exExcel: "Excel number",
    clear: "Clear",
    empty: "Paste a Discord ID above. With Developer Mode on, right-click anything → “Copy ID”.",
    kinds: {
      id: "ID",
      user: "User",
      role: "Role",
      channel: "Channel",
      guild: "Server",
      message: "Message",
      emoji: "Emoji",
      command: "Slash command",
      dm: "DM channel",
    } as Record<IdKind, string>,
    meaning: {
      id: "When the object with this ID was created. The ID itself doesn't say whether it's an account, server, message or role – it's only the account age if it is a user ID.",
      user: "When this account was created.",
      role: "When this role was created. The @everyone role shares the server's ID.",
      channel: "When this channel was created. A thread started from a message has that message's ID.",
      guild: "When this server was created.",
      message: "When this message was sent.",
      emoji: "When this emoji was uploaded.",
      command: "When this slash command was registered.",
      dm: "When this DM channel was created.",
    } as Record<IdKind, string>,
    link: "Message link",
    channelLink: "Channel link",
    local: "Your time",
    utc: "UTC",
    age: "Age",
    unix: "Unix",
    discordTs: "Discord timestamp",
    internals: "Internal bits",
    worker: "Worker",
    process: "Process",
    increment: "Increment",
    binary: "Binary (64 bit)",
    internalsNote: "Worker and process only tell which Discord machine issued the ID – nothing about location or person.",
    warnings: {
      future: "Lies in the future – this is probably not a real Discord ID.",
      "trailing-zeros": "Ends in 000 – was it rounded by Excel/Sheets or JavaScript? Then the last digits are wrong. Copy the ID straight from Discord.",
      "very-old": "From the first weeks after Discord's launch (early 2015) – mostly internal test IDs.",
      small: "Unusually short for a Discord ID.",
    },
    problems: {
      scientific: "became a rounded number (scientific notation). The real ID is lost – Excel only keeps 15 digits. Format the column as text or copy the ID again from Discord.",
      invalid: "is not an ID, link or mention.",
      "too-short": "is too short – Discord IDs have 17 to 20 digits.",
      "too-large": "is too large for a Discord ID (max 64 bits).",
      invite: "is an invite link. Invite codes are not snowflakes – use the invite lookup.",
      token: "looks like a Discord token. Never enter your token on any website! If you shared it, change your password.",
    } as Record<ParseProblem["problem"], string>,
    approx: "approx.",
    inviteTool: "Open invite lookup",
    reverseTitle: "Date → snowflake",
    reverseHint: "For API parameters like before, after and around, or to fetch messages from a point in time.",
    dateLabel: "Date and time (your time zone)",
    now: "Now",
    minId: "Smallest ID (for after=)",
    maxId: "Largest ID (for before=)",
    beforeEpoch: "There are no snowflakes before 1 January 2015.",
    compareTitle: "Compare two IDs",
    a: "ID A",
    b: "ID B",
    older: (x: string) => `${x} is older`,
    same: "Both IDs are identical.",
    sameMs: "Created in the same millisecond.",
    diff: "Difference",
    exact: "exactly",
    invalidId: "Not a valid ID (17–20 digits).",
    ms: "ms",
    seconds: "seconds",
    copyId: "Copy ID",
  },
};

type T = (typeof L)["de"];

function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function IdCard({ p, t, lang, now, compact }: { p: ParsedId; t: T; lang: Lang; now: number; compact?: boolean }) {
  const locale = localeOf(lang);
  const d = p.parts.date;
  const local = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "medium" }).format(d);
  const utc = d.toISOString().replace("T", " ").replace("Z", " UTC");
  const age = formatDiff(calendarDiff(p.parts.timestamp, now), lang);
  const future = p.parts.timestamp > now;
  const unix = Math.floor(p.parts.timestamp / 1000);
  const bin = p.parts.binary;
  return (
    <article class={`sf-card${compact ? " is-compact" : ""}`}>
      <header class="sf-card-head">
        <span class="chip">{t.kinds[p.kind]}{p.name ? ` · ${p.name}` : ""}</span>
        <code class="sf-id">{p.id}</code>
        <CopyButton text={p.id} lang={lang} size="sm" variant="icon" label={t.copyId} />
      </header>
      <p class="sf-date">{local}</p>
      <p class="sf-meaning">{t.meaning[p.kind]}</p>
      {p.warnings.length > 0 && (
        <div class="stack">
          {p.warnings.map((w) => (
            <Notice key={w} kind="warn" title={t.warnings[w]} />
          ))}
        </div>
      )}
      <dl class="lk-kv">
        <dt>{t.age}</dt>
        <dd>{future ? "–" : age}</dd>
        <dt>{t.utc}</dt>
        <dd class="lk-mono">{utc}</dd>
        <dt>{t.unix}</dt>
        <dd>
          <span class="lk-mono">{unix}</span>
          <span class="lk-sub lk-mono">{p.parts.timestamp} {t.ms}</span>
        </dd>
        <dt>{t.discordTs}</dt>
        <dd>
          <code class="lk-mono">{`<t:${unix}:F>`}</code>
          <CopyButton text={`<t:${unix}:F>`} lang={lang} size="sm" variant="icon" />
        </dd>
      </dl>
      <details class="sf-details">
        <summary>{t.internals}</summary>
        <dl class="lk-kv">
          <dt>{t.worker}</dt>
          <dd class="lk-mono">{p.parts.workerId}</dd>
          <dt>{t.process}</dt>
          <dd class="lk-mono">{p.parts.processId}</dd>
          <dt>{t.increment}</dt>
          <dd class="lk-mono">{p.parts.increment}</dd>
        </dl>
        <p class="lk-sub sf-bin-label">{t.binary}</p>
        <code class="sf-bin" aria-label={bin}>
          <span class="sf-b-ts" title="timestamp">{bin.slice(0, 42)}</span>
          <span class="sf-b-w" title={t.worker}>{bin.slice(42, 47)}</span>
          <span class="sf-b-p" title={t.process}>{bin.slice(47, 52)}</span>
          <span class="sf-b-i" title={t.increment}>{bin.slice(52)}</span>
        </code>
        <p class="lk-sub">{t.internalsNote}</p>
      </details>
    </article>
  );
}

function IdField({ id, label, value, onInput, t }: { id: string; label: string; value: string; onInput: (v: string) => void; t: T }) {
  const ok = !value || isSnowflake(value.trim());
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <input
        id={id}
        class="input mono"
        type="text"
        inputMode="numeric"
        autocomplete="off"
        spellcheck={false}
        value={value}
        aria-invalid={!ok}
        aria-describedby={!ok ? `${id}-err` : undefined}
        onInput={(e) => onInput((e.currentTarget as HTMLInputElement).value.replace(/[^\d]/g, ""))}
      />
      {!ok && (
        <span id={`${id}-err`} class="hint sf-err">
          {t.invalidId}
        </span>
      )}
    </div>
  );
}

export default function Snowflake({ lang }: { lang: Lang }) {
  const t = L[lang];
  const [text, setText] = useState(EXAMPLE);
  const [now, setNow] = useState(() => Date.now());
  const [dateStr, setDateStr] = useState(() => toLocalInput(Date.UTC(2025, 0, 1)));
  const [a, setA] = useState("175928847299117063");
  const [b, setB] = useState("613425648685547541");

  useEffect(() => {
    // Allow /snowflake#<id> links from other tools (IDs are not secret).
    const ids = idsFromHash(location.hash);
    if (ids) setText(ids.join("\n"));
    const iv = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(iv);
  }, []);

  const parsed = useMemo(() => parseSnowflakeInput(text, now), [text, now]);
  const count = parsed.groups.reduce((n, g) => n + g.ids.length, 0);
  const compact = parsed.groups.length > 3 || count > 4;

  const reverse = useMemo(() => {
    const ms = new Date(dateStr).getTime();
    if (!Number.isFinite(ms)) return null;
    if (BigInt(ms) < DISCORD_EPOCH) return "epoch" as const;
    return snowflakeRange(ms);
  }, [dateStr]);

  const cmp = useMemo(() => {
    const A = a.trim(),
      B = b.trim();
    if (!isSnowflake(A) || !isSnowflake(B)) return null;
    const c = compareSnowflakes(A, B);
    const da = decodeSnowflake(A).timestamp,
      db = decodeSnowflake(B).timestamp;
    return { ...c, text: formatDiff(calendarDiff(da, db), lang, 4) };
  }, [a, b, lang]);

  const examples: [string, string][] = [
    [t.exId, "175928847299117063"],
    [t.exLink, "https://discord.com/channels/613425648685547541/613430047285706767/1234567891234567890"],
    [t.exMention, "<@175928847299117063> <#613430047285706767>"],
    [t.exExcel, "1,75929E+17"],
  ];

  return (
    <div class="stack sf">
      <section class="panel stack">
        <div class="field">
          <label for="sf-input">{t.inputLabel}</label>
          <textarea
            id="sf-input"
            class="textarea mono sf-textarea"
            value={text}
            rows={3}
            autocomplete="off"
            spellcheck={false}
            aria-describedby="sf-input-hint"
            onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
          />
          <span id="sf-input-hint" class="hint">{t.inputHint}</span>
        </div>
        <div class="lk-examples">
          <span>{t.examples}</span>
          {examples.map(([label, v]) => (
            <button type="button" key={label} onClick={() => setText(v)}>
              {label}
            </button>
          ))}
          {text && (
            <button type="button" onClick={() => setText("")}>
              {t.clear}
            </button>
          )}
        </div>
      </section>

      <div aria-live="polite" class="stack">
        {parsed.problems.map((p, i) => (
          <Notice key={i} kind={p.problem === "token" ? "error" : "warn"} title={`„${p.source.length > 60 ? p.source.slice(0, 57) + "…" : p.source}“ ${t.problems[p.problem]}`}>
            {p.approx && (
              <p>
                {t.approx} <span class="lk-mono">{p.approx}</span>
              </p>
            )}
            {p.problem === "invite" && (
              <p>
                <a href={toolHref("invite-lookup", lang)}>{t.inviteTool}</a>
              </p>
            )}
          </Notice>
        ))}
        {parsed.groups.length === 0 && parsed.problems.length === 0 && <Notice title={t.empty} />}
      </div>

      {parsed.groups.length > 0 && (
        <div class={compact ? "sf-grid is-compact" : "sf-grid"}>
          {parsed.groups.map((g, gi) =>
            g.link ? (
              <section class="sf-link" key={gi}>
                <h3 class="sf-link-title">
                  <Icon name="Link" size={16} /> {g.link === "message" ? t.link : t.channelLink}
                </h3>
                <div class="sf-link-cards">
                  {g.ids.map((p) => (
                    <IdCard key={p.kind + p.id} p={p} t={t} lang={lang} now={now} compact />
                  ))}
                </div>
              </section>
            ) : (
              <IdCard key={gi} p={g.ids[0]!} t={t} lang={lang} now={now} compact={compact} />
            ),
          )}
        </div>
      )}

      <div class="grid-2 sf-tools">
        <section class="panel stack" aria-labelledby="sf-rev-title">
          <h2 class="panel-title" id="sf-rev-title">
            {t.reverseTitle}
          </h2>
          <div class="field">
            <label for="sf-date">{t.dateLabel}</label>
            <div class="lk-input-row">
              <input id="sf-date" class="input" type="datetime-local" step={1} value={dateStr} onInput={(e) => setDateStr((e.currentTarget as HTMLInputElement).value)} />
              <button type="button" class="btn" onClick={() => setDateStr(toLocalInput(Date.now()))}>
                <Icon name="Clock" size={16} /> {t.now}
              </button>
            </div>
          </div>
          {reverse === "epoch" ? (
            <Notice kind="warn" title={t.beforeEpoch} />
          ) : reverse ? (
            <>
              <div class="field">
                <span class="label">{t.minId}</span>
                <div class="output">
                  <code>{reverse.min}</code>
                  <CopyButton text={reverse.min} lang={lang} size="sm" />
                </div>
              </div>
              <div class="field">
                <span class="label">{t.maxId}</span>
                <div class="output">
                  <code>{reverse.max}</code>
                  <CopyButton text={reverse.max} lang={lang} size="sm" />
                </div>
              </div>
            </>
          ) : null}
          <p class="hint">{t.reverseHint}</p>
        </section>

        <section class="panel stack" aria-labelledby="sf-cmp-title">
          <h2 class="panel-title" id="sf-cmp-title">
            {t.compareTitle}
          </h2>
          <div class="grid-2 sf-cmp-inputs">
            <IdField id="sf-a" label={t.a} value={a} onInput={setA} t={t} />
            <IdField id="sf-b" label={t.b} value={b} onInput={setB} t={t} />
          </div>
          {cmp && (
            <div class="sf-cmp" aria-live="polite">
              <p class="sf-cmp-head">{cmp.older === "same" ? t.same : cmp.diffMs === 0 ? t.sameMs : t.older(cmp.older === "a" ? t.a : t.b)}</p>
              {cmp.older !== "same" && cmp.diffMs > 0 && (
                <dl class="lk-kv">
                  <dt>{t.diff}</dt>
                  <dd>{cmp.text}</dd>
                  <dt>{t.exact}</dt>
                  <dd class="lk-mono">
                    {Math.floor(cmp.diffMs / 1000).toLocaleString(localeOf(lang))} {t.seconds}
                  </dd>
                </dl>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
