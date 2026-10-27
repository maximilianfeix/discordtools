import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import CopyButton from "../ui/CopyButton";
import { toast } from "../ui/toast";
import { Notice, PrivacyNote } from "./lookup-ui";
import {
  EMOJI_SIZES,
  emojiUrl,
  fileName,
  isAnimatedWebp,
  isApng,
  parseAssets,
  stickerExt,
  stickerUrl,
  type AssetKind,
  type AssetRef,
  type EmojiFormat,
  type StickerFormat,
} from "../../lib/emoji";
import { createZip } from "../../lib/zip";
import "./EmojiDownloader.css";

const EXAMPLE = "<:mmLol:216154654256398347>\nhttps://cdn.discordapp.com/stickers/749054660769218631.json";

const L = {
  de: {
    inputLabel: "Emojis, Sticker oder Links",
    inputHint: "Ganze Nachrichten gehen auch. Erkennt <:name:id>, <a:name:id>, Emoji- und Sticker-URLs sowie IDs.",
    bareAs: "Reine IDs sind",
    emoji: "Emoji",
    sticker: "Sticker",
    size: "Größe",
    format: "Format",
    original: "Original",
    sizeHint: "Discord vergrößert nie über das Original hinaus – große Größen liefern das Original.",
    found: (n: number) => `${n} gefunden`,
    zip: "Alle als ZIP",
    zipping: "ZIP wird erstellt …",
    zipDone: "ZIP heruntergeladen",
    empty: "Füg oben ein Emoji wie <:name:123…> ein. Am Desktop: Rechtsklick auf das Emoji → „Link kopieren“, oder in der Nachricht \\ vor das Emoji schreiben, dann siehst du den Code.",
    ignored: "Nicht erkannt:",
    checking: "Prüfe …",
    missing: "Nicht gefunden – gelöscht oder falsche ID?",
    animated: "Animiert",
    static: "Statisch",
    stickerFormats: { png: "PNG", apng: "APNG (animiert)", lottie: "Lottie (JSON)", gif: "GIF" } as Record<StickerFormat, string>,
    lottieNote: "Lottie-Animation",
    download: "Laden",
    copyUrl: "URL kopieren",
    open: "Öffnen",
    dlFail: "Download fehlgeschlagen",
    privacy: "Bilder kommen direkt vom Discord-CDN in deinen Browser. Wir sehen nichts davon.",
    resizeTitle: "Bild zu Emoji verkleinern",
    resizeHint: "Lade ein Bild hoch – du bekommst ein 128 × 128-PNG unter 256 KB, passend für den Emoji-Upload. Läuft lokal, nichts wird hochgeladen.",
    pick: "Bild auswählen",
    fit: "Zuschnitt",
    contain: "Einpassen",
    cover: "Füllen",
    result: "Ergebnis",
    kb: (n: number) => `${n.toLocaleString("de-DE", { maximumFractionDigits: 1 })} KB`,
    tooBig: "Immer noch über 256 KB – versuch ein einfacheres Bild.",
    gifNote: "Animierte GIFs werden dabei zu einem Standbild.",
    badFile: "Das Bild konnte nicht gelesen werden.",
  },
  en: {
    inputLabel: "Emojis, stickers or links",
    inputHint: "Whole messages work too. Understands <:name:id>, <a:name:id>, emoji and sticker URLs and IDs.",
    bareAs: "Bare IDs are",
    emoji: "Emoji",
    sticker: "Sticker",
    size: "Size",
    format: "Format",
    original: "Original",
    sizeHint: "Discord never upscales beyond the original – large sizes return the original.",
    found: (n: number) => `${n} found`,
    zip: "All as ZIP",
    zipping: "Creating ZIP …",
    zipDone: "ZIP downloaded",
    empty: "Paste an emoji like <:name:123…> above. On desktop: right-click the emoji → “Copy Link”, or type \\ before the emoji in a message to see its code.",
    ignored: "Not recognized:",
    checking: "Checking …",
    missing: "Not found – deleted or wrong ID?",
    animated: "Animated",
    static: "Static",
    stickerFormats: { png: "PNG", apng: "APNG (animated)", lottie: "Lottie (JSON)", gif: "GIF" } as Record<StickerFormat, string>,
    lottieNote: "Lottie animation",
    download: "Download",
    copyUrl: "Copy URL",
    open: "Open",
    dlFail: "Download failed",
    privacy: "Images come straight from Discord's CDN into your browser. We see none of it.",
    resizeTitle: "Shrink an image to an emoji",
    resizeHint: "Upload an image – you get a 128 × 128 PNG under 256 KB, ready for the emoji upload. Runs locally, nothing is uploaded.",
    pick: "Choose image",
    fit: "Crop",
    contain: "Fit",
    cover: "Fill",
    result: "Result",
    kb: (n: number) => `${n.toLocaleString("en-GB", { maximumFractionDigits: 1 })} KB`,
    tooBig: "Still over 256 KB – try a simpler image.",
    gifNote: "Animated GIFs become a still image.",
    badFile: "Couldn't read that image.",
  },
};

