import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Rollenfarben – Vorschau, Verlauf & Kontrast-Check",
    description:
      "Discord-Rollenfarbe testen: Vorschau in Dark, Ash, Onyx und Light, Verlauf und Holografisch, Kontrast nach WCAG mit Auto-Korrektur, Hex und Dezimal, fertige Farb-Sets.",
    h1: "Discord-Rollenfarben-Vorschau",
    lead: "Sieh sofort, wie deine Rollenfarbe in allen vier Discord-Themes wirkt – mit Kontrastwert und einem Vorschlag, wenn der Name schlecht lesbar ist.",
    steps: [
      "Wähl Einfarbig, Verlauf oder Holografisch und stell die Farbe ein – per Farbwähler, Hex oder Dezimalzahl.",
      "Prüf die vier Vorschauen: Name, Erwähnung und Mitgliederliste.",
      "Ist ein Theme rot markiert, klick auf „Anpassen“ – das Tool ändert nur die Helligkeit.",
      "Kopier Hex oder Dezimal und trag die Farbe in Servereinstellungen → Rollen ein.",
    ],
    faq: [
      {
        q: "Wie bekomme ich einen Farbverlauf für meine Rolle?",
        a: "Verläufe und der holografische Stil heißen „Enhanced Role Styles“. Der Server braucht dafür 3 Server-Boosts, unabhängig vom Boost-Level. Danach wählst du am Desktop unter Rollen → Rollenstil „Verlauf“ und zwei Farben.",
      },
      {
        q: "Kann ich die holografischen Farben ändern?",
        a: "Nein. Holografisch nutzt feste Farben, die Discord vorgibt. Über die API wird jede Rolle mit drittem Farbwert automatisch auf diese Werte gesetzt.",
      },
      {
        q: "Warum ist meine Rollenfarbe schlecht lesbar?",
        a: "Dunkle Farben verschwinden auf den dunklen Themes, helle (Gelb, Pastell) auf Light. Ein Kontrast von 4,5:1 gilt als gut lesbar, 3:1 als Minimum. Das Tool berechnet das für jedes Theme.",
      },
      {
        q: "Was ist die Dezimalzahl?",
        a: "Bots und die Discord-API speichern Farben als Ganzzahl. Aus #3498DB wird 3447003. In der Discord-App selbst gibst du die Hex-Farbe ein.",
      },
      {
        q: "Sehen alle meine Verlaufsrolle?",
        a: "Ja, auch am Handy. Wer eine veraltete App nutzt, sieht nur die erste Farbe. Fällt der Server unter 3 freie Boosts, werden Verläufe wieder einfarbig in der ersten Farbe.",
      },
    ],
    about: [
      "Die Hintergründe der Vorschau stammen aus dem aktuellen Discord-Client: Dark `#1A1A1E`, Ash `#323339`, Onyx `#000000` und Light `#FBFBFB`.",
    ],
  },
  en: {
    title: "Discord Role Colors – preview, gradients & contrast check",
    description:
      "Test a Discord role color: preview in Dark, Ash, Onyx and Light, gradient and holographic styles, WCAG contrast with auto-fix, hex and decimal, ready-made color sets.",
    h1: "Discord role color preview",
    lead: "See instantly how your role color looks in all four Discord themes – with a contrast score and a suggestion when the name is hard to read.",
    steps: [
      "Choose solid, gradient or holographic and set the color – via picker, hex or decimal.",
      "Check the four previews: name, mention and member list.",
      "If a theme is marked red, click “Adjust” – the tool only changes the lightness.",
      "Copy hex or decimal and enter the color in Server Settings → Roles.",
    ],
    faq: [
      {
        q: "How do I get a gradient role color?",
        a: "Gradients and the holographic style are “Enhanced Role Styles”. The server needs 3 Server Boosts, independent of the boost level. Then pick “Gradient” and two colors under Roles → Role Style on desktop.",
      },
      {
        q: "Can I change the holographic colors?",
        a: "No. Holographic uses fixed colors set by Discord. Via the API, any role with a tertiary color is forced to these values.",
      },
      {
        q: "Why is my role color hard to read?",
        a: "Dark colors disappear on dark themes, bright ones (yellow, pastels) on Light. A contrast of 4.5:1 counts as easy to read, 3:1 as the minimum. The tool calculates it for every theme.",
      },
      {
        q: "What is the decimal number?",
        a: "Bots and the Discord API store colors as integers. #3498DB becomes 3447003. In the Discord app itself you enter the hex color.",
      },
      {
        q: "Can everyone see my gradient role?",
        a: "Yes, on mobile too. People on an outdated app only see the first color. If the server drops below 3 available boosts, gradients revert to a solid first color.",
      },
    ],
    about: [
      "The preview backgrounds come from the current Discord client: Dark `#1A1A1E`, Ash `#323339`, Onyx `#000000` and Light `#FBFBFB`.",
    ],
  },
};

export default content;
