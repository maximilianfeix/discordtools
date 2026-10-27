import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Ist Discord down? Discord-Status live auf Deutsch",
    description:
      "Discord-Störung aktuell? Live-Status aller Dienste auf Deutsch: API, Gateway, Sprachregionen, Apps – mit aktuellen Störungen, Wartungen und Verlauf.",
    h1: "Discord-Status",
    lead: "Funktioniert Discord gerade nicht? Hier siehst du den offiziellen Status aller Dienste auf Deutsch – mit aktuellen Störungen, geplanten Wartungen und den Updates von Discord. Die Seite aktualisiert sich jede Minute.",
    steps: [
      "Schau oben auf die Gesamtanzeige: Grün heißt, Discord meldet keine Probleme.",
      "Bei einer Störung siehst du, welche Dienste betroffen sind und was Discord zuletzt dazu geschrieben hat.",
      "Unter „Dienste“ findest du jede Komponente einzeln, Sprachregionen klappst du bei „Sprache (Voice)“ auf.",
      "Lass den Tab offen – der Status lädt sich jede Minute neu, solange du ihn siehst.",
    ],
    faq: [
      {
        q: "Ist Discord gerade down?",
        a: "Die Anzeige oben zeigt den offiziellen Stand von discordstatus.com. Steht dort „Alle Systeme laufen“, hat Discord keine Störung gemeldet. Neue Probleme tauchen dort oft erst nach einigen Minuten auf.",
      },
      {
        q: "Discord geht bei mir nicht, aber hier ist alles grün – warum?",
        a: "Dann liegt es oft an deiner Internetverbindung, deinem Router, einem VPN oder dem Discord-Client. Probier Neuladen mit Strg + R, die Web-Version unter discord.com/app oder ein anderes Netz (z. B. mobile Daten). Auch einzelne Sprachregionen können betroffen sein.",
      },
      {
        q: "Was bedeuten API, Gateway und Medien-Proxy?",
        a: "Die API beantwortet Anfragen von Apps und Bots. Das Gateway ist die Echtzeit-Verbindung, über die neue Nachrichten und Online-Status ankommen. Der Medien-Proxy liefert Bilder, Anhänge und Link-Vorschauen aus.",
      },
      {
        q: "Woher kommen die Daten?",
        a: "Direkt von Discords offizieller Statusseite (`discordstatus.com/api/v2/summary.json`). Dein Browser lädt sie selbst – wir speichern nichts und zählen keine Ausfälle selbst.",
      },
      {
        q: "Warum sind die Meldungen auf Englisch?",
        a: "Discord schreibt die Störungsmeldungen nur auf Englisch. Status, Dienstnamen und Regionen übersetzen wir, die Texte der Updates zeigen wir im Original, damit nichts verfälscht wird.",
      },
    ],
  },
  en: {
    title: "Is Discord down? Live Discord status and outages",
    description:
      "Is Discord down right now? Live status of every service: API, gateway, voice regions and apps – with current incidents, scheduled maintenance and updates.",
    h1: "Discord status",
    lead: "Discord not working? See the official status of every service, current incidents, scheduled maintenance and Discord's latest updates in one place. The page refreshes every minute.",
    steps: [
      "Check the overall banner at the top: green means Discord reports no problems.",
      "During an incident you see which services are affected and Discord's latest update.",
      "Under “Services” every component is listed; expand “Voice” for the individual regions.",
      "Keep the tab open – the status reloads every minute while it's visible.",
    ],
    faq: [
      {
        q: "Is Discord down right now?",
        a: "The banner at the top shows the official state from discordstatus.com. If it says “All systems operational”, Discord hasn't reported an outage. New problems often only show up there after a few minutes.",
      },
      {
        q: "Discord doesn't work for me but everything is green – why?",
        a: "Then it's often your internet connection, router, a VPN or the Discord client. Try reloading with Ctrl + R, the web version at discord.com/app, or another network (e.g. mobile data). Single voice regions can be affected too.",
      },
      {
        q: "What do API, gateway and media proxy mean?",
        a: "The API answers requests from apps and bots. The gateway is the real-time connection that delivers new messages and presence. The media proxy serves images, attachments and link previews.",
      },
      {
        q: "Where does the data come from?",
        a: "Straight from Discord's official status page (`discordstatus.com/api/v2/summary.json`). Your browser loads it itself – we store nothing and don't track outages ourselves.",
      },
      {
        q: "How often does it refresh?",
        a: "Every 60 seconds while the tab is visible, and right away when you come back to the tab after a while. You can also press “Refresh” at any time.",
      },
    ],
  },
};

export default content;
