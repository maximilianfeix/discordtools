import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Snowflake Decoder – ID in Datum umwandeln",
    description:
      "Discord-ID in Erstellungsdatum umwandeln: Account-Alter, Server- und Nachrichtendatum aus jeder ID, Erwähnung oder jedem Nachrichtenlink. Auch Datum → ID.",
    h1: "Snowflake-Decoder",
    lead: "Jede Discord-ID enthält den Zeitpunkt, an dem das Objekt erstellt wurde. Füg IDs, Erwähnungen oder Nachrichtenlinks ein und sieh sofort Datum, Alter und die internen Bits – alles lokal in deinem Browser.",
    steps: [
      "Aktiviere in Discord unter Einstellungen → Erweitert den Entwicklermodus.",
      "Rechtsklick (am Handy: lange tippen) auf einen Nutzer, Server, Kanal oder eine Nachricht → „ID kopieren“ oder „Nachrichtenlink kopieren“.",
      "Füg die ID oben ein – mehrere gehen auch, je Zeile eine.",
      "Lies Erstellungsdatum, Alter und UTC-Zeit ab. Für Bots gibt es unten die umgekehrte Richtung: Datum → Snowflake.",
    ],
    faq: [
      {
        q: "Ist das Datum immer das Erstellungsdatum des Accounts?",
        a: "Nein. Eine Snowflake verrät, wann das Objekt mit dieser ID erstellt wurde. Bei einer Nutzer-ID ist das der Account, bei einer Server-ID der Server, bei einer Nachrichten-ID der Zeitpunkt des Sendens. Die ID selbst sagt nicht, welche Art Objekt sie ist – das erkennt das Tool nur aus Erwähnungen wie `<@…>` oder aus Nachrichtenlinks.",
      },
      {
        q: "Wie finde ich die ID eines Nutzers oder Servers?",
        a: "Schalte unter Einstellungen → Erweitert den Entwicklermodus ein. Danach zeigt jedes Rechtsklick- bzw. Lang-Tipp-Menü „ID kopieren“. Bei Nachrichten bekommst du mit „Nachrichtenlink kopieren“ Server-, Kanal- und Nachrichten-ID auf einmal.",
      },
      {
        q: "Warum endet meine ID auf 000 oder sieht aus wie 1,17E+17?",
        a: "Excel, Google Sheets und JavaScript speichern Zahlen nur mit etwa 15–16 Stellen. Eine 18–19-stellige Discord-ID wird dabei gerundet, die letzten Ziffern werden zu Nullen. Das Datum stimmt dann ungefähr, die ID selbst ist aber kaputt. Formatier die Spalte als Text oder kopier die ID erneut aus Discord.",
      },
      {
        q: "Verrät die ID den Standort oder die Person dahinter?",
        a: "Nein. Neben dem Zeitstempel enthält eine Snowflake nur Worker-, Prozess- und Zählerbits. Die sagen, welcher Discord-Server die ID vergeben hat, aber nichts über den Nutzer, seinen Standort oder sein Gerät.",
      },
      {
        q: "Wofür brauche ich Datum → Snowflake?",
        a: "Die Discord-API nimmt bei vielen Endpunkten `before`, `after` oder `around` als ID. Wandelst du ein Datum in die kleinste bzw. größte Snowflake dieser Millisekunde um, kann dein Bot zum Beispiel alle Nachrichten ab dem 1. Januar laden.",
      },
      {
        q: "Wird meine Eingabe irgendwohin geschickt?",
        a: "Nein. Die Umrechnung ist reine Mathematik (`(id >> 22) + 1420070400000`) und läuft komplett in deinem Browser. Es gibt keine Anfrage an Discord oder an uns.",
      },
    ],
    about: [
      "Discord-IDs heißen Snowflakes: 64-Bit-Zahlen, deren obere 42 Bit die Millisekunden seit dem 1. Januar 2015 (dem „Discord-Epoch“) speichern. Danach folgen 5 Bit Worker, 5 Bit Prozess und 12 Bit Zähler. Weil die Zahl größer ist als das, was JavaScript-Zahlen exakt speichern können, rechnet dieses Tool mit `BigInt`.",
    ],
  },
  en: {
    title: "Discord Snowflake Decoder – convert an ID to a date",
    description:
      "Turn any Discord ID into its creation date: account age, server and message dates from IDs, mentions or message links. Also date → snowflake for the API.",
    h1: "Snowflake decoder",
    lead: "Every Discord ID contains the moment the object was created. Paste IDs, mentions or message links and instantly see the date, age and internal bits – all locally in your browser.",
    steps: [
      "In Discord, turn on Developer Mode under Settings → Advanced.",
      "Right-click (long-press on mobile) a user, server, channel or message → “Copy ID” or “Copy Message Link”.",
      "Paste it above – several work too, one per line.",
      "Read the creation date, age and UTC time. Bot developers can go the other way below: date → snowflake.",
    ],
    faq: [
      {
        q: "Is the date always the account creation date?",
        a: "No. A snowflake tells you when the object with that ID was created. For a user ID that's the account, for a server ID the server, for a message ID when it was sent. The ID itself doesn't say what kind of object it is – the tool can only tell from mentions like `<@…>` or from message links.",
      },
      {
        q: "How do I find a user's or server's ID?",
        a: "Enable Developer Mode under Settings → Advanced. Every right-click or long-press menu then shows “Copy ID”. For messages, “Copy Message Link” gives you the server, channel and message ID at once.",
      },
      {
        q: "Why does my ID end in 000 or look like 1.17E+17?",
        a: "Excel, Google Sheets and JavaScript only keep about 15–16 digits. An 18–19 digit Discord ID gets rounded and the last digits turn into zeros. The date is then roughly right, but the ID itself is broken. Format the column as text or copy the ID again from Discord.",
      },
      {
        q: "Does the ID reveal the location or the person behind it?",
        a: "No. Besides the timestamp a snowflake only holds worker, process and increment bits. They tell which Discord machine issued the ID, nothing about the user, their location or device.",
      },
      {
        q: "What is date → snowflake for?",
        a: "Many Discord API endpoints take `before`, `after` or `around` as an ID. Converting a date into the smallest or largest snowflake of that millisecond lets your bot fetch, for example, every message since 1 January.",
      },
      {
        q: "Is my input sent anywhere?",
        a: "No. The conversion is pure math (`(id >> 22) + 1420070400000`) and runs entirely in your browser. There is no request to Discord or to us.",
      },
    ],
    about: [
      "Discord IDs are called snowflakes: 64-bit numbers whose top 42 bits store the milliseconds since 1 January 2015 (the “Discord epoch”). Then come 5 worker bits, 5 process bits and a 12-bit increment. Because the number is larger than what JavaScript numbers can hold exactly, this tool uses `BigInt`.",
    ],
  },
};

export default content;
