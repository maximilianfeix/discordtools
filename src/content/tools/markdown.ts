import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Markdown – Text formatieren mit Vorschau",
    description:
      "Discord-Text formatieren: fett, kursiv, Spoiler, Überschriften, kleiner Text (-#), Codeblöcke, Listen und Links – mit Live-Vorschau, Zeichenzähler und Spickzettel.",
    h1: "Discord-Markdown-Editor",
    lead: "Schreib deine Nachricht, markier Text und klick auf Fett, Spoiler oder Überschrift. Die Vorschau zeigt sofort, wie es in Discord aussieht.",
    steps: [
      "Schreib oder füge deinen Text ein.",
      "Markier Text und wähle eine Formatierung in der Leiste – nochmal klicken entfernt sie wieder.",
      "Prüf die Vorschau und den Zeichenzähler (2.000 bzw. 4.000 mit Nitro).",
      "Klick „Nachricht kopieren“ und füge sie in Discord ein.",
    ],
    faq: [
      {
        q: "Wie schreibe ich in Discord fett, kursiv oder durchgestrichen?",
        a: "Fett mit `**Text**`, kursiv mit `*Text*` oder `_Text_`, unterstrichen mit `__Text__`, durchgestrichen mit `~~Text~~`. Die Stile lassen sich kombinieren, z. B. `__**Text**__`.",
      },
      {
        q: "Wie mache ich Text in Discord größer oder kleiner?",
        a: "Größer mit Überschriften: `# `, `## ` oder `### ` am Zeilenanfang. Kleiner, grauer Text mit `-# ` am Zeilenanfang. Nach dem Zeichen muss ein Leerzeichen stehen.",
      },
      {
        q: "Wie funktioniert ein Spoiler?",
        a: "Setz den Text zwischen zwei senkrechte Striche: `||geheim||`. Leser sehen einen grauen Balken und klicken drauf, um den Text zu zeigen.",
      },
      {
        q: "Wie zeige ich Sternchen oder Unterstriche, ohne dass formatiert wird?",
        a: "Setz einen Backslash davor: `\\*`. Der Schalter „Wörtlich (escaped)“ macht das für den ganzen Text auf einmal.",
      },
      {
        q: "Wie füge ich einen Link mit eigenem Text ein?",
        a: "Mit `[Text](https://beispiel.de)`. Steht der Link in spitzen Klammern `<https://…>`, zeigt Discord keine Vorschau-Karte dafür.",
      },
    ],
    about: [
      "Die Vorschau ist eine Annäherung an den Desktop-Client. Erwähnungen und Links bleiben darin inaktiv.",
    ],
  },
  en: {
    title: "Discord Markdown Editor – formatting with live preview",
    description:
      "Format Discord text: bold, italic, spoilers, headings, small text (-#), code blocks, lists and links – with live preview, character counter and cheat sheet.",
    h1: "Discord markdown editor",
    lead: "Write your message, select text and click bold, spoiler or heading. The preview shows right away how it will look in Discord.",
    steps: [
      "Write or paste your text.",
      "Select text and choose a format in the toolbar – click again to remove it.",
      "Check the preview and the character counter (2,000, or 4,000 with Nitro).",
      "Click “Copy message” and paste it into Discord.",
    ],
    faq: [
      {
        q: "How do I write bold, italic or strikethrough in Discord?",
        a: "Bold with `**text**`, italic with `*text*` or `_text_`, underline with `__text__`, strikethrough with `~~text~~`. You can combine them, e.g. `__**text**__`.",
      },
      {
        q: "How do I make text bigger or smaller in Discord?",
        a: "Bigger with headings: `# `, `## ` or `### ` at the start of a line. Small gray text with `-# ` at the start of a line. A space must follow the marker.",
      },
      {
        q: "How do spoilers work?",
        a: "Put the text between two pairs of vertical bars: `||secret||`. Readers see a gray bar and click it to reveal the text.",
      },
      {
        q: "How do I show asterisks or underscores without formatting?",
        a: "Put a backslash in front: `\\*`. The “Literal (escaped)” switch does that for the whole text at once.",
      },
      {
        q: "How do I add a link with custom text?",
        a: "Use `[text](https://example.com)`. A link in angle brackets `<https://…>` gets no preview card.",
      },
    ],
    about: ["The preview approximates the desktop client. Mentions and links stay inactive in it."],
  },
};

export default content;
