'use server'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { db } from '#/db/index'
import { sessions, participants, tlxScores, subscaleRatings } from '#/db/schema'
import type { SubscaleCode } from '#/types/domain'
import { SUBSCALE_CODES } from '#/lib/tlx-constants'

interface ExportRow {
  session_id: string
  participant_code: string
  completed_at: string
  collection_mode: string
  weighted_tlx: string
  raw_tlx: string
  weight_md: string
  weight_pd: string
  weight_td: string
  weight_op: string
  weight_ef: string
  weight_fr: string
  rating_md: string
  rating_pd: string
  rating_td: string
  rating_op: string
  rating_ef: string
  rating_fr: string
}

export const getStudySessionsExport = createServerFn()
  .validator((d: { studyId: string }) => d)
  .handler(async ({ data }): Promise<ExportRow[]> => {
    // Fetch all completed sessions for the study with participant info and scores
    const completedSessions = await db
      .select({
        session: sessions,
        participant: participants,
        score: tlxScores,
      })
      .from(sessions)
      .innerJoin(participants, eq(sessions.participantId, participants.id))
      .leftJoin(tlxScores, eq(sessions.id, tlxScores.sessionId))
      .where(eq(sessions.studyId, data.studyId))

    const rows: ExportRow[] = []

    for (const { session: s, participant: p, score } of completedSessions) {
      // Fetch per-subscale ratings for this session
      const ratings = await db
        .select()
        .from(subscaleRatings)
        .where(eq(subscaleRatings.sessionId, s.id))

      const ratingMap: Record<string, number> = {}
      for (const r of ratings) {
        ratingMap[r.subscale] = r.rawValue
      }

      rows.push({
        session_id: s.id,
        participant_code: p.participantCode,
        completed_at: s.completedAt ? s.completedAt.toISOString() : '',
        collection_mode: s.collectionMode,
        weighted_tlx: score?.weightedTlx !== null && score?.weightedTlx !== undefined ? String(score.weightedTlx) : '',
        raw_tlx: score?.rawTlx !== undefined ? String(score.rawTlx) : '',
        weight_md: score?.weightMd !== undefined ? String(score.weightMd) : '',
        weight_pd: score?.weightPd !== undefined ? String(score.weightPd) : '',
        weight_td: score?.weightTd !== undefined ? String(score.weightTd) : '',
        weight_op: score?.weightOp !== undefined ? String(score.weightOp) : '',
        weight_ef: score?.weightEf !== undefined ? String(score.weightEf) : '',
        weight_fr: score?.weightFr !== undefined ? String(score.weightFr) : '',
        rating_md: ratingMap['MD'] !== undefined ? String(ratingMap['MD']) : '',
        rating_pd: ratingMap['PD'] !== undefined ? String(ratingMap['PD']) : '',
        rating_td: ratingMap['TD'] !== undefined ? String(ratingMap['TD']) : '',
        rating_op: ratingMap['OP'] !== undefined ? String(ratingMap['OP']) : '',
        rating_ef: ratingMap['EF'] !== undefined ? String(ratingMap['EF']) : '',
        rating_fr: ratingMap['FR'] !== undefined ? String(ratingMap['FR']) : '',
      })
    }

    return rows
  })

export function generateCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''

  const headers = Object.keys(rows[0])
  const headerRow = headers.join(',')

  const dataRows = rows.map((row) =>
    headers
      .map((h) => {
        const value = row[h]
        if (value === null || value === undefined) return ''
        const str = String(value)
        // Escape values containing commas, newlines, or quotes
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      })
      .join(',')
  )

  return [headerRow, ...dataRows].join('\n')
}

export const downloadStudyCSV = createServerFn()
  .validator((d: { studyId: string }) => d)
  .handler(async ({ data }): Promise<Response> => {
    const exportRows = await db
      .select({
        session: sessions,
        participant: participants,
        score: tlxScores,
      })
      .from(sessions)
      .innerJoin(participants, eq(sessions.participantId, participants.id))
      .leftJoin(tlxScores, eq(sessions.id, tlxScores.sessionId))
      .where(eq(sessions.studyId, data.studyId))

    const rows: Record<string, unknown>[] = []

    for (const { session: s, participant: p, score } of exportRows) {
      const ratings = await db
        .select()
        .from(subscaleRatings)
        .where(eq(subscaleRatings.sessionId, s.id))

      const ratingMap: Record<string, number> = {}
      for (const r of ratings) {
        ratingMap[r.subscale] = r.rawValue
      }

      rows.push({
        session_id: s.id,
        participant_code: p.participantCode,
        completed_at: s.completedAt ? s.completedAt.toISOString() : '',
        collection_mode: s.collectionMode,
        weighted_tlx: score?.weightedTlx ?? '',
        raw_tlx: score?.rawTlx ?? '',
        weight_md: score?.weightMd ?? '',
        weight_pd: score?.weightPd ?? '',
        weight_td: score?.weightTd ?? '',
        weight_op: score?.weightOp ?? '',
        weight_ef: score?.weightEf ?? '',
        weight_fr: score?.weightFr ?? '',
        rating_md: ratingMap['MD'] ?? '',
        rating_pd: ratingMap['PD'] ?? '',
        rating_td: ratingMap['TD'] ?? '',
        rating_op: ratingMap['OP'] ?? '',
        rating_ef: ratingMap['EF'] ?? '',
        rating_fr: ratingMap['FR'] ?? '',
      })
    }

    const csv = generateCSV(rows)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="study-${data.studyId}-export.csv"`,
      },
    })
  })
