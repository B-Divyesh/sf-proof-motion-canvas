export type NodeKind = 'card' | 'number'

export interface CanvasNode {
  id: string
  kind: NodeKind
  label: string
  x: number
  y: number
}

export interface CanvasArrow {
  id: string
  from: string
  to: string
  label: string
}

export interface ProofStep {
  id: string
  title: string
  text: string
  targetId: string
  start: number
  end: number
}

export interface ProofDocument {
  version: 1
  title: string
  invariant: string
  nodes: CanvasNode[]
  arrows: CanvasArrow[]
  steps: ProofStep[]
}

export const CANVAS_BOUNDS = {
  minX: 6,
  maxX: 94,
  minY: 10,
  maxY: 90,
} as const

export const uid = (prefix: string): string => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export const emptyDocument = (): ProofDocument => ({
  version: 1,
  title: 'Untitled argument',
  invariant: '',
  nodes: [],
  arrows: [],
  steps: [],
})

export const sampleDocument = (): ProofDocument => ({
  version: 1,
  title: 'Why the sum stays constant',
  invariant: 'Moving one counter changes its group, never the total.',
  nodes: [
    { id: 'left', kind: 'card', label: 'Left group', x: 18, y: 45 },
    { id: 'n-left', kind: 'number', label: '3', x: 31, y: 45 },
    { id: 'right', kind: 'card', label: 'Right group', x: 63, y: 45 },
    { id: 'n-right', kind: 'number', label: '5', x: 76, y: 45 },
  ],
  arrows: [{ id: 'move', from: 'left', to: 'right', label: 'move one' }],
  steps: [
    { id: 's1', title: 'Count both groups', text: 'Three counters on the left and five on the right make eight altogether.', targetId: 'left', start: 0, end: 2 },
    { id: 's2', title: 'Move one counter', text: 'A counter crosses from the left group to the right group.', targetId: 'move', start: 2, end: 4 },
    { id: 's3', title: 'Update the left label', text: 'The left count falls from three to two.', targetId: 'n-left', start: 4, end: 6 },
    { id: 's4', title: 'Update the right label', text: 'The right count rises from five to six.', targetId: 'n-right', start: 6, end: 8 },
    { id: 's5', title: 'Read the invariant', text: 'Two plus six is still eight: position changed, but the total did not.', targetId: 'right', start: 8, end: 11 },
  ],
})

export const duration = (doc: ProofDocument): number => doc.steps.reduce((max, step) => Math.max(max, step.end), 0)

export const stepAtTime = (doc: ProofDocument, time: number): number => {
  if (!doc.steps.length) return -1
  const found = doc.steps.findIndex((step) => time >= step.start && time < step.end)
  if (found >= 0) return found
  return time < doc.steps[0].start ? 0 : doc.steps.length - 1
}

export const validateDocument = (input: unknown): ProofDocument => {
  if (!input || typeof input !== 'object') throw new Error('That file does not contain a proof.')
  const doc = input as Partial<ProofDocument>
  if (doc.version !== 1 || typeof doc.title !== 'string' || typeof doc.invariant !== 'string') {
    throw new Error('This proof uses an unsupported format.')
  }
  if (!Array.isArray(doc.nodes) || !Array.isArray(doc.arrows) || !Array.isArray(doc.steps)) {
    throw new Error('The proof is missing its canvas or steps.')
  }
  const ids = new Set<string>()
  for (const node of doc.nodes) {
    if (!node || typeof node.id !== 'string' || !node.id.trim() || (node.kind !== 'card' && node.kind !== 'number') || typeof node.label !== 'string' || !Number.isFinite(node.x) || !Number.isFinite(node.y)) {
      throw new Error('A canvas item is incomplete.')
    }
    if (node.x < CANVAS_BOUNDS.minX || node.x > CANVAS_BOUNDS.maxX || node.y < CANVAS_BOUNDS.minY || node.y > CANVAS_BOUNDS.maxY) {
      throw new Error(`A canvas item must stay within ${CANVAS_BOUNDS.minX}–${CANVAS_BOUNDS.maxX}% horizontally and ${CANVAS_BOUNDS.minY}–${CANVAS_BOUNDS.maxY}% vertically.`)
    }
    if (ids.has(node.id)) throw new Error('Two canvas items have the same identity.')
    ids.add(node.id)
  }
  for (const arrow of doc.arrows) {
    if (!arrow || typeof arrow.id !== 'string' || !arrow.id.trim() || !ids.has(arrow.from) || !ids.has(arrow.to) || typeof arrow.label !== 'string') {
      throw new Error('An arrow refers to a missing canvas item.')
    }
    if (ids.has(arrow.id)) throw new Error('Two proof items have the same identity.')
    ids.add(arrow.id)
  }
  for (const step of doc.steps) {
    if (!step || typeof step.id !== 'string' || !step.id.trim() || typeof step.title !== 'string' || typeof step.text !== 'string' || typeof step.targetId !== 'string' || !ids.has(step.targetId) || !Number.isFinite(step.start) || !Number.isFinite(step.end) || step.start < 0 || step.end <= step.start) {
      throw new Error('A step has invalid text, timing, or target.')
    }
    if (ids.has(step.id)) throw new Error('Two proof items have the same identity.')
    ids.add(step.id)
  }
  return structuredClone(doc as ProofDocument)
}

export const normalizeSteps = (steps: ProofStep[]): ProofStep[] => [...steps]
  .sort((a, b) => a.start - b.start || a.end - b.end)
  .map((step) => ({ ...step, start: Math.max(0, step.start), end: Math.max(step.start + 0.25, step.end) }))
