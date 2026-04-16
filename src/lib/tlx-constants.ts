import type { SubscaleCode, SubscaleMeta, SubscalePair } from '#/types/domain'

export const SUBSCALE_CODES: SubscaleCode[] = ['MD', 'PD', 'TD', 'OP', 'EF', 'FR']

// All C(6,2) = 15 pairs in canonical order
export const CANONICAL_PAIRS: SubscalePair[] = [
  { a: 'MD', b: 'PD' }, // 0
  { a: 'MD', b: 'TD' }, // 1
  { a: 'MD', b: 'OP' }, // 2
  { a: 'MD', b: 'EF' }, // 3
  { a: 'MD', b: 'FR' }, // 4
  { a: 'PD', b: 'TD' }, // 5
  { a: 'PD', b: 'OP' }, // 6
  { a: 'PD', b: 'EF' }, // 7
  { a: 'PD', b: 'FR' }, // 8
  { a: 'TD', b: 'OP' }, // 9
  { a: 'TD', b: 'EF' }, // 10
  { a: 'TD', b: 'FR' }, // 11
  { a: 'OP', b: 'EF' }, // 12
  { a: 'OP', b: 'FR' }, // 13
  { a: 'EF', b: 'FR' }, // 14
]

export const SUBSCALE_META: Record<SubscaleCode, SubscaleMeta> = {
  MD: {
    code: 'MD',
    nameKey: 'subscale.MD.name',
    descriptionKey: 'subscale.MD.description',
    leftEndpointKey: 'subscale.MD.left',
    rightEndpointKey: 'subscale.MD.right',
  },
  PD: {
    code: 'PD',
    nameKey: 'subscale.PD.name',
    descriptionKey: 'subscale.PD.description',
    leftEndpointKey: 'subscale.PD.left',
    rightEndpointKey: 'subscale.PD.right',
  },
  TD: {
    code: 'TD',
    nameKey: 'subscale.TD.name',
    descriptionKey: 'subscale.TD.description',
    leftEndpointKey: 'subscale.TD.left',
    rightEndpointKey: 'subscale.TD.right',
  },
  OP: {
    code: 'OP',
    nameKey: 'subscale.OP.name',
    descriptionKey: 'subscale.OP.description',
    leftEndpointKey: 'subscale.OP.left',   // "Good" = low workload
    rightEndpointKey: 'subscale.OP.right', // "Poor" = high workload
  },
  EF: {
    code: 'EF',
    nameKey: 'subscale.EF.name',
    descriptionKey: 'subscale.EF.description',
    leftEndpointKey: 'subscale.EF.left',
    rightEndpointKey: 'subscale.EF.right',
  },
  FR: {
    code: 'FR',
    nameKey: 'subscale.FR.name',
    descriptionKey: 'subscale.FR.description',
    leftEndpointKey: 'subscale.FR.left',
    rightEndpointKey: 'subscale.FR.right',
  },
}

/** Fisher-Yates shuffle — returns a new array */
export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Snap a slider position (0–100) to nearest 5-point increment */
export function snapSliderValue(position: number): number {
  return Math.round(position / 5) * 5
}

/** Compute per-subscale weights from pairwise comparisons.
 *  weight[code] = number of times that code was selected across all 15 pairs.
 *  Weight sum invariant: must equal 15.
 */
export function computeWeights(
  comparisons: Array<{ selected: SubscaleCode }>
): Record<SubscaleCode, number> {
  const weights: Record<SubscaleCode, number> = {
    MD: 0, PD: 0, TD: 0, OP: 0, EF: 0, FR: 0,
  }
  for (const c of comparisons) {
    weights[c.selected]++
  }
  return weights
}

/** Weighted TLX: Σ(rating[i] × weight[i]) / 15 */
export function computeWeightedTLX(
  weights: Record<SubscaleCode, number>,
  ratings: Record<SubscaleCode, number>
): number {
  const sum = SUBSCALE_CODES.reduce(
    (acc, code) => acc + ratings[code] * weights[code],
    0
  )
  return sum / 15
}

/** Raw TLX: mean of all 6 subscale ratings */
export function computeRawTLX(ratings: Record<SubscaleCode, number>): number {
  const sum = SUBSCALE_CODES.reduce((acc, code) => acc + ratings[code], 0)
  return sum / 6
}
