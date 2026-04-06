'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, CalendarDays, CalendarRange, Calendar, List, Search, Plus, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/shared/glass-panel';

import {
  ViewModePopover,
  type ViewModeOption,
  useWeekNavigator,
  type ViewType,
} from '@/components/shared';

import { useUsuarios } from '@/app/(authenticated)/usuarios';
import { useTiposExpedientes, TiposExpedientesList } from '@/app/(authenticated)/tipos-expedientes';
import { DialogFormShell } from '@/components/shared/dialog-shell';

import { ExpedientesListWrapper } from './expedientes-list-wrapper';
import { ExpedientesMonthWrapper } from './expedientes-month-wrapper';
import { ExpedientesYearWrapper } from './expedientes-year-wrapper';
import { ExpedientesControlView } from './expedientes-control-view';
import { ExpedientesWeekMission } from './expedientes-week-mission';

const APP_BASE_ROUTE = '/app/expedientes';

const ROUTE_TO_VIEW: Record<string, ViewType> = {
  '/app/expedientes': 'quadro',
  '/app/expedientes/semana': 'semana',
  '/app/expedientes/mes': 'mes',
  '/app/expedientes/ano': 'ano',
  '/app/expedientes/lista': 'lista',
  '/app/expedientes/quadro': 'quadro',
};

const VIEW_ROUTES: Record<ViewType, string> = {
  semana: `${APP_BASE_ROUTE}/semana`,
  mes: `${APP_BASE_ROUTE}/mes`,
  ano: `${APP_BASE_ROUTE}/ano`,
  lista: `${APP_BASE_ROUTE}/lista`,
  quadro: `${APP_BASE_ROUTE}/quadro`,
};

export function ExpedientesContent({ visualizacao: initialView = 'quadro' }: { visualizacao?: ViewType }) {
  const router = useRouter();
  const pathname = usePathname();
  const viewFromUrl = ROUTE_TO_VIEW[pathname] ?? initialView;
  const [visualizacao, setVisualizacao] = React.useState<ViewType>(viewFromUrl);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    const newView = ROUTE_TO_VIEW[pathname];
    if (newView && newView !== visualizacao) setVisualizacao(newView);
  }, [pathname, visualizacao]);

  const { usuarios } = useUsuarios();
  const { tiposExpedientes } = useTiposExpedientes({ limite: 100 });
  const weekNav = useWeekNavigator();

  const expedientesViewOptions: ViewModeOption[] = React.useMemo(() => [
    { value: 'quadro', label: 'Quadro', icon: Sparkles },
    { value: 'semana', label: 'Semana', icon: CalendarDays },
    { value: 'mes', label: 'Mês', icon: CalendarRange },
    { value: 'ano', label: 'Ano', icon: Calendar },
    { value: 'lista', label: 'Lista', icon: List },
  ], []);

  const handleNavigate = (view: ViewType) => {
    router.push(VIEW_ROUTES[view]);
  };

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-foreground">Expedientes</h1>
          <p className="text-muted-foreground text-sm">Gerencie prazos, urgências e controles recursais</p>
        </div>
        <div className="flex gap-2">
          {/* O seletor de View */}
          <ViewModePopover
            options={expedientesViewOptions}
            currentView={visualizacao}
            onViewChange={handleNavigate}
            triggerClassName="w-[140px] h-9"
          />
          <Button className="h-9 gap-2">
            <Plus className="w-4 h-4" />
            Novo Expediente
          </Button>
        </div>
      </div>

      <GlassPanel className="p-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar processo, parte ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button variant="outline" className="h-9 gap-2 shrink-0">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>
      </GlassPanel>

      <main className="min-h-0 transition-opacity duration-300">
        {visualizacao === 'quadro' && (
          <ExpedientesControlView
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
          />
        )}
        {visualizacao === 'lista' && (
          <ExpedientesListWrapper
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
            searchQuery={search}
          />
        )}
        {visualizacao === 'semana' && (
          <ExpedientesWeekMission
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
        )}
        {visualizacao === 'mes' && (
          <ExpedientesMonthWrapper
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
          />
        )}
        {visualizacao === 'ano' && (
          <ExpedientesYearWrapper
            usuariosData={usuarios}
            tiposExpedientesData={tiposExpedientes}
          />
        )}
      </main>

      <DialogFormShell open={isSettingsOpen} onOpenChange={setIsSettingsOpen} title="Tipos" maxWidth="4xl" footer={<Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Fechar</Button>}>
        <div className="flex-1 overflow-auto h-[60vh]">
          <TiposExpedientesList />
        </div>
      </DialogFormShell>
    </>
  );
}
