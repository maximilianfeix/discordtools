import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import { ChevronDown, CopyPlus, Undo2 } from "lucide-preact";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { copyText, toast } from "../ui/toast";
import Preview, { type PreviewTheme } from "../discord/Preview";
import { LIMITS, hexToInt, intToHex, type Embed } from "../../lib/discord-types";
import { readJson, writeJson } from "../../lib/storage";
import {
  SHARE_WARN_CHARS, TEMPLATE_IDS, THREAD_NAME_MAX, cloneEmbed, countChars, decodeShare, discordPathToDraft, draftToEditPayload,
  draftToPayload, embedChars, emptyDraft, emptyEmbed, emptyField, encodeShare, flattenDiscordErrors, getTemplate, importJson,
  isEmbedEmpty, isShareHash, isSnowflake, isoToLocalInput, listExtras, localInputToIso, looksLikeToken, messageToDraft,
  parseMessageRef, parseWebhookUrl, payloadForShare, removeUnknown, templateNames, totalEmbedChars, validate, valueToDraft,
  webhookEndpoint, withQuery, type Draft, type DraftEmbed, type DraftField, type ImportError, type ImportNote, type Issue,
  type TemplateId,
} from "../../lib/embed-builder";
import type { Lang } from "../../i18n/ui";
import "./EmbedBuilder.css";

