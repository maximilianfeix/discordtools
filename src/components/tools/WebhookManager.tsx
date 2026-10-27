import { useEffect, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { toast } from "../ui/toast";
import { ApiErrorNotice, Notice, PrivacyNote, toolHref } from "./lookup-ui";
import { apiFetch, looksLikeToken, type ApiError } from "../../lib/discord-api";
import { WEBHOOK_TYPE, looksLikeWebhookAttempt, maskToken, parseWebhookUrl, validateWebhookName, webhookAvatarUrl, type NameProblem, type WebhookInfo, type WebhookRef } from "../../lib/webhook";
import "./WebhookManager.css";

const DEFAULT_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";
const COOLDOWN = 5;

const L = {
  de: {
    warnTitle: "Eine Webhook-URL ist wie ein Passwort",
    warnBody: "Jeder, der die URL kennt, kann in deinen Kanal posten – ohne Login. Teil sie nie öffentlich. Ist sie geleakt (z. B. in einem GitHub-Repo oder Screenshot), lösch den Webhook hier und leg in Discord einen neuen an.",
    label: "Webhook-URL",
    placeholder: "https://discord.com/api/webhooks/123…/abc…",
    hint: "Wird nur im Arbeitsspeicher dieses Tabs gehalten – nicht gespeichert, nicht in der Adresszeile, nicht an uns gesendet.",
    check: "Prüfen",
    forget: "Vergessen",
    where: "Wo finde ich die URL?",
    whereSteps: [
      "Server-Einstellungen → Integrationen → Webhooks (oder Kanal bearbeiten → Integrationen).",
      "Webhook anklicken → „Webhook-URL kopieren“.",
    ],
    invalid: "Das ist keine vollständige Webhook-URL. Sie sieht so aus: https://discord.com/api/webhooks/<ID>/<Token>.",
    invalidCut: "Die URL scheint abgeschnitten oder hat Zusatztext. Kopier sie noch einmal komplett aus Discord.",
    token: "Das sieht aus wie ein Discord-Token, nicht wie eine Webhook-URL. Gib deinen Token niemals auf einer Website ein!",
    loading: "Prüfe Webhook …",
    unknownTitle: "Webhook existiert nicht (mehr)",
    unknownBody: "Discord kennt diesen Webhook nicht – er wurde gelöscht oder die ID ist falsch. Verwende die URL nicht weiter; wiederholte Versuche mit gelöschten Webhooks können zu einer Sperre deiner IP führen.",
    badTokenTitle: "Token passt nicht",
    badTokenBody: "Die ID existiert, aber der Token-Teil der URL ist falsch – vielleicht wurde die URL in Discord neu erzeugt. Kopier sie erneut.",
    info: "Webhook",
    type: "Art",
    id: "Webhook-ID",
    channel: "Kanal-ID",
    guild: "Server-ID",
    app: "Anwendungs-ID",
    none: "–",
    url: "URL",
    created: "Erstellungsdatum",
    edit: "Name & Avatar",
    name: "Name",
    nameErr: {
      empty: "Der Name darf nicht leer sein.",
      "too-long": "Höchstens 80 Zeichen.",
      reserved: "„everyone“ und „here“ sind nicht erlaubt.",
      "forbidden-word": "Discord verbietet „clyde“ und „discord“ in Webhook-Namen.",
    } as Record<NameProblem, string>,
    avatar: "Avatar",
    avatarPick: "Neues Bild wählen",
    avatarHint: "Wird lokal auf 256 × 256 verkleinert und als PNG gesendet.",
    avatarRemove: "Avatar entfernen",
    avatarRemoved: "Wird auf das Standardbild zurückgesetzt.",
    save: "Speichern",
    saving: "Speichere …",
    saved: "Webhook aktualisiert",
    test: "Testnachricht senden",
    testDefault: "Testnachricht von discordtools.de – der Webhook funktioniert.",
    content: "Nachricht",
    send: "Senden",
    sending: "Sende …",
    sent: "Nachricht gesendet",
    wait: (s: number) => `Warte ${s} s`,
    noPing: "Erwähnungen wie @everyone werden nicht ausgelöst.",
    sentLink: "Nachricht in Discord öffnen",
    moreTools: "Für Embeds, Bilder und mehr nutz den Embed-Builder.",
    deleteTitle: "Webhook löschen",
    deleteBody: "Danach funktioniert die URL nirgends mehr. Bereits gesendete Nachrichten bleiben stehen.",
    deleteBtn: "Webhook löschen …",
    confirmTitle: "Wirklich löschen?",
    confirmBody: (n: string) => `„${n}“ wird endgültig gelöscht. Das lässt sich nicht rückgängig machen.`,
    cancel: "Abbrechen",
    confirm: "Endgültig löschen",
    deleting: "Lösche …",
    deletedTitle: "Webhook gelöscht",
    deletedBody: "Die URL ist ab sofort ungültig. Wenn du weiter einen Webhook brauchst, leg in Discord einen neuen an.",
    privacy: "Alle Anfragen gehen direkt von deinem Browser an Discord. Die URL verlässt deinen Rechner nur in Richtung discord.com.",
    retry: "Erneut versuchen",
    chars: "Zeichen",
  },
  en: {
    warnTitle: "A webhook URL is like a password",
    warnBody: "Anyone who knows the URL can post to your channel – no login needed. Never share it publicly. If it leaked (e.g. in a GitHub repo or screenshot), delete the webhook here and create a new one in Discord.",
    label: "Webhook URL",
    placeholder: "https://discord.com/api/webhooks/123…/abc…",
    hint: "Kept only in this tab's memory – not stored, not in the address bar, not sent to us.",
    check: "Inspect",
    forget: "Forget",
    where: "Where do I find the URL?",
    whereSteps: ["Server Settings → Integrations → Webhooks (or Edit Channel → Integrations).", "Click the webhook → “Copy Webhook URL”."],
    invalid: "That's not a complete webhook URL. It looks like https://discord.com/api/webhooks/<ID>/<token>.",
    invalidCut: "The URL seems cut off or has extra text. Copy it again in full from Discord.",
    token: "That looks like a Discord token, not a webhook URL. Never enter your token on any website!",
    loading: "Checking webhook …",
    unknownTitle: "Webhook doesn't exist (anymore)",
    unknownBody: "Discord doesn't know this webhook – it was deleted or the ID is wrong. Stop using the URL; repeated requests to deleted webhooks can get your IP temporarily blocked.",
    badTokenTitle: "Token doesn't match",
    badTokenBody: "The ID exists but the token part of the URL is wrong – maybe the URL was regenerated in Discord. Copy it again.",
    info: "Webhook",
    type: "Type",
    id: "Webhook ID",
    channel: "Channel ID",
    guild: "Server ID",
    app: "Application ID",
    none: "–",
    url: "URL",
    created: "Creation date",
    edit: "Name & avatar",
    name: "Name",
    nameErr: {
      empty: "The name can't be empty.",
      "too-long": "80 characters at most.",
      reserved: "“everyone” and “here” are not allowed.",
      "forbidden-word": "Discord forbids “clyde” and “discord” in webhook names.",
    } as Record<NameProblem, string>,
    avatar: "Avatar",
    avatarPick: "Choose new image",
    avatarHint: "Shrunk locally to 256 × 256 and sent as PNG.",
    avatarRemove: "Remove avatar",
    avatarRemoved: "Will reset to the default image.",
    save: "Save",
    saving: "Saving …",
    saved: "Webhook updated",
    test: "Send a test message",
    testDefault: "Test message from discordtools.de – the webhook works.",
    content: "Message",
    send: "Send",
    sending: "Sending …",
    sent: "Message sent",
    wait: (s: number) => `Wait ${s} s`,
    noPing: "Mentions like @everyone won't ping anyone.",
    sentLink: "Open message in Discord",
    moreTools: "For embeds, images and more, use the embed builder.",
    deleteTitle: "Delete webhook",
    deleteBody: "Afterwards the URL stops working everywhere. Messages already sent stay.",
    deleteBtn: "Delete webhook …",
    confirmTitle: "Really delete?",
    confirmBody: (n: string) => `“${n}” will be deleted permanently. This can't be undone.`,
    cancel: "Cancel",
    confirm: "Delete permanently",
    deleting: "Deleting …",
    deletedTitle: "Webhook deleted",
    deletedBody: "The URL is invalid from now on. If you still need a webhook, create a new one in Discord.",
    privacy: "All requests go straight from your browser to Discord. The URL only ever leaves your device towards discord.com.",
    retry: "Try again",
    chars: "characters",
  },
};

type T = (typeof L)["de"];

type State =
  | { s: "idle" }
  | { s: "loading" }
  | { s: "ok"; ref: WebhookRef; info: WebhookInfo }
  | { s: "error"; error: ApiError; ref: WebhookRef }
  | { s: "deleted"; name: string };

function fileToAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = Math.min(256, Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = c.height = size;
      const ctx = c.getContext("2d")!;
      const scale = Math.max(size / img.width, size / img.height);
      const w = img.width * scale,
        h = img.height * scale;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      URL.revokeObjectURL(src);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error("image"));
    };
    img.src = src;
  });
}

