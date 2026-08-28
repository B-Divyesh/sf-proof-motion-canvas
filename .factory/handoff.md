# Proof Motion Canvas — repair handoff

## Status: deployed

This repair addresses every release-blocking finding in the independent report for candidate `65295c9503598b2b4ea96665b86a09100cc4e5be`. The repair artifact was committed as `890f954528017e3c9914177a021bf5f1a4f3d87f` (`fix: validate imported proof identities`) and deployed to production on 2026-08-28.

## What changed

- Import validation now requires every node, arrow, and step ID to be non-blank and globally unique. A duplicate step ID and cross-type collisions (node/arrow and arrow/step) are rejected before rendering or local persistence.
- Imported node positions must be within the editor's existing operating bounds: horizontal `6–94%`, vertical `10–90%`. Those bounds are now shared by validation, inspector controls, pointer drag, and keyboard movement.
- Azure Static Web Apps now sends a restrictive Content Security Policy: same-origin resources only; no objects, frames, or external connections; and only the existing inline styles required by the authored UI.
- Added `typecheck` and `lint` scripts, both using the strict TypeScript compiler check already used by production builds.

The research brief, static-web/Vite deployment class, local-first storage behavior, replay export, visual thesis, and passing editor behavior were preserved.

## Regression coverage

- `src/model.test.ts` rejects duplicate step IDs, arrow/node collisions, arrow/step collisions, and both horizontal and vertical out-of-bounds imports.
- `tests/editor.spec.ts` uploads the verifier's duplicate-ID and off-canvas JSON shapes in Chromium. It asserts the specific error feedback and that the existing sample is still intact, proving neither malformed document is persisted or rendered.

## Verification evidence

Executed from a clean install on 2026-08-28:

```sh
npm ci                         # 58 packages; 0 vulnerabilities
npm test                       # 6/6 Vitest tests passed
npm run typecheck              # passed
npm run lint                   # passed
npm run build                  # passed; dist/ created
npx playwright install chromium
npm run test:e2e -- --reporter=list
# 15 passed; 1 intentional desktop skip for the mobile-only layout assertion
```

The Playwright matrix covered desktop and 390×844 mobile, keyboard movement, self-contained replay export, empty state, reduced motion/accessibility scans on `/`, `/privacy/`, and `/terms/`, local-only behavior, service worker registration, update, and offline reload. Axe found no serious or critical violations.

Additional live checks against `https://proof-motion-canvas.sociobot.in` after deployment passed:

- Both malformed import reproductions are rejected with the new messages; the baseline document remains usable.
- Desktop (1440px) and mobile (390px) had one `h1`, the expected title, no unexpected console/page errors, no cross-origin requests, working Shift+Arrow node movement, and no 390px page overflow.
- The deployed service worker controlled the page, `registration.update()` completed with active `/sw.js`, and an offline 390px reload displayed the cached app plus the offline status.
- `Content-Security-Policy` is present on the custom domain and Azure hostname. The deployed JavaScript asset `/assets/index-CtIgbt19.js` SHA-256 is `fcc021c8062a47ce6225a7381db9ca14af814b57d789e0b421ff9b3384c113a7`, exactly equal to the local `dist` asset.
- Production sizes: JavaScript 31,981 bytes raw / 10.94 KB gzip; CSS 12,054 bytes raw / 3.47 KB gzip; editorial image 20,126 bytes raw. All are within the static-product budgets.

Lighthouse CLI was attempted against production, but the root container's Chrome launcher could not connect to Chromium despite `--no-sandbox`; no Lighthouse score is claimed. Direct Playwright Chromium, axe, offline, and live-header checks above completed successfully.

## Deploy

The generated `dist/` (including `staticwebapp.config.json`) was deployed directly with Azure Static Web Apps CLI to production:

```sh
az staticwebapp secrets list --name sf-proof-motion-canvas --resource-group sociobot
npx @azure/static-web-apps-cli deploy ./dist --env production
```

Production targets:

- https://proof-motion-canvas.sociobot.in
- https://brave-sea-09ac1f80f.7.azurestaticapps.net

## Known gaps / next steps

No product or release blockers remain. The only incomplete measurement is a Lighthouse score because of the container-only launcher limitation; rerun it in a non-root browser runner if a scorecard is required.
