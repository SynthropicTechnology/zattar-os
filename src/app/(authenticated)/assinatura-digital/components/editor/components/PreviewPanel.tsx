'use client';

import { Download, ExternalLink, FileX2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';

interface PreviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewPdfUrl: string | null;
  iframeLoadFailed: boolean;
  templateName: string;
  onIframeLoad: () => void;
  onIframeError: () => void;
  onDownloadPdf: (url: string, filename: string) => void;
}

/**
 * PreviewPanel - Modal dialog for displaying generated PDF preview
 * Handles iframe loading, error states, and download/open actions
 */
export default function PreviewPanel({
  open,
  onOpenChange,
  previewPdfUrl,
  iframeLoadFailed,
  templateName,
  onIframeLoad,
  onIframeError,
  onDownloadPdf,
}: PreviewPanelProps) {
  const handleDownload = () => {
    if (previewPdfUrl) {
      onDownloadPdf(previewPdfUrl, `preview-teste-${templateName}-${Date.now()}.pdf`);
    }
  };

  const handleOpenInNewTab = () => {
    if (previewPdfUrl) {
      window.open(previewPdfUrl, '_blank');
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="PDF de Teste Gerado com Sucesso"
      description="Visualize o PDF gerado com dados fictícios para validar o layout do template."
      maxWidth="5xl"
      bodyClassName="overflow-hidden flex flex-col p-0 sm:p-0"
      footer={
        <>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button onClick={handleOpenInNewTab}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir em Nova Aba
          </Button>
        </>
      }
    >
      {/* Preview do PDF ou mensagem de erro */}
      {previewPdfUrl && !iframeLoadFailed ? (
        <iframe
          src={previewPdfUrl}
          className="w-full flex-1 min-h-0 bg-muted/20"
          title="Preview do PDF de teste"
          onLoad={onIframeLoad}
          onError={onIframeError}
        />
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <FileX2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">
                Não foi possível exibir o PDF aqui
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                O PDF foi gerado com sucesso, mas não pode ser embutido devido a restrições
                de segurança (CORS/CSP). Use os botões abaixo para visualizar.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar PDF
              </Button>
              <Button onClick={handleOpenInNewTab}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir em Nova Aba
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogFormShell>
  );
}
