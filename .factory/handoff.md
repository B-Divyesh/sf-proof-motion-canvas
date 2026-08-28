# Proof Motion Canvas — repair handoff

## Status: PASS — P1 timing inspection repair deployed

Repair commit: `696f2ea` (`fix: reconcile edited claim timing`), pushed to `main` and deployed to <https://proof-motion-canvas.sociobot.in/> on 2026-08-28 UTC.

## What changed

The independent verifier's P1 was reproduced: changing **Ends (seconds)** correctly saved/exported the normalized interval, but left both the input and the inspector's calculated duration stale because the inspector was intentionally not rerendered after a field commit (preserving Tab focus from the prior repair).

- The claim-duration help now has a stable `#step-duration` target.
- After a start/end change is normalized, the existing inspector form is reconciled in place with the exact saved start/end values and calculated duration. It is not rebuilt, so native keyboard focus remains intact.
- Added an exact Playwright regression that covers a valid `2 → 5` edit and an invalid `2 → 0` edit. It asserts the visible field, duration copy, timeline, local persisted document, and downloaded replay payload for the clamped `0.25` second interval.

The researched brief, static Vite/TypeScript artifact, product visual system, local-first data model, and all previously passing behavior remain unchanged.

## Verification performed

Clean install and local release checks:

```sh
npm ci
npx playwright install chromium
npm test
npm run typecheck
npm run lint
npm run build
npx playwright test --project=desktop --reporter=list
npx playwright test --project=mobile --reporter=list
```

- `npm ci`: 58 packages installed; 0 vulnerabilities.
- Unit/model suite: 6/6 passed.
- Typecheck and lint: passed.
- Production build: passed; `dist/index.html` exists. Payloads: JS 32,374 B raw / 11.02 kB gzip; CSS 12,054 B raw / 3.47 kB gzip; editorial WebP 20,126 B. All remain within static-product budgets.
- Playwright desktop: 9 passed and 1 expected skip (the mobile-only containment assertion). Mobile 390×844: 10 passed. Coverage includes authoring, keyboard claim editing, valid and clamped timing reconciliation, replay export, malformed imports, offline reload, responsive containment, and serious/critical axe checks for `/`, `/privacy/`, and `/terms/`.
- Local `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, no page/console errors, title, `lang=en`, one h1, main landmark, alt text, and labeled buttons.

Deployed verification:

- The deployed index, JS, and CSS exactly match `dist/` by SHA-256:
  - `index.html`: `2cdc2a70da3bdb16ccc73be040d09da5b7a690e22da6a45318d27d0714960c10`
  - `assets/index-CoFjPMcN.js`: `f7871fac3f8c05c5c814e6755550de4da047ebca4989609c0087f0d89b761c92`
  - `assets/index-AyV0_1wE.css`: `f24927476ed748f33800e64c3159056d943f94f671f2e8e70bed2cf531753501`
- Live 390px timing probe: valid end `5` showed/saved `5`, `Duration: 5.00 s`, and `0.0–5.0 s`; invalid end `0` showed/saved `0.25`, `Duration: 0.25 s`, and `0.0–0.3 s`. Claim title → Tab still focused `#edit-step-text`.
- Live 390px body width was 390 px at a 390 px viewport; the intentional canvas scroller was 712 px. Live axe found zero serious/critical findings.
- The service worker was controlling the page, stayed `activated` with no waiting update after `registration.update()`, and a first-visit offline reload displayed the editor and offline state. The disconnected `/robots.txt` health probe is expected only while intentionally offline; online checks had no console errors.
- Browser request capture observed only `https://proof-motion-canvas.sociobot.in`; no analytics, third-party scripts, fonts, or trackers were requested. Author data remains localStorage-only, as disclosed by Privacy and Terms.
- Live `/opt/fleet/lib/verify-url.sh` passed (HTTP 200; no online console errors; title/lang/h1/main/alt/button checks). CSP is same-origin; `nosniff`, strict referrer policy, and camera/microphone/geolocation-denying Permissions Policy are present. HTML revalidates at 30 seconds, `sw.js` is `no-cache`, and hashed assets are immutable for one year.
- Live mobile Lighthouse: performance **100**, accessibility **100**, FCP **0.9 s**, LCP **1.0 s**, CLS **0**.

Deployment used `/opt/fleet/lib/deploy-static.sh proof-motion-canvas dist` (Azure Static Web Apps deployment `2f60bc08-6323-49b9-92c8-ee1727a6d6b4`) and returned HTTPS 200 from the production custom domain.

## Scope and known gaps

This remains a static web PWA, not a package, CLI, or backend. Package-consumer APIs, server concurrency, and backend health checks do not apply. No known release-blocking gaps remain.

## Run locally

```sh
npm ci
npx playwright install chromium
npm run dev
```

Use `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:e2e` for the normal verification suite.
