# Verification 5 — Build an inspectable animated explanation

## Verdict: FAIL

**FAIL — 2 medium findings and 2 untested public claim outcomes.** A PASS requires zero findings and zero untested claims.

- Work order: `proof-motion-canvas-verify-5`
- Live URL: <https://proof-motion-canvas.sociobot.in>
- Verified: 6 September 2026 UTC
- Implementation candidate: `dafa0401f5ec98e2fdc2f59734e6c22ae2ef9567`
- Documentation and test baseline: `02876a1e7249aa456747c1a0e2d6f15d253ed2f7`
- Reason for different SHAs: `e13353c` changes only a claim test and `.factory/claims.json`; `02876a1` changes only `.factory/handoff.md`. No runtime file changed after `dafa040`.

The editor completes the real job on desktop and phone. The live runtime byte-matches the clean candidate build. The failure is limited to mandatory claim registration and test completeness; the two affected behaviors passed independent live checks.

## Job, audience, and first action before scrolling

The job is to build an inspectable animated explanation. The audience is teachers, explainers, and programmers who need claims, visual changes, and timing to remain clear. The first action is **Try it with sample data**, next to the explanation **Loads a separate five-step example.**

Fresh 1440×900 desktop and 390×844 phone contexts showed all three before scrolling. The phone action ended at 523 px in an 844 px viewport. The price, local-draft, and offline facts were also visible before scrolling.

## Findings

### F1 — Medium — The offline-file clearing statement is not registered or tested

The live Privacy page says: **“Clearing this site’s browser storage removes the draft and offline files.”**

The `storage-control` registry entry and its tagged test cover only the saved draft. The test calls `localStorage.clear()` and asserts that the editor returns empty. It never primes, clears, or checks Cache Storage, and no other claim entry covers removal of offline files.

An independent live CDP check found `proof-motion-canvas-v2` before clearing all origin storage and no cache afterward; an offline reload then failed as expected. The statement appears true, but the claims contract requires a listed, tagged regression test.

Required repair: add the offline-file outcome to `.factory/claims.json` and test it from a fresh service-worker-controlled context by clearing all origin storage and proving the cached shell is gone. Alternatively, remove “and offline files” from public copy.

### F2 — Medium — The timed-interval claim test does not test editable start timing

The registered `timed-intervals` claim says: **“Each claim exposes editable start and end timing that agrees with the replay export.”** Its one tagged test edits only `#edit-step-end`. It does not edit or assert `#edit-step-start`, so the command does not prove the full public claim.

An independent live probe changed the first start value to `1`. The editor showed `1.0–2.0 s`, reported a 1.00-second duration, and exported `"start":1`. The behavior works, but the declared test is incomplete under the claims contract.

Required repair: extend the existing single `@claim:timed-intervals` test to edit start timing and assert the field, duration, timeline, and exported value agree.

## Clean checkout and declared commands

A disposable checkout at documentation SHA `02876a1` was used. `npm ci` installed 59 packages with 0 vulnerabilities.

| Command | Result |
| --- | --- |
| `npm test` | Pass — 6/6 |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass — `dist/index.html` produced |
| `npm run test:e2e -- --reporter=list` | Pass — 56 passed, 8 intentional project skips |

Every command in `.factory/claims.json` was then run separately from that checkout. Each registered ID appears in exactly one tagged test.

| Declared claim | Command result | Contract result |
| --- | --- | --- |
| `demo-isolation` | Pass | Pass |
| `local-only` | Pass | Pass |
| `offline-reload` | Pass | Pass |
| `offline-edit-export` | Pass | Pass |
| `standalone-export` | Pass | Pass |
| `keyboard-controls` | Pass | Pass |
| `canvas-authoring` | Pass | Pass |
| `reduced-motion` | Pass | Pass |
| `written-text` | Pass | Pass |
| `mobile-layout` | Pass | Pass |
| `free-core` | Pass | Pass |
| `timed-intervals` | Pass | Incomplete — F2 |
| `json-roundtrip` | Pass | Pass |
| `storage-control` | Pass | Pass for the draft; does not cover the separate public offline-file statement — F1 |

