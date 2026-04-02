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
import { FileText, GitCommitHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineSidebarItem } from './timeline-sidebar-item';
import type { TimelineItemUnificado } from './types';

interface TimelineSidebarProps {
  /** Lista de itens da timeline (documentos e movimentos) */
  items: TimelineItemUnificado[];
  /** ID do item atualmente selecionado, ou null se nenhum */
  selectedItemId: number | null;
  /** Callback chamado quando o usuário seleciona um item */
  onSelectItem: (item: TimelineItemUnificado) => void;
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
  className,
}: TimelineSidebarProps) {
  // Ordenar por data decrescente (mais recente primeiro)
  const itensOrdenados = useMemo(() => {
    return [...items].sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    );
  }, [items]);

  const totalDocumentos = useMemo(
    () => items.filter((i) => i.documento).length,
    [items]
  );
  const totalMovimentos = items.length - totalDocumentos;

  return (
    <div className={cn('flex h-full flex-col overflow-hidden bg-background', className)}>
      {/* Header com contagem e atalho CMD+K */}
      <div className="flex-none border-b px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {totalDocumentos} {totalDocumentos === 1 ? 'doc' : 'docs'}
            </span>
            <span className="inline-flex items-center gap-1">
              <GitCommitHorizontal className="h-3 w-3" />
              {totalMovimentos} {totalMovimentos === 1 ? 'mov' : 'movs'}
            </span>
          </div>
          <kbd className="flex items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-[9px]">&#x2318;</span>K
          </kbd>
        </div>
      </div>

      {/* Lista de itens com scroll */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-16 pt-3">
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
                isFirst={index === 0}
                isLast={index === itensOrdenados.length - 1}
                onSelect={onSelectItem}
              />
            ))}

            {/* Marcador de início do processo */}
            <div className="grid grid-cols-[48px_1fr] px-2 pb-6 pt-4 opacity-70">
              <div className="flex flex-col items-center gap-1">
                <div className="h-2 w-px bg-border" aria-hidden="true" />
                <div
                  className="size-3 rounded-full border border-border bg-muted"
                  aria-hidden="true"
                />
                <div className="h-8 w-px bg-transparent" aria-hidden="true" />
              </div>
              <div className="flex items-center border-b border-dashed border-border/70 pb-4">
                <p className="text-xs font-medium italic text-muted-foreground">
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
