import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getSession } from '#/server/sessions'
import { getPairwiseComparisons } from '#/server/pairwise'
import { CANONICAL_PAIRS, SUBSCALE_META } from '#/lib/tlx'
import { TaskContextBanner } from '#/components/TaskContextBanner'
import { ProgressIndicator } from '#/components/ProgressIndicator'
import { SubscaleComparisonCard } from '#/components/SubscaleComparisonCard'
import { usePairwiseMutation } from '#/hooks/usePairwiseMutation'
import type { SubscaleCode } from '#/types/domain'

export const Route = createFileRoute('/session/$sessionId/phase-a/$pairIndex')({
  loader: async ({ params }) => {
    const pairIdx = parseInt(params.pairIndex, 10)
    if (isNaN(pairIdx) || pairIdx < 0 || pairIdx > 14) {
      throw notFound()
    }

    const [session, comparisons] = await Promise.all([
      getSession({ data: { id: params.sessionId } }),
      getPairwiseComparisons({ data: { sessionId: params.sessionId } }),
    ])

    if (!session) throw notFound()

    return { session, comparisons, pairIdx }
  },
  component: PhaseAComponent,
})

function PhaseAComponent() {
  const { session, comparisons, pairIdx } = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mutation = usePairwiseMutation(session.id)
  // Get the canonical pair index from the session's randomized order
  const canonicalIdx = session.pairOrder[pairIdx]
  const pair = CANONICAL_PAIRS[canonicalIdx]
  const sideIsALeft = session.sideOrder[pairIdx]

  // Determine left and right subscale based on sideOrder
  const leftCode: SubscaleCode = sideIsALeft ? pair.a : pair.b
  const rightCode: SubscaleCode = sideIsALeft ? pair.b : pair.a

  const leftMeta = SUBSCALE_META[leftCode]
  const rightMeta = SUBSCALE_META[rightCode]

  // Check if already answered
  const alreadyAnswered = comparisons.find((c) => c.pairIndex === canonicalIdx)

  async function handleSelect(code: SubscaleCode) {
    if (mutation.isPending || alreadyAnswered) return

    try {
      await mutation.mutateAsync({
        sessionId: session.id,
        pairIndex: canonicalIdx,
        selected: code,
      })

      // Navigate to next pair or to phase B
      const nextIdx = pairIdx + 1
      if (nextIdx >= 15) {
        await navigate({
          to: '/session/$sessionId/phase-b/$subscaleIndex',
          params: { sessionId: session.id, subscaleIndex: '0' },
        })
      } else {
        await navigate({
          to: '/session/$sessionId/phase-a/$pairIndex',
          params: { sessionId: session.id, pairIndex: String(nextIdx) },
        })
      }
    } catch {
      // mutation failed — component will re-enable via isPending resetting
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TaskContextBanner taskLabel={session.taskLabel} />

      <div className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-3">{t('phaseA.title')}</h1>
          <ProgressIndicator
            current={pairIdx + 1}
            total={15}
            label={t('phaseA.progress', { current: pairIdx + 1, total: 15 })}
          />
        </div>

        <p className="text-base font-medium text-center">
          {t('phaseA.instruction')}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SubscaleComparisonCard
            name={t(leftMeta.nameKey)}
            description={t(leftMeta.descriptionKey)}
            onSelect={() => handleSelect(leftCode)}
            disabled={mutation.isPending || !!alreadyAnswered}
          />
          <SubscaleComparisonCard
            name={t(rightMeta.nameKey)}
            description={t(rightMeta.descriptionKey)}
            onSelect={() => handleSelect(rightCode)}
            disabled={mutation.isPending || !!alreadyAnswered}
          />
        </div>
      </div>
    </div>
  )
}
