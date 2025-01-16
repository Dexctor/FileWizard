"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useThemeColors } from "@/hooks/useThemeColors"

const formats = [
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
] as const

interface FormatSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function FormatSelector({ value, onValueChange }: FormatSelectorProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const { colors } = useThemeColors()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn(
        "flex h-9 w-[120px] items-center justify-between rounded-md border px-3",
        "bg-background text-sm"
      )}>
        <span>Format</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>
    )
  }

  const currentFormat = formats.find(f => f.value === value) || formats[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-[120px] items-center justify-between rounded-md border px-3",
          colors.border,
          colors.background,
          colors.hover,
          "focus:outline-none focus:ring-1",
          "text-sm transition-colors"
        )}
      >
        <span>{currentFormat.label}</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
          />
          <div className={cn(
            "absolute top-[calc(100%+4px)] left-0 z-50",
            "w-[120px] rounded-md border",
            colors.border,
            colors.background,
            "py-1 backdrop-blur-sm"
          )}>
            {formats.map(format => (
              <button
                key={format.value}
                type="button"
                onClick={() => {
                  onValueChange(format.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "flex w-full items-center px-3 py-1.5 text-sm",
                  colors.hover,
                  "transition-colors",
                  value === format.value && colors.selected
                )}
              >
                {format.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 