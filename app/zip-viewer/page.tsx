/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import JSZip from 'jszip'
import { FileIcon, FolderIcon, XCircle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'

interface ZipEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  url?: string
}

interface ErrorState {
  type: 'size' | 'format' | 'corrupt' | 'empty' | 'unknown'
  message: string
}

interface ProgressState {
  loaded: number
  total: number
}

const FEATURES_LIST = [
  { text: "Visualisation instantanée sans extraction" },
  { text: "Affichage de la taille des fichiers" },
  { text: "Support des dossiers et sous-dossiers" },
  { text: "Taille maximale : 100 MB" },
] as const

const SUPPORTED_EXTENSIONS = [
  ".zip"
] as const

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'] as const

const isImageFile = (filename: string): boolean => {
  return IMAGE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))
}

export default function ZipViewer() {
  const [entries, setEntries] = useState<ZipEntry[]>([])
  const [error, setError] = useState<ErrorState | null>(null)
  const [progress, setProgress] = useState<ProgressState | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewImage, setPreviewImage] = useState<{
    url: string
    name: string
  } | null>(null)
  
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  // Nettoyer les ressources quand le composant est démonté
  useEffect(() => {
    return () => {
      // Libérer les URLs des fichiers précédents
      entries.forEach(entry => {
        if (entry.url) {
          URL.revokeObjectURL(entry.url)
        }
      })
    }
  }, [entries])

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Nettoyer les URLs existantes
    entries.forEach(entry => {
      if (entry.url) {
        URL.revokeObjectURL(entry.url)
      }
    })
    
    // Réinitialiser l'état
    setEntries([])
    setError(null)

    // Vérifications de base
    if (!file.name.endsWith('.zip')) {
      setError({
        type: 'format',
        message: 'Le fichier doit être au format ZIP'
      })
      event.target.value = ''
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setError({
        type: 'size',
        message: `La taille du fichier ne doit pas dépasser ${formatFileSize(MAX_FILE_SIZE)}`
      })
      event.target.value = ''
      return
    }

    try {
      const zip = new JSZip()
      
      // Créer une fonction de progression séparée
      const updateProgress = (metadata: { loaded: number; total: number }) => {
        setProgress({
          loaded: metadata.loaded,
          total: metadata.total
        })
      }
      
      // Utiliser loadAsync avec les options supportées et gérer la progression
      const zipFile = await zip.loadAsync(file, {
        createFolders: true,
        checkCRC32: true
      })
      
      // Vérifier si le fichier est vide
      if (Object.keys(zipFile.files).length === 0) {
        setError({
          type: 'empty',
          message: 'Le fichier ZIP est vide'
        })
        event.target.value = ''
        return
      }
      
      const zipEntries: ZipEntry[] = []
      
      try {
        // Typer correctement l'entrée du zip
        for (const [path, entry] of Object.entries(zipFile.files)) {
          // Vérifier que entry est bien un objet JSZip.JSZipObject
          if (entry && !entry.name.startsWith('__MACOSX')) {
            const isDirectory = entry.dir
            const blob = isDirectory ? undefined : await entry.async('blob')
            
            zipEntries.push({
              name: entry.name.split('/').pop() || entry.name,
              path: entry.name,
              type: isDirectory ? 'directory' : 'file',
              size: blob?.size,
              url: blob ? URL.createObjectURL(blob) : undefined
            })
          }
        }
      } catch (err) {
        setError({
          type: 'corrupt',
          message: 'Le fichier ZIP semble être corrompu ou mal formaté'
        })
        throw err
      }

      setEntries(zipEntries.sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name)
        return a.type === 'directory' ? -1 : 1
      }))
    } catch (err) {
      console.error('Erreur ZIP:', err)
      setError({
        type: 'unknown',
        message: 'Une erreur est survenue lors de la lecture du fichier'
      })
    } finally {
      setProgress(null)
    }

    event.target.value = ''
  }, [MAX_FILE_SIZE, entries])

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return ''
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  // Optimisation du drag & drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      const fakeEvent = { target: { files: [file], value: '' } } as any
      handleFileUpload(fakeEvent)
    }
  }, [handleFileUpload])

  // Ajout des statistiques mémorisées
  const stats = useMemo(() => {
    if (!entries.length) return null
    return {
      totalFiles: entries.filter(e => e.type === 'file').length,
      totalFolders: entries.filter(e => e.type === 'directory').length,
      totalSize: entries.reduce((acc, curr) => acc + (curr.size || 0), 0)
    }
  }, [entries])

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container max-w-3xl flex-1 py-6 sm:py-10">
        <div className="space-y-6 text-center mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Visualiseur de ZIP
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto mt-2">
              Visualisez le contenu de vos fichiers ZIP sans les extraire
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-start max-w-2xl mx-auto">
            <div className="flex-1 space-y-2 text-left">
              <h2 className="text-sm font-semibold">Fonctionnalités</h2>
              <ul className="space-y-2">
                {FEATURES_LIST.map(({ text }, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex-1 space-y-2 text-left">
              <h2 className="text-sm font-semibold">Limitations</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Extensions supportées : {SUPPORTED_EXTENSIONS.join(', ')}
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Pas d'extraction de fichiers individuels
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Pas de prévisualisation du contenu
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <label 
            className={cn(
              "flex flex-col items-center justify-center w-full h-32",
              "border-2 border-dashed rounded-lg cursor-pointer",
              "bg-background transition-all duration-200",
              isDragging ? "border-primary scale-102 bg-primary/5" : "hover:bg-accent/10",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {progress ? (
              <div className="w-full px-8 space-y-2">
                <Progress value={(progress.loaded / progress.total) * 100} />
                <p className="text-xs text-center text-muted-foreground">
                  Chargement... {Math.round((progress.loaded / progress.total) * 100)}%
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FolderIcon className="w-8 h-8 mb-3 text-foreground/60" />
                <p className="mb-2 text-sm text-foreground/60">
                  <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
                </p>
                <p className="text-xs text-foreground/60">Fichiers ZIP uniquement</p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept=".zip"
              onChange={handleFileUpload}
            />
          </label>

          {error && (
            <div className={cn(
              "p-4 rounded-lg text-sm flex items-start gap-3",
              {
                'bg-destructive/10 text-destructive': error.type === 'corrupt' || error.type === 'unknown',
                'bg-yellow-500/10 text-yellow-700': error.type === 'format' || error.type === 'size',
                'bg-blue-500/10 text-blue-700': error.type === 'empty',
              }
            )}>
              <div className="shrink-0 mt-0.5">
                {error.type === 'corrupt' || error.type === 'unknown' ? (
                  <XCircle className="h-5 w-5" />
                ) : error.type === 'empty' ? (
                  <Info className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {error.type === 'corrupt' && "Fichier corrompu"}
                  {error.type === 'format' && "Format non supporté"}
                  {error.type === 'size' && "Fichier trop volumineux"}
                  {error.type === 'empty' && "Fichier vide"}
                  {error.type === 'unknown' && "Erreur inattendue"}
                </p>
                <p className="text-sm mt-1 opacity-90">{error.message}</p>
              </div>
            </div>
          )}

          {/* Affichage des statistiques */}
          {stats && (
            <div className="flex gap-4 justify-center">
              <Badge variant="secondary">
                {stats.totalFiles} fichier{stats.totalFiles > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {stats.totalFolders} dossier{stats.totalFolders > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {formatFileSize(stats.totalSize)}
              </Badge>
            </div>
          )}

          {/* Liste des fichiers avec animation */}
          {entries.length > 0 && (
            <div className="border rounded-lg divide-y">
              {entries.map((entry, index) => (
                <div
                  key={entry.path}
                  className={cn(
                    "flex items-center gap-3 p-3",
                    "hover:bg-accent/5 transition-all",
                    "animate-fadeIn"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {entry.type === 'directory' ? (
                    <FolderIcon className="h-4 w-4 text-blue-500" />
                  ) : isImageFile(entry.name) ? (
                    <img 
                      src={entry.url} 
                      alt="thumbnail"
                      className="h-4 w-4 object-cover rounded"
                    />
                  ) : (
                    <FileIcon className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" title={entry.name}>
                      {entry.name}
                    </p>
                  </div>
                  {entry.size !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(entry.size)}
                    </span>
                  )}
                  {entry.type === 'file' && entry.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        if (isImageFile(entry.name) && entry.url) {
                          setPreviewImage({
                            url: entry.url,
                            name: entry.name
                          })
                        } else {
                          window.open(entry.url, '_blank')
                        }
                      }}
                    >
                      {isImageFile(entry.name) ? 'Aperçu' : 'Voir'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ImagePreviewModal
        isOpen={previewImage !== null}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        fileName={previewImage?.name || ''}
      />
    </div>
  )
} 