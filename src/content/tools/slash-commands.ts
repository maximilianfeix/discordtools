import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Slash-Command-Builder – JSON & discord.js Code",
    description:
      "Discord Slash-Befehle visuell bauen: Optionen, Unterbefehle, Auswahl, Übersetzungen und Rechte. Mit Prüfung nach Discord-Regeln, Vorschau, JSON, discord.js-Code und curl.",
    h1: "Discord Slash-Command-Builder",
    lead: "Baue Slash-Befehle und Kontextmenü-Befehle mit Optionen, Unterbefehlen und Übersetzungen. Der Builder prüft alle Discord-Regeln live und gibt dir JSON, `SlashCommandBuilder`-Code und einen curl-Befehl.",
    steps: [
      "Wähle die Art: Slash-Befehl, Nutzer-Menü oder Nachrichten-Menü. Oder lade ein Beispiel bzw. importiere bestehendes JSON.",
      "Gib Name und Beschreibung ein und füge unter „Übersetzungen“ z. B. Deutsch hinzu.",
      "Füge Optionen hinzu – Text, Zahl, Nutzer, Kanal, Datei … – oder Unterbefehle und Gruppen.",
      "Lege fest, wer den Befehl nutzen darf und wo er erscheint (Server, DMs, Nutzer-Installation).",
      "Behebe alles, was unter „Prüfung“ steht, und kopiere JSON, discord.js-Code oder curl.",
    ],
    faq: [
      {
        q: "Warum wird mein Befehlsname abgelehnt?",
        a: "Slash-Befehle und Optionen brauchen 1–32 Zeichen, kleingeschrieben, ohne Leerzeichen. Erlaubt sind Buchstaben (auch Umlaute), Ziffern, `-` und `_`. Kontextmenü-Befehle dürfen Großbuchstaben und Leerzeichen haben.",
      },
      {
        q: "Wie viele Optionen und Auswahlmöglichkeiten sind erlaubt?",
        a: "Pro Ebene höchstens 25 Optionen und pro Option höchstens 25 feste Auswahlmöglichkeiten. Pflicht-Optionen müssen vor optionalen stehen. Insgesamt dürfen Namen, Beschreibungen und Auswahlwerte eines Befehls 8000 Zeichen nicht überschreiten.",
      },
      {
        q: "Kann ich Unterbefehle und normale Optionen mischen?",
        a: "Nein. Auf der obersten Ebene stehen entweder nur Unterbefehle und Gruppen oder nur normale Optionen. Gruppen enthalten nur Unterbefehle; tiefer verschachteln geht nicht.",
      },
      {
        q: "Wie mache ich einen Befehl nur für Admins?",
        a: "Setze `default_member_permissions` auf `\"0\"` („Nur Admins“) oder auf bestimmte Rechte wie „Mitglieder bannen“. Server-Admins können das später unter Servereinstellungen → Integrationen anpassen.",
      },
      {
        q: "Warum taucht mein globaler Befehl nicht auf?",
        a: "Prüfe `contexts` und `integration_types`: Der Befehl erscheint nur dort, wo beides passt. Zum Testen registrierst du ihn besser als Server-Befehl – der ist sofort da. Pro App sind 100 globale Slash-Befehle und je 15 Nutzer- und Nachrichten-Befehle erlaubt.",
      },
      {
        q: "Muss ich meinen Bot-Token hier eingeben?",
        a: "Nein, niemals. Der Builder erzeugt nur das JSON. Den curl-Befehl führst du selbst aus, mit dem Token in einer Umgebungsvariable.",
      },
    ],
  },
  en: {
    title: "Discord Slash Command Builder – JSON & discord.js code",
    description:
      "Build Discord slash commands visually: options, subcommands, choices, localizations and permissions. Validated against Discord's rules, with preview, JSON, discord.js code and curl.",
    h1: "Discord Slash Command Builder",
    lead: "Build slash commands and context menu commands with options, subcommands and localizations. The builder checks every Discord rule live and gives you JSON, `SlashCommandBuilder` code and a curl command.",
    steps: [
      "Pick the kind: slash command, user menu or message menu. Or load an example or import existing JSON.",
      "Enter name and description and add translations, e.g. German.",
      "Add options – string, number, user, channel, attachment … – or subcommands and groups.",
      "Set who can use the command and where it shows up (servers, DMs, user install).",
      "Fix everything listed under “Validation”, then copy JSON, discord.js code or curl.",
    ],
    faq: [
      {
        q: "Why is my command name rejected?",
        a: "Slash commands and options need 1–32 characters, lowercase, without spaces. Letters (including accented ones), digits, `-` and `_` are allowed. Context menu commands may use uppercase and spaces.",
      },
      {
        q: "How many options and choices are allowed?",
        a: "At most 25 options per level and 25 fixed choices per option. Required options must come before optional ones. In total, a command's names, descriptions and choice values may not exceed 8000 characters.",
      },
      {
        q: "Can I mix subcommands and regular options?",
        a: "No. The top level holds either only subcommands and groups or only regular options. Groups contain only subcommands; deeper nesting isn't possible.",
      },
      {
        q: "How do I make a command admin-only?",
        a: "Set `default_member_permissions` to `\"0\"` (“Admins only”) or to specific permissions like Ban Members. Server admins can adjust it later under Server Settings → Integrations.",
      },
      {
        q: "Why doesn't my global command show up?",
        a: "Check `contexts` and `integration_types`: the command only appears where both match. For testing, register it as a guild command – it shows up instantly. Each app may have 100 global slash commands and 15 user and 15 message commands.",
      },
      {
        q: "Do I need to enter my bot token here?",
        a: "No, never. The builder only creates the JSON. You run the curl command yourself, with the token in an environment variable.",
      },
    ],
  },
};

export default content;
