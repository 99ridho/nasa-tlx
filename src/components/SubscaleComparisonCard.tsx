import { Card, CardContent } from '#/components/ui/card'

interface SubscaleComparisonCardProps {
  name: string
  description: string
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}

export function SubscaleComparisonCard({
  name,
  description,
  isSelected,
  onSelect,
  disabled,
}: SubscaleComparisonCardProps) {
  return (
    <Card
      role="button"
      aria-pressed={isSelected}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onSelect}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={[
        'min-h-[72px] w-full cursor-pointer transition-all select-none',
        'hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isSelected
          ? 'ring-2 ring-primary bg-primary/5 border-primary'
          : 'hover:border-primary/40',
        disabled ? 'pointer-events-none opacity-60' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <CardContent className="flex flex-col justify-center h-full py-4 px-4 min-h-[72px]">
        <p className="font-semibold text-base leading-tight">{name}</p>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
