import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Server-Widget prüfen und einbinden",
    description:
      "Discord-Server-Widget per Server-ID abrufen: Online-Zahl, Sprachkanäle, Mitglieder und Einladung. Mit iframe-Code und widget.png-Bannern zum Kopieren.",
    h1: "Server-Widget",
    lead: "Gib eine Server-ID ein und sieh, was das öffentliche Widget des Servers verrät: Online-Zahl, Sprachkanäle und wer gerade online ist. Dazu bekommst du den Einbettungscode für deine Website.",
    steps: [
      "Kopier die Server-ID: Rechtsklick auf den Servernamen → „Server-ID kopieren“ (Entwicklermodus muss an sein).",
      "Füg sie oben ein und tippe auf „Laden“.",
      "Ist das Widget aus, zeigt das Tool, wo du es in den Server-Einstellungen einschaltest.",
      "Kopier unten den iframe-Code oder ein widget.png-Banner für Website, Forum oder GitHub-README.",
    ],
    faq: [
      {
        q: "Warum steht „Widget ist ausgeschaltet“?",
        a: "Discord liefert die Daten nur, wenn der Server sein Widget aktiviert hat (Antwort `403`, Code `50004`). Wer „Server verwalten“ darf, schaltet es unter Server-Einstellungen → Widget → „Server-Widget aktivieren“ ein.",
      },
      {
        q: "Warum sehe ich höchstens 100 Mitglieder und komische Namen?",
        a: "Das Widget zeigt nur bis zu 100 Online-Mitglieder und anonymisiert sie: Die IDs sind laufende Nummern, die Avatare kommen über einen anonymen Proxy. Echte Nutzer-IDs gibt das Widget nicht heraus.",
      },
      {
        q: "Warum fehlt die Einladung?",
        a: "Ein Einladungslink erscheint nur, wenn im Widget ein Einladungskanal gewählt ist. Sonst ist `instant_invite` leer.",
      },
      {
        q: "Welche Banner-Stile gibt es?",
        a: "Discord rendert `widget.png` in fünf Stilen: `shield` (klein wie ein Badge) sowie `banner1` bis `banner4`. Alle zeigen Servername und Online-Zahl und funktionieren nur bei aktivem Widget.",
      },
      {
        q: "Wie aktuell sind die Zahlen?",
        a: "Discord cached die Widget-Daten bis zu 5 Minuten. Nach dem Einschalten des Widgets kann es also kurz dauern, bis die Daten erscheinen.",
      },
    ],
  },
  en: {
    title: "Discord Server Widget Checker and Embed Code",
    description:
      "Fetch a Discord server widget by server ID: online count, voice channels, members and invite. Plus iframe code and widget.png banners to copy.",
    h1: "Server widget",
    lead: "Enter a server ID and see what its public widget reveals: online count, voice channels and who's online. You also get the embed code for your website.",
    steps: [
      "Copy the server ID: right-click the server name → “Copy Server ID” (Developer Mode must be on).",
      "Paste it above and press “Load”.",
      "If the widget is off, the tool shows where to enable it in Server Settings.",
      "Copy the iframe code or a widget.png banner below for your website, forum or GitHub README.",
    ],
    faq: [
      {
        q: "Why does it say “widget is turned off”?",
        a: "Discord only returns the data when the server enabled its widget (response `403`, code `50004`). Anyone with “Manage Server” can turn it on under Server Settings → Widget → “Enable Server Widget”.",
      },
      {
        q: "Why do I see at most 100 members with odd names?",
        a: "The widget lists up to 100 online members and anonymizes them: IDs are just sequence numbers and avatars go through an anonymous proxy. The widget never exposes real user IDs.",
      },
      {
        q: "Why is the invite missing?",
        a: "An invite link only appears if an invite channel is selected in the widget settings. Otherwise `instant_invite` is empty.",
      },
      {
        q: "Which banner styles are there?",
        a: "Discord renders `widget.png` in five styles: `shield` (small, badge-like) and `banner1` to `banner4`. All show the server name and online count and only work while the widget is enabled.",
      },
      {
        q: "How fresh are the numbers?",
        a: "Discord caches widget data for up to 5 minutes. After turning the widget on, it can take a moment before data shows up.",
      },
    ],
  },
};

export default content;
