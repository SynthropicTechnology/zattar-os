'use client';

/**
 * PericiasContent - Orquestrador da página de perícias
 *
 * Thin router que delega para wrappers auto-contidos:
 * - lista  → PericiasListWrapper
 * - semana → PericiasTableWrapper
 * - mês    → PericiasMonthWrapper
 * - ano    → PericiasYearWrapper
 *
 * Gerencia apenas:
 * - Routing por URL (sync visualização ↔ pathname)
 * - ViewModePopover (seletor de view compartilhado)
 * - Dados auxiliares (usuarios, especialidades, peritos) para evitar fetch duplicado
 */

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

import {
  ViewModePopover,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { useUsuarios } from '@/app/app/usuarios';
import { useEspecialidadesPericias } from '../hooks/use-especialidades-pericias';
import { usePeritos } from '../hooks/use-peritos';

import { PericiasListWrapper } from './pericias-list-wrapper';
import { PericiasTableWrapper } from './pericias-table-wrapper';
import { PericiasMonthWrapper } from './pericias-month-wrapper';
import { PericiasYearWrapper } from './pericias-year-wrapper';

// =============================================================================
// MAPEAMENTO URL -> VIEW
// =============================================================================

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: '/pericias/semana',
  mes: '/pericias/mes',
  ano: '/pericias/ano',
  lista: '/pericias/lista',
  quadro: '/pericias/quadro',
};

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/pericias': 'lista',
  '/pericias/lista': 'lista',
  '/pericias/semana': 'semana',
  '/pericias/mes': 'mes',
  '/pericias/ano': 'ano',
};

// =============================================================================
// TIPOS
// =============================================================================

interface PericiasContentProps {
  visualizacao?: ViewType;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PericiasContent({ visualizacao: initialView = 'lista' }: PericiasContentProps) {
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

  // Dados Auxiliares (passados como props para evitar fetch duplicado nos wrappers)
  const { usuarios } = useUsuarios();
  const { especialidades } = useEspecialidadesPericias();
  const { peritos } = usePeritos();

  // Week Navigator (apenas para view semana)
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
          <PericiasListWrapper
            viewModeSlot={viewModePopover}
            usuariosData={usuarios}
            especialidadesData={especialidades}
            peritosData={peritos}
          />
        );

      case 'semana':
        return (
          <PericiasTableWrapper
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
            especialidadesData={especialidades}
            peritosData={peritos}
          />
        );

      case 'mes':
        return (
          <PericiasMonthWrapper
            viewModeSlot={viewModePopover}
            usuariosData={usuarios}
            especialidadesData={especialidades}
            peritosData={peritos}
          />
        );

      case 'ano':
        return (
          <PericiasYearWrapper
            viewModeSlot={viewModePopover}
            usuariosData={usuarios}
            especialidadesData={especialidades}
            peritosData={peritos}
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
    </div>
  );
}
