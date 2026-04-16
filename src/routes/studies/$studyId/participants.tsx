import {
  createFileRoute,
  Link,
  useRouter,
  notFound,
} from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import {
  getParticipants,
  addParticipant,
  deleteParticipant,
} from '#/server/participants'
import { getStudyById } from '#/server/studies'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Badge } from '#/components/ui/badge'
import type { Participant } from '#/types/domain'

export const Route = createFileRoute('/studies/$studyId/participants')({
  loader: async ({ params }) => {
    const [study, participants] = await Promise.all([
      getStudyById({ data: { id: params.studyId } }),
      getParticipants({ data: { studyId: params.studyId } }),
    ])
    if (!study) throw notFound()
    return { study, participants }
  },
  component: ParticipantsComponent,
})

function ParticipantsComponent() {
  const { study, participants: initialParticipants } = Route.useLoaderData()
  const { t } = useTranslation()
  const router = useRouter()

  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants)
  const [newCode, setNewCode] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newCode.trim()) {
      setAddError(t('errors.required'))
      return
    }
    setIsAdding(true)
    setAddError(null)
    try {
      const result = await addParticipant({
        data: { studyId: study.id, participantCode: newCode.trim() },
      })
      if ('type' in result && result.type === 'conflict') {
        setAddError(t('errors.duplicate'))
      } else {
        setParticipants((prev) => [...prev, result as Participant])
        setNewCode('')
        router.invalidate()
      }
    } finally {
      setIsAdding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('participant.deleteConfirm'))) return
    setDeletingId(id)
    try {
      await deleteParticipant({ data: { id } })
      setParticipants((prev) => prev.filter((p) => p.id !== id))
      router.invalidate()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link to="/studies/$studyId" params={{ studyId: study.id }}>
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('study.participants')}</h1>
        <Badge variant="secondary" className="ml-auto">
          {study.name}
        </Badge>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6" noValidate>
        <div className="flex-1 space-y-1">
          <Label htmlFor="participant-code" className="sr-only">
            {t('participant.code')}
          </Label>
          <Input
            id="participant-code"
            value={newCode}
            onChange={(e) => {
              setNewCode(e.target.value)
              setAddError(null)
            }}
            placeholder={t('participant.codePlaceholder')}
            aria-describedby={addError ? 'add-error' : undefined}
            className="min-h-[44px]"
          />
          {addError && (
            <p id="add-error" className="text-sm text-destructive">
              {addError}
            </p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isAdding}
          className="min-h-[44px] self-start"
        >
          {isAdding ? t('common.loading') : t('participant.add')}
        </Button>
      </form>

      {participants.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {t('participant.noParticipants')}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('participant.code')}</TableHead>
              <TableHead>Added</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono">{p.participantCode}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(p.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    aria-label={`${t('common.delete')} ${p.participantCode}`}
                  >
                    {t('common.delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </main>
  )
}
