/**
 * TimelineSearchFilters
 *
 * Botões de filtro rápido (pills) para a busca da timeline.
 * Permite filtrar por tipo de evento: decisões, itens com anexo ou documentos.
 */

'use client';

import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface TimelineSearchFiltersProps {
  /** Conjunto de filtros ativos (por chave) */
  activeFilters: Set<string>;
  /** Callback para alternar um filtro */
  onToggleFilter: (filter: string) => void;
}

// ---------------------------------------------------------------------------
// Definição dos filtros disponíveis
// ---------------------------------------------------------------------------

const FILTROS = [
  { key: 'decisoes', label: 'Apenas Decisões' },
  { key: 'com_anexos', label: 'Com Anexos' },
  { key: 'documentos', label: 'Documentos' },
] as const;

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

/**
 * Linha de filtros rápidos para o modal de busca da timeline.
 *
 * @example
 * <TimelineSearchFilters
 *   activeFilters={activeFilters}
 *   onToggleFilter={toggleFilter}
 * />
 */
export function TimelineSearchFilters({
  activeFilters,
  onToggleFilter,
}: TimelineSearchFiltersProps) {
  return (
    <div
      className="flex gap-2 px-4 py-3 border-b overflow-x-auto bg-muted/30"
      role="group"
      aria-label="Filtros rápidos"
    >
      {FILTROS.map((filtro) => {
        const isAtivo = activeFilters.has(filtro.key);

        return (
          <button
            key={filtro.key}
            type="button"
            role="checkbox"
            aria-checked={isAtivo}
            onClick={() => onToggleFilter(filtro.key)}
            className={cn(
              'h-7 shrink-0 rounded px-3 text-[13px] font-medium transition-colors cursor-pointer',
              isAtivo
                ? 'border border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                : 'border bg-card text-foreground hover:border-primary/30'
            )}
          >
            {filtro.label}
          </button>
        );
      })}
    </div>
  );
}
