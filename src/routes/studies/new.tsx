import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { createStudy } from '#/server/studies'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import type { ValidationError } from '#/types/domain'

export const Route = createFileRoute('/studies/new')({
  component: NewStudyComponent,
})

function NewStudyComponent() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [taskLabel, setTaskLabel] = useState('')
  const [description, setDescription] = useState('')
  const [createdBy, setCreatedBy] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = t('errors.required')
    if (!taskLabel.trim()) newErrors.taskLabel = t('errors.required')
    if (!createdBy.trim()) newErrors.createdBy = t('errors.required')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createStudy({
        data: {
          name: name.trim(),
          taskLabel: taskLabel.trim(),
          description: description.trim() || undefined,
          createdBy: createdBy.trim(),
        },
      })

      if (Array.isArray(result)) {
        const fieldErrors: Record<string, string> = {}
        for (const err of result as ValidationError[]) {
          fieldErrors[err.field] = err.message
        }
        setErrors(fieldErrors)
      } else {
        await navigate({ to: '/studies/$studyId', params: { studyId: result.id } })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-8 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('study.create')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('study.name')} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('study.namePlaceholder')}
                aria-describedby={errors.name ? 'name-error' : undefined}
                className="min-h-[44px]"
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="taskLabel">{t('study.taskLabel')} *</Label>
              <Input
                id="taskLabel"
                value={taskLabel}
                onChange={(e) => setTaskLabel(e.target.value)}
                placeholder={t('study.taskLabelPlaceholder')}
                aria-describedby={errors.taskLabel ? 'taskLabel-error' : undefined}
                className="min-h-[44px]"
              />
              {errors.taskLabel && (
                <p id="taskLabel-error" className="text-sm text-destructive">{errors.taskLabel}</p>
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

            <div className="space-y-1.5">
              <Label htmlFor="createdBy">{t('study.createdBy')} *</Label>
              <Input
                id="createdBy"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                placeholder={t('study.createdByPlaceholder')}
                aria-describedby={errors.createdBy ? 'createdBy-error' : undefined}
                className="min-h-[44px]"
              />
              {errors.createdBy && (
                <p id="createdBy-error" className="text-sm text-destructive">{errors.createdBy}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">
                {isSubmitting ? t('common.loading') : t('common.save')}
              </Button>
              <Button asChild variant="outline" className="min-h-[44px]">
                <Link to="/studies">{t('common.cancel')}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