const L = {
  de: {
    locale: "de-DE",
    editor: "Editor",
    json: "JSON",
    view: "Ansicht",
    template: "Vorlage laden …",
    templateLabel: "Vorlage",
    share: "Link teilen",
    clear: "Leeren",
    undo: "Rückgängig",
    dismiss: "Schließen",
    loadedTemplate: (n: string) => `Vorlage „${n}“ geladen.`,
    cleared: "Nachricht geleert.",
    imported: "JSON importiert.",
    loadedShared: "Geteilte Nachricht geladen.",
    loadedMessage: "Nachricht von Discord geladen.",
    restored: "Gespeicherter Entwurf wiederhergestellt.",
    badShare: "Der geteilte Link ist beschädigt oder unvollständig und konnte nicht geladen werden.",
    shareCopied: "Link kopiert – ohne Webhook-URL",
    shareLong: (n: number) => `Der Link ist ${n.toLocaleString("de-DE")} Zeichen lang. Manche Apps kürzen so lange Links – teile lieber das JSON.`,
    copyFail: "Kopieren fehlgeschlagen",
    edit: "Bearbeiten",
    preview: "Vorschau",
    previewLabel: "Vorschau – kann leicht vom echten Discord abweichen",
    previewNote: "Schriften, Bildgrößen und Zeilenumbrüche können in Discord etwas anders aussehen.",
    suppressedNote: "Embeds werden unterdrückt (Flag 4) und in Discord nicht angezeigt.",
    defaultName: "Webhook",
    message: "Nachricht",
    content: "Inhalt",
    contentHint: "Markdown geht: **fett**, *kursiv*, `Code`, > Zitat, # Überschrift, <t:1700000000:R>",
    username: "Name",
    usernameHint: "Überschreibt den Webhook-Namen nur für diese Nachricht.",
    avatarUrl: "Avatar-URL",
    embeds: "Embeds",
    embedsChars: (n: number) => `${n.toLocaleString("de-DE")} / 6.000 Zeichen`,
    embed: (i: number) => `Embed ${i}`,
    emptySummary: "leer",
    chars: (n: number) => `${n.toLocaleString("de-DE")} Z.`,
    addEmbed: "Embed hinzufügen",
    noEmbeds: "Noch kein Embed. Eine Nachricht kann bis zu 10 Embeds haben.",
    moveUp: "Nach oben",
    moveDown: "Nach unten",
    duplicate: "Duplizieren",
    remove: "Löschen",
    expand: "Aufklappen",
    color: "Farbe",
    colorPicker: "Farbwähler",
    noColor: "Keine",
    noColorLabel: "Keine Farbe (Standard)",
    gAuthor: "Autor",
    authorName: "Autor-Name",
    authorUrl: "Autor-Link",
    authorIcon: "Autor-Icon-URL",
    gBody: "Inhalt",
    title: "Titel",
    titleUrl: "Titel-Link",
    description: "Beschreibung",
    gFields: "Felder",
    field: (i: number) => `Feld ${i}`,
    fieldName: "Name",
    fieldValue: "Wert",
    inline: "Nebeneinander (inline)",
    addField: "Feld hinzufügen",
    gImages: "Bilder",
    thumbnail: "Thumbnail-URL (klein, rechts)",
    image: "Bild-URL (groß, unten)",
    gFooter: "Footer",
    footerText: "Footer-Text",
    footerIcon: "Footer-Icon-URL",
    timestamp: "Zeitstempel",
    timestampHint: "Wird bei jedem Leser in seiner Zeitzone angezeigt.",
    now: "Jetzt",
    clearTs: "Zeitstempel entfernen",
    issuesTitle: (e: number, w: number) => [e && `${e} ${e === 1 ? "Fehler" : "Fehler"}`, w && `${w} ${w === 1 ? "Hinweis" : "Hinweise"}`].filter(Boolean).join(" · "),
    allGood: "Alles innerhalb der Discord-Limits",
    extrasTitle: "Zusätzliche Felder",
    extrasHint: "Diese Felder kann der Editor nicht bearbeiten. Sie bleiben im JSON und werden mitgesendet.",
    removeExtra: (p: string) => `${p} entfernen`,
    // JSON
    jsonOut: "JSON der Nachricht",
    jsonOutHint: "Genau dieser Body geht an Discord. Leere Felder sind schon entfernt.",
    download: "Herunterladen",
    jsonIn: "JSON importieren",
    jsonInHint: "Webhook-JSON, ein einzelnes Embed, eine Embed-Liste oder ein Discohook-Backup.",
    jsonInLabel: "JSON einfügen",
    importBtn: "Importieren",
    notes: {
      colorString: "Farben als Hex-Text wurden in Zahlen umgewandelt.",
      wrappedEmbed: "Einzelnes Embed erkannt und in eine Nachricht gepackt.",
      wrappedArray: "Liste von Embeds erkannt.",
      discohook: "Discohook-Format erkannt.",
      firstMessageOnly: "Nur die erste Nachricht aus dem Backup wurde übernommen.",
      receivedFieldsRemoved: "Felder, die nur Discord selbst setzt (z. B. proxy_url, width), wurden entfernt.",
    } as Record<ImportNote, string>,
    unknownKept: (n: number) => `${n} unbekannte${n === 1 ? "s Feld wurde" : " Felder wurden"} übernommen – siehe „Zusätzliche Felder“ im Editor.`,
    impErr: {
      empty: "Füge zuerst JSON ein.",
      syntax: (l?: number, c?: number) => (l ? `Ungültiges JSON in Zeile ${l}, Spalte ${c}.` : "Ungültiges JSON."),
      notObject: "Erwartet wird ein Objekt wie { \"content\": …, \"embeds\": [ … ] }.",
      types: "Diese Werte haben den falschen Typ:",
    },
    expected: { string: "Text", object: "Objekt { }", array: "Liste [ ]", color: "Farbe als Zahl (0–16777215) oder Hex", integer: "ganze Zahl" } as Record<string, string>,
    // send
    send: "Per Webhook senden",
    webhook: "Webhook-URL",
    webhookHint: "Wird nie gespeichert und geht nur direkt an Discord – nicht über unseren Server.",
    webhookBad: "Das ist keine Webhook-URL. Sie sieht so aus: https://discord.com/api/webhooks/123…/abc…",
    webhookToken: "Das sieht nach einem Discord-Token aus. Gib deinen Token niemals auf Websites ein!",
    webhookDead: "Discord kennt diesen Webhook nicht (mehr). Prüf die URL – wir versuchen es nicht erneut.",
    target: "Ziel",
    tChannel: "Kanal",
    tThread: "Thread",
    tForum: "Neuer Forumpost",
    threadId: "Thread-ID",
    threadIdHint: "Rechtsklick auf den Thread → „ID kopieren“ (Entwicklermodus).",
    threadIdBad: "Eine ID besteht aus 17–20 Ziffern.",
    threadName: "Titel des Forumposts",
    threadNameHint: "Erstellt im Forum- oder Medienkanal des Webhooks einen neuen Post.",
    silent: "Lautlos senden (@silent)",
    silentHint: "Keine Push-Benachrichtigung.",
    suppressEmbeds: "Embeds unterdrücken",
    suppressEmbedsHint: "Blendet alle Embeds und Link-Vorschauen aus.",
    mentions: "Erwähnungen erlauben",
    mentionsOffHint: "Aus: @everyone, @here, Rollen und Nutzer werden angezeigt, aber niemand wird gepingt.",
    mentionsOnHint: "An: Erwähnungen im Inhalt pingen wirklich – auch @everyone. In Embeds pingt nie jemand.",
    mentionsCustom: "Importierte allowed_mentions werden unverändert gesendet.",
    mentionsDetected: "Im Inhalt stehen Erwähnungen. Ohne „Erwähnungen erlauben“ wird niemand gepingt.",
    sendBtn: "Senden",
    sending: "Sende …",
    updateBtn: "Nachricht aktualisieren",
    updating: "Aktualisiere …",
    sendNew: "Als neue Nachricht senden",
    fixFirst: (n: number) => `Erst ${n} ${n === 1 ? "Fehler" : "Fehler"} beheben`,
    needWebhook: "Gib oben eine Webhook-URL ein.",
    waitRate: (s: number) => `Warte ${s} s`,
    sent: "Gesendet",
    sentToast: "Nachricht gesendet",
    updated: "Nachricht aktualisiert",
    msgId: "Nachrichten-ID",
    editThis: "Diese Nachricht bearbeiten",
    editing: (id: string) => `Du bearbeitest Nachricht ${id}.`,
    editingHint: "„Nachricht aktualisieren“ überschreibt sie. Name und Avatar lassen sich nachträglich nicht ändern.",
    stopEditing: "Bearbeiten beenden",
    load: "Vorhandene Nachricht laden",
    loadLabel: "Nachrichtenlink oder ID",
    loadHint: "Nur Nachrichten, die dieser Webhook gesendet hat. Danach kannst du sie bearbeiten.",
    loadBtn: "Laden",
    loading: "Lade …",
    loadBad: "Füge einen Nachrichtenlink (discord.com/channels/…) oder eine Nachrichten-ID ein.",
    errNetwork: "Keine Verbindung zu Discord. Bist du offline, oder blockiert ein Werbeblocker discord.com?",
    err400: "Discord hat die Nachricht abgelehnt.",
    errAuth: "Der Webhook-Token ist ungültig. Kopier die URL neu aus den Kanaleinstellungen.",
    errUnknownWebhook: "Diesen Webhook gibt es nicht (mehr). Er wurde vielleicht gelöscht.",
    errUnknownMessage: "Nachricht nicht gefunden. Sie muss von genau diesem Webhook stammen.",
    errUnknownChannel: "Thread oder Kanal nicht gefunden. Prüf die Thread-ID.",
    err404: "Nicht gefunden (404).",
    err429: (s: number) => `Zu viele Anfragen. Discord bittet, ${s} s zu warten. Wir senden nicht automatisch erneut.`,
    err5xx: (n: number) => `Discord hat gerade Probleme (Status ${n}). Versuch es später noch mal.`,
    errOther: (n: number) => `Unerwartete Antwort von Discord (Status ${n}).`,
    hintForum: "Das ist ein Forum- oder Medienkanal: Wähle als Ziel „Neuer Forumpost“ und gib einen Titel ein – oder sende in einen bestehenden Thread.",
    hintNotForum: "Forumposts gehen nur in Forum- und Medienkanälen. Wähle als Ziel „Kanal“.",
    rawResponse: "Antwort von Discord",
    autosave: "Entwurf auf diesem Gerät speichern",
    autosaveHint: "Speichert nur die Nachricht im Browser (localStorage) – nie die Webhook-URL.",
    toSend: "Zum Senden",
    paths: {
      content: "Inhalt", username: "Name", avatarUrl: "Avatar-URL", threadName: "Forumpost-Titel", flags: "Flags", embeds: "Embeds",
      authorName: "Autor", authorUrl: "Autor-Link", authorIcon: "Autor-Icon", title: "Titel", url: "Titel-Link", description: "Beschreibung",
      fields: "Felder", name: "Name", value: "Wert", thumbnail: "Thumbnail", image: "Bild", footerText: "Footer", footerIcon: "Footer-Icon",
      timestamp: "Zeitstempel", allowed_mentions: "Erwähnungen",
    } as Record<string, string>,
    issue: {
      tooLong: (n: number, max: number) => `${n.toLocaleString("de-DE")} von max. ${max.toLocaleString("de-DE")} Zeichen.`,
      required: "Darf nicht leer sein.",
      badUrl: "Muss eine vollständige URL mit https:// sein.",
      attachmentUrl: "attachment:// geht hier nicht – Datei-Uploads kann der Builder nicht. Nimm eine https-URL.",
      tooManyEmbeds: (n: number, max: number) => `${n} Embeds – erlaubt sind ${max}.`,
      tooManyFields: (n: number, max: number) => `${n} Felder – erlaubt sind ${max}.`,
      total: (n: number, max: number) => `Alle Embeds zusammen: ${n.toLocaleString("de-DE")} von max. ${max.toLocaleString("de-DE")} Zeichen.`,
      emptyEmbed: "Leeres Embed – wird nicht mitgesendet.",
      emptyField: "Leeres Feld – wird nicht mitgesendet.",
      emptyMessage: "Die Nachricht ist leer. Schreib einen Inhalt oder füll ein Embed aus.",
      authorNeedsName: "Autor-Link und -Icon erscheinen nur mit Autor-Name.",
      footerIconNeedsText: "Das Footer-Icon erscheint nur mit Footer-Text.",
      badTimestamp: "Ungültiger Zeitstempel.",
      usernameForbidden: "Discord verbietet „discord“, „clyde“, „everyone“ und „here“ im Namen.",
      token: "Sieht aus wie ein Discord-Token. Poste niemals Tokens!",
      webhookInText: "Hier steht eine Webhook-URL. Jeder, der sie sieht, kann über den Webhook posten.",
      componentsV2: "Die Nachricht nutzt Components V2. Die kann der Editor nicht bearbeiten, sie bleiben im JSON.",
      componentsV2Content: "Mit Components V2 sind Inhalt und Embeds nicht erlaubt.",
    },
  },
  en: {
    locale: "en-US",
    editor: "Editor",
    json: "JSON",
    view: "View",
    template: "Load template …",
    templateLabel: "Template",
    share: "Share link",
    clear: "Clear",
    undo: "Undo",
    dismiss: "Dismiss",
    loadedTemplate: (n: string) => `Template “${n}” loaded.`,
    cleared: "Message cleared.",
    imported: "JSON imported.",
    loadedShared: "Shared message loaded.",
    loadedMessage: "Message loaded from Discord.",
    restored: "Saved draft restored.",
    badShare: "The shared link is broken or incomplete and could not be loaded.",
    shareCopied: "Link copied – without the webhook URL",
    shareLong: (n: number) => `The link is ${n.toLocaleString("en-US")} characters long. Some apps cut links that long – share the JSON instead.`,
    copyFail: "Copy failed",
    edit: "Edit",
    preview: "Preview",
    previewLabel: "Preview – may differ slightly from real Discord",
    previewNote: "Fonts, image sizes and line breaks can look slightly different in Discord.",
    suppressedNote: "Embeds are suppressed (flag 4) and won't show in Discord.",
    defaultName: "Webhook",
    message: "Message",
    content: "Content",
    contentHint: "Markdown works: **bold**, *italic*, `code`, > quote, # heading, <t:1700000000:R>",
    username: "Name",
    usernameHint: "Overrides the webhook name for this message only.",
    avatarUrl: "Avatar URL",
    embeds: "Embeds",
    embedsChars: (n: number) => `${n.toLocaleString("en-US")} / 6,000 characters`,
    embed: (i: number) => `Embed ${i}`,
    emptySummary: "empty",
    chars: (n: number) => `${n.toLocaleString("en-US")} ch.`,
    addEmbed: "Add embed",
    noEmbeds: "No embed yet. A message can have up to 10 embeds.",
    moveUp: "Move up",
    moveDown: "Move down",
    duplicate: "Duplicate",
    remove: "Delete",
    expand: "Expand",
    color: "Color",
    colorPicker: "Color picker",
    noColor: "None",
    noColorLabel: "No color (default)",
    gAuthor: "Author",
    authorName: "Author name",
    authorUrl: "Author link",
    authorIcon: "Author icon URL",
    gBody: "Body",
    title: "Title",
    titleUrl: "Title link",
    description: "Description",
    gFields: "Fields",
    field: (i: number) => `Field ${i}`,
    fieldName: "Name",
    fieldValue: "Value",
    inline: "Side by side (inline)",
    addField: "Add field",
    gImages: "Images",
    thumbnail: "Thumbnail URL (small, right)",
    image: "Image URL (large, bottom)",
    gFooter: "Footer",
    footerText: "Footer text",
    footerIcon: "Footer icon URL",
    timestamp: "Timestamp",
    timestampHint: "Every reader sees it in their own time zone.",
    now: "Now",
    clearTs: "Remove timestamp",
    issuesTitle: (e: number, w: number) => [e && `${e} ${e === 1 ? "error" : "errors"}`, w && `${w} ${w === 1 ? "note" : "notes"}`].filter(Boolean).join(" · "),
    allGood: "Everything within Discord's limits",
    extrasTitle: "Extra fields",
    extrasHint: "The editor can't edit these fields. They stay in the JSON and are sent along.",
    removeExtra: (p: string) => `Remove ${p}`,
    jsonOut: "Message JSON",
    jsonOutHint: "This exact body goes to Discord. Empty fields are already removed.",
    download: "Download",
    jsonIn: "Import JSON",
    jsonInHint: "Webhook JSON, a single embed, a list of embeds or a Discohook backup.",
    jsonInLabel: "Paste JSON",
    importBtn: "Import",
    notes: {
      colorString: "Hex color strings were converted to numbers.",
      wrappedEmbed: "Single embed detected and wrapped in a message.",
      wrappedArray: "List of embeds detected.",
      discohook: "Discohook format detected.",
      firstMessageOnly: "Only the first message of the backup was imported.",
      receivedFieldsRemoved: "Fields only Discord sets (e.g. proxy_url, width) were removed.",
    } as Record<ImportNote, string>,
    unknownKept: (n: number) => `${n} unknown field${n === 1 ? " was" : "s were"} kept – see “Extra fields” in the editor.`,
    impErr: {
      empty: "Paste some JSON first.",
      syntax: (l?: number, c?: number) => (l ? `Invalid JSON at line ${l}, column ${c}.` : "Invalid JSON."),
      notObject: "Expected an object like { \"content\": …, \"embeds\": [ … ] }.",
      types: "These values have the wrong type:",
    },
    expected: { string: "text", object: "object { }", array: "list [ ]", color: "color as a number (0–16777215) or hex", integer: "whole number" } as Record<string, string>,
    send: "Send via webhook",
    webhook: "Webhook URL",
    webhookHint: "Never stored and only sent straight to Discord – not through our server.",
    webhookBad: "That's not a webhook URL. It looks like https://discord.com/api/webhooks/123…/abc…",
    webhookToken: "That looks like a Discord token. Never enter your token on websites!",
    webhookDead: "Discord doesn't know this webhook (any more). Check the URL – we won't try again.",
    target: "Target",
    tChannel: "Channel",
    tThread: "Thread",
    tForum: "New forum post",
    threadId: "Thread ID",
    threadIdHint: "Right-click the thread → “Copy ID” (developer mode).",
    threadIdBad: "An ID has 17–20 digits.",
    threadName: "Forum post title",
    threadNameHint: "Creates a new post in the webhook's forum or media channel.",
    silent: "Send silently (@silent)",
    silentHint: "No push notification.",
    suppressEmbeds: "Suppress embeds",
    suppressEmbedsHint: "Hides all embeds and link previews.",
    mentions: "Allow mentions",
    mentionsOffHint: "Off: @everyone, @here, roles and users are shown, but nobody gets pinged.",
    mentionsOnHint: "On: mentions in the content really ping – including @everyone. Embeds never ping.",
    mentionsCustom: "Imported allowed_mentions are sent unchanged.",
    mentionsDetected: "The content contains mentions. Without “Allow mentions” nobody gets pinged.",
    sendBtn: "Send",
    sending: "Sending …",
    updateBtn: "Update message",
    updating: "Updating …",
    sendNew: "Send as new message",
    fixFirst: (n: number) => `Fix ${n} ${n === 1 ? "error" : "errors"} first`,
    needWebhook: "Enter a webhook URL above.",
    waitRate: (s: number) => `Wait ${s} s`,
    sent: "Sent",
    sentToast: "Message sent",
    updated: "Message updated",
    msgId: "Message ID",
    editThis: "Edit this message",
    editing: (id: string) => `You're editing message ${id}.`,
    editingHint: "“Update message” overwrites it. Name and avatar can't be changed afterwards.",
    stopEditing: "Stop editing",
    load: "Load existing message",
    loadLabel: "Message link or ID",
    loadHint: "Only messages sent by this webhook. You can edit them afterwards.",
    loadBtn: "Load",
    loading: "Loading …",
    loadBad: "Paste a message link (discord.com/channels/…) or a message ID.",
    errNetwork: "Can't reach Discord. Are you offline, or is an ad blocker blocking discord.com?",
    err400: "Discord rejected the message.",
    errAuth: "The webhook token is invalid. Copy the URL again from the channel settings.",
    errUnknownWebhook: "This webhook doesn't exist (any more). It may have been deleted.",
    errUnknownMessage: "Message not found. It has to come from this exact webhook.",
    errUnknownChannel: "Thread or channel not found. Check the thread ID.",
    err404: "Not found (404).",
    err429: (s: number) => `Too many requests. Discord asks you to wait ${s} s. We won't resend automatically.`,
    err5xx: (n: number) => `Discord is having problems (status ${n}). Try again later.`,
    errOther: (n: number) => `Unexpected response from Discord (status ${n}).`,
    hintForum: "This is a forum or media channel: pick “New forum post” as the target and enter a title – or send into an existing thread.",
    hintNotForum: "Forum posts only work in forum and media channels. Pick “Channel” as the target.",
    rawResponse: "Discord's response",
    autosave: "Save draft on this device",
    autosaveHint: "Stores only the message in your browser (localStorage) – never the webhook URL.",
    toSend: "Go to send",
    paths: {
      content: "Content", username: "Name", avatarUrl: "Avatar URL", threadName: "Forum post title", flags: "Flags", embeds: "Embeds",
      authorName: "Author", authorUrl: "Author link", authorIcon: "Author icon", title: "Title", url: "Title link", description: "Description",
      fields: "Fields", name: "Name", value: "Value", thumbnail: "Thumbnail", image: "Image", footerText: "Footer", footerIcon: "Footer icon",
      timestamp: "Timestamp", allowed_mentions: "Mentions",
    } as Record<string, string>,
    issue: {
      tooLong: (n: number, max: number) => `${n.toLocaleString("en-US")} of max. ${max.toLocaleString("en-US")} characters.`,
      required: "Can't be empty.",
      badUrl: "Must be a full URL starting with https://.",
      attachmentUrl: "attachment:// doesn't work here – the builder can't upload files. Use an https URL.",
      tooManyEmbeds: (n: number, max: number) => `${n} embeds – the limit is ${max}.`,
      tooManyFields: (n: number, max: number) => `${n} fields – the limit is ${max}.`,
      total: (n: number, max: number) => `All embeds together: ${n.toLocaleString("en-US")} of max. ${max.toLocaleString("en-US")} characters.`,
      emptyEmbed: "Empty embed – it won't be sent.",
      emptyField: "Empty field – it won't be sent.",
      emptyMessage: "The message is empty. Write some content or fill in an embed.",
      authorNeedsName: "Author link and icon only show with an author name.",
      footerIconNeedsText: "The footer icon only shows with footer text.",
      badTimestamp: "Invalid timestamp.",
      usernameForbidden: "Discord doesn't allow “discord”, “clyde”, “everyone” or “here” in the name.",
      token: "Looks like a Discord token. Never post tokens!",
      webhookInText: "This contains a webhook URL. Anyone who sees it can post through the webhook.",
      componentsV2: "This message uses Components V2. The editor can't edit them; they stay in the JSON.",
      componentsV2Content: "Content and embeds aren't allowed together with Components V2.",
    },
  },
};
type S = (typeof L)["de"];

