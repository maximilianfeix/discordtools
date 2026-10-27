export type Lang = "de" | "en";
export const LANGS: Lang[] = ["de", "en"];
export const DEFAULT_LANG: Lang = "de";

export const ui = {
  de: {
    "site.tagline": "Kostenlose Discord-Tools – schnell, privat, ohne Anmeldung.",
    "site.description":
      "Über 25 kostenlose Discord-Tools: Zeitstempel, Embed-Builder, farbiger Text, ID-Lookup, Rechte-Rechner und mehr. Läuft im Browser, ohne Tracking.",
    "nav.tools": "Alle Tools",
    "nav.search": "Tools durchsuchen",
    "nav.searchShort": "Suchen",
    "nav.theme": "Farbschema wechseln",
    "nav.language": "Sprache",
    "nav.github": "Quellcode auf GitHub",
    "nav.menu": "Menü",
    "skip": "Zum Inhalt springen",
    "search.placeholder": "Tool suchen … z. B. Zeitstempel, Embed, ID",
    "search.empty": "Kein Tool gefunden. Versuch einen anderen Begriff.",
    "search.recent": "Zuletzt benutzt",
    "search.favorites": "Favoriten",
    "search.all": "Alle Tools",
    "search.hint": "Navigieren mit ↑ ↓, öffnen mit Enter",
    "tool.local": "Läuft komplett in deinem Browser",
    "tool.server": "Fragt direkt bei Discord an – nicht über unseren Server",
    "tool.favorite": "Zu Favoriten",
    "tool.unfavorite": "Aus Favoriten entfernen",
    "tool.share": "Link kopieren",
    "tool.howto": "So funktioniert’s",
    "tool.faq": "Häufige Fragen",
    "tool.related": "Passende Tools",
    "tool.new": "Neu",
    "tool.popular": "Beliebt",
    "copy": "Kopieren",
    "copied": "Kopiert",
    "copyFailed": "Kopieren fehlgeschlagen",
    "reset": "Zurücksetzen",
    "home.title": "Discord-Tools, die einfach funktionieren.",
    "home.lead":
      "Zeitstempel, Embeds, farbiger Text, IDs, Rechte und mehr – kostenlos, ohne Anmeldung und fast alles direkt in deinem Browser.",
    "home.cta": "Tools durchsuchen",
    "home.popular": "Beliebte Tools",
    "home.allCategories": "Alle Kategorien",
    "home.why.title": "Warum discordtools?",
    "home.why.private.title": "Privat by default",
    "home.why.private.text": "Keine Cookies, kein Tracking, keine Anmeldung. Fast alle Tools laufen lokal im Browser.",
    "home.why.fast.title": "Schnell auf jedem Gerät",
    "home.why.fast.text": "Statische Seiten, winziges JavaScript, gebaut für Handy und Desktop.",
    "home.why.current.title": "Auf dem neuesten Stand",
    "home.why.current.text": "Aktuelle Rechte, Markdown, Zeitstempel und Embed-Limits – geprüft gegen die Discord-Doku.",
    "home.why.open.title": "Open Source",
    "home.why.open.text": "Der komplette Code liegt auf GitHub. Fehler gefunden? Mach ein Issue auf.",
    "footer.disclaimer":
      "discordtools.de ist ein unabhängiges Projekt und steht in keiner Verbindung zu Discord Inc. „Discord“ ist eine Marke von Discord Inc.",
    "footer.imprint": "Impressum",
    "footer.privacy": "Datenschutz",
    "footer.source": "Quellcode",
    "footer.madeIn": "Gemacht in Deutschland",
    "lang.switch": "English",
  },
  en: {
    "site.tagline": "Free Discord tools – fast, private, no sign-up.",
    "site.description":
      "25+ free Discord tools: timestamps, embed builder, colored text, ID lookup, permissions calculator and more. Runs in your browser, no tracking.",
    "nav.tools": "All tools",
    "nav.search": "Search tools",
    "nav.searchShort": "Search",
    "nav.theme": "Toggle color scheme",
    "nav.language": "Language",
    "nav.github": "Source on GitHub",
    "nav.menu": "Menu",
    "skip": "Skip to content",
    "search.placeholder": "Find a tool … e.g. timestamp, embed, ID",
    "search.empty": "No tool found. Try another word.",
    "search.recent": "Recently used",
    "search.favorites": "Favorites",
    "search.all": "All tools",
    "search.hint": "Navigate with ↑ ↓, open with Enter",
    "tool.local": "Runs entirely in your browser",
    "tool.server": "Asks Discord directly – never via our server",
    "tool.favorite": "Add to favorites",
    "tool.unfavorite": "Remove from favorites",
    "tool.share": "Copy link",
    "tool.howto": "How it works",
    "tool.faq": "FAQ",
    "tool.related": "Related tools",
    "tool.new": "New",
    "tool.popular": "Popular",
    "copy": "Copy",
    "copied": "Copied",
    "copyFailed": "Copy failed",
    "reset": "Reset",
    "home.title": "Discord tools that just work.",
    "home.lead":
      "Timestamps, embeds, colored text, IDs, permissions and more – free, no sign-up, and almost everything runs right in your browser.",
    "home.cta": "Search tools",
    "home.popular": "Popular tools",
    "home.allCategories": "All categories",
    "home.why.title": "Why discordtools?",
    "home.why.private.title": "Private by default",
    "home.why.private.text": "No cookies, no tracking, no sign-up. Almost every tool runs locally in your browser.",
    "home.why.fast.title": "Fast on every device",
    "home.why.fast.text": "Static pages, tiny JavaScript, built for phones and desktops.",
    "home.why.current.title": "Always current",
    "home.why.current.text": "Current permissions, markdown, timestamps and embed limits – checked against Discord's docs.",
    "home.why.open.title": "Open source",
    "home.why.open.text": "All the code is on GitHub. Found a bug? Open an issue.",
    "footer.disclaimer":
      "discordtools.de is an independent project and is not affiliated with Discord Inc. “Discord” is a trademark of Discord Inc.",
    "footer.imprint": "Imprint",
    "footer.privacy": "Privacy",
    "footer.source": "Source code",
    "footer.madeIn": "Made in Germany",
    "lang.switch": "Deutsch",
  },
} as const;

export type UiKey = keyof (typeof ui)["de"];

export function t(lang: Lang, key: UiKey): string {
  return ui[lang][key] ?? ui.de[key];
}

/** URL of a page in the given language. German lives at the root, English under /en. */
export function localePath(lang: Lang, path = "/"): string {
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  if (lang === "de") return clean || "/";
  return `/en${clean}`;
}

export const GITHUB_URL = "https://github.com/maximilianfeix/discordtools";
