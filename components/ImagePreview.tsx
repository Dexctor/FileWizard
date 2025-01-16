'use client';

import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { X, FileIcon, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

interface ImagePreviewProps {
  file: {
    id: string;
    file: File;
    status: 'pending' | 'converting' | 'done' | 'error';
    progress: number;
    originalSize: number;
    convertedSize?: number;
    convertedUrl?: string;
    error?: string;
  };
  onRemove: () => void;
}

export function ImagePreview({ file, onRemove }: ImagePreviewProps) {
  const calculateSizeChange = (originalSize: number, convertedSize: number) => {
    const difference = convertedSize - originalSize;
    const percentage = Math.round((difference / originalSize) * 100);
    const isReduction = difference < 0;

    return {
      percentage: Math.abs(percentage),
      isReduction
    };
  };

  const sizeInfo = file.convertedSize 
    ? calculateSizeChange(file.originalSize, file.convertedSize)
    : null;

  return (
    <div className={cn(
      "group relative flex items-center gap-4 p-4 rounded-xl transition-all",
      "bg-accent/5 hover:bg-accent/10 border border-accent/10",
      file.status === 'error' && "bg-destructive/5 hover:bg-destructive/10 border-destructive/20"
    )}>
      <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-12 rounded-full transition-all">
        <div className={cn(
          "w-full h-full rounded-full",
          file.status === 'done' && "bg-green-500",
          file.status === 'error' && "bg-destructive",
          file.status === 'converting' && "bg-primary animate-pulse"
        )} />
      </div>

      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="relative shrink-0">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            "bg-background border shadow-sm"
          )}>
            <FileIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          {file.status === 'done' && (
            <div className="absolute -right-1 -bottom-1">
              <CheckCircle className="h-4 w-4 text-green-500 fill-green-500" />
            </div>
          )}
          {file.status === 'error' && (
            <div className="absolute -right-1 -bottom-1">
              <AlertCircle className="h-4 w-4 text-destructive fill-destructive" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium truncate" title={file.file.name}>
              {file.file.name}
            </p>
            {file.status === 'done' && sizeInfo?.isReduction && (
              <Badge variant="secondary" className="h-5">
                {sizeInfo.percentage}% plus petit
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">
              {formatFileSize(file.originalSize)}
            </span>
            {file.status === 'done' && file.convertedSize && (
              <>
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(file.convertedSize)}
                </span>
              </>
            )}
          </div>
          
          {file.status === 'converting' && (
            <div className="mt-2">
              <Progress value={file.progress} className="h-1" />
              <p className="text-xs text-muted-foreground mt-1.5">
                Conversion en cours...
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {file.status === 'done' && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0 rounded-lg"
          >
            <a
              href={file.convertedUrl}
              download={file.file.name.replace(/\.[^/.]+$/, '') + '.webp'}
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 