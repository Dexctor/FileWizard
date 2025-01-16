/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import JSZip from 'jszip'
import { FileIcon, FolderIcon, XCircle, Info, AlertCircle, Upload, Shield, FileSearch, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    }
  }
};

const features = [
  {
    icon: FileSearch,
    title: "Visualisation instantanée",
    description: "Aperçu rapide sans extraction",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20"
  },
  {
    icon: Shield,
    title: "100% sécurisé",
    description: "Traitement local uniquement",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20"
  },
  {
    icon: Upload,
    title: "Glisser-déposer",
    description: "Upload simple et rapide",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20"
  }
];

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
      <div className="container max-w-5xl flex-1 py-12 sm:py-16">
        <motion.main
          className="h-full flex flex-col"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="space-y-8 text-center mb-12">
            {/* Hero Section */}
            <div className="space-y-4">
              <motion.div 
                className="flex items-center justify-center gap-2 mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              >
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "px-4 py-1.5 rounded-full", 
                    "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
                    "border border-blue-500/20",
                    "text-green-500 font-medium",
                    "shadow-sm shadow-blue-500/10",
                    "backdrop-blur-sm"
                  )}
                >
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                  </motion.div>
                  Nouveau
                </Badge>
              </motion.div>

              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-foreground/20 blur-3xl -z-10"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                />
                <motion.h1 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
                  variants={itemVariants}
                >
                  <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Visualiseur ZIP
                  </span>
                </motion.h1>
              </div>

              <motion.p 
                className="text-xl text-muted-foreground max-w-2xl mx-auto"
                variants={itemVariants}
              >
                Explorez le contenu de vos archives ZIP sans les extraire
              </motion.p>
            </div>

            {/* Features Grid */}
            <motion.div 
              className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
              variants={containerVariants}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 300 }
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card 
                    className={`p-4 border ${feature.borderColor} ${feature.bgColor} transition-all`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <motion.div 
                        className={`p-2.5 rounded-xl ${feature.bgColor}`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className={`h-5 w-5 ${feature.color}`} />
                      </motion.div>
                      <div>
                        <h3 className="font-semibold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Upload Zone et Liste des fichiers */}
          <motion.div 
            className="space-y-6"
            variants={itemVariants}
          >
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
          </motion.div>
        </motion.main>
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