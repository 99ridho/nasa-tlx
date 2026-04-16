import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getSession } from '#/server/sessions'
import { Button } from '#/components/ui/button'
import { LanguageSwitcher } from '#/components/LanguageSwitcher'

export const Route = createFileRoute('/session/$sessionId/start')({
  loader: async ({ params }) => {
    const session = await getSession({ data: { id: params.sessionId } })
    if (!session) throw notFound()
    return { session }
  },
  component: StartComponent,
})

function StartComponent() {
  const { session } = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (session.status === 'completed') {
    return (
      <main className="px-4 pb-8 pt-16 max-w-md mx-auto text-center">
        <p className="text-muted-foreground">{t('session.start.alreadyCompleted')}</p>
      </main>
    )
  }

  async function handleBegin() {
    if (session.collectionMode === 'weighted') {
      await navigate({
        to: '/session/$sessionId/phase-a/$pairIndex',
        params: { sessionId: session.id, pairIndex: '0' },
      })
    } else {
      await navigate({
        to: '/session/$sessionId/phase-b/$subscaleIndex',
        params: { sessionId: session.id, subscaleIndex: '0' },
      })
    }
  }

  return (
    <main className="px-4 pb-8 pt-16 max-w-md mx-auto">
      <div className="flex justify-end mb-8">
        <LanguageSwitcher />
      </div>

      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">{t('session.start.title')}</h1>

        <div className="rounded-lg border p-4 text-left space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('session.start.taskLabel')}
            </p>
            <p className="font-semibold">{session.taskLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('common.mode')}
            </p>
            <p className="text-sm">
              {session.collectionMode === 'weighted'
                ? t('session.start.mode.weighted')
                : t('session.start.mode.raw_only')}
            </p>
          </div>
        </div>

        <Button onClick={handleBegin} className="w-full min-h-[44px] text-base">
          {t('session.start.beginButton')}
        </Button>
      </div>
    </main>
  )
}
