export interface ZipEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  url?: string
}

export interface ErrorState {
  type: 'size' | 'format' | 'corrupt' | 'empty' | 'unknown'
  message: string
}

export interface ZipViewerContextType {
  entries: ZipEntry[]
  error: ErrorState | null
  progress: {
    loaded: number
    total: number
    percent: number
  } | null
  stats: {
    files: number
    directories: number
    totalSize: number
  } | null
  setEntries: (entries: ZipEntry[]) => void
  setError: (error: ErrorState | null) => void
  setProgress: (progress: { loaded: number; total: number; percent: number } | null) => void
  setStats: (stats: { files: number; directories: number; totalSize: number } | null) => void
}