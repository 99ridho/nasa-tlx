import { useTranslation } from 'react-i18next'

interface TaskContextBannerProps {
  taskLabel: string
}

export function TaskContextBanner({ taskLabel }: TaskContextBannerProps) {
  const { t } = useTranslation()
  return (
    <div className="bg-muted border-b px-4 py-2 text-sm text-center">
      <span className="font-medium">{t('session.taskLabel')}: </span>
      <span>{taskLabel}</span>
    </div>
  )
}
