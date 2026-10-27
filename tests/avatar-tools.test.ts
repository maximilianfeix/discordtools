import { describe, expect, it } from "vitest";
import { MODES, baseSize, centerCrop, clampCrop, cropRect, fileName, isUpscaled, panBy, zoomAt } from "../src/lib/avatar-tools";

describe("avatar-tools", () => {
  it("uses Discord's documented banner ratios", () => {
    expect(MODES["profile-banner"].aspect).toBeCloseTo(17 / 6, 6);
    expect(MODES["server-banner"].aspect).toBeCloseTo(16 / 9, 6);
    expect(MODES.avatar.exports).toEqual([[512, 512], [1024, 1024]]);
  });

  it("covers the image at zoom 1", () => {
    expect(baseSize(800, 600, 1)).toEqual({ w: 600, h: 600 });
    const b = baseSize(800, 600, 17 / 6);
    expect(b.w).toBe(800);
    expect(b.h).toBeCloseTo(800 * 6 / 17, 6);
    expect(cropRect(centerCrop(800, 600), 800, 600, 1)).toEqual({ sx: 100, sy: 0, sw: 600, sh: 600 });
  });

  it("keeps the crop inside the image", () => {
    const c = clampCrop({ cx: -500, cy: 9999, zoom: 2 }, 800, 600, 1);
    const r = cropRect(c, 800, 600, 1);
    expect(r.sx).toBe(0);
    expect(r.sy + r.sh).toBe(600);
    expect(clampCrop({ cx: 0, cy: 0, zoom: 99 }, 800, 600, 1).zoom).toBe(8);
    expect(clampCrop({ cx: 0, cy: 0, zoom: 0.1 }, 800, 600, 1).zoom).toBe(1);
  });

  it("pans in screen space", () => {
    const c = { cx: 400, cy: 300, zoom: 2 };
    // view is 300px wide, crop is 300 image px wide → 1:1
    const p = panBy(c, 50, 0, 300, 800, 600, 1);
    expect(p.cx).toBe(350);
    expect(p.cy).toBe(300);
  });

  it("zooms around the cursor", () => {
    const c = centerCrop(800, 600);
    const z = zoomAt(c, 2, 0.5, 0.5, 800, 600, 1);
    expect(z).toEqual({ cx: 400, cy: 300, zoom: 2 });
    const tl = zoomAt(c, 2, 0, 0, 800, 600, 1);
    const r = cropRect(tl, 800, 600, 1);
    expect(r.sx).toBe(100);
    expect(r.sy).toBe(0);
  });

  it("flags upscaling and names files", () => {
    expect(isUpscaled({ sx: 0, sy: 0, sw: 300, sh: 300 }, 512)).toBe(true);
    expect(isUpscaled({ sx: 0, sy: 0, sw: 600, sh: 600 }, 512)).toBe(false);
    expect(fileName("avatar", 512, 512)).toBe("avatar-512x512.png");
  });
});
