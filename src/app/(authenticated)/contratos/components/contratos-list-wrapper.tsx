'use client';

/**
 * ContratosListWrapper — Orquestrador Glass Briefing da lista de contratos.
 * ============================================================================
 * Substitui o `ContratosTableWrapper` (DataTable/TanStack) por uma lista no
 * padrão Audiências/Expedientes:
 *
 *   ContratosGlassList → server-side pagination → bulk actions bar → dialogs
 *
 * Recebe busca/filtros/ordenação controlados externamente pelo
 * `ContratosContent`. Mantém integração completa com ações em massa, dialogs
 * de criação, edição, exclusão, geração de peça e agent context do Copilot.
 * ============================================================================
 */

import * as React from 'react';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { useDebounce } from '@/hooks/use-debounce';
import { DataPagination } from '@/components/shared/data-shell';

import { ContratosGlassList } from './contratos-glass-list';
import { ContratoForm } from './contrato-form';
import { ContratoDeleteDialog } from './contrato-delete-dialog';
import {
  ContratosBulkActionsBar,
  AlterarStatusMassaDialog,
  AtribuirResponsavelMassaDialog,
  AlterarSegmentoMassaDialog,
  ExcluirMassaDialog,
} from './contratos-bulk-actions';
import { GerarPecaDialog } from '@/app/(authenticated)/pecas-juridicas';

import type {
  Contrato,
  ListarContratosParams,
  TipoContrato,
  TipoCobranca,
  StatusContrato,
  ContratoSortBy,
  Ordem,
} from '../domain';
import type { PaginationInfo, ClienteInfo } from '../types';
import {
  actionListarContratos,
  actionResolverNomesEntidadesContrato,
} from '../actions';

// =============================================================================
// TYPES
// =============================================================================

export interface ContratosListWrapperProps {
  initialData?: Contrato[];
  initialPagination?: PaginationInfo | null;
  clientesOptions?: ClienteInfo[];
  partesContrariasOptions?: ClienteInfo[];
  usuariosOptions?: ClienteInfo[];
  segmentosOptions?: Array<{ id: number; nome: string }>;

  /** Filtro de status externo (ex.: vindo do PipelineStepper). null = sem filtro. */
  statusFilter?: string | null;

  /** Controlled open state para o dialog de criação. */
  createOpen?: boolean;
  onCreateOpenChange?: (open: boolean) => void;

  /** Filtros controlados pelo orquestrador (ContratosContent). */
  busca?: string;
  segmentoId?: string;
  tipoContrato?: string;
  tipoCobranca?: string;

  /** Ordenação controlada pelo orquestrador. */
  ordenarPor?: ContratoSortBy;
  ordem?: Ordem;
}

// =============================================================================
// MAIN
// =============================================================================

