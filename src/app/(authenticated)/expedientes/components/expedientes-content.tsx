'use client';

/**
 * ExpedientesContent - Orquestrador da página de expedientes
 *
 * Thin router que delega para wrappers auto-contidos:
 * - semana → ExpedientesTableWrapper
 * - lista  → ExpedientesListWrapper
 * - mês    → ExpedientesMonthWrapper
 * - ano    → ExpedientesYearWrapper
 *
 * Gerencia apenas:
 * - Routing por URL (sync visualização ↔ pathname)
 * - ViewModePopover (seletor de view compartilhado)
 * - Settings dialog (compartilhado entre views)
 * - Dados auxiliares (usuarios, tiposExpedientes) para evitar fetch duplicado
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAgentContext } from '@copilotkit/react-core/v2';
import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { DialogFormShell } from '@/components/shared/dialog-shell';

import {
  ViewModePopover,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes, TiposExpedientesList } from '@/app/(authenticated)/tipos-expedientes';

import { ExpedientesListWrapper } from './expedientes-list-wrapper';
import { ExpedientesTableWrapper } from './expedientes-table-wrapper';
import { ExpedientesMonthWrapper } from './expedientes-month-wrapper';
import { ExpedientesYearWrapper } from './expedientes-year-wrapper';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/expedientes/semana',
  mes: '/expedientes/mes',
  ano: '/expedientes/ano',
  lista: '/expedientes/lista',
  quadro: '/expedientes/quadro',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/expedientes': 'semana',
  '/expedientes/semana': 'semana',
  '/expedientes/mes': 'mes',
  '/expedientes/ano': 'ano',
  '/expedientes/lista': 'lista',
};

// =============================================================================
// TIPOS
// =============================================================================

interface ExpedientesContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ExpedientesContent({ visualizacao: initialView = 'semana' }: ExpedientesContentProps) {
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

  // Dados Auxiliares (passados como props para evitar fetch duplicado nos wrappers)
  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });

  // Week Navigator (apenas para view semana)
  const weekNav = useWeekNavigator();

  // ── Copilot: expor contexto de expedientes ──
  useAgentContext({
    description: 'Contexto da tela de expedientes: visualização atual e semana selecionada',
    value: {
      visualizacao_atual: visualizacao,
      semana_inicio: weekNav.weekStart?.toISOString() ?? null,
      semana_fim: weekNav.weekEnd?.toISOString() ?? null,
      total_tipos_expedientes: tiposExpedientes?.length ?? 0,
    },
  });

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
    />
  );

  const settingsButton = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
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
          <ExpedientesListWrapper
            viewModeSlot={viewModePopover}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
          />
        );

      case 'semana':
        return (
          <ExpedientesTableWrapper
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
            tiposExpedientesData={tiposExpedientes}
          />
        );

      case 'mes':
        return (
          <ExpedientesMonthWrapper
            viewModeSlot={viewModePopover}
            settingsSlot={settingsButton}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
          />
        );

      case 'ano':
        return (
          <ExpedientesYearWrapper
            viewModeSlot={viewModePopover}
            settingsSlot={settingsButton}
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
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

      {/* Dialog de Configurações (compartilhado entre todas as views) */}
      <DialogFormShell
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        title="Tipos de Expedientes"
        maxWidth="4xl"
        footer={
          <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
            Fechar
          </Button>
        }
      >
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposExpedientesList />
        </div>
      </DialogFormShell>
    </div>
  );
}
