# Build inspectable animated explanations

Proof Motion Canvas turns a short argument into a clear, inspectable animated visual. It is for teachers, technical explainers, and curious programmers.

Arrange cards, number labels, and arrows. Attach written claims, set their timing, replay the sequence, and export one self-contained HTML file.

It is an explanation tool, not a formal proof verifier or a general video editor. Author content stays in the browser unless the author explicitly exports it.

Live: <https://proof-motion-canvas.sociobot.in>

One-click sample: <https://proof-motion-canvas.sociobot.in/demo>

## Use it

1. Name the main invariant.
2. Add and position cards or numbers, then connect them with arrows.
3. Add claims and set each claim's target, accessible explanation, start, and end time.
4. Replay with the controls or keyboard (`Space`, `←`, `→`).
5. Export a standalone replay HTML, or download/import JSON to keep editing later.

The demo always opens the bundled five-step example. Demo edits stay in temporary session state. They never read or replace the normal local draft.

Use **Reset demo** to restore the sample. Use **Start for real** to return to your own workspace.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run test:e2e
npm run preview
```

Every public outcome and its browser command is listed in [`.factory/claims.json`](.factory/claims.json). The demo sandbox is documented in [`.factory/demo.md`](.factory/demo.md).

The reproducible deployment command is `npm run build`. Output lands in `dist/`, with `dist/index.html` at its root.

This static product has no backend, account, payment, API key, third-party runtime, or hosted font.

## Privacy and accessibility

Real drafts use the `proof-motion-canvas.document.v1` local-storage key. The demo uses a `demo:` session marker and keeps sample edits in memory.

The service worker makes the shell available after a successful first visit. Editing and export continue offline.

The editor supports keyboard movement, playback, reduced motion, and written claim text. Its 390-pixel layout keeps controls at least 44 pixels tall.

See [Privacy](https://proof-motion-canvas.sociobot.in/privacy/) and [Terms](https://proof-motion-canvas.sociobot.in/terms/).

See [`.factory/brief.json`](.factory/brief.json) for product scope, [`.factory/design.md`](.factory/design.md) for the visual system and asset provenance, and [`.factory/handoff.md`](.factory/handoff.md) for verification results.

## License

MIT. Generated editorial imagery is original to this product; its prompt and provenance are recorded in `assets/src/` and `.factory/design.md`.
