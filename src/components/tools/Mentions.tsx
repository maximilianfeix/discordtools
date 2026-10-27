import { useEffect, useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import Output from "../ui/Output";
import Preview, { type PreviewTheme } from "../discord/Preview";
import { extractSnowflake, isSnowflake } from "../../lib/snowflake";
import { formatTimestamp, timestampTag, TIMESTAMP_STYLES, type TimestampStyle } from "../../lib/timestamp";
import {
  channelMention,
  commandMention,
  emojiMarkup,
  emojiUrl,
  findReferences,
  GUILD_NAV,
  guildNav,
  isCommandName,
  isEmojiName,
  messageLink,
  referenceIds,
  roleMention,
  userMention,
  type GuildNav,
  type Reference,
} from "../../lib/mentions";
import "./Mentions.css";

const TOKEN_RE = /[\w-]{23,28}\.[\w-]{6,7}\.[\w-]{27,40}/;

const EX = {
  user: "80351110224678912",
  role: "165511591545143296",
  channel: "41771983423143937",
  guild: "41771983423143937",
  message: "1293458201946210304",
  command: "1173322156372205608",
  emoji: "1067157240457003048",
};

const L = {
  de: {
    basic: "Nutzer, Rolle oder Kanal",
    type: "Art",
    user: "Nutzer",
    role: "Rolle",
    channel: "Kanal",
    id: "ID",
    idHint: "Rechtsklick → „ID kopieren“ (Entwicklermodus in den Einstellungen unter Erweitert einschalten). Du kannst auch eine Erwähnung oder einen Link einfügen.",
    badId: "Das ist keine gültige Discord-ID (17–20 Ziffern).",
    token: "Das sieht aus wie ein Account-Token. Füge so etwas nirgends ein – wer es hat, kann deinen Account übernehmen. Ändere sofort dein Passwort, falls du es geteilt hast.",
    command: "Slash-Befehl",
    cmdName: "Befehlsname",
    cmdGroup: "Gruppe (optional)",
    cmdSub: "Unterbefehl (optional)",
    cmdId: "Befehls-ID",
    cmdIdHint: "Im Server: Servereinstellungen → Integrationen → Bot → Befehl → ID kopieren.",
    badName: "Nur Kleinbuchstaben, Ziffern, - und _ (1–32 Zeichen).",
    emoji: "Eigenes Emoji",
    emojiName: "Emoji-Name",
    emojiId: "Emoji-ID",
    emojiHint: "Tipp: In Discord \\:emoji: schreiben und senden – dann siehst du die fertige Syntax.",
    badEmoji: "2–32 Zeichen: Buchstaben, Ziffern und _.",
    animated: "Animiert (GIF)",
    openImage: "Bild öffnen",
    timestamp: "Zeitstempel",
    when: "Datum und Uhrzeit",
    style: "Format",
    tsMore: "Mehr Optionen im Zeitstempel-Generator",
    tsLink: "/zeitstempel",
    nav: "Server-Navigation",
    navWhat: "Ziel",
    navNames: { customize: "Kanäle & Rollen", browse: "Kanäle durchsuchen", guide: "Server-Leitfaden", "linked-roles": "Verknüpfte Rollen" } as Record<GuildNav, string>,
    navRole: "Rollen-ID (optional)",
    link: "Nachrichten- oder Kanallink",
    guild: "Server-ID",
    dm: "Direktnachricht (kein Server)",
    msgId: "Nachrichten-ID (optional)",
    linkHint: "Ohne Nachrichten-ID entsteht ein Link zum Kanal.",
    everyoneTitle: "@everyone und @here",
    everyone:
      "Das ist ganz normaler Text – einfach @everyone oder @here schreiben. Ob jemand gepingt wird, hängt von der Berechtigung „@everyone, @here und alle Rollen erwähnen“ ab. Bei Webhooks und Bots steuert das allowed_mentions.",
    decode: "Einfügen & erklären",
    decodeLabel: "Text, Erwähnung oder Link",
    decodeHint: "Füge eine Nachricht oder Syntax ein – wir erklären jede Erwähnung, jeden Link und jede ID darin.",
    found: (n: number) => (n === 1 ? "1 Fundstück" : `${n} Fundstücke`),
    none: "Nichts gefunden. Erwähnungen sehen so aus: <@ID>, <#ID>, </befehl:ID>.",
    created: "erstellt",
    roles: { guild: "Server", channel: "Kanal", message: "Nachricht", user: "Nutzer", role: "Rolle", emoji: "Emoji", command: "Befehl", id: "ID" } as Record<string, string>,
    kinds: {
      user: "Nutzer-Erwähnung",
      role: "Rollen-Erwähnung",
      channel: "Kanal-Erwähnung",
      emoji: "Eigenes Emoji",
      command: "Slash-Befehl",
      timestamp: "Zeitstempel",
      nav: "Server-Navigation",
      everyone: "@everyone",
      here: "@here",
      message: "Nachrichtenlink",
      "channel-link": "Kanallink",
      game: "Spielprofil",
      id: "Discord-ID",
    } as Record<Reference["kind"], string>,
    explain: {
      user: "Pingt diese Person und zeigt ihren Namen an.",
      role: "Pingt alle mit dieser Rolle – wenn die Rolle erwähnbar ist oder du die Berechtigung hast.",
      channel: "Klickbarer Kanalname. Wer den Kanal nicht sehen kann, sieht „Kein Zugriff“.",
      emoji: (a: boolean) => (a ? "Animiertes Emoji. Ohne Nitro nur auf dem eigenen Server nutzbar." : "Emoji eines Servers. Ohne Nitro nur auf dem eigenen Server nutzbar."),
      command: (c: string) => `Klickbarer Befehl /${c} – füllt beim Klick das Eingabefeld.`,
      timestamp: (t: string) => `Zeigt jedem die Zeit in seiner Zeitzone, z. B. „${t}“.`,
      nav: "Springt zu einem Bereich des Servers.",
      everyone: "Normaler Text. Pingt alle, wenn der Absender die Berechtigung hat.",
      here: "Normaler Text. Pingt alle, die gerade online sind – mit Berechtigung.",
      message: "Springt zu genau dieser Nachricht.",
      "channel-link": "Öffnet diesen Kanal.",
      game: "Neue Erwähnung eines Spielprofils.",
      id: "Eine einzelne ID. Was sie bezeichnet, steht nicht in der ID – nur wann sie erstellt wurde.",
    },
    previewLabel: "Vorschau",
    note: "Namen in der Vorschau sind Platzhalter – echte Namen kennt nur Discord.",
    sample: `Hey <@${EX.user}>, schau mal in <#${EX.channel}>! Mit </ticket open:${EX.command}> öffnest du ein Ticket.
Start: <t:1798761600:F> · Rollen holen: <id:customize>
https://discord.com/channels/${EX.guild}/${EX.channel}/${EX.message}`,
  },
  en: {
    basic: "User, role or channel",
    type: "Type",
    user: "User",
    role: "Role",
    channel: "Channel",
    id: "ID",
    idHint: "Right-click → “Copy ID” (turn on Developer Mode in Settings → Advanced). You can also paste a mention or link.",
    badId: "That's not a valid Discord ID (17–20 digits).",
    token: "This looks like an account token. Never paste it anywhere – whoever has it can take over your account. Change your password right away if you shared it.",
    command: "Slash command",
    cmdName: "Command name",
    cmdGroup: "Group (optional)",
    cmdSub: "Subcommand (optional)",
    cmdId: "Command ID",
    cmdIdHint: "In the server: Server Settings → Integrations → bot → command → Copy ID.",
    badName: "Lowercase letters, digits, - and _ only (1–32 characters).",
    emoji: "Custom emoji",
    emojiName: "Emoji name",
    emojiId: "Emoji ID",
    emojiHint: "Tip: type \\:emoji: in Discord and send it – you'll see the finished syntax.",
    badEmoji: "2–32 characters: letters, digits and _.",
    animated: "Animated (GIF)",
    openImage: "Open image",
    timestamp: "Timestamp",
    when: "Date and time",
    style: "Style",
    tsMore: "More options in the timestamp generator",
    tsLink: "/en/timestamp",
    nav: "Server navigation",
    navWhat: "Target",
    navNames: { customize: "Channels & Roles", browse: "Browse Channels", guide: "Server Guide", "linked-roles": "Linked Roles" } as Record<GuildNav, string>,
    navRole: "Role ID (optional)",
    link: "Message or channel link",
    guild: "Server ID",
    dm: "Direct message (no server)",
    msgId: "Message ID (optional)",
    linkHint: "Without a message ID you get a link to the channel.",
    everyoneTitle: "@everyone and @here",
    everyone:
      "These are plain text – just type @everyone or @here. Whether anyone gets pinged depends on the “Mention @everyone, @here and All Roles” permission. For webhooks and bots, allowed_mentions controls it.",
    decode: "Paste & explain",
    decodeLabel: "Text, mention or link",
    decodeHint: "Paste a message or syntax – we explain every mention, link and ID in it.",
    found: (n: number) => (n === 1 ? "1 item" : `${n} items`),
    none: "Nothing found. Mentions look like <@ID>, <#ID>, </command:ID>.",
    created: "created",
    roles: { guild: "Server", channel: "Channel", message: "Message", user: "User", role: "Role", emoji: "Emoji", command: "Command", id: "ID" } as Record<string, string>,
    kinds: {
      user: "User mention",
      role: "Role mention",
      channel: "Channel mention",
      emoji: "Custom emoji",
      command: "Slash command",
      timestamp: "Timestamp",
      nav: "Server navigation",
      everyone: "@everyone",
      here: "@here",
      message: "Message link",
      "channel-link": "Channel link",
      game: "Game profile",
      id: "Discord ID",
    } as Record<Reference["kind"], string>,
    explain: {
      user: "Pings this person and shows their name.",
      role: "Pings everyone with this role – if the role is mentionable or you have the permission.",
      channel: "Clickable channel name. People who can't see the channel get “No Access”.",
      emoji: (a: boolean) => (a ? "Animated emoji. Without Nitro it only works in its own server." : "Server emoji. Without Nitro it only works in its own server."),
      command: (c: string) => `Clickable command /${c} – fills the message box when clicked.`,
      timestamp: (t: string) => `Shows everyone the time in their own zone, e.g. “${t}”.`,
      nav: "Jumps to a part of the server.",
      everyone: "Plain text. Pings everyone if the sender has the permission.",
      here: "Plain text. Pings everyone who is online – with permission.",
      message: "Jumps to exactly this message.",
      "channel-link": "Opens this channel.",
      game: "New mention of a game profile.",
      id: "A single ID. It doesn't say what it belongs to – only when it was created.",
    },
    previewLabel: "Preview",
    note: "Names in the preview are placeholders – only Discord knows the real names.",
    sample: `Hey <@${EX.user}>, check out <#${EX.channel}>! Use </ticket open:${EX.command}> to open a ticket.
Starts: <t:1798761600:F> · Pick roles: <id:customize>
https://discord.com/channels/${EX.guild}/${EX.channel}/${EX.message}`,
  },
};

type S = (typeof L)["de"] | (typeof L)["en"];

function IdField({ id, label, value, onChange, s, hint, optional }: { id: string; label: string; value: string; onChange: (v: string) => void; s: S; hint?: string; optional?: boolean }) {
  const [token, setToken] = useState(false);
  const bad = value !== "" && !isSnowflake(value);
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
        aria-invalid={bad || (!optional && !value) ? "true" : undefined}
        aria-describedby={`${id}-msg`}
        onInput={(e) => {
          const raw = e.currentTarget.value;
          if (TOKEN_RE.test(raw)) {
            setToken(true);
            e.currentTarget.value = "";
            onChange("");
            return;
          }
          setToken(false);
          const clean = raw.trim();
          // A pasted mention or link: pull out the ID.
          onChange(/^\d*$/.test(clean) ? clean : (extractSnowflake(clean) ?? clean));
        }}
      />
      <span id={`${id}-msg`} class={token || bad ? "mn-err" : "hint"} role={token || bad ? "alert" : undefined}>
        {token ? s.token : bad ? s.badId : hint ?? ""}
      </span>
    </div>
  );
}

function localInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function RefItem({ r, s, locale }: { r: Reference; s: S; locale: string }) {
  const ids = referenceIds(r);
  let text = "";
  switch (r.kind) {
    case "emoji":
      text = s.explain.emoji(r.animated);
      break;
    case "command":
      text = s.explain.command([r.name, r.group, r.sub].filter(Boolean).join(" "));
      break;
    case "timestamp":
      text = s.explain.timestamp(formatTimestamp(r.unix, r.style, locale));
      break;
    default:
      text = s.explain[r.kind];
  }
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  return (
    <li class="mn-ref">
      <div class="mn-ref-head">
        <span class="chip mn-kind">{s.kinds[r.kind]}</span>
        <code>{r.raw}</code>
      </div>
      <p>{text}</p>
      {ids.length > 0 && (
        <div class="mn-ids">
          {ids.map((x) => (
            <span key={x.role + x.id}>
              {s.roles[x.role] ?? x.role}: <code>{x.id}</code>
              {x.created !== undefined && ` · ${s.created} ${fmt.format(new Date(x.created))}`}
            </span>
          ))}
        </div>
      )}
      {r.kind === "emoji" && (
        <a href={emojiUrl(r.id, r.animated, 256)} target="_blank" rel="noopener noreferrer nofollow">
          {s.openImage} <Icon name="ExternalLink" size={13} class="mn-inline-icon" />
        </a>
      )}
    </li>
  );
}

