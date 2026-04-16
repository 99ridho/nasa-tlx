export type SubscaleCode = 'MD' | 'PD' | 'TD' | 'OP' | 'EF' | 'FR'
export type CollectionMode = 'weighted' | 'raw_only'
export type PhaseOrder = 'comparisons_first' | 'ratings_first'
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned'
export type SubscalePair = { a: SubscaleCode; b: SubscaleCode }

export interface SubscaleMeta {
  code: SubscaleCode
  nameKey: string
  descriptionKey: string
  leftEndpointKey: string
  rightEndpointKey: string
}

export interface Study {
  id: string
  name: string
  taskLabel: string
  description: string | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Participant {
  id: string
  studyId: string
  participantCode: string
  createdAt: Date
}

export interface Session {
  id: string
  studyId: string
  participantId: string
  taskLabel: string
  collectionMode: CollectionMode
  phaseOrder: PhaseOrder
  status: SessionStatus
  pairOrder: number[] // 15 indices into CANONICAL_PAIRS
  subscaleOrder: SubscaleCode[] // 6 subscale codes in randomized order
  sideOrder: boolean[] // 15 booleans: true = a is left, false = b is left
  startedAt: Date
  completedAt: Date | null
  notes: string | null
}

export interface SessionWithRelations extends Session {
  participant: Participant
  study: Study
}

export interface PairwiseComparison {
  id: string
  sessionId: string
  pairIndex: number
  subscaleA: SubscaleCode
  subscaleB: SubscaleCode
  selected: SubscaleCode
  respondedAt: Date
}

export interface SubscaleRating {
  id: string
  sessionId: string
  subscale: SubscaleCode
  rawValue: number
  sliderPosition: number
  respondedAt: Date
}

export interface TLXScore {
  id: string
  sessionId: string
  weightMd: number
  weightPd: number
  weightTd: number
  weightOp: number
  weightEf: number
  weightFr: number
  weightedTlx: number | null
  rawTlx: number
  computedAt: Date
}

// Input types for server functions
export interface CreateStudyInput {
  name: string
  taskLabel: string
  description?: string
  createdBy: string
}

export interface UpdateStudyInput {
  name?: string
  taskLabel?: string
  description?: string
}

export interface AddParticipantInput {
  studyId: string
  participantCode: string
}

export interface CreateSessionInput {
  studyId: string
  participantId: string
  collectionMode: CollectionMode
}

export interface CreateBatchSessionsInput {
  studyId: string
  participantIds: string[]
  collectionMode: CollectionMode
}

export interface BatchSessionResult {
  sessions: Array<{ participantCode: string; sessionId: string }>
}

export interface SubmitPairwiseInput {
  sessionId: string
  pairIndex: number
  selected: SubscaleCode
}

export interface SubmitRatingInput {
  sessionId: string
  subscale: SubscaleCode
  sliderPosition: number
}

export interface CompleteSessionInput {
  sessionId: string
  notes?: string
}

// Result types
export interface StudyResults {
  studyId: string
  sessionCount: number
  meanWeightedTlx: number | null
  sdWeightedTlx: number | null
  meanRawTlx: number
  sdRawTlx: number
  subscaleStats: Record<SubscaleCode, { mean: number; sd: number }>
}

export interface ConflictError {
  type: 'conflict'
  message: string
}

export interface ValidationError {
  type: 'validation'
  field: string
  message: string
}
