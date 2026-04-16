import {
  pgTable,
  uuid,
  text,
  timestamp,
  smallint,
  decimal,
  jsonb,
  pgEnum,
  uniqueIndex,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const subscaleCodeEnum = pgEnum('subscale_code', ['MD', 'PD', 'TD', 'OP', 'EF', 'FR'])
export const collectionModeEnum = pgEnum('collection_mode', ['weighted', 'raw_only'])
export const phaseOrderEnum = pgEnum('phase_order', ['comparisons_first', 'ratings_first'])
export const sessionStatusEnum = pgEnum('session_status', ['in_progress', 'completed', 'abandoned'])

export const studies = pgTable('studies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  taskLabel: text('task_label').notNull(),
  description: text('description'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id').notNull().references(() => studies.id, { onDelete: 'cascade' }),
  participantCode: text('participant_code').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('participants_study_code_unique').on(t.studyId, t.participantCode),
])

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  studyId: uuid('study_id').notNull().references(() => studies.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id').notNull().references(() => participants.id, { onDelete: 'cascade' }),
  taskLabel: text('task_label').notNull(),
  collectionMode: collectionModeEnum('collection_mode').notNull(),
  phaseOrder: phaseOrderEnum('phase_order').notNull().default('comparisons_first'),
  status: sessionStatusEnum('status').notNull().default('in_progress'),
  pairOrder: jsonb('pair_order').notNull().$type<number[]>(),
  subscaleOrder: jsonb('subscale_order').notNull().$type<string[]>(),
  sideOrder: jsonb('side_order').notNull().$type<boolean[]>(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
})

export const pairwiseComparisons = pgTable('pairwise_comparisons', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  pairIndex: smallint('pair_index').notNull(),
  subscaleA: subscaleCodeEnum('subscale_a').notNull(),
  subscaleB: subscaleCodeEnum('subscale_b').notNull(),
  selected: subscaleCodeEnum('selected').notNull(),
  respondedAt: timestamp('responded_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('pairwise_session_pair_unique').on(t.sessionId, t.pairIndex),
  check('pair_index_range', sql`${t.pairIndex} >= 0 AND ${t.pairIndex} <= 14`),
])

export const subscaleRatings = pgTable('subscale_ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  subscale: subscaleCodeEnum('subscale').notNull(),
  rawValue: smallint('raw_value').notNull(),
  sliderPosition: decimal('slider_position', { precision: 5, scale: 2 }).notNull(),
  respondedAt: timestamp('responded_at').defaultNow().notNull(),
}, (t) => [
  uniqueIndex('ratings_session_subscale_unique').on(t.sessionId, t.subscale),
  check('raw_value_range', sql`${t.rawValue} >= 0 AND ${t.rawValue} <= 100`),
])

export const tlxScores = pgTable('tlx_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }).unique(),
  weightMd: smallint('weight_md').notNull(),
  weightPd: smallint('weight_pd').notNull(),
  weightTd: smallint('weight_td').notNull(),
  weightOp: smallint('weight_op').notNull(),
  weightEf: smallint('weight_ef').notNull(),
  weightFr: smallint('weight_fr').notNull(),
  weightedTlx: decimal('weighted_tlx', { precision: 6, scale: 2 }),
  rawTlx: decimal('raw_tlx', { precision: 6, scale: 2 }).notNull(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
})
