/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-expressions */
"use client"

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileIcon, FolderIcon, Sparkles, XCircle, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import JSZip from 'jszip'
import type { ZipEntry, ErrorState } from '@/lib/types/zip-viewer'
import { ZIP_VIEWER_CONFIG } from '@/lib/constants/zip-viewer'

// Constantes pour la gestion des fichiers
const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB par chunk
const MAX_PREVIEW_SIZE = 10 * 1024 * 1024 // 10MB pour la prévisualisation

// Types
interface ZipViewerContextType {
  entries: ZipEntry[]
  error: ErrorState | null
  progress: { loaded: number; total: number; percent: number } | null
  stats: { files: number; directories: number; totalSize: number } | null
  handleFileUpload: (file: File) => Promise<void>
  loadFileContent: (entry: ZipEntry) => Promise<string | ArrayBuffer | null>
}

// Context
const ZipViewerContext = createContext<ZipViewerContextType | null>(null)

// Hook
export const useZipViewer = () => {
  const context = useContext(ZipViewerContext)
  if (!context) throw new Error('useZipViewer must be used within ZipViewerProvider')
  return context
}

// Provider Component
export function ZipViewerProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ZipEntry[]>([])
  const [error, setError] = useState<ErrorState | null>(null)
  const [progress, setProgress] = useState<ZipViewerContextType['progress']>(null)
  const [stats, setStats] = useState<ZipViewerContextType['stats']>(null)
  const loadFileContent = useCallback(async (entry: ZipEntry) => {
    if (!entry.url || (entry.size && entry.size > MAX_PREVIEW_SIZE)) {
      setError({
        type: 'size',
        message: `Le fichier est trop volumineux pour la prévisualisation (max: ${formatFileSize(MAX_PREVIEW_SIZE)})`
      })
      return null
    }
    
    try {
      const response = await fetch(entry.url)
      return await response.arrayBuffer()
    } catch (err) {
      setError({
        type: 'unknown',
        message: 'Erreur lors du chargement du fichier'
      })
      return null
    }
  }, [setError])

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setError({ 
        type: 'format', 
        message: 'Le fichier doit être au format ZIP' 
      })
      return
    }

    if (file.size > ZIP_VIEWER_CONFIG.MAX_FILE_SIZE) {
      setError({ 
        type: 'size', 
        message: `Fichier trop volumineux (max: ${formatFileSize(ZIP_VIEWER_CONFIG.MAX_FILE_SIZE)})` 
      })
      return
    }

    try {
      setError(null)
      setProgress({ loaded: 0, total: file.size, percent: 0 })
      
      const zip = new JSZip()
      
      // Chargement progressif
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader()
        const chunks: Uint8Array[] = []
        let offset = 0
        
        reader.onload = async (e) => {
          if (e.target?.result instanceof ArrayBuffer) {
            chunks.push(new Uint8Array(e.target.result))
            offset += CHUNK_SIZE
            
            setProgress({
              loaded: offset,
              total: file.size,
              percent: (offset / file.size) * 100
            })

            if (offset < file.size) {
              readNextChunk()
            } else {
              const fullBuffer = new Uint8Array(file.size)
              let position = 0
              chunks.forEach(chunk => {
                fullBuffer.set(chunk, position)
                position += chunk.length
              })
              
              try {
                await zip.loadAsync(fullBuffer)
                resolve()
              } catch (err) {
                reject(err)
              }
            }
          }
        }

        reader.onerror = reject

        function readNextChunk() {
          const slice = file.slice(offset, offset + CHUNK_SIZE)
          reader.readAsArrayBuffer(slice)
        }

        readNextChunk()
      })

      const zipEntries: ZipEntry[] = []
      let totalSize = 0, fileCount = 0, dirCount = 0

      for (const [, entry] of Object.entries(zip.files)) {
        if (!entry.name.startsWith('__MACOSX')) {
          const isDirectory = entry.dir
          const blob = isDirectory ? undefined : await entry.async('blob')
          
          isDirectory ? dirCount++ : fileCount++
          totalSize += blob?.size || 0

          zipEntries.push({
            name: entry.name.split('/').pop() || entry.name,
            path: entry.name,
            type: isDirectory ? 'directory' : 'file',
            size: blob?.size,
            url: blob ? URL.createObjectURL(blob) : undefined
          })
        }
      }

      setEntries(zipEntries.sort((a, b) => 
        a.type === b.type ? a.name.localeCompare(b.name) : (a.type === 'directory' ? -1 : 1)
      ))

      setStats({ files: fileCount, directories: dirCount, totalSize })
      setProgress(null)
    } catch (err) {
      console.error('Erreur ZIP:', err)
      setError({
        type: 'unknown',
        message: 'Une erreur est survenue lors de la lecture du fichier'
      })
    } finally {
      setProgress(null)
    }
  }, [])

  const value = useMemo(() => ({
    entries, error, progress, stats, handleFileUpload, loadFileContent
  }), [entries, error, progress, stats, handleFileUpload, loadFileContent])

  return (
    <ZipViewerContext.Provider value={value}>
      {children}
    </ZipViewerContext.Provider>
  )
}