const PRESETS: { hex: number; name: string }[] = [
  { hex: 0x5865f2, name: "Blurple" },
  { hex: 0x57f287, name: "Green" },
  { hex: 0xfee75c, name: "Yellow" },
  { hex: 0xed4245, name: "Red" },
  { hex: 0xeb459e, name: "Fuchsia" },
  { hex: 0x3ee0a8, name: "Mint" },
  { hex: 0xffffff, name: "White" },
  { hex: 0x23272a, name: "Dark" },
];

const DRAFT_KEY = "dt-embed-builder-draft";
const AUTOSAVE_KEY = "dt-embed-builder-autosave";
const MENTION_RE = /@everyone|@here|<@[!&]?\d{17,20}>/;

type Target = "channel" | "thread" | "forum";
type Op = "send" | "edit" | "load";
type Status =
  | { kind: "idle" }
  | { kind: "pending"; op: Op }
  | { kind: "ok"; op: Op; messageId: string }
  | { kind: "error"; op: Op; title: string; hint?: string; list?: { label: string; message: string }[]; raw?: string };
interface MsgTarget { messageId: string; threadId?: string }

const val = (e: Event) => (e.currentTarget as HTMLInputElement).value;
const domId = (path: string) => {
  if (/^embeds\.\d+\.fields\.\d+$/.test(path)) return `eb-${path.replace(/\./g, "-")}-name`;
  if (/^embeds\.\d+\.fields$/.test(path)) return `eb-${path.replace(/\./g, "-")}-add`;
  if (path === "flags") return "eb-extras";
  return `eb-${path.replace(/\./g, "-")}`;
};

function pathLabel(path: string, s: S): string {
  const parts = path.split(".");
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (p === "embeds" && /^\d+$/.test(parts[i + 1] ?? "")) {
      out.push(s.embed(+parts[i + 1] + 1));
      i++;
    } else if (p === "fields" && /^\d+$/.test(parts[i + 1] ?? "")) {
      out.push(s.field(+parts[i + 1] + 1));
      i++;
    } else out.push(s.paths[p] ?? p);
  }
  return out.join(" › ");
}

