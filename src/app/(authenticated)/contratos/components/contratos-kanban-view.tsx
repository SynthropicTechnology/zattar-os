'use client';

/**
 * ContratosKanbanView — Board Kanban puro, sem header/controles próprios.
 * ============================================================================
 * Componente "view" a ser renderizado dentro de `ContratosContent` quando o
 * usuário alterna para o modo Kanban. Recebe `segmentoId` e `search` via
 * props (controlled), e expõe `refetch` via ref-like callback.
 *
 * Só renderiza: estados de loading/erro/empty + o board em si. Toolbar e
 * page header ficam a cargo do orquestrador pai (ContratosContent).
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { Layers, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from '@/components/ui/kanban';
import { GlassPanel } from '@/components/shared/glass-panel';
import { EmptyState } from '@/components/shared/empty-state';
import { InsightBanner } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import {
  useKanbanContratos,
  SEM_ESTAGIO_KEY,
  type KanbanContrato,
  type KanbanColumns,
} from '@/app/(authenticated)/contratos/hooks';
import type { ContratoPipelineEstagio } from '@/app/(authenticated)/contratos/pipelines/types';
import { formatarData } from '../utils';
import {
  TIPO_CONTRATO_LABELS,
  TIPO_COBRANCA_LABELS,
  type TipoContrato,
  type TipoCobranca,
} from '../domain';

// =============================================================================
// CARD
// =============================================================================

function ContratoCard({ contrato, stageCor }: { contrato: KanbanContrato; stageCor: string }) {
  return (
    <GlassPanel
      depth={2}
      className="p-3 flex flex-col gap-1.5 text-sm"
      style={{ borderLeft: `3px solid ${stageCor}` }}
    >
      <p className="font-semibold text-foreground leading-tight line-clamp-2 text-[13px]">
        {contrato.clienteNome}
      </p>
      <div className="flex flex-wrap gap-1 mt-0.5">
        <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="text-[10px]">
          {TIPO_CONTRATO_LABELS[contrato.tipoContrato as TipoContrato] ?? contrato.tipoContrato}
        </SemanticBadge>
        <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="text-[10px]">
          {TIPO_COBRANCA_LABELS[contrato.tipoCobranca as TipoCobranca] ?? contrato.tipoCobranca}
        </SemanticBadge>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-0.5 tabular-nums">
        {formatarData(contrato.cadastradoEm)}
      </p>
    </GlassPanel>
  );
}

// =============================================================================
// COLUMN
// =============================================================================

function KanbanColumnContent({
  estagioId,
  estagio,
  contratos,
}: {
  estagioId: string;
  estagio: ContratoPipelineEstagio | null;
  contratos: KanbanContrato[];
}) {
  const cor = estagio?.cor ?? '#6B7280';
  const nome = estagio?.nome ?? 'Sem estágio';

  return (
    <KanbanColumn
      value={estagioId}
      className="min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 shrink-0"
    >
      <GlassPanel depth={1} className="flex flex-col gap-2 p-2.5 min-h-28">
        <div
          className="flex items-center justify-between px-1 pb-2 border-b-2"
          style={{ borderColor: cor }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cor }}
              aria-hidden="true"
            />
            <span className="font-heading text-xs font-semibold text-foreground truncate">
              {nome}
            </span>
          </div>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full bg-border/10 text-muted-foreground tabular-nums shrink-0"
            aria-label={`${contratos.length} contratos`}
          >
            {contratos.length}
          </span>
        </div>

        {contratos.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-[11px] text-muted-foreground/60 border border-dashed border-border/40 rounded-xl">
            Nenhum contrato
          </div>
        ) : (
          contratos.map((contrato) => (
            <KanbanItem
              key={contrato.id}
              value={String(contrato.id)}
              asHandle
              className="rounded-xl"
            >
              <ContratoCard contrato={contrato} stageCor={cor} />
            </KanbanItem>
          ))
        )}
      </GlassPanel>
    </KanbanColumn>
  );
}

// =============================================================================
// SKELETON / EMPTY STATES
// =============================================================================

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <GlassPanel
          key={i}
          depth={1}
          className="flex flex-col gap-2 min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 p-2.5"
        >
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-xl" />
          ))}
        </GlassPanel>
      ))}
    </div>
  );
}

function EmptyNoPipeline({ segmentoNome }: { segmentoNome: string }) {
  return (
    <EmptyState
      icon={Layers}
      title="Nenhum pipeline configurado"
      description={`O segmento "${segmentoNome}" ainda não possui um pipeline de contratos. Configure um pipeline nas configurações para visualizar o kanban.`}
      action={
        <Button asChild variant="outline">
          <Link href="/app/contratos/pipelines">Configurar pipeline</Link>
        </Button>
      }
    />
  );
}

function EmptyNoSegmento() {
  return (
    <EmptyState
      icon={FolderOpen}
      title="Selecione um segmento"
      description="Escolha um segmento na barra de filtros acima para visualizar o quadro."
    />
  );
}

// =============================================================================
// BOARD (gerencia drag&drop local)
// =============================================================================

function KanbanBoardContent({
  columns,
  estagioMap,
  onMove,
  search,
}: {
  columns: KanbanColumns;
  estagioMap: Map<number, ContratoPipelineEstagio>;
  onMove: (contratoId: number, newEstagioId: number) => Promise<void>;
  search: string;
}) {
  const filteredColumns = React.useMemo<KanbanColumns>(() => {
    if (!search.trim()) return columns;
    const q = search.trim().toLowerCase();
    const next: KanbanColumns = {} as KanbanColumns;
    for (const [key, items] of Object.entries(columns)) {
      next[key] = items.filter((c) => c.clienteNome?.toLowerCase().includes(q));
    }
    return next;
  }, [columns, search]);

  const [localColumns, setLocalColumns] = React.useState<KanbanColumns>(filteredColumns);
  React.useEffect(() => setLocalColumns(filteredColumns), [filteredColumns]);

  const handleValueChange = React.useCallback(
    (newColumns: Record<string | number, KanbanContrato[]>) => {
      setLocalColumns(newColumns as KanbanColumns);
    },
    [],
  );

  const handleDragEnd = React.useCallback(
    async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
      const { active, over } = event;
      if (!over) return;

      const overId = String(over.id);
      const isColumn = overId in localColumns;
      let targetColumnKey: string | null = null;

      if (isColumn) {
        targetColumnKey = overId;
      } else {
        for (const [colKey, items] of Object.entries(localColumns)) {
          if (items.some((item) => String(item.id) === overId)) {
            targetColumnKey = colKey;
            break;
          }
        }
      }

      if (!targetColumnKey || targetColumnKey === SEM_ESTAGIO_KEY) return;

      const contratoId = Number(active.id);
      const newEstagioId = Number(targetColumnKey);
      if (isNaN(contratoId) || isNaN(newEstagioId) || newEstagioId <= 0) return;

      const sourceColumn = Object.entries(localColumns).find(([, items]) =>
        items.some((item) => item.id === contratoId),
      );
      if (sourceColumn?.[0] === targetColumnKey) return;

      try {
        await onMove(contratoId, newEstagioId);
      } catch {
        toast.error('Erro ao mover contrato. Tente novamente.');
        setLocalColumns(filteredColumns);
      }
    },
    [localColumns, onMove, filteredColumns],
  );

  const getContratoById = React.useCallback(
    (id: string | number): KanbanContrato | null => {
      const numId = Number(id);
      for (const items of Object.values(localColumns)) {
        const found = items.find((item) => item.id === numId);
        if (found) return found;
      }
      return null;
    },
    [localColumns],
  );

  const getEstagioForColumn = React.useCallback(
    (colKey: string): ContratoPipelineEstagio | null => {
      if (colKey === SEM_ESTAGIO_KEY) return null;
      const id = Number(colKey);
      return estagioMap.get(id) ?? null;
    },
    [estagioMap],
  );

  return (
    <Kanban
      value={localColumns}
      onValueChange={handleValueChange}
      onDragEnd={handleDragEnd as never}
      getItemValue={(item: KanbanContrato) => String(item.id)}
      flatCursor
    >
      <KanbanBoard className="overflow-x-auto pb-4 pt-2 items-start">
        {Object.entries(localColumns).map(([colKey, items]) => {
          const estagio = getEstagioForColumn(colKey);
          if (colKey === SEM_ESTAGIO_KEY && items.length === 0) return null;
          return (
            <KanbanColumnContent
              key={colKey}
              estagioId={colKey}
              estagio={estagio}
              contratos={items}
            />
          );
        })}
      </KanbanBoard>

      <KanbanOverlay>
        {({ value, variant }) => {
          if (variant !== 'item') return null;
          const contrato = getContratoById(value);
          if (!contrato) return null;
          const cor = contrato.estagioId
            ? estagioMap.get(contrato.estagioId)?.cor ?? '#6B7280'
            : '#6B7280';
          return (
            <div className="min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 opacity-95 shadow-lg rotate-1">
              <ContratoCard contrato={contrato} stageCor={cor} />
            </div>
          );
        }}
      </KanbanOverlay>
    </Kanban>
  );
}

// =============================================================================
// MAIN COMPONENT (exportado)
// =============================================================================

export interface ContratosKanbanViewProps {
  /** Segmento selecionado. Se null, exibe EmptyNoSegmento. */
  segmentoId: number | null;
  /** Nome do segmento atual (para mensagens de empty state). */
  segmentoNome?: string | null;
  /** Busca client-side por nome do cliente. */
  search?: string;
}

export function ContratosKanbanView({
  segmentoId,
  segmentoNome,
  search = '',
}: ContratosKanbanViewProps) {
  const { pipeline, columns, isLoading, error, moveContrato } = useKanbanContratos(segmentoId);

  const estagioMap = React.useMemo(() => {
    const map = new Map<number, ContratoPipelineEstagio>();
    if (pipeline) {
      for (const estagio of pipeline.estagios) {
        map.set(estagio.id, estagio);
      }
    }
    return map;
  }, [pipeline]);

  if (segmentoId === null) return <EmptyNoSegmento />;
  if (isLoading) return <KanbanBoardSkeleton />;
  if (error) return <InsightBanner type="alert">{error}</InsightBanner>;
  if (pipeline === null) return <EmptyNoPipeline segmentoNome={segmentoNome ?? 'selecionado'} />;

  return (
    <KanbanBoardContent
      columns={columns}
      estagioMap={estagioMap}
      onMove={moveContrato}
      search={search}
    />
  );
}