## Live product checks

### Demo and real-data isolation

- The one-click action opened `/demo` with its own title and focused h1.
- The persistent label read **Demo — sample data, nothing is saved** and exposed **Reset demo** and **Start for real**.
- The sample contained five named claims, four canvas items, one arrow, and 11 seconds of timing.
- A synthetic real draft named `REAL DATA SENTINEL` remained unchanged after editing and resetting the demo.
- Reset restored **Why the sum stays constant**. Starting for real restored the sentinel.
- Runtime requests during edit, playback, and export used only `https://proof-motion-canvas.sociobot.in`.

### Normal, invalid, boundary, and recovery paths

- A fresh real workspace opened empty. Adding a claim first gave **Add a canvas item before adding a claim.**
- Connecting with fewer than two items and choosing the same arrow endpoint each produced a specific recovery instruction.
- A normal authoring run created two items, one arrow, and five written claims; playback started, local saving occurred, and the HTML export contained the fifth claim.
- A duplicate-ID import was rejected with **Two proof items have the same identity.** The five sample claims remained.
- An off-canvas import was rejected with the documented bounds error. The five sample claims remained.
- End timing `5` updated the field, 5.00-second duration, timeline, and export. End timing `0` clamped to `0.25` everywhere.
- Start timing `1` updated the field, 1.00-second duration, timeline, and export in the independent live probe. F2 concerns missing tagged coverage, not a runtime defect.
- The standalone replay was 8,017 bytes, contained the clamped timing, had no HTTP reference or remote script/style link, and the clean claim test opened and played it.

### Routes, links, metadata, and the expected 404

| Route | HTTP | Title |
| --- | ---: | --- |
| `/` | 200 | `Proof Motion Canvas — build animated explanations` |
| `/demo` | 200 | `Demo — Proof Motion Canvas` |
| `/privacy/` | 200 | `Privacy — Proof Motion Canvas` |
| `/terms/` | 200 | `Terms — Proof Motion Canvas` |
| `/missing-verify-5` | 404 | `Page not found — Proof Motion Canvas` |

Every route had `lang=en`, one h1, a main landmark, shared navigation, and a return route. The deliberate 404 displayed the designed recovery page and is expected behavior, not a defect. All five same-origin links found on the home page returned 200. `robots.txt` and the sitemap were reachable; the sitemap lists home, demo, Privacy, and Terms. Local route tests also passed canonical, social metadata, image, heading, and link checks.

### Accessibility, keyboard, phone, and motion

- Fresh axe scans found zero violations on live home, demo, Privacy, Terms, and 404 at desktop, plus home and demo at phone size.
- The worker URL verifier passed root and demo: HTTP 200, title, `lang`, one h1, main, image alt text, labeled buttons, and no console errors.
- Tab first focused **Skip to main content** with a 3 px vermilion outline and 3 px offset.
- Claim-title Tab focus moved to the accessible-explanation field. Dialog focus/Escape and replay/card keyboard controls passed the browser suite.
- At 390 px, the page width was 390 px, the canvas scroller was 712 px, replay controls were visible, and no visible link or button was below 44×44 px.
- The clean mobile test passed at 200% root text size without page overflow or lost first-screen content.
- Reduced-motion animation and transition durations were both 0.01 ms. Nothing flashes or loops without a playback control.

### Offline, update, privacy, and security

- A fresh live context installed active worker `proof-motion-canvas-v2`; `registration.update()` left no waiting worker.
- The populated demo reloaded offline with five claims and the offline banner.
- A separate live offline run changed the title and exported `live-offline-edit.html` containing that change.
- No analytics, tracker, remote font, remote script, or cross-origin runtime request was observed.
- Privacy and Terms pages are reachable. The Privacy page provides a direct email address for privacy requests.
- Root, demo, 404, worker, and hashed assets sent HSTS, `nosniff`, strict referrer policy, a restrictive permissions policy, and the declared same-origin CSP. `frame-ancestors` is delivered as a response header.
- HTML revalidates after 30 seconds, the worker is `no-cache`, and hashed assets are immutable for one year.

### Performance and visual identity

