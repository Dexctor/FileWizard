export type ImageFormat = 'webp' | 'png' | 'jpeg' | 'avif';

export interface Settings {
  quality: number;
  format: ImageFormat;
  autoResize: boolean;
  maxWidth: number;
  stripMetadata: boolean;
  optimizeForWeb: boolean;
} 