export default function Mentions({ lang }: { lang: Lang }) {
  const s = L[lang];
  const locale = lang === "de" ? "de-DE" : "en-US";
  const [kind, setKind] = useState<"user" | "role" | "channel">("user");
  const [basicId, setBasicId] = useState(EX.user);
  const [cmd, setCmd] = useState({ name: "ticket", group: "", sub: "open", id: EX.command });
  const [emoji, setEmoji] = useState({ name: "wave", id: EX.emoji, animated: false });
  const [when, setWhen] = useState(() => localInput(Date.now() + 86400000));
  const [tsStyle, setTsStyle] = useState<TimestampStyle>("R");
  const [nav, setNav] = useState<GuildNav>("customize");
  const [navRole, setNavRole] = useState("");
  const [link, setLink] = useState({ guild: EX.guild, dm: false, channel: EX.channel, message: EX.message });
  const [paste, setPaste] = useState(s.sample);
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  // The server-rendered default used the build time; use the visitor's clock instead.
  useEffect(() => setWhen(localInput(Date.now() + 86400000)), []);

  const basicOut = isSnowflake(basicId) ? (kind === "user" ? userMention : kind === "role" ? roleMention : channelMention)(basicId) : "";
  const cmdNameOk = isCommandName(cmd.name);
  const cmdSubOk = (!cmd.sub || isCommandName(cmd.sub)) && (!cmd.group || isCommandName(cmd.group));
  const cmdOut = cmdNameOk && cmdSubOk && isSnowflake(cmd.id) && (!cmd.group || cmd.sub) ? commandMention(cmd.name, cmd.id, cmd.sub, cmd.group) : "";
  const emojiOk = isEmojiName(emoji.name);
  const emojiOut = emojiOk && isSnowflake(emoji.id) ? emojiMarkup(emoji.name, emoji.id, emoji.animated) : "";
  const whenMs = Date.parse(when);
  const tsOut = isNaN(whenMs) ? "" : timestampTag(Math.floor(whenMs / 1000), tsStyle);
  const navOut = navRole && !isSnowflake(navRole) ? "" : guildNav(nav, nav === "linked-roles" ? navRole : undefined);
  const guildOk = link.dm || isSnowflake(link.guild);
  const linkOut =
    guildOk && isSnowflake(link.channel) && (!link.message || isSnowflake(link.message))
      ? messageLink(link.dm ? "@me" : link.guild, link.channel, link.message || undefined)
      : "";

  const pasteToken = TOKEN_RE.test(paste);
  const refs = useMemo(() => (pasteToken ? [] : findReferences(paste)), [paste, pasteToken]);
  const names = useMemo(() => {
    const n: Record<string, string> = {};
    if (lang === "de") Object.assign(n, { [EX.user]: "Nelly", [EX.channel]: "allgemein", [EX.role]: "Moderator" });
    else Object.assign(n, { [EX.user]: "Nelly", [EX.channel]: "general", [EX.role]: "Moderator" });
    return n;
  }, [lang]);

  return (
    <div class="tool-layout split mn">
      <div class="stack">
        <a href="#mn-decode-panel" class="btn btn-sm mn-jump">
          <Icon name="ArrowDown" size={15} /> {s.decode}
        </a>
        <section class="panel mn-card" aria-labelledby="mn-basic">
          <h2 class="panel-title" id="mn-basic">{s.basic}</h2>
          <div class="segmented" role="group" aria-label={s.type}>
            {(["user", "role", "channel"] as const).map((k) => (
              <button type="button" key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>
                {s[k]}
              </button>
            ))}
          </div>
          <IdField id="mn-basic-id" label={`${s[kind]}-${s.id}`} value={basicId} onChange={setBasicId} s={s} hint={s.idHint} />
          <Output value={basicOut || "–"} lang={lang} />
        </section>

        <section class="panel mn-card" aria-labelledby="mn-cmd">
          <h2 class="panel-title" id="mn-cmd">{s.command}</h2>
          <div class="mn-grid">
            <div class="field">
              <label for="mn-cmd-name">{s.cmdName}</label>
              <input id="mn-cmd-name" class="input mono" type="text" autocomplete="off" spellcheck={false} autocapitalize="none" value={cmd.name}
                aria-invalid={!cmdNameOk ? "true" : undefined}
                onInput={(e) => setCmd({ ...cmd, name: e.currentTarget.value.trim().replace(/^\//, "") })} />
            </div>
            <div class="field">
              <label for="mn-cmd-group">{s.cmdGroup}</label>
              <input id="mn-cmd-group" class="input mono" type="text" autocomplete="off" spellcheck={false} autocapitalize="none" value={cmd.group}
                onInput={(e) => setCmd({ ...cmd, group: e.currentTarget.value.trim() })} />
            </div>
            <div class="field">
              <label for="mn-cmd-sub">{s.cmdSub}</label>
              <input id="mn-cmd-sub" class="input mono" type="text" autocomplete="off" spellcheck={false} autocapitalize="none" value={cmd.sub}
                onInput={(e) => setCmd({ ...cmd, sub: e.currentTarget.value.trim() })} />
            </div>
          </div>
          {(!cmdNameOk || !cmdSubOk) && <span class="mn-err" role="alert">{s.badName}</span>}
          <IdField id="mn-cmd-id" label={s.cmdId} value={cmd.id} onChange={(v) => setCmd({ ...cmd, id: v })} s={s} hint={s.cmdIdHint} />
          <Output value={cmdOut || "–"} lang={lang} />
        </section>

        <section class="panel mn-card" aria-labelledby="mn-emoji">
          <h2 class="panel-title" id="mn-emoji">{s.emoji}</h2>
          <div class="mn-grid">
            <div class="field">
              <label for="mn-emoji-name">{s.emojiName}</label>
              <input id="mn-emoji-name" class="input mono" type="text" autocomplete="off" spellcheck={false} autocapitalize="none" value={emoji.name}
                aria-invalid={!emojiOk ? "true" : undefined}
                onInput={(e) => setEmoji({ ...emoji, name: e.currentTarget.value.trim().replace(/^:|:$/g, "") })} />
              {!emojiOk && <span class="mn-err">{s.badEmoji}</span>}
            </div>
            <IdField id="mn-emoji-id" label={s.emojiId} value={emoji.id} onChange={(v) => setEmoji({ ...emoji, id: v })} s={s} />
          </div>
          <label class="check">
            <input type="checkbox" checked={emoji.animated} onChange={(e) => setEmoji({ ...emoji, animated: e.currentTarget.checked })} />
            <span>{s.animated}</span>
          </label>
          <Output value={emojiOut || "–"} lang={lang} hint={s.emojiHint} />
        </section>

        <section class="panel mn-card" aria-labelledby="mn-ts">
          <h2 class="panel-title" id="mn-ts">{s.timestamp}</h2>
          <div class="mn-grid">
            <div class="field">
              <label for="mn-when">{s.when}</label>
              <input id="mn-when" class="input" type="datetime-local" value={when} onInput={(e) => setWhen(e.currentTarget.value)} />
            </div>
            <div class="field">
              <label for="mn-style">{s.style}</label>
              <select id="mn-style" class="select" value={tsStyle} onChange={(e) => setTsStyle(e.currentTarget.value as TimestampStyle)}>
                {TIMESTAMP_STYLES.map((st) => (
                  <option key={st} value={st}>
                    {st} – {isNaN(whenMs) ? "" : formatTimestamp(Math.floor(whenMs / 1000), st, locale)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Output value={tsOut || "–"} lang={lang} />
          <a href={s.tsLink} class="hint">{s.tsMore} →</a>
        </section>

        <section class="panel mn-card" aria-labelledby="mn-nav">
          <h2 class="panel-title" id="mn-nav">{s.nav}</h2>
          <div class="mn-grid">
            <div class="field">
              <label for="mn-nav-sel">{s.navWhat}</label>
              <select id="mn-nav-sel" class="select" value={nav} onChange={(e) => setNav(e.currentTarget.value as GuildNav)}>
                {GUILD_NAV.map((n) => (
                  <option key={n} value={n}>{s.navNames[n]}</option>
                ))}
              </select>
            </div>
            {nav === "linked-roles" && <IdField id="mn-nav-role" label={s.navRole} value={navRole} onChange={setNavRole} s={s} optional />}
          </div>
          <Output value={navOut || "–"} lang={lang} />
        </section>

        <section class="panel mn-card" aria-labelledby="mn-link">
          <h2 class="panel-title" id="mn-link">{s.link}</h2>
          <label class="check">
            <input type="checkbox" checked={link.dm} onChange={(e) => setLink({ ...link, dm: e.currentTarget.checked })} />
            <span>{s.dm}</span>
          </label>
          <div class="mn-grid">
            {!link.dm && <IdField id="mn-link-guild" label={s.guild} value={link.guild} onChange={(v) => setLink({ ...link, guild: v })} s={s} />}
            <IdField id="mn-link-channel" label={`${s.channel}-${s.id}`} value={link.channel} onChange={(v) => setLink({ ...link, channel: v })} s={s} />
            <IdField id="mn-link-msg" label={s.msgId} value={link.message} onChange={(v) => setLink({ ...link, message: v })} s={s} optional />
          </div>
          <Output value={linkOut || "–"} lang={lang} hint={s.linkHint} />
        </section>

        <section class="panel mn-card" aria-labelledby="mn-everyone">
          <h2 class="panel-title" id="mn-everyone">{s.everyoneTitle}</h2>
          <p class="notice mn-plain">
            <Icon name="Info" size={16} />
            <span>{s.everyone}</span>
          </p>
        </section>
      </div>

      <div class="stack sticky">
        <section class="panel mn-card" id="mn-decode-panel" aria-labelledby="mn-decode">
          <h2 class="panel-title" id="mn-decode">
            {s.decode}
            {!pasteToken && paste.trim() && <span class="chip">{s.found(refs.length)}</span>}
          </h2>
          <div class="field">
            <label for="mn-paste">{s.decodeLabel}</label>
            <textarea id="mn-paste" class="textarea mono" rows={5} spellcheck={false} value={paste} onInput={(e) => setPaste(e.currentTarget.value)} aria-describedby="mn-paste-hint" />
            <span class="hint" id="mn-paste-hint">{s.decodeHint}</span>
          </div>
          {pasteToken ? (
            <p class="notice error" role="alert">{s.token}</p>
          ) : refs.length ? (
            <ul class="mn-refs" aria-live="polite">
              {refs.map((r, i) => <RefItem key={i + r.raw} r={r} s={s} locale={locale} />)}
            </ul>
          ) : paste.trim() ? (
            <p class="notice">{s.none}</p>
          ) : null}
        </section>
        {!pasteToken && paste.trim() && (
          <Preview messages={[{ username: "Kanalwerk", content: paste, color: "#3ee0a8" }]} theme={theme} onTheme={setTheme} locale={locale} names={names} label={s.previewLabel} note={s.note} />
        )}
      </div>
    </div>
  );
}
