'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq, and } from 'drizzle-orm'
import { db } from '#/db/index'
import { subscaleRatings } from '#/db/schema'
import type {
  SubscaleRating,
  SubmitRatingInput,
  SubscaleCode,
} from '#/types/domain'
import { snapSliderValue } from '#/lib/tlx-constants'

export const submitSubscaleRating = createServerFn()
  .inputValidator((d: SubmitRatingInput) => d)
  .handler(async ({ data }): Promise<SubscaleRating> => {
    const rawValue = snapSliderValue(data.sliderPosition)

    // Upsert: check if a rating already exists for this session + subscale
    const existing = (await db
      .select()
      .from(subscaleRatings)
      .where(
        and(
          eq(subscaleRatings.sessionId, data.sessionId),
          eq(subscaleRatings.subscale, data.subscale),
        ),
      )
      .limit(1)).at(0)

    let row: typeof subscaleRatings.$inferSelect

    if (existing) {
      const [updated] = await db
        .update(subscaleRatings)
        .set({
          rawValue,
          sliderPosition: String(data.sliderPosition),
          respondedAt: new Date(),
        })
        .where(eq(subscaleRatings.id, existing.id))
        .returning()
      row = updated
    } else {
      const [inserted] = await db
        .insert(subscaleRatings)
        .values({
          sessionId: data.sessionId,
          subscale: data.subscale,
          rawValue,
          sliderPosition: String(data.sliderPosition),
        })
        .returning()
      row = inserted
    }

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
