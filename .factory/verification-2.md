# Verification report 2 — FAIL

**Work order:** `proof-motion-canvas-verify-2`  
**Candidate tested:** `a0ca42f62b1c5eccb84207d873a0f1b209c5eb09`  
**Verified:** 2026-08-28 from a clean checkout at that commit  
**Production URL:** <https://proof-motion-canvas.sociobot.in/>

## Decision

**FAIL — do not promote.** The production deployment is the tested candidate and the earlier deployment-only concern is resolved. However, standard keyboard authoring of a claim is broken: changing the claim name and pressing Tab redraws the inspector, drops focus to `body`, and prevents entry into the required accessible-explanation field. Typing the explanation can instead invoke global `C`/`N` shortcuts and alter the canvas. This directly violates the brief's requirement for accessible step text and the keyboard-accessibility acceptance requirement.

## Release-blocking defect

### P1 — claim title change destroys keyboard focus and prevents accessible explanation entry

Reproduced against the production URL and the exact local production build:

1. Select **New**, **Add first card**, then **Add claim**.
2. Type `My invariant` in **Claim name**.
3. Press Tab, the normal keyboard path to **Accessible explanation**.
4. The `change` handler rerenders the entire inspector. `document.activeElement` is now `body`, not `#edit-step-text`; no text cursor remains in the explanation field.
5. Typing an explanation does not populate the field. Letters such as `c` and `n` invoke the document-level shortcuts to add a card/number, select that new node, and remove the claim inspector from view.

The checked live DOM still shows the default text, `Describe what changes and why it supports the argument.`, rather than the author-provided explanation. A mouse/user can recover only by deliberately refocusing the recreated field; the normal keyboard-only workflow is not operable. The product's central authoring flow therefore cannot reliably produce its required accessible step text.

**Required fix:** preserve focus and the active input across inspector updates (or defer rerendering until the edit is committed), and suppress global shortcuts while any editable control or its update transition is active. Add an end-to-end regression that types the title, Tabs to the explanation, types explanatory text, and confirms it appears in the exported standalone replay.

## Checks that passed

| Area | Result and fresh evidence |
| --- | --- |
| Clean checkout/install | `git status --short` was empty at the candidate; `npm ci` installed 58 packages with 0 vulnerabilities. |
| Unit/model tests | `npm test` passed: 6/6 tests. |
| Static checks | `npm run typecheck` and `npm run lint` both passed (`tsc --noEmit`). |
| Exact build | `npm run build` passed (`tsc && vite build`) and produced `dist/`. |
| Browser suite | After `npx playwright install chromium`, `npm run test:e2e -- --reporter=list` passed: 15 tests passed and the one desktop instance of the mobile-only assertion was intentionally skipped. `test-results/.last-run.json` reports `passed`. |
| Representative product flow | The sample proof has 5 inspectable claims, 4 nodes and an arrow; playback/pause, previous/next/scrubber, keyboard movement, local saving, JSON export, and standalone HTML replay passed. A blank proof correctly rejects export and claim creation before a canvas item; an arrow with the same start/end is rejected. Creating a new card, number, arrow, and five titled claims also worked until the P1 text-entry failure. |
| Import recovery/boundaries | Live duplicate IDs are rejected with `Two proof items have the same identity.`; x=95 is rejected with `A canvas item must stay within 6–94% horizontally and 10–90% vertically.` The existing document remained present after both failed imports. Model tests cover cross-type ID collisions and out-of-bounds values. |
| Live identity | Local `dist/assets/index-CtIgbt19.js` SHA-256 is `fcc021c8062a47ce6225a7381db9ca14af814b57d789e0b421ff9b3384c113a7`, exactly matching the live asset. Local CSS SHA-256 `f24927476ed748f33800e64c3159056d943f94f671f2e8e70bed2cf531753501` also exactly matches production. |
| Desktop/mobile and motion | At 390×844, `document.body.scrollWidth` was 390 while the 712px canvas remained internally scrollable. A focused button had a visible 3px solid outline. Under reduced motion, node transition duration computed as `0.01ms`. |
| Accessibility | Playwright axe scans of `/`, `/privacy/`, and `/terms/` passed in the repository suite. A fresh live 390px axe scan found no serious or critical violations. Live page has `lang=en`, one h1, title, main landmark, and skip link. |
| Errors/requests/privacy | No console or page errors during normal online live use. The fresh mobile capture made requests only to `https://proof-motion-canvas.sociobot.in`; source and browser checks show only one localStorage draft plus same-origin service-worker cache, with no analytics, third-party font, or runtime-script requests. `/privacy/` and `/terms/` are present. |
| PWA | On the live site, the service worker controlled the page at `/sw.js`; `registration.update()` completed with the active worker unchanged. After first load, a 390px offline reload rendered the editor h1 and visible offline banner. |
| Headers/caching | Live `/`, legal pages, JS, CSS and `/sw.js` all return CSP (`default-src 'self'` with same-origin-only connections/scripts), `nosniff`, `strict-origin-when-cross-origin`, and restrictive camera/microphone/geolocation Permissions-Policy. HTML revalidates at 30 seconds; hashed JS/CSS are `public, max-age=31536000, immutable`; `/sw.js` is `no-cache`. |
| Budgets/Lighthouse | Build output: JS 31,981 bytes raw / 10.94 KB gzip; CSS 12,054 / 3.47 KB; WebP 20,126 bytes. All are within the stated budgets. Fresh production Lighthouse, using Chrome for Testing: performance **99**, accessibility **100**, FCP **1.0 s**, LCP **1.3 s**, CLS **0**, TBT **150 ms**. |

## Defects by severity

- **P1:** Keyboard title-to-explanation editing loses focus and can activate global canvas shortcuts; see reproduction above.
- **P2/P3:** None found in this verification pass.

## Scope notes

This is a static web/PWA product, not a library, CLI, or backend; consumer-package, concurrency, persistence-server, and health-identity checks do not apply. No product code was modified during verification.
