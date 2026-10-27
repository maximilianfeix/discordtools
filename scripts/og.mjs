// Renders the Open Graph images (public/og.png, public/og-en.png) and PNG icons with Playwright.
// Run: node scripts/og.mjs
import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";

const font = (p) => `data:font/woff2;base64,${readFileSync(new URL(`../node_modules/${p}`, import.meta.url)).toString("base64")}`;
const fonts = `
@font-face{font-family:B;src:url(${font("@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2")});font-weight:200 800}
@font-face{font-family:I;src:url(${font("@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2")});font-weight:400 700}
@font-face{font-family:N;src:url(${font("@fontsource-variable/noto-sans/files/noto-sans-latin-wght-normal.woff2")});font-weight:100 900}`;
const mark = `<svg viewBox="0 0 512 512"><path fill="#3ee0a8" fill-rule="evenodd" d="M152 64H360C409 64 448 103 448 152V296C448 345 409 384 360 384H192L88 448V362C73 346 64 322 64 296V152C64 103 103 64 152 64ZM278 144L182 304H234L330 144Z"/></svg>`;

const copy = {
  de: { h: "Discord-Tools, die einfach funktionieren.", sub: "Zeitstempel · Embeds · farbiger Text · IDs · Rechte", chips: ["Kostenlos", "Ohne Anmeldung", "Ohne Tracking"], who: "Moderator", when: "Heute um 18:02", msg: "Turnier startet", ts: "Samstag, 31. Oktober 2026 um 20:00", rel: "in 4 Tagen", e: "Anmeldung offen", ed: "Reagiere mit ✅, um dabei zu sein." },
  en: { h: "Discord tools that just work.", sub: "Timestamps · embeds · colored text · IDs · permissions", chips: ["Free", "No sign-up", "No tracking"], who: "Moderator", when: "Today at 6:02 PM", msg: "Tournament starts", ts: "Saturday, October 31, 2026 at 8:00 PM", rel: "in 4 days", e: "Sign-ups open", ed: "React with ✅ to join." },
};

const html = (c) => `<!doctype html><html><head><style>${fonts}
*{box-sizing:border-box}body{margin:0;width:1280px;height:640px;background:#111214;color:#ecedef;font-family:I;overflow:hidden;position:relative}
.glow{position:absolute;inset:0;background:radial-gradient(700px 420px at 92% 0%,rgba(62,224,168,.16),transparent 70%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:40px 40px;mask-image:linear-gradient(180deg,#000,transparent 85%)}
.wrap{position:relative;padding:64px 72px;display:grid;grid-template-columns:600px 1fr;gap:40px;height:100%}
.logo{display:flex;align-items:center;gap:14px;font-weight:700;font-size:30px;letter-spacing:-.03em}.logo svg{width:46px;height:46px}.logo span{color:#878a92;font-weight:600}
h1{font-family:B;font-weight:750;font-size:74px;line-height:1.0;letter-spacing:-.035em;margin:56px 0 22px}
.sub{font-size:24px;color:#a3a6ad;margin:0 0 34px}
.chips{display:flex;gap:10px}.chip{padding:9px 16px;border:1px solid #34363c;border-radius:999px;font-size:19px;font-weight:600;color:#ecedef;background:#18191c}
.chip:first-child{background:#3ee0a8;color:#04140e;border-color:#3ee0a8}
.chat{align-self:center;background:#1a1a1e;border:1px solid #2c2e33;border-radius:22px;padding:26px 24px;font-family:N;font-size:17px;line-height:1.45;transform:rotate(1.2deg);box-shadow:0 30px 80px rgba(0,0,0,.5)}
.m{display:flex;gap:14px}.m+.m{margin-top:20px}.av{width:42px;height:42px;border-radius:50%;flex:none;background:linear-gradient(135deg,#f5b84a,#ff7b72)}.av.b{background:#3ee0a8}
.w{font-weight:600;color:#fbfbfb;display:flex;gap:7px;align-items:center}.w small{font-weight:400;color:#96979e;font-size:13px}.tag{background:#5865f2;color:#fff;font-size:11px;border-radius:3px;padding:0 5px;line-height:16px}
.ts{background:rgba(151,151,159,.14);border-radius:3px;padding:0 3px}.rel{color:#96979e;font-size:14px}
.emb{margin-top:6px;background:#242429;border-left:4px solid #3ee0a8;border-radius:4px;padding:12px 16px}.emb b{color:#fbfbfb;font-weight:600}.emb div{font-size:15px;margin-top:4px}
.ansi{margin-top:18px;padding:10px 12px;border-radius:4px;background:rgba(92,107,240,.08);border:1px solid rgba(151,151,159,.2);font-family:monospace;font-size:15px}
.r{color:#dc322f}.g{color:#859900}.y{color:#b58900}.bl{color:#268bd2}
.url{position:absolute;left:72px;bottom:52px;font-size:20px;color:#878a92;font-weight:600}
</style></head><body><div class="glow"></div><div class="grid"></div><div class="wrap"><div>
<div class="logo">${mark}<div>discordtools<span>.de</span></div></div><h1>${c.h}</h1><p class="sub">${c.sub}</p>
<div class="chips">${c.chips.map((x) => `<span class="chip">${x}</span>`).join("")}</div></div>
<div class="chat"><div class="m"><span class="av"></span><div><div class="w">${c.who} <small>${c.when}</small></div><div>${c.msg} <span class="ts">${c.ts}</span></div><div class="rel">${c.rel}</div></div></div>
<div class="m"><span class="av b"></span><div><div class="w">Event Bot <span class="tag">APP</span></div><div class="emb"><b>📢 ${c.e}</b><div>${c.ed}</div></div></div></div>
<div class="ansi"><span class="r">■ RED</span> <span class="g">■ GREEN</span> <span class="y">■ GOLD</span> <span class="bl">■ BLUE</span></div></div>
</div><div class="url">discordtools.de</div></body></html>`;

const icon = (size, pad) => `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:#111214;display:grid;place-items:center">
<div style="width:${size - pad * 2}px;height:${size - pad * 2}px">${mark.replace("<svg", '<svg width="100%" height="100%"')}</div></body></html>`;

const b = await chromium.launch();
for (const [lang, file] of [["de", "public/og.png"], ["en", "public/og-en.png"]]) {
  const p = await b.newPage({ viewport: { width: 1280, height: 640 } });
  await p.setContent(html(copy[lang]));
  await p.waitForTimeout(400);
  await p.screenshot({ path: file });
  await p.close();
}
for (const [size, pad, file] of [[180, 28, "public/apple-touch-icon.png"], [32, 3, "public/favicon-32.png"], [192, 30, "public/icon-192.png"], [512, 80, "public/icon-512.png"]]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(icon(size, pad));
  await p.screenshot({ path: file });
  await p.close();
}
await b.close();
console.log("rendered");
