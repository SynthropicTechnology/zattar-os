'use client';

/**
 * AudienciasListWrapper - Componente Client que encapsula a tabela de audiências
 *
 * Recebe dados iniciais do Server Component e gerencia:
 * - Estado de busca e filtros
 * - Paginação server-side com refresh via Server Actions (agora via useAudiencias hook)
 * - Dialogs de criação e visualização
 */

import * as React from 'react';
import {
  DataShell,
  DataPagination,
  DataTableToolbar,
} from '@/components/shared/data-shell';

import {
  type Audiencia,
  type CodigoTribunal,
  type TipoAudiencia,
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
} from '../domain';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useAudiencias } from '../hooks/use-audiencias';

import type { AudienciaComResponsavel } from './audiencias-list-columns';
import { AudienciasListFilters } from './audiencias-list-filters';
import { AudienciasGlassList } from './audiencias-glass-list';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';
import { AudienciaDetailDialog } from './audiencia-detail-dialog';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { AudienciaForm } from './audiencia-form';

// =============================================================================
// TIPOS
// =============================================================================

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface AudienciasListWrapperProps {
  initialData?: Audiencia[];
  initialPagination?: PaginationInfo | null;
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  /** Dados de tipos de audiência pré-carregados (evita fetch duplicado) */
  tiposAudienciaData?: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasListWrapper({
  initialData: _initialData = [],
  initialPagination = null,
  viewModeSlot,
  usuariosData,
  tiposAudienciaData,
}: AudienciasListWrapperProps) {
  // Pagination State
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.page - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limit : 50
  );

  // Search/Filters State
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusAudiencia[]>([]);
  const [modalidadeFiltro, setModalidadeFiltro] = React.useState<ModalidadeAudiencia[]>([]);
  const [trtFiltro, setTrtFiltro] = React.useState<CodigoTribunal[]>([]);
  const [grauFiltro, setGrauFiltro] = React.useState<GrauTribunal[]>([]);
  const [responsavelFiltro, setResponsavelFiltro] = React.useState<(number | 'null')[]>([]);
  const [tipoAudienciaFiltro, setTipoAudienciaFiltro] = React.useState<number[]>([]);

  // Dialogs state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedAudiencia, setSelectedAudiencia] = React.useState<AudienciaComResponsavel | null>(null);

  // Auxiliary data
  const { tiposAudiencia: tiposFetched } = useTiposAudiencias({ enabled: !tiposAudienciaData });
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });

  const tiposAudiencia = tiposAudienciaData ?? tiposFetched;
  const usuarios = usuariosData ?? usuariosFetched;

  // Use the centralized hook for data fetching
  const { audiencias: audienciasFetched, paginacao, isLoading, error, refetch } = useAudiencias({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: globalFilter || undefined,
    status: statusFiltro.length > 0 ? statusFiltro : undefined,
    modalidade: modalidadeFiltro.length > 0 ? modalidadeFiltro : undefined,
    trt: trtFiltro.length > 0 ? trtFiltro : undefined,
    grau: grauFiltro.length > 0 ? grauFiltro : undefined,
    responsavel_id: responsavelFiltro.length > 0 ? responsavelFiltro : undefined,
    tipo_audiencia_id: tipoAudienciaFiltro.length > 0 ? tipoAudienciaFiltro : undefined,
  });

  // Determine if we should use initial data (only on first load if parameters match initial)
  // For simplicity and correctness with the hook, allow the hook to manage data after mount.
  // The hook handles SSR hydration internally if configured, but here we strictly use client-side fetching based on `useAudiencias` 
  // implementation which defaults to client-only fetching unless initial data is passed to it (which our hook simple version might not support fully for hydration, 
  // but it's fine as it effectively replaces the previous client-only fetch).
  //
  // NOTE: The previous implementation accepted `initialData` but immediately refetched if `!hasInitialData`.
  // `useAudiencias` starts with empty array and fetches. 
  // We will trust `useAudiencias` to fetch data.

  // Map usuarios to audiencias for responsavel name
  const usuariosMap = React.useMemo(() => {
    const map = new Map<number, { nome: string }>();
    usuarios.forEach((u: { id: number; nomeExibicao?: string | null; nomeCompleto?: string | null }) => {
      map.set(u.id, { nome: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}` });
    });
    return map;
  }, [usuarios]);

  // Enrich audiencias with responsavel name
  const audienciasEnriquecidas = React.useMemo(() => {
    // If we have fetched data, use it.
    const sourceData = audienciasFetched;
    return sourceData.map((a) => ({
      ...a,
      responsavelNome: a.responsavelId ? usuariosMap.get(a.responsavelId)?.nome : null,
    }));
  }, [audienciasFetched, usuariosMap]);

  // Derived pagination info
  const total = paginacao?.total ?? (initialPagination?.total ?? 0);
  const totalPages = paginacao?.totalPaginas ?? (initialPagination?.totalPages ?? 0);

  // Handlers
  const handleView = React.useCallback((audiencia: AudienciaComResponsavel) => {
    setSelectedAudiencia(audiencia);
    setDetailOpen(true);
  }, []);

  const handleEdit = React.useCallback((audiencia: AudienciaComResponsavel) => {
    setSelectedAudiencia(audiencia);
    setEditOpen(true);
  }, []);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
  }, [refetch]);

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Audiências"
            searchValue={globalFilter}
            onSearchValueChange={(value: string) => {
              setGlobalFilter(value);
              setPageIndex(0);
            }}
            searchPlaceholder="Buscar audiências..."
            actionButton={{
              label: 'Nova Audiência',
              onClick: () => setCreateOpen(true),
            }}
            viewModeSlot={viewModeSlot}
            filtersSlot={
              <AudienciasListFilters
                statusFiltro={statusFiltro}
                onStatusChange={(v) => {
                  setStatusFiltro(v);
                  setPageIndex(0);
                }}
                modalidadeFiltro={modalidadeFiltro}
                onModalidadeChange={(v) => {
                  setModalidadeFiltro(v);
                  setPageIndex(0);
                }}
                trtFiltro={trtFiltro}
                onTrtChange={(v) => {
                  setTrtFiltro(v);
                  setPageIndex(0);
                }}
                grauFiltro={grauFiltro}
                onGrauChange={(v) => {
                  setGrauFiltro(v);
                  setPageIndex(0);
                }}
                responsavelFiltro={responsavelFiltro}
                onResponsavelChange={(v) => {
                  setResponsavelFiltro(v);
                  setPageIndex(0);
                }}
                tipoAudienciaFiltro={tipoAudienciaFiltro}
                onTipoAudienciaChange={(v) => {
                  setTipoAudienciaFiltro(v);
                  setPageIndex(0);
                }}
                usuarios={usuarios}
                tiposAudiencia={tiposAudiencia}
              />
            }
          />
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <div className="p-4">
          <AudienciasGlassList
            audiencias={audienciasEnriquecidas}
            isLoading={isLoading}
            onView={handleView}
          />
        </div>
      </DataShell>

      <NovaAudienciaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {selectedAudiencia && (
        <>
          <AudienciaDetailDialog
            open={detailOpen}
            onOpenChange={setDetailOpen}
            audiencia={selectedAudiencia}
          />

          <DialogFormShell
            open={editOpen}
            onOpenChange={setEditOpen}
            title="Editar Audiência"
            maxWidth="2xl"
            hideFooter
          >
            <AudienciaForm
              initialData={selectedAudiencia}
              onSuccess={handleEditSuccess}
              onClose={() => setEditOpen(false)}
            />
          </DialogFormShell>
        </>
      )}
    </>
  );
}
