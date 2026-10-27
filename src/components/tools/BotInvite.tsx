import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import PermissionPicker from "./PermissionPicker";
import { PARSE_ERRORS, parseBitfield } from "../../lib/bitfield";
import { decodePermissions, presetValue } from "../../lib/permissions";
import { SCOPES, buildInviteUrl, inviteHashParams, looksLikeToken, parseInviteUrl, type InviteState, type IssueCode } from "../../lib/bot-invite";
import { readHash, writeHash } from "../../lib/hash-state";
import "./BotInvite.css";

const CALC_PATH = { de: "/rechte-rechner", en: "/en/permissions-calculator" } as const;
const EXAMPLE_ID = "1234567890123456789";

const L = {
  de: {
    app: "Deine App",
    clientId: "Client-ID oder bestehender Einladungslink",
    clientHint: "Developer Portal → deine App → General Information → „Application ID“. Kein Token, kein Secret nötig.",
    exampleHint: "Das ist eine Beispiel-ID – ersetze sie durch die ID deiner App.",
    parsed: "Einladungslink übernommen",
    parsedUnknown: (k: string) => `Link übernommen. Unbekannte Parameter ignoriert: ${k}`,
    tokenTitle: "Das ist ein Token – nicht hier eingeben!",
    tokenText:
      "Wer deinen Bot-Token hat, steuert deinen Bot. Für Einladungslinks brauchst du ihn nie. Wir haben das Feld geleert. Wenn du ihn irgendwo geteilt hast: im Developer Portal unter „Bot“ sofort zurücksetzen.",
    install: "Installationsart",
    server: "Server-Installation",
    serverHint: "Der klassische Bot: Er wird einem Server hinzugefügt und bekommt dort eine eigene Rolle mit den Rechten unten.",
    user: "Nutzer-Installation",
    userHint: "Die App wird deinem Konto hinzugefügt. Ihre Befehle gehen überall – auch in DMs und fremden Servern –, aber ohne Bot-Nutzer und ohne Rechte.",
    userPortal: "Aktiviere „User Install“ im Developer Portal unter „Installation“, sonst zeigt Discord einen Fehler.",
    scopes: "Scopes",
    scopesMore: "Weitere OAuth2-Scopes",
    scopesMoreHint:
      "Diese Scopes starten den vollen OAuth2-Ablauf: Discord leitet nach der Zustimmung mit einem Code an deine redirect_uri weiter. Dafür brauchst du einen eigenen Server, der den Code eintauscht.",
    perms: "Bot-Rechte",
    permsValue: "Rechte-Wert",
    permsHint: "Dezimalzahl aus dem Rechte-Rechner – oder unten auswählen.",
    permsPick: "Rechte auswählen",
    permsCount: (n: number) => (n === 1 ? "1 Recht" : `${n} Rechte`),
    openCalc: "Im Rechte-Rechner öffnen",
    permsOff: "Rechte gibt es nur für Server-Installationen mit dem Scope „bot“.",
    advanced: "Erweitert",
    guildId: "Server vorauswählen (guild_id)",
    guildHint: "Optional. Die ID des Servers, der im Auswahlmenü schon gewählt sein soll.",
    lock: "Server-Auswahl sperren (disable_guild_select)",
    redirect: "Weiterleitungs-URL (redirect_uri)",
    redirectHint: "Muss exakt so im Developer Portal unter OAuth2 → Redirects eingetragen sein.",
    prompt: "Zustimmung (prompt)",
    promptDefault: "Standard",
    promptConsent: "consent – immer fragen",
    promptNone: "none – nicht erneut fragen",
    result: "Einladungslink",
    copy: "Link kopieren",
    open: "Öffnen",
    params: "Was steht im Link?",
    issues: "Hinweise",
    reset: "Zurücksetzen",
    resetDone: "Auf Beispiel zurückgesetzt",
    stateNote:
      "Tipp: Hänge im Code-Grant-Ablauf einen zufälligen state-Parameter an und prüfe ihn beim Zurückkommen (Schutz vor CSRF). Den erzeugt dein Server – nicht dieses Tool.",
    paramDesc: {
      client_id: "Die Application-ID deiner App.",
      permissions: "Rechte-Bitfeld als Dezimalzahl. Daraus entsteht die Bot-Rolle.",
      integration_type: "0 = Server-Installation, 1 = Nutzer-Installation.",
      scope: "Was die App bekommt, durch Leerzeichen getrennt (%20).",
      guild_id: "Server, der im Menü vorausgewählt ist.",
      disable_guild_select: "Sperrt das Menü auf diesen Server.",
      response_type: "code = voller OAuth2-Ablauf mit Weiterleitung.",
      redirect_uri: "Hierhin leitet Discord nach der Zustimmung weiter.",
      prompt: "consent fragt jedes Mal, none überspringt die Frage, wenn schon zugestimmt.",
    } as Record<string, string>,
    issue: {
      "client-missing": "Gib die Client-ID deiner App ein.",
      "client-invalid": "Die Client-ID ist eine 17–20-stellige Zahl (Snowflake).",
      "client-token": "Das sieht nach einem Token aus. Gib ihn nie weiter.",
      "client-secret": "Das sieht nach einem Client Secret aus – das ist geheim. Du brauchst die Application-ID.",
      "scope-empty": "Wähle mindestens einen Scope.",
      "user-needs-commands": "Nutzer-Installationen brauchen den Scope „applications.commands“.",
      "user-no-bot": "„bot“ wurde entfernt: Nutzer-Installationen haben keinen Bot-Nutzer.",
      "user-no-permissions": "Rechte wurden weggelassen: Bei Nutzer-Installationen gibt es keine Bot-Rolle.",
      "user-no-guild": "guild_id wurde weggelassen: Nutzer-Installationen gehen an dein Konto, nicht an einen Server.",
      "permissions-without-bot": "Ohne den Scope „bot“ werden die Rechte ignoriert und weggelassen.",
      "permissions-invalid": "Der Rechte-Wert ist keine gültige Zahl.",
      admin: "Der Link fordert Administrator an. Viele Server-Admins lehnen das ab – fordere nur an, was du brauchst.",
      "needs-redirect": "Mit diesen Scopes brauchst du eine redirect_uri.",
      "redirect-invalid": "Die redirect_uri muss mit https:// (oder http:// für localhost) beginnen.",
      "redirect-insecure": "http:// ohne TLS ist nur für localhost sinnvoll. Nutze https://.",
      "guild-invalid": "Die Server-ID ist keine gültige Snowflake.",
      "lock-without-guild": "Server-Auswahl sperren wirkt nur zusammen mit einer guild_id.",
      "redirect-unused": "Die redirect_uri wird nur mit weiteren OAuth2-Scopes gebraucht und ist nicht im Link.",
      "restricted-scope": "Ein gewählter Scope ist nur für freigegebene Partner verfügbar.",
    } as Record<IssueCode, string>,
    noIssues: "Alles in Ordnung – der Link ist bereit.",
  },
  en: {
    app: "Your app",
    clientId: "Client ID or existing invite link",
    clientHint: "Developer Portal → your app → General Information → “Application ID”. No token or secret needed.",
    exampleHint: "This is an example ID – replace it with your app's ID.",
    parsed: "Invite link loaded",
    parsedUnknown: (k: string) => `Link loaded. Ignored unknown parameters: ${k}`,
    tokenTitle: "That is a token – don't enter it here!",
    tokenText:
      "Whoever has your bot token controls your bot. You never need it for invite links. We cleared the field. If you shared it anywhere, reset it right away in the Developer Portal under “Bot”.",
    install: "Install type",
    server: "Server install",
    serverHint: "The classic bot: it is added to a server and gets its own role there with the permissions below.",
    user: "User install",
    userHint: "The app is added to your account. Its commands work everywhere – DMs and other servers too – but without a bot user and without permissions.",
    userPortal: "Enable “User Install” in the Developer Portal under “Installation”, otherwise Discord shows an error.",
    scopes: "Scopes",
    scopesMore: "More OAuth2 scopes",
    scopesMoreHint:
      "These scopes start the full OAuth2 flow: after consent Discord redirects to your redirect_uri with a code. You need your own server to exchange that code.",
    perms: "Bot permissions",
    permsValue: "Permissions value",
    permsHint: "Decimal number from the permissions calculator – or pick below.",
    permsPick: "Pick permissions",
    permsCount: (n: number) => (n === 1 ? "1 permission" : `${n} permissions`),
    openCalc: "Open in permissions calculator",
    permsOff: "Permissions only exist for server installs with the “bot” scope.",
    advanced: "Advanced",
    guildId: "Preselect server (guild_id)",
    guildHint: "Optional. The ID of the server that should already be selected.",
    lock: "Lock server selection (disable_guild_select)",
    redirect: "Redirect URL (redirect_uri)",
    redirectHint: "Must match an entry under OAuth2 → Redirects in the Developer Portal exactly.",
    prompt: "Consent (prompt)",
    promptDefault: "Default",
    promptConsent: "consent – always ask",
    promptNone: "none – skip if already approved",
    result: "Invite link",
    copy: "Copy link",
    open: "Open",
    params: "What's in the link?",
    issues: "Notes",
    reset: "Reset",
    resetDone: "Reset to example",
    stateNote:
      "Tip: in the code grant flow, add a random state parameter and check it when the user comes back (CSRF protection). Your server generates it – not this tool.",
    paramDesc: {
      client_id: "Your app's application ID.",
      permissions: "Permission bitfield as a decimal number. It becomes the bot's role.",
      integration_type: "0 = server install, 1 = user install.",
      scope: "What the app gets, separated by spaces (%20).",
      guild_id: "Server preselected in the dropdown.",
      disable_guild_select: "Locks the dropdown to that server.",
      response_type: "code = full OAuth2 flow with redirect.",
      redirect_uri: "Where Discord sends the user after consent.",
      prompt: "consent asks every time, none skips it if already approved.",
    } as Record<string, string>,
    issue: {
      "client-missing": "Enter your app's client ID.",
      "client-invalid": "The client ID is a 17–20 digit number (snowflake).",
      "client-token": "That looks like a token. Never share it.",
      "client-secret": "That looks like a client secret – keep it private. You need the application ID.",
      "scope-empty": "Pick at least one scope.",
      "user-needs-commands": "User installs need the “applications.commands” scope.",
      "user-no-bot": "“bot” was removed: user installs have no bot user.",
      "user-no-permissions": "Permissions were left out: user installs have no bot role.",
      "user-no-guild": "guild_id was left out: user installs go to your account, not a server.",
      "permissions-without-bot": "Without the “bot” scope the permissions are ignored and left out.",
      "permissions-invalid": "The permissions value is not a valid number.",
      admin: "The link requests Administrator. Many server admins refuse that – only request what you need.",
      "needs-redirect": "These scopes need a redirect_uri.",
      "redirect-invalid": "The redirect_uri must start with https:// (or http:// for localhost).",
      "redirect-insecure": "http:// without TLS only makes sense for localhost. Use https://.",
      "guild-invalid": "The server ID is not a valid snowflake.",
      "lock-without-guild": "Locking the server selection only works together with a guild_id.",
      "redirect-unused": "redirect_uri is only needed with more OAuth2 scopes and is not in the link.",
      "restricted-scope": "A chosen scope is only available to approved partners.",
    } as Record<IssueCode, string>,
    noIssues: "All good – the link is ready.",
  },
};

