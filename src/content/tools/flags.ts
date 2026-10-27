import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Flags-Decoder – public_flags, Badges & Message Flags",
    description:
      "Discord-Flags entschlüsseln: Nutzer-Badges (public_flags), Nachrichten-, Kanal-, App-, Systemkanal- und Mitglieder-Flags. Zahl einfügen, Bedeutung sehen – oder Flags anhaken.",
    h1: "Discord Flags-Decoder",
    lead: "Füge eine Flag-Zahl aus der Discord-API ein und sieh sofort, welche Flags gesetzt sind – zum Beispiel die Badges eines Nutzers in `public_flags`. Oder hake Flags an und bekomm den Wert.",
    steps: [
      "Wähle den Typ: Nutzer, Nachricht, Kanal, App, Systemkanal oder Mitglied.",
      "Füge die Zahl aus dem JSON ein, z. B. den Wert von public_flags oder flags.",
      "Lies rechts, welche Flags gesetzt sind. Unbekannte Bits werden extra angezeigt.",
      "Oder hake Flags an, um einen Wert zu bauen – etwa 4096 für stumme Nachrichten.",
    ],
    faq: [
      {
        q: "Welche Badges stehen in public_flags?",
        a: "Unter anderem Discord-Mitarbeiter, Partner, HypeSquad Events, die drei HypeSquad-Häuser, Bug Hunter Stufe 1 und 2, früher Unterstützer, verifizierter Bot, früher verifizierter Bot-Entwickler, Moderator-Programm-Alumni und Aktiver Entwickler. Nitro- und Boost-Abzeichen stehen nicht im Bitfeld.",
      },
      {
        q: "Warum fehlt „Aktiver Entwickler“ in der Doku?",
        a: "Das Badge (Bit 22, Wert `4194304`) wird von der API weiterhin geliefert, steht aber nicht mehr in der offiziellen Liste. Wir zeigen es deshalb mit dem Hinweis „nicht dokumentiert“.",
      },
      {
        q: "Wie sende ich eine stumme Nachricht per Webhook?",
        a: "Setze `flags` auf `4096` (`SUPPRESS_NOTIFICATIONS`). Beim Senden erlaubt Discord nur `SUPPRESS_EMBEDS` (4), `SUPPRESS_NOTIFICATIONS` (4096) und `IS_COMPONENTS_V2` (32768).",
      },
      {
        q: "Was ist der Unterschied zwischen flags und flags_new bei Apps?",
        a: "`flags` ist eine Zahl und wächst nicht über 31 Bit. Neue App-Flags ab Bit 31 stehen nur in `flags_new`, einem String. Der Decoder rechnet mit BigInt, beide Varianten funktionieren.",
      },
      {
        q: "Was bedeutet CHANNEL_OBFUSCATED?",
        a: "Seit 2026 bekommen Bots über das Gateway Kanäle, die sie nicht sehen dürfen, mit verborgenen Details. Solche Kanäle tragen das Flag `CHANNEL_OBFUSCATED` (Bit 17). Über die HTTP-API werden sie gar nicht geliefert.",
      },
    ],
  },
  en: {
    title: "Discord Flags Decoder – public_flags, badges & message flags",
    description:
      "Decode Discord flags: user badges (public_flags), message, channel, application, system channel and member flags. Paste a number to see its meaning – or tick flags.",
    h1: "Discord Flags Decoder",
    lead: "Paste a flags number from the Discord API and instantly see which flags are set – for example a user's badges in `public_flags`. Or tick flags to get the value.",
    steps: [
      "Pick the type: user, message, channel, application, system channel or member.",
      "Paste the number from the JSON, e.g. the value of public_flags or flags.",
      "See which flags are set on the right. Unknown bits are listed separately.",
      "Or tick flags to build a value – like 4096 for silent messages.",
    ],
    faq: [
      {
        q: "Which badges are in public_flags?",
        a: "Among others: Discord Staff, Partner, HypeSquad Events, the three HypeSquad houses, Bug Hunter level 1 and 2, Early Supporter, Verified Bot, Early Verified Bot Developer, Moderator Programs Alumni and Active Developer. Nitro and boost badges are not part of the bitfield.",
      },
      {
        q: "Why is Active Developer missing from the docs?",
        a: "The badge (bit 22, value `4194304`) is still returned by the API but no longer in the official list, so we show it marked “undocumented”.",
      },
      {
        q: "How do I send a silent message via webhook?",
        a: "Set `flags` to `4096` (`SUPPRESS_NOTIFICATIONS`). When sending, Discord only accepts `SUPPRESS_EMBEDS` (4), `SUPPRESS_NOTIFICATIONS` (4096) and `IS_COMPONENTS_V2` (32768).",
      },
      {
        q: "What's the difference between flags and flags_new for apps?",
        a: "`flags` is a number and never grows beyond 31 bits. New application flags from bit 31 up only appear in `flags_new`, a string. The decoder uses BigInt, so both work.",
      },
      {
        q: "What does CHANNEL_OBFUSCATED mean?",
        a: "Since 2026, bots receive channels they cannot view over the gateway with hidden details. Those channels carry the `CHANNEL_OBFUSCATED` flag (bit 17). The HTTP API omits them entirely.",
      },
    ],
  },
};

export default content;
