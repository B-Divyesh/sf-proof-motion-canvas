import './style.css'
import { duration, emptyDocument, normalizeSteps, sampleDocument, stepAtTime, uid, validateDocument, type ProofDocument } from './model'
import { standaloneHtml } from './export'

const STORAGE_KEY = 'proof-motion-canvas.document.v1'

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char)
const byId = <T extends Element>(id: string): T => document.getElementById(id) as unknown as T
const fileName = (title: string, extension: string): string => `${title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'proof'}.${extension}`

const loadDocument = (): ProofDocument => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? validateDocument(JSON.parse(stored)) : sampleDocument()
  } catch {
    return sampleDocument()
  }
}

let proof = loadDocument()
let selectedType: 'node' | 'arrow' | 'step' | null = null
let selectedId = ''
let currentTime = 0
let playing = false
let playOrigin = 0
let animationFrame = 0
let toastTimer = 0

const app = byId<HTMLDivElement>('app')
app.innerHTML = `
  <div class="app-shell">
    <header class="masthead">
      <div class="brand-lockup">
        <span class="brand-kicker">Param Factory · instrument 01</span>
        <h1>Proof Motion Canvas</h1>
      </div>
      <div class="document-heading">
        <label for="document-title">Argument title</label>
        <input class="title-input" id="document-title" type="text" maxlength="80" autocomplete="off">
      </div>
      <nav class="top-actions" aria-label="Document actions">
        <button class="button" id="new-button" type="button">New</button>
        <button class="button" id="import-button" type="button">Import</button>
        <button class="button" id="json-button" type="button">Save JSON</button>
        <button class="button primary" id="export-button" type="button">Export replay</button>
      </nav>
    </header>
    <div class="offline-banner" id="offline-banner" role="status" hidden><span aria-hidden="true">◌</span> Offline — editing and export still work on this device.</div>
    <main class="workspace" id="main">
      <aside class="claims-panel" aria-labelledby="claims-title">
        <div class="panel-head"><div><div class="section-kicker">Argument</div><h2 id="claims-title">Claim sequence</h2></div><span class="folio" id="claim-count">0 steps</span></div>
        <div class="invariant-wrap"><label for="invariant">Main invariant</label><textarea id="invariant" maxlength="240" placeholder="What remains true throughout?"></textarea></div>
        <ol class="claim-list" id="claim-list"></ol>
        <button class="button" id="add-step" type="button">＋ Add claim</button>
        <p class="local-note"><span aria-hidden="true">●</span> Private by default. Saved only in this browser.</p>
        <p class="local-note">The welcome plate is AI-generated. <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
      </aside>
      <section class="stage-panel" aria-labelledby="stage-title">
        <div class="stage-head">
          <div><div class="section-kicker">Figure desk</div><h2 id="stage-title">Argument canvas</h2></div>
          <div class="tool-row" role="toolbar" aria-label="Add canvas items">
            <span class="tool-label">Add</span>
            <button class="button" data-add="card" type="button">▭ Card</button>
            <button class="button" data-add="number" type="button">◯ Number</button>
            <button class="button" id="add-arrow" type="button">→ Arrow</button>
          </div>
        </div>
        <div class="canvas-shell" id="canvas" aria-label="Proof canvas. Select an item, then use arrow keys to move it." tabindex="0">
          <svg class="arrow-layer" id="arrows" viewBox="0 0 100 60" preserveAspectRatio="none" aria-label="Relationships"></svg>
          <div id="nodes"></div>
          <div class="canvas-empty" id="canvas-empty" hidden>
            <img src="/assets/editorial-plate.webp" width="768" height="512" alt="Five blank paper cards linked by drafting arrows on warm newsprint">
            <div><div class="eyebrow">A proof you can pause</div><h3>Make every claim inspectable.</h3><p>Add a card or begin with the worked five-step example. Then name what changes—and when.</p><div class="empty-actions"><button class="button accent" data-add="card" type="button">Add first card</button><button class="button" id="load-sample" type="button">Load example</button></div></div>
          </div>
        </div>
        <div class="canvas-caption"><span id="canvas-status"><strong>Edit mode.</strong> Drag an item or use arrow keys.</span><span>Explanation ≠ formal verification</span></div>
      </section>
      <aside class="inspector-panel" aria-labelledby="inspector-title"><div class="section-kicker">Details</div><h2 id="inspector-title">Inspector</h2><div class="inspector-content" id="inspector"></div></aside>
    </main>
    <footer class="proof-strip" aria-label="Replay controls">
      <div class="play-controls">
        <button class="button icon-button" id="previous-step" type="button" aria-label="Previous claim">←</button>
        <button class="button primary" id="play-button" type="button" aria-label="Play proof">▶ <span class="optional-label">Play proof</span></button>
        <button class="button icon-button" id="next-step" type="button" aria-label="Next claim">→</button>
        <input class="scrubber" id="scrubber" type="range" min="0" max="1" value="0" step="0.01" aria-label="Replay position">
        <output class="timecode" id="timecode">0.0 / 0.0 s</output>
      </div>
      <div class="timeline" id="timeline" aria-label="Named timing intervals"></div>
    </footer>
  </div>
  <dialog class="dialog" id="arrow-dialog" aria-labelledby="arrow-title">
    <form class="dialog-form" id="arrow-form" method="dialog">
      <div class="eyebrow">New relation</div><h2 id="arrow-title">Connect two items</h2><p class="help">The arrow remains attached when either item moves.</p>
      <div class="field"><label for="arrow-from">Starts at</label><select id="arrow-from" required></select></div>
      <div class="field"><label for="arrow-to">Points to</label><select id="arrow-to" required></select></div>
      <div class="field"><label for="arrow-label">Relation label</label><input id="arrow-label" type="text" maxlength="40" value="leads to" required></div>
      <div class="dialog-actions"><button class="button quiet" value="cancel" type="button" id="cancel-arrow">Cancel</button><button class="button primary" value="default" type="submit">Add arrow</button></div>
    </form>
  </dialog>
  <input id="file-input" type="file" accept="application/json,.json" hidden>
  <div class="toast" id="toast" role="status" aria-live="polite" hidden></div>
`

