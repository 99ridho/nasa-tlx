import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/lib/query-keys'
import { submitSubscaleRating } from '#/server/ratings'
import type { SubmitRatingInput } from '#/types/domain'

export function useRatingMutation(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitRatingInput) =>
      submitSubscaleRating({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.ratings(sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) })
    },
  })
}
