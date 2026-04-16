'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '#/db/index'
import {
  sessions,
  pairwiseComparisons,
  subscaleRatings,
  tlxScores,
} from '#/db/schema'
import type {
  CompleteSessionInput,
  TLXScore,
  SubscaleCode,
  CollectionMode,
} from '#/types/domain'
import {
  computeWeights,
  computeWeightedTLX,
  computeRawTLX,
  SUBSCALE_CODES,
} from '#/lib/tlx-constants'

export const completeSession = createServerFn()
  .inputValidator((d: CompleteSessionInput) => d)
  .handler(async ({ data }): Promise<TLXScore> => {
    return await db.transaction(async (tx) => {
      // 1. Fetch session
      const [session] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, data.sessionId))
        .limit(1)

      if (!session) throw new Error(`Session not found: ${data.sessionId}`)
      if (session.status !== 'in_progress') {
        throw new Error(
          `Session is not in progress (status: ${session.status})`,
        )
      }

      const collectionMode = session.collectionMode as CollectionMode

      // 2. Fetch pairwise comparisons
      const comparisons = await tx
        .select()
        .from(pairwiseComparisons)
        .where(eq(pairwiseComparisons.sessionId, data.sessionId))

      // 3. Validate: exactly 15 pairwise (only required for weighted mode)
      if (collectionMode === 'weighted' && comparisons.length !== 15) {
        throw new Error(
          `Expected 15 pairwise comparisons, got ${comparisons.length}`,
        )
      }

      // 4. Fetch subscale ratings
      const ratings = await tx
        .select()
        .from(subscaleRatings)
        .where(eq(subscaleRatings.sessionId, data.sessionId))

      // 5. Validate: exactly 6 subscale ratings
      if (ratings.length !== 6) {
        throw new Error(`Expected 6 subscale ratings, got ${ratings.length}`)
      }

      // 6. Compute weights
      const weights =
        collectionMode === 'weighted'
          ? computeWeights(
              comparisons.map((c) => ({
                selected: c.selected as SubscaleCode,
              })),
            )
          : { MD: 0, PD: 0, TD: 0, OP: 0, EF: 0, FR: 0 }

      // 7. Validate weight sum === 15 (only for weighted mode)
      if (collectionMode === 'weighted') {
        const weightSum = SUBSCALE_CODES.reduce(
          (acc, code) => acc + weights[code],
          0,
        )
        if (weightSum !== 15) {
          throw new Error(`Weight sum must be 15, got ${weightSum}`)
        }
      }

      // 8. Build ratings record
      const ratingsRecord: Record<SubscaleCode, number> = {
        MD: 0,
        PD: 0,
        TD: 0,
        OP: 0,
        EF: 0,
        FR: 0,
      }
      for (const r of ratings) {
        ratingsRecord[r.subscale as SubscaleCode] = r.rawValue
      }

      // 9. Compute scores
      const rawTlx = computeRawTLX(ratingsRecord)
      const weightedTlx =
        collectionMode === 'weighted'
          ? computeWeightedTLX(weights, ratingsRecord)
          : null

      // 10. Insert tlx_scores row
      const [scoreRow] = await tx
        .insert(tlxScores)
        .values({
          sessionId: data.sessionId,
          weightMd: weights.MD,
          weightPd: weights.PD,
          weightTd: weights.TD,
          weightOp: weights.OP,
          weightEf: weights.EF,
          weightFr: weights.FR,
          weightedTlx: weightedTlx !== null ? String(weightedTlx) : null,
          rawTlx: String(rawTlx),
        })
        .returning()

      // 11. Update session status
      await tx
        .update(sessions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          notes: data.notes ?? null,
        })
        .where(eq(sessions.id, data.sessionId))

      return {
        id: scoreRow.id,
        sessionId: scoreRow.sessionId,
        weightMd: scoreRow.weightMd,
        weightPd: scoreRow.weightPd,
        weightTd: scoreRow.weightTd,
        weightOp: scoreRow.weightOp,
        weightEf: scoreRow.weightEf,
        weightFr: scoreRow.weightFr,
        weightedTlx:
          scoreRow.weightedTlx !== null ? Number(scoreRow.weightedTlx) : null,
        rawTlx: Number(scoreRow.rawTlx),
        computedAt: scoreRow.computedAt,
      }
    })
  })

export const getSessionScore = createServerFn()
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }): Promise<TLXScore | null> => {
    const [row] = await db
      .select()
      .from(tlxScores)
      .where(eq(tlxScores.sessionId, data.sessionId))
      .limit(1)

    if (!row) return null

    return {
      id: row.id,
      sessionId: row.sessionId,
      weightMd: row.weightMd,
      weightPd: row.weightPd,
      weightTd: row.weightTd,
      weightOp: row.weightOp,
      weightEf: row.weightEf,
      weightFr: row.weightFr,
      weightedTlx: row.weightedTlx !== null ? Number(row.weightedTlx) : null,
      rawTlx: Number(row.rawTlx),
      computedAt: row.computedAt,
    }
  })
