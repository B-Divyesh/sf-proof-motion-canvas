# Demo sandbox

- URL: `https://proof-motion-canvas.sociobot.in/demo`
- Local URL: `http://127.0.0.1:4173/demo` after `npm run build && npm run preview -- --host 127.0.0.1`
- Entry action: **Try it with sample data** on the first screen
- Sample: “Why the sum stays constant,” with four canvas items, one arrow, five written claims, and 11 seconds of named timing
- Persistent label: **Demo — sample data, nothing is saved**
- Reset: **Reset demo** restores the bundled sample immediately
- Exit: **Start for real** clears the demo marker and returns to the normal draft

Demo mode never reads or writes `proof-motion-canvas.document.v1`, the real-draft local-storage key. It creates only the `demo:proof-motion-canvas.active` marker in `sessionStorage`; edited sample content stays in memory and resets on reload. Downloaded JSON or replay HTML is created only after the visitor explicitly chooses a download action.

The claim tests enter through `/demo` from fresh browser state. The isolation test seeds a synthetic real-data sentinel, edits and resets the demo, then confirms that **Start for real** restores the untouched sentinel.
