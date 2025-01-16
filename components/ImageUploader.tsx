/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import JSZip from 'jszip';
import { ImagePreview } from './ImagePreview';
import { FormatSelector } from '@/components/ui/format-selector';
import { Settings } from '@/app/image-optimizer/types';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

const SUPPORTED_FORMATS = {
  'image/png': { ext: 'png', label: 'PNG' },
  'image/jpeg': { ext: 'jpg', label: 'JPEG' },
  'image/webp': { ext: 'webp', label: 'WebP' },
  'image/avif': { ext: 'avif', label: 'AVIF' },
  'image/gif': { ext: 'gif', label: 'GIF' },
  'image/tiff': { ext: 'tiff', label: 'TIFF' },
} as const;

const OUTPUT_FORMATS = [
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
] as const;

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
  const [outputFormat, setOutputFormat] = useState<string>('webp');
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  };

  const handleFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => file.type in SUPPORTED_FORMATS);
    
    const newImageFiles: ImageFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
      originalSize: file.size,
    }));

    setFiles(prev => [...prev, ...newImageFiles]);
  };

  const convertFile = async (imageFile: ImageFile): Promise<ImageFile> => {
    try {
      console.log('Début de la conversion:', imageFile.file.name);
      const formData = new FormData();
      formData.append('image', imageFile.file);
      formData.append('format', outputFormat);
      if (settings) {
        formData.append('settings', JSON.stringify(settings));
      }

      console.log('Format de sortie:', outputFormat);
      console.log('Settings:', settings);

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Réponse erreur:', errorData);
        throw new Error(errorData.error || 'Erreur de conversion');
      }

      const blob = await response.blob();
      console.log('Taille du blob:', blob.size);
      console.log('Type du blob:', blob.type);

      if (blob.size === 0) {
        throw new Error('Le fichier converti est vide');
      }

      // Vérifier que le type MIME correspond au format demandé
      const expectedMimeType = `image/${outputFormat}`;
      if (blob.type !== expectedMimeType) {
        console.error(`Type MIME incorrect: ${blob.type}, attendu: ${expectedMimeType}`);
        throw new Error('Format de sortie incorrect');
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
      console.error('Erreur de conversion détaillée:', error);
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
    
    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'converting', progress: 0 } : f
      ));

      // Simulate progress
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
    }
    setIsConverting(false);
  };

  const downloadZip = async () => {
    const zip = new JSZip();
    const convertedFiles = files.filter(f => f.status === 'done' && f.convertedUrl);

    for (const file of convertedFiles) {
      const response = await fetch(file.convertedUrl!);
      const blob = await response.blob();
      const fileName = `${file.file.name.replace(/\.[^/.]+$/, '')}.${outputFormat}`;
      zip.file(fileName, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted_images.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'done'));
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;
  const completedCount = files.filter(f => f.status === 'done').length;
  const hasCompletedFiles = completedCount > 0;
  const hasPendingFiles = pendingCount > 0;

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
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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
                      {isConverting && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Convertir tout
                    </Button>
                  )}
                  {files.some(f => f.status === 'done') && (
                    <Button
                      variant="outline"
                      onClick={downloadZip}
                    >
                      Télécharger ZIP
                    </Button>
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