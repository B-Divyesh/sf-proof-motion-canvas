# Verification 4 — Proof Motion Canvas

## Verdict: PASS

**Candidate commit:** `ff970f0994f13ab0d2d7847e93e9d0da57480bf1`  
**Live URL:** <https://proof-motion-canvas.sociobot.in/>  
**Verified:** 2026-08-28 UTC  
**Scope:** independent static-web/PWA QA against `.factory/brief.json`, the factory contract, and the deployed artifact. No product code was changed.

The candidate satisfies the smallest useful product: an author can create cards/numbers/arrows, give five claims named timed intervals, play and inspect the sequence, and export a self-contained accessible replay. The timing-inspector defect reported in Verification 3 is repaired in this candidate: valid and clamped values, duration text, local data, timeline, and exported replay agree.

## Clean checkout and build evidence

- The clean `main` checkout was exactly `ff970f0994f13ab0d2d7847e93e9d0da57480bf1` before this report was written.
- `npm ci` succeeded: 58 packages installed; audit reported 0 vulnerabilities.
- `npm test` passed: **6/6** Vitest model tests.
- `npm run typecheck` passed.
- `npm run lint` passed (the configured `tsc --noEmit`).
- `npm run build` passed and produced `dist/`.
- Browser dependencies initially lacked the browser matching the locked Playwright 1.62. Per the work order, `npx playwright install chromium` installed that test dependency without changing the repository. The rerun `npm run test:e2e` passed: **20/20** Playwright tests across desktop and the configured 390×844 mobile project.

Production payloads are within the static-product budgets:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| Initial JavaScript | 32,374 B | 11.02 kB |
| Initial CSS | 12,054 B | 3.47 kB |
| Editorial WebP | 20,126 B | — |

There are no shipped font files; the site uses local system font stacks. Total `dist/` size is 72,771 B.

## End-to-end product QA

Fresh live-browser probes (desktop plus 390×844 mobile) passed all assertions:

- The sample loads with four canvas items and five named claims. Keyboard Tab focuses the skip link with the designed vermilion `3px` focus outline; after changing a claim name, native Tab moves to the bound accessible-explanation field.
- A normal authored flow works from a blank proof: adding a claim with no canvas target gives the actionable error, then adding a card and number, creating an arrow, and adding five claims produces a five-step proof.
- The timing repair was independently checked: end `5` displays `Duration: 5.00 s`; invalid end `0` is visibly clamped to `0.25`, displays `Duration: 0.25 s`, and persists `0.25` in localStorage. This is the exact prior P1 recovery path.
- A malformed JSON import with a missing step target is rejected with an error and leaves the existing five-step proof intact.
- Exported replay contains the edited claim title and accessible explanation, plays with keyboard Enter, and contains no external-network URL references.
- At 390 px, document width equals the viewport (`390`); the intentionally horizontally scrollable figure desk is `712` px, so the page itself does not overflow.
- Under `prefers-reduced-motion: reduce`, computed narrative animation and UI transition durations are `1e-05s` (0.01 ms), consistent with the reduced-motion stylesheet.

The repository suite additionally covers drag/keyboard movement, valid and clamped timing export, duplicate-ID and off-canvas import rejection, offline reload, replay controls, and axe scans of `/`, `/privacy/`, and `/terms/` in both projects.

## Accessibility and performance

- Fresh live axe scan: **0 serious/critical** findings. The local Playwright axe scans also passed on all three pages at desktop and mobile widths.
- `/opt/fleet/lib/verify-url.sh` against the live app passed: HTTP 200, title, `lang=en`, one `<h1>`, `<main>`, zero missing image alts, zero unlabeled buttons, and no console/page errors. Its measured page load was 983 ms.
- Fresh mobile Lighthouse against the live app: **Performance 100, Accessibility 100**; FCP **0.9 s**, LCP **1.1 s**, CLS **0**, TBT **80 ms**.

## Privacy, PWA, policies, and deployment identity

- Browser request capture during normal live use observed only `https://proof-motion-canvas.sociobot.in`; no analytics, third-party fonts, scripts, or trackers were requested. Source and runtime inspection confirm author documents are stored in browser localStorage only; Privacy and Terms pages are present.
- The live worker controls the app, `registration.update()` leaves an `activated` worker with no waiting update, and cache `proof-motion-canvas-v1` is present. After a successful online load, a deliberately offline reload rendered the editor and visible offline banner. The only offline console error was the expected disconnected same-origin `/robots.txt` health probe; there were no unexpected errors.
- Live responses have HTTPS/HSTS, `nosniff`, strict referrer policy, a Permissions Policy denying camera/microphone/geolocation, and a same-origin CSP (`default-src 'self'`, no remote connect/script/font source). HTML revalidates at 30 seconds; hashed JS/CSS/WebP use `public, max-age=31536000, immutable`; `sw.js` is `no-cache`.
- Local production bytes and live bytes match exactly:

| Asset | SHA-256 |
| --- | --- |
| `index.html` | `2cdc2a70da3bdb16ccc73be040d09da5b7a690e22da6a45318d27d0714960c10` |
| `assets/index-CoFjPMcN.js` | `f7871fac3f8c05c5c814e6755550de4da047ebca4989609c0087f0d89b761c92` |
| `assets/index-AyV0_1wE.css` | `f24927476ed748f33800e64c3159056d943f94f671f2e8e70bed2cf531753501` |
| `sw.js` | `ea0b5a1c94d090eeff6a72188dd06663199bc4df8f892f3a50935d21068d1453` |
| `assets/editorial-plate.webp` | `5af3f54f0cefbe9f806c29e16f82b8ade278fbf34486946dc439237fb0bee6ac` |

## Defects by severity

None found. No release-blocking, high, medium, or low defects were observed in the candidate under the stated acceptance contract.

## Not applicable

This is a static web PWA, not a library/CLI or backend. Clean-consumer package installation, public CLI/API checks, backend concurrency/persistence, and backend health/build-identity probes do not apply.
