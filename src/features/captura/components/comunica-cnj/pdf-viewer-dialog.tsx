'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-breakpoint';
import { actionObterCertidao } from '../../actions/comunica-cnj-actions';

interface PdfViewerDialogProps {
  hash: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog/Sheet para visualizar certidão PDF do CNJ
 * Usa Sheet em mobile para melhor UX
 */
export function PdfViewerDialog({ hash, open, onOpenChange }: PdfViewerDialogProps) {
  const isMobile = useIsMobile();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash || !open) {
      setPdfUrl((currentUrl) => {
        if (currentUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrl);
        }

        return null;
      });
      setError(null);
      return;
    }

    let isActive = true;
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await actionObterCertidao(hash);

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Erro ao carregar certidão');
        }

        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const url = URL.createObjectURL(blob);
        objectUrl = url;

        if (!isActive) {
          URL.revokeObjectURL(url);
          return;
        }

        setPdfUrl((currentUrl) => {
          if (currentUrl && currentUrl !== url && currentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(currentUrl);
          }

          return url;
        });
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar certidão');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      isActive = false;

      if (objectUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [hash, open]);

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `certidao-${hash}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => (
    <div className="flex-1 flex flex-col min-h-0">
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Carregando certidão...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {pdfUrl && !isLoading && !error && (
        <>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em Nova Aba
              </a>
            </Button>
          </div>

          <div className="flex-1 border rounded-lg overflow-hidden bg-muted">
            <iframe
              src={pdfUrl}
              className="w-full h-full"
              title="Certidão PDF"
            />
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col">
          <SheetHeader>
            <SheetTitle>Certidão da Comunicação</SheetTitle>
            <SheetDescription>
              Visualização da certidão em PDF
            </SheetDescription>
          </SheetHeader>
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Certidão da Comunicação</DialogTitle>
          <DialogDescription>
            Visualização da certidão em PDF
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
