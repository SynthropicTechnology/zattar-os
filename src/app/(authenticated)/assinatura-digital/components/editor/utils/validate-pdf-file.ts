/**
 * PDF File Validation Utility
 *
 * Validates PDF files for upload in the template editor.
 */

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_FILE_SIZE = 10 * 1024; // 10KB

/**
 * Validates a file for PDF template upload
 * Checks MIME type, file extension, and size constraints
 */
export function validatePdfFile(file: File): ValidationResult {
  // Accept PDFs with empty MIME type or application/octet-stream (some browsers/OSes)
  const isPdfByExtension = file.name.toLowerCase().endsWith('.pdf');
  const isPdfByMimeType = file.type === 'application/pdf';
  const isGenericType = file.type === '' || file.type === 'application/octet-stream';

  if (!isPdfByMimeType && !(isPdfByExtension && isGenericType)) {
    return { isValid: false, error: 'Apenas arquivos PDF são aceitos' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'Arquivo muito grande. Máximo 10MB' };
  }

  if (file.size < MIN_FILE_SIZE) {
    return { isValid: false, error: 'Arquivo muito pequeno. Mínimo 10KB' };
  }

  return { isValid: true };
}

/**
 * Formats file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
