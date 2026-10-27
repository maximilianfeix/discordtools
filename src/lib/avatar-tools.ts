/** Pure crop math for the avatar/banner tool. All coordinates are in source-image pixels. */

export type CropMode = "avatar" | "profile-banner" | "server-banner";

export interface ModeSpec {
  id: CropMode;
  aspect: number;
  /** Export sizes (width × height) */
  exports: [number, number][];
  /** Minimum size Discord asks for */
  min: [number, number];
}

/**
 * Avatar: square, shown round. Profile banner: Discord asks for at least 680×240 (17:6).
 * Server banner: at least 960×540 in 16:9 (support article "Server Banners").
 */
export const MODES: Record<CropMode, ModeSpec> = {
  avatar: { id: "avatar", aspect: 1, exports: [[512, 512], [1024, 1024]], min: [128, 128] },
  "profile-banner": { id: "profile-banner", aspect: 680 / 240, exports: [[680, 240], [1360, 480]], min: [680, 240] },
  "server-banner": { id: "server-banner", aspect: 16 / 9, exports: [[960, 540], [1920, 1080]], min: [960, 540] },
};

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 8;

export interface Crop {
  /** Center of the crop in image pixels */
  cx: number;
  cy: number;
  zoom: number;
}

export interface Rect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/** Largest rect with the given aspect that fits into the image (zoom 1 = "cover"). */
export function baseSize(imgW: number, imgH: number, aspect: number): { w: number; h: number } {
  const w = Math.min(imgW, imgH * aspect);
  return { w, h: w / aspect };
}

export function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number.isFinite(z) ? z : 1));
}

/** Keeps the crop inside the image. */
export function clampCrop(c: Crop, imgW: number, imgH: number, aspect: number): Crop {
  const zoom = clampZoom(c.zoom);
  const b = baseSize(imgW, imgH, aspect);
  const w = b.w / zoom, h = b.h / zoom;
  const cx = Math.min(imgW - w / 2, Math.max(w / 2, c.cx));
  const cy = Math.min(imgH - h / 2, Math.max(h / 2, c.cy));
  return { cx, cy, zoom };
}

export function centerCrop(imgW: number, imgH: number): Crop {
  return { cx: imgW / 2, cy: imgH / 2, zoom: 1 };
}

export function cropRect(c: Crop, imgW: number, imgH: number, aspect: number): Rect {
  const k = clampCrop(c, imgW, imgH, aspect);
  const b = baseSize(imgW, imgH, aspect);
  const sw = b.w / k.zoom, sh = b.h / k.zoom;
  return { sx: k.cx - sw / 2, sy: k.cy - sh / 2, sw, sh };
}

/** Drag on screen: moving the pointer right moves the image right, so the crop center moves left. */
export function panBy(c: Crop, dxScreen: number, dyScreen: number, viewW: number, imgW: number, imgH: number, aspect: number): Crop {
  const r = cropRect(c, imgW, imgH, aspect);
  const k = r.sw / viewW;
  return clampCrop({ ...c, cx: c.cx - dxScreen * k, cy: c.cy - dyScreen * k }, imgW, imgH, aspect);
}

/** Zoom around a point given in viewport fractions (0..1), so that point stays under the cursor. */
export function zoomAt(c: Crop, newZoom: number, fx: number, fy: number, imgW: number, imgH: number, aspect: number): Crop {
  const before = cropRect(c, imgW, imgH, aspect);
  const px = before.sx + fx * before.sw, py = before.sy + fy * before.sh;
  const z = clampZoom(newZoom);
  const b = baseSize(imgW, imgH, aspect);
  const sw = b.w / z, sh = b.h / z;
  return clampCrop({ zoom: z, cx: px - (fx - 0.5) * sw, cy: py - (fy - 0.5) * sh }, imgW, imgH, aspect);
}

/** Warning if the source crop has fewer pixels than the export (upscaling looks blurry). */
export function isUpscaled(r: Rect, outW: number): boolean {
  return r.sw < outW * 0.98;
}

export function fileName(mode: CropMode, w: number, h: number): string {
  const base = mode === "avatar" ? "avatar" : mode === "profile-banner" ? "profilbanner" : "serverbanner";
  return `${base}-${w}x${h}.png`;
}
