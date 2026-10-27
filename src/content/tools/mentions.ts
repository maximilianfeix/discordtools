import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Erwähnungen & Syntax – Nutzer, Rollen, Befehle",
    description:
      "Discord-Syntax bauen: <@ID>, <@&ID>, <#ID>, Slash-Befehl-Erwähnung </befehl:ID>, eigene Emojis, Nachrichtenlinks und <id:customize>. Plus Decoder für eingefügten Text.",
    h1: "Discord-Erwähnungen und Syntax",
    lead: "Bau die Syntax für Nutzer, Rollen, Kanäle, Slash-Befehle, Emojis und Nachrichtenlinks aus IDs – oder füge eine Nachricht ein und lass dir jede Erwähnung erklären.",
    steps: [
      "Schalte in Discord unter Einstellungen → Erweitert den Entwicklermodus ein.",
      "Rechtsklick auf Nutzer, Rolle, Kanal oder Nachricht → „ID kopieren“.",
      "Füge die ID im passenden Baustein ein – auch eine ganze Erwähnung oder ein Link funktioniert.",
      "Kopiere die fertige Syntax in deine Nachricht, dein Embed oder deinen Bot-Code.",
    ],
    faq: [
      {
        q: "Wie erwähne ich einen Slash-Befehl, sodass man ihn anklicken kann?",
        a: "Mit `</name:BEFEHLS-ID>`, bei Unterbefehlen `</name unterbefehl:ID>` und mit Gruppe `</name gruppe unterbefehl:ID>`. Die ID findest du in den Servereinstellungen unter Integrationen.",
      },
      {
        q: "Wie sieht die Syntax für Nutzer, Rollen und Kanäle aus?",
        a: "Nutzer: `<@ID>`, Rolle: `<@&ID>`, Kanal: `<#ID>`. Die alte Form `<@!ID>` für Nutzer funktioniert noch, wird aber nicht mehr gebraucht.",
      },
      {
        q: "Wie verwende ich eigene Emojis in Bots und Webhooks?",
        a: "Mit `<:name:ID>`, animierte mit `<a:name:ID>`. Die fertige Syntax siehst du, wenn du in Discord `\\:emoji:` schreibst und sendest.",
      },
      {
        q: "Brauche ich für @everyone eine besondere Syntax?",
        a: "Nein, `@everyone` und `@here` sind normaler Text. Ob wirklich jemand gepingt wird, hängt von der Berechtigung des Absenders ab – bei Webhooks und Bots von `allowed_mentions`.",
      },
      {
        q: "Was bedeutet <id:customize>?",
        a: "Das ist ein Link zu einem Bereich des Servers: `<id:customize>` öffnet „Kanäle & Rollen“, `<id:browse>` „Kanäle durchsuchen“, `<id:guide>` den Server-Leitfaden und `<id:linked-roles>` die verknüpften Rollen.",
      },
    ],
    about: [
      "Der Decoder findet in eingefügtem Text alle Erwähnungen, Emojis, Zeitstempel, Befehle und Nachrichtenlinks und zeigt, wann jede ID erstellt wurde. Was eine ID bezeichnet, steht nicht in ihr – nur ihr Erstellungszeitpunkt.",
    ],
  },
  en: {
    title: "Discord Mentions & Syntax – users, roles, commands",
    description:
      "Build Discord syntax: <@ID>, <@&ID>, <#ID>, slash command mentions </command:ID>, custom emoji, message links and <id:customize>. Plus a decoder for pasted text.",
    h1: "Discord mentions and syntax",
    lead: "Build the syntax for users, roles, channels, slash commands, emoji and message links from IDs – or paste a message and get every mention explained.",
    steps: [
      "Turn on Developer Mode in Discord under Settings → Advanced.",
      "Right-click a user, role, channel or message → “Copy ID”.",
      "Paste the ID into the matching builder – a full mention or link works too.",
      "Copy the finished syntax into your message, embed or bot code.",
    ],
    faq: [
      {
        q: "How do I mention a slash command so it's clickable?",
        a: "With `</name:COMMAND_ID>`, for subcommands `</name sub:ID>` and with a group `</name group sub:ID>`. You find the ID in Server Settings under Integrations.",
      },
      {
        q: "What is the syntax for users, roles and channels?",
        a: "User: `<@ID>`, role: `<@&ID>`, channel: `<#ID>`. The old user form `<@!ID>` still works but isn't needed any more.",
      },
      {
        q: "How do I use custom emoji in bots and webhooks?",
        a: "With `<:name:ID>`, animated ones with `<a:name:ID>`. You see the finished syntax if you type `\\:emoji:` in Discord and send it.",
      },
      {
        q: "Do I need special syntax for @everyone?",
        a: "No, `@everyone` and `@here` are plain text. Whether anyone actually gets pinged depends on the sender's permission – for webhooks and bots on `allowed_mentions`.",
      },
      {
        q: "What does <id:customize> mean?",
        a: "It links to part of the server: `<id:customize>` opens Channels & Roles, `<id:browse>` Browse Channels, `<id:guide>` the Server Guide and `<id:linked-roles>` Linked Roles.",
      },
    ],
    about: [
      "The decoder finds every mention, emoji, timestamp, command and message link in pasted text and shows when each ID was created. An ID doesn't say what it belongs to – only when it was made.",
    ],
  },
};

export default content;
