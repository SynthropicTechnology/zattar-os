"use client";

import { useState, useCallback } from "react";
import { actionUploadArquivoGenerico } from "@/features/documentos";
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
  type UploadedFile,
  type UploadError,
  type UseDocumentUploadState,
} from "../types";

/**
 * Resultado da validação de arquivo
 */
interface ValidationResult {
  isValid: boolean;
  error?: UploadError;
}

/**
 * Configuração do hook de upload
 */
interface UseDocumentUploadConfig {
  onSuccess?: (file: UploadedFile) => void;
  onError?: (error: UploadError) => void;
}

/**
 * Hook para gerenciar upload de documentos com validação
 *
 * Encapsula lógica de validação de tipos e tamanhos, upload para Supabase Storage
 * via server action, e gerenciamento de estados de loading/error/success.
 *
 * @param config - Configuração opcional com callbacks
 * @returns Estado e métodos para controle do upload
 */
export function useDocumentUpload(config?: UseDocumentUploadConfig) {
  const [state, setState] = useState<UseDocumentUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedFile: null,
    selectedFile: null,
  });

  /**
   * Valida se a extensão do arquivo é permitida
   */
  const validateExtension = useCallback((fileName: string): boolean => {
    const extension = "." + fileName.split(".").pop()?.toLowerCase();
    const allowedExtensions = Object.values(ALLOWED_TYPES).flat();
    return allowedExtensions.includes(extension);
  }, []);

  /**
   * Valida se o MIME type do arquivo é permitido
   */
  const validateMimeType = useCallback((mimeType: string): boolean => {
    return Object.keys(ALLOWED_TYPES).includes(mimeType);
  }, []);

  /**
   * Valida um arquivo antes do upload
   */
  const validateFile = useCallback(
    (file: File): ValidationResult => {
      // Validar tamanho
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
        return {
          isValid: false,
          error: {
            code: "FILE_TOO_LARGE",
            message: `O arquivo excede o limite de ${maxSizeMB}MB. Por favor, selecione um arquivo menor.`,
          },
        };
      }

      // Validar extensão
      if (!validateExtension(file.name)) {
        return {
          isValid: false,
          error: {
            code: "INVALID_TYPE",
            message:
              "Tipo de arquivo não suportado. Por favor, envie um arquivo PDF.",
          },
        };
      }

      // Validar MIME type
      if (!validateMimeType(file.type)) {
        // Fallback: se o MIME type não for reconhecido, verificar só pela extensão
        const extension = "." + file.name.split(".").pop()?.toLowerCase();
        const isValidByExtension = Object.values(ALLOWED_TYPES)
          .flat()
          .includes(extension);

        if (!isValidByExtension) {
          return {
            isValid: false,
            error: {
              code: "INVALID_TYPE",
              message:
                "Tipo de arquivo não suportado. Por favor, envie um arquivo PDF.",
            },
          };
        }
      }

      return { isValid: true };
    },
    [validateExtension, validateMimeType]
  );

  /**
   * Seleciona um arquivo (sem fazer upload ainda)
   */
  const selectFile = useCallback(
    (file: File): boolean => {
      const validation = validateFile(file);

      if (!validation.isValid) {
        setState((prev) => ({
          ...prev,
          error: validation.error!,
          selectedFile: null,
        }));
        config?.onError?.(validation.error!);
        return false;
      }

      setState((prev) => ({
        ...prev,
        selectedFile: file,
        error: null,
        uploadedFile: null,
      }));
      return true;
    },
    [validateFile, config]
  );

  /**
   * Faz upload do arquivo selecionado para o servidor
   */
  const uploadFile = useCallback(
    async (file?: File): Promise<UploadedFile | null> => {
      const fileToUpload = file || state.selectedFile;

      if (!fileToUpload) {
        const error: UploadError = {
          code: "VALIDATION_ERROR",
          message: "Nenhum arquivo selecionado para upload.",
        };
        setState((prev) => ({ ...prev, error }));
        config?.onError?.(error);
        return null;
      }

      // Validar novamente antes do upload
      const validation = validateFile(fileToUpload);
      if (!validation.isValid) {
        setState((prev) => ({
          ...prev,
          error: validation.error!,
        }));
        config?.onError?.(validation.error!);
        return null;
      }

      setState((prev) => ({
        ...prev,
        isUploading: true,
        progress: 0,
        error: null,
      }));

      // Declarar interval fora do try para garantir limpeza em qualquer cenário
      let progressInterval: ReturnType<typeof setInterval> | null = null;

      try {
        // Simular progresso (já que a action não reporta progresso real)
        progressInterval = setInterval(() => {
          setState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 200);

        // Criar FormData para o upload
        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("pasta_id", ""); // Sem pasta específica

        // Chamar server action
        const result = await actionUploadArquivoGenerico(formData);

        if (!result.success) {
          const error: UploadError = {
            code: "UPLOAD_FAILED",
            message: result.error || "Erro ao fazer upload do arquivo.",
          };
          setState((prev) => ({
            ...prev,
            isUploading: false,
            progress: 0,
            error,
          }));
          config?.onError?.(error);
          return null;
        }

        // Upload bem-sucedido
        const uploadedFile: UploadedFile = {
          name: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
          url: result.data?.b2_url || "",
          uploadedAt: new Date(),
        };

        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          uploadedFile,
          error: null,
        }));

        config?.onSuccess?.(uploadedFile);
        return uploadedFile;
      } catch (error) {
        console.error("Erro no upload:", error);
        const uploadError: UploadError = {
          code: "UPLOAD_FAILED",
          message:
            error instanceof Error
              ? error.message
              : "Erro desconhecido ao fazer upload.",
        };
        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 0,
          error: uploadError,
        }));
        config?.onError?.(uploadError);
        return null;
      } finally {
        // Garantir limpeza do interval em qualquer cenário (sucesso, erro ou exceção)
        if (progressInterval) {
          clearInterval(progressInterval);
        }
      }
    },
    [state.selectedFile, validateFile, config]
  );

  /**
   * Reseta o estado do upload para valores iniciais
   */
  const resetUpload = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedFile: null,
      selectedFile: null,
    });
  }, []);

  /**
   * Remove o arquivo selecionado/uploaded
   */
  const removeFile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedFile: null,
      uploadedFile: null,
      progress: 0,
      error: null,
    }));
  }, []);

  return {
    // Estado
    ...state,

    // Métodos
    validateFile,
    selectFile,
    uploadFile,
    resetUpload,
    removeFile,
  };
}

export type UseDocumentUploadReturn = ReturnType<typeof useDocumentUpload>;
