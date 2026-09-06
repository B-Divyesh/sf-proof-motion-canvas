# Proof Motion Canvas — review 1 handoff

## Status: FAIL

Strict review 1 found 7 defects and 8 public claim outcomes without declared claim tests. The implementation remains `696f2ea9643956eafb6e3d5a7aaf0b2baab09fa0`; later commits before this review changed only verification documents. No product code was changed during this review.

The editor's main flow works, the live deployment byte-matches the implementation, all earlier implementation defects remain fixed, and local build and browser checks pass. Acceptance still fails because there is no isolated demo mode, the first screen does not state the job and first step, `.factory/claims.json` is missing, site routing and structure are incomplete, required metadata is absent, and several touch targets are too small.

See `.factory/review-1.md` for reproductions, evidence, the eight-claim inventory, earlier-finding disposition, and exact asset hashes.

## Verification completed

```sh
npm ci
npm run dev -- --host 127.0.0.1
npm test
npm run typecheck
npm run lint
npm run build
npm run preview -- --host 127.0.0.1
npx playwright install chromium
npm run test:e2e -- --reporter=list
```

Results: 6/6 unit tests passed; typecheck, lint, and build passed; `dist/` was created; 19 browser tests passed with one intentional desktop skip. Fresh live desktop and 390×844 phone checks covered sample content, normal editing, empty/error paths, invalid import, timing boundaries, recovery, export, keyboard and dialog focus, reduced motion, accessibility, privacy requests, offline reload/edit/export, worker update state, route metadata, links, legal pages, 404 behavior, and performance.

Lighthouse mobile scored 100 in Performance, Accessibility, Best Practices, and SEO. FCP was 0.98 s, LCP 1.13 s, CLS 0, and TBT 65 ms. The build contains 32,374 bytes of initial JavaScript, 12,054 bytes of CSS, and totals 72,771 bytes.

## Next steps

1. Build `/demo` with isolated storage, a persistent sample label, Reset demo, Start for real, and `.factory/demo.md`.
2. Rewrite the first screen around the job, audience, sample action, and three facts; add `.factory/copy-audit.md`.
3. Add `.factory/claims.json` and one tagged demo-based test for each of the eight public outcomes listed in the review.
4. Add the required landing structure, shared site header/footer, real demo route, designed 404, route focus announcements, metadata, social image, touch icon, and sitemap entries.
5. Increase every interactive target to at least 44×44 px.
6. Run the full command set and request another strict review.
