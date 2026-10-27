# discordtools

Free, fast and private Discord tools. Runs in your browser.

German: Kostenlose, schnelle und private Discord-Tools. Läuft in deinem Browser.

## Mark: a command in a conversation

The original mark pairs a compact message bubble with a transparent slash cut. The tail says “message”; the slash suggests a command, a code tool, and a quick action. A single silhouette and one cut keep it recognizable at 16px. The slash is empty space, never a white overlay.

Explored directions: a wrench/hex-key cut adds small mechanical details; a `<t:` or `</>` bubble has too many counters at favicon size; a toolbox tray weakens the chat silhouette. The slash bubble has the clearest small-size read. Its asymmetric tail and single cut avoid face/controller imagery.

## Palette

Teal is the main brand hue. Mint provides the corresponding accent on dark surfaces. Use solid fills; depth comes from surface steps and spacing.

| Role | Dark | Light |
| --- | --- | --- |
| `bg` | `#102B2A` | `#F5F8F7` |
| `surface` | `#183735` | `#FFFFFF` |
| `surface-2` | `#214540` | `#E6EFEB` |
| `border` | `#446760` | `#A7BDB5` |
| `text` | `#F1F8F5` | `#142F2B` |
| `muted` | `#ADCCC3` | `#506C63` |
| `accent` | `#56DFC1` | `#087B69` |
| `accent-contrast` | `#102B2A` | `#FFFFFF` |
| `success` | `#81D6A1` | `#227343` |
| `warning` | `#F2CB78` | `#855A08` |
| `danger` | `#FFA296` | `#B43B34` |
| `mention-bg` | `#28574F` | `#D4EDE3` |

`bg`: page canvas. `surface`: panels. `surface-2`: nested panels and hover fills. `border`: decorative separators. `text`: primary copy. `muted`: supporting copy. `accent`: links, focus indicators, brand and actions. `accent-contrast`: text/icons on accent fills. `success`, `warning`, `danger`: status text/icons, always paired with words or symbols. `mention-bg`: timestamp and mention highlighting, with `text` foreground.

## Contrast verification

Calculated from sRGB relative luminance using the WCAG contrast formula `(Llighter + 0.05) / (Ldarker + 0.05)`. Ratios below use opaque colors, rounded to two decimals. All meet the WCAG AA normal-text threshold of 4.5:1.

| Theme | Pair | Ratio | AA normal text |
| --- | --- | --- | --- |
| Dark | `text` on `bg` | 13.91:1 | Pass |
| Dark | `muted` on `bg` | 8.71:1 | Pass |
| Dark | `accent` on `bg` | 9.08:1 | Pass |
| Light | `text` on `bg` | 13.36:1 | Pass |
| Light | `muted` on `bg` | 5.36:1 | Pass |
| Light | `accent` on `bg` | 4.86:1 | Pass |
| Dark | `accent-contrast` on `accent` | 9.08:1 | Pass |
| Light | `accent-contrast` on `accent` | 5.19:1 | Pass |

These results apply to the listed pairs, not to every combination in the palette. Recheck foregrounds on other surfaces and hover/disabled states. Decorative borders do not establish accessible control boundaries; use a 3:1 boundary or another clear control affordance when required. Never communicate status through color alone.

## Typography

Use Inter (free, open source) for both English and German UI. Use JetBrains Mono (free, open source) for IDs, timestamp syntax, JSON, and ANSI previews. Self-host WOFF2 fonts with Latin Extended coverage for German umlauts and ß. Keep sentence case, short labels, and direct verbs.

- UI stack: `Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Code stack: `"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, monospace`.
- UI scale: 12 / 14 / 16 / 20 / 24 / 32 / 48 px. Body 16px, line height 1.5; headings 1.1–1.2. Use 400 regular, 500 medium, 700 bold.
- Wordmark: lowercase `discordtools`, system-ui at 700; compact tracking around -0.03em. Lockups deliberately use the permitted system font, with no remote font dependency. Banners use `Inter, system-ui, sans-serif`; font metrics may vary by renderer. Typeset the brand name exactly; do not translate it.

## Shape and spacing

4px spacing unit. Radius scale: 4px for compact highlights, 8px for inputs and timestamp pills, 12px for tool chips and code panels, 16px for avatars, 24px for large message panels. Reserve fully rounded pills for actual statuses. Prefer broad, calm surfaces and left alignment; avoid a wall of identical cards.

## Asset use

- `mark.svg`: 512×512, transparent, deep teal for light backgrounds.
- `mark-mono.svg`: 512×512, transparent, `currentColor`. Set CSS `color` on an inline SVG; external `<img>` files do not inherit the host page’s text color. Standalone defaults to black.
- `favicon.svg`: 32×32, mint mark on a filled ink rounded square. The fill preserves the internal contrast on light and dark tab bars.
- `lockup-dark.svg` / `lockup-light.svg`: 640×160, transparent; choose for the destination background.
- `banner-dark.svg` / `banner-light.svg`: 1280×400, opaque README banners.
- `social-preview.svg`: 1280×640, opaque, with all content inside a 40px safe margin. Its message and ANSI preview are illustrative, not a live Discord screenshot. Rasterize to PNG when a social platform requires a raster Open Graph image.

Minimum mark canvas: 16×16px; prefer 24px or larger in controls. Minimum lockup width: 240px. Leave at least one eighth of the mark canvas as clear space beyond its visible silhouette. Preserve the SVG viewBox padding and aspect ratio. At 16px, use the standalone mark or favicon, never the full lockup. The mark is a custom graphic; use the exact supplied path.

## Voice and usage

Be friendly, precise, and brief. Name the result: “Copy timestamp” / “Zeitstempel kopieren”, “Embed Builder” / “Embed-Builder”, “ID Lookup” / “ID nachschlagen”. Preserve code and IDs verbatim. Support longer German labels through flexible spacing.

Do use the teal/mint accents consistently, keep the cut transparent, provide descriptive alternative text, and name controls with words. Prefer the dark or light lockup that has clear contrast with its surroundings. Privacy copy must match actual behavior: verify each tool’s data flow before expanding the supplied brand promise into specific guarantees.

Do not redraw, stretch, rotate, add faces, outline the mark, or put imagery inside its slash. Do not use Discord’s logo, Clyde-like controller/face shapes, Discord Blurple (#5865F2) as the main color, purple-to-blue gradients, glassmorphism, glow, or generic AI iconography. Do not imply official status, endorsement, or affiliation with Discord. Avoid using the standalone brand icon where a Discord platform icon is expected.

Where context needs it: “Independent project. Not affiliated with or endorsed by Discord.” / “Unabhängiges Projekt. Nicht mit Discord verbunden oder von Discord unterstützt.”
