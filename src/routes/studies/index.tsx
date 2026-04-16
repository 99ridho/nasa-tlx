import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getStudies } from '#/server/studies'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'

export const Route = createFileRoute('/studies/')({
  loader: async () => {
    const studies = await getStudies()
    return { studies }
  },
  component: StudiesComponent,
})

function StudiesComponent() {
  const { studies } = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('nav.studies')}</h1>
        <Button asChild className="min-h-[44px]">
          <Link to="/studies/new">{t('study.create')}</Link>
        </Button>
      </div>

      {studies.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>{t('study.noStudies')}</p>
          <Button asChild className="mt-4 min-h-[44px]">
            <Link to="/studies/new">{t('study.create')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {studies.map((study) => (
            <Card key={study.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  <Link to="/studies/$studyId" params={{ studyId: study.id }} className="hover:underline">
                    {study.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{study.taskLabel}</Badge>
                </div>
                {study.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{study.description}</p>
                )}
                <div className="flex gap-3 text-sm">
                  <Link
                    to="/studies/$studyId/participants"
                    params={{ studyId: study.id }}
                    className="text-primary hover:underline"
                  >
                    {t('study.participants')}
                  </Link>
                  <Link
                    to="/studies/$studyId/sessions"
                    params={{ studyId: study.id }}
                    className="text-primary hover:underline"
                  >
                    {t('study.sessions')}
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('study.createdBy')}: {study.createdBy}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
