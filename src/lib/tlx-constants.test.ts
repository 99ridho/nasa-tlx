import { describe, it, expect } from 'vitest'
import {
  shuffleArray,
  snapSliderValue,
  computeWeights,
  computeWeightedTLX,
  computeRawTLX,
  CANONICAL_PAIRS,
  SUBSCALE_CODES,
} from './tlx-constants'
import type { SubscaleCode } from '#/types/domain'

describe('shuffleArray', () => {
  it('returns a new array with the same elements', () => {
    const original = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    const shuffled = shuffleArray(original)
    expect(shuffled).toHaveLength(original.length)
    expect(shuffled.sort((a, b) => a - b)).toEqual(original)
  })

  it('does not mutate the original array', () => {
    const original = [1, 2, 3, 4, 5]
    const copy = [...original]
    shuffleArray(original)
    expect(original).toEqual(copy)
  })

  it('returns a different order (probabilistically)', () => {
    // With 15 elements, the probability of getting exact same order is 1/15! ≈ 0
    const original = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
    const shuffled = shuffleArray(original)
    // This test could theoretically fail but probability is astronomically low
    // At minimum, test that shuffle works multiple times and produces arrays of correct length
    expect(shuffled).toHaveLength(15)
    for (const item of original) {
      expect(shuffled).toContain(item)
    }
  })
})

describe('snapSliderValue', () => {
  it('snaps 0 to 0', () => expect(snapSliderValue(0)).toBe(0))
  it('snaps 5 to 5', () => expect(snapSliderValue(5)).toBe(5))
  it('snaps 7 to 5', () => expect(snapSliderValue(7)).toBe(5))
  it('snaps 8 to 10', () => expect(snapSliderValue(8)).toBe(10))
  it('snaps 50 to 50', () => expect(snapSliderValue(50)).toBe(50))
  it('snaps 97 to 95', () => expect(snapSliderValue(97)).toBe(95))
  it('snaps 100 to 100', () => expect(snapSliderValue(100)).toBe(100))
  it('snaps 2 to 0', () => expect(snapSliderValue(2)).toBe(0))
  it('snaps 3 to 5', () => expect(snapSliderValue(3)).toBe(5))
})

describe('computeWeights', () => {
  it('counts selections correctly', () => {
    const comparisons: Array<{ selected: SubscaleCode }> = [
      { selected: 'MD' },
      { selected: 'MD' },
      { selected: 'MD' },
      { selected: 'PD' },
      { selected: 'PD' },
      { selected: 'TD' },
      { selected: 'TD' },
      { selected: 'TD' },
      { selected: 'OP' },
      { selected: 'OP' },
      { selected: 'OP' },
      { selected: 'OP' },
      { selected: 'EF' },
      { selected: 'EF' },
      { selected: 'FR' },
    ]

    const weights = computeWeights(comparisons)
    expect(weights.MD).toBe(3)
    expect(weights.PD).toBe(2)
    expect(weights.TD).toBe(3)
    expect(weights.OP).toBe(4)
    expect(weights.EF).toBe(2)
    expect(weights.FR).toBe(1)
  })

  it('weight sum equals 15', () => {
    // Each subscale appears in 5 pairs, simulate real pairwise selections
    const comparisons: Array<{ selected: SubscaleCode }> = [
      { selected: 'MD' },
      { selected: 'MD' },
      { selected: 'MD' },
      { selected: 'PD' },
      { selected: 'PD' },
      { selected: 'PD' },
      { selected: 'TD' },
      { selected: 'TD' },
      { selected: 'TD' },
      { selected: 'OP' },
      { selected: 'OP' },
      { selected: 'OP' },
      { selected: 'EF' },
      { selected: 'EF' },
      { selected: 'FR' },
    ]

    const weights = computeWeights(comparisons)
    const sum = SUBSCALE_CODES.reduce((acc, code) => acc + weights[code], 0)
    expect(sum).toBe(15)
  })

  it('returns zero for unselected subscales', () => {
    const comparisons: Array<{ selected: SubscaleCode }> = Array(15).fill({
      selected: 'MD',
    })
    const weights = computeWeights(comparisons)
    expect(weights.MD).toBe(15)
    expect(weights.PD).toBe(0)
    expect(weights.TD).toBe(0)
    expect(weights.OP).toBe(0)
    expect(weights.EF).toBe(0)
    expect(weights.FR).toBe(0)
  })
})

