import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Zeichenzähler – Limits für Nachricht, Bio & Embed",
    description:
      "Wie viele Zeichen hat mein Text in Discord? Zählt wie Discord (Emoji zählen doppelt), zeigt Limits für Nachricht (2.000/4.000), Bio, Status, Embeds und teilt lange Texte.",
    h1: "Discord-Zeichenzähler",
    lead: "Füge deinen Text ein und sieh sofort, ob er in eine Nachricht, deine Bio, den Status oder ein Embed passt. Zu lang? Dann teil ihn in sendbare Stücke.",
    steps: [
      "Füge deinen Text ein oder schreib ihn direkt ins Feld.",
      "Lies ab, wie viele Zeichen Discord zählt und wie viel bei jedem Limit noch frei ist.",
      "Ist der Text zu lang, wähle 2.000 oder 4.000 Zeichen pro Teil.",
      "Kopier die Teile nacheinander und sende sie.",
    ],
    faq: [
      {
        q: "Wie viele Zeichen darf eine Discord-Nachricht haben?",
        a: "2.000 Zeichen. Mit Nitro sind es 4.000. Embeds haben eigene Limits, z. B. 4.096 Zeichen für die Beschreibung und 6.000 für alle Embeds einer Nachricht zusammen.",
      },
      {
        q: "Warum zählen Emoji doppelt?",
        a: "Discord zählt UTF-16-Einheiten, so wie JavaScript. Die meisten Emoji brauchen 2 davon, Emoji mit Hautfarbe 4, Flaggen 4 und Familien-Emoji bis zu 11. Der Zähler zeigt dir, wie viel die Emoji extra kosten.",
      },
      {
        q: "Wie lang darf meine Bio und mein Status sein?",
        a: "„Über mich“ hat 190 Zeichen, der benutzerdefinierte Status 128. Diese Limits stehen nicht in der Entwickler-Doku, sie werden von der App vorgegeben.",
      },
      {
        q: "Wie lang dürfen Nickname, Servername und Rollenname sein?",
        a: "Nickname und Benutzername: 32 Zeichen. Servername und Rollenname: 100 Zeichen. Kanalthema: 1.024 Zeichen.",
      },
      {
        q: "Wie teile ich eine zu lange Nachricht auf?",
        a: "Der Bereich „Nachricht aufteilen“ trennt den Text an Absätzen und Wortgrenzen. Codeblöcke werden am Ende eines Teils geschlossen und im nächsten wieder geöffnet, damit die Formatierung erhalten bleibt.",
      },
    ],
    about: [
      "Eigene Server-Emoji zählen mit ihrer kompletten Syntax `<:name:id>`. Unsichtbare Zeichen wie Zero-Width Spaces zählen ebenfalls – das Tool weist dich darauf hin.",
    ],
  },
  en: {
    title: "Discord Character Counter – message, bio & embed limits",
    description:
      "How many characters is my text in Discord? Counts like Discord (emoji count double), shows limits for messages (2,000/4,000), bio, status and embeds, and splits long text.",
    h1: "Discord character counter",
    lead: "Paste your text and see instantly whether it fits in a message, your bio, your status or an embed. Too long? Split it into sendable chunks.",
    steps: [
      "Paste your text or type it into the box.",
      "Read how many characters Discord counts and how much room each limit has left.",
      "If it's too long, choose 2,000 or 4,000 characters per chunk.",
      "Copy the chunks one by one and send them.",
    ],
    faq: [
      {
        q: "How many characters can a Discord message have?",
        a: "2,000 characters, or 4,000 with Nitro. Embeds have their own limits, e.g. 4,096 for the description and 6,000 for all embeds in a message combined.",
      },
      {
        q: "Why do emoji count double?",
        a: "Discord counts UTF-16 units, like JavaScript. Most emoji take 2, emoji with a skin tone 4, flags 4 and family emoji up to 11. The counter shows how much the emoji cost extra.",
      },
      {
        q: "How long can my bio and status be?",
        a: "“About me” allows 190 characters and the custom status 128. These limits aren't in the developer docs; the app enforces them.",
      },
      {
        q: "How long can nicknames, server names and role names be?",
        a: "Nickname and username: 32 characters. Server name and role name: 100 characters. Channel topic: 1,024 characters.",
      },
      {
        q: "How do I split a message that's too long?",
        a: "The “Split message” section breaks the text at paragraphs and word boundaries. Code blocks are closed at the end of one chunk and reopened in the next, so the formatting survives.",
      },
    ],
    about: [
      "Custom server emoji count with their full `<:name:id>` syntax. Invisible characters like zero-width spaces count too – the tool points them out.",
    ],
  },
};

export default content;
