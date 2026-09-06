# Review 1 — Build inspectable animated explanations

## Verdict

**FAIL — 7 findings, including 3 high-severity findings. There are 8 public claim outcomes without declared claim tests.**

Proof Motion Canvas works as an editor, but it does not meet the strict factory contracts attached to this review. A PASS requires zero findings and zero untested claims.

- Work order: `proof-motion-canvas-review-1`
- Live URL: <https://proof-motion-canvas.sociobot.in/>
- Reviewed on: 6 September 2026 UTC
- Implementation reviewed: `696f2ea9643956eafb6e3d5a7aaf0b2baab09fa0`
- Documentation baseline: `076d62448c55f4229cf6b519b51fc60b72e6aea2`
- Reason for different SHAs: commits after `696f2ea` changed only `.factory/handoff.md` and `.factory/verification-4.md`.

The live index, JavaScript, CSS, service worker, and editorial image match the production build from the implementation commit byte for byte.

## Job, audience, and first action before scrolling

The job is to turn a short argument into an inspectable animated explanation. The audience is teachers, technical explainers, and curious programmers. The required first action is **Try it with sample data**, with a short explanation of what it loads.

The live first screen does not state those three things. Its h1 is `Proof Motion Canvas`. It does not name the audience. A fresh visit silently shows sample content and offers `New`, `Import`, `Save JSON`, and `Export replay`, so there is no clear sample action. On a 390×844 phone, the first screen ends in the claim list before the canvas and replay controls appear.

## Findings

### F1 — High — The sample is not an isolated demo

The required `/demo` sandbox does not exist as a separate mode.

- A fresh isolated browser was seeded with a synthetic normal draft named `REAL DATA SENTINEL`.
- Opening `/demo` displayed that normal draft instead of sample data.
- Editing the title on `/demo` changed `proof-motion-canvas.document.v1`, the normal storage key.
- No `demo:` storage key was created.
- There is no persistent `Demo — sample data, nothing is saved` label, `Reset demo`, or `Start for real` action.
- `Load example` appears only after the user chooses the destructive `New` path. It saves the example to the normal draft key.
- `.factory/demo.md` is missing.

The probe used only synthetic data inside a new browser context. It did not access or change a real user's data.

Required repair: make `/demo` enter a separate storage namespace, always load the sample, show the persistent demo controls, discard demo changes when leaving, and document the mode in `.factory/demo.md`.

### F2 — High — The first screen does not explain the job or first step

The root page does not follow the required plain-words first-screen shape.

- The h1 is the product name, not a job title of nine words or fewer.
- There is no sentence naming the audience and the result.
- There is no primary `Try it with sample data` action or adjacent explanation.
- The three required facts about privacy, offline use, and price are not presented together.
- Copy such as `Param Factory · instrument 01`, `Figure desk`, and `A proof you can pause` is product lore or metaphor instead of task language.
- `.factory/copy-audit.md` is missing.

Required repair: add a first screen headed with the job, name the audience, make the sample the clear first action, show the three facts, and complete the copy audit.

### F3 — High — Public claims have no declared claim tests

`.factory/claims.json` is missing, so there are no declared claim commands and no `@claim:<id>` tests. Eight distinct public outcomes are untested under the claims contract:

1. Draft content stays on the device and is not sent away.
2. The shell works offline after the first successful visit.
3. Editing and replay export still work while offline.
4. Replay export produces one self-contained HTML file.
5. Keyboard movement and playback work.
6. Reduced-motion preferences are respected.
7. Written claim text remains available beside motion.
8. The editor has a usable mobile layout.

Independent review probes observed all eight outcomes working, but this does not replace the required claim registry and one tagged sandbox test per claim. No claim command was hidden or skipped; none exists to run.

Required repair: add `.factory/claims.json`, give each outcome exactly one observable demo-based test, and tag each test with its claim ID. The privacy test must record requests through the whole demo flow.

### F4 — Medium — Demo and missing routes do not have correct routing behavior

- `/demo` returns the root editor with the root title instead of `Demo — Proof Motion Canvas`.
- `/missing-review-route` and `/404` return HTTP 200 and the editor.
- There is no designed 404 page with a route back.
- The app does not announce route changes or move focus to a route h1 because those routes are not implemented in the app.

This is not a finding about an intentional HTTP 404. The required 404 response and page are absent.

Required repair: implement the real demo route and designed 404 response, set route titles, and add the required route focus and announcement behavior.

### F5 — Medium — The required site structure is incomplete

The root is only the editor. It omits the ordered landing sections for the first screen, live preview context, three-step explanation, and limits/privacy. Its `<footer>` is the replay toolbar, not a site footer with the product line, Privacy, Terms, Param Factory attribution, and build ID.

The Privacy and Terms pages exist and their links work, but neither page has the standard header, navigation, or footer.

Required repair: add the standard information order around the live product and use the standard header and footer on every route.

### F6 — Medium — Required metadata and route discovery are missing

The root, demo, Privacy, and Terms pages have no canonical link, Open Graph metadata, Twitter card metadata, or Apple touch icon. There is no 1200×630 social image derived from the product art. The sitemap lists only `/`, `/privacy/`, and `/terms/`; it omits `/demo`.

The existing root, Privacy, and Terms titles are within the required format. The demo title is not.

Required repair: add per-route canonical and social metadata, ship the required touch and social images, and list every real route in the sitemap.

### F7 — Medium — Several touch targets are smaller than 44×44 px

At 390 px wide, the replay controls shrink below the minimum target width: Previous and Next measure 22×44 px, and Play measures 41×44 px. The Privacy and Terms links measure 41×14 px and 34×14 px. The same undersized replay arrows were also measured on desktop.

