'use client';

/**
 * ExpedientesListWrapper — DataShell + DataTable para a view de lista
 *
 * Segue o padrão de audiencias-list-wrapper.tsx:
 * - Fetch próprio via useExpedientes (server-side pagination)
 * - DataTableToolbar com search, filtros, density, column visibility, export
 * - ViewModePopover recebido como slot do parent
 * - Colunas do columns.tsx com inline editing, popovers, badges semânticos
 */

import * as React from 'react';
import type { Table as TanstackTable } from '@tanstack/react-table';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';

import { cn } from '@/lib/utils';
import { columns, type ExpedientesTableMeta } from './columns';
import { ExpedientesGlassList } from './expedientes-glass-list';
import {
  ExpedientesListFilters,
} from './expedientes-list-filters';
import type {
  Expediente,
  CodigoTribunal,
  GrauTribunal,
  OrigemExpediente,
} from '../domain';
// ─── Component ───────────────────────────────────────────────────────────────

export interface ExpedientesListWrapperProps {
  search?: string;
  activeTab?: 'todos' | 'pendentes' | 'baixados';
  refreshCounter?: number;
  onViewDetail?: (expediente: Expediente) => void;
  onBaixar?: (expediente: Expediente) => void;
}

export function ExpedientesListWrapper({
  search = '',
  activeTab = 'pendentes',
  refreshCounter = 0,
  onViewDetail,
  onBaixar,
}: ExpedientesListWrapperProps) {
  // ─── List mode toggle (glass rows vs data table) ────────────────────────
  const [listMode, setListMode] = React.useState<'glass' | 'table'>('glass');

  // ─── Table instance ──────────────────────────────────────────────────────
  const [table, setTable] = React.useState<TanstackTable<Expediente> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ─── Pagination (0-based no UI, convertido para 1-based no hook) ─────────
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // ─── Filters ─────────────────────────────────────────────────────────────
  const [trtFiltro, setTrtFiltro] = React.useState<CodigoTribunal[]>([]);
  const [grauFiltro, setGrauFiltro] = React.useState<GrauTribunal[]>([]);
  const [origemFiltro, setOrigemFiltro] = React.useState<OrigemExpediente[]>([]);
  const [responsavelFiltro, setResponsavelFiltro] = React.useState<(number | 'null')[]>([]);
  const [tipoExpedienteFiltro, setTipoExpedienteFiltro] = React.useState<number[]>([]);
  const [juizoDigitalFiltro, setJuizoDigitalFiltro] = React.useState<('sim' | 'nao')[]>([]);
  const [segredoJusticaFiltro, setSegredoJusticaFiltro] = React.useState<('sim' | 'nao')[]>([]);
  const [prioridadeProcessualFiltro, setPrioridadeProcessualFiltro] = React.useState<('sim' | 'nao')[]>([]);

  // ─── Derivar params de status a partir da activeTab ──────────────────────
  const baixadoParam = React.useMemo(() => {
    if (activeTab === 'pendentes') return false;
    if (activeTab === 'baixados') return true;
    return undefined; // todos
  }, [activeTab]);

  // Reset pagination when search or tab changes
  React.useEffect(() => {
    setPageIndex(0);
  }, [search, activeTab]);

  // ─── Data fetching (server-side pagination) ──────────────────────────────
  const { expedientes, paginacao, isLoading, error, refetch } = useExpedientes({
    pagina: pageIndex + 1,
    limite: pageSize,
    busca: search || undefined,
    baixado: baixadoParam,
    trt: trtFiltro.length === 1 ? trtFiltro[0] : undefined,
    grau: grauFiltro.length === 1 ? grauFiltro[0] : undefined,
    origem: origemFiltro.length === 1 ? origemFiltro[0] : undefined,
    responsavelId: responsavelFiltro.length === 1 ? responsavelFiltro[0] : undefined,
    tipoExpedienteId: tipoExpedienteFiltro.length === 1 ? tipoExpedienteFiltro[0] : undefined,
    juizoDigital: juizoDigitalFiltro.length === 1 ? (juizoDigitalFiltro[0] === 'sim') : undefined,
    segredoJustica: segredoJusticaFiltro.length === 1 ? (segredoJusticaFiltro[0] === 'sim') : undefined,
    prioridadeProcessual: prioridadeProcessualFiltro.length === 1 ? (prioridadeProcessualFiltro[0] === 'sim') : undefined,
    incluirSemPrazo: true,
  });

  React.useEffect(() => {
    if (refreshCounter > 0) {
      refetch();
    }
  }, [refreshCounter, refetch]);

  // ─── Related data (para células de Responsável e TipoExpediente) ─────────
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });

  // ─── Table meta (acessível nas células via table.options.meta) ────────────
  const tableMeta: ExpedientesTableMeta = React.useMemo(() => ({
    usuarios: usuarios || [],
    tiposExpedientes: (tiposExpedientes || []).map((t) => ({
      id: t.id,
      tipoExpediente: t.tipoExpediente,
    })),
    onSuccessAction: refetch,
  }), [usuarios, tiposExpedientes, refetch]);

  // ─── Pagination helpers ──────────────────────────────────────────────────
  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  // ─── Filter change helper (always resets page to 0) ──────────────────────
  const withPageReset = <T,>(setter: React.Dispatch<React.SetStateAction<T>>) =>
    (value: T) => { setter(value); setPageIndex(0); };

  // ─── Render ──────────────────────────────────────────────────────────────

  const listModeToggle = (
    <div className="flex gap-1 rounded-lg bg-muted/30 p-0.5">
      <button
        type="button"
        onClick={() => setListMode('glass')}
        className={cn(
          'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
          listMode === 'glass'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Rows
      </button>
      <button
        type="button"
        onClick={() => setListMode('table')}
        className={cn(
          'px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
          listMode === 'table'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Tabela
      </button>
    </div>
  );

  return (
    <>
      <DataShell
      header={
        <DataTableToolbar
          table={listMode === 'table' ? (table ?? undefined) : undefined}
          density={density}
          onDensityChange={setDensity}
          filtersSlot={
            <div className="flex items-center gap-2">
              {listModeToggle}
              <ExpedientesListFilters
                trtFiltro={trtFiltro}
                onTrtChange={withPageReset(setTrtFiltro)}
                grauFiltro={grauFiltro}
                onGrauChange={withPageReset(setGrauFiltro)}
                origemFiltro={origemFiltro}
                onOrigemChange={withPageReset(setOrigemFiltro)}
                responsavelFiltro={responsavelFiltro}
                onResponsavelChange={withPageReset(setResponsavelFiltro)}
                tipoExpedienteFiltro={tipoExpedienteFiltro}
                onTipoExpedienteChange={withPageReset(setTipoExpedienteFiltro)}
                juizoDigitalFiltro={juizoDigitalFiltro}
                onJuizoDigitalChange={withPageReset(setJuizoDigitalFiltro)}
                segredoJusticaFiltro={segredoJusticaFiltro}
                onSegredoJusticaChange={withPageReset(setSegredoJusticaFiltro)}
                prioridadeProcessualFiltro={prioridadeProcessualFiltro}
                onPrioridadeProcessualChange={withPageReset(setPrioridadeProcessualFiltro)}
                usuarios={usuarios || []}
                tiposExpedientes={tiposExpedientes || []}
              />
            </div>
          }
        />
      }
      footer={
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
      }
    >
      {listMode === 'glass' ? (
        <ExpedientesGlassList
          expedientes={expedientes}
          isLoading={isLoading}
          onViewDetail={onViewDetail ?? (() => {})}
          onBaixar={onBaixar}
          usuariosData={usuarios}
        />
      ) : (
        <DataTable
          columns={columns}
          data={expedientes}
          pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPageIndex(0);
            },
          }}
          isLoading={isLoading}
          error={error}
          density={density}
          onDensityChange={setDensity}
          onTableReady={setTable}
          options={{ meta: tableMeta as unknown as Record<string, unknown> }}
          emptyMessage="Nenhum expediente encontrado."
          striped
        />
      )}
    </DataShell>
    </>
  );
}
