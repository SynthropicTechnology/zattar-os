'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { TimelineItemUnificado } from '../timeline/types';
import type { GrauProcesso } from '@/app/(authenticated)/partes';
import { TimelineFilterChips } from './timeline-filter-chips';
import { TimelineMonthGroup } from './timeline-month-group';
import { TimelineNowMarker } from './timeline-now-marker';
import {
  type TimelineFilterType,
  type FutureTimelineItem,
  FILTER_TERMS,
} from './types';

interface PulseTimelineProps {
  items: TimelineItemUnificado[];
  futureItems?: FutureTimelineItem[];
  selectedItemId: number | null;
  onSelectItem: (item: TimelineItemUnificado) => void;
  onSelectFutureItem?: (item: FutureTimelineItem) => void;
  processoId: number;
  graus?: GrauProcesso[];
  className?: string;
}

function groupByMonth(items: TimelineItemUnificado[]): Map<string, TimelineItemUnificado[]> {
  const groups = new Map<string, TimelineItemUnificado[]>();
  for (const item of items) {
    try {
      const key = format(new Date(item.data), 'MMMM yyyy', { locale: ptBR });
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      const existing = groups.get(capitalizedKey) ?? [];
      existing.push(item);
      groups.set(capitalizedKey, existing);
    } catch {
      // skip items with invalid dates
    }
  }
  return groups;
}

function filterItems(
  items: TimelineItemUnificado[],
  filter: TimelineFilterType,
  grau: GrauProcesso | 'todos'
): TimelineItemUnificado[] {
  let filtered = items;

  if (filter !== 'todos') {
    if (filter === 'documentos') {
      filtered = filtered.filter((item) => item.documento);
    } else {
      const terms = FILTER_TERMS[filter];
      filtered = filtered.filter((item) =>
        terms.some((term) => item.titulo.toLowerCase().includes(term))
      );
    }
  }

  if (grau !== 'todos') {
    filtered = filtered.filter((item) => item.grauOrigem === grau);
  }

  return filtered;
}

export function PulseTimeline({
  items,
  futureItems = [],
  selectedItemId,
  onSelectItem,
  onSelectFutureItem,
  processoId,
  graus,
  className,
}: PulseTimelineProps) {
  const nowRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<TimelineFilterType>('todos');
  const [activeGrau, setActiveGrau] = useState<GrauProcesso | 'todos'>('todos');

  const lastVisitKey = `processo_last_visit_${processoId}`;

  useEffect(() => {
    localStorage.setItem(lastVisitKey, new Date().toISOString());
  }, [lastVisitKey]);

  const counts = useMemo(() => {
    const docs = items.filter((i) => i.documento).length;
    return { docs, movs: items.length - docs, total: items.length };
  }, [items]);

  const filteredItems = useMemo(
    () => filterItems(items, activeFilter, activeGrau),
    [items, activeFilter, activeGrau]
  );

  const now = useMemo(() => new Date(), []);

  const pastItems = useMemo(
    () =>
      filteredItems
        .filter((item) => new Date(item.data) <= now)
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    [filteredItems, now]
  );

  const pastGroups = useMemo(() => groupByMonth(pastItems), [pastItems]);

  useEffect(() => {
    const timer = setTimeout(() => {
      nowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={cn('flex h-full flex-col overflow-hidden bg-background', className)}>
      <TimelineFilterChips
        counts={counts}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        graus={graus}
        activeGrau={activeGrau}
        onGrauChange={setActiveGrau}
      />

      <div className="min-h-0 flex-1 overflow-y-auto pb-16">
        {futureItems.length > 0 && (
          <div className="opacity-70 pt-2">
            <div className="px-4 py-1">
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground/30 font-semibold">
                Próximos eventos
              </span>
            </div>
            {futureItems
              .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
              .map((fi) => (
                <button
                  key={fi.id}
                  type="button"
                  onClick={() => onSelectFutureItem?.(fi)}
                  className="group flex w-full cursor-pointer hover:bg-white/4 px-4 py-2"
                >
                  <div className="grid grid-cols-[48px_1fr] w-full">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-px h-2 bg-border/30" />
                      <div className="size-5 rounded-full border-2 border-primary/30 flex items-center justify-center">
                        <div className="size-1.5 rounded-full bg-primary/30" />
                      </div>
                      <div className="w-px grow bg-border/30 mt-1" />
                    </div>
                    <div className="flex flex-col justify-center pb-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-primary/8 text-primary/50 border border-primary/10">
                          {fi.tipo === 'audiencia' ? 'Audiência' : fi.tipo === 'expediente' ? 'Prazo' : 'Perícia'}
                        </span>
                        <span className="text-xs text-muted-foreground/50 font-mono shrink-0">
                          {format(new Date(fi.data), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-tight line-clamp-2 text-foreground/60 text-left">
                        {fi.titulo}
                      </p>
                      {fi.subtitulo && (
                        <p className="text-[10px] text-muted-foreground/40 mt-0.5 text-left">{fi.subtitulo}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}

        <TimelineNowMarker ref={nowRef} />

        {Array.from(pastGroups.entries()).map(([monthLabel, monthItems]) => (
          <TimelineMonthGroup
            key={monthLabel}
            label={monthLabel}
            items={monthItems}
            selectedItemId={selectedItemId}
            onSelectItem={(item) => {
              onSelectItem(item);
            }}
            defaultExpanded
          />
        ))}

        {pastItems.length > 0 && (
          <div className="grid grid-cols-[48px_1fr] px-2 pb-6 pt-4 opacity-70">
            <div className="flex flex-col items-center gap-1">
              <div className="h-2 w-px bg-border" />
              <div className="size-3 rounded-full border border-border bg-muted" />
              <div className="h-8 w-px bg-transparent" />
            </div>
            <div className="flex items-center border-b border-dashed border-border/70 pb-4">
              <p className="text-xs font-medium italic text-muted-foreground">
                Início do processo
              </p>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && futureItems.length === 0 && (
          <div className="px-4 py-12 text-center">
            <p className="text-xs text-muted-foreground italic">
              Nenhum item encontrado com os filtros aplicados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