const titleInput = byId<HTMLInputElement>('document-title')
const invariantInput = byId<HTMLTextAreaElement>('invariant')
const scrubber = byId<HTMLInputElement>('scrubber')
const canvas = byId<HTMLDivElement>('canvas')
const arrowDialog = byId<HTMLDialogElement>('arrow-dialog')

const notify = (message: string, isError = false): void => {
  const toast = byId<HTMLDivElement>('toast')
  window.clearTimeout(toastTimer)
  toast.textContent = message
  toast.classList.toggle('error', isError)
  toast.hidden = false
  toastTimer = window.setTimeout(() => { toast.hidden = true }, 3200)
}

const save = (announce = false): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proof))
    if (announce) notify('Saved on this device.')
  } catch {
    notify('This browser could not save locally. Export JSON to keep a copy.', true)
  }
}

const targetName = (id: string): string => {
  const node = proof.nodes.find((item) => item.id === id)
  if (node) return node.label
  return proof.arrows.find((item) => item.id === id)?.label ?? 'Missing target'
}

const renderSequence = (): void => {
  const list = byId<HTMLOListElement>('claim-list')
  byId('claim-count').textContent = `${proof.steps.length} ${proof.steps.length === 1 ? 'step' : 'steps'}`
  if (!proof.steps.length) {
    list.innerHTML = '<li class="empty-claims">No claims yet. Add one after placing a canvas item.</li>'
    return
  }
  const activeIndex = stepAtTime(proof, currentTime)
  list.innerHTML = proof.steps.map((step, index) => `
    <li class="claim-item"><button type="button" data-select-step="${escapeHtml(step.id)}" aria-current="${index === activeIndex ? 'step' : 'false'}">
      <span class="claim-no">${String(index + 1).padStart(2, '0')}</span><span><span class="claim-title">${escapeHtml(step.title)}</span><span class="claim-time">${step.start.toFixed(1)}–${step.end.toFixed(1)} s · ${escapeHtml(targetName(step.targetId))}</span></span>
    </button></li>`).join('')
}

