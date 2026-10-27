import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Einladung prüfen – Server hinter dem Link sehen",
    description:
      "Discord-Einladungslink prüfen, ohne beizutreten: Servername, Icon, Banner, Mitglieder- und Online-Zahl, Boost-Level, Verifizierung und Ablaufdatum.",
    h1: "Einladungs-Lookup",
    lead: "Füg einen Einladungslink ein und sieh, zu welchem Server er führt – mit Mitgliederzahl, Boost-Level, Verifizierungsstufe und Ablaufdatum. Du trittst dabei nicht bei.",
    steps: [
      "Kopier den Einladungslink, z. B. discord.gg/abc123 oder discord.com/invite/abc123.",
      "Füg ihn oben ein und tippe auf „Prüfen“ – der reine Code reicht auch.",
      "Sieh dir Server, Mitglieder, Kanal und Ablaufdatum an.",
      "Über „Server-ID kopieren“ oder den Link zum Snowflake-Decoder erfährst du, wann der Server erstellt wurde.",
    ],
    faq: [
      {
        q: "Trete ich dem Server bei, wenn ich die Einladung hier prüfe?",
        a: "Nein. Das Tool fragt nur die öffentlichen Infos zur Einladung bei Discord ab. Beitreten kannst du nur in Discord selbst – und erst, wenn du dort bestätigst.",
      },
      {
        q: "Warum steht „Einladung ungültig oder abgelaufen“?",
        a: "Discord meldet dann „Unknown Invite“. Häufige Gründe: Die Einladung ist abgelaufen oder gelöscht, hatte eine maximale Anzahl Nutzungen, der Server hat seine Vanity-URL geändert oder es gibt einen Tippfehler. Einladungscodes unterscheiden Groß- und Kleinschreibung.",
      },
      {
        q: "Wie genau sind Mitglieder- und Online-Zahl?",
        a: "Discord liefert nur ungefähre Werte (`approximate_member_count` und `approximate_presence_count`), die bis zu einigen Minuten alt sein können. Für eine grobe Einschätzung reicht das, auf die einzelne Person genau ist es nicht.",
      },
      {
        q: "Heißt eine gültige Einladung, dass der Server sicher ist?",
        a: "Nein. Auch Betrugs- und Phishing-Server haben gültige Einladungen. Ein Verifiziert- oder Partner-Häkchen ist ein gutes Zeichen; misstrau trotzdem Servern, die „Free Nitro“, Gewinnspiele oder Logins versprechen.",
      },
      {
        q: "Werden die Einladungen irgendwo gespeichert?",
        a: "Nein. Dein Browser fragt direkt bei Discord an, ohne Umweg über unseren Server, und das Ergebnis wird nirgends gespeichert.",
      },
    ],
  },
  en: {
    title: "Discord Invite Lookup – see the server behind a link",
    description:
      "Check a Discord invite link without joining: server name, icon, banner, member and online count, boost level, verification level and expiry date.",
    h1: "Invite lookup",
    lead: "Paste an invite link and see which server it leads to – with member count, boost level, verification level and expiry. You don't join anything.",
    steps: [
      "Copy the invite link, e.g. discord.gg/abc123 or discord.com/invite/abc123.",
      "Paste it above and press “Look up” – the bare code works too.",
      "Check the server, members, channel and expiry.",
      "Use “Copy server ID” or the snowflake decoder link to see when the server was created.",
    ],
    faq: [
      {
        q: "Do I join the server when I check an invite here?",
        a: "No. The tool only asks Discord for the public invite details. You can only join inside Discord itself – and only after confirming there.",
      },
      {
        q: "Why does it say “Invite invalid or expired”?",
        a: "Discord answers “Unknown Invite”. Common reasons: the invite expired or was deleted, it had a maximum number of uses, the server changed its vanity URL, or there's a typo. Invite codes are case-sensitive.",
      },
      {
        q: "How accurate are the member and online counts?",
        a: "Discord only returns approximate values (`approximate_member_count` and `approximate_presence_count`) that can be a few minutes old. Good for a rough idea, not exact to the person.",
      },
      {
        q: "Does a valid invite mean the server is safe?",
        a: "No. Scam and phishing servers have valid invites too. A verified or partner check mark is a good sign; still be wary of servers promising “free Nitro”, giveaways or logins.",
      },
      {
        q: "Are invites stored anywhere?",
        a: "No. Your browser asks Discord directly, without going through our server, and the result isn't saved anywhere.",
      },
    ],
  },
};

export default content;
