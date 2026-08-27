# Proof Motion Canvas — handoff

## What shipped

- A production Vite + vanilla TypeScript static editor for cards, numeric labels, attached arrows, and ordered written claims.
- Each claim has an inspectable target plus explicit start and end seconds. Replay supports play/pause, scrub, previous/next, Space, and left/right arrow keys. Playback is derived from elapsed time, so pausing or seeking cannot corrupt scene state.
- Canvas items support pointer dragging, keyboard movement, selection, editing, and confirmed deletion. The 390 px layout stacks intentionally and gives the fixed-size figure desk its own horizontal scroll region.
- Local-first autosave, editable JSON import/export, a confirmed blank-document action, a worked five-step starter, validated import errors, and clear local/offline status.
- One-file standalone HTML export with inline data, styling, replay controls, keyboard operation, and accessible claim text. The exported file was executed in the browser test, not only downloaded.
- An offline service worker that discovers and precaches Vite's hashed shell assets, plus `/privacy/`, `/terms/`, robots, sitemap, and Azure Static Web Apps configuration.
- The monochrome typographic broadsheet system documented in `.factory/design.md`. The original generated paper-card plate is 20,126 bytes as WebP; source and prompt provenance are in `assets/src/`.

## Run and verify

```sh
npm ci
npm test
npm run build
npm run test:e2e
npm run preview
```

Deployment uses exactly `npm run build`; output is `dist/` and `dist/index.html` is present at its root.

Final local verification on 2026-08-27:

- `npm test`: 4/4 model tests passed.
- `npm run build`: passed; initial JS 31.48 KB raw / 10.79 KB gzip, CSS 12.05 KB raw / 3.47 KB gzip, hero WebP 20.13 KB. No runtime fonts or third-party scripts.
- `npm run test:e2e`: 13 passed and one intentional desktop skip for a mobile-only assertion. Desktop and 390 px Chromium flows cover editing, keyboard movement, blank-state creation, playback, HTML export + execution, offline reload, and legal routes. Axe integration reports no serious or critical violations.
- Factory `verify-url.sh`: title present, `lang="en"`, one `h1`, main landmark, all images have alt text, no unlabeled buttons, and no console/page errors.
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.3 s, CLS 0, Total Blocking Time 140 ms. INP is not reported for a synthetic load; interactions are covered by Playwright.
- Desktop and 390 × 844 screenshots were reviewed for clipping, hidden controls, and canvas state. Reduced-motion CSS replaces narrative transforms with instant state changes.

## Known gaps and next steps

- The stated five-pilot usability and 70% invariant-restatement success measure requires real participant sessions and has not yet been measured.
- V1 intentionally has one local draft, no collaboration/backend, no formal verification, no arbitrary scripting, and no video export. JSON files are the portable editable format; HTML files are standalone replays.
- A future iteration could add reorder handles and multiple local documents if pilot use shows that either is more valuable than the current compact workflow.
