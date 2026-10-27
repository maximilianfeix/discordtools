import { useEffect, useRef, useState } from "preact/hooks";
import type { Lang } from "../../i18n/ui";
import Icon from "../Icon";
import { toast } from "../ui/toast";
import { PREVIEW_THEMES, type PreviewTheme } from "../discord/Preview";
import "../discord/preview.css";
import {
  MAX_ZOOM, MIN_ZOOM, MODES, centerCrop, clampCrop, cropRect, fileName, isUpscaled, panBy, zoomAt, type Crop, type CropMode,
} from "../../lib/avatar-tools";
import "./AvatarTools.css";

type Status = "online" | "idle" | "dnd" | "offline";

const L = {
  de: {
    drop: "Bild hierher ziehen oder auswählen",
    dropHint: "PNG, JPG, WebP oder GIF. Das Bild bleibt auf deinem Gerät – es wird nirgends hochgeladen.",
    choose: "Bild auswählen",
    sample: "Beispielbild",
    mode: "Format",
    modes: { avatar: "Profilbild", "profile-banner": "Profilbanner", "server-banner": "Serverbanner" } as Record<CropMode, string>,
    modeHint: {
      avatar: "Quadratisch, Discord zeigt es rund. Wird bis 1024 px gespeichert.",
      "profile-banner": "Mindestens 680 × 240 px (17:6). Eigene Banner gibt es nur mit Nitro.",
      "server-banner": "Mindestens 960 × 540 px (16:9). Ab Boost-Level 2. Oben ca. 48 px ruhig halten – dort steht der Servername.",
    } as Record<CropMode, string>,
    stage: "Zuschnitt – ziehen zum Verschieben, Mausrad oder +/− zum Zoomen, Pfeiltasten zum Verschieben",
    zoom: "Zoom",
    zoomOut: "Verkleinern",
    zoomIn: "Vergrößern",
    center: "Zentrieren",
    keys: "Tastatur:",
    keysText: "Pfeile verschieben, + / − zoomen, 0 zentriert.",
    preview: "Vorschau",
    status: "Status",
    statuses: { online: "Online", idle: "Abwesend", dnd: "Bitte nicht stören", offline: "Offline" } as Record<Status, string>,
    sizes: "Größen in Discord",
    sizeLabels: { 128: "Profil groß", 80: "Profil", 40: "Chat", 32: "Mitglieder", 24: "Klein" } as Record<number, string>,
    message: "Neues Profilbild – was meint ihr?",
    name: "Du",
    today: "Heute um 12:00",
    export: "Herunterladen",
    exportAs: (w: number, h: number) => `PNG ${w} × ${h}`,
    upscaled: "Das Bild ist kleiner als die Ausgabe und wird hochskaliert – es kann unscharf wirken.",
    gif: "GIFs werden als Standbild (erstes Bild) gespeichert. Für animierte Profilbilder brauchst du Nitro und das Original-GIF.",
    loadError: "Das Bild konnte nicht geladen werden.",
    saved: "PNG gespeichert",
    privacy: "Alles passiert in deinem Browser (Canvas). Nichts wird hochgeladen oder gespeichert.",
    server: "Mein Server",
  },
  en: {
    drop: "Drop an image here or choose one",
    dropHint: "PNG, JPG, WebP or GIF. The image stays on your device – it's never uploaded.",
    choose: "Choose image",
    sample: "Sample image",
    mode: "Format",
    modes: { avatar: "Avatar", "profile-banner": "Profile banner", "server-banner": "Server banner" } as Record<CropMode, string>,
    modeHint: {
      avatar: "Square, Discord shows it round. Saved up to 1024 px.",
      "profile-banner": "At least 680 × 240 px (17:6). Custom banners need Nitro.",
      "server-banner": "At least 960 × 540 px (16:9). From boost level 2. Keep the top ~48 px calm – the server name sits there.",
    } as Record<CropMode, string>,
    stage: "Crop – drag to move, mouse wheel or +/− to zoom, arrow keys to move",
    zoom: "Zoom",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    center: "Center",
    keys: "Keyboard:",
    keysText: "Arrows move, + / − zoom, 0 centers.",
    preview: "Preview",
    status: "Status",
    statuses: { online: "Online", idle: "Idle", dnd: "Do not disturb", offline: "Offline" } as Record<Status, string>,
    sizes: "Sizes in Discord",
    sizeLabels: { 128: "Profile large", 80: "Profile", 40: "Chat", 32: "Members", 24: "Small" } as Record<number, string>,
    message: "New avatar – what do you think?",
    name: "You",
    today: "Today at 12:00 PM",
    export: "Download",
    exportAs: (w: number, h: number) => `PNG ${w} × ${h}`,
    upscaled: "The image is smaller than the output and gets upscaled – it may look blurry.",
    gif: "GIFs are saved as a still (first frame). Animated avatars need Nitro and the original GIF.",
    loadError: "Couldn't load the image.",
    saved: "PNG saved",
    privacy: "Everything happens in your browser (canvas). Nothing is uploaded or stored.",
    server: "My server",
  },
};

