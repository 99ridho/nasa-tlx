import {
  createFileRoute,
  Link,
  useRouter,
  notFound,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getStudyById } from '#/server/studies'
import { getParticipants } from '#/server/participants'
import { getSessionsByStudy, createBatchSessions } from '#/server/sessions'
import { getStudyResults } from '#/server/results'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Checkbox } from '#/components/ui/checkbox'
import { Label } from '#/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '#/components/ui/dialog'
import type {
  CollectionMode,
  SessionWithRelations,
  BatchSessionResult,
} from '#/types/domain'

export const Route = createFileRoute('/studies/$studyId/sessions/')({
  loader: async ({ params }) => {
    const [study, sessions, participants, results] = await Promise.all([
      getStudyById({ data: { id: params.studyId } }),
      getSessionsByStudy({ data: { studyId: params.studyId } }),
      getParticipants({ data: { studyId: params.studyId } }),
      getStudyResults({ data: { studyId: params.studyId } }),
    ])
    if (!study) throw notFound()
    return { study, sessions, participants, results }
  },
  component: SessionsComponent,
})

function SessionStatusBadge({
  status,
}: {
  status: SessionWithRelations['status']
}) {
  const variants: Record<
    string,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    completed: 'default',
    in_progress: 'secondary',
    abandoned: 'destructive',
  }
  return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>
}

function SessionsComponent() {
  const { study, sessions, participants, results } = Route.useLoaderData()
  const { t } = useTranslation()
  const router = useRouter()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [collectionMode, setCollectionMode] =
    useState<CollectionMode>('weighted')
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<
    BatchSessionResult['sessions'] | null
  >(null)

  // Participants that already have an in_progress session
  const inProgressParticipantIds = new Set(
    sessions
      .filter((s) => s.status === 'in_progress')
      .map((s) => s.participantId),
  )

  const eligibleParticipants = participants.filter(
    (p) => !inProgressParticipantIds.has(p.id),
  )

  const allEligibleSelected =
    eligibleParticipants.length > 0 &&
    eligibleParticipants.every((p) => selectedIds.has(p.id))

  function toggleSelectAll() {
    if (allEligibleSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(eligibleParticipants.map((p) => p.id)))
    }
  }

  function toggleParticipant(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function closeDialog() {
    setDialogOpen(false)
    setSelectedIds(new Set())
    setCollectionMode('weighted')
    setStartError(null)
    setBatchResults(null)
  }

  async function handleCreateSessions() {
    if (selectedIds.size === 0) {
      setStartError(t('session.selectAtLeastOne'))
      return
    }
    setIsStarting(true)
    setStartError(null)
    try {
      const result = await createBatchSessions({
        data: {
          studyId: study.id,
          participantIds: Array.from(selectedIds),
          collectionMode,
        },
      })
      setBatchResults(result.sessions)
    } catch {
      setStartError(t('session.createFailed'))
    } finally {
      setIsStarting(false)
    }
  }

  function copyLink(sessionId: string) {
    navigator.clipboard.writeText(
      `${window.location.origin}/session/${sessionId}/start`,
    )
  }

  function copyAll() {
    if (!batchResults) return
    const text = batchResults
      .map(
        (r) =>
          `${r.participantCode}: ${window.location.origin}/session/${r.sessionId}/start`,
      )
      .join('\n')
    navigator.clipboard.writeText(text)
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="outline" className="min-h-11">
          <Link to="/studies/$studyId" params={{ studyId: study.id }}>
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('study.sessions')}</h1>
        <Badge variant="secondary" className="ml-auto">
          {study.name}
        </Badge>
      </div>

      {results.sessionCount > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              {t('session.complete.weightedTLX')}
            </p>
            <p className="text-2xl font-bold mt-1">
              {results.meanWeightedTlx !== null
                ? `${results.meanWeightedTlx.toFixed(1)} ± ${(results.sdWeightedTlx ?? 0).toFixed(1)}`
                : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              {t('session.complete.rawTLX')}
            </p>
            <p className="text-2xl font-bold mt-1">
              {results.meanRawTlx.toFixed(1)} ± {results.sdRawTlx.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogOpen(true)} className="min-h-11">
          {t('session.batchCreate')}
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {t('session.noSessions')}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('participant.code')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('common.mode')}</TableHead>
                <TableHead>{t('common.completed')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono">
                    {session.participant.participantCode}
                  </TableCell>
                  <TableCell>
                    <SessionStatusBadge status={session.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.collectionMode}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {session.completedAt
                      ? new Date(session.completedAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="min-h-11"
                    >
                      <Link
                        to="/studies/$studyId/sessions/$sessionId"
                        params={{ studyId: study.id, sessionId: session.id }}
                      >
                        {t('common.view')}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {batchResults
                ? t('session.sessionLinks')
                : t('session.batchCreate')}
            </DialogTitle>
          </DialogHeader>

          {batchResults === null ? (
            /* Creation phase */
            <div className="space-y-4 py-2">
              {eligibleParticipants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t('session.noEligible')}
                </p>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label>{t('common.participants')}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleSelectAll}
                        className="text-xs h-7"
                      >
                        {allEligibleSelected
                          ? t('session.deselectAll')
                          : t('session.selectAllEligible')}
                      </Button>
                    </div>
                    <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                      {eligibleParticipants.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => toggleParticipant(p.id)}
                          />
                          <span className="text-sm font-mono">
                            {p.participantCode}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t('session.collectionMode')}</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          collectionMode === 'weighted' ? 'default' : 'outline'
                        }
                        onClick={() => setCollectionMode('weighted')}
                        className="min-h-11 flex-1"
                      >
                        {t('session.weightedTLXMode')}
                      </Button>
                      <Button
                        type="button"
                        variant={
                          collectionMode === 'raw_only' ? 'default' : 'outline'
                        }
                        onClick={() => setCollectionMode('raw_only')}
                        className="min-h-11 flex-1"
                      >
                        {t('session.rawTLXOnly')}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {startError && (
                <p className="text-sm text-destructive">{startError}</p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={closeDialog}
                  className="min-h-11"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateSessions}
                  disabled={
                    isStarting ||
                    selectedIds.size === 0 ||
                    eligibleParticipants.length === 0
                  }
                  className="min-h-11"
                >
                  {isStarting ? t('common.loading') : t('session.batchCreate')}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            /* Results phase */
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                {batchResults.map((r) => (
                  <div
                    key={r.sessionId}
                    className="flex items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <span className="text-sm font-mono font-medium w-24 shrink-0">
                      {r.participantCode}
                    </span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {window.location.origin}/session/{r.sessionId}/start
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyLink(r.sessionId)}
                      className="shrink-0 h-7 text-xs"
                    >
                      {t('session.copyLink')}
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={copyAll}
                  className="min-h-11"
                >
                  {t('session.copyAll')}
                </Button>
                <Button
                  onClick={() => {
                    router.invalidate()
                    closeDialog()
                  }}
                  className="min-h-11"
                >
                  {t('common.done')}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
