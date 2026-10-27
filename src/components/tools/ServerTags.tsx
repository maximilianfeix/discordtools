import { useMemo, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Icon from "../Icon";
import { PREVIEW_THEMES, type PreviewTheme } from "../discord/Preview";
import "../discord/preview.css";
import { IDEAS, MAX_TAG, checkTag, generateTags, splitChars, type TagIssue } from "../../lib/server-tags";
import "./ServerTags.css";

/** Simple generic badge shapes (our own drawings, not Discord's assets), 24×24. */
const SHAPES: { id: string; d: string; de: string; en: string }[] = [
  { id: "shield", d: "M12 2 4 5v6c0 5.2 3.4 9.4 8 11 4.6-1.6 8-5.8 8-11V5z", de: "Schild", en: "Shield" },
  { id: "star", d: "M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z", de: "Stern", en: "Star" },
  { id: "heart", d: "M12 21s-7.5-4.6-9.5-9.3C1.1 8.3 3.3 4.5 7 4.5c2.1 0 3.6 1.1 5 2.8 1.4-1.7 2.9-2.8 5-2.8 3.7 0 5.9 3.8 4.5 7.2C19.5 16.4 12 21 12 21z", de: "Herz", en: "Heart" },
  { id: "diamond", d: "M12 2 22 12 12 22 2 12z", de: "Raute", en: "Diamond" },
  { id: "flame", d: "M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.4-4.8 3-6.2.3 2 1.2 3.2 2.4 3.8C11 8.5 11.4 5 12 2z", de: "Flamme", en: "Flame" },
  { id: "bolt", d: "M13 2 4 14h7l-1 8 9-12h-7z", de: "Blitz", en: "Bolt" },
  { id: "crown", d: "M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5z", de: "Krone", en: "Crown" },
  { id: "leaf", d: "M20 3C10 3 4 8.5 4 15.5c0 1.6.3 3 .9 4.3C6.5 14 10.5 10.3 16 8.3 11 11.5 8.2 15.6 6.8 21c1.3.7 2.8 1 4.2 1C17 22 20 16 20 3z", de: "Blatt", en: "Leaf" },
  { id: "moon", d: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z", de: "Mond", en: "Moon" },
  { id: "circle", d: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 6a4 4 0 1 1 0 8 4 4 0 0 1 0-8z", de: "Ring", en: "Ring" },
];

const COLOR_PRESETS: [string, string][] = [
  ["#3EE0A8", "#0B8F6A"], ["#FF6B6B", "#C0392B"], ["#FFD93D", "#F39C12"], ["#7FB8FF", "#3D5AFE"],
  ["#C77DFF", "#7B2CBF"], ["#FF9AC1", "#E84393"], ["#E8E8E8", "#8A8D93"], ["#FF8A3D", "#D35400"],
];

function Badge({ shape, a, b, size, uid }: { shape: string; a: string; b: string; size: number; uid: string }) {
  const s = SHAPES.find((x) => x.id === shape) ?? SHAPES[0];
  const gid = `stg-${uid}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color={a} />
          <stop offset="1" stop-color={b} />
        </linearGradient>
      </defs>
      <path d={s.d} fill={`url(#${gid})`} fill-rule="evenodd" />
    </svg>
  );
}

const L = {
  de: {
    yours: "Dein Server-Tag",
    tag: "Tag (bis 4 Zeichen)",
    copyTag: "Tag kopieren",
    ok: "Passt: 1–4 Buchstaben oder Ziffern.",
    issue: (i: TagIssue): string => {
      switch (i.code) {
        case "empty": return "Gib mindestens ein Zeichen ein.";
        case "too-long": return `${i.length} Zeichen – erlaubt sind höchstens ${MAX_TAG}.`;
        case "space": return "Leerzeichen (auch unsichtbare) sind nicht erlaubt.";
        case "emoji": return `Emojis gehen nicht: ${i.chars.join(" ")}`;
        case "invisible": return "Unsichtbare Zeichen sind nicht erlaubt.";
        case "symbol": return `Sonderzeichen ${i.chars.join(" ")}: Discord erlaubt nur „bestimmte“ – teste es in den Servereinstellungen.`;
        case "letter": return `${i.chars.join(" ")}: Umlaute, Akzente und Unicode-Schriften nimmt Discord wahrscheinlich nicht an.`;
      }
    },
    badge: "Abzeichen",
    badgeNote: "Einfache Beispielformen – in Discord wählst du aus den Abzeichen, die Discord anbietet.",
    colors: "Farben",
    c1: "Farbe 1",
    c2: "Farbe 2",
    presets: "Farbvorschläge",
    member: "Dein Anzeigename",
    gen: "Ideen aus dem Servernamen",
    server: "Servername",
    serverEx: "Nürnberger Gaming Crew",
    genHint: "Klick übernimmt den Tag. Gestrichelt = enthält ein Sonderzeichen.",
    none: "Keine Ideen – gib einen Namen mit Buchstaben ein.",
    ideas: "Beliebte Tags nach Thema",
    use: (t: string) => `Tag ${t} übernehmen`,
    preview: "Vorschau",
    previewNote: "Vorschau – kann leicht vom echten Discord abweichen. Abzeichen sind eigene Beispielformen.",
    msg: "Neuer Tag ist da – gefällt er euch?",
    reply: "sieht stark aus 🔥",
    online: "Online",
    today: "Heute um",
    howto: "So richtest du Server-Tags ein",
    owner: "Als Server-Owner oder Admin",
    ownerSteps: [
      "Sammle 3 verfügbare Server-Boosts. Server-Tags sind ein Extra-Perk, du brauchst kein bestimmtes Boost-Level.",
      "Öffne den Tab „Server-Boosts“ oben links und klick bei „Server-Tags“ auf „Perk aktivieren“.",
      "In den Servereinstellungen unter „Server-Tag“ legst du Name (bis 4 Zeichen), Abzeichen und Farbe fest.",
      "Änderst du den Tag später, müssen alle Mitglieder ihn neu übernehmen. Häufiges Ändern ist begrenzt.",
    ],
    packs: "Zusätzliche Abzeichen-Pakete kosten extra Boosts: Creepy Crawlies (2), Pet (3), Plant (3), Flex (5).",
    members: "Als Mitglied",
    memberSteps: [
      "Desktop/Browser: Benutzereinstellungen → „Profile“ → „Server-Tag“ → „Auswählen“.",
      "Handy: unten rechts auf dein Profilbild → „Profil bearbeiten“ → „Server-Tags“.",
      "Du kannst immer nur einen Tag tragen. Er erscheint neben deinem Namen im Chat, in der Mitgliederliste und in DMs.",
      "Andere tippen auf deinen Tag und sehen das Serverprofil – mit „Server beitreten“.",
    ],
    facts: "Gut zu wissen: Tags müssen nicht einzigartig sein, die Farbe legt der Server fest, und man kann nicht einschränken, wer den Tag trägt. Fallen die Boosts weg, verschwindet der Tag bei allen.",
  },
  en: {
    yours: "Your server tag",
    tag: "Tag (up to 4 characters)",
    copyTag: "Copy tag",
    ok: "Looks good: 1–4 letters or digits.",
    issue: (i: TagIssue): string => {
      switch (i.code) {
        case "empty": return "Enter at least one character.";
        case "too-long": return `${i.length} characters – at most ${MAX_TAG} are allowed.`;
        case "space": return "Spaces (including invisible ones) are not allowed.";
        case "emoji": return `Emojis don't work: ${i.chars.join(" ")}`;
        case "invisible": return "Invisible characters are not allowed.";
        case "symbol": return `Special characters ${i.chars.join(" ")}: Discord only allows “certain” ones – test it in Server Settings.`;
        case "letter": return `${i.chars.join(" ")}: Discord most likely rejects accents and Unicode fonts.`;
      }
    },
    badge: "Badge",
    badgeNote: "Simple sample shapes – in Discord you pick from the badges Discord offers.",
    colors: "Colors",
    c1: "Color 1",
    c2: "Color 2",
    presets: "Color presets",
    member: "Your display name",
    gen: "Ideas from your server name",
    server: "Server name",
    serverEx: "Pixel Palace Gaming",
    genHint: "Click to use a tag. Dashed = contains a special character.",
    none: "No ideas – enter a name with letters.",
    ideas: "Popular tags by theme",
    use: (t: string) => `Use tag ${t}`,
    preview: "Preview",
    previewNote: "Preview – may differ slightly from Discord. Badges are our own sample shapes.",
    msg: "New tag just dropped – do you like it?",
    reply: "looks great 🔥",
    online: "Online",
    today: "Today at",
    howto: "How to set up server tags",
    owner: "As server owner or admin",
    ownerSteps: [
      "Get 3 available Server Boosts. Server tags are an extra perk – no particular boost level needed.",
      "Open the “Server Boosts” tab in the upper left and click “Enable Perk” on Server Tags.",
      "In Server Settings → “Server Tag” you set the name (up to 4 characters), badge and color.",
      "If you change the tag later, every member has to re-apply it. Changes are rate-limited.",
    ],
    packs: "Extra badge packs cost more boosts: Creepy Crawlies (2), Pet (3), Plant (3), Flex (5).",
    members: "As a member",
    memberSteps: [
      "Desktop/browser: User Settings → “Profiles” → “Server Tag” → “Select”.",
      "Mobile: tap your avatar in the bottom right → “Edit Profile” → “Server Tags”.",
      "You can wear one tag at a time. It shows next to your name in chat, the member list and DMs.",
      "Others tap your tag and see the server profile – with “Join Server”.",
    ],
    facts: "Good to know: tags don't have to be unique, the server sets the color, and you can't restrict who wears the tag. If the boosts run out, the tag disappears for everyone.",
  },
};

export default function ServerTags({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [tag, setTag] = useState(lang === "de" ? "NGC" : "PPG");
  const [shape, setShape] = useState("shield");
  const [c1, setC1] = useState(COLOR_PRESETS[0][0]);
  const [c2, setC2] = useState(COLOR_PRESETS[0][1]);
  const [name, setName] = useState(lang === "de" ? "Lena" : "Alex");
  const [server, setServer] = useState(s.serverEx);
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const [ideaGroup, setIdeaGroup] = useState(IDEAS[0].id);

  const check = checkTag(tag);
  const gen = useMemo(() => generateTags(server), [server]);
  const shown = splitChars(tag).slice(0, MAX_TAG).join("") || "?";
  const time = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-US", { timeStyle: "short" }).format(new Date());
  const tagChip = (uid: string) => (
    <span class="st-tag" title={shown}>
      <Badge shape={shape} a={c1} b={c2} size={12} uid={uid} />
      {shown}
    </span>
  );

  return (
    <div class="tool-layout split st">
      <div class="stack">
        <section class="panel stack" aria-labelledby="st-y">
          <h2 class="panel-title" id="st-y">{s.yours}</h2>
          <div class="field">
            <label for="st-tag">{s.tag}</label>
            <div class="row">
              <input
                id="st-tag"
                class="input st-taginput"
                value={tag}
                maxLength={12}
                autocomplete="off"
                spellcheck={false}
                aria-invalid={check.status === "invalid"}
                aria-describedby="st-tag-status"
                onInput={(e) => setTag((e.target as HTMLInputElement).value)}
              />
              <CopyButton text={check.status === "invalid" ? "" : tag} lang={lang} label={s.copyTag} />
            </div>
            <div id="st-tag-status" class={`st-status ${check.status === "ok" ? "st-ok" : check.status === "warn" ? "st-warn" : "st-bad"}`} aria-live="polite">
              <Icon name={check.status === "ok" ? "Check" : check.status === "warn" ? "TriangleAlert" : "X"} size={16} />
              {check.status === "ok" ? <span>{s.ok}</span> : (
                <ul>{check.issues.map((i, k) => <li key={k}>{s.issue(i)}</li>)}</ul>
              )}
            </div>
          </div>

          <div class="field">
            <span class="label" id="st-b-l">{s.badge}</span>
            <div class="st-badges" role="group" aria-labelledby="st-b-l">
              {SHAPES.map((sh) => (
                <button type="button" key={sh.id} class="st-badge-btn" aria-pressed={shape === sh.id} aria-label={sh[lang]} title={sh[lang]} onClick={() => setShape(sh.id)}>
                  <Badge shape={sh.id} a={c1} b={c2} size={26} uid={"pick-" + sh.id} />
                </button>
              ))}
            </div>
            <span class="hint">{s.badgeNote}</span>
          </div>

          <div class="field">
            <span class="label">{s.colors}</span>
            <div class="st-colors">
              <label class="st-color">
                <span class="st-swatch" style={{ background: c1 }}>
                  <input type="color" value={c1.toLowerCase()} onInput={(e) => setC1((e.target as HTMLInputElement).value.toUpperCase())} />
                </span>
                <span class="hint">{s.c1}</span>
              </label>
              <label class="st-color">
                <span class="st-swatch" style={{ background: c2 }}>
                  <input type="color" value={c2.toLowerCase()} onInput={(e) => setC2((e.target as HTMLInputElement).value.toUpperCase())} />
                </span>
                <span class="hint">{s.c2}</span>
              </label>
            </div>
            <div class="st-presets" role="group" aria-label={s.presets}>
              {COLOR_PRESETS.map(([a, b]) => (
                <button
                  type="button"
                  key={a}
                  class="st-preset"
                  style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                  aria-pressed={c1 === a && c2 === b}
                  aria-label={`${a} → ${b}`}
                  onClick={() => {
                    setC1(a);
                    setC2(b);
                  }}
                />
              ))}
            </div>
          </div>

          <div class="field">
            <label for="st-name">{s.member}</label>
            <input id="st-name" class="input" value={name} maxLength={32} autocomplete="off" onInput={(e) => setName((e.target as HTMLInputElement).value)} />
          </div>
        </section>

      </div>

      <div class="stack sticky st-pv">
        <div class="dp-bar">
          <span class="dp-label">{s.preview}</span>
          <div class="segmented" role="group" aria-label="Theme">
            {PREVIEW_THEMES.map((t) => (
              <button type="button" key={t.id} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>
        <div class={`dp dp-theme-${theme}`} role="img" aria-label={`${s.preview}: ${name} ${shown}`}>
          <div class="st-big">{tagChip("big")}</div>
          <div class="dp-message">
            <span class="st-mav" style={{ width: 40, height: 40, background: c2, fontSize: 16 }} aria-hidden="true">{(name.trim()[0] ?? "?").toUpperCase()}</span>
            <div class="dp-body">
              <div class="dp-header">
                <span class="dp-username">{name || "…"}</span>
                {tagChip("msg")}
                <time class="dp-time">{s.today} {time}</time>
              </div>
              <div class="dp-content">{s.msg}</div>
            </div>
          </div>
          <div class="dp-message">
            <span class="st-mav" style={{ width: 40, height: 40, background: "#5865f2", fontSize: 16 }} aria-hidden="true">M</span>
            <div class="dp-body">
              <div class="dp-header">
                <span class="dp-username">Mika</span>
                <time class="dp-time">{s.today} {time}</time>
              </div>
              <div class="dp-content">{s.reply}</div>
            </div>
          </div>
        </div>
        <div class={`dp dp-theme-${theme}`} aria-hidden="true">
          <div class="st-members">
            <div class="st-members-h">{s.online} — 3</div>
            {[
              { n: name || "…", bg: c2, tag: true },
              { n: "Mika", bg: "#5865f2", tag: false },
              { n: "Jona", bg: "#e67e22", tag: true },
            ].map((m, i) => (
              <div class="st-member" key={i}>
                <span class="st-mav" style={{ background: m.bg }}>{(m.n[0] ?? "?").toUpperCase()}</span>
                <span class="st-mrow">
                  <span class="st-mname">{m.n}</span>
                  {m.tag && tagChip("m" + i)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p class="hint dp-note">{s.previewNote}</p>
      </div>
      <div class="stack st-rest">
        <section class="panel stack" aria-labelledby="st-g">
          <h2 class="panel-title" id="st-g">{s.gen}</h2>
          <div class="field">
            <label for="st-server">{s.server}</label>
            <input id="st-server" class="input" value={server} maxLength={100} autocomplete="off" onInput={(e) => setServer((e.target as HTMLInputElement).value)} />
          </div>
          {gen.length ? (
            <div class="st-chips">
              {gen.map((t) => (
                <button type="button" key={t} class={checkTag(t).status === "warn" ? "st-chip is-warn" : "st-chip"} aria-pressed={tag === t} aria-label={s.use(t)} onClick={() => setTag(t)}>
                  {t}
                </button>
              ))}
            </div>
          ) : (
            <p class="hint">{s.none}</p>
          )}
          <span class="hint">{s.genHint}</span>
        </section>

        <section class="panel stack" aria-labelledby="st-i">
          <h2 class="panel-title" id="st-i">{s.ideas}</h2>
          <div class="segmented" role="group" aria-label={s.ideas}>
            {IDEAS.map((g) => (
              <button type="button" key={g.id} aria-pressed={ideaGroup === g.id} onClick={() => setIdeaGroup(g.id)}>{g.name[lang]}</button>
            ))}
          </div>
          <div class="st-chips">
            {(IDEAS.find((g) => g.id === ideaGroup)?.tags ?? []).map((t) => (
              <button type="button" key={t} class={checkTag(t).status === "warn" ? "st-chip is-warn" : "st-chip"} aria-pressed={tag === t} aria-label={s.use(t)} onClick={() => setTag(t)}>
                {t}
              </button>
            ))}
          </div>
        </section>

        <section class="panel st-howto" aria-labelledby="st-h">
          <h2 class="panel-title" id="st-h">{s.howto}</h2>
          <h3>{s.owner}</h3>
          <ol>{s.ownerSteps.map((x) => <li key={x}>{x}</li>)}</ol>
          <p style={{ marginTop: "10px" }}>{s.packs}</p>
          <h3 style={{ marginTop: "18px" }}>{s.members}</h3>
          <ol>{s.memberSteps.map((x) => <li key={x}>{x}</li>)}</ol>
          <p class="notice" style={{ marginTop: "14px" }}>{s.facts}</p>
        </section>
      </div>
    </div>
  );
}