export default function WebhookManager({ lang }: { lang: Lang }) {
  const t = L[lang];
  const [url, setUrl] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ s: "idle" });

  const inspect = async () => {
    if (looksLikeToken(url)) return setInputError(t.token);
    const ref = parseWebhookUrl(url);
    if (!ref) return setInputError(looksLikeWebhookAttempt(url) ? t.invalidCut : t.invalid);
    setInputError(null);
    setState({ s: "loading" });
    const r = await apiFetch<WebhookInfo>(ref.url);
    if (r.ok) setState({ s: "ok", ref, info: r.data });
    else setState({ s: "error", error: r.error, ref });
  };

  const forget = () => {
    setUrl("");
    setState({ s: "idle" });
    setInputError(null);
  };

  return (
    <div class="stack wh">
      <Notice kind="warn" title={t.warnTitle}>
        <p>{t.warnBody}</p>
      </Notice>

      <form
        class="panel stack"
        onSubmit={(e) => {
          e.preventDefault();
          inspect();
        }}
      >
        <div class="field">
          <label for="wh-url">{t.label}</label>
          <div class="lk-input-row">
            <input
              id="wh-url"
              class="input mono"
              type="url"
              name="wh-url-nostore"
              autocomplete="off"
              autocapitalize="off"
              spellcheck={false}
              enterkeyhint="go"
              placeholder={t.placeholder}
              value={url}
              aria-invalid={!!inputError}
              aria-describedby="wh-hint"
              onInput={(e) => {
                setUrl((e.currentTarget as HTMLInputElement).value);
                setInputError(null);
              }}
            />
            <button type="submit" class="btn btn-primary" disabled={!url.trim() || state.s === "loading"}>
              <Icon name="Search" size={17} /> {state.s === "loading" ? t.loading : t.check}
            </button>
            {(url || state.s !== "idle") && (
              <button type="button" class="btn" onClick={forget}>
                <Icon name="X" size={16} /> {t.forget}
              </button>
            )}
          </div>
          <span id="wh-hint" class="hint">{t.hint}</span>
        </div>
        {inputError && <Notice kind="error" title={inputError} live />}
        <details class="wh-where hint">
          <summary>{t.where}</summary>
          <ol>
            {t.whereSteps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </details>
        <PrivacyNote>{t.privacy}</PrivacyNote>
      </form>

      <div aria-live="polite">
        {state.s === "error" && <WebhookError err={state.error} t={t} lang={lang} retry={inspect} />}
        {state.s === "deleted" && (
          <Notice kind="ok" title={t.deletedTitle} live>
            <p>{t.deletedBody}</p>
          </Notice>
        )}
      </div>

      {state.s === "ok" && (
        <Manager
          key={state.ref.url}
          refx={state.ref}
          info={state.info}
          t={t}
          lang={lang}
          onUpdate={(info) => setState({ s: "ok", ref: state.ref, info })}
          onDeleted={(name) => {
            setUrl("");
            setState({ s: "deleted", name });
          }}
          onError={(error) => setState({ s: "error", error, ref: state.ref })}
        />
      )}
    </div>
  );
}

