import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Webhook prüfen, umbenennen oder löschen",
    description:
      "Discord-Webhook-URL testen: Name, Avatar, Kanal und Server anzeigen, Webhook umbenennen, Avatar ändern, Testnachricht senden oder geleakten Webhook löschen.",
    h1: "Webhook-Manager",
    lead: "Füg eine Webhook-URL ein, um zu sehen, wohin sie postet. Du kannst den Webhook umbenennen, ihm ein neues Bild geben, eine Testnachricht schicken oder ihn löschen, wenn die URL in falsche Hände geraten ist.",
    steps: [
      "Kopier in Discord die URL: Server-Einstellungen → Integrationen → Webhooks → Webhook auswählen → „Webhook-URL kopieren“.",
      "Füg sie oben ein und tippe auf „Prüfen“. Du siehst Name, Avatar, Kanal- und Server-ID.",
      "Ändere Name oder Avatar und speichere – oder schick eine kurze Testnachricht.",
      "Ist die URL geleakt, lösch den Webhook. Die URL ist danach sofort wertlos.",
    ],
    faq: [
      {
        q: "Was kann jemand mit meiner Webhook-URL anstellen?",
        a: "Jeder mit der URL kann ohne Login Nachrichten in den Kanal posten, Name und Avatar des Webhooks ändern und ihn sogar löschen. Er kann aber nichts lesen und keine anderen Kanäle sehen. Behandle die URL deshalb wie ein Passwort.",
      },
      {
        q: "Meine Webhook-URL ist geleakt – was tun?",
        a: "Lösch den Webhook sofort, hier oder in Discord unter Integrationen → Webhooks. Danach funktioniert die URL nicht mehr. Leg einen neuen Webhook an und speichere dessen URL nur an sicheren Orten, z. B. als Secret statt im Code.",
      },
      {
        q: "Speichert ihr meine Webhook-URL?",
        a: "Nein. Die URL bleibt nur im Arbeitsspeicher dieses Tabs. Sie landet weder in der Adresszeile noch im Browser-Speicher, und alle Anfragen gehen direkt von deinem Browser an `discord.com`.",
      },
      {
        q: "Warum steht „Webhook existiert nicht“?",
        a: "Discord antwortet mit `404 Unknown Webhook`, wenn der Webhook gelöscht wurde. Verwende die URL dann nicht weiter – Discord sperrt IPs, die viele ungültige Anfragen schicken, vorübergehend.",
      },
      {
        q: "Warum darf mein Webhook nicht „Discord Bot“ heißen?",
        a: "Discord verbietet die Wörter „clyde“ und „discord“ in Webhook-Namen sowie die Namen „everyone“ und „here“. Erlaubt sind 1 bis 80 Zeichen.",
      },
    ],
  },
  en: {
    title: "Discord Webhook Checker – inspect, rename or delete",
    description:
      "Test a Discord webhook URL: see name, avatar, channel and server, rename it, change its avatar, send a test message or delete a leaked webhook.",
    h1: "Webhook manager",
    lead: "Paste a webhook URL to see where it posts. You can rename the webhook, give it a new image, send a test message, or delete it if the URL fell into the wrong hands.",
    steps: [
      "Copy the URL in Discord: Server Settings → Integrations → Webhooks → pick the webhook → “Copy Webhook URL”.",
      "Paste it above and press “Inspect”. You'll see name, avatar, channel and server ID.",
      "Change the name or avatar and save – or send a short test message.",
      "If the URL leaked, delete the webhook. The URL becomes worthless immediately.",
    ],
    faq: [
      {
        q: "What can someone do with my webhook URL?",
        a: "Anyone with the URL can post messages to the channel without logging in, change the webhook's name and avatar, and even delete it. They can't read anything or see other channels. Treat the URL like a password.",
      },
      {
        q: "My webhook URL leaked – what now?",
        a: "Delete the webhook right away, here or in Discord under Integrations → Webhooks. The URL stops working after that. Create a new webhook and keep its URL somewhere safe, e.g. as a secret instead of in code.",
      },
      {
        q: "Do you store my webhook URL?",
        a: "No. The URL only lives in this tab's memory. It never goes into the address bar or browser storage, and every request goes straight from your browser to `discord.com`.",
      },
      {
        q: "Why does it say “webhook doesn't exist”?",
        a: "Discord answers `404 Unknown Webhook` once a webhook is deleted. Stop using the URL then – Discord temporarily blocks IPs that send many invalid requests.",
      },
      {
        q: "Why can't my webhook be called “Discord Bot”?",
        a: "Discord forbids the words “clyde” and “discord” in webhook names, as well as the names “everyone” and “here”. 1 to 80 characters are allowed.",
      },
    ],
  },
};

export default content;
