'use client';

/**
 * YearFilterPopover - Seletor de ano no formato de filtro
 *
 * Segue o mesmo estilo visual do FilterPopover (border-dashed, bg-card, h-9).
 * Mostra um grid 5×4 de anos no popover com navegação por página.
 */

import * as React from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AppBadge } from '@/components/ui/app-badge';
import { Separator } from '@/components/ui/separator';

// =============================================================================
// TIPOS
// =============================================================================

interface YearFilterPopoverProps {
  /** Ano selecionado */
  selectedYear: number;
  /** Callback quando um ano é selecionado */
  onYearChange: (year: number) => void;
  /** Classe CSS adicional */
  className?: string;
}

// =============================================================================
// CONSTANTES
// =============================================================================

const VISIBLE_YEARS = 20;

// =============================================================================
// COMPONENTE
// =============================================================================

export function YearFilterPopover({
  selectedYear,
  onYearChange,
  className,
}: YearFilterPopoverProps) {
  const currentYear = new Date().getFullYear();
  const [open, setOpen] = React.useState(false);
  const [startYear, setStartYear] = React.useState(() =>
    selectedYear - Math.floor(VISIBLE_YEARS / 2)
  );

  // Gerar array de anos visíveis
  const years = React.useMemo(
    () => Array.from({ length: VISIBLE_YEARS }, (_, i) => startYear + i),
    [startYear]
  );

  // Navegação de página
  const handlePrevPage = React.useCallback(() => {
    setStartYear((prev) => prev - VISIBLE_YEARS);
  }, []);

  const handleNextPage = React.useCallback(() => {
    setStartYear((prev) => prev + VISIBLE_YEARS);
  }, []);

  // Selecionar ano
  const handleSelect = React.useCallback(
    (year: number) => {
      onYearChange(year);
      setOpen(false);
    },
    [onYearChange]
  );

  // Ir para ano atual
  const handleGoToCurrentYear = React.useCallback(() => {
    onYearChange(currentYear);
    setStartYear(currentYear - Math.floor(VISIBLE_YEARS / 2));
    setOpen(false);
  }, [currentYear, onYearChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('h-9 border-dashed bg-card', className)}
        >
          <Calendar className="h-4 w-4" />
          Ano
          <AppBadge
            variant="secondary"
            className="ml-1 rounded-sm px-1.5 font-normal"
          >
            {selectedYear}
          </AppBadge>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-3" align="start">
        {/* Header com navegação de página */}
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="icon" aria-label="Período anterior"
            className="h-7 w-7"
            onClick={handlePrevPage}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Período anterior</span>
          </Button>
          <span className="text-sm font-medium text-muted-foreground select-none">
            {startYear} – {startYear + VISIBLE_YEARS - 1}
          </span>
          <Button
            variant="ghost"
            size="icon" aria-label="Próximo período"
            className="h-7 w-7"
            onClick={handleNextPage}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Próximo período</span>
          </Button>
        </div>

        {/* Grid de anos */}
        <div className="grid grid-cols-5 gap-1">
          {years.map((year) => (
            <button
              key={year}
              type="button"
              onClick={() => handleSelect(year)}
              className={cn(
                'h-8 rounded-md text-sm transition-colors',
                year === selectedYear &&
                  'bg-primary text-primary-foreground font-semibold',
                year === currentYear &&
                  year !== selectedYear &&
                  'bg-accent font-semibold',
                year !== selectedYear &&
                  year !== currentYear &&
                  'hover:bg-muted text-muted-foreground'
              )}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Link para ano atual */}
        {selectedYear !== currentYear && (
          <>
            <Separator className="my-2" />
            <button
              type="button"
              onClick={handleGoToCurrentYear}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ir para ano atual ({currentYear})
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
