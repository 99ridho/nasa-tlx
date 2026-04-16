import { Progress } from '#/components/ui/progress'

interface ProgressIndicatorProps {
  current: number
  total: number
  label?: string
}

export function ProgressIndicator({ current, total, label }: ProgressIndicatorProps) {
  const percentage = (current / total) * 100
  return (
    <div className="w-full space-y-1" aria-live="polite">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{label ?? `${current} of ${total}`}</span>
        <span>{current}/{total}</span>
      </div>
      <Progress value={percentage} className="h-2" aria-label={`Progress: ${current} of ${total}`} />
    </div>
  )
}
