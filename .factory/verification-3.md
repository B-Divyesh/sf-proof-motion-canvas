# Verification 3 — Proof Motion Canvas

## Verdict: FAIL

**Candidate:** `4461e2e94f6846ef8a223ff03ef0eb7b99ac69df`
**Live URL:** <https://proof-motion-canvas.sociobot.in/>
**Verified:** 2026-08-28 UTC
**Scope:** independent static-web/PWA QA against the researched brief and factory acceptance contract. No product code was changed.

The live artifact is an exact match for the candidate build and nearly all release gates pass. However, a release-blocking defect remains in the core named-timing editor: after editing an interval, the inspector's calculated duration does not refresh. This makes the editor present a false duration while persisting/exporting a different one. The brief specifically requires named, inspectable timed intervals, so this candidate does not meet the end-to-end acceptance contract.

## Release-blocking defect

### P1 — Inspector reports a stale duration after a timing edit

**Reproduction (fresh local and live browser contexts):**

1. Start a blank argument, add a card, then add a claim. The inspector initially says `Duration: 2.00 s`.
2. Change **Ends (seconds)** from `2` to `5` and leave the field.
3. The persisted step and timeline correctly become `0.0–5.0 s`, but the inspector still says `Duration: 2.00 s`.
4. Boundary recovery is also misleading: enter `0` for **Ends (seconds)**. The model correctly persists the minimum legal value `0.25`, but the visible field remains `0` and the inspector still says `Duration: 2.00 s`.

Fresh Playwright evidence for the valid edit was:

```json
{
  "field": "5",
  "help": "Duration: 2.00 s. Intervals may overlap when two claims need to remain active.",
  "timeline": "1. Claim 1 0.0–5.0 s",
  "saved": { "start": 0, "end": 5 }
}
```

Fresh live 390×844 evidence for the invalid boundary was:

```json
{
  "field": "0",
  "help": "Duration: 2.00 s. Intervals may overlap when two claims need to remain active.",
  "saved": 0.25
}
```

This is not merely cosmetic: authors cannot inspect the duration the editor will actually replay and export. It directly contradicts the product's core promise of explicit, legible timing. The defect is in the identical deployed JavaScript (see identity evidence below).

## Checks that passed

### Clean checkout and release build

- Clean `main` checkout resolved exactly to the candidate SHA; `git status --short` was empty before verification changes.
- `npm ci`: succeeded, 58 packages installed, 0 vulnerabilities.
- `npm test`: **6/6** Vitest model tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed (`tsc --noEmit`, as configured).
- `npm run build`: passed. `dist/index.html` exists.
- Production payloads: JS **32,035 B raw / 10,960 B gzip**, CSS **12,054 B raw / 3,470 B gzip**, editorial WebP **20,126 B**. These are within the 200 KB JS, 50 KB CSS, and 300 KB image budgets; no font payload is shipped.
- The initial browser-suite invocation exposed only an environment mismatch (the lockfile resolved Playwright 1.62 while the container initially had the 1.58 browser cache). Per work order, `npx playwright install chromium` installed the matching Chromium. No repository dependency or product file was changed.
- Then `npx playwright test --project=desktop --reporter=list`: **8 passed, 1 expected mobile-only skip**. `npx playwright test --project=mobile --reporter=list`: **9 passed**. Coverage includes sample replay/export, blank-state authoring, keyboard focus through accessible explanation, malformed import recovery, offline reload, 390 px overflow containment, and axe scans of `/`, `/privacy/`, and `/terms/`.

### Product flows and recovery paths

- Independently replayed the five-step example at 390 px: keyboard `Enter` starts playback and `Space` pauses; a changed claim title and accessible explanation survived export to a downloaded standalone HTML replay. The replay contained five steps, displayed the edited title/text, and had **0 external URL references**.
- Independently created a blank proof, added a card, number, arrow, and claim; local persistence was present; the number x-position was clamped from `-99` to the 6% canvas minimum; rich-looking text was rendered as text rather than injected markup.
- Existing end-to-end coverage rejects duplicate identities and out-of-canvas import data without replacing the prior local proof.
- Destructive reset is confirmation-gated; export is blocked until there is at least one canvas item and claim.

### Accessibility, desktop/mobile, and motion

- `/opt/fleet/lib/verify-url.sh https://proof-motion-canvas.sociobot.in/ …`: HTTP 200; title present; `lang=en`; one h1; main landmark; no images missing alt; no unlabeled buttons; **no online page/console errors**.
- Local axe Playwright scans found **zero serious/critical findings** for app, privacy, and terms on both desktop and mobile. A fresh live axe scan of `/` also found zero serious/critical findings.
- Keyboard probe confirmed Tab remains on `#edit-step-text` after editing a claim name. Focus styling is a visible `rgb(184, 50, 32) solid 3px` outline with a 3 px offset. Skip link is present.
- At 390×844 live mobile, `body.scrollWidth` equalled viewport width (390 px) while the intentional canvas scroller was 712 px. Visual review found readable stacked authoring panels and an intentionally horizontally scrollable canvas.
- `prefers-reduced-motion: reduce` reduces transition duration to 0.01 ms and disables narrative animation under the product stylesheet.

### Privacy, PWA, policies, and deployment identity

- Browser request capture on the live app observed only `https://proof-motion-canvas.sociobot.in`; there are no third-party scripts, fonts, analytics, or trackers. Source inspection finds author data only in browser `localStorage`; the only runtime fetches are same-origin health/offline and service-worker cache requests. Privacy and terms pages accurately disclose this.
- Fresh live PWA check: a service worker was controlling the page, `registration.update()` retained an activated worker with no waiting update, and an offline reload succeeded with the editor h1 and visible offline banner. The only console error during the offline portion was the expected `net::ERR_INTERNET_DISCONNECTED` health request; the online portion had none.
- Live headers on `/`, hashed JS/CSS, `/sw.js`, `/privacy/`, and `/terms/` include the same-origin CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and camera/microphone/geolocation-denying Permissions Policy. HTML revalidates at 30 seconds; hashed assets are `public, max-age=31536000, immutable`; worker is `no-cache`.
- Live and local index, JS, and CSS bytes match:

| Asset | SHA-256 |
| --- | --- |
| `index.html` | `3fffe61717aee61075f48c47211dc844dee52c2a4580b67315a03a671bb057ac` |
| `assets/index-BaF4ALWT.js` | `d90850f57c0ef3c8c9d97f9ab4ccf325ac731b072bb8c227813c0d23f1e9044d` |
| `assets/index-AyV0_1wE.css` | `f24927476ed748f33800e64c3159056d943f94f671f2e8e70bed2cf531753501` |

- Fresh Lighthouse mobile run against live: **Performance 98**, **Accessibility 100**, FCP **1.0 s**, LCP **1.2 s**, CLS **0**, TBT **170 ms**.

## Not applicable

This is a static web PWA, not a library/CLI or backend. Package-consumer API, backend concurrency/persistence, and health/build-identity checks beyond the static asset identity above do not apply.

## Required disposition

Do not accept or redeploy this candidate until the timing inspector is reconciled after both valid and invalid start/end edits, with the saved/exported values and accessible duration text agreeing. Re-run the focused timing-boundary scenario plus the full release suite afterward.
