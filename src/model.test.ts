import { describe, expect, it } from 'vitest'
import { CANVAS_BOUNDS, duration, emptyDocument, normalizeSteps, sampleDocument, stepAtTime, validateDocument } from './model'

describe('proof model', () => {
  it('resolves deterministic playback positions', () => {
    const doc = sampleDocument()
    expect(duration(doc)).toBe(11)
    expect(stepAtTime(doc, 0)).toBe(0)
    expect(stepAtTime(doc, 4.5)).toBe(2)
    expect(stepAtTime(doc, 11)).toBe(4)
  })

  it('rejects an arrow to a missing object', () => {
    const doc = sampleDocument()
    doc.arrows[0].to = 'missing'
    expect(() => validateDocument(doc)).toThrow(/arrow/i)
  })

  it('rejects duplicate identities across nodes, arrows, and claims', () => {
    const duplicateStep = sampleDocument()
    duplicateStep.steps[1].id = duplicateStep.steps[0].id
    expect(() => validateDocument(duplicateStep)).toThrow(/same identity/i)

    const arrowCollidesWithNode = sampleDocument()
    arrowCollidesWithNode.arrows[0].id = arrowCollidesWithNode.nodes[0].id
    expect(() => validateDocument(arrowCollidesWithNode)).toThrow(/same identity/i)

    const stepCollidesWithArrow = sampleDocument()
    stepCollidesWithArrow.steps[0].id = stepCollidesWithArrow.arrows[0].id
    expect(() => validateDocument(stepCollidesWithArrow)).toThrow(/same identity/i)
  })

  it('rejects imported canvas coordinates outside the editable bounds', () => {
    const tooFarLeft = sampleDocument()
    tooFarLeft.nodes[0].x = CANVAS_BOUNDS.minX - 1
    expect(() => validateDocument(tooFarLeft)).toThrow(/within/i)

    const tooLow = sampleDocument()
    tooLow.nodes[0].y = CANVAS_BOUNDS.maxY + 1
    expect(() => validateDocument(tooLow)).toThrow(/within/i)
  })

  it('accepts an empty proof and returns a clone', () => {
    const doc = emptyDocument()
    const result = validateDocument(doc)
    expect(result).not.toBe(doc)
    expect(result.nodes).toEqual([])
  })

  it('sorts and repairs short intervals', () => {
    const steps = sampleDocument().steps.slice(0, 2).reverse()
    steps[1].end = steps[1].start
    const result = normalizeSteps(steps)
    expect(result[0].end).toBe(0.25)
    expect(result[1].start).toBe(2)
  })
})
