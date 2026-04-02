'use client';

/**
 * ExpedientesYearWrapper - Wrapper auto-contido para a view de ano
 *
 * Segue o padrão de AudienciasYearWrapper:
 * - DataShell + DataTableToolbar + YearFilterPopover
 * - ExpedientesListFilters no filtersSlot
 * - Grid de 12 meses com indicadores de expedientes
 * - Fetch via useExpedientes com range anual
 */

import * as React from 'react';
import { startOfYear, endOfYear, format } from 'date-fns';

import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  YearFilterPopover,
  TemporalViewLoading,
  TemporalViewError,
  YearCalendarGrid,
} from '@/components/shared';

import type { Expediente } from '../domain';
import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/app/usuarios';
import { useTiposExpedientes } from '@/app/app/tipos-expedientes';

import { ExpedientesListFilters, type StatusFilterType, type ResponsavelFilterType } from './expedientes-list-filters';
import { ExpedienteDialog } from './expediente-dialog';
import { ExpedienteDetalhesDialog } from './expediente-detalhes-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface UsuarioData {
  id: number;
  nomeExibicao?: string;
  nome_exibicao?: string;
  nomeCompleto?: string;
  nome?: string;
}

interface TipoExpedienteData {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

interface ExpedientesYearWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: UsuarioData[];
  /** Dados de tipos de expediente pré-carregados (evita fetch duplicado) */
  tiposExpedientesData?: TipoExpedienteData[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesYearWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesYearWrapperProps) {
  // ---------- Navegação de Ano ----------
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const selectedDate = React.useMemo(() => new Date(selectedYear, 0, 1), [selectedYear]);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<StatusFilterType>('pendentes');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = React.useState('');
  const [grauFilter, setGrauFilter] = React.useState('');
  const [tipoExpedienteFilter, setTipoExpedienteFilter] = React.useState('');
  const [origemFilter, setOrigemFilter] = React.useState('');

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [expedientesDiaDialog, setExpedientesDiaDialog] = React.useState<Expediente[]>([]);
  const [isDiaDialogOpen, setIsDiaDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { tiposExpedientes: tiposFetched } = useTiposExpedientes({ limite: 100 });

  const usuarios = usuariosData ?? usuariosFetched;
  const tiposExpedientes = tiposExpedientesData ?? tiposFetched;

  // ---------- Montar params para o hook ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 1000,
      busca: globalFilter || undefined,
      dataPrazoLegalInicio: format(startOfYear(selectedDate), 'yyyy-MM-dd'),
      dataPrazoLegalFim: format(endOfYear(selectedDate), 'yyyy-MM-dd'),
      incluirSemPrazo: true,
    };

    if (statusFilter === 'pendentes') params.baixado = false;
    if (statusFilter === 'baixados') params.baixado = true;

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (tipoExpedienteFilter) params.tipoExpedienteId = parseInt(tipoExpedienteFilter, 10);
    if (origemFilter) params.origem = origemFilter;

    return params;
  }, [globalFilter, selectedDate, statusFilter, responsavelFilter, tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter]);

  // ---------- Data Fetching ----------
  const { expedientes, isLoading, error, refetch } = useExpedientes(hookParams);

  // ---------- Expedientes por dia (mapa) ----------
  const expedientesPorDia = React.useMemo(() => {
    const mapa = new Map<string, Expediente[]>();
    expedientes.forEach((e) => {
      if (!e.dataPrazoLegalParte) return;
      const d = new Date(e.dataPrazoLegalParte);
      const key = `${d.getMonth()}-${d.getDate()}`;
      const existing = mapa.get(key) || [];
      existing.push(e);
      mapa.set(key, existing);
    });
    return mapa;
  }, [expedientes]);

  // Itens sem prazo e vencidos (fixados em todos os dias)
  const semPrazoPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && !e.dataPrazoLegalParte),
    [expedientes]
  );
  const vencidosPendentes = React.useMemo(
    () => expedientes.filter((e) => !e.baixadoEm && e.prazoVencido === true),
    [expedientes]
  );

  // ---------- Helpers ----------
  const handleDiaClick = React.useCallback((mes: number, dia: number) => {
    const key = `${mes}-${dia}`;
    const doDia = expedientesPorDia.get(key) || [];

    // Combinar pinned + do dia (sem duplicatas)
    const unique = new Map<number, Expediente>();
    [...semPrazoPendentes, ...vencidosPendentes, ...doDia].forEach((e) => unique.set(e.id, e));
    const exps = Array.from(unique.values());

    if (exps.length > 0) {
      setExpedientesDiaDialog(exps);
      setIsDiaDialogOpen(true);
    }
  }, [expedientesPorDia, semPrazoPendentes, vencidosPendentes]);

  // ---------- Handlers ----------
  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setIsCreateDialogOpen(false);
  }, [refetch]);

  const temExpediente = React.useCallback((mes: number, dia: number) => {
    if (semPrazoPendentes.length > 0 || vencidosPendentes.length > 0) return true;
    return expedientesPorDia.has(`${mes}-${dia}`);
  }, [expedientesPorDia, semPrazoPendentes, vencidosPendentes]);

  // ---------- Render ----------
  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            title="Expedientes"
            searchValue={globalFilter}
            onSearchValueChange={setGlobalFilter}
            searchPlaceholder="Buscar expedientes..."
            actionButton={{
              label: 'Novo Expediente',
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
                <ExpedientesListFilters
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  responsavelFilter={responsavelFilter}
                  onResponsavelChange={setResponsavelFilter}
                  tribunalFilter={tribunalFilter}
                  onTribunalChange={setTribunalFilter}
                  grauFilter={grauFilter}
                  onGrauChange={setGrauFilter}
                  tipoExpedienteFilter={tipoExpedienteFilter}
                  onTipoExpedienteChange={setTipoExpedienteFilter}
                  origemFilter={origemFilter}
                  onOrigemChange={setOrigemFilter}
                  usuarios={usuarios}
                  tiposExpedientes={tiposExpedientes}
                  hidePrazoFilter
                />
              </>
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando expedientes..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={refetch} />
        ) : (
          <YearCalendarGrid
            year={selectedYear}
            hasDayContent={temExpediente}
            onDayClick={handleDiaClick}
            className="p-6"
          />
        )}
      </DataShell>

      <ExpedienteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <ExpedienteDetalhesDialog
        expediente={null}
        expedientes={expedientesDiaDialog}
        open={isDiaDialogOpen}
        onOpenChange={setIsDiaDialogOpen}
        onSuccess={refetch}
      />
    </>
  );
}
