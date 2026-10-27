import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Profilbild zuschneiden – Avatar & Banner Größe",
    description:
      "Discord-Profilbild und Banner zuschneiden: Avatar rund mit Status-Vorschau, Profilbanner 680 × 240, Serverbanner 960 × 540. Läuft im Browser, nichts wird hochgeladen.",
    h1: "Discord-Profilbild-Werkzeug",
    lead: "Schneid dein Profilbild oder Banner passend zu, sieh es in allen Discord-Größen mit Status-Punkt und lad es als PNG herunter – alles lokal in deinem Browser.",
    steps: [
      "Zieh ein Bild ins Feld oder klick auf „Bild auswählen“.",
      "Wähl das Format: Profilbild, Profilbanner oder Serverbanner.",
      "Verschieb das Bild mit der Maus, dem Finger oder den Pfeiltasten und zoom mit Mausrad, Regler oder +/−.",
      "Prüf die Vorschau und lad das PNG herunter.",
    ],
    faq: [
      {
        q: "Welche Größe hat ein Discord-Profilbild?",
        a: "Discord speichert Profilbilder quadratisch und zeigt sie rund an, im Chat mit 40 px, im Profil mit 80 px und größer. Lade mindestens 512 × 512 px hoch, damit es überall scharf ist – das Tool exportiert 512 und 1024 px.",
      },
      {
        q: "Welche Größe hat ein Discord-Profilbanner?",
        a: "Mindestens 680 × 240 px, also ein Seitenverhältnis von 17:6. Erlaubt sind PNG, JPG und GIF unter 10 MB. Eigene Banner gibt es nur mit Nitro.",
      },
      {
        q: "Welche Größe hat ein Serverbanner?",
        a: "Mindestens 960 × 540 px im Format 16:9 (1920 × 1080 geht auch). Serverbanner gibt es ab Boost-Level 2, animierte ab Level 3. Halte die oberen 48 px ruhig, dort steht der Servername.",
      },
      {
        q: "Wird mein Bild hochgeladen?",
        a: "Nein. Das Zuschneiden passiert mit Canvas direkt in deinem Browser. Das Bild verlässt dein Gerät nicht und wird nicht gespeichert.",
      },
      {
        q: "Bleibt mein GIF animiert?",
        a: "Nein, das Tool speichert ein Standbild (das erste Bild). Für animierte Profilbilder brauchst du Nitro und lädst das Original-GIF direkt in Discord hoch.",
      },
    ],
    about: [
      "Die Status-Punkte (online, abwesend, nicht stören, offline) sind nachgezeichnet, damit du siehst, ob wichtige Bildteile unten rechts verdeckt werden.",
    ],
  },
  en: {
    title: "Discord Avatar Cropper – avatar & banner size",
    description:
      "Crop your Discord avatar and banners: round avatar with status preview, profile banner 680 × 240, server banner 960 × 540. Runs in your browser, nothing is uploaded.",
    h1: "Discord avatar tool",
    lead: "Crop your avatar or banner to the right shape, preview it in every Discord size with a status dot and download a PNG – all locally in your browser.",
    steps: [
      "Drop an image into the box or click “Choose image”.",
      "Pick the format: avatar, profile banner or server banner.",
      "Move the image with mouse, finger or arrow keys and zoom with the wheel, slider or +/−.",
      "Check the preview and download the PNG.",
    ],
    faq: [
      {
        q: "What size is a Discord avatar?",
        a: "Discord stores avatars as squares and shows them round – 40 px in chat, 80 px and larger in profiles. Upload at least 512 × 512 px so it's sharp everywhere; the tool exports 512 and 1024 px.",
      },
      {
        q: "What size is a Discord profile banner?",
        a: "At least 680 × 240 px, an aspect ratio of 17:6. PNG, JPG and GIF under 10 MB are allowed. Custom banners need Nitro.",
      },
      {
        q: "What size is a server banner?",
        a: "At least 960 × 540 px in 16:9 (1920 × 1080 works too). Server banners unlock at boost level 2, animated ones at level 3. Keep the top 48 px calm – the server name sits there.",
      },
      {
        q: "Is my image uploaded?",
        a: "No. Cropping happens with canvas right in your browser. The image never leaves your device and isn't stored.",
      },
      {
        q: "Does my GIF stay animated?",
        a: "No, the tool saves a still (the first frame). Animated avatars need Nitro and you upload the original GIF directly in Discord.",
      },
    ],
    about: [
      "The status dots (online, idle, do not disturb, offline) are redrawn so you can see whether important parts of the image get covered in the bottom right.",
    ],
  },
};

export default content;
