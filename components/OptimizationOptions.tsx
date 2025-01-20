"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { FormatSelector } from "@/components/ui/format-selector"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, ImageFormat } from "../app/image-optimizer/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"

interface OptimizationOptionsProps {
  settings: Settings
  onSettingsChange: (settings: Settings) => void
}

type Preset = 'web' | 'print' | 'custom';

const PRESETS: Record<Preset, Partial<Settings>> = {
  web: {
    quality: 80,
    format: 'webp',
    autoResize: true,
    maxWidth: 1920,
    stripMetadata: true,
    optimizeForWeb: true,
  },
  print: {
    quality: 100,
    format: 'png',
    autoResize: false,
    stripMetadata: false,
    optimizeForWeb: false,
  },
  custom: {} // Garde les paramètres actuels
}

export function OptimizationOptions({ settings, onSettingsChange }: OptimizationOptionsProps) {
  const handlePresetSelect = (preset: Preset) => {
    const presetSettings = PRESETS[preset];
    onSettingsChange({
      ...settings,
      ...presetSettings
    })
  }

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardContent className="p-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Options basiques</TabsTrigger>
              <TabsTrigger value="advanced">Options avancées</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Presets de conversion */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handlePresetSelect('web')}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors
                    ${settings.optimizeForWeb ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  Web optimisé
                </button>
                <button
                  onClick={() => handlePresetSelect('print')}
                  className={`p-2 rounded-lg border text-sm font-medium transition-colors
                    ${!settings.optimizeForWeb ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  Haute qualité
                </button>
                <button
                  onClick={() => handlePresetSelect('custom')}
                  className="p-2 rounded-lg border text-sm font-medium hover:bg-accent"
                >
                  Personnalisé
                </button>
              </div>

              {/* Format de sortie */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Label>Format de sortie</Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-sm">WebP est recommandé pour le web</p>
                      <p className="text-sm">PNG pour la haute qualité</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FormatSelector
                  value={(settings.format ?? 'webp') as ImageFormat}
                  onValueChange={(format: string) => onSettingsChange({ ...settings, format: format as ImageFormat })}
                />
              </div>

              {/* Qualité */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Qualité</Label>
                  <span className="text-sm font-medium">{settings.quality ?? 100}%</span>
                </div>
                <Slider
                  value={[settings.quality ?? 100]}
                  onValueChange={([quality]) => onSettingsChange({ ...settings, quality })}
                  min={1}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-6">
              {/* Redimensionnement */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Redimensionnement auto</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Redimensionne automatiquement les images trop grandes
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={settings.autoResize}
                    onCheckedChange={(autoResize) => onSettingsChange({ ...settings, autoResize })}
                  />
                </div>

                {settings.autoResize && (
                  <div className="space-y-4 pl-4 border-l-2">
                    <div className="flex items-center justify-between">
                      <Label>Largeur maximale</Label>
                      <span className="text-sm font-medium">{settings.maxWidth ?? 4000}px</span>
                    </div>
                    <Slider
                      value={[settings.maxWidth ?? 4000]}
                      onValueChange={([maxWidth]) => onSettingsChange({ ...settings, maxWidth })}
                      min={100}
                      max={4000}
                      step={100}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                  </div>
                )}
              </div>

              {/* Options avancées */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Supprimer les métadonnées</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Supprime les informations EXIF et autres métadonnées
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={settings.stripMetadata}
                    onCheckedChange={(stripMetadata) => onSettingsChange({ ...settings, stripMetadata })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label>Optimiser pour le web</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Applique des optimisations supplémentaires pour le web
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    checked={settings.optimizeForWeb}
                    onCheckedChange={(optimizeForWeb) => onSettingsChange({ ...settings, optimizeForWeb })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
} 