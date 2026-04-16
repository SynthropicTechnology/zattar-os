'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, FileUp, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatFileSize } from '@/shared/assinatura-digital/utils';

/**
 * Resultado do upload de PDF
 */
export interface PdfUploadValue {
  url: string;
  nome: string;
  tamanho: number;
}

/**
 * Props do componente PdfUploadField
 */
export interface PdfUploadFieldProps {
  /** Valor atual do arquivo */
  value?: PdfUploadValue | null;
  /** Callback quando o arquivo muda */
  onChange: (file: PdfUploadValue | null) => void;
  /** Desabilita o campo */
  disabled?: boolean;
  /** Mensagem de erro externa */
  error?: string;
  /** Label do campo */
  label?: string;
  /** Se o campo é obrigatório */
  required?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Componente reutilizável para upload de arquivos PDF.
 *
 * Features:
 * - Validação de tipo (apenas PDF)
 * - Validação de tamanho (máximo 10MB)
 * - Upload para API
 * - Preview do arquivo
 * - Estados de loading e erro
 * - Botão para remover arquivo
 */
export function PdfUploadField({
  value,
  onChange,
  disabled = false,
  error,
  label = 'Upload de PDF',
  required = false,
}: PdfUploadFieldProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const hasValidFile = Boolean(value?.url && value?.nome && value?.tamanho > 0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      setUploadError('Apenas arquivos PDF são permitidos');
      return;
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('Arquivo muito grande. Máximo permitido: 10MB');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/assinatura-digital/templates/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao fazer upload');
      }

      // Notificar componente pai com resultado do upload
      onChange({
        url: result.data.url,
        nome: result.data.nome,
        tamanho: result.data.tamanho,
      });

      toast.success('PDF enviado com sucesso!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setUploadError(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    onChange(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayError = error || uploadError;

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>

      {!hasValidFile ? (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            disabled={isUploading || disabled}
            className="hidden"
            id="pdf-upload-field"
          />
          <label
            htmlFor="pdf-upload-field"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <span className="text-sm text-muted-foreground">Enviando arquivo...</span>
              </>
            ) : (
              <>
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm font-medium">Clique para selecionar um PDF</span>
                <span className="text-xs text-muted-foreground">Máximo 10MB</span>
              </>
            )}
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm font-medium">{value?.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(value?.tamanho || 0)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemoveFile}
              disabled={disabled}
              data-testid="remove-button"
              aria-label="Remover arquivo"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {displayError && (
        <p className="text-sm text-destructive">{displayError}</p>
      )}
    </div>
  );
}
