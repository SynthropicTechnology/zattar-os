'use client';

/**
 * AudienciasYearWrapper - Wrapper auto-contido para a view de ano
 *
 * Segue o mesmo padrão de DataShell + DataTableToolbar
 * que AudienciasTableWrapper (semana) e AudienciasListWrapper (lista).
 *
 * Gerencia:
 * - Estado de filtros (via AudienciasListFilters)
 * - Navegação de ano (via YearFilterPopover)
 * - Busca de dados (via useAudiencias hook)
 * - Dialog de criação
 */

import * as React from 'react';
import { startOfYear, endOfYear } from 'date-fns';

import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  YearFilterPopover,
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

import type { TipoAudiencia } from '../domain';
import { useAudiencias } from '../hooks/use-audiencias';
import { useTiposAudiencias } from '../hooks/use-tipos-audiencias';
import { useUsuarios } from '@/app/(authenticated)/usuarios';

import { AudienciasListFilters } from './audiencias-list-filters';
import { AudienciasYearHeatmap } from './audiencias-year-heatmap';
import { NovaAudienciaDialog } from './nova-audiencia-dialog';

import type {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CodigoTribunal,
} from '../domain';

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasYearWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  /** Dados de tipos de audiência pré-carregados (evita fetch duplicado) */
  tiposAudienciaData?: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasYearWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposAudienciaData,
}: AudienciasYearWrapperProps) {
  // ---------- Navegação de Ano ----------
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const selectedDate = React.useMemo(() => new Date(selectedYear, 0, 1), [selectedYear]);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<StatusAudiencia[]>([]);
  const [modalidadeFiltro, setModalidadeFiltro] = React.useState<ModalidadeAudiencia[]>([]);
  const [trtFiltro, setTrtFiltro] = React.useState<CodigoTribunal[]>([]);
  const [grauFiltro, setGrauFiltro] = React.useState<GrauTribunal[]>([]);
  const [responsavelFiltro, setResponsavelFiltro] = React.useState<(number | 'null')[]>([]);
  const [tipoAudienciaFiltro, setTipoAudienciaFiltro] = React.useState<number[]>([]);

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposAudiencia: tiposFetched } = useTiposAudiencias({ enabled: !tiposAudienciaData });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposAudiencia = tiposAudienciaData ?? tiposFetched;

  // ---------- Data Fetching ----------
  const { audiencias, isLoading, error, refetch } = useAudiencias({
    pagina: 1,
    limite: 1000,
    busca: globalFilter || undefined,
    status: statusFiltro.length > 0 ? statusFiltro : undefined,
    modalidade: modalidadeFiltro.length > 0 ? modalidadeFiltro : undefined,
    trt: trtFiltro.length > 0 ? trtFiltro : undefined,
    grau: grauFiltro.length > 0 ? grauFiltro : undefined,
    responsavel_id: responsavelFiltro.length > 0 ? responsavelFiltro : undefined,
    tipo_audiencia_id: tipoAudienciaFiltro.length > 0 ? tipoAudienciaFiltro : undefined,
    data_inicio_inicio: startOfYear(selectedDate).toISOString(),
    data_inicio_fim: endOfYear(selectedDate).toISOString(),
  });

  // ---------- Handlers ----------
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Audiências"
            searchValue={globalFilter}
            onSearchValueChange={setGlobalFilter}
            searchPlaceholder="Buscar audiências..."
            actionButton={{
              label: 'Nova Audiência',
              onClick: () => setIsCreateDialogOpen(true),
            }}
            actionSlot={
              <>
                {viewModeSlot}
                {settingsSlot}
              </>
            }
            filtersSlot={
              <>
                <YearFilterPopover
                  selectedYear={selectedYear}
                  onYearChange={setSelectedYear}
                />
                <AudienciasListFilters
                  statusFiltro={statusFiltro}
                  onStatusChange={setStatusFiltro}
                  modalidadeFiltro={modalidadeFiltro}
                  onModalidadeChange={setModalidadeFiltro}
                  trtFiltro={trtFiltro}
                  onTrtChange={setTrtFiltro}
                  grauFiltro={grauFiltro}
                  onGrauChange={setGrauFiltro}
                  responsavelFiltro={responsavelFiltro}
                  onResponsavelChange={setResponsavelFiltro}
                  tipoAudienciaFiltro={tipoAudienciaFiltro}
                  onTipoAudienciaChange={setTipoAudienciaFiltro}
                  usuarios={usuarios}
                  tiposAudiencia={tiposAudiencia}
                />
              </>
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando audiências..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar audiências: ${error}`} onRetry={refetch} />
        ) : (
          <AudienciasYearHeatmap
            audiencias={audiencias}
            currentDate={selectedDate}
            onDateChange={(d: Date) => setSelectedYear(d.getFullYear())}
            refetch={refetch}
          />
        )}
      </DataShell>

      <NovaAudienciaDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
