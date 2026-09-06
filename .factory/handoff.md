# Proof Motion Canvas — repair 4 handoff

## Status: ready

All seven strict-review findings are fixed. All fourteen declared public claims pass from the documented clean setup. The repaired static build is deployed at <https://proof-motion-canvas.sociobot.in>.

- Work order: `proof-motion-canvas-repair-4`
- Implementation SHA: `dafa0401f5ec98e2fdc2f59734e6c22ae2ef9567`
- Core product commit: `0823fd0c020368ba25f8f80fb1e6d910b5bda69c`
- Reason for separate SHAs: later commits add tests and product documentation without changing the built runtime.
- Deployment: Azure Static Web Apps production deployment `9a04f961-7756-4be0-93eb-0af814b9878a`, succeeded 6 September 2026 UTC

## What changed

- Added a job-first home screen that names teachers, explainers, and programmers and leads with **Try it with sample data**.
- Added the required privacy, offline, and free facts before scrolling.
- Made `/demo` a real route with a five-step sample, persistent demo label, **Reset demo**, and **Start for real**.
- Isolated demo state from the real `proof-motion-canvas.document.v1` key. Demo edits stay in memory with one `demo:` session marker.
- Made a new real workspace empty instead of silently loading sample content.
- Kept written claim text visible beside the canvas during playback.
- Added the standard home, live product, three-step explanation, limits, and footer order.
- Added shared site headers and footers to Privacy, Terms, and the designed 404 page.
- Added route titles, canonical links, Open Graph and Twitter metadata, a 1200×630 social image, a 180×180 touch icon, and complete sitemap entries.
- Configured `/demo` as a production rewrite and unknown routes as designed HTTP 404 responses.
- Raised visible links and replay controls to at least 44×44 CSS pixels.
- Added `.factory/claims.json`, `.factory/demo.md`, `.factory/copy-audit.md`, and the catalog description.
- Preserved the earlier fixes for duplicate IDs, imported bounds, keyboard focus, timing reconciliation, CSP, and offline replay.

## Review finding disposition

| Finding | Disposition |
| --- | --- |
| F1 demo was not isolated | Fixed. A sentinel-backed browser test proves demo editing/reset never changes the real draft, and **Start for real** restores it. |
| F2 first screen was unclear | Fixed. Fresh desktop and phone checks show the job, audience, action, and three facts before scrolling. |
| F3 claims were undeclared | Fixed. Fourteen registry entries each map to one tagged outcome test; every declared command passes. |
| F4 demo and 404 routing were wrong | Fixed. `/demo` returns 200 with its own title. A missing live route returns 404 with the designed page. Route navigation moves focus to the h1. |
| F5 site structure was incomplete | Fixed. Home follows the required information order; every public page has the shared header and footer. |
| F6 metadata was missing | Fixed. Root, demo, legal pages, and 404 carry route-appropriate metadata and product art. Sitemap includes `/demo`. |
| F7 touch targets were undersized | Fixed. The phone test measures every visible demo link and button and every legal-page link; none is below 44×44. |

Earlier verification findings remain fixed: malformed duplicate identities and off-canvas imports are rejected without replacing the current proof; claim-title Tab focus reaches the explanation; valid and clamped timing values agree across the form, timeline, and export; CSP is present; and live assets byte-match the build.

## Clean verification

From a clean committed tree:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e -- --reporter=list
```

Results:

- Install: 59 packages, 0 vulnerabilities.
- Unit: 6/6 passed.
- Typecheck and lint: passed.
- Build: passed; `dist/index.html` exists.
- Browser: 56 passed, 8 intentional project-specific skips across desktop and 390×844 phone projects.
- Axe: zero serious or critical violations on `/`, `/demo`, `/privacy/`, `/terms/`, and `/404.html` in both projects.
- Each of the fourteen commands in `.factory/claims.json` passed separately.
- Text resizing: the phone first screen remained readable without horizontal page overflow at 200% root text size.

Production payload:

| Asset | Raw | Gzip |
| --- | ---: | ---: |
| Initial JavaScript | 39,551 B | 12,933 B |
| Initial CSS | 17,274 B | 4,640 B |
| Initial editorial image | 20,126 B | n/a |
| Whole `dist/` | 372,946 B | n/a |

Local Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.0 s, LCP 1.3 s, CLS 0, TBT 100 ms.

Live Lighthouse: Performance 99, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.2 s, CLS 0, TBT 90 ms. Lighthouse had no field INP sample; a fresh phone Event Timing run measured a maximum interaction duration of 32 ms.

## Live checks

- Root and `/demo` return HTTPS 200. `/missing-repair-check` returns HTTP 404 and the designed recovery page.
- The worker verifier found one h1, `lang=en`, a main landmark, complete image alt text, labeled buttons, and no console errors on both root and demo.
- Fresh desktop and phone contexts saw the job, audience, and sample action before scrolling.
- The demo showed five claims, four canvas items, 11 seconds of timing, and the persistent sample label.
- Editing the demo left the seeded real-data sentinel unchanged; reset restored the sample; leaving restored the sentinel.
- The live timing boundary clamped `0` to `0.25`, updated duration text, and exported the same value.
- The live duplicate-ID import was rejected and left all five sample claims intact.
- Live reduced-motion durations were `0.01 ms`; all observed runtime requests stayed on the product origin.
- A fresh context installed an active worker with no waiting update, then reloaded the populated demo offline.
- Local and live SHA-256 values match for `index.html`, the hashed JavaScript, the hashed CSS, and `sw.js`.

## Known gaps and scope

No release-blocking gaps remain. This static product intentionally has no backend, account, billing, collaboration, arbitrary scripting, or formal proof verification. Backend tenancy, persistence, health, and rate-limit checks do not apply. Lighthouse cannot produce field INP data in a clean lab run, so the 32 ms Event Timing result is reported as a lab interaction measurement rather than field INP.

Evidence is under `/work/.evidence/`, including the catalog description, worker screenshots and JSON, cold desktop/phone screenshots, live 404 response, and local/live Lighthouse JSON.