function WebhookError({ err, t, lang, retry }: { err: ApiError; t: T; lang: Lang; retry: () => void }) {
  if (err.kind === "notfound") return <ApiErrorNotice err={err} lang={lang} title={t.unknownTitle} body={<p>{t.unknownBody}</p>} />;
  if (err.kind === "unauthorized") return <ApiErrorNotice err={err} lang={lang} title={t.badTokenTitle} body={<p>{t.badTokenBody}</p>} />;
  return (
    <div class="stack">
      <ApiErrorNotice err={err} lang={lang} />
      {err.kind !== "badrequest" && (
        <div>
          <button type="button" class="btn" onClick={retry}>
            <Icon name="RefreshCw" size={16} /> {t.retry}
          </button>
        </div>
      )}
    </div>
  );
}

function Manager({
  refx,
  info,
  t,
  lang,
  onUpdate,
  onDeleted,
  onError,
}: {
  refx: WebhookRef;
  info: WebhookInfo;
  t: T;
  lang: Lang;
  onUpdate: (i: WebhookInfo) => void;
  onDeleted: (name: string) => void;
  onError: (e: ApiError) => void;
}) {
  const [name, setName] = useState(info.name ?? "");
  const [avatar, setAvatar] = useState<string | null | undefined>(undefined); // undefined = unchanged, null = remove
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<ApiError | null>(null);
  const [content, setContent] = useState(t.testDefault);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sendErr, setSendErr] = useState<ApiError | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delErr, setDelErr] = useState<ApiError | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);
  useEffect(() => {
    if (confirming) cancelRef.current?.focus();
  }, [confirming]);

  const nameProblem = validateWebhookName(name);
  const dirty = name.trim() !== (info.name ?? "") || avatar !== undefined;
  const shownAvatar = avatar === null ? DEFAULT_AVATAR : (avatar ?? (info.avatar ? webhookAvatarUrl(info.id, info.avatar, 128) : DEFAULT_AVATAR));
  const fatal = (e: ApiError) => e.kind === "notfound" || e.kind === "unauthorized";

  const save = async () => {
    if (nameProblem) return;
    setSaving(true);
    setSaveErr(null);
    const body: Record<string, unknown> = { name: name.trim() };
    if (avatar !== undefined) body.avatar = avatar;
    const r = await apiFetch<WebhookInfo>(refx.url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setSaving(false);
    if (r.ok) {
      setAvatar(undefined);
      onUpdate(r.data);
      toast(t.saved);
    } else if (fatal(r.error)) onError(r.error);
    else setSaveErr(r.error);
  };

  const send = async () => {
    if (!content.trim() || cooldown > 0) return;
    setSending(true);
    setSendErr(null);
    setSentId(null);
    const qs = new URLSearchParams({ wait: "true" });
    if (refx.threadId) qs.set("thread_id", refx.threadId);
    const r = await apiFetch<{ id: string; channel_id: string }>(`${refx.url}?${qs}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.slice(0, 2000), allowed_mentions: { parse: [] } }),
    });
    setSending(false);
    setCooldown(COOLDOWN);
    if (r.ok) {
      setSentId(r.data?.id ?? null);
      toast(t.sent);
    } else if (fatal(r.error)) onError(r.error);
    else setSendErr(r.error);
  };

  const del = async () => {
    setDeleting(true);
    setDelErr(null);
    const r = await apiFetch<null>(refx.url, { method: "DELETE" });
    setDeleting(false);
    if (r.ok || r.error.kind === "notfound") onDeleted(info.name ?? info.id);
    else setDelErr(r.error);
  };

  const pickAvatar = async (f: File | undefined) => {
    if (!f) return;
    try {
      setAvatar(await fileToAvatar(f));
    } catch {
      toast(lang === "de" ? "Bild konnte nicht gelesen werden" : "Couldn't read that image", "error");
    }
  };

  const msgLink = sentId && info.guild_id && info.channel_id ? `https://discord.com/channels/${info.guild_id}/${refx.threadId ?? info.channel_id}/${sentId}` : null;
  const maskedUrl = `…/webhooks/${info.id}/${maskToken(refx.token)}`;

  return (
    <div class="stack">
      <section class="panel wh-info" aria-labelledby="wh-name">
        <img class="wh-avatar" src={info.avatar ? webhookAvatarUrl(info.id, info.avatar, 128) : DEFAULT_AVATAR} alt="" width={72} height={72} />
        <div>
          <h2 class="wh-name" id="wh-name">
            {info.name ?? "Webhook"} <span class="wh-tag">APP</span>
          </h2>
          <span class="chip">{WEBHOOK_TYPE[info.type]?.[lang] ?? `type ${info.type}`}</span>
        </div>
        <dl class="lk-kv">
          <dt>{t.id}</dt>
          <dd>
            <code class="lk-mono">{info.id}</code>
            <CopyButton text={info.id} lang={lang} size="sm" variant="icon" />
            <a href={toolHref("snowflake", lang, info.id)}>{t.created}</a>
          </dd>
          <dt>{t.channel}</dt>
          <dd>
            {info.channel_id ? (
              <>
                <code class="lk-mono">{info.channel_id}</code>
                <CopyButton text={info.channel_id} lang={lang} size="sm" variant="icon" />
              </>
            ) : (
              t.none
            )}
          </dd>
          <dt>{t.guild}</dt>
          <dd>
            {info.guild_id ? (
              <>
                <code class="lk-mono">{info.guild_id}</code>
                <CopyButton text={info.guild_id} lang={lang} size="sm" variant="icon" />
              </>
            ) : (
              t.none
            )}
          </dd>
          <dt>{t.app}</dt>
          <dd>{info.application_id ? <code class="lk-mono">{info.application_id}</code> : t.none}</dd>
          <dt>{t.url}</dt>
          <dd>
            <code class="lk-mono">{maskedUrl}</code>
          </dd>
        </dl>
      </section>

      <div class="wh-actions">
        <section class="panel stack" aria-labelledby="wh-edit-title">
          <h3 class="panel-title" id="wh-edit-title">
            {t.edit}
          </h3>
          <div class="field">
            <label for="wh-name-input">{t.name}</label>
            <input
              id="wh-name-input"
              class="input"
              type="text"
              autocomplete="off"
              maxLength={100}
              value={name}
              aria-invalid={!!nameProblem}
              aria-describedby="wh-name-err"
              onInput={(e) => setName((e.currentTarget as HTMLInputElement).value)}
            />
            <span id="wh-name-err" class="hint" style={nameProblem ? { color: "var(--danger)" } : undefined}>
              {nameProblem ? t.nameErr[nameProblem] : `${[...name.trim()].length}/80`}
            </span>
          </div>
          <div class="field">
            <span class="label">{t.avatar}</span>
            <div class="wh-avatar-row">
              <img class="wh-avatar" src={shownAvatar} alt="" width={56} height={56} />
              <input ref={fileRef} class="wh-file" type="file" accept="image/png,image/jpeg,image/gif,image/webp" aria-label={t.avatarPick} onChange={(e) => pickAvatar((e.currentTarget as HTMLInputElement).files?.[0])} />
            </div>
            <span class="hint">{avatar === null ? t.avatarRemoved : t.avatarHint}</span>
            {(info.avatar || avatar) && avatar !== null && (
              <div>
                <button
                  type="button"
                  class="btn btn-sm btn-ghost"
                  onClick={() => {
                    setAvatar(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <Icon name="Trash2" size={15} /> {t.avatarRemove}
                </button>
              </div>
            )}
          </div>
          {saveErr && <ApiErrorNotice err={saveErr} lang={lang} />}
          <div>
            <button type="button" class="btn btn-primary" disabled={!dirty || !!nameProblem || saving} onClick={save}>
              <Icon name="Check" size={17} /> {saving ? t.saving : t.save}
            </button>
          </div>
        </section>

        <section class="panel stack" aria-labelledby="wh-test-title">
          <h3 class="panel-title" id="wh-test-title">
            {t.test}
          </h3>
          <div class="field">
            <label for="wh-content">{t.content}</label>
            <textarea id="wh-content" class="textarea" rows={3} value={content} onInput={(e) => setContent((e.currentTarget as HTMLTextAreaElement).value)} />
            <span class={`hint wh-count${content.length > 2000 ? " is-over" : ""}`}>
              {content.length}/2000 {t.chars} · {t.noPing}
            </span>
          </div>
          {sendErr && <ApiErrorNotice err={sendErr} lang={lang} />}
          {sentId && (
            <Notice kind="ok" title={t.sent}>
              {msgLink && (
                <p>
                  <a href={msgLink} target="_blank" rel="noopener noreferrer">
                    {t.sentLink}
                  </a>
                </p>
              )}
            </Notice>
          )}
          <div class="row">
            <button type="button" class="btn btn-primary" disabled={sending || cooldown > 0 || !content.trim() || content.length > 2000} onClick={send}>
              <Icon name="Send" size={17} /> {sending ? t.sending : cooldown > 0 ? t.wait(cooldown) : t.send}
            </button>
          </div>
          <p class="hint">
            <a href={toolHref("embed-builder", lang)}>{t.moreTools}</a>
          </p>
        </section>
      </div>

      <section class="panel stack wh-danger" aria-labelledby="wh-del-title">
        <h3 class="panel-title" id="wh-del-title">
          {t.deleteTitle}
        </h3>
        <p class="hint" style={{ margin: 0 }}>
          {t.deleteBody}
        </p>
        {delErr && <ApiErrorNotice err={delErr} lang={lang} />}
        {!confirming ? (
          <div>
            <button type="button" class="btn btn-danger" onClick={() => setConfirming(true)}>
              <Icon name="Trash2" size={16} /> {t.deleteBtn}
            </button>
          </div>
        ) : (
          <div
            class="wh-confirm"
            role="alertdialog"
            aria-labelledby="wh-confirm-title"
            aria-describedby="wh-confirm-body"
            onKeyDown={(e) => e.key === "Escape" && !deleting && setConfirming(false)}
          >
            <p id="wh-confirm-title">
              <strong>{t.confirmTitle}</strong>
            </p>
            <p id="wh-confirm-body">{t.confirmBody(info.name ?? info.id)}</p>
            <div class="row">
              <button ref={cancelRef} type="button" class="btn" onClick={() => setConfirming(false)} disabled={deleting}>
                {t.cancel}
              </button>
              <button type="button" class="btn wh-btn-danger-solid" onClick={del} disabled={deleting}>
                <Icon name="Trash2" size={16} /> {deleting ? t.deleting : t.confirm}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
