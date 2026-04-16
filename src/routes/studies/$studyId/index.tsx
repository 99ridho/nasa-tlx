import { createFileRoute, Link, notFound, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getStudyById, deleteStudy } from '#/server/studies'
import { getSessionsByStudy } from '#/server/sessions'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import { CSVExportButton } from '#/components/CSVExportButton'

export const Route = createFileRoute('/studies/$studyId/')({
  loader: async ({ params }) => {
    const [study, sessions] = await Promise.all([
      getStudyById({ data: { id: params.studyId } }),
      getSessionsByStudy({ data: { studyId: params.studyId } }),
    ])
    if (!study) throw notFound()
    const hasInProgressSessions = sessions.some((s) => s.status === 'in_progress')
    return { study, hasSessions: sessions.length > 0, hasInProgressSessions }
  },
  component: StudyDetailComponent,
})

function StudyDetailComponent() {
  const { study, hasInProgressSessions } = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteStudy({ data: { id: study.id } })
      await navigate({ to: '/studies' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to="/studies">{t('common.back')}</Link>
        </Button>
        <h1 className="text-2xl font-bold">{study.name}</h1>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" className="min-h-[44px]">
            <Link to="/studies/$studyId/edit" params={{ studyId: study.id }}>
              {t('study.edit')}
            </Link>
          </Button>
          <Button
            variant="destructive"
            className="min-h-[44px]"
            onClick={() => setDeleteDialogOpen(true)}
          >
            {t('study.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Study Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {t('study.taskLabel')}:
              </span>
              <Badge>{study.taskLabel}</Badge>
            </div>
            {study.description && (
              <div>
                <span className="text-sm font-medium">
                  {t('study.description')}:
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {study.description}
                </p>
              </div>
            )}
            <div>
              <span className="text-sm font-medium">
                {t('study.createdBy')}:
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {study.createdBy}
              </span>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Manage study participants
                </p>
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
                <p className="text-sm text-muted-foreground mt-1">
                  View and start sessions
                </p>
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <CSVExportButton studyId={study.id} />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteConfirmName('')
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('study.deleteConfirmTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {t('study.deleteConfirmDescription', { name: study.name })}
            </p>

            {hasInProgressSessions && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {t('study.deleteWarningInProgress')}
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-sm">
                {t('study.deleteConfirmPlaceholder', { name: study.name })}
              </p>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={study.name}
                className="min-h-[44px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmName('')
              }}
              className="min-h-[44px]"
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmName !== study.name || isDeleting}
              className="min-h-[44px]"
            >
              {isDeleting ? t('common.loading') : t('study.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
