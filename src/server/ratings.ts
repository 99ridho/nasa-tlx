'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { subscaleRatings } from '#/db/schema'
import type {
  SubscaleRating,
  SubmitRatingInput,
  SubscaleCode,
} from '#/types/domain'
import { snapSliderValue } from '#/lib/tlx'

export const submitSubscaleRating = createServerFn()
  .inputValidator((d: SubmitRatingInput) => d)
  .handler(async ({ data }): Promise<SubscaleRating> => {
    const rawValue = snapSliderValue(data.sliderPosition)

    const [row] = await db
      .insert(subscaleRatings)
      .values({
        sessionId: data.sessionId,
        subscale: data.subscale,
        rawValue,
        sliderPosition: String(data.sliderPosition),
      })
      .onConflictDoUpdate({
        target: [subscaleRatings.sessionId, subscaleRatings.subscale],
        set: {
          rawValue,
          sliderPosition: String(data.sliderPosition),
          respondedAt: new Date(),
        },
      })
      .returning()

    return {
      id: row.id,
      sessionId: row.sessionId,
      subscale: row.subscale as SubscaleCode,
      rawValue: row.rawValue,
      sliderPosition: Number(row.sliderPosition),
      respondedAt: row.respondedAt,
    }
  })

export const getSubscaleRatings = createServerFn()
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data }): Promise<SubscaleRating[]> => {
    const rows = await db
      .select()
      .from(subscaleRatings)
      .where(eq(subscaleRatings.sessionId, data.sessionId))

    return rows.map((r) => ({
      id: r.id,
      sessionId: r.sessionId,
      subscale: r.subscale as SubscaleCode,
      rawValue: r.rawValue,
      sliderPosition: Number(r.sliderPosition),
      respondedAt: r.respondedAt,
    }))
  })
