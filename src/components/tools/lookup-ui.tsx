import type { ComponentChildren } from "preact";
import Icon from "../Icon";
import type { ApiError } from "../../lib/discord-api";
import type { Lang } from "../../i18n/ui";
import "./lookup.css";

/** Friendly message box for errors, warnings and hints. */
export function Notice({
  kind = "info",
  title,
  children,
  live,
}: {
  kind?: "info" | "error" | "warn" | "ok";
  title: string;
  children?: ComponentChildren;
  live?: boolean;
}) {
  const icon = kind === "error" || kind === "warn" ? "TriangleAlert" : kind === "ok" ? "Check" : "Info";
  return (
    <div class={`lk-notice is-${kind}`} role={live ? (kind === "error" ? "alert" : "status") : undefined}>
      <Icon name={icon} size={18} />
      <p class="lk-notice-title">{title}</p>
      {children && <div class="lk-notice-body">{children}</div>}
    </div>
  );
}

export function Skeleton({ label }: { label: string }) {
  return (
    <div class="lk-skeleton" role="status" aria-label={label}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

const GENERIC = {
  de: {
    offline: ["Keine Verbindung zu Discord", "Du scheinst offline zu sein, oder ein Werbe-/Tracking-Blocker blockiert discord.com. Prüf deine Verbindung und versuch es noch mal."],
    ratelimit: ["Zu viele Anfragen", "Discord bremst gerade Anfragen von deiner IP-Adresse. Warte {s} Sekunden und versuch es dann erneut."],
    server: ["Discord hat einen Fehler gemeldet", "Das liegt nicht an deiner Eingabe. Discord hat gerade Probleme – versuch es in ein paar Minuten noch mal."],
    badrequest: ["Discord hat die Anfrage abgelehnt", "Etwas an den Daten passt nicht."],
    unauthorized: ["Nicht erlaubt", "Discord hat die Anfrage als nicht berechtigt abgelehnt."],
    forbidden: ["Kein Zugriff", "Discord gibt diese Daten nicht öffentlich heraus."],
    notfound: ["Nicht gefunden", "Discord kennt diese Angabe nicht."],
    aborted: ["Abgebrochen", ""],
  },
  en: {
    offline: ["Can't reach Discord", "You seem to be offline, or an ad/tracking blocker is blocking discord.com. Check your connection and try again."],
    ratelimit: ["Too many requests", "Discord is rate-limiting requests from your IP address. Wait {s} seconds, then try again."],
    server: ["Discord returned an error", "It's not your input. Discord is having trouble right now – try again in a few minutes."],
    badrequest: ["Discord rejected the request", "Something about the data isn't right."],
    unauthorized: ["Not allowed", "Discord rejected the request as unauthorized."],
    forbidden: ["No access", "Discord doesn't share this data publicly."],
    notfound: ["Not found", "Discord doesn't know this one."],
    aborted: ["Cancelled", ""],
  },
} as const;

/** Default title/body for an API error; tools override the cases they know better. */
export function errorText(err: ApiError, lang: Lang): { title: string; body: string } {
  const [title, body] = GENERIC[lang][err.kind];
  const secs = err.retryAfter !== undefined ? Math.max(1, Math.ceil(err.retryAfter)) : lang === "de" ? "ein paar" : "a few";
  return { title, body: body.replace("{s}", String(secs)) };
}

export function ApiErrorNotice({ err, lang, title, body }: { err: ApiError; lang: Lang; title?: string; body?: ComponentChildren }) {
  const t = errorText(err, lang);
  return (
    <Notice kind="error" title={title ?? t.title} live>
      {body ?? (t.body && <p>{t.body}</p>)}
      {err.details && err.details.length > 0 && (
        <ul>
          {err.details.map((d) => (
            <li key={d} class="lk-mono">{d}</li>
          ))}
        </ul>
      )}
    </Notice>
  );
}

export function PrivacyNote({ children }: { children: ComponentChildren }) {
  return (
    <p class="lk-privacy">
      <Icon name="ShieldCheck" size={15} />
      <span>{children}</span>
    </p>
  );
}

/** Slugs of the sibling tools we link to (kept here so islands don't bundle the whole registry). */
const SLUGS = {
  snowflake: { de: "snowflake", en: "snowflake" },
  "invite-lookup": { de: "einladung-pruefen", en: "invite-lookup" },
  "server-widget": { de: "server-widget", en: "server-widget" },
  "emoji-downloader": { de: "emoji-download", en: "emoji-downloader" },
  "embed-builder": { de: "embed-builder", en: "embed-builder" },
  "color-converter": { de: "embed-farben", en: "embed-colors" },
  "role-colors": { de: "rollenfarben", en: "role-colors" },
  timestamp: { de: "zeitstempel", en: "timestamp" },
} as const;

export function toolHref(id: keyof typeof SLUGS, lang: Lang, hash = ""): string {
  const s = SLUGS[id];
  return (lang === "de" ? `/${s.de}` : `/en/${s.en}`) + (hash ? `#${hash}` : "");
}

export function localeOf(lang: Lang): string {
  return lang === "de" ? "de-DE" : "en-GB";
}
