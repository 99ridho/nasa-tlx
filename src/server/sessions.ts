'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '#/db/index'
import { sessions, studies, participants } from '#/db/schema'
import type {
  CreateSessionInput,
  CreateBatchSessionsInput,
  BatchSessionResult,
  Session,
  SessionWithRelations,
  CollectionMode,
  PhaseOrder,
  SessionStatus,
  SubscaleCode,
} from '#/types/domain'
import { shuffleArray, SUBSCALE_CODES } from '#/lib/tlx'

function mapSession(row: typeof sessions.$inferSelect): Session {
  return {
    id: row.id,
    studyId: row.studyId,
    participantId: row.participantId,
    taskLabel: row.taskLabel,
    collectionMode: row.collectionMode as CollectionMode,
    phaseOrder: row.phaseOrder as PhaseOrder,
    status: row.status as SessionStatus,
    pairOrder: row.pairOrder,
    subscaleOrder: row.subscaleOrder as SubscaleCode[],
    sideOrder: row.sideOrder,
    startedAt: row.startedAt,
    completedAt: row.completedAt ?? null,
    notes: row.notes ?? null,
  }
}

export const createSession = createServerFn()
  .inputValidator((d: CreateSessionInput) => d)
  .handler(async ({ data }): Promise<Session> => {
    // Fetch study to get taskLabel
    const study = (
      await db
        .select()
        .from(studies)
        .where(eq(studies.id, data.studyId))
        .limit(1)
    ).at(0)

    if (!study) throw new Error(`Study not found: ${data.studyId}`)

    // Generate randomized orders
    const pairOrder = shuffleArray([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
    ])
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
  .inputValidator((d: { id: string }) => d)
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
  .inputValidator((d: { studyId: string }) => d)
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
  .inputValidator((d: { id: string }) => d)
  .handler(
    async ({
      data,
    }): Promise<{
      lastPairIndex: number | null
      lastSubscaleIndex: number | null
    }> => {
      const result = await db.execute<{
        max_pair_index: number | null
        rating_count: string
      }>(
        sql`
          SELECT
            (SELECT MAX(pair_index) FROM pairwise_comparisons WHERE session_id = ${data.id}) AS max_pair_index,
            (SELECT COUNT(1)        FROM subscale_ratings       WHERE session_id = ${data.id}) AS rating_count
        `,
      )
      const row = result.rows[0]

      return {
        lastPairIndex: row.max_pair_index ?? null,
        lastSubscaleIndex:
          row.rating_count && Number(row.rating_count) > 0
            ? Number(row.rating_count) - 1
            : null,
      }
    },
  )

export const createBatchSessions = createServerFn()
  .inputValidator((d: CreateBatchSessionsInput) => d)
  .handler(async ({ data }): Promise<BatchSessionResult> => {
    const study = (
      await db
        .select()
        .from(studies)
        .where(eq(studies.id, data.studyId))
        .limit(1)
    ).at(0)

    if (!study) throw new Error(`Study not found: ${data.studyId}`)

    const participantRows = await db
      .select()
      .from(participants)
      .where(inArray(participants.id, data.participantIds))

    const phaseOrder: PhaseOrder =
      data.collectionMode === 'raw_only' ? 'ratings_first' : 'comparisons_first'

    const sessionValues = participantRows.map((p) => ({
      participant: p,
      values: {
        studyId: data.studyId,
        participantId: p.id,
        taskLabel: study.taskLabel,
        collectionMode: data.collectionMode,
        phaseOrder,
        status: 'in_progress' as const,
        pairOrder: shuffleArray([
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
        ]),
        subscaleOrder: shuffleArray([...SUBSCALE_CODES]),
        sideOrder: Array.from({ length: 15 }, () => Math.random() < 0.5),
      },
    }))

    const insertedRows = await db
      .insert(sessions)
      .values(sessionValues.map((sv) => sv.values))
      .returning()

    const results: BatchSessionResult['sessions'] = insertedRows.map(
      (row, i) => ({
        participantCode: sessionValues[i].participant.participantCode,
        sessionId: row.id,
      }),
    )

    return { sessions: results }
  })
