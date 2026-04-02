/**
 * Timeline Container
 *
 * Container principal da timeline que renderiza lista completa de items
 * ordenados cronologicamente (descendente - mais recente primeiro).
 */

'use client';

import { useMemo } from 'react';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import { TimelineItem } from './timeline-item';
import { Card } from '@/components/ui/card';

interface TimelineContainerProps {
  items: TimelineItemEnriquecido[];
  isLoading?: boolean;
}

export function TimelineContainer({ items, isLoading = false }: TimelineContainerProps) {
  // Ordenar items por data (desc - mais recente primeiro)
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const dateA = new Date(a.data).getTime();
      const dateB = new Date(b.data).getTime();
      return dateB - dateA; // Descendente
    });
  }, [items]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (items.length === 0) {
    return null; // Empty state é tratado pelo componente pai
  }

  return (
    <div className="space-y-0">
      {/* Header da timeline */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Timeline do Processo</h2>
        <p className="text-sm text-muted-foreground">
          {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'itens'} •{' '}
          {sortedItems.filter((i) => i.documento).length} documentos •{' '}
          {sortedItems.filter((i) => !i.documento).length} movimentos
        </p>
      </div>

      {/* Lista de items */}
      <div className="relative">
        {sortedItems.map((item, index) => (
          <TimelineItem key={item.id} item={item} index={index} />
        ))}

        {/* Final da timeline */}
        <div className="relative flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-muted-foreground bg-muted">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            </div>
          </div>
          <div className="flex-1 pb-4">
            <p className="text-sm text-muted-foreground italic">
              Início do processo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
