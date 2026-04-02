'use client';

/**
 * TimelineSidebarItem
 *
 * Item individual da timeline na sidebar. Exibe o ícone tipado do evento,
 * linha de conexão vertical, badge de tipo e título do item processual.
 *
 * Quando selecionado, exibe destaque com borda primária à esquerda e
 * fundo sutil. O ícone reflete as cores do tipo de evento.
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { getTimelineItemMeta } from './constants';
import { TimelineTypeBadge } from './timeline-type-badge';
import type { TimelineItemUnificado } from './types';

interface TimelineSidebarItemProps {
  /** Item de timeline com dados enriquecidos */
  item: TimelineItemUnificado;
  /** Indica se este item está atualmente selecionado */
  isSelected: boolean;
  /** Indica se é o primeiro item da lista (omite a linha de conexão superior) */
  isFirst: boolean;
  /** Indica se é o último item da lista (omite a linha de conexão inferior) */
  isLast: boolean;
  /** Callback chamado ao clicar no item */
  onSelect: (item: TimelineItemUnificado) => void;
}

/**
 * Formata uma data ISO para exibição curta no formato "dd/MM/yy".
 */
function formatarDataCurta(data: string): string {
  try {
    return format(new Date(data), 'dd/MM/yy', { locale: ptBR });
  } catch {
    return '';
  }
}

/**
 * Item de timeline para a sidebar do processo.
 *
 * @example
 * <TimelineSidebarItem
 *   item={timelineItem}
 *   isSelected={selectedId === timelineItem.id}
 *   isLast={index === items.length - 1}
 *   onSelect={(item) => setSelectedId(item.id)}
 * />
 */
export function TimelineSidebarItem({
  item,
  isSelected,
  isFirst,
  isLast,
  onSelect,
}: TimelineSidebarItemProps) {
  const meta = getTimelineItemMeta(item.titulo, item.documento);
  const Icon = meta.icon;
  const dataFormatada = formatarDataCurta(item.data);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect(item)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(item);
        }
      }}
      className={cn(
        'group relative flex cursor-pointer hover:bg-accent/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        isSelected && 'bg-primary/5 dark:bg-primary/10'
      )}
    >
      {/* Indicador de seleção: borda primária à esquerda */}
      {isSelected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-0.75 bg-primary"
          aria-hidden="true"
        />
      )}

      {/* Grid: coluna do ícone + linha | coluna do conteúdo */}
      <div className="grid grid-cols-[48px_1fr] w-full px-2 py-3">

        {/* Coluna esquerda: linha superior + ícone + linha inferior */}
        <div className="flex flex-col items-center gap-1">
          {/* Linha conectora superior (transparente no primeiro item — topo da cadeia temporal) */}
          <div
            className={cn('w-px h-2', isFirst ? 'bg-transparent' : 'bg-border')}
            aria-hidden="true"
          />

          {/* Círculo com ícone do tipo de evento */}
          <div
            className={cn(
              'flex items-center justify-center size-6 rounded-full bg-card border',
              isSelected
                ? 'border-primary text-primary'
                : cn('border-border', meta.colorClass)
            )}
            aria-hidden="true"
          >
            <Icon className="h-3.5 w-3.5" />
          </div>

          {/* Linha conectora inferior (oculta no último item) */}
          {!isLast && (
            <div
              className="w-px grow bg-border mt-1"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Coluna direita: badge + data + título */}
        <div className="flex flex-col justify-center pb-1">
          {/* Linha 1: badge de tipo + grau + data */}
          <div className="flex items-center gap-2 mb-1">
            <TimelineTypeBadge
              label={meta.badgeLabel}
              bgClass={meta.badgeBgClass}
              textClass={meta.badgeTextClass}
              borderClass={meta.badgeBorderClass}
            />
            {item.grauOrigem && (
              <span className="rounded border bg-muted/40 px-1 py-px text-[9px] font-medium uppercase tracking-wider text-muted-foreground shrink-0">
                {item.grauOrigem === 'primeiro_grau'
                  ? '1º'
                  : item.grauOrigem === 'segundo_grau'
                    ? '2º'
                    : 'TST'}
              </span>
            )}
            <span className="text-xs text-muted-foreground font-mono shrink-0">
              {dataFormatada}
            </span>
          </div>

          {/* Linha 2: título do item */}
          <p
            className={cn(
              'text-sm font-medium leading-tight line-clamp-2',
              isSelected
                ? 'text-primary'
                : 'text-foreground/70 group-hover:text-foreground'
            )}
          >
            {item.titulo}
          </p>
        </div>
      </div>
    </div>
  );
}
