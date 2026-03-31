'use client';

/**
 * DocumentViewer
 *
 * Componente principal do visualizador de documentos.
 * Compõe: ViewerToolbar + área de conteúdo (iframe) + ViewerPaginationPill.
 *
 * Gerencia:
 * - Geração de presigned URL via actionGerarUrlDownload
 * - Estado de paginação (página atual, total de páginas)
 * - Nível de zoom via escala CSS
 *
 * Uso:
 * <DocumentViewer item={timelineItem} onOpenDetails={() => setDrawerOpen(true)} />
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import { actionGerarUrlDownload } from '@/features/documentos';
import { cn } from '@/lib/utils';
import { ViewerToolbar } from './viewer-toolbar';
import { ViewerPaginationPill } from './viewer-pagination-pill';
import { DocumentAnnotationOverlay } from './document-annotation-overlay';
import { PdfViewerCanvas } from './pdf-viewer-canvas';

interface ViewerAnnotation {
  id: string;
  content: string;
  createdAt: string;
}

interface DocumentViewerProps {
  item: TimelineItemEnriquecido | null;
  onOpenDetails: () => void;
  annotationsOpen: boolean;
  annotations: ViewerAnnotation[];
  onAddAnnotation: (content: string) => void;
  onDeleteAnnotation: (annotationId: string) => void;
  onToggleAnnotations: () => void;
  onOpenSearch: () => void;
  onToggleReadingFocus: () => void;
  isReadingFocused: boolean;
}

const DEFAULT_TOTAL_PAGES = 1;
const DEFAULT_ZOOM = 100;

function formatarDataHora(data: string): string {
  try {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return data;
  }
}

export function DocumentViewer({
  item,
  onOpenDetails,
  annotationsOpen,
  annotations,
  onAddAnnotation,
  onDeleteAnnotation,
  onToggleAnnotations,
  onOpenSearch,
  onToggleReadingFocus,
  isReadingFocused,
}: DocumentViewerProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(DEFAULT_TOTAL_PAGES);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Gera presigned URL quando o item muda
  useEffect(() => {
    if (!item?.backblaze?.key) {
      setPresignedUrl(null);
      setError(null);
      setTotalPages(DEFAULT_TOTAL_PAGES);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setPresignedUrl(null);
    setCurrentPage(1);
    setTotalPages(DEFAULT_TOTAL_PAGES);

    actionGerarUrlDownload(item.backblaze.key)
      .then((result) => {
        if (cancelled) return;
        if (result.success && result.data) {
          setPresignedUrl(result.data.url);
        } else {
          throw new Error(result.error || 'Erro ao gerar URL de acesso ao documento');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Erro ao buscar URL assinada:', err);
        setError('Erro ao gerar acesso ao documento. Tente novamente.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [item?.backblaze?.key]);

  useEffect(() => {
    if (!viewportRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 0;
      setViewportWidth(nextWidth);
    });

    observer.observe(viewportRef.current);

    return () => observer.disconnect();
  }, []);

  const handleOpenExternal = () => {
    if (presignedUrl) {
      window.open(presignedUrl, '_blank');
    }
  };

  const handleDownload = async () => {
    if (!item?.backblaze?.key) return;

    try {
      const result = await actionGerarUrlDownload(item.backblaze.key);
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Erro ao gerar URL de download');
      }
      const link = document.createElement('a');
      link.href = result.data.url;
      link.download = item.backblaze.fileName || 'documento.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Erro ao baixar documento:', err);
      toast.error('Erro ao baixar documento. Tente novamente.');
    }
  };

  const isDocumento = item?.documento ?? false;
  const hasBackblaze = !!item?.backblaze;
  const title = item?.titulo ?? '';
  const date = item?.data ? formatarDataHora(item.data) : undefined;
  const computedPageWidth = useMemo(() => {
    if (!viewportWidth) return 860;
    const gutter = annotationsOpen ? 64 : 32;
    return Math.max(480, Math.min(920, Math.floor(viewportWidth - gutter)));
  }, [annotationsOpen, viewportWidth]);

  return (
    <div className="relative flex h-full flex-col bg-background">
      {/* Área de conteúdo — viewer limpo conforme protótipo 1.html */}
      <div className="relative flex-1 overflow-hidden" ref={viewportRef}>
        {/* Ações flutuantes (overlay no canto superior direito) */}
        {item && (
          <ViewerToolbar
            title={title}
            date={date}
            isDocumento={isDocumento}
            hasBackblaze={hasBackblaze}
            isLoading={isLoading}
            annotationCount={annotations.length}
            annotationsOpen={annotationsOpen}
            isReadingFocused={isReadingFocused}
            onOpenSearch={onOpenSearch}
            onOpenExternal={handleOpenExternal}
            onDownload={handleDownload}
            onOpenDetails={onOpenDetails}
            onToggleAnnotations={onToggleAnnotations}
            onToggleReadingFocus={onToggleReadingFocus}
          />
        )}

        <DocumentAnnotationOverlay
          open={annotationsOpen}
          itemTitle={title}
          itemDate={date}
          annotations={annotations}
          onAddAnnotation={onAddAnnotation}
          onDeleteAnnotation={onDeleteAnnotation}
        />

        {isLoading ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando documento" />
          </div>
        ) : error ? (
          // Estado de erro com retry
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <FileText className="h-12 w-12 text-destructive" aria-hidden="true" />
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => {
                if (!item?.backblaze?.key) return;
                setIsLoading(true);
                setError(null);
                actionGerarUrlDownload(item.backblaze.key)
                  .then((result) => {
                    if (result.success && result.data) {
                      setPresignedUrl(result.data.url);
                    } else {
                      setError('Erro ao gerar acesso ao documento. Tente novamente.');
                    }
                  })
                  .catch(() => {
                    setError('Erro ao gerar acesso ao documento. Tente novamente.');
                  })
                  .finally(() => setIsLoading(false));
              }}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              Tentar novamente
            </button>
          </div>
        ) : !item ? (
          // Estado vazio — nenhum item selecionado
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <FileText
              className="h-12 w-12 text-muted-foreground/55"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Selecione um documento na timeline
            </p>
          </div>
        ) : presignedUrl ? (
          // Exibição do PDF com renderer controlado
          <div
            className={cn(
              'h-full w-full overflow-auto px-3 pb-18 pt-3 transition-[padding] duration-200 sm:px-4 sm:pt-4',
              annotationsOpen && 'lg:pr-6'
            )}
          >
            <div className="mx-auto flex min-h-full w-full max-w-232 justify-center rounded-2xl bg-background">
              <PdfViewerCanvas
                pdfUrl={presignedUrl}
                currentPage={currentPage}
                zoomLevel={zoomLevel}
                pageWidth={computedPageWidth}
                onPageChange={setCurrentPage}
                onLoadSuccess={setTotalPages}
              />
            </div>
          </div>
        ) : (
          // Item selecionado mas sem presigned URL (ex: sem backblaze)
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <FileText
              className="h-12 w-12 text-muted-foreground/55"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">
              Documento não disponível para visualização
            </p>
          </div>
        )}
      </div>

      {/* Pílula de paginação flutuante */}
      {item && presignedUrl && (
        <ViewerPaginationPill
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          zoomLevel={zoomLevel}
          onZoomChange={setZoomLevel}
        />
      )}
    </div>
  );
}
