import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { getStudyById } from '#/server/studies'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { CSVExportButton } from '#/components/CSVExportButton'

export const Route = createFileRoute('/studies/$studyId/')({
  loader: async ({ params }) => {
    const study = await getStudyById({ data: { id: params.studyId } })
    if (!study) throw notFound()
    return { study }
  },
  component: StudyDetailComponent,
})

function StudyDetailComponent() {
  const { study } = Route.useLoaderData()
  const { t } = useTranslation()

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to="/studies">{t('common.back')}</Link>
        </Button>
        <h1 className="text-2xl font-bold">{study.name}</h1>
      </div>

      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('study.taskLabel')}:</span>
              <Badge>{study.taskLabel}</Badge>
            </div>
            {study.description && (
              <div>
                <span className="text-sm font-medium">{t('study.description')}:</span>
                <p className="text-sm text-muted-foreground mt-1">{study.description}</p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">{t('study.createdBy')}:</span>
              <span className="text-sm text-muted-foreground ml-2">{study.createdBy}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <Link
                to="/studies/$studyId/participants"
                params={{ studyId: study.id }}
                className="block text-center no-underline"
              >
                <div className="text-3xl mb-2">👥</div>
                <h2 className="font-semibold">{t('study.participants')}</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage study participants</p>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-6">
              <Link
                to="/studies/$studyId/sessions"
                params={{ studyId: study.id }}
                className="block text-center no-underline"
              >
                <div className="text-3xl mb-2">📋</div>
                <h2 className="font-semibold">{t('study.sessions')}</h2>
                <p className="text-sm text-muted-foreground mt-1">View and start sessions</p>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <CSVExportButton studyId={study.id} />
        </div>
      </div>
    </main>
  )
}
