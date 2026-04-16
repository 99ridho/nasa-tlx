import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getSession } from '#/server/sessions'
import { getSubscaleRatings } from '#/server/ratings'
import { SUBSCALE_META } from '#/lib/tlx-constants'
import { TaskContextBanner } from '#/components/TaskContextBanner'
import { ProgressIndicator } from '#/components/ProgressIndicator'
import { TLXSlider } from '#/components/TLXSlider'
import { Button } from '#/components/ui/button'
import { useRatingMutation } from '#/hooks/useRatingMutation'

export const Route = createFileRoute(
  '/session/$sessionId/phase-b/$subscaleIndex',
)({
  loader: async ({ params }) => {
    const subscaleIdx = parseInt(params.subscaleIndex, 10)
    if (isNaN(subscaleIdx) || subscaleIdx < 0 || subscaleIdx > 5) {
      throw notFound()
    }

    const [session, ratings] = await Promise.all([
      getSession({ data: { id: params.sessionId } }),
      getSubscaleRatings({ data: { sessionId: params.sessionId } }),
    ])

    if (!session) throw notFound()

    return { session, ratings, subscaleIdx }
  },
  component: PhaseBComponent,
})

function PhaseBComponent() {
  const { session, subscaleIdx } = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const mutation = useRatingMutation(session.id)

  const [rating, setRating] = useState<number | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Get the subscale code for this step
  const subscaleCode = session.subscaleOrder[subscaleIdx]
  const meta = SUBSCALE_META[subscaleCode]

  function handleValueChange(value: number) {
    setRating(value)
    setHasInteracted(true)
  }

  async function handleNext() {
    if (!hasInteracted || rating === null) return

    try {
      await mutation.mutateAsync({
        sessionId: session.id,
        subscale: subscaleCode,
        sliderPosition: rating,
      })

      const nextIdx = subscaleIdx + 1
      if (nextIdx >= 6) {
        await navigate({
          to: '/session/$sessionId/complete',
          params: { sessionId: session.id },
        })
      } else {
        await navigate({
          to: '/session/$sessionId/phase-b/$subscaleIndex',
          params: { sessionId: session.id, subscaleIndex: String(nextIdx) },
        })
      }
    } catch {
      // Error handled by mutation state
    } finally {
      setHasInteracted(false)
      setRating(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TaskContextBanner taskLabel={session.taskLabel} />

      <div className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-3">{t('phaseB.title')}</h1>
          <ProgressIndicator
            current={subscaleIdx + 1}
            total={6}
            label={t('phaseB.progress', { current: subscaleIdx + 1, total: 6 })}
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t(meta.nameKey)}</h2>
          <p className="text-muted-foreground">{t(meta.descriptionKey)}</p>
        </div>

        <p className="text-sm font-medium">{t('phaseB.instruction')}</p>

        <TLXSlider
          value={rating}
          onValueChange={handleValueChange}
          leftLabel={t(meta.leftEndpointKey)}
          rightLabel={t(meta.rightEndpointKey)}
          ariaLabel={t(meta.nameKey)}
        />

        {!hasInteracted && (
          <p
            className="text-sm text-muted-foreground text-center"
            aria-live="polite"
          >
            {t('phaseB.notSet')}
          </p>
        )}

        <div className="pt-4">
          <Button
            onClick={handleNext}
            disabled={!hasInteracted || mutation.isPending}
            className="w-full min-h-[44px]"
          >
            {mutation.isPending ? t('common.loading') : t('common.next')}
          </Button>
        </div>
      </div>
    </div>
  )
}
