import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Kanalnamen-Generator – mit Emoji, Trenner und Schrift",
    description:
      "Schöne Discord-Kanalnamen wie 💬┃allgemein erstellen: Emojis, Trenner, Schriften, Vorlagen für Gaming, Community, Lernen und Shop. Mit Vorschau der Kanalliste.",
    h1: "Discord-Kanalnamen-Generator",
    lead: "Bau Kanalnamen aus Emoji, Trenner und Name – einzeln oder für deinen ganzen Server auf einmal. Die Vorschau zeigt, wie Discord sie wirklich speichert.",
    steps: [
      "Wähl „Einzelner Kanal“ oder „Liste / Vorlage“ für mehrere Kanäle.",
      "Such dir Emoji, Trenner (z. B. ┃ oder ・) und optional eine Schrift aus.",
      "Prüf in der Vorschau, wie die Kanalliste aussieht – im dunklen oder hellen Theme.",
      "Kopier den Namen und füg ihn beim Erstellen oder Bearbeiten des Kanals ein.",
    ],
    faq: [
      {
        q: "Wie bekomme ich das ┃ in meinen Kanalnamen?",
        a: "Wähl den Trenner im Tool und kopier den fertigen Namen. Das Zeichen ┃ ist ein normales Unicode-Zeichen (Box-Drawing), Discord lässt es in Kanalnamen stehen.",
      },
      {
        q: "Warum schreibt Discord meinen Textkanal klein?",
        a: "Textkanäle werden immer kleingeschrieben, Leerzeichen werden zu Bindestrichen und die meisten Satzzeichen wie ! ? . , fallen weg. Emojis, Trenner und Unicode-Schriften bleiben. Sprachkanäle und Kategorien behalten Groß- und Kleinschreibung und Leerzeichen.",
      },
      {
        q: "Kann ich Leerzeichen in Textkanälen nutzen?",
        a: "Nicht direkt – Discord macht daraus Bindestriche. Deshalb lässt das Tool Leerzeichen um den Trenner standardmäßig weg. Manche nutzen breite Unicode-Leerzeichen, das blockt Discord aber teils.",
      },
      {
        q: "Wie lang darf ein Kanalname sein?",
        a: "1 bis 100 Zeichen. Lange Namen schneidet die Kanalliste mit „…“ ab – kurze Namen mit einem Emoji sind am besten lesbar.",
      },
      {
        q: "Wie ändere ich viele Kanäle auf einmal?",
        a: "Im Modus „Liste / Vorlage“ fügst du alle Namen untereinander ein, das Tool wendet das gleiche Muster an. Umbenennen musst du in Discord trotzdem jeden Kanal einzeln – „Alle kopieren“ spart das Abtippen.",
      },
    ],
    about: [
      "Listen-Syntax: Eine Zeile mit `:` am Ende ist eine Kategorie, `+` am Anfang macht einen Sprachkanal. Steht ein Emoji am Zeilenanfang, wird es statt des Standard-Emojis verwendet.",
      "Die Umrechnung für Textkanäle ist eine Näherung an Discords Regeln. Ergebnisse können sich im Detail unterscheiden, wenn Discord seine Filter ändert.",
    ],
  },
  en: {
    title: "Discord Channel Name Generator – emoji, separators and fonts",
    description:
      "Create pretty Discord channel names like 💬┃general: emojis, separators, fonts and templates for gaming, community, study and shop servers. With a channel list preview.",
    h1: "Discord channel name generator",
    lead: "Build channel names from emoji, separator and name – one at a time or for your whole server at once. The preview shows how Discord really saves them.",
    steps: [
      "Choose “Single channel” or “List / template” for many channels.",
      "Pick an emoji, a separator (e.g. ┃ or ・) and optionally a font.",
      "Check the channel list preview in a dark or light theme.",
      "Copy the name and paste it when creating or editing the channel.",
    ],
    faq: [
      {
        q: "How do I get the ┃ in my channel name?",
        a: "Pick the separator in the tool and copy the finished name. ┃ is a normal Unicode box-drawing character and Discord keeps it in channel names.",
      },
      {
        q: "Why does Discord lowercase my text channel?",
        a: "Text channels are always lowercase, spaces become dashes and most punctuation like ! ? . , is removed. Emojis, separators and Unicode fonts stay. Voice channels and categories keep case and spaces.",
      },
      {
        q: "Can I use spaces in text channels?",
        a: "Not directly – Discord turns them into dashes. That's why the tool leaves out spaces around the separator by default. Some people use wide Unicode spaces, but Discord partly blocks those.",
      },
      {
        q: "How long can a channel name be?",
        a: "1 to 100 characters. The channel list cuts long names with “…”, so short names with one emoji read best.",
      },
      {
        q: "How do I rename many channels at once?",
        a: "In “List / template” mode paste all names line by line and the tool applies the same pattern. You still rename each channel in Discord yourself – “Copy all” saves the typing.",
      },
    ],
    about: [
      "List syntax: a line ending in `:` is a category, a leading `+` makes a voice channel. A leading emoji replaces the default emoji for that line.",
      "The text channel conversion approximates Discord's rules. Details can differ when Discord changes its filters.",
    ],
  },
};

export default content;
