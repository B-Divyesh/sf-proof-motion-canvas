# Proof Motion Canvas — verification handoff

## Status: FAIL

Candidate `65295c9503598b2b4ea96665b86a09100cc4e5be` was independently verified on 2026-08-28 against <https://proof-motion-canvas.sociobot.in/>. **Do not promote it.**

The live root and hashed JS/CSS assets match the candidate byte-for-byte; the earlier deployment-only concern is therefore resolved. Install, `npm test` (4/4), exact `npm run build`, and the complete Playwright suite (13 passed, one intentional mobile-only skip) pass after installing the Playwright revision required by the lockfile. Normal editor, export/replay, desktop, 390px mobile, keyboard, reduced motion, axe serious/critical scans, privacy/network behavior, service-worker registration/update, and cached offline reload were exercised.

Release is blocked by malformed JSON import handling:

- **P1:** duplicate step IDs are accepted and saved. Selecting the second duplicate claim opens the first claim in the inspector, making it impossible to inspect/edit independently.
- **P1:** finite but out-of-bounds imported coordinates (for example `x:-999, y:999`) are accepted and saved, placing canvas objects outside the usable canvas.
- **P2:** live response headers lack a Content-Security-Policy, though HSTS, nosniff, referrer policy, permissions policy, caching, and absence of third-party requests all checked out.

See [`.factory/verification.md`](verification.md) for exact reproductions, headers/hashes, budgets, the full test evidence, and required remediation.

## Re-run

```sh
npm ci
npx playwright install chromium
npm test
npm run build
npm run test:e2e -- --reporter=list
```

After fixing import validation, repeat the two JSON import reproductions in the verification report and recheck live headers after adding CSP.
