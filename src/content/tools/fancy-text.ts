import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Schriftarten-Generator – 27 Stile zum Kopieren",
    description:
      "Discord-Schriften für Anzeigename, Bio und Kanäle: fett, kursiv, Schreibschrift, Fraktur, Blasen und mehr. Umlaute bleiben erhalten. Kopieren und einfügen.",
    h1: "Discord-Schriftarten-Generator",
    lead: "Tipp deinen Text ein und kopier ihn in 27 Unicode-Stilen – für Anzeigename, Server-Spitzname, Bio, Kanal- und Rollennamen.",
    steps: [
      "Gib deinen Text oben ein – Umlaute, ß und Emojis sind kein Problem.",
      "Such dir in der Liste einen Stil aus. Mit „Als Name testen“ siehst du ihn in der Discord-Vorschau.",
      "Klick auf „Kopieren“ und füg den Text in Discord ein, z. B. unter Profile → Anzeigename.",
      "Für den Benutzernamen (@name) nimm die Zeile „Als gültiger Benutzername“ – dort gehen keine Schriften.",
    ],
    faq: [
      {
        q: "Wie bekomme ich eine andere Schrift in Discord?",
        a: "Discord hat keine Schriftauswahl für Nachrichten. Die „Schriften“ hier sind Unicode-Zeichen, die wie Buchstaben aussehen, z. B. 𝐀 statt A. Weil es echte Zeichen sind, funktionieren sie überall dort, wo du Text eingeben kannst.",
      },
      {
        q: "Kann ich die Schrift im Benutzernamen nutzen?",
        a: "Nein. Benutzernamen erlauben nur a–z, 0–9, Unterstrich und Punkt (2–32 Zeichen, keine zwei Punkte hintereinander). Im Anzeigenamen und im Server-Spitznamen gehen Schriften, Emojis und Sonderzeichen.",
      },
      {
        q: "Was passiert mit Umlauten und ß?",
        a: "Für ä, ö und ü gibt es in den meisten Stilen keine eigenen Zeichen. Das Tool setzt deshalb den Stil-Buchstaben und hängt die Pünktchen als Akzent an (𝐮̈). ß bleibt unverändert, damit nichts verloren geht.",
      },
      {
        q: "Warum sehe ich bei manchen Stilen Kästchen?",
        a: "Dann fehlt deinem Gerät die passende Schriftart für diese Zeichen. Das betrifft vor allem ältere Android-Handys. Andere sehen den Text eventuell richtig – teste den Stil im Zweifel auf mehreren Geräten.",
      },
      {
        q: "Sind die Schriften barrierefrei?",
        a: "Leider nicht. Screenreader lesen solche Zeichen oft als „mathematisches fettes A“ vor oder überspringen sie. Auch die Suche nach deinem Namen klappt schlechter. Nutze Schriften deshalb sparsam, etwa nur für ein Wort.",
      },
      {
        q: "Wie lang darf mein Anzeigename mit Schrift sein?",
        a: "Anzeigenamen haben maximal 32 Zeichen. Viele Schrift-Buchstaben bestehen technisch aus zwei UTF-16-Einheiten. Zählt Discord diese Einheiten, passen nur rund 16 Schrift-Buchstaben hinein. Das Tool zeigt dir beide Werte.",
      },
    ],
    about: [
      "Superscript und Subscript gibt es nicht für alle Buchstaben – fehlende bleiben normal. Kopfüber-Text wird zusätzlich umgedreht, damit er von rechts nach links gelesen richtig aussieht.",
    ],
  },
  en: {
    title: "Discord Fancy Text Generator – 27 fonts to copy and paste",
    description:
      "Fancy fonts for your Discord display name, bio and channels: bold, italic, script, fraktur, bubble and more. Accents are kept. Copy and paste.",
    h1: "Discord fancy text generator",
    lead: "Type your text and copy it in 27 Unicode styles – for display names, server nicknames, bios, channel and role names.",
    steps: [
      "Type your text at the top – accents and emojis are fine.",
      "Pick a style from the list. “Test as name” shows it in the Discord preview.",
      "Click “Copy” and paste it into Discord, e.g. Profiles → Display Name.",
      "For your username (@name) use the “As a valid username” line – fonts don't work there.",
    ],
    faq: [
      {
        q: "How do I get a different font in Discord?",
        a: "Discord has no font picker for messages. The “fonts” here are Unicode characters that look like letters, e.g. 𝐀 instead of A. Because they are real characters, they work anywhere you can type text.",
      },
      {
        q: "Can I use fancy fonts in my username?",
        a: "No. Usernames only allow a–z, 0–9, underscore and period (2–32 characters, no two periods in a row). Display names and server nicknames accept fonts, emojis and special characters.",
      },
      {
        q: "What happens to accented letters?",
        a: "Most styles have no characters for é or ü. The tool uses the styled base letter and attaches the accent as a combining mark (𝐮̈). Characters without a mapping stay as they are, so nothing gets lost.",
      },
      {
        q: "Why do some styles show boxes?",
        a: "Your device lacks a font for those characters – mostly older Android phones. Others may see the text correctly, so test a style on more than one device if in doubt.",
      },
      {
        q: "Are fancy fonts accessible?",
        a: "Unfortunately not. Screen readers often read them as “mathematical bold capital A” or skip them, and search finds your name less easily. Use them sparingly, e.g. for a single word.",
      },
      {
        q: "How long can my display name be with fancy text?",
        a: "Display names allow up to 32 characters. Many styled letters are two UTF-16 units each. If Discord counts those units, only about 16 styled letters fit. The tool shows both numbers.",
      },
    ],
    about: [
      "Superscript and subscript don't exist for every letter – missing ones stay normal. Upside-down text is also reversed so it reads correctly when flipped.",
    ],
  },
};

export default content;
