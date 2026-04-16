import { createServerFn } from '@tanstack/react-start/server'
import { eq, max, count } from 'drizzle-orm'
import { db } from '#/db/index'
import { sessions, studies, participants, pairwiseComparisons, subscaleRatings } from '#/db/schema'
import type {
  CreateSessionInput,
  Session,
  SessionWithRelations,
  CollectionMode,
  PhaseOrder,
  SessionStatus,
  SubscaleCode,
} from '#/types/domain'
import { shuffleArray, SUBSCALE_CODES } from '#/lib/tlx-constants'

function mapSession(row: typeof sessions.$inferSelect): Session {
  return {
    id: row.id,
    studyId: row.studyId,
    participantId: row.participantId,
    taskLabel: row.taskLabel,
    collectionMode: row.collectionMode as CollectionMode,
    phaseOrder: row.phaseOrder as PhaseOrder,
    status: row.status as SessionStatus,
    pairOrder: row.pairOrder as number[],
    subscaleOrder: row.subscaleOrder as SubscaleCode[],
    sideOrder: row.sideOrder as boolean[],
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? null,
    notes: row.notes ?? null,
  }
}

export const createSession = createServerFn()
  .validator((d: CreateSessionInput) => d)
  .handler(async ({ data }): Promise<Session> => {
    // Fetch study to get taskLabel
    const [study] = await db
      .select()
      .from(studies)
      .where(eq(studies.id, data.studyId))
      .limit(1)

    if (!study) throw new Error(`Study not found: ${data.studyId}`)

    // Generate randomized orders
    const pairOrder = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    const subscaleOrder = shuffleArray([...SUBSCALE_CODES])
    const sideOrder = Array.from({ length: 15 }, () => Math.random() < 0.5)

    const phaseOrder: PhaseOrder =
      data.collectionMode === 'raw_only' ? 'ratings_first' : 'comparisons_first'

    const [row] = await db
      .insert(sessions)
      .values({
        studyId: data.studyId,
        participantId: data.participantId,
        taskLabel: study.taskLabel,
        collectionMode: data.collectionMode,
        phaseOrder,
        status: 'in_progress',
        pairOrder,
        subscaleOrder,
        sideOrder,
      })
      .returning()

    return mapSession(row)
  })

export const getSession = createServerFn()
  .validator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<SessionWithRelations | null> => {
    const rows = await db
      .select({
        session: sessions,
        participant: participants,
        study: studies,
      })
      .from(sessions)
      .innerJoin(participants, eq(sessions.participantId, participants.id))
      .innerJoin(studies, eq(sessions.studyId, studies.id))
      .where(eq(sessions.id, data.id))
      .limit(1)

    if (rows.length === 0) return null

    const { session: s, participant: p, study: st } = rows[0]

    return {
      ...mapSession(s),
      participant: {
        id: p.id,
        studyId: p.studyId,
        participantCode: p.participantCode,
        createdAt: p.createdAt,
      },
      study: {
        id: st.id,
        name: st.name,
        taskLabel: st.taskLabel,
        description: st.description ?? null,
        createdBy: st.createdBy,
        createdAt: st.createdAt,
        updatedAt: st.updatedAt,
      },
    }
  })

export const getSessionsByStudy = createServerFn()
  .validator((d: { studyId: string }) => d)
  .handler(async ({ data }): Promise<SessionWithRelations[]> => {
    const rows = await db
      .select({
        session: sessions,
        participant: participants,
        study: studies,
      })
      .from(sessions)
      .innerJoin(participants, eq(sessions.participantId, participants.id))
      .innerJoin(studies, eq(sessions.studyId, studies.id))
      .where(eq(sessions.studyId, data.studyId))

    return rows.map(({ session: s, participant: p, study: st }) => ({
      ...mapSession(s),
      participant: {
        id: p.id,
        studyId: p.studyId,
        participantCode: p.participantCode,
        createdAt: p.createdAt,
      },
      study: {
        id: st.id,
        name: st.name,
        taskLabel: st.taskLabel,
        description: st.description ?? null,
        createdBy: st.createdBy,
        createdAt: st.createdAt,
        updatedAt: st.updatedAt,
      },
    }))
  })

export const resumeSession = createServerFn()
  .validator((d: { id: string }) => d)
  .handler(
    async ({ data }): Promise<{ lastPairIndex: number | null; lastSubscaleIndex: number | null }> => {
      const [pairResult] = await db
        .select({ maxIndex: max(pairwiseComparisons.pairIndex) })
        .from(pairwiseComparisons)
        .where(eq(pairwiseComparisons.sessionId, data.id))

      const [ratingResult] = await db
        .select({ ratingCount: count() })
        .from(subscaleRatings)
        .where(eq(subscaleRatings.sessionId, data.id))

      return {
        lastPairIndex: pairResult?.maxIndex ?? null,
        lastSubscaleIndex:
          ratingResult && ratingResult.ratingCount > 0 ? ratingResult.ratingCount - 1 : null,
      }
    }
  )
