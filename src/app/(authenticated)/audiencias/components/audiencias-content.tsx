'use client';

/**
 * AudienciasContent - Orquestrador da página de audiências
 *
 * Thin router que delega para wrappers auto-contidos:
 * - semana → AudienciasTableWrapper
 * - lista  → AudienciasListWrapper
 * - mês    → AudienciasMonthWrapper
 * - ano    → AudienciasYearWrapper
 *
 * Gerencia apenas:
 * - Routing por URL (sync visualização ↔ pathname)
 * - ViewModePopover (seletor de view compartilhado)
 * - Settings dialog (compartilhado entre views)
 * - Dados auxiliares (usuarios, tiposAudiencia) para evitar fetch duplicado
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { Settings, CalendarDays, CalendarRange, Calendar, List } from 'lucide-react';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';

import {
  ViewModePopover,
  type ViewModeOption,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import type { TipoAudiencia } from '../domain';

import { AudienciasListWrapper } from './audiencias-list-wrapper';
import { AudienciasTableWrapper } from './audiencias-table-wrapper';
import { AudienciasMonthWrapper } from './audiencias-month-wrapper';
import { AudienciasYearWrapper } from './audiencias-year-wrapper';
import { AudienciasMissionView } from './audiencias-mission-view';
import { AudienciaDetailDialog } from './audiencia-detail-dialog';
import { TiposAudienciasList } from './tipos-audiencias-list';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/audiencias/semana',
  mes: '/audiencias/mes',
  ano: '/audiencias/ano',
  lista: '/audiencias/lista',
  quadro: '/audiencias/quadro',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/audiencias': 'semana',
  '/audiencias/semana': 'semana',
  '/audiencias/mes': 'mes',
  '/audiencias/ano': 'ano',
  '/audiencias/lista': 'lista',
  '/audiencias/quadro': 'quadro',
};

// =============================================================================
// TIPOS
// =============================================================================

interface AudienciasContentProps {
  visualizacao?: ViewType;
  /** Dados de usuários pré-carregados no servidor (elimina fetch client-side) */
  initialUsuarios?: { id: number; nomeExibicao?: string; nomeCompleto?: string }[];
  /** Dados de tipos de audiência pré-carregados no servidor (elimina fetch client-side) */
  initialTiposAudiencia?: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function AudienciasContent({
  visualizacao: initialView = 'semana',
  initialUsuarios = [],
  initialTiposAudiencia = [],
}: AudienciasContentProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive view from URL pathname
  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;

  // View State - sync with URL
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);

  // Sync view state when URL changes
  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) {
      setVisualizacao(newView);
    }
  }, [pathname, visualizacao]);

  // Dialog State (compartilhado)
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  // Mission View State
  const [missionDate, setMissionDate] = React.useState(new Date());
  const [missionAudiencias, setMissionAudiencias] = React.useState<import('../domain').Audiencia[]>([]);
  const [selectedMissionAudiencia, setSelectedMissionAudiencia] = React.useState<import('../domain').Audiencia | null>(null);
  const [isMissionDetailOpen, setIsMissionDetailOpen] = React.useState(false);

  // Dados Auxiliares pré-carregados no servidor (passados como props)
  const usuarios = initialUsuarios;
  const tiposAudiencia = initialTiposAudiencia;

  // Week Navigator (apenas para view semana)
  const weekNav = useWeekNavigator();

  // ── Copilot: expor contexto de audiências ──
  useAgentContext({
    description: 'Contexto da tela de audiências: visualização atual e semana selecionada',
    value: {
      visualizacao_atual: visualizacao,
      semana_inicio: weekNav.weekStart?.toISOString() ?? null,
      semana_fim: weekNav.weekEnd?.toISOString() ?? null,
      total_usuarios: usuarios.length,
      total_tipos_audiencia: tiposAudiencia.length,
    },
  });

  // Responsavel names map for Mission View
  const responsavelNomesMap = React.useMemo(() => {
    const map = new Map<number, string>();
    usuarios.forEach((u) => {
      map.set(u.id, u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`);
    });
    return map;
  }, [usuarios]);

  // Fetch audiencias for Mission View when view is 'quadro'
  React.useEffect(() => {
    if (visualizacao !== 'quadro') return;

    const fetchMissionData = async () => {
      try {
        const { actionListarAudiencias } = await import('../actions');
        // Fetch current month for overview + specific day data
        const startOfMonth = new Date(missionDate.getFullYear(), missionDate.getMonth(), 1);
        const endOfMonth = new Date(missionDate.getFullYear(), missionDate.getMonth() + 1, 0, 23, 59, 59);

        const result = await actionListarAudiencias({
          pagina: 1,
          limite: 200,
          dataInicioInicio: startOfMonth.toISOString(),
          dataInicioFim: endOfMonth.toISOString(),
        });

        if (result.success) {
          setMissionAudiencias(result.data.data as import('../domain').Audiencia[]);
        }
      } catch (err) {
        console.error('Erro ao carregar audiências para Mission View:', err);
      }
    };

    fetchMissionData();
  }, [visualizacao, missionDate]);

  // Custom view options with Mission View
  const audienciasViewOptions: ViewModeOption[] = React.useMemo(() => [
    { value: 'semana' as ViewType, label: 'Semana', icon: CalendarDays },
    { value: 'mes' as ViewType, label: 'Mês', icon: CalendarRange },
    { value: 'ano' as ViewType, label: 'Ano', icon: Calendar },
    { value: 'lista' as ViewType, label: 'Lista', icon: List },
    { value: 'quadro' as ViewType, label: 'Missão', icon: Sparkles },
  ], []);

  // Handle visualization change - navigate to the correct URL
  const handleVisualizacaoChange = React.useCallback((value: string) => {
    const viewValue = value as ViewType;
    const targetRoute = VIEW_ROUTES[viewValue];
    if (targetRoute && targetRoute !== pathname) {
      router.push(targetRoute);
    }
    setVisualizacao(viewValue);
  }, [pathname, router]);

  // =============================================================================
  // SLOTS COMPARTILHADOS
  // =============================================================================

  const viewModePopover = (
    <ViewModePopover
      value={visualizacao}
      onValueChange={handleVisualizacaoChange}
      options={audienciasViewOptions}
    />
  );

  const settingsButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon" aria-label="Configurações"
          className="h-9 w-9 bg-card"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Configurações</TooltipContent>
    </Tooltip>
  );

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return (
          <AudienciasListWrapper
            viewModeSlot={viewModePopover}
            usuariosData={usuarios}
            tiposAudienciaData={tiposAudiencia}
          />
        );

      case 'semana':
        return (
          <AudienciasTableWrapper
            fixedDate={weekNav.selectedDate}
            hideDateFilters={true}
            viewModeSlot={viewModePopover}
            weekNavigatorProps={{
              weekDays: weekNav.weekDays,
              selectedDate: weekNav.selectedDate,
              onDateSelect: weekNav.setSelectedDate,
              onPreviousWeek: weekNav.goToPreviousWeek,
              onNextWeek: weekNav.goToNextWeek,
              onToday: weekNav.goToToday,
              isCurrentWeek: weekNav.isCurrentWeek,
            }}
            usuariosData={usuarios}
            tiposAudienciaData={tiposAudiencia}
          />
        );

      case 'mes':
        return (
          <AudienciasMonthWrapper
            viewModeSlot={viewModePopover}
            settingsSlot={settingsButton}
            usuariosData={usuarios}
            tiposAudienciaData={tiposAudiencia}
          />
        );

      case 'ano':
        return (
          <AudienciasYearWrapper
            viewModeSlot={viewModePopover}
            settingsSlot={settingsButton}
            usuariosData={usuarios}
            tiposAudienciaData={tiposAudiencia}
          />
        );

      case 'quadro':
        return (
          <AudienciasMissionView
            audiencias={missionAudiencias}
            currentDate={missionDate}
            onDateChange={setMissionDate}
            onViewDetail={(a) => {
              setSelectedMissionAudiencia(a);
              setIsMissionDetailOpen(true);
            }}
            onEdit={(a) => {
              setSelectedMissionAudiencia(a);
              setIsMissionDetailOpen(true);
            }}
            responsavelNomes={responsavelNomesMap}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conteúdo principal */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>

      {/* Detail Dialog para Mission View */}
      {selectedMissionAudiencia && (
        <AudienciaDetailDialog
          open={isMissionDetailOpen}
          onOpenChange={setIsMissionDetailOpen}
          audiencia={selectedMissionAudiencia}
        />
      )}

      {/* Dialog de Configurações (compartilhado entre todas as views) */}
      <DialogFormShell
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Tipos de Audiências"
        maxWidth="4xl"
        footer={
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposAudienciasList />
        </div>
      </DialogFormShell>
    </div>
  );
}
