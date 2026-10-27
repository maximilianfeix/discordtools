import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord farbiger Text – ANSI-Generator mit Vorschau",
    description:
      "Farbig schreiben in Discord: Text markieren, Farbe wählen, fertigen ```ansi-Codeblock kopieren. 8 Text- und 8 Hintergrundfarben, fett, unterstrichen, Live-Vorschau.",
    h1: "Farbiger Text für Discord",
    lead: "Markier Text, klick eine Farbe – fertig. Das Tool baut den `ansi`-Codeblock mit den unsichtbaren Farbcodes, den du direkt in Discord einfügst.",
    steps: [
      "Schreib deinen Text in den Editor oder nimm eine Vorlage (Regenbogen, Warnbox, Status-Liste, Changelog).",
      "Markier ein Wort und wähle Text- oder Hintergrundfarbe, fett oder unterstrichen.",
      "Klick „Für Discord kopieren“.",
      "Füge den Text in Discord ein und sende ihn.",
    ],
    faq: [
      {
        q: "Warum sehe ich die Farben am Handy nicht?",
        a: "Discord zeigt ANSI-Farben nur in der Desktop-App und im Browser. Die Apps für iOS und Android zeigen denselben Text als normalen grauen Codeblock. Daran kann kein Generator etwas ändern.",
      },
      {
        q: "Wie funktioniert farbiger Text in Discord?",
        a: "Über einen Codeblock mit der Sprache `ansi`. Darin schalten Steuercodes wie `ESC[0;31m` die Farbe um. ESC ist ein unsichtbares Zeichen (`\\u001b`), das du nicht tippen kannst – deshalb kopierst du den fertigen Block aus dem Tool.",
      },
      {
        q: "Welche Farben gibt es?",
        a: "8 Textfarben (Grau, Rot, Grün, Gelb, Blau, Pink, Cyan, Weiß, Codes 30–37) und 8 Hintergründe (Codes 40–47), dazu fett (1) und unterstrichen (4). Alles andere ist inoffiziell und kann sich ändern.",
      },
      {
        q: "Warum kommt nach dem Einfügen nur Text mit komischen Zeichen an?",
        a: "Dann ist das ESC-Zeichen verloren gegangen, z. B. weil du den Text aus der sichtbaren Anzeige mit `\\u001b` kopiert hast. Nutze immer den Kopieren-Knopf – er kopiert das echte Zeichen.",
      },
      {
        q: "Zählen die Farbcodes zum Zeichenlimit?",
        a: "Ja. Jeder Farbwechsel kostet etwa 6 bis 10 Zeichen. Das Tool zeigt dir die Länge der fertigen Nachricht im Vergleich zum Limit von 2.000 Zeichen.",
      },
    ],
    about: [
      "Du kannst auch fertigen ANSI-Text aus Discord einfügen: Der Editor erkennt die Farbcodes und du kannst weiter bearbeiten.",
    ],
  },
  en: {
    title: "Discord Colored Text Generator – ANSI with preview",
    description:
      "Write colored text in Discord: select text, pick a color, copy the finished ```ansi code block. 8 text and 8 background colors, bold, underline, live preview.",
    h1: "Discord colored text generator",
    lead: "Select text, click a color – done. The tool builds the `ansi` code block with the invisible color codes that you paste straight into Discord.",
    steps: [
      "Type your text into the editor or start from a template (rainbow, warning box, status list, changelog).",
      "Select a word and choose a text or background color, bold or underline.",
      "Click “Copy for Discord”.",
      "Paste it into Discord and send.",
    ],
    faq: [
      {
        q: "Why can't I see the colors on my phone?",
        a: "Discord only renders ANSI colors in the desktop app and in the browser. The iOS and Android apps show the same text as a plain gray code block. No generator can change that.",
      },
      {
        q: "How does colored text work in Discord?",
        a: "Through a code block with the language `ansi`. Inside it, control codes like `ESC[0;31m` switch the color. ESC is an invisible character (`\\u001b`) you can't type – that's why you copy the finished block from the tool.",
      },
      {
        q: "Which colors are available?",
        a: "8 text colors (gray, red, green, yellow, blue, pink, cyan, white, codes 30–37) and 8 backgrounds (codes 40–47), plus bold (1) and underline (4). Anything else is unofficial and may change.",
      },
      {
        q: "Why does my message show strange characters instead of colors?",
        a: "The ESC character got lost, for example because you copied the visible display with `\\u001b`. Always use the copy button – it copies the real character.",
      },
      {
        q: "Do the color codes count towards the character limit?",
        a: "Yes. Every color change costs about 6 to 10 characters. The tool shows the length of the finished message against the 2,000 character limit.",
      },
    ],
    about: ["You can also paste existing ANSI text from Discord: the editor reads the color codes so you can keep editing."],
  },
};

export default content;