The automated axe scan reports no violation because this size check requires separate measurement.

Required repair: prevent replay controls from shrinking below 44×44 px and give the legal links a 44 px interactive area.

## Product paths checked

The following paths passed independently on the byte-matched live deployment:

- Fresh sample: 5 named claims, 4 canvas nodes, realistic timing, and visible written explanations.
- Normal use: edit a claim, move through fields with Tab, play and pause, and export a replay.
- Export: the downloaded 7,905-byte HTML contained the edited title and explanation and no HTTP URL references.
- Empty state: `New` produced a blank argument; trying to add a claim gave `Add a canvas item before adding a claim.`
- Invalid import: an off-canvas node was rejected and the existing document remained intact.
- Boundary recovery: end time `5` displayed and saved `5`; end time `0` was visibly clamped and saved as `0.25`; duration text agreed both times.
- Duplicate identity recovery: the current end-to-end test rejected duplicate step IDs without replacing the current proof.
- Keyboard: Tab moved from claim name to accessible explanation; the skip link was first and had a visible 3 px outline; the arrow dialog focused its first field and Escape closed it.
- Reduced motion: animation and transition duration computed to `0.01 ms`.
- Mobile: the page itself stayed within 390 px; the canvas scrolled inside its section.
- Privacy: the full live flows requested only `https://proof-motion-canvas.sociobot.in`; source review found no analytics, trackers, external scripts, or remote fonts.
- Offline and update: the worker was active with no waiting update; offline reload, editing, local saving, and replay export worked. The expected disconnected same-origin probe logged `ERR_INTERNET_DISCONNECTED` only while offline.
- Links and legal pages: root Privacy and Terms links returned 200; legal return links worked; `mailto:` links were explicit.
- Console: no errors occurred during online desktop, phone, editor, export, or recovery flows.

Backend, tenant-isolation, restart-persistence, rate-limit, CLI, library, and installed desktop checks do not apply to this static product.

## Accessibility and performance

- Fresh live Playwright axe scan: zero violations on root at desktop and phone sizes.
- Repository axe coverage: root, Privacy, and Terms passed at desktop and phone sizes.
- `verify-url.sh`: HTTP 200, title, `lang=en`, one h1, main landmark, alt text, labeled buttons, and no online console errors.
- The standalone axe CLI could not pair its ChromeDriver with the installed Chromium. The repository and live checks used the supported Playwright axe integration with axe-core 4.13.0 instead.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.98 s, LCP 1.13 s, CLS 0, TBT 65 ms.
- Initial JavaScript: 32,374 bytes raw, 10,943 bytes gzip.
- Initial CSS: 12,054 bytes raw, 3,489 bytes gzip.
- Editorial image: 20,126 bytes.
- Total `dist/`: 72,771 bytes.

The payload and measured runtime meet the static-product performance budgets. Finding F7 remains despite the automated accessibility scores.

## Clean checkout commands

The tree was clean at documentation SHA `076d624` before review output was added.

| Command | Result |
| --- | --- |
| `npm ci` | Pass; 58 packages, 0 vulnerabilities |
| `npm run dev -- --host 127.0.0.1` | Pass; root returned 200 |
| `npm test` | Pass; 6/6 unit tests |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass; `dist/index.html` created |
| `npm run preview -- --host 127.0.0.1` | Pass; root returned 200 |
| `npx playwright install chromium` | Pass; installed the lockfile-matching browser |
| `npm run test:e2e -- --reporter=list` | Pass; 19 passed, 1 intentional desktop skip |
| Declared claim commands | Fail; `.factory/claims.json` does not exist |

The earlier handoff described the browser suite as `20/20`. The current runner reports 19 passed and one intentional mobile-only test skipped on desktop; this report uses the runner's actual result.

## Earlier finding disposition

| Earlier finding | Current disposition and proof |
| --- | --- |
| Duplicate IDs could corrupt imported claims | Fixed. The current exact-candidate browser test rejects duplicate step IDs and preserves the five-step proof. |
| Imported nodes could be saved outside canvas bounds | Fixed. The live import rejected `x=-999, y=999` with the bounds error and kept the current title. |
| Production had no CSP | Fixed. Live responses send the same-origin CSP from `staticwebapp.config.json`. |
| Claim-title edits lost keyboard focus | Fixed. A fresh live edit moved focus to `#edit-step-text`; exported text was correct. |
| Timing duration stayed stale after edits | Fixed. Live valid and clamped values agreed in the field, duration text, timeline, local storage, and export. |
| Deployment identity was uncertain | Fixed. All five checked live artifacts match the implementation build hashes below. |

## Deployment identity

| Asset | SHA-256 |
| --- | --- |
| `index.html` | `2cdc2a70da3bdb16ccc73be040d09da5b7a690e22da6a45318d27d0714960c10` |
| `assets/index-CoFjPMcN.js` | `f7871fac3f8c05c5c814e6755550de4da047ebca4989609c0087f0d89b761c92` |
| `assets/index-AyV0_1wE.css` | `f24927476ed748f33800e64c3159056d943f94f671f2e8e70bed2cf531753501` |
| `sw.js` | `ea0b5a1c94d090eeff6a72188dd06663199bc4df8f892f3a50935d21068d1453` |
| `assets/editorial-plate.webp` | `5af3f54f0cefbe9f806c29e16f82b8ade278fbf34486946dc439237fb0bee6ac` |

## Required next action

Repair F1–F7 in product code and contract files, then run a new strict review. Do not declare PASS until every finding is closed and every public claim has a passing declared sandbox test.
