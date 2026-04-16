'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { AlertCircle, Check, Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import PdfPreviewDynamic from "@/shared/assinatura-digital/components/pdf/PdfPreviewDynamic";
const PdfPreview = PdfPreviewDynamic;

interface ReplacePdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | number;
  onSuccess: () => void;
}

interface UploadedFile {
  file: File;
  preview: string;
  isValid: boolean;
  error?: string;
}

export default function ReplacePdfDialog({
  open,
  onOpenChange,
  templateId,
  onSuccess,
}: ReplacePdfDialogProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validacao de arquivo PDF
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Verificar tipo
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Apenas arquivos PDF são aceitos' };
    }

    // Verificar tamanho (maximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'Arquivo muito grande. Máximo 10MB' };
    }

    // Verificar tamanho minimo (10KB)
    const minSize = 10 * 1024; // 10KB
    if (file.size < minSize) {
      return { isValid: false, error: 'Arquivo muito pequeno. Mínimo 10KB' };
    }

    return { isValid: true };
  }, []);

  // Configuracao do dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const validation = validateFile(file);

    // Criar URL do blob para preview
    const blobUrl = URL.createObjectURL(file);

    const uploadedFile: UploadedFile = {
      file,
      preview: blobUrl,
      isValid: validation.isValid,
      error: validation.error
    };

    setUploadedFile(uploadedFile);

    if (!validation.isValid && validation.error) {
      toast.error(validation.error);
    }
  }, [validateFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  });

  // Remover arquivo
  const removeFile = useCallback(() => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
  }, [uploadedFile]);

  // Cleanup: revogar URL do blob quando componente desmonta ou dialog fecha
  useEffect(() => {
    return () => {
      if (uploadedFile?.preview) {
        URL.revokeObjectURL(uploadedFile.preview);
      }
    };
  }, [uploadedFile]);

  // Reset ao fechar
  useEffect(() => {
    if (!open) {
      removeFile();
    }
  }, [open, removeFile]);

  const handleReplace = async () => {
    if (!uploadedFile || !uploadedFile.isValid) {
      toast.error('Selecione um arquivo PDF válido');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload do arquivo para o storage
      const formData = new FormData();
      formData.append('file', uploadedFile.file);

      const uploadResponse = await fetch('/api/assinatura-digital/templates/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (uploadResponse.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json().catch(() => null);
        throw new Error(error?.error || 'Erro ao fazer upload do PDF');
      }

      const uploadResult = await uploadResponse.json();
      const { url, nome, tamanho } = uploadResult.data;

      // 2. Atualizar template com a nova URL do PDF
      const updateResponse = await fetch(`/api/assinatura-digital/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          arquivo_original: url,
          pdf_url: url,
          arquivo_nome: nome,
          arquivo_tamanho: tamanho,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json().catch(() => null);
        throw new Error(error?.error || 'Erro ao atualizar template com novo PDF');
      }

      toast.success('PDF substituído com sucesso!');
      removeFile();
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao substituir PDF:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao substituir PDF do template'
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Substituir PDF do Template"
      maxWidth="2xl"
      footer={
        <Button
          onClick={handleReplace}
          disabled={!uploadedFile || !uploadedFile.isValid || isUploading}
          className="gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Substituindo...
            </>
          ) : (
            'Substituir PDF'
          )}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          Faça upload de um novo arquivo PDF. O arquivo atual será substituído permanentemente.
        </p>

        {!uploadedFile ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-50 ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-input hover:border-primary/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input {...getInputProps()} ref={fileInputRef} className="hidden" />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
            </p>
            <p className="text-xs text-muted-foreground">
              Apenas arquivos PDF, máximo 10MB
            </p>
          </div>
        ) : (
          <>
            {/* Indicador de arquivo selecionado */}
            <div className="border rounded-lg p-3 bg-card">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`shrink-0 p-1.5 rounded-full ${
                    uploadedFile.isValid
                      ? 'bg-success/10'
                      : 'bg-destructive/10'
                  }`}>
                    {uploadedFile.isValid ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{uploadedFile.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {!uploadedFile.isValid && uploadedFile.error && (
                      <p className="text-xs text-destructive mt-0.5">{uploadedFile.error}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Preview do novo PDF */}
            {uploadedFile.isValid && (
              <div className="min-h-87.5 bg-muted/30 rounded-lg overflow-hidden">
                <PdfPreview
                  pdfUrl={uploadedFile.preview}
                  initialZoom={0.8}
                  showControls={true}
                  showPageIndicator={true}
                  maxHeight="100%"
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  onLoadError={(error) => {
                    toast.error(`Erro ao carregar preview: ${error.message}`);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </DialogFormShell>
  );
}
