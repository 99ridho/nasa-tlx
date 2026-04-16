export const queryKeys = {
  studies: {
    all: () => ['studies'] as const,
    detail: (id: string) => ['studies', id] as const,
  },
  participants: {
    byStudy: (studyId: string) => ['participants', studyId] as const,
  },
  sessions: {
    byStudy: (studyId: string) => ['sessions', 'study', studyId] as const,
    detail: (id: string) => ['sessions', id] as const,
    pairwise: (sessionId: string) =>
      ['sessions', sessionId, 'pairwise'] as const,
    ratings: (sessionId: string) => ['sessions', sessionId, 'ratings'] as const,
    score: (sessionId: string) => ['sessions', sessionId, 'score'] as const,
  },
}
