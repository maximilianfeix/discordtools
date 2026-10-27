# Contributing

Thanks for helping! Bug reports, translations, accessibility fixes and new tool ideas are all welcome.

## Setup

```bash
git clone https://github.com/maximilianfeix/discordtools
cd discordtools
npm install
npm run dev        # http://localhost:4321
npm test           # unit tests (vitest)
npm run build      # static site in dist/
```

## How a tool is built

- Every tool is registered in `src/tools/registry.ts` (id, localized slug, icon, keywords).
- The interactive part is a Preact island in `src/components/tools/<Name>.tsx` with German and English strings.
- Pure logic lives in `src/lib/<id>.ts` and has tests in `tests/`.
- The text below the tool (steps, FAQ) lives in `src/content/tools/<id>.ts`.

## Rules

- No backend, no tracking, no third-party scripts. Requests to Discord go directly from the browser.
- No user tokens, selfbots, mass messaging or scraping – such PRs will be closed.
- Keep both languages in sync. German uses informal "du".
- Facts (limits, permission bits, markdown) must match Discord's docs – link the source in your PR.