function issueText(i: Issue, s: S): string {
  const m = s.issue[i.code];
  return typeof m === "function" ? m(i.n ?? 0, i.max ?? 0) : m;
}

/* ------------------------------------------------------------ small pieces */

function Counter({ n, max, always, locale }: { n: number; max: number; always?: boolean; locale: string }) {
  if (!always && n < max * 0.8) return null;
  const cls = n > max ? "eb-count over" : n >= max * 0.9 ? "eb-count warn" : "eb-count";
  return <span class={cls} aria-live={n > max ? "polite" : undefined}>{n.toLocaleString(locale)} / {max.toLocaleString(locale)}</span>;
}

function Messages({ id, issues, s }: { id: string; issues: Issue[]; s: S }) {
  if (!issues.length) return null;
  return (
    <div id={`${id}-msg`} class="eb-msgs">
      {issues.map((i, k) => (
        <p key={k} class={i.level === "error" ? "eb-err" : "eb-warn"}>
          <Icon name={i.level === "error" ? "TriangleAlert" : "Info"} size={14} />
          <span>{issueText(i, s)}</span>
        </p>
      ))}
    </div>
  );
}

interface TextProps {
  path: string;
  label: string;
  value: string;
  onInput: (v: string) => void;
  issues: Issue[];
  s: S;
  max?: number;
  always?: boolean;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
  hint?: ComponentChildren;
  mono?: boolean;
  url?: boolean;
}

