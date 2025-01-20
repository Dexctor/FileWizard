/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import JSZip from 'jszip';
import { ImagePreview } from './ImagePreview';
import { FormatSelector } from '@/components/ui/format-selector';
import { ImageFormat, Settings } from '@/app/image-optimizer/types';
import { Upload, Image as ImageIcon, Loader2, Trash2, Download } from 'lucide-react';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { toast } from 'sonner';

const SUPPORTED_FORMATS = {
  'image/png': { ext: 'png', label: 'PNG', maxSize: 20 },
  'image/jpeg': { ext: 'jpg', label: 'JPEG', maxSize: 20 },
  'image/webp': { ext: 'webp', label: 'WebP', maxSize: 20 },
  'image/avif': { ext: 'avif', label: 'AVIF', maxSize: 20 },
} as const;

// Taille maximale en MB
const MAX_FILE_SIZE = 20;
const MAX_FILES = 10;

interface ImageFile {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  originalSize: number;
  convertedSize?: number;
  convertedUrl?: string;
  error?: string;
}

interface ImageUploaderProps {
  settings?: Settings
  onSettingsChange?: (settings: Settings) => void
}

export function ImageUploader({ settings, onSettingsChange }: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState<ImageFormat>('webp');
  const [isDragging, setIsDragging] = useState(false);

  const validateFile = useCallback((file: File) => {
    if (!Object.keys(SUPPORTED_FORMATS).includes(file.type)) {
      toast.error(`Format non supporté: ${file.type}`);
      return false;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > MAX_FILE_SIZE) {
      toast.error(`Le fichier ${file.name} dépasse ${MAX_FILE_SIZE}MB`);
      return false;
    }

    return true;
  }, []);

  const handleFiles = useCallback(async (newFiles: File[]) => {
    if (files.length + newFiles.length > MAX_FILES) {
      toast.error(`Maximum ${MAX_FILES} fichiers autorisés`);
      return;
    }

    const validFiles = newFiles.filter(validateFile);
    
    const newImageFiles: ImageFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
      originalSize: file.size,
    }));

    setFiles(prev => [...prev, ...newImageFiles]);
    
    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} fichier(s) ajouté(s)`);
    }
  }, [files.length, validateFile]);

  const convertFile = async (imageFile: ImageFile): Promise<ImageFile> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile.file);
      formData.append('format', outputFormat);
      if (settings) {
        formData.append('settings', JSON.stringify(settings));
      }

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      // Vérification du Content-Type
      const contentType = response.headers.get('Content-Type');
      const expectedContentType = `image/${outputFormat}`;
      
      if (!contentType?.includes(expectedContentType)) {
        throw new Error(`Format de sortie incorrect: ${contentType}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Le fichier converti est vide');
      }

      // Vérification supplémentaire du type MIME du blob
      if (blob.type !== expectedContentType) {
        throw new Error(`Type MIME incorrect: ${blob.type}, attendu: ${expectedContentType}`);
      }

      const url = URL.createObjectURL(blob);

      return {
        ...imageFile,
        status: 'done',
        progress: 100,
        convertedSize: blob.size,
        convertedUrl: url,
      };
    } catch (error) {
      console.error('Erreur de conversion:', error);
      return {
        ...imageFile,
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Erreur de conversion',
      };
    }
  };

  const convertAll = async () => {
    setIsConverting(true);
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      for (const file of pendingFiles) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'converting', progress: 0 } : f
        ));

        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f =>
            f.id === file.id && f.status === 'converting'
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          ));
        }, 200);

        const convertedFile = await convertFile(file);
        clearInterval(progressInterval);

        setFiles(prev => prev.map(f => 
          f.id === file.id ? convertedFile : f
        ));

        if (convertedFile.status === 'done') {
          toast.success(`${file.file.name} converti avec succès`);
        } else {
          toast.error(`Erreur lors de la conversion de ${file.file.name}`);
        }
      }
    } catch (error) {
      toast.error('Erreur lors de la conversion');
    } finally {
      setIsConverting(false);
    }
  };

  const downloadZip = async () => {
    try {
      const zip = new JSZip();
      const convertedFiles = files.filter(f => f.status === 'done' && f.convertedUrl);

      for (const file of convertedFiles) {
        const response = await fetch(file.convertedUrl!);
        const blob = await response.blob();
        
        // Meilleure gestion du nom de fichier
        const originalName = file.file.name;
        const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
        const safeBaseName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeBaseName}.${outputFormat}`;
        
        zip.file(fileName, blob);
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const zipName = `images_converties_${timestamp}.zip`;

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Téléchargement démarré');
    } catch (error) {
      toast.error('Erreur lors de la création du ZIP');
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.convertedUrl) {
        URL.revokeObjectURL(file.convertedUrl);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const clearCompleted = () => {
    setFiles(prev => {
      prev.forEach(f => {
        if (f.convertedUrl) {
          URL.revokeObjectURL(f.convertedUrl);
        }
      });
      return prev.filter(f => f.status !== 'done');
    });
  };

  return (
    <div className="flex flex-col gap-8">
      <Card className="relative overflow-hidden">
        <label 
          className={cn(
            "flex flex-col items-center justify-center w-full min-h-[300px] p-8",
            "border-2 border-dashed rounded-xl cursor-pointer transition-all",
            "bg-background/50 hover:bg-accent/5",
            isDragging && "border-primary bg-primary/5",
            isConverting && "pointer-events-none opacity-50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={async (e) => {
            e.preventDefault();
            setIsDragging(false);
            await handleFiles(Array.from(e.dataTransfer.files));
          }}
        >
          <div className="flex flex-col items-center gap-4 max-w-md text-center">
            <div className={cn(
              "p-4 rounded-full bg-primary/10",
              isDragging && "bg-primary/20"
            )}>
              <Upload 
                className={cn(
                  "w-8 h-8 text-primary/60",
                  isDragging && "text-primary"
                )} 
              />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                Glissez-déposez vos images ici
              </h3>
              <p className="text-sm text-muted-foreground">
                ou cliquez pour sélectionner des fichiers
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {Object.values(SUPPORTED_FORMATS).map(({ ext }) => (
                <span 
                  key={ext}
                  className="px-2 py-1 text-xs font-medium rounded-md bg-accent/10"
                >
                  .{ext}
                </span>
              ))}
            </div>
          </div>

          <input 
            type="file" 
            className="hidden" 
            accept={Object.keys(SUPPORTED_FORMATS).join(',')}
            onChange={(e) => handleFiles(Array.from(e.target.files || []))}
            multiple
            disabled={isConverting}
          />
        </label>
      </Card>

      {files.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-background">
                  <ImageIcon className="w-5 h-5 text-primary/60" />
                </div>
                <div>
                  <h3 className="font-medium">
                    {files.length} image{files.length > 1 ? 's' : ''}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {files.filter(f => f.status === 'done').length} convertie{files.filter(f => f.status === 'done').length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FormatSelector 
                  value={outputFormat}
                  onValueChange={setOutputFormat}
                />
                
                <div className="flex gap-2">
                  {files.some(f => f.status === 'pending') && (
                    <Button
                      onClick={convertAll}
                      disabled={isConverting}
                      className="relative"
                    >
                      {isConverting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      Convertir {files.filter(f => f.status === 'pending').length} fichier(s)
                    </Button>
                  )}
                  
                  {files.some(f => f.status === 'done') && (
                    <>
                      <Button
                        variant="outline"
                        onClick={downloadZip}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Télécharger ZIP
                      </Button>
                      <Button
                        variant="outline"
                        onClick={clearCompleted}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Nettoyer
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[400px] p-4">
            <div className="space-y-2">
              {files.map(file => (
                <ImagePreview
                  key={file.id}
                  file={file}
                  onRemove={() => removeFile(file.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
} 