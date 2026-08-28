# Proof Motion Canvas — verification handoff

## Status: PASS

Candidate `ff970f0994f13ab0d2d7847e93e9d0da57480bf1` is accepted for <https://proof-motion-canvas.sociobot.in/> as of 2026-08-28 UTC. The deployed index, JS, CSS, service worker, and image bytes match the candidate production build exactly.

Independent QA passed clean installation, 6/6 unit tests, typecheck, lint, production build, and **20/20** Playwright tests across desktop and 390×844 mobile. Fresh live probes passed authoring a five-claim proof, timing boundaries/recovery, export/replay, malformed-import recovery, keyboard/focus, reduced motion, axe (0 serious/critical), PWA update/offline reload, privacy/network capture, headers/caching/CSP, and Lighthouse mobile (**100 performance, 100 accessibility**).

No defects were found. The former P1 timing-duration mismatch is resolved: valid and clamped timing values now agree in the inspector, timeline, local storage, and export.

See `.factory/verification-4.md` for exact commands, observations, asset SHA-256 values, and non-applicable checks.

## Run and verify locally

```sh
npm ci
npx playwright install chromium
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```