const STATUS_COLOR: Record<Status, string> = { online: "#43A25A", idle: "#CA9654", dnd: "#D83A42", offline: "#82838B" };

function StatusDot({ status, size, ring }: { status: Status; size: number; ring: string }) {
  const r = size / 2;
  const id = `m-${status}-${size}`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={r} cy={r} r={r} fill={ring} />
      <mask id={id}>
        <circle cx={r} cy={r} r={r * 0.68} fill="#fff" />
        {status === "idle" && <circle cx={r * 0.72} cy={r * 0.72} r={r * 0.42} fill="#000" />}
        {status === "dnd" && <rect x={r * 0.55} y={r * 0.84} width={r * 0.9} height={r * 0.32} rx={r * 0.16} fill="#000" />}
        {status === "offline" && <circle cx={r} cy={r} r={r * 0.32} fill="#000" />}
      </mask>
      <circle cx={r} cy={r} r={r * 0.68} fill={STATUS_COLOR[status]} mask={`url(#${id})`} />
    </svg>
  );
}

function Avatar({ src, size, status, ring }: { src: string; size: number; status?: Status; ring: string }) {
  const dot = Math.max(10, Math.round(size * 0.3));
  return (
    <span class="av-ava" style={{ width: size, height: size }}>
      {src && <img src={src} alt="" width={size} height={size} />}
      {status && <StatusDot status={status} size={dot} ring={ring} />}
    </span>
  );
}

