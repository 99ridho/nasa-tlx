import { createFileRoute, Link, useNavigate, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getStudyById } from '#/server/studies'
import { getParticipants } from '#/server/participants'
import { getSessionsByStudy, createSession } from '#/server/sessions'
import { getStudyResults } from '#/server/results'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Label } from '#/components/ui/label'
import type { CollectionMode, SessionWithRelations } from '#/types/domain'

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

function SessionStatusBadge({ status }: { status: SessionWithRelations['status'] }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    in_progress: 'secondary',
    abandoned: 'destructive',
  }
  return <Badge variant={variants[status] ?? 'outline'}>{status}</Badge>
}

function SessionsComponent() {
  const { study, sessions, participants, results } = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('')
  const [collectionMode, setCollectionMode] = useState<CollectionMode>('weighted')
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState<string | null>(null)

  async function handleStartSession() {
    if (!selectedParticipantId) {
      setStartError('Please select a participant')
      return
    }
    setIsStarting(true)
    setStartError(null)
    try {
      const session = await createSession({
        data: {
          studyId: study.id,
          participantId: selectedParticipantId,
          collectionMode,
        },
      })

      setDialogOpen(false)
      if (collectionMode === 'weighted') {
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
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to="/studies/$studyId" params={{ studyId: study.id }}>{t('common.back')}</Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('study.sessions')}</h1>
        <Badge variant="secondary" className="ml-auto">{study.name}</Badge>
      </div>

      {results.sessionCount > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('session.complete.weightedTLX')}</p>
            <p className="text-2xl font-bold mt-1">
              {results.meanWeightedTlx !== null
                ? `${results.meanWeightedTlx.toFixed(1)} ± ${(results.sdWeightedTlx ?? 0).toFixed(1)}`
                : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{t('session.complete.rawTLX')}</p>
            <p className="text-2xl font-bold mt-1">
              {results.meanRawTlx.toFixed(1)} ± {results.sdRawTlx.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end mb-4">
        <Button onClick={() => setDialogOpen(true)} className="min-h-[44px]">
          Start New Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No sessions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('participant.code')}</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>{t('session.complete.weightedTLX')}</TableHead>
                <TableHead>{t('session.complete.rawTLX')}</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-mono">{session.participant.participantCode}</TableCell>
                  <TableCell><SessionStatusBadge status={session.status} /></TableCell>
                  <TableCell>
                    <Badge variant="outline">{session.collectionMode}</Badge>
                  </TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {session.completedAt
                      ? new Date(session.completedAt).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm" className="min-h-[44px]">
                      <Link
                        to="/studies/$studyId/sessions/$sessionId"
                        params={{ studyId: study.id, sessionId: session.id }}
                      >
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="participant-select">Participant</Label>
              <Select value={selectedParticipantId} onValueChange={setSelectedParticipantId}>
                <SelectTrigger id="participant-select" className="min-h-[44px]">
                  <SelectValue placeholder="Select participant..." />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.participantCode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Collection Mode</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={collectionMode === 'weighted' ? 'default' : 'outline'}
                  onClick={() => setCollectionMode('weighted')}
                  className="min-h-[44px] flex-1"
                >
                  Weighted TLX
                </Button>
                <Button
                  type="button"
                  variant={collectionMode === 'raw_only' ? 'default' : 'outline'}
                  onClick={() => setCollectionMode('raw_only')}
                  className="min-h-[44px] flex-1"
                >
                  Raw TLX Only
                </Button>
              </div>
            </div>

            {startError && (
              <p className="text-sm text-destructive">{startError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="min-h-[44px]">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleStartSession} disabled={isStarting} className="min-h-[44px]">
              {isStarting ? t('common.loading') : 'Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
