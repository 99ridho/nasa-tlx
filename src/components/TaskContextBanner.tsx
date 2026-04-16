interface TaskContextBannerProps {
  taskLabel: string
}

export function TaskContextBanner({ taskLabel }: TaskContextBannerProps) {
  return (
    <div className="bg-muted border-b px-4 py-2 text-sm text-center">
      <span className="font-medium">Task: </span>
      <span>{taskLabel}</span>
    </div>
  )
}
