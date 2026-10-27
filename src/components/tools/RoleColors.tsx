import { useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import Output from "../ui/Output";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import {
  GRADIENTS, PALETTES, THEMES, adjustToContrast, contrast, hexToDecimal, hexToRgb, level, parseColorInput,
} from "../../lib/role-colors";
import "./RoleColors.css";

/** Discord forces these values when a role gets a tertiary color (holographic style). */
const HOLO = ["#A9C9FF", "#FFBBEC", "#FFC3A0"];

type Style = "solid" | "gradient" | "holo";

const L = {
  de: {
    style: "Rollenstil",
    styles: { solid: "Einfarbig", gradient: "Verlauf", holo: "Holografisch" } as Record<Style, string>,
    primary: "Farbe",
    first: "Farbe 1",
    second: "Farbe 2",
    colorHint: "Hex (#3EE0A8) oder Dezimalzahl (4120744).",
    invalid: "Keine gültige Farbe",
    pick: "Farbe auswählen",
    swap: "Farben tauschen",
    user: "Name",
    role: "Rollenname",
    enhanced:
      "Verläufe und Holografisch gehören zu den „Enhanced Role Styles“: Der Server braucht dafür 3 Server-Boosts (unabhängig vom Boost-Level). Einstellen geht nur am Desktop/Browser, sehen können es alle – ältere Apps zeigen nur die erste Farbe.",
    holoNote: "Holografisch nutzt feste Farben von Discord – du kannst sie nicht ändern. Die Animation lässt sich in den Bedienungshilfen über „Bewegung reduzieren“ abschalten.",
    target: "Kontrast-Ziel",
    targets: { 3: "3:1 (Minimum)", 4.5: "4.5:1 (gut lesbar)" } as Record<string, string>,
    preview: "Vorschau in allen 4 Discord-Themes",
    previewNote: "Vorschau – kann leicht vom echten Discord abweichen. Discord passt Verläufe in hellen und dunklen Themes teils automatisch an.",
    msg: "hat gerade eine neue Rolle bekommen:",
    fix: "Anpassen",
    fixAria: (t: string) => `Farbe für ${t} automatisch anpassen`,
    fixed: (t: string) => `Farbe für ${t} angepasst`,
    noFix: "Geht nicht ohne Farbwechsel",
    pass: "gut",
    mid: "nur groß",
    fail: "zu schwach",
    out: "Werte",
    hex: "Hex",
    dec: "Dezimal (für Bots und die API)",
    rgb: "RGB",
    json: "API-Feld colors",
    palettes: "Beliebte Farb-Sets",
    copySet: "Set kopieren",
    use: (n: string) => `${n} übernehmen`,
    gradients: "Verlauf-Ideen",
    now: "jetzt",
  },
  en: {
    style: "Role style",
    styles: { solid: "Solid", gradient: "Gradient", holo: "Holographic" } as Record<Style, string>,
    primary: "Color",
    first: "Color 1",
    second: "Color 2",
    colorHint: "Hex (#3EE0A8) or decimal (4120744).",
    invalid: "Not a valid color",
    pick: "Pick color",
    swap: "Swap colors",
    user: "Name",
    role: "Role name",
    enhanced:
      "Gradient and holographic are “Enhanced Role Styles”: the server needs 3 Server Boosts for them (independent of the boost level). They can only be set on desktop/browser, everyone can see them – outdated apps show the first color only.",
    holoNote: "Holographic uses fixed colors from Discord – you can't change them. The animation can be turned off with “Reduced motion” in Accessibility settings.",
    target: "Contrast target",
    targets: { 3: "3:1 (minimum)", 4.5: "4.5:1 (easy to read)" } as Record<string, string>,
    preview: "Preview in all 4 Discord themes",
    previewNote: "Preview – may differ slightly from Discord. Discord partly adjusts gradients for light and dark themes automatically.",
    msg: "just got a new role:",
    fix: "Adjust",
    fixAria: (t: string) => `Adjust color for ${t} automatically`,
    fixed: (t: string) => `Color adjusted for ${t}`,
    noFix: "Not possible without changing hue",
    pass: "good",
    mid: "large only",
    fail: "too weak",
    out: "Values",
    hex: "Hex",
    dec: "Decimal (for bots and the API)",
    rgb: "RGB",
    json: "API field colors",
    palettes: "Popular color sets",
    copySet: "Copy set",
    use: (n: string) => `Use ${n}`,
    gradients: "Gradient ideas",
    now: "now",
  },
};

function ColorInput({ id, label, value, onChange, lang }: { id: string; label: string; value: string; onChange: (hex: string) => void; lang: Lang }) {
  const s = L[lang];
  const [text, setText] = useState(value);
  const [shown, setShown] = useState(value);
  // Keep the text field in sync when the color changes from outside (palette, fix, swap).
  if (shown !== value) {
    setShown(value);
    setText(value);
  }
  const ok = parseColorInput(text) !== null;
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <div class="rc-color">
        <label class="rc-swatch" style={{ background: value }} title={s.pick}>
          <span class="sr-only">{s.pick}: {label}</span>
          <input type="color" value={value.toLowerCase()} onInput={(e) => onChange((e.target as HTMLInputElement).value.toUpperCase())} />
        </label>
        <input
          id={id}
          class="input mono"
          value={text}
          autocomplete="off"
          spellcheck={false}
          aria-invalid={!ok}
          aria-describedby={`${id}-h`}
          onInput={(e) => {
            const v = (e.target as HTMLInputElement).value;
            setText(v);
            const hex = parseColorInput(v);
            if (hex) {
              setShown(hex);
              onChange(hex);
            }
          }}
        />
      </div>
      <span class="hint" id={`${id}-h`}>{ok ? s.colorHint : s.invalid}</span>
    </div>
  );
}

