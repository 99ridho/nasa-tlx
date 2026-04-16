import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getSession } from '#/server/sessions'
import { getSessionScore, completeSession } from '#/server/scores'
import { getSubscaleRatings } from '#/server/ratings'
import { getPairwiseComparisons } from '#/server/pairwise'
import { SUBSCALE_CODES, SUBSCALE_META } from '#/lib/tlx-constants'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
import { Separator } from '#/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { TLXScore, SubscaleCode } from '#/types/domain'

export const Route = createFileRoute('/session/$sessionId/complete')({
  loader: async ({ params }) => {
    const session = await getSession({ data: { id: params.sessionId } })
    if (!session) throw notFound()

    // Attempt to complete the session if it's still in_progress
    let score: TLXScore | null = await getSessionScore({ data: { sessionId: params.sessionId } })

    if (!score && session.status === 'in_progress') {
      try {
        score = await completeSession({ data: { sessionId: params.sessionId } })
      } catch {
        // Already completed or validation error — proceed
      }
    }

    const [ratings, comparisons] = await Promise.all([
      getSubscaleRatings({ data: { sessionId: params.sessionId } }),
      getPairwiseComparisons({ data: { sessionId: params.sessionId } }),
    ])

    return { session, score, ratings, comparisons }
  },
  component: CompleteComponent,
})

function CompleteComponent() {
  const { session, score, ratings, comparisons } = Route.useLoaderData()
  const { t } = useTranslation()
  const [notes, setNotes] = useState(session.notes ?? '')

  // Build lookup maps
  const ratingsBySubscale = Object.fromEntries(
    ratings.map((r) => [r.subscale, r.rawValue])
  ) as Record<SubscaleCode, number>

  const weights: Record<SubscaleCode, number> = score
    ? {
        MD: score.weightMd,
        PD: score.weightPd,
        TD: score.weightTd,
        OP: score.weightOp,
        EF: score.weightEf,
        FR: score.weightFr,
      }
    : { MD: 0, PD: 0, TD: 0, OP: 0, EF: 0, FR: 0 }

  return (
    <main className="px-4 pb-8 pt-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">{t('session.complete.title')}</h1>

      {/* TLX Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {score?.weightedTlx !== null && score?.weightedTlx !== undefined && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('session.complete.weightedTLX')}</p>
              <p className="text-4xl font-bold">{score.weightedTlx.toFixed(1)}</p>
            </CardContent>
          </Card>
        )}
        {score && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground mb-1">{t('session.complete.rawTLX')}</p>
              <p className="text-4xl font-bold">{score.rawTlx.toFixed(1)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator className="my-6" />

      {/* Weight Profile — only for weighted sessions */}
      {session.collectionMode === 'weighted' && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">{t('session.complete.weightProfile')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subscale</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUBSCALE_CODES.map((code) => (
                    <TableRow key={code}>
                      <TableCell>{t(SUBSCALE_META[code].nameKey)}</TableCell>
                      <TableCell className="text-right font-mono">{weights[code]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Subscale Ratings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('session.complete.ratingSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscale</TableHead>
                <TableHead className="text-right">Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SUBSCALE_CODES.map((code) => (
                <TableRow key={code}>
                  <TableCell>{t(SUBSCALE_META[code].nameKey)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {ratingsBySubscale[code] ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Researcher Notes */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('session.complete.notes')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="session-notes" className="sr-only">{t('session.complete.notes')}</Label>
          <Textarea
            id="session-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('session.complete.notesPlaceholder')}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Done button */}
      <Button asChild className="w-full min-h-[44px]">
        <Link
          to="/studies/$studyId/sessions"
          params={{ studyId: session.studyId }}
        >
          {t('session.complete.done')}
        </Link>
      </Button>
    </main>
  )
}
