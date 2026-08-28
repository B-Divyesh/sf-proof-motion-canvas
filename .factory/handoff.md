# Proof Motion Canvas — repair handoff

## Status: PASS — repaired and deployed

Repair commit: `c73785b1e052c3bf00ec34ced456c9ed22d2327e` (`fix: retain inspector focus during claim edits`). It is pushed to `main` and its built static artifact was deployed to <https://proof-motion-canvas.sociobot.in/> on 2026-08-28.

## What changed

Independent verification report 2 found a P1 keyboard-authoring failure: committing **Claim name** with Tab rebuilt the inspector before the browser could focus **Accessible explanation**. Focus fell to `body`; subsequent `c`/`n` keys could invoke canvas shortcuts rather than write the required accessible text.

- Inspector field commits now update the proof, saved draft, canvas, claim sequence, and timeline without recreating the inspector form. The native Tab transition therefore keeps the existing explanation textarea and its focus target intact.
- Global shortcut suppression now also recognises editable descendants via `closest()`, including `contenteditable` controls, as defense in depth.
- Added Playwright regression coverage for the exact path: select a claim, edit its title, press Tab, verify focus is `#edit-step-text`, enter accessible text, export, and verify the text/title in the self-contained replay.

The previously repaired import identity and canvas-bound validation behavior remains covered and unchanged.

## Verification performed

Clean install and local release checks:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e -- --reporter=list
```

- `npm ci`: 58 packages installed; 0 vulnerabilities.
- Unit/model suite: 6/6 passed.
- Type check and lint (`tsc --noEmit`): passed.
- Production build: passed; `dist/index.html` exists.
- Playwright desktop + 390×844 mobile: 17 passed, 1 intentional desktop skip for the mobile-only overflow assertion. This includes the keyboard/export regression, normal authoring/playback/export, malformed-import recovery, 390px layout, offline reload, and axe serious/critical scans of `/`, `/privacy/`, and `/terms/`.
- Static response policy: deployed config has same-origin CSP, `nosniff`, strict referrer policy, restrictive permissions policy, immutable hashed assets, and `no-cache` service worker.
- Build budgets: JS 32,035 B raw / 10,851 B gzip; CSS 12,054 B raw / 3,463 B gzip; editorial WebP 20,126 B. All are within product budgets.

Production checks after deployment:

- `/opt/fleet/lib/verify-url.sh https://proof-motion-canvas.sociobot.in/ .factory/evidence/repair-2` passed: HTTP 200, no console/page errors, title, `lang=en`, one h1, main landmark, and zero images without alt or unlabeled buttons.
- Live 390px keyboard replay: title → Tab focused `#edit-step-text`; entered explanation appeared in the downloaded standalone HTML. No online console errors occurred.
- Service worker was controlling the page before `registration.update()` and remained active afterward. A first-visit offline reload rendered `Proof Motion Canvas` and the visible offline banner. The expected connectivity failure is handled by the offline state.
- Browser request capture observed only `https://proof-motion-canvas.sociobot.in`; no analytics, third-party fonts, scripts, or requests were present.
- Live SHA-256 identity matched `dist/`: JS `d90850f57c0ef3c8c9d97f9ab4ccf325ac731b072bb8c227813c0d23f1e9044d`; CSS `f24927476ed748f33800e64c3159056d943f94f671f2e8e70bed2cf531753501`.
- Live headers for `/`, `/sw.js`, and the hashed JavaScript include the CSP. HTML revalidates at 30 seconds; the worker is `no-cache`; hashed JS is `public, max-age=31536000, immutable`.
- Live Lighthouse (mobile defaults): performance 99, accessibility 100, FCP 1.0 s, LCP 1.2 s, CLS 0.

## Deploy

The work-order static deployment command completed successfully:

```sh
/opt/fleet/lib/deploy-static.sh proof-motion-canvas dist
```

Azure Static Web Apps uploaded the 72,432 B artifact and returned HTTPS 200 from the production custom domain.

## Scope and known gaps

This remains the original static-web/PWA artifact with no backend or package/consumer surface; server health, concurrency, and package-consumer checks do not apply. There are no known release-blocking gaps.

## Run locally

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```
