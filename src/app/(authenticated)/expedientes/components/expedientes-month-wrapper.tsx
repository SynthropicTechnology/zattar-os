'use client';

/**
 * ExpedientesMonthWrapper - Wrapper auto-contido para a view de mês
 *
 * Segue o padrão de AudienciasMonthWrapper:
 * - DataShell + DataTableToolbar
 * - ExpedientesListFilters no filtersSlot
 * - Layout master-detail: calendário compacto + lista do dia
 * - Fetch via useExpedientes com range mensal
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
import { GlassPanel } from '@/components/shared/glass-panel';
import {
  AnimatedNumber,
} from '@/app/(authenticated)/dashboard/mock/widgets/primitives';

import { useExpedientes } from '../hooks/use-expedientes';
import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes } from '@/app/(authenticated)/tipos-expedientes';

import { ExpedientesListFilters, type StatusFilterType, type ResponsavelFilterType } from './expedientes-list-filters';
import { ExpedientesCalendarCompact } from './expedientes-calendar-compact';
import { ExpedientesDayList } from './expedientes-day-list';
import { ExpedienteDialog } from './expediente-dialog';

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

interface ExpedientesMonthWrapperProps {
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

export function ExpedientesMonthWrapper({
  viewModeSlot,
  settingsSlot,
  usuariosData,
  tiposExpedientesData,
}: ExpedientesMonthWrapperProps) {
  // ---------- Estado do Calendário ----------
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

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
      dataPrazoLegalInicio: format(startOfMonth(currentMonth), 'yyyy-MM-dd'),
      dataPrazoLegalFim: format(endOfMonth(currentMonth), 'yyyy-MM-dd'),
      incluirSemPrazo: true,
    };

    // Status
    if (statusFilter === 'pendentes') params.baixado = false;
    if (statusFilter === 'baixados') params.baixado = true;

    // Responsável
    if (responsavelFilter === 'sem_responsavel') {
      params.semResponsavel = true;
    } else if (typeof responsavelFilter === 'number') {
      params.responsavelId = responsavelFilter;
    }

    // Filtros avançados
    if (tribunalFilter) params.trt = tribunalFilter;
    if (grauFilter) params.grau = grauFilter;
    if (tipoExpedienteFilter) params.tipoExpedienteId = parseInt(tipoExpedienteFilter, 10);
    if (origemFilter) params.origem = origemFilter;

    return params;
  }, [globalFilter, currentMonth, statusFilter, responsavelFilter, tribunalFilter, grauFilter, tipoExpedienteFilter, origemFilter]);

  // ---------- Data Fetching ----------
  const { expedientes, isLoading, error, refetch } = useExpedientes(hookParams);

  // ---------- Month Summary ----------
  const monthSummary = React.useMemo(() => {
    const pendentes = expedientes.filter((e) => !e.baixadoEm);
    const baixados = expedientes.filter((e) => !!e.baixadoEm);
    const vencidos = pendentes.filter((e) => e.prazoVencido);
    const total = expedientes.length;
    const pctConclusao = total > 0 ? Math.round((baixados.length / total) * 100) : 0;

    // Dias com vencimentos
    const diasComVencimento = new Set<string>();
    vencidos.forEach((e) => {
      if (e.dataPrazoLegalParte) diasComVencimento.add(e.dataPrazoLegalParte.slice(0, 10));
    });

    return {
      total,
      pendentes: pendentes.length,
      baixados: baixados.length,
      vencidos: vencidos.length,
      pctConclusao,
      diasComVencimento: diasComVencimento.size,
    };
  }, [expedientes]);

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
            }
          />
        }
      >
        {isLoading ? (
          <TemporalViewLoading message="Carregando expedientes..." />
        ) : error ? (
          <TemporalViewError message={`Erro ao carregar expedientes: ${error}`} onRetry={refetch} />
        ) : (
          <div className="flex flex-col gap-4 p-4">
            {/* Month Summary Strip */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total', value: monthSummary.total },
                { label: 'Pendentes', value: monthSummary.pendentes },
                { label: 'Baixados', value: monthSummary.baixados },
                { label: 'Vencidos', value: monthSummary.vencidos, highlight: monthSummary.vencidos > 0 },
                { label: 'Conclusao', value: monthSummary.pctConclusao, suffix: '%' },
                { label: 'Dias risco', value: monthSummary.diasComVencimento, highlight: monthSummary.diasComVencimento > 0 },
              ].map((item) => (
                <GlassPanel key={item.label} depth={1} className="px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/45">{item.label}</p>
                  <p className={`mt-0.5 text-lg font-bold tabular-nums tracking-tight ${item.highlight ? 'text-destructive/80' : ''}`}>
                    <AnimatedNumber value={item.value} />{item.suffix || ''}
                  </p>
                </GlassPanel>
              ))}
            </div>

            {/* Calendar + Day List */}
            <div className="bg-card border rounded-md overflow-hidden flex-1 min-h-0">
              <div className="flex h-full">
                {/* Calendário compacto — largura fixa */}
                <div className="w-120 shrink-0 border-r p-6 overflow-auto">
                  <ExpedientesCalendarCompact
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    expedientes={expedientes}
                    currentMonth={currentMonth}
                    onMonthChange={setCurrentMonth}
                  />
                </div>

                {/* Lista do dia — ocupa todo o espaço restante */}
                <div className="flex-1 min-w-0">
                  <ExpedientesDayList
                    selectedDate={selectedDate}
                    expedientes={expedientes}
                    onAddExpediente={() => setIsCreateDialogOpen(true)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </DataShell>

      <ExpedienteDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />
    </>
  );
}
