import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Bot-Einladungslink erstellen – OAuth2-Generator",
    description:
      "Erstelle den Link, mit dem du deinen Discord-Bot zu einem Server hinzufügst: Client-ID, Scopes, Rechte, Server- oder Nutzer-Installation. Ohne Token, läuft im Browser.",
    h1: "Discord Bot-Einladungslink erstellen",
    lead: "Gib die Application-ID deiner App ein, wähle Installationsart, Scopes und Rechte – und kopiere den fertigen `discord.com/oauth2/authorize`-Link. Du kannst auch einen bestehenden Link einfügen, um ihn zu prüfen und zu ändern.",
    steps: [
      "Kopiere im Developer Portal unter „General Information“ die Application-ID und füge sie ein. Einen Token oder ein Secret brauchst du nicht.",
      "Wähle „Server-Installation“ für einen klassischen Bot oder „Nutzer-Installation“ für Befehle, die überall funktionieren.",
      "Lass bot und applications.commands angehakt und wähle die Rechte – per Zahl oder über die Rechte-Liste.",
      "Optional: Server vorauswählen (guild_id) und die Auswahl sperren.",
      "Kopiere den Link oder öffne ihn direkt, um den Bot hinzuzufügen.",
    ],
    faq: [
      {
        q: "Wo finde ich die Client-ID?",
        a: "Im Discord Developer Portal: Wähle deine App und kopiere unter „General Information“ die „Application ID“. Sie ist eine 17- bis 20-stellige Zahl und dieselbe wie die Client-ID unter „OAuth2“.",
      },
      {
        q: "Was ist der Unterschied zwischen Server- und Nutzer-Installation?",
        a: "Bei der Server-Installation (`integration_type=0`) kommt der Bot-Nutzer in einen Server und bekommt eine Rolle mit den gewählten Rechten. Bei der Nutzer-Installation (`integration_type=1`) landet die App in deinem Konto: Ihre Befehle gehen auch in DMs und fremden Servern, aber ohne Bot-Nutzer und ohne Rechte. Dafür muss „User Install“ im Developer Portal aktiviert sein.",
      },
      {
        q: "Warum fragt Discord nach einer redirect_uri?",
        a: "Sobald du Scopes wie `identify`, `guilds` oder `email` hinzufügst, startet der volle OAuth2-Ablauf mit `response_type=code`. Discord leitet dann zu deiner `redirect_uri` weiter, die im Developer Portal eingetragen sein muss. Für einen normalen Bot reichen `bot` und `applications.commands`.",
      },
      {
        q: "Brauche ich applications.commands zusätzlich zu bot?",
        a: "Nein, `applications.commands` ist bei `bot` automatisch dabei. Es schadet aber nicht und macht deutlich, dass die App Slash-Befehle hat. Für Nutzer-Installationen ist es Pflicht.",
      },
      {
        q: "Bekommt mein Bot alle Rechte aus dem Link?",
        a: "Nur, wenn die Person, die ihn hinzufügt, diese Rechte selbst hat und sie nicht abwählt. Kanal-Überschreibungen können einzelne Rechte später wieder einschränken.",
      },
    ],
  },
  en: {
    title: "Discord Bot Invite Link Generator – OAuth2 URL builder",
    description:
      "Build the link to add your Discord bot to a server: client ID, scopes, permissions, server or user install. No token needed, runs in your browser.",
    h1: "Discord Bot Invite Link Generator",
    lead: "Enter your app's application ID, pick install type, scopes and permissions – and copy the finished `discord.com/oauth2/authorize` link. You can also paste an existing link to check and edit it.",
    steps: [
      "Copy the application ID from the Developer Portal under “General Information” and paste it. You don't need a token or secret.",
      "Choose “Server install” for a classic bot or “User install” for commands that work everywhere.",
      "Keep bot and applications.commands ticked and pick the permissions – as a number or from the list.",
      "Optional: preselect a server (guild_id) and lock the selection.",
      "Copy the link or open it right away to add the bot.",
    ],
    faq: [
      {
        q: "Where do I find the client ID?",
        a: "In the Discord Developer Portal: open your app and copy the “Application ID” under “General Information”. It's a 17 to 20 digit number and the same as the client ID under “OAuth2”.",
      },
      {
        q: "What's the difference between server and user install?",
        a: "A server install (`integration_type=0`) adds the bot user to a server with a role holding the chosen permissions. A user install (`integration_type=1`) adds the app to your account: its commands work in DMs and other servers too, but without a bot user and without permissions. “User Install” must be enabled in the Developer Portal.",
      },
      {
        q: "Why does Discord ask for a redirect_uri?",
        a: "As soon as you add scopes like `identify`, `guilds` or `email`, the full OAuth2 flow with `response_type=code` starts. Discord then redirects to your `redirect_uri`, which must be registered in the Developer Portal. A normal bot only needs `bot` and `applications.commands`.",
      },
      {
        q: "Do I need applications.commands in addition to bot?",
        a: "No, `applications.commands` is included with `bot`. It doesn't hurt and makes clear the app has slash commands. For user installs it is required.",
      },
      {
        q: "Does my bot get every permission in the link?",
        a: "Only if the person adding it has those permissions themselves and doesn't untick them. Channel overwrites can restrict single permissions later.",
      },
    ],
  },
};

export default content;
