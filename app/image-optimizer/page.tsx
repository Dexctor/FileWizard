"use client"

import { ImageUploader } from '../../components/ImageUploader'
import { OptimizationOptions } from './components/OptimizationOptions'
import { useOptimizationSettings } from './hooks/useOptimizationSettings'

export default function ImageOptimizer() {
  const { settings, updateSettings } = useOptimizationSettings()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container max-w-3xl flex-1 py-6 sm:py-10">
        <div className="space-y-4 text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Optimiseur d&apos;Images Avancé
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Optimisez vos images avec des paramètres avancés
          </p>
        </div>

        <div className="space-y-6">
          <OptimizationOptions 
            settings={settings}
            onSettingsChange={updateSettings}
          />
          <ImageUploader settings={settings} onSettingsChange={updateSettings} />
        </div>
      </div>
    </div>
  )
} 