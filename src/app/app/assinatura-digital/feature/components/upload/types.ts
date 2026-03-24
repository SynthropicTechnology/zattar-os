/**
 * Tipos TypeScript para o componente de upload de documentos
 * para assinatura digital.
 */

/**
 * Props do componente principal DocumentUploadDropzone
 */
export interface DocumentUploadDropzoneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: (fileUrl: string, fileName: string) => void;
}

/**
 * Representa um arquivo que foi uploaded com sucesso
 */
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

/**
 * Códigos de erro possíveis durante o upload
 */
export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'UPLOAD_FAILED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR';

/**
 * Estrutura de erro de upload
 */
export interface UploadError {
  code: UploadErrorCode;
  message: string;
}

/**
 * Estado do hook de upload
 */
export interface UseDocumentUploadState {
  isUploading: boolean;
  progress: number;
  error: UploadError | null;
  uploadedFile: UploadedFile | null;
  selectedFile: File | null;
}

/**
 * Tipos de arquivo permitidos com suas extensões
 */
export const ALLOWED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
};

/**
 * Tamanho máximo de arquivo em bytes (10MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Tipos de arquivo para exibição visual
 */
export type FileType = 'pdf';

/**
 * Configuração visual por tipo de arquivo
 */
export interface FileTypeConfig {
  type: FileType;
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Props do painel de contexto
 */
export interface UploadContextPanelProps {
  onSelectFile: () => void;
  isUploading: boolean;
}

/**
 * Props da área de dropzone
 */
export interface UploadDropzoneAreaProps {
  onDrop: (acceptedFiles: File[]) => void;
  isDragActive: boolean;
  hasError: boolean;
  errorMessage?: string;
  selectedFile: File | null;
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  progress: number;
  onRemoveFile: () => void;
  getRootProps: () => Record<string, unknown>;
  getInputProps: () => Record<string, unknown>;
}
