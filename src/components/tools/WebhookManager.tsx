import type { Lang } from "../../i18n/ui";

export default function WebhookManager({ lang }: { lang: Lang }) {
  return <div class="panel">{lang === "de" ? "Kommt gleich." : "Coming soon."}</div>;
}
