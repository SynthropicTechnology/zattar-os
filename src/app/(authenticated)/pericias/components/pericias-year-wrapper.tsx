'use client';

/**
 * PericiasYearWrapper - Wrapper auto-contido para a view de ano
 *
 * Segue o padrão de ExpedientesYearWrapper / AudienciasYearWrapper:
 * - DataShell + DataTableToolbar + YearFilterPopover
 * - PericiasListFilters no filtersSlot
 * - Grid de 12 meses com indicadores de perícias
 * - Fetch via usePericias com range anual
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

import type { Pericia } from '../domain';
import { SituacaoPericiaCodigo } from '../domain';
import { usePericias } from '../hooks/use-pericias';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useEspecialidadesPericias } from '../hooks/use-especialidades-pericias';
import { usePeritos } from '../hooks/use-peritos';
import type { UsuarioOption, EspecialidadePericiaOption, PeritoOption } from '../types';

import {
  PericiasListFilters,
  type SituacaoFilterType,
  type ResponsavelFilterType,
  type LaudoFilterType,
} from './pericias-list-filters';
import { PericiaCriarDialog } from './pericia-criar-dialog';
import { PericiaDetalhesDialog } from './pericia-detalhes-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface PericiasYearWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados */
  usuariosData?: UsuarioOption[];
  /** Dados de especialidades pré-carregados */
  especialidadesData?: EspecialidadePericiaOption[];
  /** Dados de peritos pré-carregados */
  peritosData?: PeritoOption[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasYearWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  especialidadesData,
  peritosData,
}: PericiasYearWrapperProps) {
  // ---------- Navegação de Ano ----------
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const selectedDate = React.useMemo(() => new Date(selectedYear, 0, 1), [selectedYear]);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [situacaoFilter, setSituacaoFilter] = React.useState<SituacaoFilterType>('todos');
  const [responsavelFilter, setResponsavelFilter] = React.useState<ResponsavelFilterType>('todos');
  const [laudoFilter, setLaudoFilter] = React.useState<LaudoFilterType>('todos');
  const [tribunalFilter, setTribunalFilter] = React.useState('');
  const [grauFilter, setGrauFilter] = React.useState('');
  const [especialidadeFilter, setEspecialidadeFilter] = React.useState('');
  const [peritoFilter, setPeritoFilter] = React.useState('');

  // ---------- Dialog State ----------
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [periciasDiaDialog, setPericiasDiaDialog] = React.useState<Pericia[]>([]);
  const [isDiaDialogOpen, setIsDiaDialogOpen] = React.useState(false);

  // ---------- Dados Auxiliares ----------
  const { usuarios: usuariosFetched } = useUsuarios({ enabled: !usuariosData });
  const { especialidades: especialidadesFetched } = useEspecialidadesPericias({ enabled: !especialidadesData });
  const { peritos: peritosFetched } = usePeritos({ enabled: !peritosData });

  const usuarios = usuariosData ?? usuariosFetched;
  const especialidades = especialidadesData ?? especialidadesFetched;
  const peritos = peritosData ?? peritosFetched;

  // ---------- Montar params para o hook ----------
  const hookParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      pagina: 1,
      limite: 1000,
      busca: globalFilter || undefined,
      prazoEntregaInicio: format(startOfYear(selectedDate), 'yyyy-MM-dd'),
      prazoEntregaFim: format(endOfYear(selectedDate), 'yyyy-MM-dd'),
    };

    if (situacaoFilter !== 'todos') {
      params.situacaoCodigo = situacaoFilter;
    } else {
      params.situacoesExcluidas = [
        SituacaoPericiaCodigo.FINALIZADA,
        SituacaoPericiaCodigo.CANCELADA,
      ];
    }

    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    if (laudoFilter === 'sim') params.laudoJuntado = true;
    if (laudoFilter === 'nao') params.laudoJuntado = false;

    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (especialidadeFilter) params.especialidadeId = parseInt(especialidadeFilter, 10);
    if (peritoFilter) params.peritoId = parseInt(peritoFilter, 10);

    return params;
  }, [
    globalFilter, selectedDate, situacaoFilter, responsavelFilter, laudoFilter,
    tribunalFilter, grauFilter, especialidadeFilter, peritoFilter,
  ]);

  // ---------- Data Fetching ----------
  const { pericias, isLoading, error, refetch } = usePericias(hookParams);

  // ---------- Perícias por dia (mapa) ----------
  const periciasPorDia = React.useMemo(() => {
    const mapa = new Map<string, Pericia[]>();
    pericias.forEach((p) => {
      if (!p.prazoEntrega) return;
      const d = new Date(p.prazoEntrega);
      const key = `${d.getMonth()}-${d.getDate()}`;
      const existing = mapa.get(key) || [];
      existing.push(p);
      mapa.set(key, existing);
    });
    return mapa;
  }, [pericias]);

  // ---------- Helpers ----------
  const hasDayContent = React.useCallback((mes: number, dia: number) => {
    return periciasPorDia.has(`${mes}-${dia}`);
  }, [periciasPorDia]);

  const handleDiaClick = React.useCallback((mes: number, dia: number) => {
    const key = `${mes}-${dia}`;
    const doDia = periciasPorDia.get(key) || [];
    if (doDia.length > 0) {
      setPericiasDiaDialog(doDia);
      setIsDiaDialogOpen(true);
    }
  }, [periciasPorDia]);

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
            title="Perícias"
            searchValue={globalFilter}
            onSearchValueChange={setGlobalFilter}
            searchPlaceholder="Buscar perícias..."
            actionButton={{
              label: 'Nova Perícia',
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
                <PericiasListFilters
                  situacaoFilter={situacaoFilter}
                  onSituacaoChange={setSituacaoFilter}
                  responsavelFilter={responsavelFilter}
                  onResponsavelChange={setResponsavelFilter}
                  laudoFilter={laudoFilter}
                  onLaudoChange={setLaudoFilter}
                  tribunalFilter={tribunalFilter}
                  onTribunalChange={setTribunalFilter}
                  grauFilter={grauFilter}
                  onGrauChange={setGrauFilter}
                  especialidadeFilter={especialidadeFilter}
                  onEspecialidadeChange={setEspecialidadeFilter}
                  peritoFilter={peritoFilter}
                  onPeritoChange={setPeritoFilter}
                  usuarios={usuarios}
                  especialidades={especialidades}
                  peritos={peritos}
                />
              </>
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando perícias..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar perícias: ${error}`} onRetry={refetch} />
        ) : (
          <YearCalendarGrid
            year={selectedYear}
            hasDayContent={hasDayContent}
            onDayClick={handleDiaClick}
            className="p-6"
          />
        )}
      </DataShell>

      <PericiaCriarDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        usuarios={usuarios}
        especialidades={especialidades}
        peritos={peritos}
        onSuccess={handleCreateSuccess}
      />

      <PericiaDetalhesDialog
        pericia={null}
        pericias={periciasDiaDialog}
        open={isDiaDialogOpen}
        onOpenChange={setIsDiaDialogOpen}
      />
    </>
  );
}
