export const ZIP_VIEWER_CONFIG = {
  MAX_FILE_SIZE: 500 * 1024 * 1024,
  SUPPORTED_EXTENSIONS: ['.zip'] as const,
  IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'] as const,
} as const 