type T = (typeof L)["de"];

interface Probe {
  state: "checking" | "ok" | "missing";
  animated?: boolean;
  stickerFormat?: StickerFormat;
}

async function head(url: string, bytes = 64): Promise<Uint8Array | null> {
  try {
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) return null;
    const buf = new Uint8Array(await r.arrayBuffer());
    return buf.slice(0, Math.max(bytes, Math.min(buf.length, 4096)));
  } catch {
    return null; // CDN 404s carry no CORS header and surface as network errors
  }
}

async function probe(a: AssetRef): Promise<Probe> {
  if (a.kind === "emoji") {
    const bytes = await head(emojiUrl(a.id, { format: "webp", size: 48, animated: true }));
    if (!bytes) return { state: "missing" };
    return { state: "ok", animated: a.animated ?? isAnimatedWebp(bytes) };
  }
  if (a.stickerFormat === "lottie" || a.stickerFormat === "gif") {
    const ok = await head(stickerUrl(a.id, a.stickerFormat));
    return ok ? { state: "ok", stickerFormat: a.stickerFormat } : { state: "missing" };
  }
  const png = await head(stickerUrl(a.id, "png"));
  if (png) return { state: "ok", stickerFormat: isApng(png) ? "apng" : "png" };
  if (await head(stickerUrl(a.id, "gif"))) return { state: "ok", stickerFormat: "gif" };
  if (await head(stickerUrl(a.id, "lottie"))) return { state: "ok", stickerFormat: "lottie" };
  return { state: "missing" };
}

function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const r = await fetch(url, { credentials: "omit" });
  if (!r.ok) throw new Error(String(r.status));
  return new Uint8Array(await r.arrayBuffer());
}

/** URL + file name for an asset with the current options. */
function target(a: AssetRef, p: Probe | undefined, format: EmojiFormat, size: number): { url: string; name: string } {
  if (a.kind === "emoji") {
    const animated = p?.animated ?? a.animated ?? false;
    const f: EmojiFormat = format === "gif" && !animated ? "png" : format;
    return { url: emojiUrl(a.id, { format: f, size, animated }), name: fileName(a.name, a.id, size >= 4096 ? "" : String(size), f) };
  }
  const sf = p?.stickerFormat ?? a.stickerFormat ?? "png";
  return { url: stickerUrl(a.id, sf), name: fileName(a.name, a.id, "", stickerExt(sf)) };
}

