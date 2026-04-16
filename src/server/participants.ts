import { createServerFn } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { participants } from '#/db/schema'
import type { AddParticipantInput, ConflictError, Participant } from '#/types/domain'
import { validateAddParticipant } from './validation'

export const getParticipants = createServerFn()
  .validator((d: { studyId: string }) => d)
  .handler(async ({ data }): Promise<Participant[]> => {
    const rows = await db
      .select()
      .from(participants)
      .where(eq(participants.studyId, data.studyId))

    return rows.map((r) => ({
      id: r.id,
      studyId: r.studyId,
      participantCode: r.participantCode,
      createdAt: r.createdAt,
    }))
  })

export const addParticipant = createServerFn()
  .validator((d: AddParticipantInput) => d)
  .handler(async ({ data }): Promise<Participant | ConflictError> => {
    const errors = validateAddParticipant(data)
    if (errors.length > 0) {
      return { type: 'conflict', message: errors[0].message }
    }

    try {
      const [row] = await db
        .insert(participants)
        .values({
          studyId: data.studyId,
          participantCode: data.participantCode.trim(),
        })
        .returning()

      return {
        id: row.id,
        studyId: row.studyId,
        participantCode: row.participantCode,
        createdAt: row.createdAt,
      }
    } catch (err: unknown) {
      const error = err as { code?: string }
      if (error.code === '23505') {
        return {
          type: 'conflict',
          message: `Participant code "${data.participantCode}" already exists in this study`,
        }
      }
      throw err
    }
  })

export const deleteParticipant = createServerFn()
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    await db.delete(participants).where(eq(participants.id, data.id))
    return { success: true }
  })
