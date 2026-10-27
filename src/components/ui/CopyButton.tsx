import { useState } from "preact/hooks";
import Icon from "../Icon";
import { copyText } from "./toast";
import type { Lang } from "../../i18n/ui";

const L = {
  de: { copy: "Kopieren", copied: "Kopiert", fail: "Kopieren fehlgeschlagen", toast: "In die Zwischenablage kopiert" },
  en: { copy: "Copy", copied: "Copied", fail: "Copy failed", toast: "Copied to clipboard" },
};

interface Props {
  text: string;
  lang: Lang;
  label?: string;
  /** "icon" renders a square icon button (label becomes the aria-label). */
  variant?: "default" | "primary" | "icon";
  size?: "sm" | "md";
  disabled?: boolean;
}

export default function CopyButton({ text, lang, label, variant = "default", size = "md", disabled }: Props) {
  const [done, setDone] = useState(false);
  const s = L[lang];
  const onClick = async () => {
    if (await copyText(text, s.toast, s.fail)) {
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    }
  };
  const cls = ["btn", variant === "primary" ? "btn-primary" : "", size === "sm" ? "btn-sm" : "", variant === "icon" ? "btn-icon" : "", "copy-btn", done ? "is-done" : ""]
    .filter(Boolean)
    .join(" ");
  const text_ = done ? s.copied : (label ?? s.copy);
  return (
    <button type="button" class={cls} onClick={onClick} disabled={disabled || !text} aria-label={variant === "icon" ? text_ : undefined}>
      <Icon name={done ? "Check" : "Copy"} size={size === "sm" ? 15 : 17} />
      {variant !== "icon" && <span>{text_}</span>}
    </button>
  );
}
