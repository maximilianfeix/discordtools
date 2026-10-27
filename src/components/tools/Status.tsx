import { useEffect, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import { ApiErrorNotice, Notice, Skeleton, localeOf } from "./lookup-ui";
import { apiFetch, type ApiError } from "../../lib/discord-api";
import {
  COMPONENT_STATUS,
  IMPACT,
  INCIDENT_STATUS,
  INDICATOR,
  SUMMARY_URL,
  componentHint,
  componentName,
  groupComponents,
  label,
  type ComponentStatus,
  type Indicator,
  type SpIncident,
  type Summary,
} from "../../lib/status";
import "./Status.css";

const REFRESH_MS = 60_000;

const L = {
  de: {
    loading: "Lade Status von discordstatus.com …",
    refresh: "Aktualisieren",
    updated: "Stand laut Discord",
    checked: (s: string) => `Zuletzt geprüft ${s}`,
    auto: "Aktualisiert sich jede Minute, solange der Tab offen ist.",
    original: "Original",
    incidents: "Aktuelle Störungen",
    maintenance: "Geplante Wartungen",
    none: "Keine aktuellen Störungen gemeldet",
    noneBody: "Wenn Discord bei dir trotzdem hakt, liegt es oft an deiner Verbindung, einer bestimmten Region oder am Client. Probier Neuladen (Strg + R) oder die Web-Version.",
    components: "Dienste",
    affected: "Betroffen",
    started: "Seit",
    scheduled: "Geplant",
    until: "bis",
    regions: (n: number) => `${n} Teilbereiche anzeigen`,
    more: "Auf discordstatus.com ansehen",
    englishNote: "Die Meldungen schreibt Discord auf Englisch.",
    retry: "Erneut versuchen",
    errorTitle: "Status konnte nicht geladen werden",
    justNow: "gerade eben",
  },
  en: {
    loading: "Loading status from discordstatus.com …",
    refresh: "Refresh",
    updated: "As reported by Discord",
    checked: (s: string) => `Last checked ${s}`,
    auto: "Refreshes every minute while the tab is open.",
    original: "Original",
    incidents: "Current incidents",
    maintenance: "Scheduled maintenance",
    none: "No current incidents reported",
    noneBody: "If Discord still acts up for you, it's often your connection, a specific region or the client. Try reloading (Ctrl + R) or the web version.",
    components: "Services",
    affected: "Affected",
    started: "Since",
    scheduled: "Scheduled",
    until: "until",
    regions: (n: number) => `Show ${n} sub-components`,
    more: "View on discordstatus.com",
    englishNote: "",
    retry: "Try again",
    errorTitle: "Couldn't load the status",
    justNow: "just now",
  },
};

type T = (typeof L)["de"];

const PILL: Record<ComponentStatus, string> = {
  operational: "is-ok",
  degraded_performance: "is-warn",
  partial_outage: "is-warn",
  major_outage: "is-bad",
  under_maintenance: "is-info",
};
const HERO: Record<Indicator, string> = { none: "is-ok", minor: "is-warn", major: "is-bad", critical: "is-bad", maintenance: "is-info" };
const IMPACT_CLASS: Record<string, string> = { none: "is-info", minor: "is-warn", major: "is-bad", critical: "is-bad", maintenance: "is-info" };

function relTime(ms: number, lang: Lang, t: T): string {
  const s = Math.round((ms - Date.now()) / 1000);
  if (Math.abs(s) < 10) return t.justNow;
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  if (Math.abs(s) < 60) return rtf.format(s, "second");
  if (Math.abs(s) < 3600) return rtf.format(Math.round(s / 60), "minute");
  if (Math.abs(s) < 86400) return rtf.format(Math.round(s / 3600), "hour");
  return rtf.format(Math.round(s / 86400), "day");
}

export default function Status({ lang }: { lang: Lang }) {
  const t = L[lang];
  const locale = localeOf(lang);
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkedAt, setCheckedAt] = useState(0);
  const [, tick] = useState(0);
  const busy = useRef(false);
  const lastRef = useRef(0);

  const load = async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    const r = await apiFetch<Summary>(SUMMARY_URL);
    busy.current = false;
    setLoading(false);
    lastRef.current = Date.now();
    setCheckedAt(lastRef.current);
    if (r.ok && r.data?.status) {
      setData(r.data);
      setError(null);
    } else if (!r.ok) setError(r.error);
  };

  useEffect(() => {
    load();
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, REFRESH_MS);
    const clock = setInterval(() => tick((x) => x + 1), 15_000);
    const onVis = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRef.current > REFRESH_MS) load();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(iv);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  if (!data)
    return (
      <div class="stack st" aria-live="polite">
        {error ? (
          <>
            <ApiErrorNotice err={error} lang={lang} title={t.errorTitle} />
            <div>
              <button type="button" class="btn" onClick={load} disabled={loading}>
                <Icon name="RefreshCw" size={16} /> {t.retry}
              </button>
            </div>
          </>
        ) : (
          <div class="panel">
            <Skeleton label={t.loading} />
          </div>
        )}
      </div>
    );

  const groups = groupComponents(data.components);
  const ind = data.status.indicator;
  const active = data.incidents.filter((i) => i.status !== "resolved" && i.status !== "postmortem");
  const maint = data.scheduled_maintenances.filter((m) => m.status !== "completed");

  return (
    <div class="stack st">
      <section class={`st-hero ${HERO[ind] ?? "is-warn"}`} aria-live="polite">
        <span class="st-hero-icon">
          <Icon name={ind === "none" ? "Check" : ind === "maintenance" ? "Info" : "TriangleAlert"} size={26} />
        </span>
        <div>
          <h2>{label(INDICATOR, ind, lang)}</h2>
          {lang === "de" && (
            <p class="hint">
              {t.original}: „{data.status.description}“
            </p>
          )}
          <p class="hint">
            {t.updated}: {dtf.format(new Date(data.page.updated_at))}
          </p>
        </div>
        <div class="st-hero-actions">
          <button type="button" class="btn" onClick={load} disabled={loading}>
            <Icon name="RefreshCw" size={16} class={loading ? "st-spin" : undefined} /> {t.refresh}
          </button>
          <span class="hint">{t.checked(relTime(checkedAt, lang, t))}</span>
        </div>
      </section>
      {error && <ApiErrorNotice err={error} lang={lang} />}
      <p class="hint" style={{ margin: 0 }}>
        {t.auto}
      </p>

      {active.length > 0 && (
        <section class="stack" aria-labelledby="st-inc">
          <h2 class="lk-section-title" id="st-inc">
            {t.incidents}
          </h2>
          {active.map((i) => (
            <Incident key={i.id} i={i} t={t} lang={lang} dtf={dtf} />
          ))}
        </section>
      )}
      {maint.length > 0 && (
        <section class="stack" aria-labelledby="st-maint">
          <h2 class="lk-section-title" id="st-maint">
            {t.maintenance}
          </h2>
          {maint.map((i) => (
            <Incident key={i.id} i={i} t={t} lang={lang} dtf={dtf} maintenance />
          ))}
        </section>
      )}
      {active.length === 0 && maint.length === 0 && (
        <Notice kind="ok" title={t.none}>
          <p>{t.noneBody}</p>
        </Notice>
      )}

      <section class="stack" aria-labelledby="st-comp">
        <h2 class="lk-section-title" id="st-comp">
          {t.components}
        </h2>
        <div class="st-groups">
          {groups.map((g) => {
            const hint = componentHint(g.name, lang);
            const bad = g.children.some((c) => c.status !== "operational");
            return (
              <div class="st-group" key={g.id}>
                <div class="st-row">
                  <span class="st-row-name">
                    <strong>{componentName(g.name, lang)}</strong>
                    {hint && <span>{hint}</span>}
                  </span>
                  <span class={`lk-pill ${PILL[g.status]}`}>{label(COMPONENT_STATUS, g.status, lang)}</span>
                </div>
                {g.children.length > 0 && (
                  <details class="st-children" open={bad}>
                    <summary>{t.regions(g.children.length)}</summary>
                    <ul>
                      {g.children.map((c) => (
                        <li class="st-row" key={c.id}>
                          <span>{componentName(c.name, lang)}</span>
                          <span class={`lk-pill ${PILL[c.status]}`}>{label(COMPONENT_STATUS, c.status, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p>
        <a class="btn" href="https://discordstatus.com" target="_blank" rel="noopener noreferrer">
          <Icon name="ExternalLink" size={16} /> {t.more}
        </a>
      </p>
    </div>
  );
}

function Incident({ i, t, lang, dtf, maintenance }: { i: SpIncident; t: T; lang: Lang; dtf: Intl.DateTimeFormat; maintenance?: boolean }) {
  const updates = [...i.incident_updates].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  return (
    <article class={`st-incident ${maintenance ? "is-info" : IMPACT_CLASS[i.impact] === "is-bad" ? "is-bad" : ""}`}>
      <h3>{i.name}</h3>
      <div class="st-meta">
        <span class={`lk-pill ${maintenance ? "is-info" : (IMPACT_CLASS[i.impact] ?? "is-warn")}`}>{label(IMPACT, i.impact, lang)}</span>
        <span>{label(INCIDENT_STATUS, i.status, lang)}</span>
        {maintenance && i.scheduled_for ? (
          <span>
            {t.scheduled}: {dtf.format(new Date(i.scheduled_for))}
            {i.scheduled_until && ` ${t.until} ${dtf.format(new Date(i.scheduled_until))}`}
          </span>
        ) : (
          <span>
            {t.started}: {dtf.format(new Date(i.started_at ?? i.created_at))}
          </span>
        )}
      </div>
      {i.components && i.components.length > 0 && (
        <div class="st-meta">
          <span>{t.affected}:</span>
          {i.components.map((c) => (
            <span class="chip" key={c.id}>
              {componentName(c.name, lang)}
            </span>
          ))}
        </div>
      )}
      <ol class="st-timeline">
        {updates.map((u) => (
          <li key={u.id}>
            <div class="st-up-head">
              <strong>{label(INCIDENT_STATUS, u.status, lang)}</strong>
              <span class="hint">{dtf.format(new Date(u.display_at ?? u.created_at))}</span>
            </div>
            <p class="st-up-body" lang="en">
              {u.body}
            </p>
          </li>
        ))}
      </ol>
      <div class="st-meta">
        {t.englishNote && <span>{t.englishNote}</span>}
        {i.shortlink && (
          <a href={i.shortlink} target="_blank" rel="noopener noreferrer">
            {t.more}
          </a>
        )}
      </div>
    </article>
  );
}
