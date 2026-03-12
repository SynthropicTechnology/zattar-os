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

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import { actionGerarUrlDownload } from '@/features/documentos';
import { ViewerToolbar } from './viewer-toolbar';
import { ViewerPaginationPill } from './viewer-pagination-pill';

interface DocumentViewerProps {
  item: TimelineItemEnriquecido | null;
  onOpenDetails: () => void;
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

export function DocumentViewer({ item, onOpenDetails }: DocumentViewerProps) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(DEFAULT_TOTAL_PAGES);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);

  // Gera presigned URL quando o item muda
  useEffect(() => {
    if (!item?.backblaze?.key) {
      setPresignedUrl(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setPresignedUrl(null);
    setCurrentPage(1);

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

  return (
    <div className="flex flex-col h-full bg-muted/30 relative">
      {/* Barra superior com info e ações */}
      <ViewerToolbar
        title={title}
        date={date}
        isDocumento={isDocumento}
        hasBackblaze={hasBackblaze}
        isLoading={isLoading}
        onOpenExternal={handleOpenExternal}
        onDownload={handleDownload}
        onOpenDetails={onOpenDetails}
      />

      {/* Área de conteúdo */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          // Estado de carregamento
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Carregando documento" />
          </div>
        ) : error ? (
          // Estado de erro
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <FileText className="h-12 w-12 text-destructive" aria-hidden="true" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : !item ? (
          // Estado vazio — nenhum item selecionado
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <FileText
              className="h-12 w-12 text-muted-foreground/30"
              aria-hidden="true"
              style={{ width: 48, height: 48 }}
            />
            <p className="text-sm text-muted-foreground">
              Selecione um documento na timeline
            </p>
          </div>
        ) : presignedUrl ? (
          // Exibição do PDF via iframe
          <div
            className="w-full h-full overflow-auto flex justify-center pt-8 pb-24 px-4"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
            }}
          >
            <iframe
              src={`${presignedUrl}#toolbar=0&navpanes=0&scrollbar=0&page=${currentPage}`}
              className="w-full max-w-4xl min-h-full rounded shadow-sm border bg-card"
              title={item.titulo}
            />
          </div>
        ) : (
          // Item selecionado mas sem presigned URL (ex: sem backblaze)
          <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
            <FileText
              className="h-12 w-12 text-muted-foreground/30"
              aria-hidden="true"
              style={{ width: 48, height: 48 }}
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