function TextInput(p: TextProps) {
  const id = domId(p.path);
  const mine = p.issues.filter((i) => i.path === p.path);
  const invalid = mine.some((i) => i.level === "error");
  const describedBy = [mine.length ? `${id}-msg` : "", p.hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined;
  const common = {
    id,
    class: `${p.multiline ? "textarea" : "input"}${p.mono ? " mono" : ""}`,
    value: p.value,
    placeholder: p.placeholder,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
    onInput: (e: Event) => p.onInput(val(e)),
  };
  return (
    <div class="field">
      <div class="eb-label-row">
        <label for={id}>{p.label}</label>
        {p.max !== undefined && <Counter n={countChars(p.value)} max={p.max} always={p.always} locale={p.s.locale} />}
      </div>
      {p.multiline ? (
        <textarea {...common} rows={p.rows ?? 3} />
      ) : (
        <input
          {...common}
          type={(p.type ?? (p.url ? "url" : "text")) as "text"}
          autocomplete="off"
          spellcheck={p.url ? false : undefined}
          autocapitalize={p.url ? "off" : undefined}
          inputMode={p.url ? "url" : undefined}
        />
      )}
      {p.hint && <span class="hint" id={`${id}-hint`}>{p.hint}</span>}
      <Messages id={id} issues={mine} s={p.s} />
    </div>
  );
}

function ColorRow({ path, value, onChange, s }: { path: string; value: number | null; onChange: (v: number | null) => void; s: S }) {
  const id = domId(path);
  const [text, setText] = useState(value === null ? "" : intToHex(value).toUpperCase());
  useEffect(() => {
    if (hexToInt(text) !== value) setText(value === null ? "" : intToHex(value).toUpperCase());
  }, [value]);
  const bad = text.trim() !== "" && hexToInt(text) === null;
  return (
    <div class="field">
      <label for={id}>{s.color}</label>
      <div class="eb-color">
        <input
          type="color"
          class="eb-color-native"
          aria-label={s.colorPicker}
          value={value === null ? "#202225" : intToHex(value)}
          onInput={(e) => onChange(hexToInt(val(e)))}
        />
        <input
          id={id}
          class="input mono eb-hex"
          value={text}
          placeholder="#5865F2"
          maxLength={7}
          autocomplete="off"
          spellcheck={false}
          aria-invalid={bad || undefined}
          onInput={(e) => {
            const v = val(e);
            setText(v);
            if (!v.trim()) onChange(null);
            else {
              const n = hexToInt(v);
              if (n !== null) onChange(n);
            }
          }}
        />
        <div class="eb-swatches" role="group" aria-label={s.color}>
          {PRESETS.map((p) => (
            <button
              type="button"
              key={p.hex}
              class="eb-swatch"
              style={{ background: intToHex(p.hex) }}
              aria-label={`${p.name} ${intToHex(p.hex).toUpperCase()}`}
              aria-pressed={value === p.hex}
              title={intToHex(p.hex).toUpperCase()}
              onClick={() => onChange(p.hex)}
            />
          ))}
          <button type="button" class="eb-swatch eb-swatch-none" aria-label={s.noColorLabel} aria-pressed={value === null} title={s.noColorLabel} onClick={() => onChange(null)} />
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- embed card */

interface CardApi {
  set: (patch: Partial<DraftEmbed>) => void;
  setField: (j: number, patch: Partial<DraftField>) => void;
  addField: () => void;
  removeField: (j: number) => void;
  moveField: (j: number, dir: -1 | 1) => void;
  move: (dir: -1 | 1) => void;
  duplicate: () => void;
  remove: () => void;
  toggle: () => void;
}

function EmbedCard(props: { embed: DraftEmbed; index: number; count: number; open: boolean; issues: Issue[]; s: S; api: CardApi; canAdd: boolean }) {
  const { embed: e, index: i, count, open, issues, s, api } = props;
  const p = `embeds.${i}`;
  const mine = issues.filter((x) => x.path === p || x.path.startsWith(`${p}.`));
  const errs = mine.filter((x) => x.level === "error").length;
  const summary = e.title.trim() || e.authorName.trim() || e.description.trim().split("\n")[0] || (isEmbedEmpty(e) ? s.emptySummary : "…");
  const bodyId = `eb-${p.replace(".", "-")}-body`;
  const color = e.color === null ? "var(--border-strong)" : intToHex(e.color);
  const txt = (key: keyof DraftEmbed, label: string, extra: Partial<TextProps> = {}) => (
    <TextInput path={`${p}.${key}`} label={label} value={e[key] as string} onInput={(v) => api.set({ [key]: v })} issues={issues} s={s} {...extra} />
  );
  return (
    <div class={open ? "eb-card is-open" : "eb-card"} style={{ borderInlineStartColor: color }}>
      <div class="eb-card-head">
        <button type="button" id={domId(p)} class="eb-card-toggle" aria-expanded={open} aria-controls={bodyId} onClick={api.toggle}>
          <ChevronDown size={18} strokeWidth={1.75} aria-hidden="true" class="eb-chev" />
          <span class="eb-card-name">{s.embed(i + 1)}</span>
          <span class="eb-card-sum">{summary}</span>
          {errs > 0 && <span class="eb-badge" aria-label={s.issuesTitle(errs, 0)}>{errs}</span>}
          <span class="eb-card-chars">{s.chars(embedChars(e))}</span>
        </button>
        <div class="eb-card-actions">
          <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={`${s.embed(i + 1)}: ${s.moveUp}`} title={s.moveUp} disabled={i === 0} onClick={() => api.move(-1)}>
            <Icon name="ArrowUp" size={16} />
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={`${s.embed(i + 1)}: ${s.moveDown}`} title={s.moveDown} disabled={i === count - 1} onClick={() => api.move(1)}>
            <Icon name="ArrowDown" size={16} />
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={`${s.embed(i + 1)}: ${s.duplicate}`} title={s.duplicate} disabled={!props.canAdd} onClick={api.duplicate}>
            <CopyPlus size={16} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <button type="button" class="btn btn-ghost btn-sm btn-icon eb-del" aria-label={`${s.embed(i + 1)}: ${s.remove}`} title={s.remove} onClick={api.remove}>
            <Icon name="Trash2" size={16} />
          </button>
        </div>
      </div>
      {open && (
        <div class="eb-card-body" id={bodyId}>
          <Messages id={domId(p)} issues={issues.filter((x) => x.path === p)} s={s} />
          <ColorRow path={`${p}.color`} value={e.color} onChange={(c) => api.set({ color: c })} s={s} />

          <fieldset class="eb-group">
            <legend>{s.gAuthor}</legend>
            {txt("authorName", s.authorName, { max: LIMITS.author })}
            <div class="grid-2">
              {txt("authorUrl", s.authorUrl, { url: true, placeholder: "https://" })}
              {txt("authorIcon", s.authorIcon, { url: true, placeholder: "https://…/icon.png" })}
            </div>
          </fieldset>

          <fieldset class="eb-group">
            <legend>{s.gBody}</legend>
            {txt("title", s.title, { max: LIMITS.title })}
            {txt("url", s.titleUrl, { url: true, placeholder: "https://" })}
            {txt("description", s.description, { max: LIMITS.description, multiline: true, rows: 5 })}
          </fieldset>

          <fieldset class="eb-group">
            <legend>
              {s.gFields} <span class="eb-legend-count">{e.fields.length} / {LIMITS.fields}</span>
            </legend>
            <Messages id={domId(`${p}.fields`)} issues={issues.filter((x) => x.path === `${p}.fields`)} s={s} />
            {e.fields.map((f, j) => {
              const fp = `${p}.fields.${j}`;
              return (
                <div class="eb-fielditem" key={f.id}>
                  <div class="eb-fielditem-head">
                    <span class="eb-fielditem-title">{s.field(j + 1)}</span>
                    <div class="eb-card-actions">
                      <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={`${s.field(j + 1)}: ${s.moveUp}`} title={s.moveUp} disabled={j === 0} onClick={() => api.moveField(j, -1)}>
                        <Icon name="ArrowUp" size={16} />
                      </button>
                      <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={`${s.field(j + 1)}: ${s.moveDown}`} title={s.moveDown} disabled={j === e.fields.length - 1} onClick={() => api.moveField(j, 1)}>
                        <Icon name="ArrowDown" size={16} />
                      </button>
                      <button type="button" class="btn btn-ghost btn-sm btn-icon eb-del" aria-label={`${s.field(j + 1)}: ${s.remove}`} title={s.remove} onClick={() => api.removeField(j)}>
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                  <Messages id={`eb-${fp.replace(/\./g, "-")}`} issues={issues.filter((x) => x.path === fp)} s={s} />
                  <TextInput path={`${fp}.name`} label={s.fieldName} value={f.name} onInput={(v) => api.setField(j, { name: v })} issues={issues} s={s} max={LIMITS.fieldName} />
                  <TextInput path={`${fp}.value`} label={s.fieldValue} value={f.value} onInput={(v) => api.setField(j, { value: v })} issues={issues} s={s} max={LIMITS.fieldValue} multiline rows={2} />
                  <label class="check">
                    <input type="checkbox" checked={f.inline} onChange={(ev) => api.setField(j, { inline: (ev.currentTarget as HTMLInputElement).checked })} />
                    <span>{s.inline}</span>
                  </label>
                </div>
              );
            })}
            <div>
              <button type="button" id={domId(`${p}.fields`)} class="btn btn-sm" disabled={e.fields.length >= LIMITS.fields} onClick={api.addField}>
                <Icon name="Plus" size={16} /> {s.addField}
              </button>
            </div>
          </fieldset>

          <fieldset class="eb-group">
            <legend>{s.gImages}</legend>
            <div class="grid-2">
              {txt("thumbnail", s.thumbnail, { url: true, placeholder: "https://…/thumb.png" })}
              {txt("image", s.image, { url: true, placeholder: "https://…/bild.png" })}
            </div>
          </fieldset>

          <fieldset class="eb-group">
            <legend>{s.gFooter}</legend>
            {txt("footerText", s.footerText, { max: LIMITS.footer })}
            {txt("footerIcon", s.footerIcon, { url: true, placeholder: "https://…/icon.png" })}
            <div class="field">
              <label for={domId(`${p}.timestamp`)}>{s.timestamp}</label>
              <div class="eb-ts">
                <input
                  id={domId(`${p}.timestamp`)}
                  type="datetime-local"
                  class="input"
                  value={isoToLocalInput(e.timestamp)}
                  aria-describedby={`${domId(`${p}.timestamp`)}-hint`}
                  aria-invalid={issues.some((x) => x.path === `${p}.timestamp` && x.level === "error") || undefined}
                  onInput={(ev) => api.set({ timestamp: localInputToIso(val(ev)) })}
                />
                <button type="button" class="btn" onClick={() => api.set({ timestamp: new Date().toISOString() })}>
                  <Icon name="Clock" size={16} /> {s.now}
                </button>
                <button type="button" class="btn btn-icon" aria-label={s.clearTs} title={s.clearTs} disabled={!e.timestamp} onClick={() => api.set({ timestamp: "" })}>
                  <Icon name="X" size={16} />
                </button>
              </div>
              <span class="hint" id={`${domId(`${p}.timestamp`)}-hint`}>{s.timestampHint}</span>
              <Messages id={domId(`${p}.timestamp`)} issues={issues.filter((x) => x.path === `${p}.timestamp`)} s={s} />
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- the tool */

export default function EmbedBuilder({ lang }: { lang: Lang }) {
  const s = L[lang];
  const locale = lang === "de" ? "de-DE" : "en-US";
  const [draft, setDraft] = useState<Draft>(() => getTemplate("announcement", lang));
  const [open, setOpen] = useState<Set<string>>(() => new Set(draft.embeds.slice(0, 1).map((e) => e.id)));
  const [view, setView] = useState<"editor" | "json">("editor");
  const [pane, setPane] = useState<"edit" | "preview">("edit");
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const [undo, setUndo] = useState<{ draft: Draft; label: string } | null>(null);
  const [banner, setBanner] = useState<{ kind: "error" | "warn"; text: string } | null>(null);
  const [importText, setImportText] = useState("");
  const [importErr, setImportErr] = useState<ImportError | null>(null);
  const [importInfo, setImportInfo] = useState<string[]>([]);
  // sending (all of this lives in memory only)
  const [webhookUrl, setWebhookUrl] = useState("");
  const [target, setTarget] = useState<Target>("channel");
  const [threadId, setThreadId] = useState("");
  const [msgRef, setMsgRef] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [editing, setEditing] = useState<MsgTarget | null>(null);
  const [lastSent, setLastSent] = useState<MsgTarget | null>(null);
  const [rateUntil, setRateUntil] = useState(0);
  const [, setTick] = useState(0);
  const [dead, setDead] = useState<string | null>(null);
  const [autosave, setAutosave] = useState(false);
  const hashRef = useRef(false);
  const mounted = useRef(false);

  /* ---- load from hash / saved draft ---- */
  const adopt = (d: Draft, label: string | null, keepUndo = true) => {
    if (keepUndo && label) setUndo({ draft, label });
    setDraft(d);
    setOpen(new Set(d.embeds.slice(0, 1).map((e) => e.id)));
    if (d.threadName.trim()) setTarget("forum");
    else if (target === "forum") setTarget("channel");
  };

  const loadHash = async () => {
    if (!isShareHash(location.hash)) return false;
    const v = await decodeShare(location.hash);
    const r = v === null ? null : valueToDraft(v);
    if (!r || !r.ok) {
      setBanner({ kind: "error", text: s.badShare });
      return true;
    }
    adopt(r.draft, null, false);
    hashRef.current = true;
    toast(s.loadedShared);
    return true;
  };

  useEffect(() => {
    const on = readJson<boolean>(AUTOSAVE_KEY, false);
    setAutosave(on);
    loadHash().then((fromHash) => {
      if (fromHash || !on) return;
      const saved = readJson<unknown>(DRAFT_KEY, null);
      if (!saved) return;
      const r = valueToDraft(saved);
      if (r.ok) {
        adopt(r.draft, null, false);
        toast(s.restored);
      }
    });
    const onHash = () => void loadHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  /* ---- after edits: drop a stale share hash, autosave ---- */
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (hashRef.current) {
      hashRef.current = false; // first render after loading the hash
    } else if (isShareHash(location.hash)) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (!autosave) return;
    const t = setTimeout(() => writeJson(DRAFT_KEY, payloadForShare(draft)), 400);
    return () => clearTimeout(t);
  }, [draft, autosave]);

  const toggleAutosave = (on: boolean) => {
    setAutosave(on);
    writeJson(AUTOSAVE_KEY, on);
    if (on) writeJson(DRAFT_KEY, payloadForShare(draft));
    else {
      try {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(AUTOSAVE_KEY);
      } catch {
        /* storage blocked */
      }
    }
  };

  /* ---- rate-limit countdown ---- */
  useEffect(() => {
    if (rateUntil <= Date.now()) return;
    const t = setInterval(() => {
      setTick((n) => n + 1);
      if (Date.now() >= rateUntil) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [rateUntil]);
  const waitS = Math.max(0, Math.ceil((rateUntil - Date.now()) / 1000));

  /* ---- derived ---- */
  const eff: Draft = target === "forum" && !editing ? draft : { ...draft, threadName: "" };
  const issues = useMemo(() => validate(eff), [draft, target, editing]);
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const payload = useMemo(() => draftToPayload(eff), [draft, target, editing]);
  const json = useMemo(() => JSON.stringify(payload, null, 2), [payload]);
  const extras = listExtras(draft);
  const total = totalEmbedChars(draft);
  const webhook = parseWebhookUrl(webhookUrl);
  const webhookErr = !webhookUrl.trim() ? null : looksLikeToken(webhookUrl) ? s.webhookToken : !webhook ? s.webhookBad : dead === webhookUrl.trim() ? s.webhookDead : null;
  const threadBad = target === "thread" && !editing && !isSnowflake(threadId);
  const mentionsInContent = MENTION_RE.test(draft.content);

  /* ---- draft updates ---- */
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const setEmbeds = (fn: (list: DraftEmbed[]) => DraftEmbed[]) => setDraft((d) => ({ ...d, embeds: fn(d.embeds) }));
  const swap = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    const next = arr.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };
  const focusLater = (id: string) => requestAnimationFrame(() => document.getElementById(id)?.focus());

  const apiFor = (i: number, e: DraftEmbed): CardApi => ({
    set: (p) => setEmbeds((l) => l.map((x, k) => (k === i ? { ...x, ...p } : x))),
    setField: (j, p) => setEmbeds((l) => l.map((x, k) => (k === i ? { ...x, fields: x.fields.map((f, m) => (m === j ? { ...f, ...p } : f)) } : x))),
    addField: () => {
      setEmbeds((l) => l.map((x, k) => (k === i ? { ...x, fields: [...x.fields, emptyField()] } : x)));
      focusLater(domId(`embeds.${i}.fields.${e.fields.length}`));
    },
    removeField: (j) => setEmbeds((l) => l.map((x, k) => (k === i ? { ...x, fields: x.fields.filter((_, m) => m !== j) } : x))),
    moveField: (j, dir) => {
      setEmbeds((l) => l.map((x, k) => (k === i ? { ...x, fields: swap(x.fields, j, dir) } : x)));
      focusLater(domId(`embeds.${i}.fields.${j + dir}`));
    },
    move: (dir) => {
      setEmbeds((l) => swap(l, i, dir));
      focusLater(domId(`embeds.${i + dir}`));
    },
    duplicate: () => {
      const c = cloneEmbed(e);
      setEmbeds((l) => [...l.slice(0, i + 1), c, ...l.slice(i + 1)]);
      setOpen((o) => new Set(o).add(c.id));
    },
    remove: () => {
      setEmbeds((l) => l.filter((_, k) => k !== i));
      focusLater(draft.embeds.length > 1 ? domId(`embeds.${Math.max(0, i - 1)}`) : "eb-add-embed");
    },
    toggle: () =>
      setOpen((o) => {
        const n = new Set(o);
        if (n.has(e.id)) n.delete(e.id);
        else n.add(e.id);
        return n;
      }),
  });

  const addEmbed = () => {
    const e = emptyEmbed();
    setEmbeds((l) => [...l, e]);
    setOpen((o) => new Set(o).add(e.id));
    focusLater(domId(`embeds.${draft.embeds.length}`));
  };

  const focusIssue = (path: string) => {
    setView("editor");
    setPane("edit");
    const m = path.match(/^embeds\.(\d+)/);
    if (m && draft.embeds[+m[1]]) setOpen((o) => new Set(o).add(draft.embeds[+m[1]].id));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const el = document.getElementById(domId(path)) ?? document.getElementById(domId(path.split(".").slice(0, 2).join(".")));
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        el?.focus({ preventScroll: true });
      }),
    );
  };

  /* ---- toolbar actions ---- */
  const loadTemplate = (id: TemplateId) => {
    const name = templateNames(lang)[id];
    adopt(getTemplate(id, lang), s.loadedTemplate(name));
    setEditing(null);
  };
  const clearAll = () => {
    const d = emptyDraft();
    d.embeds = [emptyEmbed()];
    adopt(d, s.cleared);
    setEditing(null);
  };

  const share = async () => {
    const h = await encodeShare(payloadForShare(eff));
    const url = `${location.origin}${location.pathname}${location.search}#${h}`;
    history.replaceState(null, "", url);
    hashRef.current = false;
    setBanner(url.length > SHARE_WARN_CHARS ? { kind: "warn", text: s.shareLong(url.length) } : null);
    await copyText(url, s.shareCopied, s.copyFail);
  };

  const doImport = () => {
    const r = importJson(importText);
    if (!r.ok) {
      setImportErr(r.error);
      setImportInfo([]);
      return;
    }
    setImportErr(null);
    adopt(r.draft, s.imported);
    setEditing(null);
    setImportInfo([...r.notes.map((n) => s.notes[n]), ...(r.unknown.length ? [s.unknownKept(r.unknown.length)] : [])]);
    toast(s.imported);
  };

  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = "discord-message.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  /* ---- network ---- */
  async function request(op: Op, method: "GET" | "POST" | "PATCH", url: string, body?: unknown): Promise<Record<string, unknown> | null> {
    setStatus({ kind: "pending", op });
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
    } catch {
      setStatus({ kind: "error", op, title: s.errNetwork });
      return null;
    }
    const text = await res.text().catch(() => "");
    let data: Record<string, unknown> | null = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      /* not JSON */
    }
    if (res.ok) return data ?? {};
    const code = typeof data?.code === "number" ? data.code : undefined;
    const raw = text ? (data ? JSON.stringify(data, null, 2) : text.slice(0, 2000)) : undefined;
    let title = s.errOther(res.status);
    let hint: string | undefined;
    let list: { label: string; message: string }[] | undefined;
    if (res.status === 429) {
      const ra = Number(data?.retry_after ?? res.headers.get("Retry-After") ?? 2);
      const secs = Math.max(1, Math.ceil(isFinite(ra) ? ra : 2));
      setRateUntil(Date.now() + secs * 1000);
      title = s.err429(secs);
    } else if (res.status === 401 || res.status === 403) {
      title = s.errAuth;
    } else if (res.status === 404) {
      if (code === 10015) {
        title = s.errUnknownWebhook;
        setDead(webhookUrl.trim());
      } else if (code === 10008) title = s.errUnknownMessage;
      else if (code === 10003) title = s.errUnknownChannel;
      else title = s.err404;
    } else if (res.status === 400) {
      title = s.err400;
      list = flattenDiscordErrors(data).map((e) => ({ label: pathLabel(discordPathToDraft(e.path), s), message: e.message }));
      if (!list.length && typeof data?.message === "string") list = [{ label: code ? `Code ${code}` : "Discord", message: data.message }];
      if (code === 220001) hint = s.hintForum;
      if (code === 220003) hint = s.hintNotForum;
    } else if (res.status >= 500) {
      title = s.err5xx(res.status);
    }
    setStatus({ kind: "error", op, title, hint, list, raw });
    return null;
  }

  const busy = status.kind === "pending";
  const canSend = !!webhook && !webhookErr && errors.length === 0 && !busy && waitS === 0;

  const send = async () => {
    if (!webhook || !canSend || threadBad) return;
    const url = withQuery(webhookEndpoint(webhook), { wait: "true", thread_id: target === "thread" ? threadId.trim() : undefined });
    const data = await request("send", "POST", url, draftToPayload(eff));
    if (!data || typeof data.id !== "string") return;
    const thread = target === "thread" ? threadId.trim() : target === "forum" && typeof data.channel_id === "string" ? data.channel_id : undefined;
    setLastSent({ messageId: data.id, threadId: thread });
    setStatus({ kind: "ok", op: "send", messageId: data.id });
    toast(s.sentToast);
  };

  const update = async () => {
    if (!webhook || !editing || !canSend) return;
    const url = withQuery(webhookEndpoint(webhook, editing.messageId), { thread_id: editing.threadId });
    const data = await request("edit", "PATCH", url, draftToEditPayload(eff));
    if (!data) return;
    setStatus({ kind: "ok", op: "edit", messageId: editing.messageId });
    toast(s.updated);
  };

  const loadMessage = async () => {
    const ref = parseMessageRef(msgRef);
    if (!webhook || webhookErr) return;
    if (!ref) {
      setStatus({ kind: "error", op: "load", title: s.loadBad });
      return;
    }
    const manualThread = target === "thread" && isSnowflake(threadId) ? threadId.trim() : undefined;
    let thread = manualThread;
    // Try without a thread first; if the link points into a thread, Discord needs ?thread_id.
    let res = await request("load", "GET", withQuery(webhookEndpoint(webhook, ref.messageId), { thread_id: thread }));
    if (!res && !thread && ref.channelId) {
      thread = ref.channelId;
      res = await request("load", "GET", withQuery(webhookEndpoint(webhook, ref.messageId), { thread_id: thread }));
      if (!res) return;
    }
    if (!res) return;
    const r = messageToDraft(res);
    if (!r.ok) {
      setStatus({ kind: "error", op: "load", title: s.impErr.types, list: r.error.code === "types" ? r.error.problems.map((p) => ({ label: p.path, message: p.expected })) : undefined });
      return;
    }
    adopt(r.draft, s.loadedMessage);
    if (thread) {
      setTarget("thread");
      setThreadId(thread);
    }
    setEditing({ messageId: ref.messageId, threadId: thread });
    setStatus({ kind: "ok", op: "load", messageId: ref.messageId });
    toast(s.loadedMessage);
  };

  const onWebhookInput = (v: string) => {
    setWebhookUrl(v);
    const w = parseWebhookUrl(v);
    if (w?.threadId) {
      setTarget("thread");
      setThreadId(w.threadId);
    }
    if (status.kind === "error") setStatus({ kind: "idle" });
  };

  /* ---- preview ---- */
  const previewEmbeds = (payload.embeds as Embed[] | undefined) ?? [];
  const previewMsg = {
    username: draft.username.trim() || s.defaultName,
    avatarUrl: draft.avatarUrl.trim() || undefined,
    tag: "APP",
    content: draft.content,
    embeds: draft.suppressEmbeds ? [] : previewEmbeds,
  };

  /* ---- render ---- */
  const editorView = (
    <div class="stack">
      <section class="panel stack" aria-labelledby="eb-msg-title">
        <h2 class="panel-title" id="eb-msg-title">{s.message}</h2>
        <TextInput path="content" label={s.content} value={draft.content} onInput={(v) => patch({ content: v })} issues={issues} s={s} max={LIMITS.content} always multiline rows={4} hint={s.contentHint} />
        <div class="grid-2">
          <TextInput path="username" label={s.username} value={draft.username} onInput={(v) => patch({ username: v })} issues={issues} s={s} max={LIMITS.username} placeholder={s.defaultName} hint={s.usernameHint} />
          <TextInput path="avatarUrl" label={s.avatarUrl} value={draft.avatarUrl} onInput={(v) => patch({ avatarUrl: v })} issues={issues} s={s} url placeholder="https://…/avatar.png" />
        </div>
      </section>

      <section class="stack" aria-labelledby="eb-embeds">
        <div class="eb-section-head">
          <h2 class="panel-title" id="eb-embeds" tabIndex={-1}>
            {s.embeds} <span class="eb-legend-count">{draft.embeds.length} / {LIMITS.embeds}</span>
          </h2>
          <span class={total > LIMITS.embedTotal ? "eb-count over" : total > LIMITS.embedTotal * 0.9 ? "eb-count warn" : "eb-count"}>{s.embedsChars(total)}</span>
        </div>
        <Messages id="eb-embeds" issues={issues.filter((i) => i.path === "embeds")} s={s} />
        {draft.embeds.length === 0 && <p class="notice">{s.noEmbeds}</p>}
        {draft.embeds.map((e, i) => (
          <EmbedCard key={e.id} embed={e} index={i} count={draft.embeds.length} open={open.has(e.id)} issues={issues} s={s} api={apiFor(i, e)} canAdd={draft.embeds.length < LIMITS.embeds} />
        ))}
        <button type="button" id="eb-add-embed" class="btn eb-add" disabled={draft.embeds.length >= LIMITS.embeds} onClick={addEmbed}>
          <Icon name="Plus" size={17} /> {s.addEmbed} ({draft.embeds.length}/{LIMITS.embeds})
        </button>
      </section>

      {extras.length > 0 && (
        <section class="panel stack" id="eb-extras" tabIndex={-1} aria-labelledby="eb-extras-title">
          <h2 class="panel-title" id="eb-extras-title">{s.extrasTitle}</h2>
          <p class="hint eb-m0">{s.extrasHint}</p>
          <Messages id="eb-flags" issues={issues.filter((i) => i.path === "flags")} s={s} />
          <ul class="eb-extras">
            {extras.map((p) => (
              <li key={p}>
                <code>{p}</code>
                <button type="button" class="btn btn-ghost btn-sm btn-icon eb-del" aria-label={s.removeExtra(p)} title={s.removeExtra(p)} onClick={() => setDraft((d) => removeUnknown(d, p))}>
                  <Icon name="X" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );

  const jsonView = (
    <div class="stack">
      <section class="panel stack" aria-labelledby="eb-json-out">
        <div class="eb-section-head">
          <h2 class="panel-title eb-m0" id="eb-json-out">{s.jsonOut}</h2>
          <div class="row">
            <button type="button" class="btn btn-sm" onClick={download}>
              <Icon name="Download" size={15} /> {s.download}
            </button>
            <CopyButton text={json} lang={lang} size="sm" />
          </div>
        </div>
        <p class="hint eb-m0">{s.jsonOutHint}</p>
        <pre class="eb-json" tabIndex={0} aria-labelledby="eb-json-out"><code>{json}</code></pre>
      </section>
      <section class="panel stack" aria-labelledby="eb-json-in">
        <h2 class="panel-title eb-m0" id="eb-json-in">{s.jsonIn}</h2>
        <div class="field">
          <label for="eb-import">{s.jsonInLabel}</label>
          <textarea
            id="eb-import"
            class="textarea mono eb-import"
            rows={8}
            spellcheck={false}
            autocapitalize="off"
            value={importText}
            placeholder='{ "content": "Hallo", "embeds": [ { "title": "…" } ] }'
            aria-invalid={importErr ? true : undefined}
            aria-describedby="eb-import-hint eb-import-msg"
            onInput={(e) => setImportText(val(e))}
          />
          <span class="hint" id="eb-import-hint">{s.jsonInHint}</span>
        </div>
        <div id="eb-import-msg" aria-live="polite">
          {importErr && (
            <div class="notice error">
              {importErr.code === "empty" && s.impErr.empty}
              {importErr.code === "notObject" && s.impErr.notObject}
              {importErr.code === "syntax" && (
                <>
                  <strong>{s.impErr.syntax(importErr.line, importErr.col)}</strong>
                  <div class="eb-detail mono">{importErr.detail}</div>
                </>
              )}
              {importErr.code === "types" && (
                <>
                  <strong>{s.impErr.types}</strong>
                  <ul class="eb-list">
                    {importErr.problems.map((p, k) => (
                      <li key={k}>
                        <code>{p.path}</code> → {s.expected[p.expected] ?? p.expected}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          {!importErr && importInfo.length > 0 && (
            <div class="notice">
              <ul class="eb-list">
                {importInfo.map((t, k) => <li key={k}>{t}</li>)}
              </ul>
            </div>
          )}
        </div>
        <div>
          <button type="button" class="btn btn-primary" onClick={doImport}>
            <Icon name="Upload" size={17} /> {s.importBtn}
          </button>
        </div>
      </section>
    </div>
  );

  const sendLabel = busy && status.op === "send" ? s.sending : waitS ? s.waitRate(waitS) : errors.length ? s.fixFirst(errors.length) : s.sendBtn;
  const sendPanel = (
    <section class="panel stack eb-send" id="eb-send" aria-labelledby="eb-send-title">
      <h2 class="panel-title eb-m0" id="eb-send-title">
        <span class="eb-title-icon"><Icon name="Webhook" size={16} /> {s.send}</span>
      </h2>
      <div class="field">
        <label for="eb-webhook">{s.webhook}</label>
        <input
          id="eb-webhook"
          class="input mono"
          type="url"
          inputMode="url"
          autocomplete="off"
          spellcheck={false}
          autocapitalize="off"
          placeholder="https://discord.com/api/webhooks/…"
          value={webhookUrl}
          aria-invalid={webhookErr ? true : undefined}
          aria-describedby="eb-webhook-hint eb-webhook-msg"
          onInput={(e) => onWebhookInput(val(e))}
        />
        <span class="hint eb-lock" id="eb-webhook-hint"><Icon name="Lock" size={13} /> {s.webhookHint}</span>
        <div id="eb-webhook-msg">{webhookErr && <p class="eb-err"><Icon name="TriangleAlert" size={14} /><span>{webhookErr}</span></p>}</div>
      </div>

      {editing ? (
        <div class="notice eb-editing" role="status">
          <Icon name="Pencil" size={16} />
          <div>
            <strong>{s.editing(editing.messageId)}</strong>
            <div class="hint">{s.editingHint}</div>
          </div>
          <button type="button" class="btn btn-sm" onClick={() => setEditing(null)}>{s.stopEditing}</button>
        </div>
      ) : (
        <>
          <div class="field">
            <span class="label" id="eb-target-label">{s.target}</span>
            <div class="segmented eb-target" role="group" aria-labelledby="eb-target-label">
              {(["channel", "thread", "forum"] as Target[]).map((t) => (
                <button type="button" key={t} aria-pressed={target === t} onClick={() => setTarget(t)}>
                  {t === "channel" ? s.tChannel : t === "thread" ? s.tThread : s.tForum}
                </button>
              ))}
            </div>
          </div>
          {target === "thread" && (
            <div class="field">
              <label for="eb-threadId">{s.threadId}</label>
              <input
                id="eb-threadId"
                class="input mono"
                type="text"
                inputMode="numeric"
                autocomplete="off"
                spellcheck={false}
                placeholder="123456789012345678"
                value={threadId}
                aria-invalid={threadId.trim() && threadBad ? true : undefined}
                aria-describedby="eb-threadId-hint"
                onInput={(e) => setThreadId(val(e).replace(/\s/g, ""))}
              />
              <span class="hint" id="eb-threadId-hint">{threadId.trim() && threadBad ? s.threadIdBad : s.threadIdHint}</span>
            </div>
          )}
          {target === "forum" && (
            <TextInput path="threadName" label={s.threadName} value={draft.threadName} onInput={(v) => patch({ threadName: v })} issues={issues} s={s} max={THREAD_NAME_MAX} always hint={s.threadNameHint} />
          )}
        </>
      )}

      <div class="eb-checks">
        <label class="check">
          <input type="checkbox" checked={draft.suppressNotifications} disabled={!!editing} onChange={(e) => patch({ suppressNotifications: (e.currentTarget as HTMLInputElement).checked })} />
          <span>{s.silent} <span class="hint">– {s.silentHint}</span></span>
        </label>
        <label class="check">
          <input type="checkbox" checked={draft.suppressEmbeds} onChange={(e) => patch({ suppressEmbeds: (e.currentTarget as HTMLInputElement).checked })} />
          <span>{s.suppressEmbeds} <span class="hint">– {s.suppressEmbedsHint}</span></span>
        </label>
        <label class="check">
          <input type="checkbox" checked={draft.allowMentions} onChange={(e) => patch({ allowMentions: (e.currentTarget as HTMLInputElement).checked, mentionsCustom: null })} />
          <span>{s.mentions}</span>
        </label>
        <p class={draft.allowMentions ? "hint eb-m0 eb-mention-on" : "hint eb-m0"}>
          {draft.allowMentions ? (draft.mentionsCustom ? s.mentionsCustom : s.mentionsOnHint) : mentionsInContent ? s.mentionsDetected : s.mentionsOffHint}
        </p>
      </div>

      <div class="row">
        {editing ? (
          <>
            <button type="button" class="btn btn-primary" disabled={!canSend} onClick={update}>
              <Icon name="RefreshCw" size={17} /> {busy && status.op === "edit" ? s.updating : waitS ? s.waitRate(waitS) : errors.length ? s.fixFirst(errors.length) : s.updateBtn}
            </button>
            <button type="button" class="btn" disabled={!canSend} onClick={() => { setEditing(null); void send(); }}>
              {s.sendNew}
            </button>
          </>
        ) : (
          <button type="button" class="btn btn-primary" disabled={!canSend || threadBad} onClick={send}>
            <Icon name="Send" size={17} /> {sendLabel}
          </button>
        )}
        {!webhook && !webhookUrl.trim() && <span class="hint">{s.needWebhook}</span>}
      </div>

      <div aria-live="polite" class="eb-status">
        {status.kind === "ok" && (
          <div class="notice eb-ok">
            <div class="eb-ok-head">
              <Icon name="Check" size={17} />
              <strong>{status.op === "send" ? s.sent : status.op === "edit" ? s.updated : s.loadedMessage}</strong>
            </div>
            <div class="eb-ok-id">
              <span class="hint">{s.msgId}</span>
              <code>{status.messageId}</code>
              <CopyButton text={status.messageId} lang={lang} size="sm" variant="icon" />
            </div>
            {status.op === "send" && lastSent && !editing && (
              <button type="button" class="btn btn-sm" onClick={() => setEditing(lastSent)}>
                <Icon name="Pencil" size={15} /> {s.editThis}
              </button>
            )}
          </div>
        )}
        {status.kind === "error" && (
          <div class="notice error eb-error">
            <strong>{status.title}</strong>
            {status.hint && <p class="eb-m0">{status.hint}</p>}
            {status.list && status.list.length > 0 && (
              <ul class="eb-list">
                {status.list.map((x, k) => (
                  <li key={k}><strong>{x.label}:</strong> {x.message}</li>
                ))}
              </ul>
            )}
            {status.raw && (
              <details>
                <summary>{s.rawResponse}</summary>
                <pre class="eb-raw">{status.raw}</pre>
              </details>
            )}
          </div>
        )}
      </div>

      <details class="eb-load">
        <summary>{s.load}</summary>
        <div class="stack eb-load-body">
          <div class="field">
            <label for="eb-msgref">{s.loadLabel}</label>
            <div class="eb-inline">
              <input
                id="eb-msgref"
                class="input mono"
                type="text"
                autocomplete="off"
                spellcheck={false}
                autocapitalize="off"
                placeholder="https://discord.com/channels/…"
                value={msgRef}
                aria-describedby="eb-msgref-hint"
                onInput={(e) => setMsgRef(val(e))}
                onKeyDown={(e) => e.key === "Enter" && loadMessage()}
              />
              <button type="button" class="btn" disabled={!webhook || !!webhookErr || busy || !msgRef.trim()} onClick={loadMessage}>
                <Icon name="Download" size={16} /> {busy && status.op === "load" ? s.loading : s.loadBtn}
              </button>
            </div>
            <span class="hint" id="eb-msgref-hint">{webhook ? s.loadHint : s.needWebhook}</span>
          </div>
        </div>
      </details>
    </section>
  );

  const issueSummary = issues.length > 0 && (
    <div class={errors.length ? "eb-summary has-errors" : "eb-summary"} role="region" aria-label={s.issuesTitle(errors.length, warns.length)}>
      <div class="eb-summary-head">
        <Icon name={errors.length ? "TriangleAlert" : "Info"} size={16} />
        <strong>{s.issuesTitle(errors.length, warns.length)}</strong>
      </div>
      <ul>
        {[...errors, ...warns].map((i, k) => (
          <li key={k} class={i.level === "error" ? "is-error" : "is-warn"}>
            <button type="button" class="eb-summary-link" onClick={() => focusIssue(i.path)}>
              <span class="eb-summary-path">{pathLabel(i.path, s)}:</span> {issueText(i, s)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div class="eb" data-pane={pane}>
      <div class="eb-toolbar">
        <div class="segmented" role="group" aria-label={s.view}>
          <button type="button" aria-pressed={view === "editor"} onClick={() => setView("editor")}>
            <Icon name="Pencil" size={15} /> {s.editor}
          </button>
          <button type="button" aria-pressed={view === "json"} onClick={() => setView("json")}>
            <Icon name="Code" size={15} /> {s.json}
          </button>
        </div>
        <div class="eb-toolbar-right">
          <label class="sr-only" for="eb-template">{s.templateLabel}</label>
          <select
            id="eb-template"
            class="select eb-template"
            value=""
            onChange={(e) => {
              const v = (e.currentTarget as HTMLSelectElement).value as TemplateId;
              if (v) loadTemplate(v);
              (e.currentTarget as HTMLSelectElement).value = "";
            }}
          >
            <option value="">{s.template}</option>
            {TEMPLATE_IDS.map((id) => <option key={id} value={id}>{templateNames(lang)[id]}</option>)}
          </select>
          <button type="button" class="btn" onClick={share}>
            <Icon name="Share2" size={16} /> <span class="eb-hide-xs">{s.share}</span>
          </button>
          <button type="button" class="btn btn-icon" aria-label={s.clear} title={s.clear} onClick={clearAll}>
            <Icon name="Trash2" size={17} />
          </button>
        </div>
      </div>

      {(undo || banner) && (
        <div class="eb-banners" aria-live="polite">
          {undo && (
            <div class="notice eb-banner">
              <span>{undo.label}</span>
              <div class="row">
                <button type="button" class="btn btn-sm" onClick={() => { adopt(undo.draft, null, false); setUndo(null); }}>
                  <Undo2 size={15} strokeWidth={1.75} aria-hidden="true" /> {s.undo}
                </button>
                <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={s.dismiss} onClick={() => setUndo(null)}>
                  <Icon name="X" size={15} />
                </button>
              </div>
            </div>
          )}
          {banner && (
            <div class={banner.kind === "error" ? "notice error eb-banner" : "notice eb-banner eb-banner-warn"}>
              <span>{banner.text}</span>
              <button type="button" class="btn btn-ghost btn-sm btn-icon" aria-label={s.dismiss} onClick={() => setBanner(null)}>
                <Icon name="X" size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      <div class="eb-switch segmented" role="group" aria-label={s.view}>
        <button type="button" aria-pressed={pane === "edit"} onClick={() => setPane("edit")}>
          <Icon name="Pencil" size={15} /> {s.edit}
        </button>
        <button type="button" aria-pressed={pane === "preview"} onClick={() => setPane("preview")}>
          <Icon name="Eye" size={15} /> {s.preview}
          {errors.length > 0 && <span class="eb-badge">{errors.length}</span>}
        </button>
      </div>

      <div class="tool-layout split eb-layout">
        <div class="eb-edit-col stack">
          {issueSummary}
          {view === "editor" ? editorView : jsonView}
          {sendPanel}
          <div class="eb-autosave">
            <label class="check">
              <input type="checkbox" checked={autosave} onChange={(e) => toggleAutosave((e.currentTarget as HTMLInputElement).checked)} />
              <span>
                {s.autosave}
                <span class="hint eb-block">{s.autosaveHint}</span>
              </span>
            </label>
          </div>
        </div>
        <div class="sticky eb-preview-col">
          <Preview
            messages={[previewMsg]}
            theme={theme}
            onTheme={setTheme}
            locale={locale}
            label={s.previewLabel}
            note={draft.suppressEmbeds && previewEmbeds.length ? s.suppressedNote : s.previewNote}
          />
          <div class="eb-preview-foot">
            <span class={errors.length ? "chip eb-chip-err" : "chip eb-chip-ok"}>
              <Icon name={errors.length ? "TriangleAlert" : "Check"} size={14} />
              {errors.length || warns.length ? s.issuesTitle(errors.length, warns.length) : s.allGood}
            </span>
            <span class="chip">{s.embedsChars(total)}</span>
            <button
              type="button"
              class="btn btn-sm"
              onClick={() => {
                setPane("edit");
                requestAnimationFrame(() => {
                  document.getElementById("eb-send")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  document.getElementById("eb-webhook")?.focus({ preventScroll: true });
                });
              }}
            >
              <Icon name="Send" size={15} /> {s.toSend}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
