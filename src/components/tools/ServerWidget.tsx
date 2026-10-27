import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { ApiErrorNotice, Notice, PrivacyNote, Skeleton, localeOf, toolHref } from "./lookup-ui";
import { apiFetch, type ApiError } from "../../lib/discord-api";
import {
  WIDGET_STYLES,
  parseGuildId,
  statusCounts,
  widgetHtml,
  widgetIframe,
  widgetJsonUrl,
  widgetMarkdown,
  widgetPngUrl,
  type Widget,
  type WidgetStyle,
} from "../../lib/widget";
import "./ServerWidget.css";

const EXAMPLE = "81384788765712384";

const L = {
  de: {
    label: "Server-ID",
    hint: "Rechtsklick auf den Servernamen → „Server-ID kopieren“ (Entwicklermodus nötig). Ein Kanallink geht auch.",
    check: "Laden",
    loading: "Lade Widget …",
    example: "Beispiel: Discord API",
    invalid: "Keine gültige Server-ID. Sie hat 17–20 Ziffern, z. B. 81384788765712384.",
    disabledTitle: "Das Widget ist bei diesem Server ausgeschaltet",
    disabledBody: "Discord zeigt die Daten nur, wenn der Server sein Widget aktiviert hat. Wenn es dein Server ist:",
    disabledSteps: [
      "Öffne die Server-Einstellungen (Klick auf den Servernamen).",
      "Wähle „Widget“ (unter „Apps“ bzw. „Engagement“, je nach Version).",
      "Schalte „Server-Widget aktivieren“ ein und wähle optional einen Einladungskanal.",
      "Lade hier neu – Discord cached das Ergebnis bis zu 5 Minuten.",
    ],
    disabledNote: "Dafür brauchst du die Berechtigung „Server verwalten“.",
    unknownTitle: "Server nicht gefunden",
    unknownBody: "Discord kennt keinen Server mit dieser ID. Prüf, ob du wirklich die Server-ID (nicht Kanal- oder Nutzer-ID) kopiert hast.",
    online: "online",
    onlineHint: "Zählt nur Mitglieder, die im Widget sichtbar sein dürfen.",
    invite: "Einladung",
    noInvite: "Kein Einladungskanal im Widget gewählt.",
    inviteCheck: "Einladung prüfen",
    channels: "Sprachkanäle",
    noChannels: "Keine öffentlich sichtbaren Sprachkanäle.",
    members: "Mitglieder online",
    membersNote: "So wie Discord sie liefert: höchstens 100, Namen und Avatare anonymisiert, keine echten Nutzer-IDs.",
    inVoice: "im Sprachkanal",
    status: { online: "Online", idle: "Abwesend", dnd: "Bitte nicht stören", other: "Sonstige" },
    playing: "Spielt",
    embedTitle: "Widget einbinden",
    iframe: "Offizielles Widget (iframe)",
    theme: "Design",
    dark: "Dunkel",
    light: "Hell",
    preview: "Vorschau laden",
    previewHint: "Lädt das Widget von discord.com.",
    banners: "Widget-Banner (Bild)",
    bannersHint: "Für Websites, Foren und GitHub-READMEs. Funktioniert nur, solange das Widget aktiv ist.",
    url: "Bild-URL",
    md: "Markdown",
    html: "HTML",
    createdLink: "Erstellungsdatum ansehen",
    privacy: "Die Anfrage geht direkt von deinem Browser an Discord – nicht über unseren Server.",
    retry: "Erneut versuchen",
    fetched: "Abgerufen",
    id: "Server-ID",
  },
  en: {
    label: "Server ID",
    hint: "Right-click the server name → “Copy Server ID” (needs Developer Mode). A channel link works too.",
    check: "Load",
    loading: "Loading widget …",
    example: "Example: Discord API",
    invalid: "Not a valid server ID. It has 17–20 digits, e.g. 81384788765712384.",
    disabledTitle: "This server has its widget turned off",
    disabledBody: "Discord only shares this data when the server enabled its widget. If it's your server:",
    disabledSteps: [
      "Open Server Settings (click the server name).",
      "Choose “Widget” (under “Apps” or “Engagement”, depending on version).",
      "Turn on “Enable Server Widget” and optionally pick an invite channel.",
      "Reload here – Discord caches the result for up to 5 minutes.",
    ],
    disabledNote: "You need the “Manage Server” permission for this.",
    unknownTitle: "Server not found",
    unknownBody: "Discord doesn't know a server with this ID. Check that you copied the server ID (not a channel or user ID).",
    online: "online",
    onlineHint: "Only counts members who may appear in the widget.",
    invite: "Invite",
    noInvite: "No invite channel selected in the widget.",
    inviteCheck: "Check invite",
    channels: "Voice channels",
    noChannels: "No publicly visible voice channels.",
    members: "Members online",
    membersNote: "As Discord returns them: at most 100, names and avatars anonymized, no real user IDs.",
    inVoice: "in voice",
    status: { online: "Online", idle: "Idle", dnd: "Do not disturb", other: "Other" },
    playing: "Playing",
    embedTitle: "Embed the widget",
    iframe: "Official widget (iframe)",
    theme: "Theme",
    dark: "Dark",
    light: "Light",
    preview: "Load preview",
    previewHint: "Loads the widget from discord.com.",
    banners: "Widget banners (image)",
    bannersHint: "For websites, forums and GitHub READMEs. Only works while the widget is enabled.",
    url: "Image URL",
    md: "Markdown",
    html: "HTML",
    createdLink: "See creation date",
    privacy: "The request goes straight from your browser to Discord – not through our server.",
    retry: "Try again",
    fetched: "Fetched",
    id: "Server ID",
  },
};

