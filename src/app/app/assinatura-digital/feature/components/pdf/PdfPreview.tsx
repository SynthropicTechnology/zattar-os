'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import type { PdfPreviewProps, PdfLoadState } from '../../types/pdf-preview.types';
import { DEFAULT_ZOOM_CONFIG } from '../../types/pdf-preview.types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar o worker do PDF.js (versão 5.x)
if (typeof window !== 'undefined') {
  // Usar worker local copiado para public/pdfjs/
  // Isso evita problemas de CORS e garante a versão correta
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
}

/**
 * Prepara o objeto file para o react-pdf Document
 * Para URLs de API locais, inclui withCredentials para enviar cookies de autenticação
 */
function prepareFileSource(url: string | undefined | null): string | { url: string; withCredentials: boolean } | null {
  // Retornar null se URL não for fornecida
  if (!url) {
    return null;
  }
  // Se for uma URL de API local, incluir credenciais
  if (url.startsWith('/api/') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    return { url, withCredentials: true };
  }
  // Para URLs externas (Backblaze, etc), usar string simples
  return url;
}

export default function PdfPreview({
  pdfUrl,
  initialZoom = DEFAULT_ZOOM_CONFIG.default,
  zoom: controlledZoom,
  initialPage = 1,
  onZoomChange,
  onPageChange,
  onLoadSuccess,
  onLoadError,
  showControls = true,
  showPageIndicator = true,
  maxHeight = '100%',
  maxWidth = '100%',
  className = '',
  viewportClassName = '',
  mode = 'default',
  renderTextLayer = true,
  renderAnnotationLayer = true,
  pageWidth,
  pageHeight,
}: PdfPreviewProps) {
  const [loadState, setLoadState] = useState<PdfLoadState>({
    isLoading: true,
    error: null,
    numPages: null,
    currentPageInfo: null,
  });

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [internalZoom, setInternalZoom] = useState(initialZoom);

  // Use controlled zoom when provided, otherwise use internal state
  const zoom = controlledZoom ?? internalZoom;
  const setZoom = setInternalZoom;

  // Preparar fonte do PDF com credenciais se for API local
  const fileSource = useMemo(() => prepareFileSource(pdfUrl), [pdfUrl]);

  // Sincronizar currentPage quando initialPage muda (necessário para modo background)
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Callback quando PDF é carregado
  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setLoadState(prev => ({
      ...prev,
      isLoading: false,
      numPages,
      error: null,
    }));

    if (onLoadSuccess) {
      onLoadSuccess(numPages);
    }
  }, [onLoadSuccess]);

  // Callback quando ocorre erro
  const handleLoadError = useCallback((error: Error) => {
    console.error('[PDF_PREVIEW] Erro ao carregar PDF:', error);

    setLoadState(prev => ({
      ...prev,
      isLoading: false,
      error,
    }));

    if (onLoadError) {
      onLoadError(error);
    }
  }, [onLoadError]);

  // Controles de zoom
  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.min(prev + DEFAULT_ZOOM_CONFIG.step, DEFAULT_ZOOM_CONFIG.max);
      if (onZoomChange) onZoomChange(newZoom);
      return newZoom;
    });
  }, [onZoomChange, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const newZoom = Math.max(prev - DEFAULT_ZOOM_CONFIG.step, DEFAULT_ZOOM_CONFIG.min);
      if (onZoomChange) onZoomChange(newZoom);
      return newZoom;
    });
  }, [onZoomChange, setZoom]);

  // Controles de página
  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => {
      const newPage = Math.max(prev - 1, 1);
      if (onPageChange) onPageChange(newPage);
      return newPage;
    });
  }, [onPageChange]);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => {
      const newPage = Math.min(prev + 1, loadState.numPages || 1);
      if (onPageChange) onPageChange(newPage);
      return newPage;
    });
  }, [loadState.numPages, onPageChange]);

  // Se não há URL, mostrar estado de espera
  if (!fileSource) {
    const emptyState = (
      <div className="flex h-full flex-col items-center justify-center p-4 text-muted-foreground">
        <Loader2 className="mb-2 h-8 w-8 animate-spin" />
        <p className="text-sm">Aguardando URL do PDF...</p>
      </div>
    );

    if (mode === 'background') {
      return (
        <div className={`${className} pointer-events-none relative`} style={{ maxHeight, maxWidth }}>
          {emptyState}
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {showControls && (
          <div className="flex items-center justify-between border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur supports-backdrop-filter:bg-background/80">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium min-w-15 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <Button variant="outline" size="sm" disabled>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        <div
          className={`scrollbar-custom flex flex-1 items-center justify-center overflow-auto overscroll-contain scroll-smooth bg-[radial-gradient(circle_at_top,rgba(30,58,138,0.06),transparent_32%),linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(241,245,249,1)_100%)] p-4 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(15,23,42,0.98)_100%)] ${viewportClassName}`}
          style={{ maxHeight, maxWidth }}
        >
          {emptyState}
        </div>
      </div>
    );
  }

  // Background mode: render only the PDF without any layout/controls
  if (mode === 'background') {
    return (
      <div className={`${className} pointer-events-none relative`} style={{ maxHeight, maxWidth }}>
        <Document
          file={fileSource}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={null}
          error={null}
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            width={pageWidth}
            height={pageHeight}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        {/* Overlay for loading/error states */}
        {loadState.isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {loadState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95">
            <div className="p-4 text-center text-muted-foreground">
              <AlertCircle className="mx-auto mb-2 h-8 w-8 text-orange-500" />
              <p className="mb-1 text-sm font-medium text-foreground">Preview não disponível</p>
              <p className="mb-2 text-xs text-muted-foreground">
                Não foi possível carregar o PDF para visualização
              </p>
              <p className="text-xs italic text-muted-foreground">
                Você ainda pode mapear campos nas coordenadas
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default mode: full preview with controls
  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Controles */}
      {showControls && (
        <div className="flex items-center justify-between border-b border-border/60 bg-background/90 px-3 py-2 backdrop-blur supports-backdrop-filter:bg-background/80">
          {/* Controles de Zoom */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= DEFAULT_ZOOM_CONFIG.min}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-15 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= DEFAULT_ZOOM_CONFIG.max}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          {/* Controles de Página */}
          {loadState.numPages && loadState.numPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {showPageIndicator && (
                <span className="text-sm font-medium">
                  Página {currentPage} de {loadState.numPages}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage >= loadState.numPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Área de Preview */}
      <div
        className={`scrollbar-custom relative flex flex-1 items-center justify-center overflow-auto overscroll-contain scroll-smooth bg-[radial-gradient(circle_at_top,rgba(30,58,138,0.06),transparent_32%),linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(241,245,249,1)_100%)] p-4 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.94)_0%,rgba(15,23,42,0.98)_100%)] ${viewportClassName}`}
        style={{ maxHeight, maxWidth }}
      >
        <Document
          file={fileSource}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          loading={
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Carregando PDF...</p>
            </div>
          }
          error={
            <div className="flex max-w-md flex-col items-center gap-3 p-6">
              <AlertCircle className="h-12 w-12 text-orange-500" />
              <div className="text-center space-y-2">
                <p className="text-base font-medium text-foreground">Preview não disponível</p>
                <p className="text-sm text-muted-foreground">
                  Não foi possível carregar o arquivo PDF para visualização
                </p>
                {loadState.error?.message && (
                  <p className="rounded bg-muted px-2 py-2 font-mono text-xs text-muted-foreground">
                    {loadState.error.message}
                  </p>
                )}
                <p className="mt-3 text-xs italic text-muted-foreground">
                  Você ainda pode continuar a operação usando os controles do painel lateral.
                </p>
              </div>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={zoom}
            width={pageWidth}
            height={pageHeight}
            renderTextLayer={renderTextLayer}
            renderAnnotationLayer={renderAnnotationLayer}
            className="shadow-lg"
          />
        </Document>
      </div>
    </div>
  );
}