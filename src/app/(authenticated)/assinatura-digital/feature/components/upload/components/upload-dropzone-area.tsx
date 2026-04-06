'use client';

import { CloudUpload, X, CheckCircle, AlertCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FileTypeIndicators, getFileTypeIcon, getFileTypeBgColor } from './file-type-indicators';
import type { UploadedFile } from '../types';

interface UploadDropzoneAreaProps {
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

/**
 * Formata o tamanho do arquivo em bytes para uma string legível
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * UploadDropzoneArea - Área de drag & drop para upload de arquivos
 *
 * Componente interativo que aceita arquivos via drag & drop ou click.
 * Exibe estados visuais para drag active, erro, arquivo selecionado e upload em progresso.
 *
 * @example
 * ```tsx
 * const { getRootProps, getInputProps, isDragActive } = useDropzone({ ... });
 *
 * <UploadDropzoneArea
 *   isDragActive={isDragActive}
 *   hasError={!!error}
 *   errorMessage={error?.message}
 *   selectedFile={selectedFile}
 *   uploadedFile={uploadedFile}
 *   isUploading={isUploading}
 *   progress={progress}
 *   onRemoveFile={removeFile}
 *   getRootProps={getRootProps}
 *   getInputProps={getInputProps}
 * />
 * ```
 */
export function UploadDropzoneArea({
  isDragActive,
  hasError,
  errorMessage,
  selectedFile,
  uploadedFile,
  isUploading,
  progress,
  onRemoveFile,
  getRootProps,
  getInputProps,
}: UploadDropzoneAreaProps) {
  const hasFile = selectedFile || uploadedFile;
  const isCompleted = uploadedFile !== null;

  return (
    <div
      {...getRootProps()}
      className={cn(
        'group relative flex min-h-100 flex-col items-center justify-center',
        'cursor-pointer rounded-xl border-2 border-dashed p-6 lg:p-8',
        'transition-all duration-200',
        // Estados visuais
        !hasFile && !hasError && !isDragActive && 'border-border bg-muted/30 hover:border-primary hover:bg-primary/5',
        isDragActive && 'scale-[1.02] border-primary bg-primary/10',
        hasError && 'border-destructive bg-destructive/5',
        hasFile && !hasError && 'border-primary/50 bg-primary/5',
        isCompleted && 'border-primary/40 bg-primary/10 dark:bg-primary/15'
      )}
    >
      <input {...getInputProps()} />

      {/* Conteúdo baseado no estado */}
      {hasFile ? (
        <FilePreviewCard
          file={selectedFile}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
          progress={progress}
          onRemove={onRemoveFile}
          isCompleted={isCompleted}
        />
      ) : hasError ? (
        <ErrorState message={errorMessage} />
      ) : (
        <EmptyState isDragActive={isDragActive} />
      )}
    </div>
  );
}

/**
 * Estado vazio - ícone e texto para arrastar ou clicar
 */
function EmptyState({ isDragActive }: { isDragActive: boolean }) {
  return (
    <div className="flex flex-col items-center space-y-6 text-center animate-fade-in animate-duration-300">
      {/* Ícone central com animações */}
      <div className="relative">
        {/* Ping animation no hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-primary/20',
            'animate-ping opacity-0 group-hover:opacity-100',
            isDragActive && 'opacity-100'
          )}
        />
        {/* Container do ícone */}
        <div
          className={cn(
            'relative flex size-24 items-center justify-center rounded-full',
            'bg-background shadow-sm transition-transform duration-200',
            'group-hover:scale-110',
            isDragActive && 'scale-110 bg-primary/10'
          )}
        >
          <CloudUpload
            className={cn(
              'size-12 transition-colors duration-200',
              'text-muted-foreground group-hover:text-primary',
              isDragActive && 'text-primary'
            )}
          />
        </div>
      </div>

      {/* Textos */}
      <div className="space-y-2">
        <p
          className={cn(
            'font-heading text-xl font-semibold md:text-2xl',
            'text-foreground'
          )}
        >
          {isDragActive ? 'Solte o arquivo aqui' : 'Arraste seu documento ou clique aqui'}
        </p>
        <p className="text-sm text-muted-foreground">
          Suportamos arquivos PDF com até 10MB
        </p>
      </div>

      {/* Botão CTA — reforça a ação de clique */}
      {!isDragActive && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="pointer-events-none gap-2"
        >
          <Upload className="size-4" />
          Selecionar arquivo
        </Button>
      )}

      {/* Indicadores de tipo de arquivo */}
      <FileTypeIndicators className="mt-4" />
    </div>
  );
}

/**
 * Estado de erro - ícone e mensagem de erro
 */
function ErrorState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center space-y-4 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <p className="font-heading text-lg font-semibold text-destructive">
          Erro no upload
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message || 'Ocorreu um erro ao processar o arquivo. Tente novamente.'}
        </p>
      </div>
    </div>
  );
}

/**
 * Card de preview do arquivo selecionado/uploaded
 */
function FilePreviewCard({
  file,
  uploadedFile,
  isUploading,
  progress,
  onRemove,
  isCompleted,
}: {
  file: File | null;
  uploadedFile: UploadedFile | null;
  isUploading: boolean;
  progress: number;
  onRemove: () => void;
  isCompleted: boolean;
}) {
  const displayFile = uploadedFile || file;
  if (!displayFile) return null;

  const fileName = 'name' in displayFile ? displayFile.name : '';
  const fileSize = 'size' in displayFile ? displayFile.size : 0;
  const fileType = 'type' in displayFile ? displayFile.type : '';

  const { icon: FileIcon, color: iconColor } = getFileTypeIcon(fileType);
  const bgColor = getFileTypeBgColor(fileType);

  return (
    <div
      className={cn(
        'w-full max-w-md rounded-xl border bg-background p-6 shadow-sm',
        'transition-all duration-200',
        isCompleted && 'border-primary/30 bg-primary/5 dark:border-primary/30 dark:bg-primary/10'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-4">
        {/* Ícone do tipo de arquivo */}
        <div
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-lg',
            bgColor
          )}
        >
          <FileIcon className={cn('size-6', iconColor)} />
        </div>

        {/* Informações do arquivo */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{fileName}</p>
          <p className="text-sm text-muted-foreground">
            {formatFileSize(fileSize)}
          </p>

          {/* Progress bar durante upload */}
          {isUploading && (
            <div className="mt-3 space-y-1">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Enviando... {progress}%
              </p>
            </div>
          )}

          {/* Status de sucesso */}
          {isCompleted && (
            <div className="mt-2 flex items-center gap-1.5 text-primary">
              <CheckCircle className="size-4" />
              <span className="text-sm font-medium">Upload concluído</span>
            </div>
          )}
        </div>

        {/* Botão remover */}
        {!isUploading && (
          <Button
            type="button"
            variant="ghost"
            size="icon" aria-label="Remover arquivo"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <X className="size-5" />
            <span className="sr-only">Remover arquivo</span>
          </Button>
        )}
      </div>
    </div>
  );
}
