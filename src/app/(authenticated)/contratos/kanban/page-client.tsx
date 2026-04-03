'use client';

/**
 * KanbanContratosClient — Quadro Kanban de Contratos
 *
 * Componente cliente principal da página /app/contratos/kanban.
 * - Seletor de segmento no topo (DataTableToolbar)
 * - Kanban board com colunas = estágios do pipeline
 * - Drag & drop via @dnd-kit (Kanban UI component)
 * - Atualização otimista ao mover contratos entre colunas
 *
 * @example
 * // Renderizado pelo server component page.tsx
 * <KanbanContratosClient />
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, Settings, List, Kanban as KanbanIcon } from 'lucide-react';
import { toast } from 'sonner';

import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanItem,
  KanbanOverlay,
} from '@/components/ui/kanban';
import { DataShell } from '@/components/shared/data-shell/data-shell';
import { DataTableToolbar } from '@/components/shared/data-shell/data-table-toolbar';
import { ViewModePopover, type ViewModeOption } from '@/components/shared/view-mode-popover';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import {
  useSegmentos,
  useKanbanContratos,
  SEM_ESTAGIO_KEY,
  type KanbanContrato,
  type KanbanColumns,
} from '@/app/(authenticated)/contratos/hooks';
import type { ContratoPipelineEstagio } from '@/app/(authenticated)/contratos/pipelines/types';

// =============================================================================
// VIEW MODE OPTIONS
// =============================================================================

const CONTRATOS_VIEW_OPTIONS: ViewModeOption[] = [
  { value: 'lista', label: 'Lista', icon: List },
  { value: 'quadro', label: 'Kanban', icon: KanbanIcon },
];

// =============================================================================
// HELPERS
// =============================================================================

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// =============================================================================
// CARD DE CONTRATO
// =============================================================================

interface ContratoCardProps {
  contrato: KanbanContrato;
  stageCor: string;
}

function ContratoCard({ contrato, stageCor }: ContratoCardProps) {
  return (
    <div
      className="bg-card rounded-md border shadow-sm p-3 flex flex-col gap-1.5 text-sm"
      style={{ borderLeft: `3px solid ${stageCor}` }}
    >
      <p className="font-semibold text-foreground leading-tight line-clamp-2">
        {contrato.clienteNome}
      </p>
      <div className="flex flex-wrap gap-1 mt-0.5">
        <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5 font-normal">
          {contrato.tipoContrato}
        </Badge>
        <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 font-normal">
          {contrato.tipoCobranca}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatDate(contrato.cadastradoEm)}
      </p>
    </div>
  );
}

// =============================================================================
// COLUNA DO KANBAN
// =============================================================================

interface KanbanColumnContentProps {
  estagioId: string;
  estagio: ContratoPipelineEstagio | null;
  contratos: KanbanContrato[];
}

function KanbanColumnContent({
  estagioId,
  estagio,
  contratos,
}: KanbanColumnContentProps) {
  const cor = estagio?.cor ?? '#6B7280';
  const nome = estagio?.nome ?? 'Sem estágio';

  return (
    <KanbanColumn
      value={estagioId}
      className="bg-muted/60 min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 shrink-0"
    >
      {/* Header da coluna */}
      <div
        className="flex items-center justify-between px-2 py-2 rounded-md mb-1"
        style={{ borderTop: `3px solid ${cor}` }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: cor }}
            aria-hidden="true"
          />
          <span className="font-semibold text-sm text-foreground leading-tight">
            {nome}
          </span>
        </div>
        <Badge
          variant="secondary"
          className="text-xs h-5 px-1.5 font-mono tabular-nums"
          aria-label={`${contratos.length} contratos`}
        >
          {contratos.length}
        </Badge>
      </div>

      {/* Cards */}
      {contratos.length === 0 ? (
        <div className="flex items-center justify-center h-16 text-xs text-muted-foreground border border-dashed rounded-md">
          Nenhum contrato
        </div>
      ) : (
        contratos.map((contrato) => (
          <KanbanItem
            key={contrato.id}
            value={String(contrato.id)}
            asHandle
            className="rounded-md"
          >
            <ContratoCard contrato={contrato} stageCor={cor} />
          </KanbanItem>
        ))
      )}
    </KanbanColumn>
  );
}

// =============================================================================
// SKELETON DO BOARD
// =============================================================================

function KanbanBoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-2 min-w-60 max-w-60 sm:min-w-70 sm:max-w-70 bg-muted/60 rounded-lg p-2.5"
        >
          <div className="flex items-center justify-between mb-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {Array.from({ length: i % 2 === 0 ? 3 : 2 }).map((_, j) => (
            <Skeleton key={j} className="h-24 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATES
// =============================================================================

function EmptyNoPipeline({ segmentoNome }: { segmentoNome: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-4xl" aria-hidden="true">
        🗂️
      </div>
      <p className="text-base font-semibold text-foreground">
        Nenhum pipeline configurado
      </p>
      <p className="text-sm text-muted-foreground max-w-sm">
        O segmento <strong>{segmentoNome}</strong> ainda não possui um pipeline
        de contratos. Configure um pipeline nas configurações para visualizar o
        kanban.
      </p>
    </div>
  );
}

function EmptyNoSegmento() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <p className="text-base font-semibold text-foreground">
        Selecione um segmento
      </p>
      <p className="text-sm text-muted-foreground max-w-sm">
        Escolha um segmento acima para visualizar o quadro kanban de contratos.
      </p>
    </div>
  );
}

// =============================================================================
// BOARD PRINCIPAL
// =============================================================================

interface KanbanBoardContentProps {
  columns: KanbanColumns;
  estagioMap: Map<number, ContratoPipelineEstagio>;
  onMove: (contratoId: number, newEstagioId: number) => Promise<void>;
}

