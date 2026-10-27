import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Embed-Farbe umrechnen – Hex in Dezimal",
    description:
      "Embed-Farben für Discord umrechnen: Hex, Dezimal, RGB und HSL in beide Richtungen, mit Farbwähler, Palette, Vorschau in allen vier Themes und Kontrastcheck.",
    h1: "Embed-Farben",
    lead: "Discord will Embed-Farben als Dezimalzahl, Designer liefern Hex. Füg eine Farbe in beliebiger Schreibweise ein und kopier den passenden Wert – mit Vorschau in Dark, Ash, Onyx und Light.",
    steps: [
      "Gib eine Farbe ein – #5865F2, 0x5865F2, 5793266 oder rgb(88, 101, 242) – oder nimm den Farbwähler.",
      "Kopier den Dezimalwert für JSON und Webhooks (\"color\": 5793266) oder den Code für discord.js bzw. discord.py.",
      "Prüf in der Vorschau, wie Embed-Rand und Rollenname in allen vier Discord-Themes aussehen.",
      "Achte beim Kontrast auf grüne Werte, wenn du die Farbe als Rollenfarbe nutzt.",
    ],
    faq: [
      {
        q: "Warum will Discord die Farbe als Zahl?",
        a: "Im JSON von Webhooks und der API ist `color` eine ganze Zahl: der Hex-Wert als Dezimalzahl. `#5865F2` wird zu `5793266`. Bibliotheken wie discord.js oder discord.py nehmen auch `0x5865F2` im Code an – im reinen JSON geht nur die Dezimalzahl.",
      },
      {
        q: "Wie rechne ich Hex in Dezimal um?",
        a: "Lies den Hex-Wert ohne `#` als Zahl zur Basis 16: `parseInt(\"5865F2\", 16)` ergibt `5793266`. Dieses Tool macht das in beide Richtungen und versteht auch RGB und HSL.",
      },
      {
        q: "Warum sehe ich meine Embed-Farbe nicht?",
        a: "Prüf, ob du die Dezimalzahl (nicht den Hex-String) gesendet hast – `\"color\": \"#ff0000\"` lehnt Discord ab. Sehr dunkle Farben verschwinden außerdem fast im Dark- und Onyx-Theme; die Vorschau zeigt das.",
      },
      {
        q: "Wie bekomme ich eine schwarze Rollenfarbe?",
        a: "Die Farbe `0` bedeutet bei Rollen „keine Farbe“, dann zeigt Discord die Standardfarbe. Nimm stattdessen `#010101` (Dezimal `65793`) – sieht schwarz aus, zählt aber als Farbe.",
      },
      {
        q: "Was bedeutet der Kontrastwert?",
        a: "Das ist das WCAG-Kontrastverhältnis zwischen Farbe und Chat-Hintergrund. Ab 4,5 : 1 ist Text gut lesbar, ab 3 : 1 reicht es für fette Namen. Darunter tun sich viele Mitglieder schwer, besonders am Handy.",
      },
    ],
  },
  en: {
    title: "Discord Embed Color Converter – hex to decimal",
    description:
      "Convert Discord embed colors: hex, decimal, RGB and HSL both ways, with color picker, palette, a preview in all four themes and a contrast check.",
    h1: "Embed colors",
    lead: "Discord wants embed colors as a decimal number, designers hand you hex. Paste a color in any notation and copy the value you need – with a preview in Dark, Ash, Onyx and Light.",
    steps: [
      "Enter a color – #5865F2, 0x5865F2, 5793266 or rgb(88, 101, 242) – or use the color picker.",
      "Copy the decimal value for JSON and webhooks (\"color\": 5793266) or the code for discord.js or discord.py.",
      "Check in the preview how the embed border and role name look in all four Discord themes.",
      "If you use it as a role color, aim for green contrast values.",
    ],
    faq: [
      {
        q: "Why does Discord want the color as a number?",
        a: "In webhook and API JSON, `color` is an integer: the hex value as a decimal number. `#5865F2` becomes `5793266`. Libraries like discord.js or discord.py also accept `0x5865F2` in code – plain JSON only takes the decimal.",
      },
      {
        q: "How do I convert hex to decimal?",
        a: "Read the hex value without `#` as a base-16 number: `parseInt(\"5865F2\", 16)` gives `5793266`. This tool does it both ways and understands RGB and HSL too.",
      },
      {
        q: "Why can't I see my embed color?",
        a: "Check that you sent the decimal number, not the hex string – Discord rejects `\"color\": \"#ff0000\"`. Very dark colors also nearly vanish in the Dark and Onyx themes; the preview shows this.",
      },
      {
        q: "How do I get a black role color?",
        a: "For roles, color `0` means “no color” and Discord shows the default. Use `#010101` (decimal `65793`) instead – it looks black but counts as a color.",
      },
      {
        q: "What does the contrast value mean?",
        a: "It's the WCAG contrast ratio between the color and the chat background. 4.5 : 1 or more reads well, 3 : 1 is enough for bold names. Below that, many members struggle, especially on phones.",
      },
    ],
  },
};

export default content;