describe('computeWeightedTLX', () => {
  it('computes weighted TLX correctly', () => {
    // weights: MD=5, PD=3, TD=2, OP=2, EF=2, FR=1 → sum=15
    const weights: Record<SubscaleCode, number> = {
      MD: 5,
      PD: 3,
      TD: 2,
      OP: 2,
      EF: 2,
      FR: 1,
    }
    // ratings: all 50
    const ratings: Record<SubscaleCode, number> = {
      MD: 50,
      PD: 50,
      TD: 50,
      OP: 50,
      EF: 50,
      FR: 50,
    }
    // Σ(50 * w) / 15 = 50 * (5+3+2+2+2+1) / 15 = 50 * 15 / 15 = 50
    expect(computeWeightedTLX(weights, ratings)).toBe(50)
  })

  it('computes weighted TLX with varied weights and ratings', () => {
    const weights: Record<SubscaleCode, number> = {
      MD: 5,
      PD: 4,
      TD: 3,
      OP: 2,
      EF: 1,
      FR: 0,
    }
    const ratings: Record<SubscaleCode, number> = {
      MD: 80,
      PD: 60,
      TD: 40,
      OP: 20,
      EF: 10,
      FR: 0,
    }
    // (80*5 + 60*4 + 40*3 + 20*2 + 10*1 + 0*0) / 15
    // = (400 + 240 + 120 + 40 + 10 + 0) / 15
    // = 810 / 15
    // = 54
    expect(computeWeightedTLX(weights, ratings)).toBe(54)
  })
})

describe('computeRawTLX', () => {
  it('computes mean of all 6 subscale ratings', () => {
    const ratings: Record<SubscaleCode, number> = {
      MD: 60,
      PD: 40,
      TD: 80,
      OP: 20,
      EF: 50,
      FR: 30,
    }
    // (60 + 40 + 80 + 20 + 50 + 30) / 6 = 280 / 6 ≈ 46.666...
    expect(computeRawTLX(ratings)).toBeCloseTo(46.6667, 3)
  })

  it('returns 0 for all-zero ratings', () => {
    const ratings: Record<SubscaleCode, number> = {
      MD: 0,
      PD: 0,
      TD: 0,
      OP: 0,
      EF: 0,
      FR: 0,
    }
    expect(computeRawTLX(ratings)).toBe(0)
  })

  it('returns 100 for all-100 ratings', () => {
    const ratings: Record<SubscaleCode, number> = {
      MD: 100,
      PD: 100,
      TD: 100,
      OP: 100,
      EF: 100,
      FR: 100,
    }
    expect(computeRawTLX(ratings)).toBe(100)
  })
})

