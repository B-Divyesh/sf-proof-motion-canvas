# Proof Motion Canvas — verification handoff

## Status: FAIL — do not promote

Independent QA of candidate `a0ca42f62b1c5eccb84207d873a0f1b209c5eb09` against <https://proof-motion-canvas.sociobot.in/> found one release-blocking P1 defect. The live JavaScript and CSS hashes exactly equal the candidate build, so this is not a deployment-only discrepancy.

After changing a claim name, pressing Tab redraws the inspector and moves focus to `body` instead of **Accessible explanation**. Explanation typing is lost; `c` and `n` can activate global canvas shortcuts and replace the inspector. This makes the required keyboard-only, accessible-step-text workflow unreliable.

See [`.factory/verification-2.md`](verification-2.md) for exact reproduction, evidence, headers/caching/privacy checks, PWA checks, and the full defect inventory.

## Verification commands

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e -- --reporter=list
```

All of these passed (6/6 unit tests; 15 Playwright passed and one intended mobile-only desktop skip). Production Lighthouse measured 99 performance and 100 accessibility, but those results do not override the P1 functional/accessibility failure.

## Required next step

Fix inspector rerender/focus preservation and add a regression covering title → Tab → accessible-explanation entry → standalone export. Then repeat the verification report's local and live checks before promotion.