// Composants UI
function Header() {
  return (
    <div className="space-y-8 text-center mb-12">
      <motion.h1 
        className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          Visualiseur ZIP
        </span>
      </motion.h1>
      <motion.div 
        className="flex items-center justify-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Badge variant="secondary" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Nouveau
        </Badge>
      </motion.div>
    </div>
  )
}

function Upload() {
  const { progress, handleFileUpload } = useZipViewer()
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  return (
    <label 
      className={cn(
        "flex flex-col items-center justify-center w-full h-32",
        "border-2 border-dashed rounded-lg cursor-pointer",
        "bg-background transition-all duration-200",
        isDragging ? "border-primary scale-102 bg-primary/5" : "hover:bg-accent/10",
      )}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
      onDrop={handleDrop}
    >
      {progress ? (
        <div className="w-full px-8 space-y-2">
          <Progress value={progress.percent} />
          <p className="text-xs text-center text-muted-foreground">
            Chargement... {Math.round(progress.percent)}%
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
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFileUpload(file)
        }}
      />
    </label>
  )
}

// Export du composant principal
export function ZipViewer() {
  const { entries, error, stats } = useZipViewer()

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="container max-w-5xl flex-1 py-12 sm:py-16">
        <Header />
        <div className="space-y-6">
          <Upload />
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
              <p className="font-medium">{error.message}</p>
            </div>
          )}
          {stats && (
            <div className="flex gap-4 justify-center">
              <Badge variant="secondary">
                {stats.files} fichier{stats.files > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {stats.directories} dossier{stats.directories > 1 ? 's' : ''}
              </Badge>
              <Badge variant="secondary">
                {formatFileSize(stats.totalSize)}
              </Badge>
            </div>
          )}
          {entries.length > 0 && <FileList entries={entries} />}
        </div>
      </div>
    </div>
  )
}

// Composant FileList
function FileList({ entries }: { entries: ZipEntry[] }) {
  return (
    <div className="border rounded-lg divide-y">
      {entries.map((entry, index) => (
        <FileListItem key={entry.path} entry={entry} index={index} />
      ))}
    </div>
  )
}

// Composant FileListItem
function FileListItem({ entry, index }: { entry: ZipEntry, index: number }) {
  const { loadFileContent } = useZipViewer()
  const [isLoading, setIsLoading] = useState(false)

  const handleView = async () => {
    if (!entry.url) return
    
    if (entry.size && entry.size > MAX_PREVIEW_SIZE) {
      // Téléchargement direct pour les gros fichiers
      window.open(entry.url, '_blank')
    } else {
      // Prévisualisation pour les petits fichiers
      setIsLoading(true)
      try {
        await loadFileContent(entry)
        window.open(entry.url, '_blank')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const isImageFile = (filename: string) => 
    ZIP_VIEWER_CONFIG.IMAGE_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext))

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3",
        "hover:bg-accent/5 transition-all",
        "animate-fadeIn"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
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
      {entry.size && (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(entry.size)}
        </span>
      )}
      {entry.type === 'file' && entry.url && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2"
          onClick={handleView}
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : 'Voir'}
        </Button>
      )}
    </div>
  )
}

// Utilitaire de formatage
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`
} 