/**
 * PDF Helpers
 *
 * Utility functions for PDF handling in the editor.
 * Re-exports and extends PDF-related utilities.
 */

export { validatePdfFile, formatFileSize } from './validate-pdf-file';

/**
 * Standard PDF canvas dimensions based on A4 at 72 DPI
 */
export const PDF_DIMENSIONS = {
  A4: {
    width: 595,
    height: 842,
  },
  LETTER: {
    width: 612,
    height: 792,
  },
} as const;

/**
 * Maximum PDF file size in bytes (10 MB)
 */
export const MAX_PDF_SIZE = 10 * 1024 * 1024;

/**
 * Allowed PDF MIME types
 */
export const ALLOWED_PDF_TYPES = ['application/pdf'];

/**
 * Creates a blob URL from a PDF file
 * Returns null if the file is not a valid PDF
 */
export function createPdfBlobUrl(file: File): string | null {
  if (!ALLOWED_PDF_TYPES.includes(file.type)) {
    return null;
  }

  return URL.createObjectURL(file);
}

/**
 * Revokes a blob URL to free memory
 */
export function revokePdfBlobUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Checks if a URL is a blob URL
 */
export function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:');
}

/**
 * Checks if a URL is an API preview URL
 */
export function isPreviewUrl(url: string): boolean {
  return url.includes('/api/assinatura-digital/templates/') && url.includes('/preview');
}

/**
 * Builds a preview URL for a template
 */
export function buildPreviewUrl(templateId: number | string, bustCache = false): string {
  const url = `/api/assinatura-digital/templates/${templateId}/preview`;
  return bustCache ? `${url}?t=${Date.now()}` : url;
}
