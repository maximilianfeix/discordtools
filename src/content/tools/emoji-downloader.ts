import type { ToolContent } from "../types";

const content: ToolContent = {
  de: {
    title: "Discord Emoji & Sticker herunterladen – PNG, GIF, WebP",
    description:
      "Discord-Emojis und Sticker ohne Login herunterladen: <:name:id> oder Link einfügen, Größe und Format wählen (PNG, GIF, WebP, Lottie) und alles als ZIP speichern.",
    h1: "Emoji & Sticker laden",
    lead: "Füg Custom-Emojis, Sticker-Links oder ganze Nachrichten ein und lad jedes Emoji in der gewünschten Größe als WebP, PNG oder GIF herunter – einzeln oder alle als ZIP. Kein Token, kein Login.",
    steps: [
      "Hol dir den Emoji-Code: Schreib in Discord \\ vor das Emoji (z. B. \\:pepe:) und schick es ab – du siehst <:pepe:123…>. Oder Rechtsklick aufs Emoji → „Link kopieren“.",
      "Füg einen oder viele Codes oder Links oben ein. Sticker-Links und reine IDs gehen auch.",
      "Wähl Größe und Format. Animierte Emojis gibt es zusätzlich als GIF.",
      "Lad einzelne Dateien herunter oder alles auf einmal als ZIP.",
    ],
    faq: [
      {
        q: "Brauche ich dafür meinen Discord-Token?",
        a: "Nein – und gib ihn auch nirgends ein. Emojis und Sticker liegen öffentlich auf Discords CDN (`cdn.discordapp.com`). Mit der ID kann jeder die Datei laden. Tools, die nach deinem Token fragen, um „alle Emojis eines Servers“ zu holen, verstoßen gegen Discords Regeln.",
      },
      {
        q: "Wie groß kann ich ein Emoji herunterladen?",
        a: "Du kannst 32 bis 1024 Pixel wählen. Discord skaliert aber nie über das hochgeladene Original hinaus; ältere Emojis sind oft nur 128 × 128 groß. Wähl „Original“, um die größte verfügbare Version zu bekommen.",
      },
      {
        q: "Warum ist mein animiertes Emoji als PNG ein Standbild?",
        a: "PNG kann keine Animation. Wähl für animierte Emojis GIF oder WebP – WebP ist kleiner und behält die Animation.",
      },
      {
        q: "Was ist ein Lottie-Sticker?",
        a: "Die offiziellen Discord-Sticker (z. B. Wumpus) sind Lottie-Animationen: eine JSON-Datei mit Vektordaten statt eines Bildes. Du kannst sie als `.json` laden und z. B. mit LottieFiles abspielen oder umwandeln. Server-Sticker sind PNG, APNG oder GIF.",
      },
      {
        q: "Wie mache ich aus einem Bild ein Emoji?",
        a: "Nutz unten „Bild zu Emoji verkleinern“: Das Tool skaliert dein Bild lokal auf 128 × 128 Pixel und speichert es als PNG. Discord erlaubt für Emojis maximal 256 KB.",
      },
    ],
  },
  en: {
    title: "Discord Emoji & Sticker Downloader – PNG, GIF, WebP",
    description:
      "Download Discord emojis and stickers without logging in: paste <:name:id> or a link, pick size and format (PNG, GIF, WebP, Lottie) and save everything as a ZIP.",
    h1: "Emoji & sticker downloader",
    lead: "Paste custom emojis, sticker links or whole messages and download each emoji at the size you want as WebP, PNG or GIF – one by one or all as a ZIP. No token, no login.",
    steps: [
      "Get the emoji code: in Discord, type \\ before the emoji (e.g. \\:pepe:) and send it – you'll see <:pepe:123…>. Or right-click the emoji → “Copy Link”.",
      "Paste one or many codes or links above. Sticker links and bare IDs work too.",
      "Pick size and format. Animated emojis are also available as GIF.",
      "Download single files or everything at once as a ZIP.",
    ],
    faq: [
      {
        q: "Do I need my Discord token for this?",
        a: "No – and don't enter it anywhere. Emojis and stickers are public on Discord's CDN (`cdn.discordapp.com`). Anyone with the ID can load the file. Tools that ask for your token to grab “all emojis of a server” break Discord's rules.",
      },
      {
        q: "How large can I download an emoji?",
        a: "You can choose 32 to 1024 pixels. Discord never scales beyond the uploaded original though; older emojis are often only 128 × 128. Pick “Original” to get the largest available version.",
      },
      {
        q: "Why is my animated emoji a still image as PNG?",
        a: "PNG can't animate. Choose GIF or WebP for animated emojis – WebP is smaller and keeps the animation.",
      },
      {
        q: "What is a Lottie sticker?",
        a: "Discord's official stickers (e.g. Wumpus) are Lottie animations: a JSON file with vector data instead of an image. You can download the `.json` and play or convert it with LottieFiles, for example. Server stickers are PNG, APNG or GIF.",
      },
      {
        q: "How do I turn an image into an emoji?",
        a: "Use “Shrink an image to an emoji” below: the tool scales your image locally to 128 × 128 pixels and saves it as PNG. Discord allows at most 256 KB per emoji.",
      },
    ],
  },
};

export default content;
