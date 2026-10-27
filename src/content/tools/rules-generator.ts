import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Regeln Vorlage – Serverregeln erstellen (Text & Embed)",
    description:
      "Discord-Serverregeln aus Bausteinen erstellen: Respekt, Spam, Werbung, NSFW, Datenschutz, Strafen. Deutsch oder Englisch, als Text oder Embed – kostenlos kopieren.",
    h1: "Discord-Regel-Generator",
    lead: "Stell deine Serverregeln aus fertigen Bausteinen zusammen, pass die Texte an und kopier sie als Nachricht – oder öffne sie als Embed im Embed-Builder.",
    steps: [
      "Hak die Regeln an, die du brauchst, und bring sie mit den Pfeilen in die richtige Reihenfolge.",
      "Pass Titel und Texte an oder füg eigene Regeln hinzu.",
      "Wähl einen Stil: nummeriert, mit Überschriften oder mit Emojis.",
      "Kopier den Text in deinen Regelkanal – oder nimm „Embed“ und öffne das Ergebnis im Embed-Builder.",
    ],
    faq: [
      {
        q: "Welche Regeln sollte jeder Discord-Server haben?",
        a: "Bewährt haben sich: respektvoller Umgang, kein Spam, keine Werbung ohne Erlaubnis, kein NSFW, Schutz privater Daten, die richtigen Kanäle nutzen und ein klares Strafen-System. Dazu der Hinweis auf die Nutzungsbedingungen und Community-Richtlinien von Discord.",
      },
      {
        q: "Meine Regeln sind zu lang für eine Nachricht – was tun?",
        a: "Eine Nachricht hat 2.000 Zeichen (mit Nitro 4.000). Das Tool teilt längere Regeln automatisch an Absätzen in mehrere Nachrichten. Alternativ passt viel mehr in ein Embed: bis zu 25 Felder mit je 1.024 Zeichen.",
      },
      {
        q: "Wie poste ich die Regeln als Embed?",
        a: "Wähl „Embed“ und klick auf „Im Embed-Builder öffnen“. Dort kannst du es weiter gestalten und per Webhook in deinen Regelkanal senden. Pings sind dabei unterdrückt.",
      },
      {
        q: "Brauche ich für Discord die Regeln als Community-Server?",
        a: "Ja, Community-Server brauchen einen Regel- bzw. Richtlinienkanal. Für das Mitglieder-Screening (Regeln vor dem Schreiben bestätigen) trägst du die Regeln zusätzlich in den Servereinstellungen ein.",
      },
      {
        q: "Ist die Vorlage rechtlich geprüft?",
        a: "Nein, sie ist eine Vorlage und keine Rechtsberatung. Pass sie an deinen Server an. Discords Nutzungsbedingungen und Community-Richtlinien gelten immer zusätzlich.",
      },
    ],
    about: [
      "Die Regeln kannst du jederzeit zwischen Deutsch und Englisch umschalten – deine Reihenfolge, Auswahl und eigenen Regeln bleiben erhalten. Nichts wird gespeichert oder hochgeladen.",
    ],
  },
  en: {
    title: "Discord Rules Template – server rules generator (text & embed)",
    description:
      "Create Discord server rules from building blocks: respect, spam, ads, NSFW, privacy, consequences. English or German, as text or embed – free to copy.",
    h1: "Discord rules generator",
    lead: "Put your server rules together from ready-made blocks, tweak the wording and copy them as a message – or open them as an embed in the embed builder.",
    steps: [
      "Tick the rules you need and order them with the arrows.",
      "Edit titles and texts or add your own rules.",
      "Pick a style: numbered, headings or emoji bullets.",
      "Copy the text into your rules channel – or choose “Embed” and open it in the embed builder.",
    ],
    faq: [
      {
        q: "What rules should every Discord server have?",
        a: "Proven basics: be respectful, no spam, no ads without permission, no NSFW, protect private information, use the right channels and a clear consequences system – plus a pointer to Discord's Terms of Service and Community Guidelines.",
      },
      {
        q: "My rules are too long for one message – what now?",
        a: "A message holds 2,000 characters (4,000 with Nitro). The tool splits longer rules into several messages at paragraph breaks. An embed fits much more: up to 25 fields of 1,024 characters each.",
      },
      {
        q: "How do I post the rules as an embed?",
        a: "Choose “Embed” and click “Open in embed builder”. There you can style it further and send it to your rules channel via webhook. Pings are suppressed.",
      },
      {
        q: "Do community servers need a rules channel?",
        a: "Yes, community servers need a rules or guidelines channel. For membership screening (members accept the rules before chatting) you also enter the rules in Server Settings.",
      },
      {
        q: "Is the template legally reviewed?",
        a: "No, it's a template and not legal advice. Adapt it to your server. Discord's Terms of Service and Community Guidelines always apply on top.",
      },
    ],
    about: [
      "You can switch the rules between English and German at any time – your order, selection and custom rules stay. Nothing is stored or uploaded.",
    ],
  },
};

export default content;
