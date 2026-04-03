/**
 * Barrel exports para Hooks do Dashboard
 */

export {
  useDashboard,
  DashboardProvider,
  isDashboardAdmin,
  isDashboardUsuario,
} from './use-dashboard';

export {
  useDashboardFinanceiro,
  useSaldoContas,
  useContasPagarReceber,
  useFluxoCaixa,
  useDespesasPorCategoria,
  useOrcamentoAtual,
  useAlertasFinanceiros,
} from './use-dashboard-financeiro';

export {
  useWidgetPermissions,
  type WidgetPermissions,
} from './use-widget-permissions';

export {
  useReminders,
  type UseRemindersProps,
  type UseRemindersReturn,
} from './use-reminders';

export {
  useWidgetLayout,
  type WidgetLayoutState,
} from './use-widget-layout';
