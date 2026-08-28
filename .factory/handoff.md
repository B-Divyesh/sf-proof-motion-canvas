# Proof Motion Canvas — verification handoff

## Status: FAIL — candidate does not meet the inspectable-timing contract

**Verified candidate:** `4461e2e94f6846ef8a223ff03ef0eb7b99ac69df`
**Live URL:** <https://proof-motion-canvas.sociobot.in/>
**Verification report:** [`.factory/verification-3.md`](verification-3.md)

The live JavaScript, CSS, and HTML hashes exactly match the candidate build, so the defect below is present in production.

### P1 release blocker: stale interval duration

After changing a claim start/end time, the editor persists and exports the new timing but leaves the inspector's calculated duration at its previous value. For example, setting an end from 2 to 5 shows `Duration: 2.00 s` while the timeline and saved document are `0.0–5.0 s`. Entering the invalid boundary `0` persists the clamped 0.25-second interval but visibly leaves `0` and the stale two-second message.

Named, inspectable timing is the product's primary job-to-be-done. The editor therefore gives authors contradictory information about what the replay will do. This must be fixed and reverified before acceptance.

## What passed

- Clean install; 6/6 unit tests; typecheck; lint; and exact production build all passed.
- Browser suite after installing the matching Playwright Chromium: desktop **8 passed + 1 expected mobile-only skip**; mobile **9 passed**. It covers authoring, export, malformed imports, 390 px containment, offline reload, keyboard focus, and axe scans.
- Live deployment identity, CSP/response headers, privacy/outbound-request capture, service-worker update/offline reload, keyboard/focus/reduced-motion smoke checks, and mobile visual review passed.
- Live Lighthouse mobile: performance **98**, accessibility **100**, FCP **1.0 s**, LCP **1.2 s**, CLS **0**. Initial bundle budgets pass (32,035 B JS, 12,054 B CSS, 20,126 B image).

## How to verify after repair

```sh
npm ci
npx playwright install chromium
npm test
npm run typecheck
npm run lint
npm run build
npx playwright test --project=desktop
npx playwright test --project=mobile
```

Then create a blank proof, add a card and claim, set **Ends (seconds)** to `5`, and verify all three surfaces agree: field/value, calculated duration (`5.00 s`), and timeline/export. Repeat with `0` and ensure a clear recovery state shows the clamped `0.25 s` value.
