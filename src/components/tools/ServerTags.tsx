import type { Lang } from "../../i18n/ui";

export default function ServerTags({ lang }: { lang: Lang }) {
  return <div class="panel">{lang === "de" ? "Kommt gleich." : "Coming soon."}</div>;
}