const arrowSvg = (): string => {
  const current = proof.steps[stepAtTime(proof, currentTime)]
  const seen = new Set(proof.steps.filter((step) => step.start <= currentTime).map((step) => step.targetId))
  return `<defs><marker id="arrowhead" markerWidth="4" markerHeight="4" refX="3.3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#171714"></path></marker><marker id="arrowhead-active" markerWidth="4" markerHeight="4" refX="3.3" refY="2" orient="auto"><path d="M0,0 L4,2 L0,4 z" fill="#b83220"></path></marker></defs>${proof.arrows.map((arrow) => {
    const from = proof.nodes.find((node) => node.id === arrow.from)
    const to = proof.nodes.find((node) => node.id === arrow.to)
    if (!from || !to) return ''
    const active = current?.targetId === arrow.id
    const future = proof.steps.some((step) => step.targetId === arrow.id) && !seen.has(arrow.id)
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2 - 2
    return `<g style="opacity:${future ? '.22' : '1'}"><line class="arrow-hit" data-select-arrow="${escapeHtml(arrow.id)}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line><line class="arrow-path${active ? ' is-active' : ''}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" marker-end="url(#${active ? 'arrowhead-active' : 'arrowhead'})"></line><text class="arrow-label${active ? ' is-active' : ''}" x="${mx}" y="${my}">${escapeHtml(arrow.label)}</text></g>`
  }).join('')}`
}

const renderCanvas = (): void => {
  const current = proof.steps[stepAtTime(proof, currentTime)]
  const seen = new Set(proof.steps.filter((step) => step.start <= currentTime).map((step) => step.targetId))
  byId<SVGElement>('arrows').innerHTML = arrowSvg()
  byId('nodes').innerHTML = proof.nodes.map((node) => {
    const active = current?.targetId === node.id
    const future = proof.steps.some((step) => step.targetId === node.id) && !seen.has(node.id)
    return `<button class="canvas-node ${node.kind}${selectedType === 'node' && selectedId === node.id ? ' is-selected' : ''}${active ? ' is-active' : ''}${future ? ' is-future' : ''}" style="left:${node.x}%;top:${node.y}%" type="button" data-select-node="${escapeHtml(node.id)}" aria-label="${node.kind === 'card' ? 'Card' : 'Number'}: ${escapeHtml(node.label)}. Position ${Math.round(node.x)}, ${Math.round(node.y)}.">${escapeHtml(node.label)}</button>`
  }).join('')
  byId<HTMLDivElement>('canvas-empty').hidden = proof.nodes.length > 0
  const currentLabel = current ? `<strong>Claim ${stepAtTime(proof, currentTime) + 1}:</strong> ${escapeHtml(current.title)}` : '<strong>Edit mode.</strong> Drag an item or use arrow keys.'
  byId('canvas-status').innerHTML = currentLabel
}

const renderInspector = (): void => {
  const inspector = byId('inspector')
  if (!selectedType) {
    inspector.innerHTML = '<div class="inspector-empty"><p>Select a claim, card, number, or arrow to inspect it.</p><p><strong>Keyboard:</strong> Space plays. Left/right changes claim. Selected items move with arrow keys.</p></div>'
    return
  }
  if (selectedType === 'step') {
    const step = proof.steps.find((item) => item.id === selectedId)
    if (!step) { selectedType = null; renderInspector(); return }
    const targets = [...proof.nodes.map((item) => ({ id: item.id, name: `${item.kind}: ${item.label}` })), ...proof.arrows.map((item) => ({ id: item.id, name: `arrow: ${item.label}` }))]
    inspector.innerHTML = `<div class="field"><label for="edit-step-title">Claim name</label><input id="edit-step-title" data-step-field="title" type="text" maxlength="70" value="${escapeHtml(step.title)}"></div>
      <div class="field"><label for="edit-step-text">Accessible explanation</label><textarea id="edit-step-text" data-step-field="text" maxlength="300">${escapeHtml(step.text)}</textarea></div>
      <div class="field"><label for="edit-step-target">What changes</label><select id="edit-step-target" data-step-field="targetId">${targets.map((target) => `<option value="${escapeHtml(target.id)}"${target.id === step.targetId ? ' selected' : ''}>${escapeHtml(target.name)}</option>`).join('')}</select></div>
      <div class="field-row"><div class="field"><label for="edit-step-start">Starts (seconds)</label><input id="edit-step-start" data-step-field="start" type="number" min="0" step="0.25" value="${step.start}"></div><div class="field"><label for="edit-step-end">Ends (seconds)</label><input id="edit-step-end" data-step-field="end" type="number" min="0.25" step="0.25" value="${step.end}"></div></div>
      <p class="help">Duration: ${(step.end - step.start).toFixed(2)} s. Intervals may overlap when two claims need to remain active.</p><div class="inspector-actions"><button class="button danger" type="button" data-delete="step">Delete claim</button></div>`
    return
  }
  if (selectedType === 'node') {
    const node = proof.nodes.find((item) => item.id === selectedId)
    if (!node) { selectedType = null; renderInspector(); return }
    inspector.innerHTML = `<p><span class="target-chip">${node.kind}</span></p><div class="field"><label for="edit-node-label">${node.kind === 'number' ? 'Numeric label' : 'Card text'}</label><input id="edit-node-label" data-node-field="label" type="text" maxlength="60" value="${escapeHtml(node.label)}"></div><div class="field-row"><div class="field"><label for="edit-node-x">Horizontal %</label><input id="edit-node-x" data-node-field="x" type="number" min="6" max="94" step="1" value="${node.x.toFixed(0)}"></div><div class="field"><label for="edit-node-y">Vertical %</label><input id="edit-node-y" data-node-field="y" type="number" min="10" max="90" step="1" value="${node.y.toFixed(0)}"></div></div><p class="help">Drag on the canvas, or focus the item and press arrow keys. Hold Shift for larger moves.</p><div class="inspector-actions"><button class="button danger" type="button" data-delete="node">Delete ${node.kind}</button></div>`
    return
  }
  const arrow = proof.arrows.find((item) => item.id === selectedId)
  if (!arrow) { selectedType = null; renderInspector(); return }
  inspector.innerHTML = `<p><span class="target-chip">arrow</span></p><div class="field"><label for="edit-arrow-label">Relation label</label><input id="edit-arrow-label" data-arrow-field="label" type="text" maxlength="40" value="${escapeHtml(arrow.label)}"></div><p class="help">From <strong>${escapeHtml(targetName(arrow.from))}</strong> to <strong>${escapeHtml(targetName(arrow.to))}</strong>.</p><div class="inspector-actions"><button class="button danger" type="button" data-delete="arrow">Delete arrow</button></div>`
}

const renderTimeline = (): void => {
  const total = duration(proof)
  const active = stepAtTime(proof, currentTime)
  scrubber.max = String(total || 1)
  scrubber.value = String(Math.min(currentTime, total || 1))
  byId('timecode').textContent = `${currentTime.toFixed(1)} / ${total.toFixed(1)} s`
  const timeline = byId('timeline')
  timeline.innerHTML = proof.steps.length ? proof.steps.map((step, index) => `<button class="timeline-block${index === active ? ' is-current' : ''}" style="flex:${Math.max(.5, step.end - step.start)}" type="button" data-jump-step="${escapeHtml(step.id)}"><span>${index + 1}. ${escapeHtml(step.title)}</span><small>${step.start.toFixed(1)}–${step.end.toFixed(1)} s</small></button>`).join('') : '<span class="timeline-empty">Add claims to reveal the timing strip.</span>'
}

const renderAll = (): void => {
  titleInput.value = proof.title
  invariantInput.value = proof.invariant
  renderSequence()
  renderCanvas()
  renderInspector()
  renderTimeline()
}

const stopPlayback = (): void => {
  playing = false
  cancelAnimationFrame(animationFrame)
  byId('play-button').innerHTML = '▶ <span class="optional-label">Play proof</span>'
  byId('play-button').setAttribute('aria-label', 'Play proof')
}

const setTime = (time: number): void => {
  currentTime = Math.max(0, Math.min(duration(proof), time))
  renderSequence()
  renderCanvas()
  renderTimeline()
}

const jumpStep = (offset: number): void => {
  stopPlayback()
  if (!proof.steps.length) return
  const next = Math.max(0, Math.min(proof.steps.length - 1, stepAtTime(proof, currentTime) + offset))
  setTime(proof.steps[next].start + .001)
}

const playTick = (now: number): void => {
  if (!playing) return
  currentTime = Math.min(duration(proof), (now - playOrigin) / 1000)
  renderSequence()
  renderCanvas()
  renderTimeline()
  if (currentTime >= duration(proof)) {
    stopPlayback()
    byId('play-button').innerHTML = '↻ <span class="optional-label">Replay proof</span>'
    byId('play-button').setAttribute('aria-label', 'Replay proof')
    return
  }
  animationFrame = requestAnimationFrame(playTick)
}

const togglePlayback = (): void => {
  if (!proof.steps.length) { notify('Add a claim before playing.', true); return }
  if (playing) { stopPlayback(); return }
  if (currentTime >= duration(proof)) currentTime = 0
  playing = true
  playOrigin = performance.now() - currentTime * 1000
  byId('play-button').innerHTML = 'Ⅱ <span class="optional-label">Pause proof</span>'
  byId('play-button').setAttribute('aria-label', 'Pause proof')
  animationFrame = requestAnimationFrame(playTick)
}

const select = (type: 'node' | 'arrow' | 'step', id: string): void => {
  selectedType = type
  selectedId = id
  if (type === 'step') {
    const step = proof.steps.find((item) => item.id === id)
    if (step) setTime(step.start + .001)
  }
  renderCanvas()
  renderInspector()
}

const addNode = (kind: 'card' | 'number'): void => {
  const count = proof.nodes.length
  const node = { id: uid(kind), kind, label: kind === 'card' ? 'New claim object' : String(count + 1), x: 24 + (count * 17) % 56, y: 30 + (count * 13) % 40 }
  proof.nodes.push(node)
  save()
  select('node', node.id)
  renderSequence()
  renderTimeline()
  requestAnimationFrame(() => byId<HTMLInputElement>('edit-node-label')?.select())
  notify(`${kind === 'card' ? 'Card' : 'Number'} added.`)
}

const addStep = (): void => {
  const firstTarget = proof.nodes[0]?.id ?? proof.arrows[0]?.id
  if (!firstTarget) { notify('Add a canvas item before adding a claim.', true); return }
  const start = duration(proof)
  const step = { id: uid('step'), title: `Claim ${proof.steps.length + 1}`, text: 'Describe what changes and why it supports the argument.', targetId: firstTarget, start, end: start + 2 }
  proof.steps.push(step)
  save()
  selectedType = 'step'
  selectedId = step.id
  setTime(step.start + .001)
  renderInspector()
  requestAnimationFrame(() => byId<HTMLInputElement>('edit-step-title')?.select())
  notify('Claim added. Name it and set its interval.')
}

const download = (content: BlobPart, name: string, type: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement
  const add = target.closest<HTMLElement>('[data-add]')?.dataset.add
  if (add === 'card' || add === 'number') addNode(add)
  const nodeId = target.closest<HTMLElement>('[data-select-node]')?.dataset.selectNode
  if (nodeId) select('node', nodeId)
  const arrowId = target.closest<HTMLElement>('[data-select-arrow]')?.dataset.selectArrow
  if (arrowId) select('arrow', arrowId)
  const stepId = target.closest<HTMLElement>('[data-select-step]')?.dataset.selectStep
  if (stepId) select('step', stepId)
  const jumpId = target.closest<HTMLElement>('[data-jump-step]')?.dataset.jumpStep
  if (jumpId) {
    const step = proof.steps.find((item) => item.id === jumpId)
    if (step) { stopPlayback(); setTime(step.start + .001) }
  }
})

titleInput.addEventListener('input', () => { proof.title = titleInput.value; save() })
invariantInput.addEventListener('input', () => { proof.invariant = invariantInput.value; save() })
titleInput.addEventListener('change', () => notify('Saved on this device.'))
invariantInput.addEventListener('change', () => notify('Saved on this device.'))

byId('add-step').addEventListener('click', addStep)
byId('play-button').addEventListener('click', togglePlayback)
byId('previous-step').addEventListener('click', () => jumpStep(-1))
byId('next-step').addEventListener('click', () => jumpStep(1))
scrubber.addEventListener('input', () => { stopPlayback(); setTime(Number(scrubber.value)) })

byId('add-arrow').addEventListener('click', () => {
  if (proof.nodes.length < 2) { notify('Add at least two canvas items before connecting them.', true); return }
  const options = proof.nodes.map((node) => `<option value="${escapeHtml(node.id)}">${escapeHtml(node.label)}</option>`).join('')
  byId<HTMLSelectElement>('arrow-from').innerHTML = options
  byId<HTMLSelectElement>('arrow-to').innerHTML = options
  byId<HTMLSelectElement>('arrow-to').selectedIndex = 1
  arrowDialog.showModal()
})
byId('cancel-arrow').addEventListener('click', () => arrowDialog.close())
byId<HTMLFormElement>('arrow-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const from = byId<HTMLSelectElement>('arrow-from').value
  const to = byId<HTMLSelectElement>('arrow-to').value
  const label = byId<HTMLInputElement>('arrow-label').value.trim()
  if (from === to) { notify('Choose two different items for the arrow.', true); return }
  const arrow = { id: uid('arrow'), from, to, label: label || 'leads to' }
  proof.arrows.push(arrow)
  arrowDialog.close()
  save()
  select('arrow', arrow.id)
  renderSequence()
  notify('Arrow added.')
})

byId('inspector').addEventListener('change', (event) => {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  if (selectedType === 'node' && input.dataset.nodeField) {
    const node = proof.nodes.find((item) => item.id === selectedId)
    if (!node) return
    if (input.dataset.nodeField === 'label') node.label = input.value.trim() || (node.kind === 'number' ? '0' : 'Untitled card')
    if (input.dataset.nodeField === 'x') node.x = Math.max(6, Math.min(94, Number(input.value) || 6))
    if (input.dataset.nodeField === 'y') node.y = Math.max(10, Math.min(90, Number(input.value) || 10))
  }
  if (selectedType === 'arrow' && input.dataset.arrowField === 'label') {
    const arrow = proof.arrows.find((item) => item.id === selectedId)
    if (arrow) arrow.label = input.value.trim() || 'leads to'
  }
  if (selectedType === 'step' && input.dataset.stepField) {
    const step = proof.steps.find((item) => item.id === selectedId)
    if (!step) return
    if (input.dataset.stepField === 'title') step.title = input.value.trim() || 'Untitled claim'
    if (input.dataset.stepField === 'text') step.text = input.value.trim() || 'No explanation provided.'
    if (input.dataset.stepField === 'targetId') step.targetId = input.value
    if (input.dataset.stepField === 'start') step.start = Math.max(0, Number(input.value) || 0)
    if (input.dataset.stepField === 'end') step.end = Math.max(step.start + .25, Number(input.value) || step.start + .25)
    proof.steps = normalizeSteps(proof.steps)
    selectedId = step.id
  }
  save(true)
  renderSequence()
  renderCanvas()
  renderInspector()
  renderTimeline()
})

byId('inspector').addEventListener('click', (event) => {
  const kind = (event.target as HTMLElement).closest<HTMLElement>('[data-delete]')?.dataset.delete
  if (!kind || !selectedType) return
  const itemName = selectedType === 'step' ? proof.steps.find((item) => item.id === selectedId)?.title ?? 'this claim' : targetName(selectedId)
  if (!confirm(`Delete “${itemName}”? Claims that point to it will also be removed.`)) return
  if (kind === 'step') proof.steps = proof.steps.filter((item) => item.id !== selectedId)
  if (kind === 'arrow') {
    proof.arrows = proof.arrows.filter((item) => item.id !== selectedId)
    proof.steps = proof.steps.filter((item) => item.targetId !== selectedId)
  }
  if (kind === 'node') {
    const arrowIds = new Set(proof.arrows.filter((item) => item.from === selectedId || item.to === selectedId).map((item) => item.id))
    proof.nodes = proof.nodes.filter((item) => item.id !== selectedId)
    proof.arrows = proof.arrows.filter((item) => !arrowIds.has(item.id))
    proof.steps = proof.steps.filter((item) => item.targetId !== selectedId && !arrowIds.has(item.targetId))
  }
  selectedType = null
  selectedId = ''
  currentTime = Math.min(currentTime, duration(proof))
  save()
  renderAll()
  notify('Item deleted.')
})

let dragging: { id: string; pointerId: number } | null = null
canvas.addEventListener('pointerdown', (event) => {
  const element = (event.target as HTMLElement).closest<HTMLElement>('[data-select-node]')
  if (!element?.dataset.selectNode) return
  dragging = { id: element.dataset.selectNode, pointerId: event.pointerId }
  element.setPointerCapture(event.pointerId)
})
canvas.addEventListener('pointermove', (event) => {
  if (!dragging || dragging.pointerId !== event.pointerId) return
  const node = proof.nodes.find((item) => item.id === dragging?.id)
  if (!node) return
  const rect = canvas.getBoundingClientRect()
  node.x = Math.max(6, Math.min(94, ((event.clientX - rect.left) / rect.width) * 100))
  node.y = Math.max(10, Math.min(90, ((event.clientY - rect.top) / rect.height) * 100))
  renderCanvas()
})
canvas.addEventListener('pointerup', (event) => {
  if (!dragging || dragging.pointerId !== event.pointerId) return
  dragging = null
  save()
  renderInspector()
  notify('Position saved.')
})

canvas.addEventListener('keydown', (event) => {
  const element = (event.target as HTMLElement).closest<HTMLElement>('[data-select-node]')
  const id = element?.dataset.selectNode
  if (!id) return
  const node = proof.nodes.find((item) => item.id === id)
  if (!node) return
  const amount = event.shiftKey ? 5 : 1
  if (event.key === 'ArrowLeft') node.x = Math.max(6, node.x - amount)
  else if (event.key === 'ArrowRight') node.x = Math.min(94, node.x + amount)
  else if (event.key === 'ArrowUp') node.y = Math.max(10, node.y - amount)
  else if (event.key === 'ArrowDown') node.y = Math.min(90, node.y + amount)
  else return
  event.preventDefault()
  save()
  renderCanvas()
  renderInspector()
  requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-select-node="${CSS.escape(id)}"]`)?.focus())
})

