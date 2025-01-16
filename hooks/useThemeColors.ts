"use client"

import { useTheme } from "next-themes"

export function useThemeColors() {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  
  const colors = {
    background: currentTheme === 'dark' ? 'bg-black/95' : 'bg-white/95',
    border: currentTheme === 'dark' ? 'border-white/10' : 'border-black/10',
    hover: currentTheme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-black/5',
    selected: currentTheme === 'dark' ? 'bg-white/5' : 'bg-black/5',
    text: currentTheme === 'dark' ? 'text-white' : 'text-black',
    textMuted: currentTheme === 'dark' ? 'text-white/60' : 'text-black/60',
  }

  return { colors, currentTheme }
} 