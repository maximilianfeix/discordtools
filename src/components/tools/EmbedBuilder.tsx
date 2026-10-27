import type { Lang } from "../../i18n/ui";

export default function EmbedBuilder({ lang }: { lang: Lang }) {
  return <div class="panel">{lang === "de" ? "Kommt gleich." : "Coming soon."}</div>;
}
