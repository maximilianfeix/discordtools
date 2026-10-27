import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Rechte-Rechner – Permissions berechnen (2026)",
    description:
      "Discord-Rechte für Bots und Rollen berechnen und entschlüsseln: alle 52 Rechte bis Slowmode umgehen und Nachrichten anpinnen, mit Erklärung, 2FA-Hinweis und Vergleich.",
    h1: "Discord Rechte-Rechner",
    lead: "Hake die Rechte an, die dein Bot braucht, und kopiere den Wert – oder füge eine Zahl ein und sieh sofort, welche Rechte darin stecken. Aktuell mit allen Rechten bis `BYPASS_SLOWMODE` (Bit 52).",
    steps: [
      "Wähle eine Vorlage wie „Moderations-Bot“ oder hake einzelne Rechte an. Die Suche findet deutsche und englische Namen.",
      "Kopiere den Dezimalwert rechts. Das ist die Zahl für permissions= im Einladungslink oder für default_member_permissions.",
      "Zum Entschlüsseln fügst du eine Zahl in das Feld „Rechte-Wert“ ein – Dezimal, Hex (0x…) oder Binär.",
      "Mit „Vergleichen“ siehst du, welche Rechte zwischen zwei Werten dazukommen oder wegfallen.",
      "Klicke auf „Im Bot-Einladungslink verwenden“, um den Wert direkt in den Link-Generator zu übernehmen.",
    ],
    faq: [
      {
        q: "Warum ist die Zahl so groß?",
        a: "Jedes Recht ist ein Bit. Die neuesten Rechte liegen auf Bit 48 bis 52, deshalb sind Werte über 2^53 möglich. JavaScript-Zahlen runden dort – Discord schickt Rechte darum als String. Dieser Rechner rechnet mit BigInt und bleibt exakt.",
      },
      {
        q: "Braucht mein Bot Administrator?",
        a: "Fast nie. Mit Administrator ignoriert der Bot alle Kanal-Sperren und kann Rollen und Webhooks ändern. Wird der Token geklaut, ist der ganze Server offen. Viele Server-Admins lehnen Bots mit Administrator ab. Wähle nur, was der Bot wirklich nutzt.",
      },
      {
        q: "Warum kann mein Bot keine Nachrichten mehr anpinnen?",
        a: "Seit Februar 2026 braucht Anpinnen das eigene Recht `PIN_MESSAGES` (Bit 51). „Nachrichten verwalten“ reicht nicht mehr. Genauso braucht das Umgehen des Slowmodes jetzt `BYPASS_SLOWMODE` (Bit 52).",
      },
      {
        q: "Was bedeutet das 2FA-Schloss?",
        a: "Auf Servern, die 2FA für Moderation verlangen, wirken diese Rechte nur, wenn der Besitzer der App (bzw. des Teams) Zwei-Faktor-Authentifizierung aktiviert hat.",
      },
      {
        q: "Was sind unbekannte Bits?",
        a: "Bits, die Discord (noch) nicht dokumentiert, zum Beispiel Bit 47. Der Rechner zeigt sie an und behält sie im Wert, damit nichts verloren geht, falls Discord ein neues Recht einführt.",
      },
      {
        q: "Gilt der Wert auch für Kanal-Überschreibungen?",
        a: "Ja, das Format ist gleich. Rechte mit dem Hinweis „nur Server“ (z. B. Bannen oder Administrator) lassen sich aber nicht pro Kanal setzen. Der Wert im Einladungslink legt nur die Rolle des Bots fest – was er tatsächlich darf, hängt zusätzlich von Kanal-Überschreibungen ab.",
      },
    ],
    about: [
      "Die Daten stammen aus der offiziellen Discord-Dokumentation (Stand Oktober 2026): 52 Rechte auf den Bits 0 bis 52, Bit 47 ist unbelegt. Alle Rechte zusammen ergeben `8866461766385663` (`0x1F7FFFFFFFFFFF`).",
    ],
  },
  en: {
    title: "Discord Permissions Calculator – up to date for 2026",
    description:
      "Calculate and decode Discord permission integers for bots and roles: all 52 permissions up to Bypass Slowmode and Pin Messages, with explanations, 2FA notes and a compare mode.",
    h1: "Discord Permissions Calculator",
    lead: "Tick the permissions your bot needs and copy the value – or paste a number and instantly see which permissions it contains. Current with every permission up to `BYPASS_SLOWMODE` (bit 52).",
    steps: [
      "Pick a preset like “Moderation bot” or tick single permissions. Search works with permission names and keys.",
      "Copy the decimal value on the right. It's the number for permissions= in an invite link or for default_member_permissions.",
      "To decode, paste a number into “Permissions value” – decimal, hex (0x…) or binary.",
      "Use “Compare” to see which permissions are added or removed between two values.",
      "Click “Use in bot invite link” to take the value straight into the invite link builder.",
    ],
    faq: [
      {
        q: "Why is the number so big?",
        a: "Each permission is one bit. The newest permissions sit on bits 48 to 52, so values above 2^53 are possible. JavaScript numbers get rounded there, which is why Discord sends permissions as strings. This calculator uses BigInt and stays exact.",
      },
      {
        q: "Does my bot need Administrator?",
        a: "Almost never. With Administrator the bot bypasses every channel lock and can edit roles and webhooks. If the token leaks, the whole server is open. Many server admins refuse bots that ask for it. Pick only what the bot really uses.",
      },
      {
        q: "Why can't my bot pin messages anymore?",
        a: "Since February 2026, pinning needs its own permission `PIN_MESSAGES` (bit 51); Manage Messages is no longer enough. Likewise, bypassing slowmode now needs `BYPASS_SLOWMODE` (bit 52).",
      },
      {
        q: "What does the 2FA lock mean?",
        a: "On servers that require 2FA for moderation, these permissions only work if the app owner (or team owner) has two-factor authentication enabled.",
      },
      {
        q: "What are unknown bits?",
        a: "Bits Discord does not document (yet), for example bit 47. The calculator shows them and keeps them in the value, so nothing is lost if Discord adds a new permission.",
      },
      {
        q: "Does the value work for channel overwrites too?",
        a: "Yes, the format is the same. Permissions marked “server only” (such as Ban or Administrator) cannot be set per channel, though. The value in an invite link only sets the bot's role – what it can actually do also depends on channel overwrites.",
      },
    ],
    about: [
      "The data comes from Discord's official documentation (as of October 2026): 52 permissions on bits 0 to 52, bit 47 is unused. All permissions together are `8866461766385663` (`0x1F7FFFFFFFFFFF`).",
    ],
  },
};

export default content;
