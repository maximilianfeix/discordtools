import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Intents-Rechner – Gateway Intents mit Code",
    description:
      "Discord Gateway Intents auswählen, Wert berechnen und entschlüsseln. Mit Events pro Intent, privilegierten Intents und fertigem Code für discord.js und discord.py.",
    h1: "Discord Intents-Rechner",
    lead: "Wähle, welche Gateway-Events dein Bot bekommen soll. Du siehst den Intents-Wert, welche Events jeder Intent freischaltet und fertigen Code für discord.js und discord.py.",
    steps: [
      "Starte mit einer Vorlage, z. B. „Nur Slash-Befehle“ oder „Präfix-Befehle“.",
      "Hake weitere Intents an. Die Suche findet auch Event-Namen wie MESSAGE_CREATE oder GUILD_MEMBER_ADD.",
      "Prüfe die Hinweise: Privilegierte Intents musst du im Developer Portal einschalten.",
      "Kopiere den Code für deine Bibliothek oder den Zahlenwert für das IDENTIFY-Paket.",
    ],
    faq: [
      {
        q: "Welche Intents sind privilegiert?",
        a: "Drei: `GUILD_MEMBERS` (Bit 1), `GUILD_PRESENCES` (Bit 8) und `MESSAGE_CONTENT` (Bit 15). Du musst sie im Developer Portal unter „Bot → Privileged Gateway Intents“ einschalten, sonst trennt Discord die Verbindung mit Code 4014.",
      },
      {
        q: "Ab wann muss ich privilegierte Intents beantragen?",
        a: "Seit dem 10. Juni 2026 zählt die Zahl der Nutzer, die deine App über alle Server erreicht: Unter 10.000 reicht der Schalter im Portal. Darüber musst du den Zugriff beantragen und jährlich erneuern. Die frühere Grenze von 100 Servern gilt nicht mehr.",
      },
      {
        q: "Warum ist message.content bei meinem Bot leer?",
        a: "Ohne den Intent `MESSAGE_CONTENT` sind `content`, `embeds`, `attachments`, `components` und `poll` leer – außer in DMs, wenn der Bot erwähnt wird, und bei seinen eigenen Nachrichten. Für Slash-Befehle brauchst du den Intent nicht.",
      },
      {
        q: "Brauche ich Intents für Slash-Befehle?",
        a: "Kaum. `INTERACTION_CREATE` kommt immer an. Meist reicht `GUILDS`, damit der Bot Server und Kanäle im Cache hat. Bots, die nur HTTP-Interaktionen nutzen, brauchen gar keine Gateway-Verbindung.",
      },
      {
        q: "Was bedeutet Fehler 4013?",
        a: "„Invalid intents“: Der Wert enthält Bits, die keinem Intent entsprechen. Der Rechner zeigt solche Bits als „unbekannt“ an.",
      },
    ],
  },
  en: {
    title: "Discord Intents Calculator – gateway intents with code",
    description:
      "Pick Discord gateway intents, calculate and decode the value. Shows the events per intent, privileged intents, and ready-made code for discord.js and discord.py.",
    h1: "Discord Intents Calculator",
    lead: "Choose which gateway events your bot should receive. You get the intents value, the events each intent unlocks, and ready-made code for discord.js and discord.py.",
    steps: [
      "Start with a preset, e.g. “Slash commands only” or “Prefix commands”.",
      "Tick more intents. Search also finds event names like MESSAGE_CREATE or GUILD_MEMBER_ADD.",
      "Check the notes: privileged intents must be enabled in the Developer Portal.",
      "Copy the code for your library or the number for the IDENTIFY payload.",
    ],
    faq: [
      {
        q: "Which intents are privileged?",
        a: "Three: `GUILD_MEMBERS` (bit 1), `GUILD_PRESENCES` (bit 8) and `MESSAGE_CONTENT` (bit 15). Enable them in the Developer Portal under “Bot → Privileged Gateway Intents”, otherwise Discord closes the connection with code 4014.",
      },
      {
        q: "When do I have to apply for privileged intents?",
        a: "Since June 10, 2026 the number of users your app reaches across all servers counts: under 10,000 the toggle in the portal is enough. Above that you have to apply for access and reapply every year. The old 100-server limit no longer applies.",
      },
      {
        q: "Why is message.content empty for my bot?",
        a: "Without the `MESSAGE_CONTENT` intent, `content`, `embeds`, `attachments`, `components` and `poll` are empty – except in DMs, when the bot is mentioned, and for its own messages. Slash commands don't need the intent.",
      },
      {
        q: "Do I need intents for slash commands?",
        a: "Barely. `INTERACTION_CREATE` is always sent. Usually `GUILDS` is enough so the bot has servers and channels in its cache. Bots that only use HTTP interactions need no gateway connection at all.",
      },
      {
        q: "What does error 4013 mean?",
        a: "“Invalid intents”: the value contains bits that belong to no intent. The calculator shows such bits as “unknown”.",
      },
    ],
  },
};

export default content;
