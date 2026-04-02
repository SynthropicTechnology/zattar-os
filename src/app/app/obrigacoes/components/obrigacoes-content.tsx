'use client';

/**
 * ObrigacoesContent - Orquestrador da página de obrigações
 *
 * Thin router que delega para wrappers auto-contidos:
 * - lista  → ObrigacoesTableWrapper
 * - semana → ObrigacoesTableWrapper (com WeekNavigator)
 * - mês    → ObrigacoesMonthWrapper
 * - ano    → ObrigacoesYearWrapper
 *
 * Gerencia apenas:
 * - Routing por URL (sync visualização ↔ pathname)
 * - ViewModePopover (seletor de view compartilhado)
 * - ResumoCards e AlertasObrigacoes no topo (específico de obrigações)
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  ViewModePopover,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { ResumoCards } from './shared/resumo-cards';
import { AlertasObrigacoes } from './shared/alertas-obrigacoes';
import { ObrigacoesTableWrapper } from './table/obrigacoes-table-wrapper';
import { ObrigacoesMonthWrapper } from './calendar/obrigacoes-month-wrapper';
import { ObrigacoesYearWrapper } from './calendar/obrigacoes-year-wrapper';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/acordos-condenacoes/semana',
  mes: '/acordos-condenacoes/mes',
  ano: '/acordos-condenacoes/ano',
  lista: '/acordos-condenacoes/lista',
  quadro: '/acordos-condenacoes/quadro',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/acordos-condenacoes': 'semana',
  '/acordos-condenacoes/semana': 'semana',
  '/acordos-condenacoes/mes': 'mes',
  '/acordos-condenacoes/ano': 'ano',
  '/acordos-condenacoes/lista': 'lista',
};

// =============================================================================
// TIPOS
// =============================================================================

interface ObrigacoesContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function ObrigacoesContent({ visualizacao: initialView = 'semana' }: ObrigacoesContentProps) {
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

  // Week Navigator (para view semana)
  const weekNav = useWeekNavigator();

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

  // =============================================================================
  // CONTEÚDO BASEADO NA VISUALIZAÇÃO
  // =============================================================================

  const renderContent = () => {
    switch (visualizacao) {
      case 'lista':
        return (
          <ObrigacoesTableWrapper
            viewModeSlot={viewModePopover}
          />
        );

      case 'semana':
        return (
          <ObrigacoesTableWrapper
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
          />
        );

      case 'mes':
        return (
          <ObrigacoesMonthWrapper
            viewModeSlot={viewModePopover}
          />
        );

      case 'ano':
        return (
          <ObrigacoesYearWrapper
            viewModeSlot={viewModePopover}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Resumo e Alertas */}
      <ResumoCards />
      <AlertasObrigacoes />

      {/* Conteúdo principal */}
      <div className="flex-1 min-h-0">
        {renderContent()}
      </div>
    </div>
  );
}
