import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getSession } from '#/server/sessions'
import { getPairwiseComparisons } from '#/server/pairwise'
import { getSubscaleRatings } from '#/server/ratings'
import { getSessionScore } from '#/server/scores'
import { SUBSCALE_META, SUBSCALE_CODES } from '#/lib/tlx-constants'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Separator } from '#/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { SubscaleCode } from '#/types/domain'

export const Route = createFileRoute('/studies/$studyId/sessions/$sessionId')({
  loader: async ({ params }) => {
    const [session, comparisons, ratings, score] = await Promise.all([
      getSession({ data: { id: params.sessionId } }),
      getPairwiseComparisons({ data: { sessionId: params.sessionId } }),
      getSubscaleRatings({ data: { sessionId: params.sessionId } }),
      getSessionScore({ data: { sessionId: params.sessionId } }),
    ])

    if (!session) throw notFound()

    return { session, comparisons, ratings, score }
  },
  component: SessionDetailComponent,
})

function SessionDetailComponent() {
  const { session, comparisons, ratings, score } = Route.useLoaderData()
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const startUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/session/${session.id}/start`
      : null

  function copyUrl() {
    if (!startUrl) return
    navigator.clipboard.writeText(startUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

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
    <main className="page-wrap px-4 pb-8 pt-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button asChild variant="outline" className="min-h-[44px]">
          <Link
            to="/studies/$studyId/sessions"
            params={{ studyId: session.studyId }}
          >
            {t('common.back')}
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{t('session.detail')}</h1>
      </div>

      {/* Session Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('session.information')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">{t('participant.code')}</p>
            <p className="font-mono text-muted-foreground">
              {session.participant.participantCode}
            </p>
          </div>
          <div>
            <p className="font-medium">{t('common.status')}</p>
            <Badge>{session.status}</Badge>
          </div>
          <div>
            <p className="font-medium">{t('study.taskLabel')}</p>
            <p className="text-muted-foreground">{session.taskLabel}</p>
          </div>
          <div>
            <p className="font-medium">{t('common.mode')}</p>
            <Badge variant="outline">{session.collectionMode}</Badge>
          </div>
          <div>
            <p className="font-medium">{t('session.started')}</p>
            <p className="text-muted-foreground">
              {new Date(session.startedAt).toLocaleString()}
            </p>
          </div>
          {session.completedAt && (
            <div>
              <p className="font-medium">{t('common.completed')}</p>
              <p className="text-muted-foreground">
                {new Date(session.completedAt).toLocaleString()}
              </p>
            </div>
          )}
          {session.status === 'in_progress' && startUrl && (
            <div className="col-span-2">
              <p className="font-medium mb-1">{t('session.participantLink')}</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-muted-foreground truncate flex-1">
                  {startUrl}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyUrl}
                  className="shrink-0"
                >
                  {copied ? t('session.copied') : t('session.copyLink')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scores */}
      {score && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t('session.tlxScores')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {score.weightedTlx !== null && (
              <div className="text-center p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">
                  {t('session.complete.weightedTLX')}
                </p>
                <p className="text-3xl font-bold mt-1">
                  {score.weightedTlx.toFixed(1)}
                </p>
              </div>
            )}
            <div className="text-center p-4 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                {t('session.complete.rawTLX')}
              </p>
              <p className="text-3xl font-bold mt-1">
                {score.rawTlx.toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Weight Profile */}
        {session.collectionMode === 'weighted' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('session.complete.weightProfile')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.subscale')}</TableHead>
                    <TableHead className="text-right">{t('common.weight')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SUBSCALE_CODES.map((code) => (
                    <TableRow key={code}>
                      <TableCell>{t(SUBSCALE_META[code].nameKey)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {weights[code]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Ratings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('session.complete.ratingSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.subscale')}</TableHead>
                  <TableHead className="text-right">{t('common.rating')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratings.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {t(SUBSCALE_META[r.subscale].nameKey)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {r.rawValue}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Pairwise Comparisons */}
      {comparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('session.phaseAHeading')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.number')}</TableHead>
                    <TableHead>{t('common.subscaleA')}</TableHead>
                    <TableHead>{t('common.subscaleB')}</TableHead>
                    <TableHead>{t('common.selected')}</TableHead>
                    <TableHead>{t('common.time')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisons.map((c, i) => (
                    <TableRow key={c.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        {t(SUBSCALE_META[c.subscaleA].nameKey)}
                      </TableCell>
                      <TableCell>
                        {t(SUBSCALE_META[c.subscaleB].nameKey)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            c.selected === c.subscaleA ? 'default' : 'secondary'
                          }
                        >
                          {t(SUBSCALE_META[c.selected].nameKey)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(c.respondedAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