type State = { s: "idle" } | { s: "loading" } | { s: "ok"; w: Widget; at: Date } | { s: "error"; error: ApiError };

export default function ServerWidget({ lang }: { lang: Lang }) {
  const t = L[lang];
  const [input, setInput] = useState(EXAMPLE);
  const [gid, setGid] = useState<string | null>(null);
  const [state, setState] = useState<State>({ s: "idle" });
  const [inputError, setInputError] = useState(false);
  const ctrl = useRef<AbortController | null>(null);

  const load = async (raw = input) => {
    const id = parseGuildId(raw);
    if (!id) {
      setInputError(true);
      return;
    }
    setInputError(false);
    setGid(id);
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState({ s: "loading" });
    const r = await apiFetch<Widget>(widgetJsonUrl(id), { signal: c.signal });
    if (c.signal.aborted) return;
    if (r.ok) setState({ s: "ok", w: r.data, at: new Date() });
    else if (r.error.kind !== "aborted") setState({ s: "error", error: r.error });
  };

  useEffect(() => {
    load(EXAMPLE);
    return () => ctrl.current?.abort();
  }, []);

  return (
    <div class="stack sw">
      <form
        class="panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div class="field">
          <label for="sw-input">{t.label}</label>
          <div class="lk-input-row">
            <input
              id="sw-input"
              class="input mono"
              type="text"
              inputMode="numeric"
              autocomplete="off"
              spellcheck={false}
              enterkeyhint="search"
              value={input}
              aria-invalid={inputError}
              aria-describedby="sw-hint"
              onInput={(e) => {
                setInput((e.currentTarget as HTMLInputElement).value);
                setInputError(false);
              }}
            />
            <button type="submit" class="btn btn-primary" disabled={state.s === "loading"}>
              <Icon name="Search" size={17} /> {t.check}
            </button>
          </div>
          <span id="sw-hint" class="hint">{t.hint}</span>
        </div>
        <div class="lk-examples">
          <button
            type="button"
            onClick={() => {
              setInput(EXAMPLE);
              load(EXAMPLE);
            }}
          >
            {t.example}
          </button>
        </div>
        {inputError && <Notice kind="error" title={t.invalid} live />}
        <PrivacyNote>{t.privacy}</PrivacyNote>
      </form>

      <div aria-live="polite" aria-busy={state.s === "loading"}>
        {state.s === "loading" && (
          <div class="panel">
            <Skeleton label={t.loading} />
          </div>
        )}
        {state.s === "error" && <WidgetError err={state.error} t={t} lang={lang} retry={() => load()} />}
        {state.s === "ok" && <WidgetView w={state.w} at={state.at} t={t} lang={lang} />}
      </div>

      {gid && <EmbedPanel id={gid} t={t} lang={lang} invite={state.s === "ok" ? state.w.instant_invite : null} enabled={state.s === "ok"} />}
    </div>
  );
}

