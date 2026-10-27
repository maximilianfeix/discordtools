import { useEffect, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { ApiErrorNotice, Notice, PrivacyNote, Skeleton, localeOf, toolHref } from "./lookup-ui";
import { apiFetch, looksLikeToken, type ApiError } from "../../lib/discord-api";
import {
  BOOST_TIER,
  CHANNEL_TYPE,
  INVITE_TYPE,
  KEY_FEATURES,
  NSFW_LEVEL,
  VERIFICATION,
  featureLabel,
  guildBannerUrl,
  guildIconUrl,
  guildSplashUrl,
  guildTagBadgeUrl,
  inviteApiUrl,
  inviteUrl,
  parseInviteCode,
  sortFeatures,
  type Invite,
} from "../../lib/invite";
import { calendarDiff, formatDiff } from "../../lib/snowflake-input";
import { decodeSnowflake } from "../../lib/snowflake";
import "./InviteLookup.css";

const EXAMPLE = "discord.gg/discord-developers";

const L = {
  de: {
    label: "Einladungslink oder Code",
    hint: "z. B. discord.gg/abc123, discord.com/invite/abc123 oder nur abc123",
    check: "Prüfen",
    loading: "Lade Einladung …",
    examples: "Beispiele:",
    invalidInput: "Das sieht nicht nach einer Einladung aus. Erlaubt sind discord.gg/…, discord.com/invite/… oder der reine Code.",
    token: "Das sieht aus wie ein Discord-Token. Gib deinen Token niemals auf einer Website ein!",
    notFoundTitle: "Einladung ungültig oder abgelaufen",
    notFoundBody: [
      "Die Einladung ist abgelaufen oder wurde gelöscht.",
      "Sie hatte eine Höchstzahl an Nutzungen, die erreicht ist.",
      "Der Server hat seine Vanity-URL geändert oder existiert nicht mehr.",
      "Tippfehler: Einladungscodes unterscheiden Groß- und Kleinschreibung.",
    ],
    members: "Mitglieder",
    online: "online",
    approx: "Ungefähre Werte – Discord aktualisiert sie nur alle paar Minuten.",
    verified: "Verifiziert",
    partnered: "Partner",
    vanity: "Vanity-URL",
    boosts: "Boosts",
    boostsN: (n: number) => `${n} Boosts`,
    verification: "Verifizierungsstufe",
    nsfw: "Inhaltsstufe (NSFW)",
    channel: "Kanal",
    expires: "Läuft ab",
    never: "Nie (dauerhafte Einladung)",
    inviter: "Eingeladen von",
    tag: "Server-Tag",
    type: "Art",
    serverId: "Server-ID",
    created: "Erstellt",
    createdAgo: (s: string) => `vor ${s}`,
    decode: "Im Snowflake-Decoder öffnen",
    features: "Funktionen",
    allFeatures: (n: number) => `Alle ${n} Server-Funktionen anzeigen`,
    open: "In Discord öffnen",
    openHint: "Öffnet die Einladung bei Discord. Beitreten musst du dort selbst bestätigen.",
    images: "Bilder",
    icon: "Icon",
    banner: "Banner",
    splash: "Einladungs-Hintergrund",
    fetched: "Abgerufen",
    safety: "Eine gültige Einladung sagt nichts darüber, ob ein Server vertrauenswürdig ist. Klick keine Links von Fremden, die dir „Free Nitro“ oder Ähnliches versprechen.",
    privacy: "Die Anfrage geht direkt von deinem Browser an Discord – nicht über unseren Server. Es wird nichts gespeichert.",
    groupDm: "Gruppen-DM",
    event: "Event",
    application: "Aktivität/App",
    copyId: "Server-ID kopieren",
    retry: "Erneut versuchen",
  },
  en: {
    label: "Invite link or code",
    hint: "e.g. discord.gg/abc123, discord.com/invite/abc123 or just abc123",
    check: "Look up",
    loading: "Loading invite …",
    examples: "Examples:",
    invalidInput: "That doesn't look like an invite. Use discord.gg/…, discord.com/invite/… or the bare code.",
    token: "That looks like a Discord token. Never enter your token on any website!",
    notFoundTitle: "Invite invalid or expired",
    notFoundBody: [
      "The invite expired or was deleted.",
      "It had a maximum number of uses that has been reached.",
      "The server changed its vanity URL or no longer exists.",
      "Typo: invite codes are case-sensitive.",
    ],
    members: "members",
    online: "online",
    approx: "Approximate – Discord only refreshes these every few minutes.",
    verified: "Verified",
    partnered: "Partner",
    vanity: "Vanity URL",
    boosts: "Boosts",
    boostsN: (n: number) => `${n} boosts`,
    verification: "Verification level",
    nsfw: "Content level (NSFW)",
    channel: "Channel",
    expires: "Expires",
    never: "Never (permanent invite)",
    inviter: "Invited by",
    tag: "Server tag",
    type: "Type",
    serverId: "Server ID",
    created: "Created",
    createdAgo: (s: string) => `${s} ago`,
    decode: "Open in snowflake decoder",
    features: "Features",
    allFeatures: (n: number) => `Show all ${n} server features`,
    open: "Open in Discord",
    openHint: "Opens the invite on Discord. You still have to confirm joining there.",
    images: "Images",
    icon: "Icon",
    banner: "Banner",
    splash: "Invite splash",
    fetched: "Fetched",
    safety: "A valid invite says nothing about whether a server is trustworthy. Don't click links from strangers promising “free Nitro” or similar.",
    privacy: "The request goes straight from your browser to Discord – not through our server. Nothing is stored.",
    groupDm: "Group DM",
    event: "Event",
    application: "Activity/app",
    copyId: "Copy server ID",
    retry: "Try again",
  },
};

type State =
  | { s: "idle" }
  | { s: "loading"; code: string }
  | { s: "ok"; invite: Invite; at: Date }
  | { s: "error"; error: ApiError; code: string };

export default function InviteLookup({ lang }: { lang: Lang }) {
  const t = L[lang];
  const locale = localeOf(lang);
  const [input, setInput] = useState(EXAMPLE);
  const [state, setState] = useState<State>({ s: "idle" });
  const [inputError, setInputError] = useState<string | null>(null);
  const ctrl = useRef<AbortController | null>(null);

  const lookup = async (raw = input) => {
    if (looksLikeToken(raw)) {
      setInputError(t.token);
      return;
    }
    const code = parseInviteCode(raw);
    if (!code) {
      setInputError(t.invalidInput);
      return;
    }
    setInputError(null);
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState({ s: "loading", code });
    const r = await apiFetch<Invite>(inviteApiUrl(code), { signal: c.signal });
    if (c.signal.aborted) return;
    if (r.ok) setState({ s: "ok", invite: r.data, at: new Date() });
    else if (r.error.kind !== "aborted") setState({ s: "error", error: r.error, code });
  };

  useEffect(() => {
    lookup(EXAMPLE);
    return () => ctrl.current?.abort();
  }, []);

  const onSubmit = (e: Event) => {
    e.preventDefault();
    lookup();
  };

  const examples: [string, string][] = [
    ["discord-developers", "discord.gg/discord-developers"],
    ["discord-testers", "https://discord.com/invite/discord-testers"],
    [lang === "de" ? "ungültig" : "invalid", "discord.gg/thisinvitedoesnotexist0"],
  ];

  return (
    <div class="stack iv">
      <form class="panel stack" onSubmit={onSubmit}>
        <div class="field">
          <label for="iv-input">{t.label}</label>
          <div class="lk-input-row">
            <input
              id="iv-input"
              class="input mono"
              type="text"
              inputMode="url"
              autocomplete="off"
              autocapitalize="off"
              spellcheck={false}
              enterkeyhint="search"
              value={input}
              aria-invalid={!!inputError}
              aria-describedby="iv-hint"
              onInput={(e) => {
                setInput((e.currentTarget as HTMLInputElement).value);
                setInputError(null);
              }}
            />
            <button type="submit" class="btn btn-primary" disabled={state.s === "loading"}>
              <Icon name="Search" size={17} /> {t.check}
            </button>
          </div>
          <span id="iv-hint" class="hint">{t.hint}</span>
        </div>
        <div class="lk-examples">
          <span>{t.examples}</span>
          {examples.map(([label, v]) => (
            <button
              type="button"
              key={v}
              onClick={() => {
                setInput(v);
                lookup(v);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {inputError && <Notice kind="error" title={inputError} live />}
        <PrivacyNote>{t.privacy}</PrivacyNote>
      </form>

      <div aria-live="polite" aria-busy={state.s === "loading"}>
        {state.s === "loading" && (
          <div class="panel">
            <Skeleton label={t.loading} />
          </div>
        )}
        {state.s === "error" &&
          (state.error.kind === "notfound" ? (
            <ApiErrorNotice
              err={state.error}
              lang={lang}
              title={t.notFoundTitle}
              body={
                <>
                  <p class="lk-mono">{state.code}</p>
                  <ul>
                    {t.notFoundBody.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </>
              }
            />
          ) : (
            <div class="stack">
              <ApiErrorNotice err={state.error} lang={lang} />
              <div>
                <button type="button" class="btn" onClick={() => lookup()}>
                  <Icon name="RefreshCw" size={16} /> {t.retry}
                </button>
              </div>
            </div>
          ))}
        {state.s === "ok" && <InviteCard invite={state.invite} at={state.at} lang={lang} t={t} locale={locale} />}
      </div>
    </div>
  );
}

function InviteCard({ invite, at, lang, t, locale }: { invite: Invite; at: Date; lang: Lang; t: (typeof L)["de"]; locale: string }) {
  const g = invite.guild;
  const gid = g?.id ?? invite.guild_id;
  const members = invite.approximate_member_count ?? invite.profile?.member_count;
  const online = invite.approximate_presence_count ?? invite.profile?.online_count;
  const nf = new Intl.NumberFormat(locale);
  const banner = g && gid ? (g.banner ? guildBannerUrl(gid, g.banner, 1024) : g.splash ? guildSplashUrl(gid, g.splash, 1024) : null) : null;
  const icon = g && gid && g.icon ? guildIconUrl(gid, g.icon, 256) : null;
  const created = gid ? decodeSnowflake(gid) : null;
  const features = sortFeatures(g?.features ?? []);
  const key = KEY_FEATURES.filter((f) => g?.features.includes(f));
  const ver = g ? VERIFICATION[g.verification_level] : undefined;
  const expires = invite.expires_at ? new Date(invite.expires_at) : null;
  const inviterName = invite.inviter ? invite.inviter.global_name || invite.inviter.username : null;
  const name = g?.name ?? invite.channel?.name ?? (invite.type === 2 ? inviterName : null) ?? "—";
  const dtf = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <article class="iv-card">
      <div class={`iv-banner${banner ? "" : " is-empty"}`}>{banner && <img src={banner} alt="" loading="lazy" />}</div>
      <div class="iv-head">
        <div class="iv-icon">{icon ? <img src={icon} alt="" width={88} height={88} /> : <span aria-hidden="true">{name.slice(0, 2)}</span>}</div>
        <div class="iv-title">
          <h2 class="iv-name">
            {name}
            {key.includes("VERIFIED") && (
              <span class="iv-badge" title={t.verified}>
                <Icon name="Check" size={14} />
                <span class="sr-only">{t.verified}</span>
              </span>
            )}
          </h2>
          <div class="lk-chips">
            <span class="chip">{INVITE_TYPE[invite.type]?.[lang] ?? `type ${invite.type}`}</span>
            {key
              .filter((f) => f !== "VERIFIED")
              .map((f) => (
                <span class="chip" key={f}>
                  {featureLabel(f, lang)}
                </span>
              ))}
          </div>
        </div>
      </div>

      <div class="iv-body stack">
        {g?.description && <p class="iv-desc">{g.description}</p>}

        {members !== undefined && (
          <div class="iv-counts">
            <span class="iv-count">
              <span class="iv-dot is-gray" aria-hidden="true" />
              <strong>~{nf.format(members)}</strong> {t.members}
            </span>
            {online !== undefined && (
              <span class="iv-count">
                <span class="iv-dot is-green" aria-hidden="true" />
                <strong>~{nf.format(online)}</strong> {t.online}
              </span>
            )}
            <span class="hint iv-approx">{t.approx}</span>
          </div>
        )}

        <dl class="lk-kv">
          {g?.vanity_url_code && (
            <>
              <dt>{t.vanity}</dt>
              <dd>
                <code class="lk-mono">discord.gg/{g.vanity_url_code}</code>
                <CopyButton text={inviteUrl(g.vanity_url_code)} lang={lang} size="sm" variant="icon" />
              </dd>
            </>
          )}
          {invite.channel?.name && (
            <>
              <dt>{t.channel}</dt>
              <dd>
                <span class="iv-chan">
                  <Icon name={invite.channel.type === 2 || invite.channel.type === 13 ? "Radio" : "Hash"} size={15} />
                  {invite.channel.name}
                </span>
                <span class="lk-sub">{CHANNEL_TYPE[invite.channel.type]?.[lang]}</span>
              </dd>
            </>
          )}
          {g && (
            <>
              <dt>{t.boosts}</dt>
              <dd>
                <span>{BOOST_TIER[g.premium_tier ?? 0]?.[lang]}</span>
                {g.premium_subscription_count !== undefined && <span class="lk-sub">{t.boostsN(g.premium_subscription_count)}</span>}
              </dd>
              <dt>{t.verification}</dt>
              <dd>
                <span>{ver?.label[lang] ?? g.verification_level}</span>
                {ver && <span class="lk-sub">{ver.desc[lang]}</span>}
              </dd>
              <dt>{t.nsfw}</dt>
              <dd>{NSFW_LEVEL[g.nsfw_level]?.[lang] ?? g.nsfw_level}</dd>
            </>
          )}
          {invite.profile?.tag && gid && (
            <>
              <dt>{t.tag}</dt>
              <dd>
                <span class="iv-tag">
                  {invite.profile.badge_hash && <img src={guildTagBadgeUrl(gid, invite.profile.badge_hash)} alt="" width={14} height={14} />}
                  {invite.profile.tag}
                </span>
              </dd>
            </>
          )}
          <dt>{t.expires}</dt>
          <dd>{expires ? dtf.format(expires) : t.never}</dd>
          {inviterName && (
            <>
              <dt>{t.inviter}</dt>
              <dd>{inviterName}</dd>
            </>
          )}
          {invite.guild_scheduled_event && (
            <>
              <dt>{t.event}</dt>
              <dd>{invite.guild_scheduled_event.name}</dd>
            </>
          )}
          {invite.target_application && (
            <>
              <dt>{t.application}</dt>
              <dd>{invite.target_application.name}</dd>
            </>
          )}
          {gid && created && (
            <>
              <dt>{t.serverId}</dt>
              <dd>
                <code class="lk-mono">{gid}</code>
                <CopyButton text={gid} lang={lang} size="sm" label={t.copyId} />
              </dd>
              <dt>{t.created}</dt>
              <dd>
                <span>{dtf.format(created.date)}</span>
                <span class="lk-sub">{t.createdAgo(formatDiff(calendarDiff(created.timestamp, Date.now()), lang, 2))}</span>
                <a href={toolHref("snowflake", lang, gid)}>{t.decode}</a>
              </dd>
            </>
          )}
        </dl>

        {(features.known.length > 0 || features.other.length > 0) && (
          <details class="iv-features">
            <summary>{t.allFeatures(features.known.length + features.other.length)}</summary>
            <div class="lk-chips">
              {features.known.map((f) => (
                <span class="chip" key={f} title={f}>
                  {featureLabel(f, lang)}
                </span>
              ))}
              {features.other.map((f) => (
                <span class="chip iv-chip-raw" key={f} title={f}>
                  {featureLabel(f, lang)}
                </span>
              ))}
            </div>
          </details>
        )}

        {g && gid && (icon || g.banner || g.splash) && (
          <div class="iv-images">
            <span class="label">{t.images}</span>
            <div class="row">
              {icon && (
                <a class="btn btn-sm" href={guildIconUrl(gid, g.icon!, 4096)} target="_blank" rel="noopener noreferrer">
                  <Icon name="ExternalLink" size={15} /> {t.icon}
                </a>
              )}
              {g.banner && (
                <a class="btn btn-sm" href={guildBannerUrl(gid, g.banner, 4096)} target="_blank" rel="noopener noreferrer">
                  <Icon name="ExternalLink" size={15} /> {t.banner}
                </a>
              )}
              {g.splash && (
                <a class="btn btn-sm" href={guildSplashUrl(gid, g.splash, 4096)} target="_blank" rel="noopener noreferrer">
                  <Icon name="ExternalLink" size={15} /> {t.splash}
                </a>
              )}
            </div>
          </div>
        )}

        <div class="iv-foot">
          <div class="row">
            <a class="btn" href={inviteUrl(invite.code)} target="_blank" rel="noopener noreferrer nofollow" title={t.openHint}>
              <Icon name="ExternalLink" size={16} /> {t.open}
            </a>
            <CopyButton text={inviteUrl(invite.code)} lang={lang} label="discord.gg/…" />
          </div>
          <span class="hint">
            {t.fetched}: {at.toLocaleTimeString(locale)}
          </span>
        </div>
        <p class="hint iv-safety">
          <Icon name="Info" size={14} /> {t.safety}
        </p>
      </div>
    </article>
  );
}
