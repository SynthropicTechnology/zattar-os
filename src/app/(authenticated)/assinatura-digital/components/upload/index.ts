/**
 * Componentes de Upload de Documentos para Assinatura Digital
 *
 * Este módulo exporta componentes para upload de documentos com suporte
 * a drag & drop, validação de tipos e tamanhos, e integração com Supabase Storage.
 */

// Componente principal
export { DocumentUploadDropzone } from './document-upload-dropzone';

// Subcomponentes (para uso avançado/customização)
export { FileTypeIndicators, getFileTypeIcon, getFileTypeBgColor } from './components/file-type-indicators';
export { UploadContextPanel } from './components/upload-context-panel';
export { UploadDropzoneArea } from './components/upload-dropzone-area';

// Hook de upload
export { useDocumentUpload } from './hooks/use-document-upload';
export type { UseDocumentUploadReturn } from './hooks/use-document-upload';

// Tipos e constantes
export {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  type DocumentUploadDropzoneProps,
  type UploadedFile,
  type UploadError,
  type UploadErrorCode,
  type FileType,
  type FileTypeConfig,
} from './types';
