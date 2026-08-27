# Proof Motion Canvas — visual thesis

## Direction

**Monochrome typographic broadsheet.** The product treats an argument like a small newspaper proof: claims are set in a narrow editorial rail, while a spacious “figure desk” makes relationships visible. Rules, registration marks, folio numbers, and restrained paper grain provide identity without becoming decoration. The canvas is an instrument, not a mood board: every visual mark corresponds to a claim, object, relation, or duration.

This is deliberately single-mode. A warm newsprint ground makes long editing sessions calmer, while near-black ink maintains print-grade contrast. Animation state is communicated through weight, line style, labels, and shape as well as the lone vermilion annotation color.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Paper | `#F2EFE7` | App background and exported page |
| Sheet | `#FBFAF5` | Canvas and raised controls |
| Ink | `#171714` | Primary text and structural lines |
| Muted ink | `#5B5A52` | Secondary copy (7.0:1 on paper) |
| Hairline | `#B7B3A7` | Dividers and inactive geometry |
| Vermilion | `#B83220` | Current claim and focus annotation |
| Dark vermilion | `#8E2416` | Accent interaction contrast |
| Success | `#24613D` | Saved/exported state with icon/text |
| Warning | `#7A5312` | Recoverable caution with icon/text |
| Danger | `#9B241A` | Destructive action with icon/text |

## Typography

- Display/editorial: Georgia, `Times New Roman`, serif. No font download; these durable local faces evoke proof sheets and remove font payload/privacy risk.
- Utility/data: `Arial Narrow`, `Roboto Condensed`, Arial, sans-serif. Uppercase labels, tabular timing, and controls use this family.
- Scale: 12 / 14 / 16 / 20 / 30 / 48 px. Body never falls below 16 px. Reading measure stays below 72 characters.

## Spacing and composition

- 4 px base rhythm; working intervals are 8, 12, 16, 24, 32, 48, and 64 px.
- Desktop is a three-part spread: 296 px claim rail, flexible figure desk, 280 px inspector. The playback proof strip runs across the bottom of the workspace.
- At ≤900 px the inspector becomes an in-flow section. At ≤680 px the claim rail, figure desk, and inspector stack; editing controls remain 44 px tall and the canvas stays horizontally stable rather than shrinking text.
- Corners are 0–4 px. Thick boxes are reserved for canvas objects; interface grouping uses whitespace and hairlines.

## Interaction grammar

- **Select:** an object gains a double-line editorial selection mark and corner registration ticks.
- **Connect:** choosing “Arrow” then two objects creates a named directional relation; the toolbar reports the awaited endpoint in words.
- **Sequence:** each step names one claim, references an object, and owns an explicit start/end interval. Timeline blocks expose duration rather than hiding it in keyframes.
- **Inspect:** playback synchronizes the moving figure with persistent accessible claim text. Previous/next step, Space, and arrow keys all work.
- **Commit:** edits save locally immediately and announce “Saved on this device.” Destructive reset is confirmed and followed by a reversible sample-load path.

## Motion policy

- UI feedback uses 160–220 ms opacity/transform transitions.
- Narrative transitions use the author’s declared interval. The active object enters with a 10 px translation and fades; arrows reveal by dash offset. Nothing loops.
- Interruption is deterministic: playback always derives the scene from elapsed timeline time, so pause, step, seek, and restart cannot corrupt state.
- Under `prefers-reduced-motion`, narrative playback advances through discrete states with opacity only; UI transforms and smooth scrolling are removed. The written claim remains the primary explanation in every mode.

## Original asset plan and provenance

- Hero/editorial plate: a generated monochrome cut-paper still life of numbered cards linked by drafting arrows, used only in the welcome/empty-state masthead and social preview. It clarifies the product metaphor without pretending to show the live editor.
- Product icons and canvas marks: hand-authored CSS/SVG geometric marks (arrows, card frames, registration corners); original to this repository.

### Image prompt sheet

Use case: `scientific-educational`. Subject: an overhead editorial still life of five blank index cards arranged as a logical sequence, connected by black drafting arrows and a single vermilion timing arc. World/materials: warm recycled newsprint, letterpress ink, pencil registration marks, cut paper. Light/lens: flat overcast studio light, true top-down, crisp tactile shadows. Palette words: warm paper, charcoal ink, restrained vermilion. Composition: wide 3:2 plate with generous quiet margins; no interface mockup. Negative list: no people, no hands, no readable text, no equations, no logos, no watermark, no gradients, no glossy 3D, no brand marks.

Generated through the factory Azure image endpoint with `/opt/fleet/lib/gen-image.sh`, deployment `factory-image`, on 2026-08-27. Generated imagery is original for this product; prompt sidecar is stored beside the source asset. Final WebP is reviewed for stray text, symbols, seams, and palette consistency and optimized below 300 KB.