type T = (typeof L)["de"];

function WidgetError({ err, t, lang, retry }: { err: ApiError; t: T; lang: Lang; retry: () => void }) {
  if (err.kind === "forbidden" && err.code === 50004)
    return (
      <Notice kind="warn" title={t.disabledTitle} live>
        <p>{t.disabledBody}</p>
        <ol>
          {t.disabledSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p>{t.disabledNote}</p>
      </Notice>
    );
  if (err.kind === "notfound") return <ApiErrorNotice err={err} lang={lang} title={t.unknownTitle} body={<p>{t.unknownBody}</p>} />;
  return (
    <div class="stack">
      <ApiErrorNotice err={err} lang={lang} />
      <div>
        <button type="button" class="btn" onClick={retry}>
          <Icon name="RefreshCw" size={16} /> {t.retry}
        </button>
      </div>
    </div>
  );
}

function WidgetView({ w, at, t, lang }: { w: Widget; at: Date; t: T; lang: Lang }) {
  const locale = localeOf(lang);
  const nf = new Intl.NumberFormat(locale);
  const counts = statusCounts(w.members);
  const channels = [...w.channels].sort((a, b) => a.position - b.position);
  const inChannel = useMemo(() => {
    const m = new Map<string, Widget["members"]>();
    for (const x of w.members) if (x.channel_id) m.set(x.channel_id, [...(m.get(x.channel_id) ?? []), x]);
    return m;
  }, [w]);

  return (
    <div class="stack">
      <section class="panel sw-head">
        <div class="sw-head-main">
          <h2 class="sw-name">{w.name}</h2>
          <p class="sw-online">
            <span class="sw-dot is-online" aria-hidden="true" />
            <strong>{nf.format(w.presence_count)}</strong> {t.online}
          </p>
          <p class="hint">{t.onlineHint}</p>
        </div>
        <dl class="lk-kv sw-kv">
          <dt>{t.id}</dt>
          <dd>
            <code class="lk-mono">{w.id}</code>
            <CopyButton text={w.id} lang={lang} size="sm" variant="icon" />
            <a href={toolHref("snowflake", lang, w.id)}>{t.createdLink}</a>
          </dd>
          <dt>{t.invite}</dt>
          <dd>
            {w.instant_invite ? (
              <>
                <code class="lk-mono">{w.instant_invite.replace(/^https?:\/\//, "")}</code>
                <CopyButton text={w.instant_invite} lang={lang} size="sm" variant="icon" />
                <a href={toolHref("invite-lookup", lang)}>{t.inviteCheck}</a>
              </>
            ) : (
              <span class="lk-sub">{t.noInvite}</span>
            )}
          </dd>
          <dt>{t.fetched}</dt>
          <dd>{at.toLocaleTimeString(locale)}</dd>
        </dl>
      </section>

      <div class="sw-cols">
        <section class="panel">
          <h3 class="panel-title">
            {t.channels} <span class="chip">{channels.length}</span>
          </h3>
          {channels.length === 0 ? (
            <p class="hint">{t.noChannels}</p>
          ) : (
            <ul class="sw-channels">
              {channels.map((c) => (
                <li key={c.id}>
                  <span class="sw-ch-name">
                    <Icon name="Radio" size={15} /> {c.name}
                  </span>
                  {inChannel.get(c.id) && (
                    <ul class="sw-ch-members">
                      {inChannel.get(c.id)!.map((m) => (
                        <li key={m.id}>
                          {m.avatar_url && <img src={m.avatar_url} alt="" width={20} height={20} loading="lazy" />}
                          {m.username}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section class="panel">
          <h3 class="panel-title">
            {t.members} <span class="chip">{w.members.length}</span>
          </h3>
          <div class="lk-chips sw-counts">
            {(["online", "idle", "dnd"] as const).map((k) =>
              counts[k] ? (
                <span class="chip" key={k}>
                  <span class={`sw-dot is-${k}`} aria-hidden="true" />
                  {t.status[k]}: {counts[k]}
                </span>
              ) : null,
            )}
          </div>
          <ul class="sw-members">
            {w.members.map((m) => (
              <li key={m.id + m.username}>
                <span class="sw-av">
                  {m.avatar_url ? <img src={m.avatar_url} alt="" width={32} height={32} loading="lazy" /> : <span />}
                  <span class={`sw-av-dot is-${m.status}`} title={t.status[(m.status as "online") in t.status ? (m.status as "online") : "other"]} />
                </span>
                <span class="sw-m-text">
                  <span class="sw-m-name">{m.username}</span>
                  {m.game?.name && (
                    <span class="sw-m-game">
                      {t.playing} {m.game.name}
                    </span>
                  )}
                  {m.channel_id && !m.game && <span class="sw-m-game">{t.inVoice}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p class="hint sw-note">{t.membersNote}</p>
        </section>
      </div>
    </div>
  );
}

function EmbedPanel({ id, t, lang, invite, enabled }: { id: string; t: T; lang: Lang; invite: string | null; enabled: boolean }) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [preview, setPreview] = useState(false);
  const [style, setStyle] = useState<WidgetStyle>("banner2");
  useEffect(() => setPreview(false), [id]);
  const code = widgetIframe(id, theme);
  return (
    <section class="panel stack sw-embed" aria-labelledby="sw-embed-title">
      <h2 class="panel-title" id="sw-embed-title">
        {t.embedTitle}
      </h2>
      <div class="sw-embed-grid">
        <div class="stack">
          <div class="row sw-row-between">
            <span class="label">{t.iframe}</span>
            <div class="segmented" role="group" aria-label={t.theme}>
              <button type="button" aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}>
                {t.dark}
              </button>
              <button type="button" aria-pressed={theme === "light"} onClick={() => setTheme("light")}>
                {t.light}
              </button>
            </div>
          </div>
          <div class="output sw-code">
            <code>{code}</code>
            <CopyButton text={code} lang={lang} size="sm" />
          </div>
          {preview ? (
            <iframe
              class="sw-iframe"
              src={`https://discord.com/widget?id=${id}&theme=${theme}`}
              width={350}
              height={500}
              title="Discord widget"
              sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
            />
          ) : (
            <div>
              <button type="button" class="btn" onClick={() => setPreview(true)} disabled={!enabled}>
                <Icon name="Eye" size={16} /> {t.preview}
              </button>
              <p class="hint">{t.previewHint}</p>
            </div>
          )}
        </div>

        <div class="stack">
          <span class="label">{t.banners}</span>
          <div class="segmented sw-styles" role="group" aria-label={t.banners}>
            {WIDGET_STYLES.map((s) => (
              <button type="button" key={s} aria-pressed={style === s} onClick={() => setStyle(s)}>
                {s}
              </button>
            ))}
          </div>
          <div class="sw-banner-preview">
            {enabled ? <img src={widgetPngUrl(id, style)} alt={`widget.png ${style}`} loading="lazy" /> : <span class="hint">{t.bannersHint}</span>}
          </div>
          <div class="field">
            <span class="label">{t.url}</span>
            <div class="output">
              <code>{widgetPngUrl(id, style)}</code>
              <CopyButton text={widgetPngUrl(id, style)} lang={lang} size="sm" />
            </div>
          </div>
          <div class="field">
            <span class="label">{t.md}</span>
            <div class="output">
              <code>{widgetMarkdown(id, style, invite)}</code>
              <CopyButton text={widgetMarkdown(id, style, invite)} lang={lang} size="sm" />
            </div>
          </div>
          <div class="field">
            <span class="label">{t.html}</span>
            <div class="output">
              <code>{widgetHtml(id, style, invite)}</code>
              <CopyButton text={widgetHtml(id, style, invite)} lang={lang} size="sm" />
            </div>
          </div>
          <p class="hint">{t.bannersHint}</p>
        </div>
      </div>
    </section>
  );
}
