import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Zeitstempel erstellen – alle 9 Formate",
    description:
      "Discord-Zeitstempel <t:…> erstellen: Datum eintippen wie „morgen 20 Uhr“, Zeitzone wählen, alle 9 Formate inkl. Countdown kopieren. Kostenlos, ohne Anmeldung.",
    h1: "Discord-Zeitstempel erstellen",
    lead: "Schreib einfach „morgen 20 Uhr“ oder „nächster Samstag“ – du bekommst den passenden `<t:…>`-Code in allen 9 Formaten. Jeder im Chat sieht die Zeit automatisch in seiner eigenen Zeitzone und Sprache.",
    steps: [
      "Gib die Zeit in Worten ein (Deutsch oder Englisch) oder wähle Datum, Uhrzeit und Zeitzone.",
      "Prüf in der Liste, wie jedes Format aussieht – auf Wunsch so, wie es ein Leser in New York oder Tokio sieht.",
      "Klick auf den Code des gewünschten Formats, um ihn zu kopieren.",
      "Füge ihn in eine Discord-Nachricht, ein Embed oder eine Kanalbeschreibung ein.",
    ],
    faq: [
      {
        q: "Wie funktioniert ein Discord-Zeitstempel?",
        a: "Ein Zeitstempel hat die Form `<t:UNIX:FORMAT>`. Die Zahl sind die Sekunden seit dem 1. 1. 1970 (UTC). Discord rechnet sie für jeden Leser in seine Zeitzone um und zeigt sie in seiner App-Sprache an.",
      },
      {
        q: "Welche Formate gibt es?",
        a: "Neun: `t` (16:20), `T` (16:20:30), `d` (20.04.2021), `D` (20. April 2021), `f` (Datum mit Uhrzeit, Standard), `F` (mit Wochentag), `s` und `S` (kurzes Datum mit Uhrzeit, ohne bzw. mit Sekunden) und `R` (relativ, z. B. „in 3 Stunden“).",
      },
      {
        q: "Wie mache ich einen Countdown in Discord?",
        a: "Nimm das Format `R`, z. B. `<t:1798761600:R>`. Discord zeigt „in 2 Tagen“, „in 5 Minuten“ und aktualisiert das von selbst. Für Events passt die Kombination aus `F` und `R`, die das Tool unter „Ankündigung“ fertig baut.",
      },
      {
        q: "Was passiert bei der Zeitumstellung?",
        a: "Wenn du eine Uhrzeit wählst, die es wegen der Sommerzeit nicht gibt (z. B. 2:30 Uhr Ende März), nimmt das Tool die Zeit danach und sagt dir das. Gibt es die Uhrzeit zweimal (Ende Oktober), kannst du wählen, welche du meinst.",
      },
      {
        q: "Warum zeigt Discord eine andere Uhrzeit als ich eingegeben habe?",
        a: "Discord zeigt die Zeit immer in der Zeitzone des Geräts, das die Nachricht anzeigt. Prüf, ob du oben die richtige Zeitzone eingestellt hast – das ist die Zone, in der du die Uhrzeit meinst.",
      },
    ],
    about: [
      "Du kannst auch einen vorhandenen `<t:…>`-Code, Unix-Sekunden, Millisekunden oder eine Discord-ID einfügen – das Tool erkennt es und zeigt dir das Datum dahinter.",
      "Über „Link kopieren“ teilst du den gewählten Zeitpunkt. Im Link steht nur die Unix-Zeit und ggf. die Zeitzone, sonst nichts.",
    ],
  },
  en: {
    title: "Discord Timestamp Generator – all 9 styles",
    description:
      "Create Discord <t:…> timestamps: type “tomorrow 8pm”, pick a time zone and copy all 9 styles including the live countdown. Free, no sign-up.",
    h1: "Discord timestamp generator",
    lead: "Just type “tomorrow 8pm” or “next friday” and get the matching `<t:…>` code in all 9 styles. Everyone in the chat sees the time in their own time zone and language.",
    steps: [
      "Type the time in words (English or German) or pick date, time and time zone.",
      "Check how each style looks – optionally as a reader in New York or Tokyo would see it.",
      "Click the code of the style you want to copy it.",
      "Paste it into a Discord message, an embed or a channel topic.",
    ],
    faq: [
      {
        q: "How do Discord timestamps work?",
        a: "A timestamp looks like `<t:UNIX:STYLE>`. The number is seconds since 1 January 1970 (UTC). Discord converts it to each reader's time zone and formats it in their app language.",
      },
      {
        q: "Which styles are there?",
        a: "Nine: `t` (16:20), `T` (16:20:30), `d` (20/04/2021), `D` (April 20, 2021), `f` (date and time, the default), `F` (with weekday), `s` and `S` (short date with time, without or with seconds) and `R` (relative, e.g. “in 3 hours”).",
      },
      {
        q: "How do I make a countdown in Discord?",
        a: "Use the `R` style, e.g. `<t:1798761600:R>`. Discord shows “in 2 days” or “in 5 minutes” and updates it on its own. For events, combine `F` and `R` – the “Announcement” section builds that for you.",
      },
      {
        q: "What happens around daylight saving time?",
        a: "If you pick a time that doesn't exist because the clocks spring forward, the tool uses the time after the gap and tells you. If a time happens twice when the clocks fall back, you can choose which one you mean.",
      },
      {
        q: "Why does Discord show a different time than I entered?",
        a: "Discord always shows the time in the time zone of the device displaying the message. Check that the time zone above is the one you mean the time in.",
      },
    ],
    about: [
      "You can also paste an existing `<t:…>` code, Unix seconds, milliseconds or a Discord ID – the tool recognises it and shows the date behind it.",
      "“Copy link” shares the selected moment. The link only contains the Unix time and, if needed, the time zone.",
    ],
  },
};

export default content;
