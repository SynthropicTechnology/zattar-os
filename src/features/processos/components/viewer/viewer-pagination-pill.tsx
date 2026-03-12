'use client';

/**
 * ViewerPaginationPill
 *
 * Pílula flutuante com controles de paginação e zoom do visualizador de documentos.
 * Posicionada absolutamente na parte inferior central do container pai (relative).
 */

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViewerPaginationPillProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  zoomLevel: number; // percentual, ex: 100
  onZoomChange: (level: number) => void;
}

const ZOOM_STEP = 10;
const ZOOM_MIN = 50;
const ZOOM_MAX = 200;

export function ViewerPaginationPill({
  currentPage,
  totalPages,
  onPageChange,
  zoomLevel,
  onZoomChange,
}: ViewerPaginationPillProps) {
  // Estado local do input de página para permitir edição livre antes de confirmar
  const [inputValue, setInputValue] = useState(String(currentPage));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincroniza o input quando currentPage muda externamente
  useEffect(() => {
    setInputValue(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Permite apenas dígitos
    const val = e.target.value.replace(/\D/g, '');
    setInputValue(val);
  };

  const commitPageInput = () => {
    const parsed = parseInt(inputValue, 10);
    if (isNaN(parsed) || parsed < 1) {
      // Valor inválido — reverte para página atual
      setInputValue(String(currentPage));
      return;
    }
    const clamped = Math.min(Math.max(parsed, 1), totalPages);
    setInputValue(String(clamped));
    onPageChange(clamped);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitPageInput();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setInputValue(String(currentPage));
      inputRef.current?.blur();
    }
  };

  const handleZoomIn = () => {
    const next = Math.min(zoomLevel + ZOOM_STEP, ZOOM_MAX);
    onZoomChange(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(zoomLevel - ZOOM_STEP, ZOOM_MIN);
    onZoomChange(next);
  };

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;
  const canZoomIn = zoomLevel < ZOOM_MAX;
  const canZoomOut = zoomLevel > ZOOM_MIN;

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
      role="toolbar"
      aria-label="Controles de paginação e zoom"
    >
      <div className="flex items-center h-10 px-2 gap-0 rounded-full bg-card border shadow-sm">
        {/* Botão página anterior */}
        <button
          type="button"
          onClick={() => canPrev && onPageChange(currentPage - 1)}
          disabled={!canPrev}
          aria-label="Página anterior"
          className={cn(
            'flex items-center justify-center p-1.5 rounded-full transition-opacity',
            !canPrev ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Input de página atual */}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handlePageInputChange}
          onBlur={commitPageInput}
          onKeyDown={handlePageInputKeyDown}
          aria-label="Página atual"
          className="w-8 text-center bg-transparent border-none p-0 text-sm font-mono focus:outline-none focus:ring-0"
        />

        {/* Separador e total de páginas */}
        <span className="text-muted-foreground text-sm font-mono select-none">/</span>
        <span className="text-muted-foreground text-sm font-mono select-none ml-1">
          {totalPages}
        </span>

        {/* Botão próxima página */}
        <button
          type="button"
          onClick={() => canNext && onPageChange(currentPage + 1)}
          disabled={!canNext}
          aria-label="Próxima página"
          className={cn(
            'flex items-center justify-center p-1.5 rounded-full transition-opacity',
            !canNext ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Divisor vertical */}
        <div className="w-px h-4 bg-border mx-2 shrink-0" aria-hidden="true" />

        {/* Botão zoom in */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={!canZoomIn}
          aria-label={`Aumentar zoom (atual: ${zoomLevel}%)`}
          className={cn(
            'flex items-center justify-center p-1.5 rounded-full transition-opacity',
            !canZoomIn ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
          )}
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        {/* Botão zoom out */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={!canZoomOut}
          aria-label={`Diminuir zoom (atual: ${zoomLevel}%)`}
          className={cn(
            'flex items-center justify-center p-1.5 rounded-full transition-opacity',
            !canZoomOut ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted cursor-pointer'
          )}
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
