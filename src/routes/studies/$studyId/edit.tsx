import { createFileRoute, useNavigate, notFound } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { getStudyById, updateStudy } from '#/server/studies'
import { getSessionsByStudy } from '#/server/sessions'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'

export const Route = createFileRoute('/studies/$studyId/edit')({
  loader: async ({ params }) => {
    const [study, sessions] = await Promise.all([
      getStudyById({ data: { id: params.studyId } }),
      getSessionsByStudy({ data: { studyId: params.studyId } }),
    ])
    if (!study) throw notFound()
    return { study, hasSessions: sessions.length > 0 }
  },
  component: EditStudyComponent,
})

function EditStudyComponent() {
  const { study, hasSessions } = Route.useLoaderData()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState(study.name)
  const [taskLabel, setTaskLabel] = useState(study.taskLabel)
  const [description, setDescription] = useState(study.description ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    try {
      const result = await updateStudy({
        data: {
          id: study.id,
          input: { name, taskLabel, description: description || undefined },
        },
      })

      if (Array.isArray(result)) {
        const fieldErrors: Record<string, string> = {}
        result.forEach((err) => {
          fieldErrors[err.field] = err.message
        })
        setErrors(fieldErrors)
      } else {
        await navigate({ to: '/studies/$studyId', params: { studyId: study.id } })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('study.edit')}</h1>

      {hasSessions && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {t('study.editWarning')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="study-name">{t('study.name')}</Label>
          <Input
            id="study-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('study.namePlaceholder')}
            aria-invalid={!!errors.name}
            className="min-h-[44px]"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="task-label">{t('study.taskLabel')}</Label>
          <Input
            id="task-label"
            value={taskLabel}
            onChange={(e) => setTaskLabel(e.target.value)}
            placeholder={t('study.taskLabelPlaceholder')}
            aria-invalid={!!errors.taskLabel}
            className="min-h-[44px]"
          />
          {errors.taskLabel && (
            <p className="text-sm text-destructive">{errors.taskLabel}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">{t('study.description')}</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('study.descriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate({
                to: '/studies/$studyId',
                params: { studyId: study.id },
              })
            }
            className="min-h-[44px]"
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px]"
          >
            {isSubmitting ? t('common.loading') : t('study.saveChanges')}
          </Button>
        </div>
      </form>
    </main>
  )
}