/** A colorful sample so the tool is never empty. */
function makeSample(): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 900;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 1200, 900);
  grad.addColorStop(0, "#0f3d32");
  grad.addColorStop(0.5, "#3ee0a8");
  grad.addColorStop(1, "#7fb8ff");
  g.fillStyle = grad;
  g.fillRect(0, 0, 1200, 900);
  const dots: [number, number, number, string][] = [[260, 220, 160, "#ffffff22"], [980, 680, 220, "#04140e33"], [900, 180, 90, "#ffffff33"], [180, 760, 120, "#ffffff18"]];
  for (const [x, y, r, col] of dots) {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // Friendly face in the middle
  g.fillStyle = "#04140e";
  g.beginPath();
  g.arc(600, 450, 250, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#3ee0a8";
  g.beginPath();
  g.arc(520, 400, 34, 0, Math.PI * 2);
  g.arc(680, 400, 34, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#3ee0a8";
  g.lineWidth = 26;
  g.lineCap = "round";
  g.beginPath();
  g.arc(600, 470, 120, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  return c;
}

interface Source {
  el: CanvasImageSource;
  w: number;
  h: number;
  gif: boolean;
  url?: string;
}

export default function AvatarTools({ lang }: { lang: Lang }) {
  const s = L[lang];
  const [src, setSrc] = useState<Source | null>(null);
  const [mode, setMode] = useState<CropMode>("avatar");
  const [crops, setCrops] = useState<Record<CropMode, Crop | null>>({ avatar: null, "profile-banner": null, "server-banner": null });
  const [thumb, setThumb] = useState("");
  const [status, setStatus] = useState<Status>("online");
  const [theme, setTheme] = useState<PreviewTheme>("dark");
  const [over, setOver] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; pts: Map<number, { x: number; y: number }>; dist: number } | null>(null);

  const spec = MODES[mode];
  const crop = src ? crops[mode] ?? centerCrop(src.w, src.h) : null;
  const setCrop = (c: Crop) => src && setCrops((x) => ({ ...x, [mode]: clampCrop(c, src.w, src.h, spec.aspect) }));

  useEffect(() => {
    const c = makeSample();
    setSrc({ el: c, w: c.width, h: c.height, gif: false });
  }, []);

  // Free object URLs of replaced images.
  useEffect(() => () => { if (src?.url) URL.revokeObjectURL(src.url); }, [src]);

  // Draw the stage and refresh the small previews.
  useEffect(() => {
    if (!src || !crop) return;
    const cv = canvasRef.current, stage = stageRef.current;
    if (!cv || !stage) return;
    const r = cropRect(crop, src.w, src.h, spec.aspect);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = stage.clientWidth, h = Math.round(w / spec.aspect);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    const g = cv.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(src.el, r.sx, r.sy, r.sw, r.sh, 0, 0, cv.width, cv.height);
    const id = requestAnimationFrame(() => {
      const tw = mode === "avatar" ? 256 : 680;
      const t = document.createElement("canvas");
      t.width = tw;
      t.height = Math.round(tw / spec.aspect);
      const tg = t.getContext("2d")!;
      tg.imageSmoothingQuality = "high";
      tg.drawImage(src.el, r.sx, r.sy, r.sw, r.sh, 0, 0, t.width, t.height);
      setThumb(t.toDataURL("image/png"));
    });
    return () => cancelAnimationFrame(id);
  }, [src, crop?.cx, crop?.cy, crop?.zoom, mode]);

  // Redraw when the stage width changes (rotation, resize).
  const [, force] = useState(0);
  useEffect(() => {
    const st = stageRef.current;
    if (!st || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => force((n) => n + 1));
    ro.observe(st);
    return () => ro.disconnect();
  }, []);

  const avatarThumb = useAvatarThumb(src, crops.avatar, mode, thumb);

  const loadFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast(s.loadError, "error");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSrc({ el: img, w: img.naturalWidth, h: img.naturalHeight, gif: file.type === "image/gif", url });
      setCrops({ avatar: null, "profile-banner": null, "server-banner": null });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast(s.loadError, "error");
    };
    img.src = url;
  };

  const onPointerDown = (e: PointerEvent) => {
    const st = stageRef.current;
    if (!st) return;
    st.setPointerCapture(e.pointerId);
    if (!drag.current) drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, pts: new Map(), dist: 0 };
    drag.current.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag.current.pts.size === 2) {
      const [a, b] = [...drag.current.pts.values()];
      drag.current.dist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current, st = stageRef.current;
    if (!d || !st || !src || !crop || !d.pts.has(e.pointerId)) return;
    const prev = d.pts.get(e.pointerId)!;
    d.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (d.pts.size >= 2) {
      const [a, b] = [...d.pts.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (d.dist > 0) {
        const rect = st.getBoundingClientRect();
        const fx = ((a.x + b.x) / 2 - rect.left) / rect.width, fy = ((a.y + b.y) / 2 - rect.top) / rect.height;
        setCrop(zoomAt(crop, crop.zoom * (dist / d.dist), fx, fy, src.w, src.h, spec.aspect));
      }
      d.dist = dist;
      return;
    }
    setCrop(panBy(crop, e.clientX - prev.x, e.clientY - prev.y, st.clientWidth, src.w, src.h, spec.aspect));
  };
  const onPointerUp = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    d.pts.delete(e.pointerId);
    d.dist = 0;
    if (d.pts.size === 0) drag.current = null;
  };
  const onWheel = (e: WheelEvent) => {
    const st = stageRef.current;
    if (!st || !src || !crop) return;
    e.preventDefault();
    const rect = st.getBoundingClientRect();
    const f = Math.exp(-e.deltaY * 0.0015);
    setCrop(zoomAt(crop, crop.zoom * f, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height, src.w, src.h, spec.aspect));
  };
  // Wheel needs a non-passive listener to prevent page scrolling.
  useEffect(() => {
    const st = stageRef.current;
    if (!st) return;
    st.addEventListener("wheel", onWheel, { passive: false });
    return () => st.removeEventListener("wheel", onWheel);
  });

  const onKey = (e: KeyboardEvent) => {
    if (!src || !crop) return;
    const st = stageRef.current!;
    const step = e.shiftKey ? 40 : 10;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      // Arrow right moves the visible area right, i.e. the image left.
      setCrop(panBy(crop, moves[e.key][0], moves[e.key][1], st.clientWidth, src.w, src.h, spec.aspect));
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      setCrop({ ...crop, zoom: crop.zoom * 1.15 });
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      setCrop({ ...crop, zoom: crop.zoom / 1.15 });
    } else if (e.key === "0") {
      e.preventDefault();
      setCrop(centerCrop(src.w, src.h));
    }
  };

  const exportPng = (w: number, h: number) => {
    if (!src || !crop) return;
    const r = cropRect(crop, src.w, src.h, spec.aspect);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.imageSmoothingQuality = "high";
    g.drawImage(src.el, r.sx, r.sy, r.sw, r.sh, 0, 0, w, h);
    c.toBlob((blob) => {
      if (!blob) return toast(s.loadError, "error");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName(mode, w, h);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast(s.saved);
    }, "image/png");
  };

  const rect = src && crop ? cropRect(crop, src.w, src.h, spec.aspect) : null;
  const ring = { dark: "#1a1a1e", ash: "#323339", onyx: "#000000", light: "#fbfbfb" }[theme];
  const cardRing = { dark: "#242429", ash: "#393a41", onyx: "#0a0a0c", light: "#ffffff" }[theme];

  return (
    <div class="tool-layout split av">
      <div class="stack">
        <div
          class={over ? "av-drop is-over" : "av-drop"}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            loadFile(e.dataTransfer?.files[0]);
          }}
        >
          <Icon name="Upload" size={22} />
          <div class="av-drop-text">
            <strong>{s.drop}</strong>
            {s.dropHint}
          </div>
          <input ref={fileRef} id="av-file" class="av-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => loadFile((e.target as HTMLInputElement).files?.[0])} />
          <label for="av-file" class="btn btn-primary">{s.choose}</label>
        </div>

        <section class="panel stack" aria-label={s.modes[mode]}>
          <div class="field">
            <span class="label" id="av-mode-l">{s.mode}</span>
            <div class="segmented" role="group" aria-labelledby="av-mode-l">
              {(Object.keys(MODES) as CropMode[]).map((m) => (
                <button type="button" key={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{s.modes[m]}</button>
              ))}
            </div>
            <span class="hint">{s.modeHint[mode]}</span>
          </div>

          <div
            ref={stageRef}
            class="av-stage"
            style={{ aspectRatio: String(spec.aspect) }}
            tabIndex={0}
            role="img"
            aria-label={s.stage}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKey}
          >
            <canvas ref={canvasRef} />
            {mode === "avatar" && (
              <svg class="av-mask" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0 0H100V100H0Z M50 0A50 50 0 1 0 50 100A50 50 0 1 0 50 0Z" fill="rgb(0 0 0 / 0.6)" fill-rule="evenodd" />
                <circle cx="50" cy="50" r="49.6" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="0.4" />
              </svg>
            )}
            {mode === "profile-banner" && (
              <svg class="av-mask" viewBox="0 0 680 240" preserveAspectRatio="none" aria-hidden="true">
                <circle cx="62" cy="240" r="52" fill="rgb(0 0 0 / 0.45)" stroke="#fff" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="6 5" />
              </svg>
            )}
            {mode === "server-banner" && (
              <svg class="av-mask" viewBox="0 0 960 540" preserveAspectRatio="none" aria-hidden="true">
                <rect x="0" y="0" width="960" height="48" fill="rgb(0 0 0 / 0.4)" />
                <line x1="0" y1="48" x2="960" y2="48" stroke="#fff" stroke-opacity="0.6" stroke-width="2" stroke-dasharray="10 8" />
              </svg>
            )}
          </div>

          <div class="av-zoom">
            <button type="button" class="btn btn-icon btn-ghost" aria-label={s.zoomOut} onClick={() => crop && setCrop({ ...crop, zoom: crop.zoom / 1.2 })}>
              <span aria-hidden="true">−</span>
            </button>
            <label class="sr-only" for="av-zoom">{s.zoom}</label>
            <input
              id="av-zoom"
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={crop?.zoom ?? 1}
              onInput={(e) => crop && setCrop({ ...crop, zoom: parseFloat((e.target as HTMLInputElement).value) })}
            />
            <button type="button" class="btn btn-icon btn-ghost" aria-label={s.zoomIn} onClick={() => crop && setCrop({ ...crop, zoom: crop.zoom * 1.2 })}>
              <Icon name="Plus" size={18} />
            </button>
            <button type="button" class="btn btn-sm" onClick={() => src && setCrop(centerCrop(src.w, src.h))}>{s.center}</button>
          </div>
          <p class="av-kbd" style={{ margin: 0 }}>
            {s.keys} <kbd>←</kbd> <kbd>→</kbd> <kbd>↑</kbd> <kbd>↓</kbd> · <kbd>+</kbd> <kbd>−</kbd> · <kbd>0</kbd> – {s.keysText}
          </p>

          <div class="field">
            <span class="label">{s.export}</span>
            <div class="av-exports">
              {spec.exports.map(([w, h], i) => (
                <button type="button" key={w} class={i === 0 ? "btn btn-primary" : "btn"} onClick={() => exportPng(w, h)}>
                  <Icon name="Download" size={16} /> {s.exportAs(w, h)}
                </button>
              ))}
            </div>
            {rect && isUpscaled(rect, spec.exports[0][0]) && <span class="hint av-warn">{s.upscaled}</span>}
            {src?.gif && <span class="hint av-warn">{s.gif}</span>}
          </div>
          <p class="notice av-note">
            <Icon name="Lock" size={16} />
            <span>{s.privacy}</span>
          </p>
        </section>
      </div>

      <div class={`stack sticky av-t-${theme}`}>
        <div class="dp-bar">
          <span class="dp-label">{s.preview}</span>
          <div class="segmented" role="group" aria-label="Theme">
            {PREVIEW_THEMES.map((t) => (
              <button type="button" key={t.id} aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>{t.label}</button>
            ))}
          </div>
        </div>

        {mode === "avatar" ? (
          <>
            <div class="field">
              <span class="label" id="av-st-l">{s.status}</span>
              <div class="segmented" role="group" aria-labelledby="av-st-l">
                {(["online", "idle", "dnd", "offline"] as Status[]).map((st) => (
                  <button type="button" key={st} aria-pressed={status === st} onClick={() => setStatus(st)}>{s.statuses[st]}</button>
                ))}
              </div>
            </div>
            <div class="av-sizes" role="img" aria-label={s.sizes}>
              {[128, 80, 40, 32, 24].map((n) => (
                <div class="av-size" key={n}>
                  <Avatar src={thumb} size={n} status={n >= 32 ? status : undefined} ring={ring} />
                  <span>{n}px · {s.sizeLabels[n]}</span>
                </div>
              ))}
            </div>
            <div class={`dp dp-theme-${theme} av-msg`}>
              <div class="dp-message">
                <img class="dp-avatar" src={thumb} alt="" width={40} height={40} />
                <div class="dp-body">
                  <div class="dp-header">
                    <span class="dp-username">{s.name}</span>
                    <time class="dp-time">{s.today}</time>
                  </div>
                  <div class="dp-content">{s.message}</div>
                </div>
              </div>
            </div>
          </>
        ) : mode === "profile-banner" ? (
          <div class="av-card">
            {thumb && <img class="av-card-banner" src={thumb} alt="" />}
            <div class="av-card-body">
              <Avatar src={avatarThumb} size={92} status={status} ring={cardRing} />
              <div class="av-card-name">{s.name}</div>
              <div class="av-card-user">@du.discord</div>
            </div>
          </div>
        ) : (
          <div class="av-server">
            {thumb && <img src={thumb} alt="" />}
            <div class="av-server-name">
              {s.server}
              <span aria-hidden="true">⌄</span>
            </div>
          </div>
        )}
        <p class="hint dp-note">{lang === "de" ? "Vorschau – kann leicht vom echten Discord abweichen." : "Preview – may differ slightly from Discord."}</p>
      </div>
    </div>
  );
}

/** Avatar thumbnail for the profile card, even while the banner mode is active. */
function useAvatarThumb(src: Source | null, crop: Crop | null, mode: CropMode, thumb: string): string {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (mode === "avatar") {
      setUrl(thumb);
      return;
    }
    if (!src) return;
    const c = crop ?? centerCrop(src.w, src.h);
    const r = cropRect(c, src.w, src.h, 1);
    const t = document.createElement("canvas");
    t.width = t.height = 192;
    const g = t.getContext("2d")!;
    g.drawImage(src.el, r.sx, r.sy, r.sw, r.sh, 0, 0, 192, 192);
    setUrl(t.toDataURL("image/png"));
  }, [src, crop, mode, thumb]);
  return url;
}
