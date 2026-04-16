import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '#/lib/query-keys'
import { submitPairwiseComparison } from '#/server/pairwise'
import type { SubmitPairwiseInput } from '#/types/domain'

export function usePairwiseMutation(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: SubmitPairwiseInput) =>
      submitPairwiseComparison({ data: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.pairwise(sessionId),
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      })
    },
  })
}
