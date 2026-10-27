import { useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import { Notice, localeOf, toolHref } from "./lookup-ui";
import { MessageView } from "../discord/Preview";
import {
  DISCORD_BACKGROUNDS,
  EMBED_PICKS,
  ROLE_PRESETS,
  SEMANTIC,
  contrastRatio,
  formatHsl,
  formatRgb,
  grade,
  intToHex,
  parseColor,
  readableOn,
  snippets,
  type ContrastGrade,
  type PaletteColor,
} from "../../lib/color";
import "./ColorConverter.css";

const L = {
  de: {
    input: "Farbe",
    inputHint: "Alles geht: #5865F2, #abc, 0x5865F2, 5793266, rgb(88, 101, 242), hsl(235, 86%, 65%)",
    picker: "Farbwähler",
    invalid: "Diese Farbe verstehe ich nicht. Probier z. B. #ff8800, 16746496 oder rgb(255, 136, 0).",
    ambiguous: (s: string, hex: string) => `„${s}“ wurde als Dezimalzahl gelesen (= ${hex}). Meinst du den Hex-Wert, schreib #${s}.`,
    decimal: "Dezimal (für JSON / Webhooks)",
    hex: "Hex",
    hex0x: "0x-Hex (für Code)",
    rgb: "RGB",
    hsl: "HSL",
    code: "Code",
    semantic: "Für Bot-Antworten",
    picks: "Schöne Embed-Farben",
    roles: "Discord-Rollenfarben (Voreinstellungen)",
    preview: "Vorschau in allen vier Themes",
    contrast: "Kontrast als Rollenfarbe",
    good: "gut lesbar",
    ok: "geht so",
    poor: "schlecht lesbar",
    contrastHint: "Rollenfarben erscheinen als Text auf dem Chat-Hintergrund. Ab 4,5 : 1 ist er gut lesbar, ab 3 : 1 für fette Namen noch okay.",
    zeroNote: "Bei Rollen bedeutet 0 „keine Farbe“ – Discord nimmt dann die Standardfarbe. Für Schwarz nimm #010101.",
    username: "Rollenname",
    embedTitle: "Neues Update",
    embedDesc: "So sieht deine Farbe als Embed-Rand aus.",
    roleLink: "Mehr zu Rollenfarben und Verläufen",
  },
  en: {
    input: "Color",
    inputHint: "Anything works: #5865F2, #abc, 0x5865F2, 5793266, rgb(88, 101, 242), hsl(235, 86%, 65%)",
    picker: "Color picker",
    invalid: "I don't understand this color. Try e.g. #ff8800, 16746496 or rgb(255, 136, 0).",
    ambiguous: (s: string, hex: string) => `“${s}” was read as a decimal number (= ${hex}). If you meant hex, write #${s}.`,
    decimal: "Decimal (for JSON / webhooks)",
    hex: "Hex",
    hex0x: "0x hex (for code)",
    rgb: "RGB",
    hsl: "HSL",
    code: "Code",
    semantic: "For bot replies",
    picks: "Nice embed colors",
    roles: "Discord role color presets",
    preview: "Preview in all four themes",
    contrast: "Contrast as a role color",
    good: "easy to read",
    ok: "so-so",
    poor: "hard to read",
    contrastHint: "Role colors show up as text on the chat background. 4.5 : 1 or more reads well, 3 : 1 is still okay for bold names.",
    zeroNote: "For roles, 0 means “no color” – Discord falls back to the default. For black use #010101.",
    username: "Role name",
    embedTitle: "New update",
    embedDesc: "This is your color as the embed border.",
    roleLink: "More on role colors and gradients",
  },
};

const GRADE_CLASS: Record<ContrastGrade, string> = { good: "is-ok", ok: "is-warn", poor: "is-bad" };

export default function ColorConverter({ lang }: { lang: Lang }) {
  const t = L[lang];
  const locale = localeOf(lang);
  const [text, setText] = useState("#5865F2");
  const last = useRef(0x5865f2);
  const parsed = useMemo(() => parseColor(text), [text]);
  if (parsed) last.current = parsed.int; // keep showing the last valid color while typing
  const n = parsed?.int ?? last.current;
  const hex = intToHex(n);
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 });

  const set = (v: string) => setText(v);

  const Swatches = ({ title, list }: { title: string; list: PaletteColor[] }) => (
    <div class="stack">
      <h3 class="lk-section-title">{title}</h3>
      <div class="cc-swatches">
        {list.map((c) => (
          <button type="button" class="cc-swatch" key={c.hex} aria-pressed={hex === c.hex.toUpperCase()} onClick={() => set(c.hex)} title={`${c.name[lang]} ${c.hex}`}>
            <span class="cc-swatch-color" style={{ background: c.hex }} />
            <span class="cc-swatch-text">
              <span class="cc-swatch-name">{c.name[lang]}</span>
              <span class="cc-swatch-hex">{c.hex}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div class="tool-layout split cc">
      <div class="stack">
        <section class="panel stack">
          <div class="field">
            <label for="cc-input">{t.input}</label>
            <div class="cc-input-row">
              <input
                id="cc-input"
                class="input mono"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck={false}
                value={text}
                aria-invalid={!parsed}
                aria-describedby="cc-hint"
                onInput={(e) => set((e.currentTarget as HTMLInputElement).value)}
              />
              <input class="cc-picker" type="color" aria-label={t.picker} value={hex.toLowerCase()} onInput={(e) => set((e.currentTarget as HTMLInputElement).value.toUpperCase())} />
            </div>
            <span id="cc-hint" class="hint">{t.inputHint}</span>
          </div>
          <div aria-live="polite">
            {!parsed && text.trim() !== "" && <Notice kind="error" title={t.invalid} />}
            {parsed?.ambiguous && <Notice kind="info" title={t.ambiguous(text.trim(), hex)} />}
          </div>
          <div class="cc-big">
            <div class="cc-big-swatch" style={{ background: hex, color: readableOn(n) }}>
              Aa
            </div>
            <div>
              <p class="cc-big-hex">{hex}</p>
              <p class="hint" style={{ margin: 0 }}>
                {n}
              </p>
            </div>
          </div>
          <div class="cc-outputs">
            {(
              [
                [t.decimal, String(n)],
                [t.hex, hex],
                [t.hex0x, `0x${hex.slice(1)}`],
                [t.rgb, formatRgb(n)],
                [t.hsl, formatHsl(n)],
              ] as [string, string][]
            ).map(([label, v]) => (
              <div class="field" key={label}>
                <span class="label">{label}</span>
                <div class="output">
                  <code>{v}</code>
                  <CopyButton text={v} lang={lang} size="sm" variant="icon" />
                </div>
              </div>
            ))}
          </div>
          {n === 0 && <Notice title={t.zeroNote} />}
          <div class="field">
            <span class="label">{t.code}</span>
            <div class="cc-snippets">
              {snippets(n).map((s) => (
                <div class="output" key={s.label}>
                  <code>
                    <span class="hint">{s.label}: </span>
                    {s.code}
                  </code>
                  <CopyButton text={s.code} lang={lang} size="sm" variant="icon" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section class="panel stack cc-palettes">
          <Swatches title={t.semantic} list={SEMANTIC} />
          <Swatches title={t.picks} list={EMBED_PICKS} />
          <Swatches title={t.roles} list={ROLE_PRESETS} />
        </section>
      </div>

      <div class="sticky stack">
        <section class="panel stack" aria-labelledby="cc-prev">
          <h2 class="panel-title" id="cc-prev">
            {t.preview}
          </h2>
          <div class="cc-themes">
            {DISCORD_BACKGROUNDS.map((b) => {
              const ratio = contrastRatio(n, b.bg);
              const g = grade(ratio);
              return (
                <div class="cc-theme" key={b.id}>
                  <div class={`dp dp-theme-${b.id}`}>
                    <MessageView
                      opts={{ locale }}
                      msg={{
                        username: t.username,
                        color: n === 0 ? undefined : hex,
                        date: new Date(),
                        embeds: [{ title: t.embedTitle, description: t.embedDesc, color: n }],
                      }}
                    />
                  </div>
                  <div class="cc-theme-foot">
                    <span>{b.name}</span>
                    <span class={`lk-pill ${GRADE_CLASS[g]}`}>
                      {nf.format(Math.floor(ratio * 10) / 10)} : 1 · {t[g]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p class="hint" style={{ margin: 0 }}>
            {t.contrastHint}{" "}
            <a href={toolHref("role-colors", lang)}>{t.roleLink}</a>
          </p>
        </section>
      </div>
    </div>
  );
}
