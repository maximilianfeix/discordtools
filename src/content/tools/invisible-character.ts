import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord unsichtbares Zeichen – leerer Name zum Kopieren",
    description:
      "Unsichtbares Zeichen für einen leeren Discord-Namen oder eine leere Nachricht kopieren. Mit ehrlicher Übersicht, was noch geht, Generator und Finder für versteckte Zeichen.",
    h1: "Unsichtbares Zeichen für Discord",
    lead: "Ein Klick kopiert das Hangul-Füllzeichen U+3164 – den bekanntesten Trick für einen leeren Anzeigenamen. Darunter findest du Alternativen, einen Mehrfach-Generator und einen Finder für versteckte Zeichen.",
    steps: [
      "Klick auf „Unsichtbares Zeichen kopieren“.",
      "Öffne in Discord Benutzereinstellungen → Profile und füge das Zeichen als Anzeigenamen ein.",
      "Lehnt Discord es ab, probier das nächste Zeichen aus der Tabelle, z. B. U+2800.",
      "Für leere Nachrichten oder Abstände nimm U+2800 und den Mehrfach-Generator.",
    ],
    faq: [
      {
        q: "Wie bekomme ich einen unsichtbaren Namen in Discord?",
        a: "Kopier das Hangul-Füllzeichen (U+3164) und setz es als Anzeigenamen oder Server-Spitznamen. Normale Leerzeichen funktionieren nicht, weil Discord sie am Anfang und Ende entfernt und der Name dann leer wäre.",
      },
      {
        q: "Geht das auch beim Benutzernamen?",
        a: "Nein. Benutzernamen (@name) erlauben nur a–z, 0–9, Unterstrich und Punkt. Unsichtbare Zeichen gehen nur im Anzeigenamen, im Server-Spitznamen und in Nachrichten.",
      },
      {
        q: "Warum funktioniert das Zeichen bei mir nicht mehr?",
        a: "Discord dokumentiert nicht, welche Zeichen erlaubt sind, und blockt einzelne immer wieder – auch, weil leere Namen für Spam und Täuschung genutzt werden. Die Angaben im Tool sind Erfahrungswerte (Stand Oktober 2026). Probier die Alternativen aus.",
      },
      {
        q: "Wie schicke ich eine leere Nachricht?",
        a: "Kopier U+2800 (Braille-Leerzeichen) und schick es allein. Für mehrere Leerzeilen stell im Generator eine Anzahl ein und aktivier „eigene Zeile“.",
      },
      {
        q: "Wie finde ich versteckte Zeichen in einem Text?",
        a: "Füge den Text in „Versteckte Zeichen finden“ ein. Das Tool markiert Zero-Width-Zeichen, Füllzeichen, Richtungszeichen und versteckte Tag-Zeichen und gibt dir eine bereinigte Fassung zum Kopieren.",
      },
    ],
    about: [
      "Bots nutzen `\\u200b` (Zero Width Space) gern für leere Embed-Feldnamen oder um `@everyone` ohne Ping zu zeigen. Das Tool läuft komplett im Browser – eingefügter Text verlässt dein Gerät nicht.",
    ],
  },
  en: {
    title: "Discord Invisible Character – blank name copy and paste",
    description:
      "Copy an invisible character for a blank Discord name or empty message. Honest overview of what still works, a repeat builder and a hidden-character finder.",
    h1: "Invisible character for Discord",
    lead: "One click copies the Hangul filler U+3164 – the best-known trick for a blank display name. Below you'll find alternatives, a repeat builder and a finder for hidden characters.",
    steps: [
      "Click “Copy invisible character”.",
      "In Discord open User Settings → Profiles and paste it as your display name.",
      "If Discord rejects it, try the next character in the table, e.g. U+2800.",
      "For empty messages or spacing use U+2800 and the repeat builder.",
    ],
    faq: [
      {
        q: "How do I get an invisible name on Discord?",
        a: "Copy the Hangul filler (U+3164) and use it as your display name or server nickname. Normal spaces don't work because Discord trims them, leaving the name empty.",
      },
      {
        q: "Does it work for usernames?",
        a: "No. Usernames (@name) only allow a–z, 0–9, underscore and period. Invisible characters only work in display names, server nicknames and messages.",
      },
      {
        q: "Why doesn't the character work for me anymore?",
        a: "Discord doesn't document which characters are allowed and blocks some from time to time – partly because blank names are used for spam and impersonation. The values in this tool are community experience (October 2026). Try the alternatives.",
      },
      {
        q: "How do I send an empty message?",
        a: "Copy U+2800 (braille blank) and send it on its own. For several blank lines set a count in the builder and enable “own line”.",
      },
      {
        q: "How do I find hidden characters in text?",
        a: "Paste it into “Find hidden characters”. The tool highlights zero-width characters, fillers, direction marks and hidden tag characters and gives you a cleaned copy.",
      },
    ],
    about: [
      "Bots like `\\u200b` (zero width space) for empty embed field names or to show `@everyone` without a ping. The tool runs entirely in your browser – pasted text never leaves your device.",
    ],
  },
};

export default content;