Fresh live mobile Lighthouse: **100 Performance, 100 Accessibility, 100 Best Practices, 100 SEO**; FCP 0.90 s, LCP 1.16 s, CLS 0, and TBT 59 ms.

| Build asset | Size |
| --- | ---: |
| Initial JavaScript | 39,551 B raw / 12,933 B gzip |
| Initial CSS | 17,274 B raw / 4,640 B gzip |
| Editorial WebP | 20,126 B |
| Whole `dist/` | 372,867 B |

The single-mode newsprint palette, serif editorial hierarchy, ruled layout, and vermilion interaction marks match `.factory/design.md` and remain distinct from a generic framework page. The reviewed hero image contains five blank cards and drafting arrows with no stray text, logo, or watermark. Its prompt, model deployment, date, review, and original-source sidecars are present. The social image is 1200×630 and the touch icon is 180×180. No font file is shipped.

AI assistance is not a missed feature here. The brief makes author-owned explanation and inspectable timing the core job and names AI proof generation as outside the first version.

## Earlier finding disposition

| Earlier finding | Current proof |
| --- | --- |
| Duplicate IDs corrupted imported claims | Fixed. Live rejection preserved all five sample claims; unit and browser regressions pass. |
| Imported nodes could be off canvas | Fixed. Live bounds rejection preserved the sample; unit and browser regressions pass. |
| Production lacked CSP | Fixed. Live response headers include the declared CSP. |
| Claim-title editing lost keyboard focus | Fixed. Live Tab focus moved to `#edit-step-text`; export coverage passes. |
| Timing duration became stale after edits | Fixed. Live valid and clamped end edits agreed across field, duration, timeline, and export. |
| Review F1: demo was not isolated | Fixed. Live sentinel, edit, reset, and exit checks passed. |
| Review F2: first screen was unclear | Fixed. Job, audience, action, explanation, and three facts appeared before scrolling on phone and desktop. |
| Review F3: eight original outcomes lacked tests | Fixed for those eight outcomes. All are now registered and their commands pass. F1 and F2 above are newly identified coverage gaps. |
| Review F4: demo and 404 routing were wrong | Fixed. Demo returns 200 with its own title; unknown routes return the designed 404. |
| Review F5: site structure was incomplete | Fixed. Home and legal pages use the required header, content order, and footer. |
| Review F6: metadata was missing | Fixed. Route metadata, canonical links, social image, touch icon, robots, and sitemap checks pass. |
| Review F7: touch targets were undersized | Fixed. Phone measurement found no undersized visible target; legal-page regression checks pass. |
| Deployment identity was uncertain | Fixed. The four checked runtime files byte-match the candidate build. |

## Deployment identity

No runtime file changed after implementation commit `dafa040`. The clean build at documentation baseline `02876a1` matches live:

| File | SHA-256 |
| --- | --- |
| `index.html` | `7db38d9f5c00a9b753be0d1847afd985146f9ec7616fe6fa34a33a8a2f1f07a1` |
| `assets/index-DuBo62cE.js` | `8926952eb00917e551b6bcf2eac2a804278c0e876c23ad8c4f6b88e977298d31` |
| `assets/index-CxB5IiKh.css` | `99849a4fdc08a77a11503c57d4b6cdddba751400c7af7ff1965d07e13fe4c3fd` |
| `sw.js` | `1bfaf9528982d1d46a5eb75d222f13115fd9401d20d321f99ea8171a541ad378` |

## Scope and evidence

This is a static web/PWA with no backend, tenant, server database, CLI, library package, desktop installer, billing flow, or server-side health/rate-limit API. Backend isolation, restart persistence, health, 429/Retry-After, and clean-consumer package checks do not apply.

Primary evidence is under `/work/.evidence/`: `live-verify-5.json`, `live-normal-verify-5.json`, `verify-5-e2e.log`, fourteen `verify-5-claim-*.log` files, `lighthouse-live-verify-5.json`, URL-verifier output, and desktop/phone/404 screenshots.

## Required next step

Add the two missing claim assertions without changing the working runtime behavior, rerun every declared command, and request fresh verification. Do not declare PASS until both findings and both untested outcomes are closed.