byId('load-sample').addEventListener('click', () => {
  proof = sampleDocument()
  selectedType = null
  currentTime = 0
  save()
  renderAll()
  notify('Five-step example loaded.')
})

byId('new-button').addEventListener('click', () => {
  if (!confirm('Start a blank argument? Export JSON first if you need a portable copy of this one.')) return
  stopPlayback()
  proof = emptyDocument()
  selectedType = null
  selectedId = ''
  currentTime = 0
  save()
  renderAll()
  notify('Blank argument ready. Your previous local draft was replaced.')
})

byId('json-button').addEventListener('click', () => {
  download(JSON.stringify(proof, null, 2), fileName(proof.title, 'json'), 'application/json')
  notify('Editable JSON saved.')
})

byId('export-button').addEventListener('click', () => {
  if (!proof.nodes.length || !proof.steps.length) { notify('Add at least one canvas item and one claim before exporting.', true); return }
  download(standaloneHtml(proof), fileName(proof.title, 'html'), 'text/html')
  notify('Self-contained replay exported.')
})

const fileInput = byId<HTMLInputElement>('file-input')
byId('import-button').addEventListener('click', () => fileInput.click())
fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0]
  if (!file) return
  try {
    proof = validateDocument(JSON.parse(await file.text()))
    selectedType = null
    selectedId = ''
    currentTime = 0
    save()
    renderAll()
    notify('Proof imported and saved locally.')
  } catch (error) {
    notify(error instanceof Error ? error.message : 'That file could not be imported.', true)
  } finally {
    fileInput.value = ''
  }
})

document.addEventListener('keydown', (event) => {
  if ((event.target as HTMLElement).matches('input, textarea, select, button')) return
  if (event.code === 'Space') { event.preventDefault(); togglePlayback() }
  if (event.key === 'ArrowLeft') jumpStep(-1)
  if (event.key === 'ArrowRight') jumpStep(1)
  if (event.key.toLowerCase() === 'c') addNode('card')
  if (event.key.toLowerCase() === 'n') addNode('number')
})

const updateOnlineState = async (): Promise<void> => {
  let online = navigator.onLine
  if (online) {
    try {
      const response = await fetch('/robots.txt', { method: 'HEAD', cache: 'no-store' })
      online = response.ok
    } catch {
      online = false
    }
  }
  byId<HTMLDivElement>('offline-banner').hidden = online
}
window.addEventListener('online', () => { void updateOnlineState(); notify('Back online. Your local work is intact.') })
window.addEventListener('offline', () => { void updateOnlineState() })
void updateOnlineState()

if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('/sw.js').catch(() => undefined)
renderAll()
