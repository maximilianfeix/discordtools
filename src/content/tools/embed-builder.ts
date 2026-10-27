import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Embed Generator – Embeds erstellen & per Webhook senden",
    description:
      "Discord-Embeds kostenlos erstellen: Live-Vorschau, alle Limits geprüft, JSON-Import und -Export. Per Webhook senden, in Threads und Forenposts – auch nachträglich bearbeiten.",
    h1: "Discord Embed Generator",
    lead:
      "Bau Nachrichten mit bis zu 10 Embeds, sieh sofort, wie sie in Discord aussehen, und schick sie direkt per Webhook – ohne Bot, ohne Anmeldung.",
    steps: [
      "Lade eine Vorlage (Ankündigung, Regeln, Willkommen, Changelog) oder fang leer an.",
      "Fülle Inhalt und Embeds aus: Farbe, Autor, Titel, Beschreibung, Felder, Bilder, Footer und Zeitstempel. Die Vorschau aktualisiert sich live.",
      "Achte auf die Prüfung oben: Sie zeigt jedes überschrittene Limit und springt per Klick direkt zum Feld.",
      "Füge die Webhook-URL ein, wähle Kanal, Thread oder neuen Forumpost und klick auf „Senden“.",
      "Später ändern? Lade die Nachricht per Link und klick auf „Nachricht aktualisieren“ – oder teile den Entwurf als Link.",
    ],
    faq: [
      {
        q: "Wie erstelle ich einen Webhook in Discord?",
        a: "Öffne die Kanaleinstellungen → Integrationen → Webhooks → „Neuer Webhook“. Gib ihm einen Namen und klick auf „Webhook-URL kopieren“. Dafür brauchst du die Berechtigung „Webhooks verwalten“. Behandle die URL wie ein Passwort: Wer sie hat, kann in den Kanal posten.",
      },
      {
        q: "Warum wird mein Embed nicht angezeigt?",
        a: "Häufige Gründe: In den Discord-Einstellungen ist „Link-Vorschauen anzeigen“ (Chat → Embeds und Link-Vorschauen) ausgeschaltet, die Nachricht wurde mit „Embeds unterdrücken“ (Flag `4`) gesendet, oder das Embed war leer. Bilder erscheinen nur bei direkt erreichbaren `https://`-Links auf eine Bilddatei.",
      },
      {
        q: "Welche Limits gelten für Discord-Embeds?",
        a: "Inhalt max. 2000 Zeichen, bis zu 10 Embeds pro Nachricht. Pro Embed: Titel 256, Beschreibung 4096, bis zu 25 Felder (Name 256, Wert 1024), Footer 2048, Autor 256 Zeichen. Alle Embeds zusammen dürfen 6000 Zeichen nicht überschreiten – sonst lehnt Discord die Nachricht ab.",
      },
      {
        q: "Kann ich eine gesendete Webhook-Nachricht bearbeiten?",
        a: "Ja, solange sie von genau diesem Webhook stammt. Füge die Webhook-URL ein, öffne „Vorhandene Nachricht laden“ und gib den Nachrichtenlink ein (Rechtsklick → „Nachrichtenlink kopieren“). Nach dem Ändern klickst du auf „Nachricht aktualisieren“. Name und Avatar lassen sich nachträglich nicht ändern.",
      },
      {
        q: "Wie poste ich per Webhook in ein Forum oder einen Thread?",
        a: "Für einen neuen Forumpost wählst du als Ziel „Neuer Forumpost“ und gibst einen Titel ein – das wird als `thread_name` gesendet. In einen bestehenden Thread postest du mit „Thread“ und dessen ID (`thread_id`). Bei Forum- und Medienkanälen ist eins von beiden Pflicht.",
      },
      {
        q: "Ist meine Webhook-URL hier sicher?",
        a: "Die URL bleibt nur im Arbeitsspeicher deines Browsers und geht direkt an `discord.com` – nie an unseren Server, nie in den geteilten Link und nie in den gespeicherten Entwurf. Standardmäßig sendet der Builder `allowed_mentions: { parse: [] }`, damit nicht versehentlich @everyone gepingt wird.",
      },
    ],
  },
  en: {
    title: "Discord Embed Builder – create embeds & send via webhook",
    description:
      "Build Discord embeds for free: live preview, every limit checked, JSON import and export. Send via webhook into channels, threads and forum posts – and edit them later.",
    h1: "Discord Embed Builder",
    lead:
      "Build messages with up to 10 embeds, see right away how they look in Discord and send them straight through a webhook – no bot, no sign-up.",
    steps: [
      "Load a template (announcement, rules, welcome, changelog) or start blank.",
      "Fill in content and embeds: color, author, title, description, fields, images, footer and timestamp. The preview updates live.",
      "Watch the check at the top: it lists every exceeded limit and jumps to the field when you click it.",
      "Paste your webhook URL, pick channel, thread or new forum post and hit “Send”.",
      "Need changes later? Load the message by its link and click “Update message” – or share the draft as a link.",
    ],
    faq: [
      {
        q: "How do I create a webhook in Discord?",
        a: "Open the channel settings → Integrations → Webhooks → “New Webhook”. Give it a name and click “Copy Webhook URL”. You need the “Manage Webhooks” permission. Treat the URL like a password: anyone who has it can post in that channel.",
      },
      {
        q: "Why doesn't my embed show up?",
        a: "Common reasons: “Show embeds and preview website links” is turned off in Discord's settings (Chat), the message was sent with “Suppress embeds” (flag `4`), or the embed was empty. Images only show for directly reachable `https://` links to an image file.",
      },
      {
        q: "What are the limits for Discord embeds?",
        a: "Content up to 2000 characters, up to 10 embeds per message. Per embed: title 256, description 4096, up to 25 fields (name 256, value 1024), footer 2048, author 256 characters. All embeds together must stay within 6000 characters, or Discord rejects the message.",
      },
      {
        q: "Can I edit a webhook message after sending it?",
        a: "Yes, as long as it was sent by that exact webhook. Paste the webhook URL, open “Load existing message” and enter the message link (right-click → “Copy Message Link”). After your changes, click “Update message”. Name and avatar can't be changed afterwards.",
      },
      {
        q: "How do I post into a forum or a thread with a webhook?",
        a: "For a new forum post, pick “New forum post” as the target and enter a title – it is sent as `thread_name`. To post into an existing thread, pick “Thread” and enter its ID (`thread_id`). Forum and media channels require one of the two.",
      },
      {
        q: "Is my webhook URL safe here?",
        a: "The URL only stays in your browser's memory and goes straight to `discord.com` – never to our server, never into the share link and never into the saved draft. By default the builder sends `allowed_mentions: { parse: [] }` so nobody gets pinged by accident.",
      },
    ],
  },
};

export default content;
