'use client';

/**
 * PericiasMonthWrapper - Wrapper auto-contido para a view de mês
 *
 * Segue o padrão de ExpedientesMonthWrapper / AudienciasMonthWrapper:
 * - DataShell + DataTableToolbar com PericiasListFilters
 * - Master-detail layout: calendário compacto + lista do dia
 * - Fetch via usePericias com range mensal
 */

import * as React from 'react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

import {
  DataShell,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import {
  TemporalViewLoading,
  TemporalViewError,
} from '@/components/shared';

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
import { PericiasCalendarCompact } from './pericias-calendar-compact';
import { PericiasDayList } from './pericias-day-list';
import { PericiaCriarDialog } from './pericia-criar-dialog';

// =============================================================================
// TIPOS
// =============================================================================

interface PericiasMonthWrapperProps {
  /** Slot para o seletor de modo de visualização (ViewModePopover) */
  viewModeSlot?: React.ReactNode;
  /** Slot para botões de ação adicionais (ex: Settings) */
  settingsSlot?: React.ReactNode;
  /** Dados de usuários pré-carregados (evita fetch duplicado) */
  usuariosData?: UsuarioOption[];
  /** Dados de especialidades pré-carregados */
  especialidadesData?: EspecialidadePericiaOption[];
  /** Dados de peritos pré-carregados */
  peritosData?: PeritoOption[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasMonthWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  especialidadesData,
  peritosData,
}: PericiasMonthWrapperProps) {
  // ---------- Estado do Calendário ----------
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

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
      prazoEntregaInicio: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      prazoEntregaFim: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
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
    globalFilter, currentMonth, situacaoFilter, responsavelFilter, laudoFilter,
    tribunalFilter, grauFilter, especialidadeFilter, peritoFilter,
  ]);

  // ---------- Data Fetching ----------
  const { pericias, isLoading, error, refetch } = usePericias(hookParams);

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
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando perícias..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar perícias: ${error}`} onRetry={refetch} />
        ) : (
          <div className="bg-card border rounded-md overflow-hidden flex-1 min-h-0">
            <div className="flex h-full">
              {/* Calendário compacto — largura fixa */}
              <div className="w-[480px] shrink-0 border-r p-6 overflow-auto">
                <PericiasCalendarCompact
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  pericias={pericias}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                />
              </div>

              {/* Lista do dia — ocupa todo o espaço restante */}
              <div className="flex-1 min-w-0">
                <PericiasDayList
                  selectedDate={selectedDate}
                  pericias={pericias}
                  onAddPericia={() => setIsCreateDialogOpen(true)}
                />
              </div>
            </div>
          </div>
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
    </>
  );
}