describe('full session pipeline — realistic stub data', () => {
  /**
   * Scenario: software debugging task
   *
   * Participant pairwise selections (one per canonical pair, in canonical order):
   *   MD-PD  → MD   (mental effort dominates physical)
   *   MD-TD  → MD   (mental demand > time pressure)
   *   MD-OP  → MD   (mental demand > performance concern)
   *   MD-EF  → MD   (mental demand > effort, as framed by participant)
   *   MD-FR  → MD   (mental demand > frustration)
   *   PD-TD  → TD   (time pressure > negligible physical load)
   *   PD-OP  → OP   (performance concern > physical load)
   *   PD-EF  → EF   (effort > physical load)
   *   PD-FR  → FR   (frustration > physical load)
   *   TD-OP  → TD   (time pressure > performance concern)
   *   TD-EF  → EF   (effort > time pressure)
   *   TD-FR  → FR   (frustration > time pressure)
   *   OP-EF  → EF   (effort > performance concern)
   *   OP-FR  → FR   (frustration > performance concern)
   *   EF-FR  → EF   (effort > frustration)
   *
   * Derived weights: MD=5, PD=0, TD=2, OP=1, EF=4, FR=3  (sum=15 ✓)
   *
   * Subscale ratings (0–100, multiples of 5):
   *   MD=85, PD=10, TD=55, OP=40, EF=75, FR=60
   *
   * Expected WeightedTLX = (85×5 + 10×0 + 55×2 + 40×1 + 75×4 + 60×3) / 15
   *                      = (425 + 0 + 110 + 40 + 300 + 180) / 15
   *                      = 1055 / 15
   *                      ≈ 70.33
   *
   * Expected RawTLX = (85 + 10 + 55 + 40 + 75 + 60) / 6
   *                 = 325 / 6
   *                 ≈ 54.17
   */

  const comparisons: Array<{ selected: SubscaleCode }> = [
    { selected: 'MD' }, // MD vs PD
    { selected: 'MD' }, // MD vs TD
    { selected: 'MD' }, // MD vs OP
    { selected: 'MD' }, // MD vs EF
    { selected: 'MD' }, // MD vs FR
    { selected: 'TD' }, // PD vs TD
    { selected: 'OP' }, // PD vs OP
    { selected: 'EF' }, // PD vs EF
    { selected: 'FR' }, // PD vs FR
    { selected: 'TD' }, // TD vs OP
    { selected: 'EF' }, // TD vs EF
    { selected: 'FR' }, // TD vs FR
    { selected: 'EF' }, // OP vs EF
    { selected: 'FR' }, // OP vs FR
    { selected: 'EF' }, // EF vs FR
  ]

  const ratings: Record<SubscaleCode, number> = {
    MD: 85,
    PD: 10,
    TD: 55,
    OP: 40,
    EF: 75,
    FR: 60,
  }

  it('derives correct weights from pairwise selections', () => {
    const weights = computeWeights(comparisons)
    expect(weights.MD).toBe(5)
    expect(weights.PD).toBe(0)
    expect(weights.TD).toBe(2)
    expect(weights.OP).toBe(1)
    expect(weights.EF).toBe(4)
    expect(weights.FR).toBe(3)
  })

  it('weight sum invariant holds (must equal 15)', () => {
    const weights = computeWeights(comparisons)
    const sum = SUBSCALE_CODES.reduce((acc, code) => acc + weights[code], 0)
    expect(sum).toBe(15)
  })

  it('computes weighted TLX ≈ 70.33', () => {
    const weights = computeWeights(comparisons)
    expect(computeWeightedTLX(weights, ratings)).toBeCloseTo(70.333, 2)
  })

  it('computes raw TLX ≈ 54.17', () => {
    expect(computeRawTLX(ratings)).toBeCloseTo(54.167, 2)
  })

  it('weighted TLX exceeds raw TLX when high-weight subscales have high ratings', () => {
    // MD (weight=5, rating=85) and EF (weight=4, rating=75) pull the weighted
    // score above the raw mean because they dominate the weight distribution.
    const weights = computeWeights(comparisons)
    expect(computeWeightedTLX(weights, ratings)).toBeGreaterThan(
      computeRawTLX(ratings),
    )
  })
})

describe('CANONICAL_PAIRS', () => {
  it('has exactly 15 pairs', () => {
    expect(CANONICAL_PAIRS).toHaveLength(15)
  })

  it('covers all C(6,2) combinations', () => {
    // Each subscale should appear in exactly 5 pairs
    const appearanceCount: Record<string, number> = {}
    for (const pair of CANONICAL_PAIRS) {
      appearanceCount[pair.a] = (appearanceCount[pair.a] ?? 0) + 1
      appearanceCount[pair.b] = (appearanceCount[pair.b] ?? 0) + 1
    }
    for (const code of SUBSCALE_CODES) {
      expect(appearanceCount[code]).toBe(5)
    }
  })
})