function KanbanBoardContent({
  columns,
  estagioMap,
  onMove,
}: KanbanBoardContentProps) {
  /**
   * O Kanban component gerencia state interno de ordering.
   * onValueChange é chamado durante o drag (para atualização visual imediata),
   * mas a persistência real acontece no onDragEnd via onMove.
   */
  const [localColumns, setLocalColumns] = React.useState<KanbanColumns>(columns);

  // Sincronizar quando as colunas externas mudam (ex: após refetch)
  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const handleValueChange = React.useCallback(
    (newColumns: Record<string | number, KanbanContrato[]>) => {
      setLocalColumns(newColumns as KanbanColumns);
    },
    []
  );

  const handleDragEnd = React.useCallback(
    async (event: { active: { id: string | number }; over: { id: string | number } | null }) => {
      const { active, over } = event;
      if (!over) return;

      // Identificar a coluna de destino
      // Se o over.id é uma coluna, use-o diretamente. Senão, encontre a coluna
      // que contém o item destino.
      const overId = String(over.id);
      const isColumn = overId in localColumns;

      let targetColumnKey: string | null = null;

      if (isColumn) {
        targetColumnKey = overId;
      } else {
        // O item dropped sobre outro item — encontrar qual coluna o contém
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

      // Verificar se o item já estava nessa coluna (não precisa persistir)
      const sourceColumn = Object.entries(localColumns).find(([, items]) =>
        items.some((item) => item.id === contratoId)
      );
      if (sourceColumn?.[0] === targetColumnKey) return;

      try {
        await onMove(contratoId, newEstagioId);
      } catch {
        // O hook já faz rollback e loga o erro. Mostramos toast ao usuário.
        toast.error('Erro ao mover contrato. Tente novamente.');
        // Reverter localColumns para o estado externo (que já foi revertido no hook)
        setLocalColumns(columns);
      }
    },
    [localColumns, onMove, columns]
  );

  // Encontrar o contrato ativo para o overlay
  const getContratoById = React.useCallback(
    (id: string | number): KanbanContrato | null => {
      const numId = Number(id);
      for (const items of Object.values(localColumns)) {
        const found = items.find((item) => item.id === numId);
        if (found) return found;
      }
      return null;
    },
    [localColumns]
  );

  const getEstagioForColumn = React.useCallback(
    (colKey: string): ContratoPipelineEstagio | null => {
      if (colKey === SEM_ESTAGIO_KEY) return null;
      const id = Number(colKey);
      return estagioMap.get(id) ?? null;
    },
    [estagioMap]
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
          // Não exibir a coluna "sem_estagio" se estiver vazia
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

          // Encontrar o estágio do item sendo arrastado
          const cor = contrato.estagioId
            ? (estagioMap.get(contrato.estagioId)?.cor ?? '#6B7280')
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
// COMPONENTE PRINCIPAL
// =============================================================================

export function KanbanContratosClient() {
  const router = useRouter();

  const handleViewChange = React.useCallback((value: string) => {
    if (value === 'lista') {
      router.push('/app/contratos');
    }
  }, [router]);

  const [selectedSegmentoId, setSelectedSegmentoId] = React.useState<
    number | null
  >(null);

  const { segmentos, isLoading: segmentosLoading } = useSegmentos();
  const { pipeline, columns, isLoading, error, moveContrato, refetch } =
    useKanbanContratos(selectedSegmentoId);

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Auto-selecionar o primeiro segmento quando carregado
  React.useEffect(() => {
    if (segmentos.length > 0 && selectedSegmentoId === null) {
      setSelectedSegmentoId(segmentos[0]!.id);
    }
  }, [segmentos, selectedSegmentoId]);

  const estagioMap = React.useMemo(() => {
    const map = new Map<number, ContratoPipelineEstagio>();
    if (pipeline) {
      for (const estagio of pipeline.estagios) {
        map.set(estagio.id, estagio);
      }
    }
    return map;
  }, [pipeline]);

  const selectedSegmento = React.useMemo(
    () => segmentos.find((s) => s.id === selectedSegmentoId) ?? null,
    [segmentos, selectedSegmentoId]
  );

  const handleSegmentoChange = React.useCallback((value: string) => {
    setSelectedSegmentoId(Number(value));
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const totalContratos = React.useMemo(
    () =>
      Object.values(columns).reduce((sum, items) => sum + items.length, 0),
    [columns]
  );

  return (
    <DataShell
      ariaLabel="Quadro Kanban de Contratos"
      header={
        <DataTableToolbar
          title="Kanban de Contratos"
          filtersSlot={
            <Select
              value={selectedSegmentoId !== null ? String(selectedSegmentoId) : ''}
              onValueChange={handleSegmentoChange}
              disabled={segmentosLoading}
            >
              <SelectTrigger
                className="w-50 bg-card"
                aria-label="Selecionar segmento"
              >
                <SelectValue
                  placeholder={
                    segmentosLoading ? 'Carregando...' : 'Segmento'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {segmentos.map((segmento) => (
                  <SelectItem key={segmento.id} value={String(segmento.id)}>
                    {segmento.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          }
          actionSlot={
            <>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 bg-card"
                        aria-label="Configurações de contratos"
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Configurações</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/app/contratos/tipos">Tipos de Contrato</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/contratos/tipos-cobranca">Tipos de Cobrança</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/contratos/pipelines">Pipelines</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isLoading || isRefreshing}
                aria-label="Atualizar kanban"
                className={cn(
                  'inline-flex items-center justify-center rounded-md border border-input bg-card',
                  'h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  'transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  'disabled:pointer-events-none disabled:opacity-50'
                )}
              >
                <RefreshCw
                  className={cn(
                    'h-4 w-4',
                    (isLoading || isRefreshing) && 'animate-spin'
                  )}
                  aria-hidden="true"
                />
              </button>
            </>
          }
          viewModeSlot={
            <ViewModePopover
              value="quadro"
              onValueChange={handleViewChange}
              options={CONTRATOS_VIEW_OPTIONS}
            />
          }
        />
      }
    >
      {/* Estado de carregamento */}
      {isLoading && <KanbanBoardSkeleton />}

      {/* Erro */}
      {!isLoading && error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span className="font-semibold">Erro:</span> {error}
        </div>
      )}

      {/* Nenhum segmento selecionado */}
      {!isLoading && !error && selectedSegmentoId === null && (
        <EmptyNoSegmento />
      )}

      {/* Pipeline não configurado para o segmento */}
      {!isLoading &&
        !error &&
        selectedSegmentoId !== null &&
        pipeline === null && (
          <EmptyNoPipeline
            segmentoNome={selectedSegmento?.nome ?? 'selecionado'}
          />
        )}

      {/* Board */}
      {!isLoading && !error && pipeline !== null && (
        <>
          {/* Info bar: pipeline + total */}
          <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {pipeline.nome}
            </span>
            <span>•</span>
            <span>
              {totalContratos === 0
                ? 'Nenhum contrato'
                : totalContratos === 1
                  ? '1 contrato'
                  : `${totalContratos} contratos`}
            </span>
            <span>•</span>
            <span>
              {pipeline.estagios.length === 1
                ? '1 estágio'
                : `${pipeline.estagios.length} estágios`}
            </span>
          </div>

          <KanbanBoardContent
            columns={columns}
            estagioMap={estagioMap}
            onMove={moveContrato}
          />
        </>
      )}
    </DataShell>
  );
}
