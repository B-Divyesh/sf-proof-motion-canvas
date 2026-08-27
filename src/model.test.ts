import { describe, expect, it } from 'vitest'
import { duration, emptyDocument, normalizeSteps, sampleDocument, stepAtTime, validateDocument } from './model'

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
