# Proof Motion Canvas

Proof Motion Canvas is a local-first editor for turning a short argument into a clear, inspectable animated visual. Teachers, technical explainers, and curious programmers can arrange cards, numeric labels, and arrows; attach written claims; expose each claim's start and end time; replay the sequence; and export one self-contained HTML file.

It is an explanation tool, not a formal proof verifier or a general video editor. Author content stays in the browser unless the author explicitly exports it.

Live: <https://proof-motion-canvas.sociobot.in>

## Use it

1. Name the main invariant.
2. Add and position cards or numbers, then connect them with arrows.
3. Add claims and set each claim's target, accessible explanation, start, and end time.
4. Replay with the controls or keyboard (`Space`, `←`, `→`).
5. Export a standalone replay HTML, or save/import JSON to keep editing later.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

The reproducible deployment command is `npm run build`. Output lands in `dist/`, with `dist/index.html` at its root. No backend, API key, third-party runtime, or hosted font is required.

## Privacy and accessibility

Drafts are stored only in browser `localStorage`. The service worker makes the shell available after a successful first visit. The editor supports keyboard movement and playback, reduced motion, accessible claim text alongside animation, and mobile layouts. See `/privacy/` and `/terms/` in the built site.

See [`.factory/brief.json`](.factory/brief.json) for product scope, [`.factory/design.md`](.factory/design.md) for the visual system and asset provenance, and [`.factory/handoff.md`](.factory/handoff.md) for verification results.

## License

MIT. Generated editorial imagery is original to this product; its prompt and provenance are recorded in `assets/src/` and `.factory/design.md`.
