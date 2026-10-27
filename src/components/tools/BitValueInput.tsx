import type { Lang } from "../../i18n/ui";
import CopyButton from "../ui/CopyButton";
import { PARSE_ERRORS, parseBitfield } from "../../lib/bitfield";

/** Editable bitfield value with copy button and parse errors. Shared by the intents and flags tools. */
export default function BitValueInput({ id, label, text, onText, lang, hint }: {
  id: string;
  label: string;
  text: string;
  onText: (s: string) => void;
  lang: Lang;
  hint?: string;
}) {
  const r = parseBitfield(text);
  const err = !r.ok && r.error !== "empty" ? PARSE_ERRORS[lang][r.error] : "";
  return (
    <div class="field">
      <label for={id}>{label}</label>
      <div class="bv-row" style={{ display: "flex", gap: "8px" }}>
        <input
          id={id}
          class="input mono"
          type="text"
          autocomplete="off"
          spellcheck={false}
          value={text}
          aria-invalid={err ? "true" : undefined}
          aria-describedby={`${id}-hint`}
          onInput={(e) => onText((e.target as HTMLInputElement).value)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <CopyButton text={r.ok ? r.value.toString() : ""} lang={lang} variant="icon" />
      </div>
      <span id={`${id}-hint`} class="hint" style={err ? { color: "var(--danger)" } : undefined} aria-live="polite">
        {err || hint}
      </span>
    </div>
  );
}
