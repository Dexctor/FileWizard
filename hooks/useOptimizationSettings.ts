"use client"

import { useState } from 'react'
import { Settings } from '../app/image-optimizer/types'

const defaultSettings: Settings = {
  format: 'webp',
  quality: 85,
  autoResize: true,
  maxWidth: 2000,
  stripMetadata: true,
}

export function useOptimizationSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings)
  }

  return { settings, updateSettings }
} 