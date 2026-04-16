import { Slider } from '#/components/ui/slider'
import { useState } from 'react'

interface TLXSliderProps {
  value: number | null
  onValueChange: (value: number) => void
  leftLabel: string
  rightLabel: string
  ariaLabel: string
}

export function TLXSlider({ value, onValueChange, leftLabel, rightLabel, ariaLabel }: TLXSliderProps) {
  const [hasInteracted, setHasInteracted] = useState(false)

  function handleChange(values: number[]) {
    setHasInteracted(true)
    onValueChange(values[0])
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Slider
          min={0}
          max={100}
          step={5}
          value={value !== null ? [value] : [50]}
          onValueChange={handleChange}
          className={`min-h-[44px] ${!hasInteracted ? '[&_[role=slider]]:opacity-0' : ''}`}
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value ?? 0}
        />
        {/* No numeric display anywhere — methodological requirement */}
      </div>
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}