export function ContratosListWrapper({
  initialData = [],
  initialPagination = null,
  clientesOptions = [],
  partesContrariasOptions = [],
  usuariosOptions = [],
  segmentosOptions = [],
  statusFilter: externalStatusFilter,
  createOpen: externalCreateOpen,
  onCreateOpenChange: externalOnCreateOpenChange,
  busca: externalBusca,
  segmentoId: externalSegmentoId,
  tipoContrato: externalTipoContrato,
  tipoCobranca: externalTipoCobranca,
  ordenarPor: externalOrdenarPor,
  ordem: externalOrdem,
}: ContratosListWrapperProps) {
  // ── Estado dos dados ─────────────────────────────────────────────────────
  const [contratos, setContratos] = React.useState<Contrato[]>(initialData);

  const [clientesOptionsState, setClientesOptionsState] = React.useState<ClienteInfo[]>(clientesOptions);
  const [partesContrariasOptionsState, setPartesContrariasOptionsState] =
    React.useState<ClienteInfo[]>(partesContrariasOptions);
  const [usuariosOptionsState, setUsuariosOptionsState] = React.useState<ClienteInfo[]>(usuariosOptions);
  const [segmentos] = React.useState(segmentosOptions);

  // ── Paginação ────────────────────────────────────────────────────────────
  const [pageIndex, setPageIndex] = React.useState(initialPagination ? initialPagination.page - 1 : 0);
  const [pageSize, setPageSize] = React.useState(initialPagination ? initialPagination.limit : 50);
  const [total, setTotal] = React.useState(initialPagination ? initialPagination.total : 0);
  const [totalPages, setTotalPages] = React.useState(initialPagination ? initialPagination.totalPages : 0);

  // ── Loading / error ──────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = React.useState(false);
  const [, setError] = React.useState<string | null>(null);

  // ── Filtros (sincronizados com props externas) ───────────────────────────
  const [busca, setBusca] = React.useState(externalBusca ?? '');
  const [segmentoId, setSegmentoId] = React.useState<string>(externalSegmentoId ?? '');
  const [tipoContrato, setTipoContrato] = React.useState<string>(externalTipoContrato ?? '');
  const [tipoCobranca, setTipoCobranca] = React.useState<string>(externalTipoCobranca ?? '');
  const [status, setStatus] = React.useState<string>(externalStatusFilter ?? '');

  // ── Seleção em massa (Set<number>) ───────────────────────────────────────
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  // ── Dialogs ──────────────────────────────────────────────────────────────
  const [internalCreateOpen, setInternalCreateOpen] = React.useState(false);
  const createOpen = externalCreateOpen ?? internalCreateOpen;
  const setCreateOpen = externalOnCreateOpenChange ?? setInternalCreateOpen;
  const [editOpen, setEditOpen] = React.useState(false);
  const [gerarPecaOpen, setGerarPecaOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [contratoSelecionado, setContratoSelecionado] = React.useState<Contrato | null>(null);

  const [bulkStatusOpen, setBulkStatusOpen] = React.useState(false);
  const [bulkResponsavelOpen, setBulkResponsavelOpen] = React.useState(false);
  const [bulkSegmentoOpen, setBulkSegmentoOpen] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);

  // ── Debounce da busca ────────────────────────────────────────────────────
  const buscaDebounced = useDebounce(busca, 500);

  // ── Sync filtros externos → internos (reseta paginação) ──────────────────
  React.useEffect(() => {
    if (externalStatusFilter === undefined) return;
    const next = externalStatusFilter ?? '';
    setStatus((prev) => {
      if (prev === next) return prev;
      setPageIndex(0);
      return next;
    });
  }, [externalStatusFilter]);

  React.useEffect(() => {
    if (externalBusca === undefined) return;
    setBusca((prev) => {
      if (prev === externalBusca) return prev;
      setPageIndex(0);
      return externalBusca;
    });
  }, [externalBusca]);

  React.useEffect(() => {
    if (externalSegmentoId === undefined) return;
    setSegmentoId((prev) => {
      if (prev === externalSegmentoId) return prev;
      setPageIndex(0);
      return externalSegmentoId;
    });
  }, [externalSegmentoId]);

  React.useEffect(() => {
    if (externalTipoContrato === undefined) return;
    setTipoContrato((prev) => {
      if (prev === externalTipoContrato) return prev;
      setPageIndex(0);
      return externalTipoContrato;
    });
  }, [externalTipoContrato]);

  React.useEffect(() => {
    if (externalTipoCobranca === undefined) return;
    setTipoCobranca((prev) => {
      if (prev === externalTipoCobranca) return prev;
      setPageIndex(0);
      return externalTipoCobranca;
    });
  }, [externalTipoCobranca]);

  // ── Maps para lookup O(1) ────────────────────────────────────────────────
  const clientesMap = React.useMemo(
    () => new Map(clientesOptionsState.map((c) => [c.id, c])),
    [clientesOptionsState],
  );
  const partesContrariasMap = React.useMemo(
    () => new Map(partesContrariasOptionsState.map((p) => [p.id, p])),
    [partesContrariasOptionsState],
  );
  const usuariosMap = React.useMemo(
    () => new Map(usuariosOptionsState.map((u) => [u.id, u])),
    [usuariosOptionsState],
  );
  const segmentosMap = React.useMemo(
    () => new Map(segmentos.map((s) => [s.id, { nome: s.nome }])),
    [segmentos],
  );

  // ── Refs para uso nas resoluções assíncronas ─────────────────────────────
  const clientesOptionsRef = React.useRef(clientesOptionsState);
  clientesOptionsRef.current = clientesOptionsState;
  const partesContrariasOptionsRef = React.useRef(partesContrariasOptionsState);
  partesContrariasOptionsRef.current = partesContrariasOptionsState;
  const usuariosOptionsRef = React.useRef(usuariosOptionsState);
  usuariosOptionsRef.current = usuariosOptionsState;

  // Completar nomes faltantes quando contratos mudam via refetch.
  const prevContratosRef = React.useRef(contratos);

  React.useEffect(() => {
    if (prevContratosRef.current === contratos) return;
    prevContratosRef.current = contratos;

    let cancelled = false;

    const run = async () => {
      const currentClientes = new Set(clientesOptionsRef.current.map((c) => c.id));
      const currentPartes = new Set(partesContrariasOptionsRef.current.map((p) => p.id));
      const currentUsuarios = new Set(usuariosOptionsRef.current.map((u) => u.id));

      const missingClienteIds = Array.from(
        new Set(contratos.map((c) => c.clienteId).filter((id) => !currentClientes.has(id))),
      );
      const missingParteContrariaIds = Array.from(
        new Set(
          contratos
            .flatMap((c) => c.partes ?? [])
            .filter((p) => p.tipoEntidade === 'parte_contraria')
            .map((p) => p.entidadeId)
            .filter((id) => !currentPartes.has(id)),
        ),
      );
      const missingUsuarioIds = Array.from(
        new Set(
          contratos
            .map((c) => c.responsavelId)
            .filter((id): id is number => typeof id === 'number' && id > 0)
            .filter((id) => !currentUsuarios.has(id)),
        ),
      );

      if (!missingClienteIds.length && !missingParteContrariaIds.length && !missingUsuarioIds.length) return;

      const result = await actionResolverNomesEntidadesContrato({
        clienteIds: missingClienteIds,
        partesContrariasIds: missingParteContrariaIds,
        usuariosIds: missingUsuarioIds,
      });
      if (cancelled || !result.success) return;

      const appendUnique = (prev: ClienteInfo[], incoming: ClienteInfo[]) => {
        const map = new Map(prev.map((x) => [x.id, x]));
        for (const item of incoming) map.set(item.id, item);
        return Array.from(map.values());
      };

      if (result.data.clientes?.length) {
        setClientesOptionsState((prev) => appendUnique(prev, result.data.clientes));
      }
      if (result.data.partesContrarias?.length) {
        setPartesContrariasOptionsState((prev) => appendUnique(prev, result.data.partesContrarias));
      }
      if (result.data.usuarios?.length) {
        setUsuariosOptionsState((prev) => appendUnique(prev, result.data.usuarios));
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [contratos]);

  // ── Refetch ──────────────────────────────────────────────────────────────
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params: ListarContratosParams = {
        pagina: pageIndex + 1,
        limite: pageSize,
        busca: buscaDebounced || undefined,
        segmentoId: segmentoId ? Number(segmentoId) : undefined,
        tipoContrato: (tipoContrato || undefined) as TipoContrato | undefined,
        tipoCobranca: (tipoCobranca || undefined) as TipoCobranca | undefined,
        status: (status || undefined) as StatusContrato | undefined,
        ordenarPor: externalOrdenarPor,
        ordem: externalOrdem,
      };

      const result = await actionListarContratos(params);
      if (result.success) {
        const data = result.data as { data: Contrato[]; pagination: PaginationInfo };
        setContratos(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
    } finally {
      setIsLoading(false);
    }
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    segmentoId,
    tipoContrato,
    tipoCobranca,
    status,
    externalOrdenarPor,
    externalOrdem,
  ]);

  // ── Refetch reativo ──────────────────────────────────────────────────────
  const prevFiltersRef = React.useRef<string | null>(null);
  const hasInitialData = initialData.length > 0;

  React.useEffect(() => {
    const filterKey = JSON.stringify([
      pageIndex,
      pageSize,
      buscaDebounced,
      segmentoId,
      tipoContrato,
      tipoCobranca,
      status,
      externalOrdenarPor ?? '',
      externalOrdem ?? '',
    ]);
    if (prevFiltersRef.current === filterKey) return;
    const isInitial = prevFiltersRef.current === null;
    prevFiltersRef.current = filterKey;
    if (isInitial && hasInitialData) return;
    refetch();
  }, [
    pageIndex,
    pageSize,
    buscaDebounced,
    segmentoId,
    tipoContrato,
    tipoCobranca,
    status,
    externalOrdenarPor,
    externalOrdem,
    refetch,
    hasInitialData,
  ]);

  // ── Copilot context ──────────────────────────────────────────────────────
  useAgentContext({
    description: 'Dados da tela de contratos: total, filtros ativos e página atual',
    value: {
      total_contratos: total,
      pagina: pageIndex + 1,
      total_paginas: totalPages,
      contratos_visiveis: contratos.length,
      filtros_ativos: {
        busca: busca || null,
        tipo_contrato: tipoContrato || null,
        tipo_cobranca: tipoCobranca || null,
        status: status || null,
        segmento: segmentoId || null,
      },
      ordenacao: {
        campo: externalOrdenarPor ?? null,
        ordem: externalOrdem ?? null,
      },
      carregando: isLoading,
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleEdit = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setEditOpen(true);
  }, []);

  const handleGerarPeca = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setGerarPecaOpen(true);
  }, []);

  const handleDelete = React.useCallback((contrato: Contrato) => {
    setContratoSelecionado(contrato);
    setDeleteOpen(true);
  }, []);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setContratoSelecionado(null);
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch, setCreateOpen]);

  const toggleSelect = React.useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = React.useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = contratos.map((c) => c.id);
      const allOnPage = pageIds.every((id) => prev.has(id));
      if (allOnPage) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [contratos]);

  const selectedArray = React.useMemo(() => Array.from(selectedIds), [selectedIds]);
  const selectedCount = selectedArray.length;

  const handleBulkSuccess = React.useCallback(() => {
    setSelectedIds(new Set());
    refetch();
  }, [refetch]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        {selectedCount > 0 && (
          <ContratosBulkActionsBar
            selectedCount={selectedCount}
            onClearSelection={() => setSelectedIds(new Set())}
            onAlterarStatus={() => setBulkStatusOpen(true)}
            onAtribuirResponsavel={() => setBulkResponsavelOpen(true)}
            onAlterarSegmento={() => setBulkSegmentoOpen(true)}
            onExcluir={() => setBulkDeleteOpen(true)}
          />
        )}

        <ContratosGlassList
          contratos={contratos}
          isLoading={isLoading}
          clientesMap={clientesMap}
          partesContrariasMap={partesContrariasMap}
          usuariosMap={usuariosMap}
          segmentosMap={segmentosMap}
          usuarios={usuariosOptionsState}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onGerarPeca={handleGerarPeca}
          onResponsavelChanged={refetch}
        />

        {totalPages > 0 && (
          <DataPagination
            pageIndex={pageIndex}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            onPageChange={setPageIndex}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageIndex(0);
            }}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Sheet de criação */}
      <ContratoForm
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        clientesOptions={clientesOptions}
        partesContrariasOptions={partesContrariasOptions}
        usuariosOptions={usuariosOptions}
        onSuccess={handleCreateSuccess}
      />

      {/* Sheet de edição */}
      {contratoSelecionado && (
        <ContratoForm
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          mode="edit"
          contrato={contratoSelecionado}
          clientesOptions={clientesOptions}
          partesContrariasOptions={partesContrariasOptions}
          usuariosOptions={usuariosOptions}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Dialog de geração de peça */}
      {contratoSelecionado && gerarPecaOpen && (
        <GerarPecaDialog
          contratoId={contratoSelecionado.id}
          open={gerarPecaOpen}
          onOpenChange={(open) => {
            setGerarPecaOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          onSuccess={refetch}
        />
      )}

      {/* Dialog de exclusão */}
      {contratoSelecionado && deleteOpen && (
        <ContratoDeleteDialog
          contratoId={contratoSelecionado.id}
          open={deleteOpen}
          onOpenChange={(open) => {
            setDeleteOpen(open);
            if (!open) setContratoSelecionado(null);
          }}
          onSuccess={refetch}
        />
      )}

      {/* Bulk dialogs */}
      <AlterarStatusMassaDialog
        open={bulkStatusOpen}
        onOpenChange={setBulkStatusOpen}
        selectedIds={selectedArray}
        onSuccess={handleBulkSuccess}
      />
      <AtribuirResponsavelMassaDialog
        open={bulkResponsavelOpen}
        onOpenChange={setBulkResponsavelOpen}
        selectedIds={selectedArray}
        usuarios={usuariosOptionsState}
        onSuccess={handleBulkSuccess}
      />
      <AlterarSegmentoMassaDialog
        open={bulkSegmentoOpen}
        onOpenChange={setBulkSegmentoOpen}
        selectedIds={selectedArray}
        segmentos={segmentosOptions}
        onSuccess={handleBulkSuccess}
      />
      <ExcluirMassaDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedIds={selectedArray}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
