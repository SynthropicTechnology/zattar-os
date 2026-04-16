"use client";

import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

import { UploadDropzoneArea } from "./components/upload-dropzone-area";
import { useDocumentUpload } from "./hooks/use-document-upload";
import { actionCreateDocumento } from '@/shared/assinatura-digital/actions/documentos-actions';
import {
  ALLOWED_TYPES,
  MAX_FILE_SIZE,
} from "./types";

/**
 * DocumentUploadDropzone - Upload de documento PDF
 *
 * Faz o upload do PDF, cria o registro no banco e redireciona para edição.
 * Se `onUploadSuccess` for passado, delega o controle ao componente pai.
 */
export interface DocumentUploadDropzoneProps {
  onUploadSuccess?: (url: string, name: string) => void;
}

export function DocumentUploadDropzone({ onUploadSuccess }: DocumentUploadDropzoneProps = {}) {
  const router = useRouter();

  const handleUploadCompleted = useCallback(async (url: string, name: string) => {
    if (onUploadSuccess) {
      onUploadSuccess(url, name);
      return;
    }

    try {
      toast.loading("Processando documento...", { id: "create-doc" });

      const result = await actionCreateDocumento({
        titulo: name,
        pdf_original_url: url,
        selfie_habilitada: false,
        assinantes: [],
      });

      if (!result.success) {
        throw new Error(result.error || result.message || "Erro ao criar documento");
      }

      if (!result?.data?.documento?.documento_uuid) {
        throw new Error("Documento criado mas UUID não retornado");
      }

      toast.success("Documento enviado! Redirecionando para configuração...", { id: "create-doc" });

      router.push(`/app/assinatura-digital/documentos/editar/${result.data.documento.documento_uuid}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar documento";
      toast.error(errorMessage, { id: "create-doc" });
    }
  }, [router, onUploadSuccess]);

  const {
    isUploading,
    progress,
    error,
    uploadedFile,
    selectedFile,
    selectFile,
    removeFile,
    uploadFile,
    resetUpload,
  } = useDocumentUpload({
    onSuccess: () => { },
    onError: (err) => toast.error(err.message),
  });

  const autoUpload = useCallback(async () => {
    const result = await uploadFile();
    if (result) {
      await handleUploadCompleted(result.url, result.name);
    }
  }, [uploadFile, handleUploadCompleted]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        selectFile(file);

        const result = await uploadFile(file);
        if (result) {
          await handleUploadCompleted(result.url, result.name);
        }
      }
    },
    [selectFile, uploadFile, handleUploadCompleted],
  );

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    const rejection = fileRejections[0];
    if (!rejection) return;

    const errorCode = rejection.errors[0]?.code;
    if (errorCode === "file-too-large") {
      toast.error("Arquivo muito grande. O limite é 10MB.");
    } else if (errorCode === "file-invalid-type") {
      toast.error("Tipo de arquivo não suportado. Envie um arquivo PDF.");
    } else {
      toast.error("Erro ao processar o arquivo.");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: ALLOWED_TYPES,
      maxSize: MAX_FILE_SIZE,
      maxFiles: 1,
      multiple: false,
      disabled: isUploading,
      noClick: false,
      noKeyboard: false,
    });

  return (
    <div className="flex h-full w-full flex-1 flex-col items-center justify-center p-6 lg:p-12 animate-fade-in overflow-hidden">
      <div className="relative w-full max-w-5xl flex flex-col items-center justify-center">
        <UploadDropzoneArea
          isDragActive={isDragActive}
          hasError={!!error}
          errorMessage={error?.message}
          selectedFile={selectedFile}
          uploadedFile={uploadedFile}
          isUploading={isUploading}
          progress={progress}
          onRemoveFile={() => {
            removeFile();
            resetUpload();
          }}
          getRootProps={getRootProps}
          getInputProps={getInputProps}
        />

        {selectedFile && !isUploading && !uploadedFile && (
          <div className="mt-8 flex justify-center animate-fade-in-up">
            <Button onClick={autoUpload} size="lg">
              Confirmar e Enviar Documento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
