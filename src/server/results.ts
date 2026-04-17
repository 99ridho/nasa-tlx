'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq, avg, count, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import { sessions, subscaleRatings, tlxScores } from '#/db/schema'
import type { StudyResults, SubscaleCode } from '#/types/domain'

export const getStudyResults = createServerFn()
  .inputValidator((d: { studyId: string }) => d)
  .handler(async ({ data }): Promise<StudyResults> => {
    // Count completed sessions
    const sessionCountResult = (
      await db
        .select({ total: count() })
        .from(sessions)
        .where(eq(sessions.studyId, data.studyId))
    ).at(0)

    const sessionCount = sessionCountResult?.total ?? 0

    // Aggregate weighted and raw TLX across completed sessions in this study
    const aggResult = (
      await db
        .select({
          meanWeightedTlx: avg(tlxScores.weightedTlx),
          sdWeightedTlx: sql<number>`stddev_pop(${tlxScores.weightedTlx})`,
          meanRawTlx: avg(tlxScores.rawTlx),
          sdRawTlx: sql<number>`stddev_pop(${tlxScores.rawTlx})`,
        })
        .from(tlxScores)
        .innerJoin(sessions, eq(tlxScores.sessionId, sessions.id))
        .where(eq(sessions.studyId, data.studyId))
    ).at(0)

    // Per-subscale rating averages and stddev (single GROUP BY query)
    const subscaleRows = await db
      .select({
        subscale: subscaleRatings.subscale,
        mean: avg(subscaleRatings.rawValue),
        sd: sql<number>`stddev_pop(${subscaleRatings.rawValue})`,
      })
      .from(subscaleRatings)
      .innerJoin(sessions, eq(subscaleRatings.sessionId, sessions.id))
      .where(eq(sessions.studyId, data.studyId))
      .groupBy(subscaleRatings.subscale)

    const subscaleStats = Object.fromEntries(
      subscaleRows.map((r) => [
        r.subscale,
        { mean: Number(r.mean ?? 0), sd: Number(r.sd ?? 0) },
      ]),
    ) as Record<SubscaleCode, { mean: number; sd: number }>

    return {
      studyId: data.studyId,
      sessionCount,
      meanWeightedTlx:
        aggResult?.meanWeightedTlx !== null &&
        aggResult?.meanWeightedTlx !== undefined
          ? Number(aggResult.meanWeightedTlx)
          : null,
      sdWeightedTlx:
        aggResult?.sdWeightedTlx !== undefined
          ? Number(aggResult.sdWeightedTlx)
          : null,
      meanRawTlx:
        aggResult?.meanRawTlx !== null && aggResult?.meanRawTlx !== undefined
          ? Number(aggResult.meanRawTlx)
          : 0,
      sdRawTlx:
        aggResult?.sdRawTlx !== undefined ? Number(aggResult.sdRawTlx) : 0,
      subscaleStats,
    }
  })