export default function EmojiDownloader({ lang }: { lang: Lang }) {
  const t = L[lang];
  const [text, setText] = useState(EXAMPLE);
  const [bareAs, setBareAs] = useState<AssetKind>("emoji");
  const [size, setSize] = useState(128);
  const [format, setFormat] = useState<EmojiFormat>("webp");
  const [probes, setProbes] = useState<Record<string, Probe>>({});
  const [zipping, setZipping] = useState(false);
  const started = useRef(new Set<string>());

  const { items, invalid } = useMemo(() => parseAssets(text, bareAs), [text, bareAs]);

  useEffect(() => {
    for (const a of items.slice(0, 100)) {
      const key = `${a.kind}:${a.id}:${a.stickerFormat ?? ""}`;
      if (started.current.has(key)) continue;
      started.current.add(key);
      setProbes((p) => ({ ...p, [key]: { state: "checking" } }));
      probe(a).then((r) => setProbes((p) => ({ ...p, [key]: r })));
    }
  }, [items]);

  const probeOf = (a: AssetRef) => probes[`${a.kind}:${a.id}:${a.stickerFormat ?? ""}`];
  const ready = items.filter((a) => probeOf(a)?.state === "ok");

  const downloadOne = async (url: string, name: string) => {
    try {
      saveBlob(new Blob([(await fetchBytes(url)) as BlobPart]), name);
    } catch {
      toast(t.dlFail, "error");
    }
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      const files = await Promise.all(
        ready.map(async (a) => {
          const tg = target(a, probeOf(a), format, size);
          try {
            return { name: tg.name, data: await fetchBytes(tg.url) };
          } catch {
            return null;
          }
        }),
      );
      const ok = files.filter((f): f is { name: string; data: Uint8Array } => !!f);
      if (!ok.length) throw new Error("empty");
      saveBlob(new Blob([createZip(ok) as BlobPart], { type: "application/zip" }), "discord-emojis.zip");
      toast(t.zipDone);
    } catch {
      toast(t.dlFail, "error");
    } finally {
      setZipping(false);
    }
  };

  return (
    <div class="stack em">
      <section class="panel stack">
        <div class="field">
          <label for="em-input">{t.inputLabel}</label>
          <textarea
            id="em-input"
            class="textarea mono"
            rows={3}
            value={text}
            autocomplete="off"
            spellcheck={false}
            aria-describedby="em-hint"
            onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
          />
          <span id="em-hint" class="hint">{t.inputHint}</span>
        </div>
        <div class="em-options">
          <div class="field">
            <span class="label" id="em-bare">{t.bareAs}</span>
            <div class="segmented" role="group" aria-labelledby="em-bare">
              <button type="button" aria-pressed={bareAs === "emoji"} onClick={() => setBareAs("emoji")}>
                {t.emoji}
              </button>
              <button type="button" aria-pressed={bareAs === "sticker"} onClick={() => setBareAs("sticker")}>
                {t.sticker}
              </button>
            </div>
          </div>
          <div class="field">
            <label for="em-size">{t.size}</label>
            <select id="em-size" class="select" value={size} onChange={(e) => setSize(Number((e.currentTarget as HTMLSelectElement).value))}>
              {EMOJI_SIZES.map((s) => (
                <option key={s} value={s}>
                  {s} px
                </option>
              ))}
              <option value={4096}>{t.original}</option>
            </select>
          </div>
          <div class="field">
            <span class="label" id="em-fmt">{t.format}</span>
            <div class="segmented" role="group" aria-labelledby="em-fmt">
              {(["webp", "png", "gif"] as const).map((f) => (
                <button type="button" key={f} aria-pressed={format === f} onClick={() => setFormat(f)}>
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p class="hint">{t.sizeHint}</p>
        <PrivacyNote>{t.privacy}</PrivacyNote>
      </section>

      {invalid.length > 0 && (
        <Notice kind="warn" title={t.ignored}>
          <p class="lk-mono">{invalid.slice(0, 12).join("  ")}</p>
        </Notice>
      )}

      {items.length === 0 ? (
        <Notice title={t.empty} />
      ) : (
        <>
          <div class="em-toolbar">
            <span class="chip">{t.found(items.length)}</span>
            <button type="button" class="btn btn-primary" onClick={downloadZip} disabled={zipping || ready.length === 0}>
              <Icon name="Download" size={17} /> {zipping ? t.zipping : `${t.zip} (${ready.length})`}
            </button>
          </div>
          <div class="em-grid" aria-live="polite">
            {items.map((a) => (
              <AssetCard key={a.kind + a.id} a={a} p={probeOf(a)} t={t} lang={lang} format={format} size={size} onDownload={downloadOne} />
            ))}
          </div>
        </>
      )}

      <Resizer t={t} />
    </div>
  );
}

function AssetCard({
  a,
  p,
  t,
  lang,
  format,
  size,
  onDownload,
}: {
  a: AssetRef;
  p?: Probe;
  t: T;
  lang: Lang;
  format: EmojiFormat;
  size: number;
  onDownload: (url: string, name: string) => void;
}) {
  const missing = p?.state === "missing";
  const tg = target(a, p, format, size);
  const animated = p?.animated ?? a.animated;
  const sf = p?.stickerFormat ?? a.stickerFormat;
  const previewUrl = a.kind === "emoji" ? emojiUrl(a.id, { format: "webp", size: 128, animated: !!animated }) : sf && sf !== "lottie" ? stickerUrl(a.id, sf) : null;
  const formats: EmojiFormat[] = a.kind === "emoji" ? (animated ? ["webp", "gif", "png"] : ["webp", "png"]) : [];
  return (
    <article class={`em-card${missing ? " is-missing" : ""}`}>
      <div class="em-preview">
        {p?.state === "checking" ? (
          <span>{t.checking}</span>
        ) : missing ? (
          <Icon name="TriangleAlert" size={22} />
        ) : previewUrl ? (
          <img src={previewUrl} alt={a.name ?? a.id} loading="lazy" />
        ) : (
          <span>
            <Icon name="Sparkles" size={22} />
            {t.lottieNote}
          </span>
        )}
      </div>
      <div class="em-info">
        <span class="em-name">{a.name ? `:${a.name}:` : a.kind === "emoji" ? t.emoji : t.sticker}</span>
        <span class="em-id">{a.id}</span>
        <div class="lk-chips">
          <span class="chip">{a.kind === "emoji" ? t.emoji : t.sticker}</span>
          {a.kind === "emoji" && animated !== undefined && <span class="chip">{animated ? t.animated : t.static}</span>}
          {a.kind === "sticker" && sf && <span class="chip">{t.stickerFormats[sf]}</span>}
        </div>
        {missing && <span class="hint">{t.missing}</span>}
      </div>
      {!missing && p?.state === "ok" && (
        <div class="em-actions">
          {a.kind === "emoji" ? (
            formats.map((f) => {
              const x = target(a, p, f, size);
              return (
                <button type="button" key={f} class={`btn btn-sm${f === format ? " btn-primary" : ""}`} onClick={() => onDownload(x.url, x.name)}>
                  <Icon name="Download" size={15} /> {f.toUpperCase()}
                </button>
              );
            })
          ) : (
            <button type="button" class="btn btn-sm btn-primary" onClick={() => onDownload(tg.url, tg.name)}>
              <Icon name="Download" size={15} /> {sf ? t.stickerFormats[sf] : t.download}
            </button>
          )}
          <CopyButton text={tg.url} lang={lang} size="sm" label={t.copyUrl} />
          <a class="btn btn-sm btn-ghost" href={tg.url} target="_blank" rel="noopener noreferrer">
            <Icon name="ExternalLink" size={15} /> {t.open}
          </a>
        </div>
      )}
    </article>
  );
}

function Resizer({ t }: { t: T }) {
  const [fit, setFit] = useState<"contain" | "cover">("contain");
  const [file, setFile] = useState<File | null>(null);
  const [out, setOut] = useState<{ url: string; size: number; blob: Blob } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    const src = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const ctx = c.getContext("2d")!;
      const scale = fit === "contain" ? Math.min(128 / img.width, 128 / img.height) : Math.max(128 / img.width, 128 / img.height);
      const w = img.width * scale,
        h = img.height * scale;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, (128 - w) / 2, (128 - h) / 2, w, h);
      c.toBlob((blob) => {
        if (cancelled || !blob) return;
        setOut((o) => {
          if (o) URL.revokeObjectURL(o.url);
          return { url: URL.createObjectURL(blob), size: blob.size, blob };
        });
      }, "image/png");
      URL.revokeObjectURL(src);
    };
    img.onerror = () => {
      setErr(t.badFile);
      URL.revokeObjectURL(src);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [file, fit]);

  return (
    <section class="panel stack" aria-labelledby="em-rs-title">
      <h2 class="panel-title" id="em-rs-title">
        {t.resizeTitle}
      </h2>
      <div class="em-resize">
        <div class="stack">
          <p class="hint">{t.resizeHint}</p>
          <div class="field">
            <label for="em-file">{t.pick}</label>
            <input
              id="em-file"
              class="em-file"
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={(e) => {
                setErr(null);
                setFile((e.currentTarget as HTMLInputElement).files?.[0] ?? null);
              }}
            />
          </div>
          <div class="field">
            <span class="label" id="em-fit">{t.fit}</span>
            <div class="segmented" role="group" aria-labelledby="em-fit">
              <button type="button" aria-pressed={fit === "contain"} onClick={() => setFit("contain")}>
                {t.contain}
              </button>
              <button type="button" aria-pressed={fit === "cover"} onClick={() => setFit("cover")}>
                {t.cover}
              </button>
            </div>
          </div>
          {file?.type === "image/gif" && <p class="hint">{t.gifNote}</p>}
        </div>
        {err && <Notice kind="error" title={err} live />}
        {out && !err && (
          <div class="stack" aria-live="polite">
            <span class="label">{t.result}</span>
            <div class="em-resize-out">
              <div class="em-preview">
                <img src={out.url} alt="" width={128} height={128} />
              </div>
              <div class="stack">
                <span class="lk-mono">128 × 128 · {t.kb(out.size / 1024)}</span>
                {out.size > 256 * 1024 && <Notice kind="warn" title={t.tooBig} />}
                <button type="button" class="btn btn-primary" onClick={() => saveBlob(out.blob, fileName(file?.name.replace(/\.\w+$/, ""), "emoji", "128", "png"))}>
                  <Icon name="Download" size={17} /> PNG
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