export default function RoleColors({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [style, setStyle] = useState<Style>("solid");
  const [a, setA] = useState("#3498DB");
  const [b, setB] = useState("#9B59B6");
  const [user, setUser] = useState(lang === "de" ? "Lena" : "Alex");
  const [role, setRole] = useState("Moderator");
  const [target, setTarget] = useState<3 | 4.5>(4.5);

  const stops = style === "solid" ? [a] : style === "gradient" ? [a, b] : HOLO;
  const nameStyle = (): Record<string, string> => {
    if (style === "solid") return { color: a };
    if (style === "gradient") return { backgroundImage: `linear-gradient(90deg, ${a}, ${b})` };
    return { backgroundImage: `linear-gradient(90deg, ${HOLO[0]}, ${HOLO[1]}, ${HOLO[2]}, ${HOLO[0]})` };
  };
  const nameClass = style === "solid" ? "rc-name" : style === "gradient" ? "rc-name rc-grad-text" : "rc-name rc-grad-text rc-holo";
  const rgb = hexToRgb(a);
  const colorsJson =
    style === "solid"
      ? `{"primary_color": ${hexToDecimal(a)}, "secondary_color": null, "tertiary_color": null}`
      : style === "gradient"
        ? `{"primary_color": ${hexToDecimal(a)}, "secondary_color": ${hexToDecimal(b)}, "tertiary_color": null}`
        : `{"primary_color": ${hexToDecimal(HOLO[0])}, "secondary_color": ${hexToDecimal(HOLO[1])}, "tertiary_color": ${hexToDecimal(HOLO[2])}}`;

  const fix = (bg: string, label: string) => {
    const na = adjustToContrast(a, bg, target);
    const nb = style === "gradient" ? adjustToContrast(b, bg, target) : b;
    if (!na || !nb) {
      toast(s.noFix, "error");
      return;
    }
    setA(na);
    setB(nb);
    toast(s.fixed(label));
  };

  const selectedHex = style === "gradient" ? [a, b] : [a];

  return (
    <div class="tool-layout split rc">
      <div class="stack">
        <section class="panel stack" aria-label={s.style}>
          <div class="field">
            <span class="label" id="rc-style-l">{s.style}</span>
            <div class="segmented" role="group" aria-labelledby="rc-style-l">
              {(["solid", "gradient", "holo"] as Style[]).map((st) => (
                <button type="button" key={st} aria-pressed={style === st} onClick={() => setStyle(st)}>{s.styles[st]}</button>
              ))}
            </div>
          </div>
          {style !== "holo" ? (
            <div class="rc-colors">
              <ColorInput id="rc-a" label={style === "solid" ? s.primary : s.first} value={a} onChange={setA} lang={lang} />
              {style === "gradient" && (
                <>
                  <button
                    type="button"
                    class="btn btn-sm btn-ghost rc-swap"
                    onClick={() => {
                      setA(b);
                      setB(a);
                    }}
                  >
                    <Icon name="ArrowDown" size={15} />
                    <Icon name="ArrowUp" size={15} />
                    {s.swap}
                  </button>
                  <ColorInput id="rc-b" label={s.second} value={b} onChange={setB} lang={lang} />
                </>
              )}
            </div>
          ) : (
            <p class="notice rc-note">
              <Icon name="Sparkles" size={16} />
              <span>{s.holoNote}</span>
            </p>
          )}
          <div class="grid-2">
            <div class="field">
              <label for="rc-user">{s.user}</label>
              <input id="rc-user" class="input" value={user} maxLength={32} autocomplete="off" onInput={(e) => setUser((e.target as HTMLInputElement).value)} />
            </div>
            <div class="field">
              <label for="rc-role">{s.role}</label>
              <input id="rc-role" class="input" value={role} maxLength={100} autocomplete="off" onInput={(e) => setRole((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          {style !== "solid" && (
            <p class="notice rc-note">
              <Icon name="Info" size={16} />
              <span>{s.enhanced}</span>
            </p>
          )}
        </section>

      </div>

      <div class="stack sticky rc-prev">
        <div class="rc-targets">
          <span class="label" id="rc-t-l">{s.target}</span>
          <div class="segmented" role="group" aria-labelledby="rc-t-l">
            {([3, 4.5] as const).map((t) => (
              <button type="button" key={t} aria-pressed={target === t} onClick={() => setTarget(t)}>{s.targets[String(t)]}</button>
            ))}
          </div>
        </div>
        <section class="rc-themes" aria-label={s.preview}>
          {THEMES.map((t) => {
            const ratio = Math.min(...stops.map((c) => contrast(c, t.bg)));
            const lv = level(ratio);
            const ok = ratio >= target;
            const suggestion = style === "solid" && !ok ? adjustToContrast(a, t.bg, target) : null;
            const initial = (user.trim()[0] ?? "?").toUpperCase();
            return (
              <article
                key={t.id}
                class="rc-tile"
                style={{ "--rc-bg": t.bg, "--rc-text": t.text, "--rc-muted": t.muted, "--rc-strong": t.id === "light" ? "#28282D" : "#FFFFFF" } as Record<string, string>}
              >
                <div class="rc-tile-head">
                  <span>{t.label}</span>
                  <span class="mono">{t.bg}</span>
                </div>
                <div class="rc-msg">
                  <span class="rc-av" style={{ background: style === "solid" ? a : `linear-gradient(135deg, ${stops.join(", ")})` }} aria-hidden="true">{initial}</span>
                  <div class="rc-body">
                    <div>
                      <span class={nameClass} style={nameStyle()}>{user || "…"}</span>
                      <span class="rc-time">{s.now}</span>
                    </div>
                    <div class="rc-text">
                      {s.msg}{" "}
                      <span class="rc-mention" style={{ color: stops[0], background: stops[0] + "1A" }}>@{role || "Role"}</span>
                    </div>
                  </div>
                </div>
                <div class="rc-member">
                  <span class="rc-av" style={{ background: "#5c5e66" }} aria-hidden="true">{initial}</span>
                  <span class={nameClass} style={nameStyle()}>{user || "…"}</span>
                </div>
                <div class="rc-score">
                  <span class="rc-ratio">{ratio.toFixed(2)}:1</span>
                  <span class={`rc-badge ${lv === "AA" ? "rc-pass" : lv === "AA-large" ? "rc-mid" : "rc-fail"}`}>
                    {lv === "AA" ? s.pass : lv === "AA-large" ? s.mid : s.fail}
                  </span>
                  {!ok && style !== "holo" && (
                    <button type="button" class="rc-fix" aria-label={s.fixAria(t.label)} onClick={() => fix(t.bg, t.label)}>
                      {suggestion && <span class="rc-dot" style={{ background: suggestion }} aria-hidden="true" />}
                      {s.fix}
                      {suggestion && <span class="mono">{suggestion}</span>}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>
        <p class="hint">{s.previewNote}</p>

        <section class="panel rc-out" aria-labelledby="rc-out-t">
          <h2 class="panel-title" id="rc-out-t">{s.out}</h2>
          {style === "solid" ? (
            <>
              <Output lang={lang} label={s.hex} value={a} />
              <Output lang={lang} label={s.dec} value={String(hexToDecimal(a))} />
              <Output lang={lang} label={s.rgb} value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`} />
            </>
          ) : (
            <>
              <Output lang={lang} label={s.hex} value={stops.join(" → ")} />
              <Output lang={lang} label={s.dec} value={stops.map((c) => hexToDecimal(c)).join(", ")} />
            </>
          )}
          <Output lang={lang} label={s.json} value={colorsJson} />
        </section>
      </div>
      <div class="stack rc-pals">
          <section class="panel stack" aria-labelledby="rc-pal">
            <h2 class="panel-title" id="rc-pal">{s.palettes}</h2>
            <div class="rc-sets">
              {PALETTES.map((p) => (
                <div key={p.id}>
                  <div class="rc-set-head">
                    <span class="rc-set-name">{p.name[lang]}</span>
                    <CopyButton text={p.colors.map((c) => `${c.name[lang]}: ${c.hex}`).join("\n")} lang={lang} size="sm" label={s.copySet} />
                  </div>
                  <div class="rc-chips">
                    {p.colors.map((c) => (
                      <button
                        type="button"
                        key={c.hex + c.name.en}
                        class="rc-chip"
                        aria-pressed={selectedHex.includes(c.hex)}
                        aria-label={s.use(`${c.name[lang]} ${c.hex}`)}
                        onClick={() => {
                          if (style === "holo") setStyle("solid");
                          setA(c.hex);
                          setRole(c.name[lang]);
                        }}
                      >
                        <span class="rc-dot" style={{ background: c.hex }} aria-hidden="true" />
                        {c.name[lang]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <div class="rc-set-head">
                  <span class="rc-set-name">{s.gradients}</span>
                </div>
                <div class="rc-grads">
                  {GRADIENTS.map((g) => (
                    <button
                      type="button"
                      key={g.a + g.b}
                      class="rc-chip"
                      aria-pressed={style === "gradient" && a === g.a && b === g.b}
                      aria-label={s.use(`${g.name[lang]} ${g.a} → ${g.b}`)}
                      onClick={() => {
                        setStyle("gradient");
                        setA(g.a);
                        setB(g.b);
                      }}
                    >
                      <span class="rc-dot" style={{ background: `linear-gradient(135deg, ${g.a}, ${g.b})` }} aria-hidden="true" />
                      {g.name[lang]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
      </div>
    </div>
  );
}
