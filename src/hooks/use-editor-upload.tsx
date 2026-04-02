'use client';

/**
 * Hook para upload de arquivos no editor de documentos
 *
 * Substitui o useUploadFile do UploadThing por upload direto ao Backblaze B2
 * através da API /api/documentos/[id]/upload
 */

import * as React from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { actionUploadArquivo } from '@/app/app/documentos';

/**
 * Arquivo enviado com sucesso
 */
export interface UploadedFile {
  key: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface UseEditorUploadProps {
  documentoId: number;
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
  onUploadProgress?: (progress: number) => void;
}

export function useEditorUpload({
  documentoId,
  onUploadComplete,
  onUploadError,
  onUploadProgress,
}: UseEditorUploadProps) {
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile | undefined>();
  const [uploadingFile, setUploadingFile] = React.useState<File | undefined>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  const uploadFile = React.useCallback(
    async (file: File): Promise<UploadedFile | undefined> => {
      setIsUploading(true);
      setUploadingFile(file);
      setProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documento_id', String(documentoId));

        // Simular progresso (Server Actions não suportam progresso nativo)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const next = Math.min(prev + 5, 90);
            onUploadProgress?.(next);
            return next;
          });
        }, 100);

        const result = await actionUploadArquivo(formData);

        clearInterval(progressInterval);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erro ao fazer upload');
        }

        const data = result.data as unknown as { 
          b2_key: string; 
          nome_arquivo: string; 
          tamanho_bytes: number; 
          tipo_mime: string; 
          b2_url: string; 
        }; // Casting to avoid complex type imports if not available directly or just map properties

        setProgress(100);
        onUploadProgress?.(100);

        const uploadedResult: UploadedFile = {
          key: data.b2_key,
          name: data.nome_arquivo,
          size: data.tamanho_bytes,
          type: data.tipo_mime,
          url: data.b2_url,
        };

        setUploadedFile(uploadedResult);
        onUploadComplete?.(uploadedResult);

        return uploadedResult;
      } catch (error) {
        const errorMessage = getErrorMessage(error);
        toast.error(errorMessage);
        onUploadError?.(error);

        // Fallback: criar URL local para preview (não persiste)
        const mockUploadedFile: UploadedFile = {
          key: `local-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
        };

        // Simular progresso restante
        let fakeProgress = progress;
        const fakeProgressInterval = setInterval(() => {
          fakeProgress = Math.min(fakeProgress + 5, 100);
          setProgress(fakeProgress);
          onUploadProgress?.(fakeProgress);
          if (fakeProgress >= 100) {
            clearInterval(fakeProgressInterval);
          }
        }, 50);

        await new Promise((resolve) => setTimeout(resolve, 500));

        setUploadedFile(mockUploadedFile);

        return mockUploadedFile;
      } finally {
        setProgress(0);
        setIsUploading(false);
        setUploadingFile(undefined);
      }
    },
    [documentoId, onUploadComplete, onUploadError, onUploadProgress, progress]
  );

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile,
    uploadingFile,
  };
}

/**
 * Context para compartilhar o documentoId com componentes filhos do editor
 */
export const DocumentEditorContext = React.createContext<{
  documentoId: number;
} | null>(null);

/**
 * Provider do contexto do editor de documentos
 */
export function DocumentEditorProvider({
  documentoId,
  children,
}: {
  documentoId: number;
  children: React.ReactNode;
}) {
  return (
    <DocumentEditorContext.Provider value={{ documentoId }}>
      {children}
    </DocumentEditorContext.Provider>
  );
}

/**
 * Hook para acessar o documentoId do contexto
 */
export function useDocumentoId(): number {
  const context = React.useContext(DocumentEditorContext);

  if (!context) {
    // Fallback para 0 quando usado fora do contexto (evita erro)
    console.warn(
      'useDocumentoId deve ser usado dentro de DocumentEditorProvider'
    );
    return 0;
  }

  return context.documentoId;
}

/**
 * Hook simplificado que usa o documentoId do contexto
 */
export function useUploadFile(
  props: Omit<UseEditorUploadProps, 'documentoId'> = {}
) {
  const documentoId = useDocumentoId();

  return useEditorUpload({
    documentoId,
    ...props,
  });
}

/**
 * Extrai mensagem de erro
 */
export function getErrorMessage(err: unknown): string {
  const unknownError = 'Algo deu errado. Tente novamente.';

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => issue.message);
    return errors.join('\n');
  }

  if (err instanceof Error) {
    return err.message;
  }

  return unknownError;
}

/**
 * Mostra toast de erro
 */
export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err);
  return toast.error(errorMessage);
}
