'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq, count } from 'drizzle-orm'
import { db } from '#/db/index'
import { pairwiseComparisons, sessions } from '#/db/schema'
import type {
  PairwiseComparison,
  SubmitPairwiseInput,
  SubscaleCode,
} from '#/types/domain'
import { CANONICAL_PAIRS } from '#/lib/tlx'

export const submitPairwiseComparison = createServerFn()
  .inputValidator((d: SubmitPairwiseInput) => d)
  .handler(async ({ data }): Promise<{ pairsCompleted: number }> => {
    // Validate pairIndex range
    if (data.pairIndex < 0 || data.pairIndex > 14) {
      throw new Error(`pairIndex must be 0–14, got ${data.pairIndex}`)
    }

    // Fetch session to validate it exists and is in_progress
    const session = (
      await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, data.sessionId))
        .limit(1)
    ).at(0)

    if (!session) {
      throw new Error(`Session not found: ${data.sessionId}`)
    }
    if (session.status !== 'in_progress') {
      throw new Error(`Session is not in progress (status: ${session.status})`)
    }

    // Validate that selected is one of the two subscales in this canonical pair
    const pair = CANONICAL_PAIRS[data.pairIndex]
    if (data.selected !== pair.a && data.selected !== pair.b) {
      throw new Error(
        `selected "${data.selected}" is not part of pair ${data.pairIndex} (${pair.a} vs ${pair.b})`,
      )
    }

    try {
      await db.insert(pairwiseComparisons).values({
        sessionId: data.sessionId,
        pairIndex: data.pairIndex,
        subscaleA: pair.a,
        subscaleB: pair.b,
        selected: data.selected,
      })
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === '23505') {
        throw new Error(
          `Pair ${data.pairIndex} has already been submitted for this session`,
        )
      }
      throw err
    }

    const result = (
      await db
        .select({ total: count() })
        .from(pairwiseComparisons)
        .where(eq(pairwiseComparisons.sessionId, data.sessionId))
    ).at(0)

    return { pairsCompleted: result?.total ?? 0 }
  })

export const getPairwiseComparisons = createServerFn()
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }): Promise<PairwiseComparison[]> => {
    const rows = await db
      .select()
      .from(pairwiseComparisons)
      .where(eq(pairwiseComparisons.sessionId, data.sessionId))

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      pairIndex: r.pairIndex,
      subscaleA: r.subscaleA as SubscaleCode,
      subscaleB: r.subscaleB as SubscaleCode,
      selected: r.selected as SubscaleCode,
      respondedAt: r.respondedAt,
    }))
  })