const example = (): InviteState => ({
  clientId: EXAMPLE_ID,
  integrationType: 0,
  scopes: ["bot", "applications.commands"],
  permissions: presetValue("basic").toString(),
  guildId: "",
  disableGuildSelect: false,
  redirectUri: "",
  prompt: "",
});

export default function BotInvite({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [st, setSt] = useState<InviteState>(example);
  const [idText, setIdText] = useState(EXAMPLE_ID);
  const [tokenWarn, setTokenWarn] = useState(false);
  const touched = useRef(false);

  useEffect(() => {
    const h = readHash();
    if (![...h.keys()].length) return;
    setSt((cur) => {
      const next = { ...cur };
      const p = h.get("permissions");
      if (p && parseBitfield(p).ok) next.permissions = (parseBitfield(p) as { value: bigint }).value.toString();
      const id = h.get("client_id");
      if (id && /^\d{15,21}$/.test(id)) {
        next.clientId = id;
        setIdText(id);
      }
      const sc = h.get("scope");
      if (sc) next.scopes = sc.split(/[\s+]+/).filter((x) => /^[a-z0-9_.]+$/.test(x));
      if (h.get("integration_type") === "1") next.integrationType = 1;
      const g = h.get("guild_id");
      if (g && /^\d{15,21}$/.test(g)) next.guildId = g;
      if (h.get("disable_guild_select") === "true") next.disableGuildSelect = true;
      return next;
    });
  }, []);

  const set = (patch: Partial<InviteState>) => {
    touched.current = true;
    setSt((cur) => ({ ...cur, ...patch }));
  };

  const result = useMemo(() => buildInviteUrl(st), [st]);

  useEffect(() => {
    if (!touched.current) return;
    writeHash(inviteHashParams(st));
  }, [st]);

  const onIdInput = (raw: string) => {
    touched.current = true;
    if (looksLikeToken(raw)) {
      setTokenWarn(true);
      setIdText("");
      setSt((c) => ({ ...c, clientId: "" }));
      return;
    }
    setTokenWarn(false);
    if (/oauth2\/authorize/i.test(raw)) {
      const r = parseInviteUrl(raw);
      if (r.ok) {
        setSt(r.state);
        setIdText(r.state.clientId);
        toast(r.unknown.length ? s.parsedUnknown(r.unknown.join(", ")) : s.parsed);
        return;
      }
    }
    // Developer Portal URL: …/developers/applications/<id>/…
    const portal = raw.match(/developers\/applications\/(\d{15,21})/);
    const id = portal ? portal[1]! : raw.trim();
    setIdText(portal ? id : raw);
    setSt((c) => ({ ...c, clientId: id }));
  };

  const permsParsed = parseBitfield(st.permissions || "0");
  const permValue = permsParsed.ok ? permsParsed.value : 0n;
  const permsActive = st.integrationType === 0 && st.scopes.includes("bot");
  const permCount = decodePermissions(permValue).known.length;
  const simpleScopes = SCOPES.filter((x) => x.simple);
  const moreScopes = SCOPES.filter((x) => !x.simple);
  const moreSelected = st.scopes.filter((x) => !simpleScopes.some((y) => y.id === x)).length;
  const errors = result.issues.filter((i) => i.level === "error");
  const canUse = errors.length === 0;

  const toggleScope = (id: string, on: boolean) => {
    const next = on ? [...st.scopes, id] : st.scopes.filter((x) => x !== id);
    set({ scopes: SCOPES.map((x) => x.id).filter((x) => next.includes(x)).concat(next.filter((x) => !SCOPES.some((y) => y.id === x))) });
  };

  const reset = () => {
    touched.current = true;
    setSt(example());
    setIdText(EXAMPLE_ID);
    setTokenWarn(false);
    toast(s.resetDone);
  };

  const scopeRow = (sc: (typeof SCOPES)[number]) => {
    const on = st.scopes.includes(sc.id);
    const disabled = st.integrationType === 1 && sc.id === "bot";
    return (
      <li key={sc.id}>
        <label class={`check bi-scope ${disabled ? "is-disabled" : ""}`}>
          <input type="checkbox" checked={on && !disabled} disabled={disabled} onChange={(e) => toggleScope(sc.id, (e.target as HTMLInputElement).checked)} />
          <span>
            <code class="mono">{sc.id}</code>
            <span class="hint bi-scope-desc">{sc[lang]}</span>
          </span>
        </label>
      </li>
    );
  };

  return (
    <div class="bi">
      <div class="bi-top">
        <button type="button" class="btn btn-sm btn-ghost" onClick={reset}>
          <Icon name="RefreshCw" size={15} />
          {s.reset}
        </button>
      </div>
      <div class="tool-layout split">
        <div class="stack">
          <section class="panel stack" aria-labelledby="bi-app">
            <h2 class="panel-title" id="bi-app">{s.app}</h2>
            <div class="field">
              <label for="bi-id">{s.clientId}</label>
              <input
                id="bi-id"
                class="input mono"
                type="text"
                inputMode="text"
                autocomplete="off"
                spellcheck={false}
                value={idText}
                aria-invalid={result.issues.some((i) => i.code.startsWith("client-") && i.level === "error") ? "true" : undefined}
                aria-describedby="bi-id-hint"
                onInput={(e) => onIdInput((e.target as HTMLInputElement).value)}
              />
              <span class="hint" id="bi-id-hint">
                {st.clientId === EXAMPLE_ID ? s.exampleHint : s.clientHint}
              </span>
            </div>
            {tokenWarn && (
              <div class="notice error bi-notice" role="alert">
                <strong>{s.tokenTitle}</strong>
                <p>{s.tokenText}</p>
              </div>
            )}
          </section>

          <section class="panel stack" aria-labelledby="bi-install">
            <h2 class="panel-title" id="bi-install">{s.install}</h2>
            <div class="bi-cards" role="radiogroup" aria-labelledby="bi-install">
              {([0, 1] as const).map((t) => (
                <label key={t} class={`bi-card ${st.integrationType === t ? "is-on" : ""}`}>
                  <input type="radio" name="bi-install" checked={st.integrationType === t} onChange={() => set({ integrationType: t })} />
                  <span class="bi-card-body">
                    <span class="bi-card-title">
                      <Icon name={t === 0 ? "Server" : "CircleUserRound"} size={17} />
                      {t === 0 ? s.server : s.user}
                      <code class="mono bi-card-code">integration_type={t}</code>
                    </span>
                    <span class="hint">{t === 0 ? s.serverHint : s.userHint}</span>
                  </span>
                </label>
              ))}
            </div>
            {st.integrationType === 1 && <p class="notice bi-small">{s.userPortal}</p>}
          </section>

          <section class="panel stack" aria-labelledby="bi-scopes">
            <h2 class="panel-title" id="bi-scopes">{s.scopes}</h2>
            <ul class="bi-scopes">{simpleScopes.map(scopeRow)}</ul>
            <details class="bi-more" open={moreSelected > 0 || undefined}>
              <summary>
                {s.scopesMore}
                {moreSelected > 0 && <span class="chip">{moreSelected}</span>}
              </summary>
              <p class="notice bi-small bi-warn">{s.scopesMoreHint}</p>
              <ul class="bi-scopes">{moreScopes.map(scopeRow)}</ul>
            </details>
          </section>

          <section class="panel stack" aria-labelledby="bi-perms">
            <h2 class="panel-title" id="bi-perms">
              <span>{s.perms}</span>
              <a class="bi-calc-link" href={`${CALC_PATH[lang]}#permissions=${permValue.toString()}`}>
                {s.openCalc}
                <Icon name="ChevronRight" size={14} />
              </a>
            </h2>
            {!permsActive && <p class="notice bi-small">{s.permsOff}</p>}
            <div class={permsActive ? "stack" : "stack bi-dim"}>
              <div class="field">
                <label for="bi-perm">{s.permsValue}</label>
                <input
                  id="bi-perm"
                  class="input mono"
                  type="text"
                  inputMode="numeric"
                  autocomplete="off"
                  spellcheck={false}
                  value={st.permissions}
                  aria-invalid={!permsParsed.ok && permsParsed.error !== "empty" ? "true" : undefined}
                  onInput={(e) => set({ permissions: (e.target as HTMLInputElement).value })}
                />
                <span class="hint" aria-live="polite">
                  {!permsParsed.ok && permsParsed.error !== "empty" ? PARSE_ERRORS[lang][permsParsed.error] : `${s.permsCount(permCount)} · ${s.permsHint}`}
                </span>
              </div>
              <details class="bi-more">
                <summary>{s.permsPick}</summary>
                <div class="bi-picker">
                  <PermissionPicker value={permValue} onChange={(v) => set({ permissions: v.toString() })} lang={lang} compact idPrefix="bi-pp" />
                </div>
              </details>
            </div>
          </section>

          <section class="panel stack" aria-labelledby="bi-adv">
            <h2 class="panel-title" id="bi-adv">{s.advanced}</h2>
            <div class="field">
              <label for="bi-guild">{s.guildId}</label>
              <input id="bi-guild" class="input mono" type="text" inputMode="numeric" autocomplete="off" spellcheck={false} value={st.guildId}
                disabled={st.integrationType === 1}
                onInput={(e) => set({ guildId: (e.target as HTMLInputElement).value })} />
              <span class="hint">{s.guildHint}</span>
            </div>
            <label class="check">
              <input type="checkbox" checked={st.disableGuildSelect} disabled={st.integrationType === 1}
                onChange={(e) => set({ disableGuildSelect: (e.target as HTMLInputElement).checked })} />
              <span>{s.lock}</span>
            </label>
            <div class="field">
              <label for="bi-redirect">{s.redirect}</label>
              <input id="bi-redirect" class="input mono" type="url" inputMode="url" autocomplete="off" spellcheck={false} value={st.redirectUri}
                placeholder="https://example.com/callback"
                onInput={(e) => set({ redirectUri: (e.target as HTMLInputElement).value })} />
              <span class="hint">{s.redirectHint}</span>
            </div>
            {result.codeGrant && (
              <div class="field">
                <label for="bi-prompt">{s.prompt}</label>
                <select id="bi-prompt" class="select" value={st.prompt} onChange={(e) => set({ prompt: (e.target as HTMLSelectElement).value as InviteState["prompt"] })}>
                  <option value="">{s.promptDefault}</option>
                  <option value="consent">{s.promptConsent}</option>
                  <option value="none">{s.promptNone}</option>
                </select>
              </div>
            )}
          </section>
          <div class="bi-mobilebar">
            <span class="bi-mobilebar-label">{s.result}</span>
            <CopyButton text={result.url} lang={lang} variant="primary" size="sm" label={s.copy} disabled={!canUse} />
          </div>
        </div>

        <div class="sticky stack">
          <section class="panel stack" aria-labelledby="bi-result">
            <h2 class="panel-title" id="bi-result">{s.result}</h2>
            <div class={`bi-url ${canUse ? "" : "is-bad"}`}>
              <code class="mono">{result.url}</code>
            </div>
            <div class="row bi-actions">
              <CopyButton text={result.url} lang={lang} variant="primary" label={s.copy} disabled={!canUse} />
              <a class={`btn ${canUse ? "" : "is-disabled"}`} href={canUse ? result.url : undefined} target="_blank" rel="noopener noreferrer"
                aria-disabled={!canUse}>
                <Icon name="ExternalLink" size={17} />
                {s.open}
              </a>
            </div>
            <div aria-live="polite" class="stack bi-issues">
              {result.issues.length === 0 ? (
                <p class="bi-ok">
                  <Icon name="Check" size={16} />
                  {s.noIssues}
                </p>
              ) : (
                <ul class="bi-issue-list">
                  {result.issues.map((i) => (
                    <li key={i.code} class={`bi-issue bi-issue-${i.level}`}>
                      <Icon name={i.level === "info" ? "Info" : "TriangleAlert"} size={16} />
                      <span>{s.issue[i.code]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section class="panel" aria-labelledby="bi-params">
            <h2 class="panel-title" id="bi-params">{s.params}</h2>
            <dl class="bi-params">
              {result.params.map(([k, v]) => (
                <div key={k} class="bi-param">
                  <dt>
                    <code class="mono bi-param-key">{k}</code>
                    <code class="mono bi-param-val">{v || "—"}</code>
                  </dt>
                  <dd>{s.paramDesc[k]}</dd>
                </div>
              ))}
            </dl>
            {result.codeGrant && <p class="hint bi-state-note">{s.stateNote}</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
