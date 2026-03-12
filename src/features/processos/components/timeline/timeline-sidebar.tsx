'use client';

/**
 * TimelineSidebar
 *
 * Contêiner principal da sidebar da timeline de processos.
 * Exibe o card de contexto do processo e a lista cronológica de itens.
 *
 * Os itens são ordenados por data decrescente (mais recente primeiro).
 * A busca é feita via modal CMD+K (componente TimelineSearchModal).
 */

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { TimelineContextCard } from './timeline-context-card';
import { TimelineSidebarItem } from './timeline-sidebar-item';
import type { TimelineItemUnificado } from './types';

interface TimelineSidebarProps {
  /** Lista de itens da timeline (documentos e movimentos) */
  items: TimelineItemUnificado[];
  /** ID do item atualmente selecionado, ou null se nenhum */
  selectedItemId: number | null;
  /** Callback chamado quando o usuário seleciona um item */
  onSelectItem: (item: TimelineItemUnificado) => void;
  /** Informações contextuais do processo para exibição no topo */
  processo?: {
    numeroProcesso: string;
    partes: string;
    orgao: string;
  };
  /** Classes adicionais para o contêiner raiz */
  className?: string;
}

/**
 * Sidebar completa da timeline do processo.
 *
 * @example
 * <TimelineSidebar
 *   items={timelineItems}
 *   selectedItemId={selectedId}
 *   onSelectItem={(item) => setSelectedId(item.id)}
 *   processo={{
 *     numeroProcesso: "1002345-67.2023.8.26.0100",
 *     partes: "João da Silva vs. Empresa X",
 *     orgao: "3ª Vara Cível - Foro Central",
 *   }}
 * />
 */
export function TimelineSidebar({
  items,
  selectedItemId,
  onSelectItem,
  processo,
  className,
}: TimelineSidebarProps) {
  // Ordenar por data decrescente (mais recente primeiro)
  const itensOrdenados = useMemo(() => {
    return [...items].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [items]);

  return (
    <div className={cn('flex flex-col h-full bg-card', className)}>
      {/* Card de contexto do processo (fixo no topo) */}
      {processo && (
        <TimelineContextCard
          numeroProcesso={processo.numeroProcesso}
          partes={processo.partes}
          orgao={processo.orgao}
        />
      )}

      {/* Lista de itens com scroll — sem header de busca, CMD+K é o mecanismo de busca */}
      <div className="flex-1 overflow-y-auto py-2 min-h-0">
        {itensOrdenados.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-xs text-muted-foreground italic">
              Nenhum item na timeline.
            </p>
          </div>
        ) : (
          <>
            {itensOrdenados.map((item, index) => (
              <TimelineSidebarItem
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                isLast={index === itensOrdenados.length - 1}
                onSelect={onSelectItem}
              />
            ))}

            {/* Marcador de início do processo */}
            <div className="opacity-60 grid grid-cols-[48px_1fr] px-2 py-3">
              <div className="flex flex-col items-center gap-1">
                <div className="w-px h-2 bg-border" aria-hidden="true" />
                <div
                  className="size-3 rounded-full bg-muted border border-border"
                  aria-hidden="true"
                />
              </div>
              <div className="flex items-center">
                <p className="text-xs font-medium text-muted-foreground italic">
                  Início do processo
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
