import CopyButton from "./CopyButton";
import type { Lang } from "../../i18n/ui";

/** A read-only code value with a copy button – the most common output in our tools. */
export default function Output({ value, lang, label, hint }: { value: string; lang: Lang; label?: string; hint?: string }) {
  return (
    <div class="field">
      {label && <span class="label">{label}</span>}
      <div class="output">
        <code>{value}</code>
        <CopyButton text={value} lang={lang} size="sm" />
      </div>
      {hint && <span class="hint">{hint}</span>}
    </div>
  );
}
