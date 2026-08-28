# Verification report — FAIL

**Work order:** `proof-motion-canvas-verify-1`  
**Candidate:** `65295c9503598b2b4ea96665b86a09100cc4e5be` (`fix: harden offline and standalone replay flows`)  
**Verified:** 2026-08-28, from a clean worktree at that exact commit  
**Production URL:** <https://proof-motion-canvas.sociobot.in/>

## Decision

**FAIL — do not promote this candidate.** The editor accepts malformed JSON that has duplicate step IDs, then displays two claims but always selects and edits the first one. This is a reproducible data-integrity failure in the advertised import/recovery path. It also accepts out-of-range canvas coordinates and persists an unusable off-canvas document.

The former deployment-only concern is resolved: the current production root document and both hashed production assets match this candidate byte-for-byte.

## Build and automated checks

| Check | Result | Evidence |
| --- | --- | --- |
| Clean candidate | Pass | `git status --porcelain` empty; `HEAD` was `65295c9503598b2b4ea96665b86a09100cc4e5be`. |
| Install | Pass | `npm ci`: 58 packages, 0 audit vulnerabilities. |
| Unit tests | Pass | `npm test`: 4/4 Vitest model tests passed. |
| Type check and exact production build | Pass | `npm run build` (`tsc && vite build`) passed and created `dist/`. |
| Browser/integration/accessibility suite | Pass | After installing the lockfile's matching Playwright 1.62.1 Chromium revision, `npm run test:e2e -- --reporter=list`: 13 passed, 1 intentional desktop skip for a mobile-only test. This includes axe serious/critical scans of `/`, `/privacy/`, and `/terms/` on desktop and 390×844 mobile. |
| Lint | Not available | No lint script or lint configuration is present in the repository. |

The initially preinstalled Chromium did not match the lockfile-resolved Playwright revision; this was runner setup only. `npx playwright install chromium` installed revision 1234, after which the full suite passed.

## Independent product exercise

- Normal sample: five claims, four canvas nodes, playback/pause, previous/next/scrubber, pointer/keyboard movement, local save, and self-contained HTML export all worked.
- Empty/recovery paths: blank document correctly explains that a card is required before adding a claim; creating an arrow with fewer than two items correctly reports the actionable error. Loading a valid document works.
- Export: the live site's downloaded HTML was opened as a `data:` page. It had the expected replay title, five accessible claims, and Play changed to Pause with keyboard Enter.
- Desktop and mobile: independently checked at 1440px and 390×844. At 390px the document width equalled the viewport (390px) while the 680px figure desk remained scrollable internally; controls remained reachable.
- Keyboard/accessibility: one `h1`, title, main/skip link, and designed 3px solid focus outline were present. Shift+Right moved a selected card from `left:18%` to `left:23%`. Reduced-motion computed animation duration was `0.01ms`.
- Console/page errors: none during normal live desktop or mobile use. The intentional offline reload emits the browser's expected `ERR_INTERNET_DISCONNECTED` network-console message for the connectivity probe, catches it, displays the offline banner, and successfully reloads the editor from cache.
- PWA: live registration/update completed with active/controller `/sw.js` and cache `proof-motion-canvas-v1`; an offline reload after first visit showed `Proof Motion Canvas` and the offline status banner.

## Release-blocking defects

### P1 — malformed JSON import corrupts claim identity and makes a claim uneditable

**Reproduction on the live candidate**

1. Import this syntactically valid JSON, which has two steps with the same `id`:

   ```json
   {"version":1,"title":"Duplicate id recovery","invariant":"x","nodes":[{"id":"n1","kind":"card","label":"A","x":20,"y":30}],"arrows":[],"steps":[{"id":"same","title":"First claim","text":"first","targetId":"n1","start":0,"end":1},{"id":"same","title":"Second claim","text":"second","targetId":"n1","start":1,"end":2}]}
   ```

2. The editor announces **“Proof imported and saved locally.”** and renders both `First claim` and `Second claim`.
3. Select `Second claim`. The inspector's claim-name field contains **`First claim`**, because selection resolves duplicate IDs with `find()`.

`validateDocument` checks node uniqueness but never checks step-ID uniqueness (and does not reject an arrow ID that collides with an existing ID). The imported local draft is therefore corrupt and cannot be reliably inspected or repaired through the UI. Reject duplicate IDs across all entities, or assign unique IDs on import before saving/rendering.

### P1 — malformed JSON import accepts coordinates outside the editor's operational bounds

**Reproduction on the live candidate:** import a document with a node at `x: -999, y: 999`. It announces **“Proof imported and saved locally.”** and renders the node with `style="left:-999%;top:999%"`, outside the usable canvas. UI-created nodes are bounded to x `6–94` and y `10–90`, but `validateDocument` only requires finite numbers. Reject or clamp imported coordinates to the same documented/editor bounds before local persistence.

## Non-blocking finding

### P2 — production responses do not send a Content-Security-Policy

The live root, JavaScript, CSS, legal pages, and service worker send HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive camera/microphone/geolocation Permissions-Policy. They do **not** send `Content-Security-Policy`. Configure a static-site CSP that permits only this origin, the inline styles/scripts required by standalone exports as applicable, and no third-party connections. This is defense-in-depth; no third-party browser requests were observed.

## Deployment, privacy, caching, and budget evidence

- `GET /`: HTTP 200, 772 bytes, `Last-Modified: Thu, 27 Aug 2026 21:49:57 GMT`; SHA-256 `9b02c48329ce19a298961969b20b5f1499d9a590fdb5cb446db1d27328f4244c`, equal to local `dist/index.html`.
- Live `/assets/index-DBGkx2uN.js` and `/assets/index-AyV0_1wE.css` SHA-256 values equal the local production build. This confirms the live deployment is the candidate, not merely a page with the same shell.
- Hashed JS/CSS and WebP are `Cache-Control: public, max-age=31536000, immutable`; `/sw.js` is `no-cache`; HTML is revalidated at 30 seconds. This is appropriate for the app-shell update strategy.
- Initial app JavaScript is 31,477 bytes raw / 10.79 KB gzip; CSS is 12,054 bytes raw / 3.47 KB gzip; generated WebP is 20,126 bytes; total `dist/` is 71,583 bytes. All are well below the 200 KB JS, 50 KB CSS, and 300 KB hero-image budgets. No runtime font files are loaded.
- Fresh live browser capture found no cross-origin requests. Source review found localStorage for the one local draft, same-origin service-worker fetches, no analytics/tracker APIs, no external scripts/fonts, and reachable `/privacy/` and `/terms/` pages.
- A Lighthouse mobile run was attempted against the exact local production preview, but the ephemeral Chrome-for-Testing process could not be connected by Lighthouse despite direct Chromium/Playwright operation. No Lighthouse score is claimed; static budget checks and browser/axe checks above are actual evidence.

## Required next steps

1. Harden `validateDocument` to reject duplicate IDs for nodes, arrows, and steps and to enforce (or normalize) canvas coordinate bounds.
2. Add regression tests for duplicate step IDs, cross-type ID collisions, and out-of-bounds imported coordinates; rerun the full suite and the import reproductions.
3. Add an appropriate CSP at the static hosting layer, then rerun header verification.
