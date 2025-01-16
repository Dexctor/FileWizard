/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, ZoomIn, ZoomOut, Download, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { VisuallyHidden } from "@/components/ui/dialog"

interface ImagePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string | null
  fileName: string
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  fileName,
}) => {
  const [isLoading, setIsLoading] = React.useState(true)
  const [isZoomed, setIsZoomed] = React.useState(false)
  const [rotation, setRotation] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const imageRef = React.useRef<HTMLImageElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      setRotation(0)
      setError(null)
      setIsZoomed(false)
    }
  }, [isOpen])

  const handleDownload = async () => {
    if (!imageUrl) return
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      link.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError("Erreur lors du téléchargement")
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleImageZoom = React.useCallback((event: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    imageRef.current.style.transformOrigin = `${(x / rect.width) * 100}% ${(y / rect.height) * 100}%`
    setIsZoomed(true)
  }, [])

  const handleButtonZoom = React.useCallback(() => {
    if (!imageRef.current) return
    imageRef.current.style.transformOrigin = '50% 50%'
    setIsZoomed(!isZoomed)
  }, [isZoomed])

  const ActionButton = ({ onClick, icon: Icon, label, disabled = false }: {
    onClick: () => void
    icon: React.ElementType
    label: string
    disabled?: boolean
  }) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              "h-8 w-8 rounded-full",
              "bg-background/80 hover:bg-background/90",
              "backdrop-blur-sm",
              "transition-all duration-200",
              "active:scale-95"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="text-xs bg-background/80 backdrop-blur-sm"
        >
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className={cn(
            "fixed inset-0 z-50",
            "bg-background/95 backdrop-blur-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-200"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed inset-4 z-50",
            "flex flex-col",
            "bg-transparent",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200",
            "sm:inset-8"
          )}
        >
          <DialogPrimitive.Title asChild>
            <VisuallyHidden>
              {`Aperçu de l'image : ${fileName}`}
            </VisuallyHidden>
          </DialogPrimitive.Title>

          {/* Actions flottantes */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            <ActionButton
              onClick={handleRotate}
              icon={RotateCw}
              label="Rotation"
              disabled={isLoading || !!error}
            />
            <ActionButton
              onClick={handleButtonZoom}
              icon={isZoomed ? ZoomOut : ZoomIn}
              label={isZoomed ? "Réduire" : "Agrandir"}
              disabled={isLoading || !!error}
            />
            <ActionButton
              onClick={handleDownload}
              icon={Download}
              label="Télécharger"
              disabled={isLoading || !!error}
            />
            <ActionButton
              onClick={onClose}
              icon={X}
              label="Fermer"
            />
          </div>

          {/* Conteneur de l'image */}
          <div className="flex-1 flex items-center justify-center">
            {error ? (
              <div className="text-center text-muted-foreground">
                <p>{error}</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setError(null)}
                >
                  Réessayer
                </Button>
              </div>
            ) : imageUrl ? (
              <div 
                className={cn(
                  "relative max-w-full max-h-full",
                  "transition-opacity duration-200",
                  isLoading && "opacity-0"
                )}
              >
                <img
                  ref={imageRef}
                  src={imageUrl}
                  alt={fileName}
                  className={cn(
                    "max-w-full max-h-[calc(100vh-4rem)]",
                    "object-contain rounded-lg",
                    "transition-all duration-300 ease-out",
                    isZoomed && "scale-[2]",
                    "cursor-zoom-in",
                    isZoomed && "cursor-zoom-out"
                  )}
                  style={{
                    transform: `rotate(${rotation}deg)${isZoomed ? ' scale(2)' : ''}`,
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setError("Impossible de charger l'image")
                    setIsLoading(false)
                  }}
                  onClick={handleImageZoom}
                  draggable={false}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Aucune image à afficher</p>
              </div>
            )}
          </div>

          {/* Nom du fichier en bas */}
          {imageUrl && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <div className="px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm">
                <p className="text-sm font-medium text-foreground/75">
                  {fileName}
                </p>
              </div>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { ImagePreviewModal }
