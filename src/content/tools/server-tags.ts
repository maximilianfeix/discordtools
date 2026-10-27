import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Server-Tag Ideen – Generator, Prüfung & Vorschau",
    description:
      "Ideen für deinen Discord-Server-Tag (4 Zeichen): Generator aus dem Servernamen, beliebte Tags nach Thema, Zeichen-Check und Vorschau neben dem Namen. Plus Anleitung.",
    h1: "Discord-Server-Tag-Generator",
    lead: "Finde einen 4-Zeichen-Tag für deinen Server, prüf ihn auf erlaubte Zeichen und sieh, wie er neben Namen im Chat und in der Mitgliederliste aussieht.",
    steps: [
      "Gib deinen Servernamen ein – das Tool schlägt Abkürzungen, Initialen und Varianten mit Zahlen vor.",
      "Klick einen Vorschlag an oder tipp deinen eigenen Tag ein (bis 4 Zeichen).",
      "Wähl eine Abzeichen-Form und Farben und prüf die Vorschau.",
      "Trag den Tag in Discord unter Servereinstellungen → Server-Tag ein.",
    ],
    faq: [
      {
        q: "Was ist ein Discord-Server-Tag?",
        a: "Ein Server-Tag ist ein kurzes Kürzel mit bis zu 4 Zeichen und einem kleinen Abzeichen. Mitglieder können ihn in ihrem Profil tragen, dann steht er überall neben ihrem Namen – im Chat, in der Mitgliederliste und in DMs.",
      },
      {
        q: "Was kostet ein Server-Tag?",
        a: "Der Server braucht 3 Server-Boosts, die du als Owner oder Admin im Tab „Server-Boosts“ für den Perk einsetzt. Ein bestimmtes Boost-Level ist nicht nötig. Weitere Abzeichen-Pakete kosten 2 bis 5 zusätzliche Boosts.",
      },
      {
        q: "Welche Zeichen sind im Server-Tag erlaubt?",
        a: "Laut Discord Buchstaben, Ziffern und „bestimmte“ Sonderzeichen. Leerzeichen und Emojis gehen nicht. Welche Sonderzeichen genau erlaubt sind, veröffentlicht Discord nicht – das Tool markiert sie deshalb als „testen“.",
      },
      {
        q: "Wie setze ich einen Server-Tag in meinem Profil?",
        a: "Am Desktop: Benutzereinstellungen → Profile → Server-Tag → Auswählen. Am Handy: Profilbild unten rechts → Profil bearbeiten → Server-Tags. Du kannst immer nur einen Tag gleichzeitig tragen.",
      },
      {
        q: "Muss mein Tag einzigartig sein?",
        a: "Nein, mehrere Server können denselben Tag nutzen. Erst die Kombination aus Tag und Abzeichen macht deinen Server wiedererkennbar.",
      },
      {
        q: "Was passiert, wenn ich den Tag ändere?",
        a: "Alle Mitglieder müssen den neuen Tag selbst wieder übernehmen. Außerdem kannst du den Tag nicht beliebig oft ändern – Discord begrenzt die Änderungen.",
      },
    ],
    about: [
      "In der API heißt der Tag `primary_guild.tag` (höchstens 4 Zeichen). Die Abzeichen in der Vorschau sind eigene, einfache Formen – in Discord wählst du aus Discords Abzeichen.",
    ],
  },
  en: {
    title: "Discord Server Tag Ideas – generator, checker & preview",
    description:
      "Ideas for your Discord server tag (4 characters): generator from your server name, popular tags by theme, character check and a preview next to names. Plus a setup guide.",
    h1: "Discord server tag generator",
    lead: "Find a 4-character tag for your server, check it for allowed characters and see how it looks next to names in chat and the member list.",
    steps: [
      "Enter your server name – the tool suggests abbreviations, initials and versions with numbers.",
      "Click a suggestion or type your own tag (up to 4 characters).",
      "Pick a badge shape and colors and check the preview.",
      "Enter the tag in Discord under Server Settings → Server Tag.",
    ],
    faq: [
      {
        q: "What is a Discord server tag?",
        a: "A server tag is a short label of up to 4 characters plus a small badge. Members can wear it on their profile and it then shows next to their name everywhere – in chat, the member list and DMs.",
      },
      {
        q: "What does a server tag cost?",
        a: "The server needs 3 Server Boosts that an owner or admin applies to the perk in the “Server Boosts” tab. No particular boost level is required. Extra badge packs cost 2 to 5 more boosts.",
      },
      {
        q: "Which characters are allowed in a server tag?",
        a: "According to Discord: letters, digits and “certain” special characters. Spaces and emojis don't work. Discord doesn't publish the exact list of special characters, so the tool marks them as “test it”.",
      },
      {
        q: "How do I put a server tag on my profile?",
        a: "Desktop: User Settings → Profiles → Server Tag → Select. Mobile: avatar in the bottom right → Edit Profile → Server Tags. You can wear one tag at a time.",
      },
      {
        q: "Does my tag have to be unique?",
        a: "No, several servers can use the same tag. The combination of tag and badge is what makes your server recognizable.",
      },
      {
        q: "What happens when I change the tag?",
        a: "Every member has to re-apply the new tag themselves. Changes are also rate-limited, so you can't change it as often as you like.",
      },
    ],
    about: [
      "In the API the tag is `primary_guild.tag` (max 4 characters). The badges in the preview are our own simple shapes – in Discord you choose from Discord's badges.",
    ],
  },
};

export default content;
