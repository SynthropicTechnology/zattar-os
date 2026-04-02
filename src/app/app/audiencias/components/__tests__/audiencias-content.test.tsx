/* eslint-disable react/display-name */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { AudienciasContent } from '../audiencias-content';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/audiencias/lista'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

// Mock audit service to prevent module-level createClient call (env vars missing in test)
jest.mock('@/lib/domain/audit/services/audit-log.service', () => ({
  auditLogService: { log: jest.fn(), query: jest.fn() },
  AuditLogService: jest.fn(),
}));
jest.mock('@/lib/domain/audit/hooks/use-audit-logs', () => ({
  useAuditLogs: jest.fn(() => ({ logs: [], isLoading: false })),
}));

// Mock ESM-only @copilotkit modules to prevent "unexpected token 'export'" from @a2ui/lit
jest.mock('@copilotkit/react-core/v2', () => ({
  useAgentContext: jest.fn(() => ({})),
  useAgent: jest.fn(() => ({ run: jest.fn() })),
  useFrontendTool: jest.fn(),
  useConfigureSuggestions: jest.fn(),
  CopilotKitProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock supabase client to avoid missing env vars
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({ data: [], error: null })),
          single: jest.fn(() => ({ data: null, error: null })),
        })),
        order: jest.fn(() => ({ data: [], error: null })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({ subscribe: jest.fn() })),
    })),
    removeChannel: jest.fn(),
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'test' } }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  })),
}));

// Mock shared ViewModePopover
jest.mock('@/components/shared', () => ({
  ViewModePopover: jest.fn(({ value }: { value: string }) => (
    <div data-testid="view-mode-popover">{value}</div>
  )),
  useWeekNavigator: jest.fn(() => ({
    weekStart: new Date('2025-03-10'),
    weekEnd: new Date('2025-03-16'),
    weekDays: [],
    selectedDate: new Date('2025-03-12'),
    setSelectedDate: jest.fn(),
    goToPreviousWeek: jest.fn(),
    goToNextWeek: jest.fn(),
    goToToday: jest.fn(),
    isCurrentWeek: false,
  })),
}));

// Mock child wrapper components that each view delegates to
jest.mock('../audiencias-list-wrapper', () => ({
  AudienciasListWrapper: jest.fn(({ viewModeSlot }: { viewModeSlot: React.ReactNode }) => (
    <div data-testid="audiencias-list-wrapper">{viewModeSlot}</div>
  )),
}));
jest.mock('../audiencias-table-wrapper', () => ({
  AudienciasTableWrapper: jest.fn(({ viewModeSlot }: { viewModeSlot: React.ReactNode }) => (
    <div data-testid="audiencias-table-wrapper">{viewModeSlot}</div>
  )),
}));
jest.mock('../audiencias-month-wrapper', () => ({
  AudienciasMonthWrapper: jest.fn(({ viewModeSlot }: { viewModeSlot: React.ReactNode }) => (
    <div data-testid="audiencias-month-wrapper">{viewModeSlot}</div>
  )),
}));
jest.mock('../audiencias-year-wrapper', () => ({
  AudienciasYearWrapper: jest.fn(({ viewModeSlot }: { viewModeSlot: React.ReactNode }) => (
    <div data-testid="audiencias-year-wrapper">{viewModeSlot}</div>
  )),
}));
jest.mock('../audiencias-mission-view', () => ({
  AudienciasMissionView: jest.fn(() => (
    <div data-testid="audiencias-mission-view" />
  )),
}));
jest.mock('../audiencia-detail-sheet', () => ({
  AudienciaDetailSheet: jest.fn(() => null),
}));
jest.mock('../tipos-audiencias-list', () => ({
  TiposAudienciasList: jest.fn(() => null),
}));

// Mock DialogFormShell
jest.mock('@/components/shared/dialog-shell', () => ({
  DialogFormShell: jest.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-form-shell">{children}</div>
  )),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Settings: () => <span data-testid="icon-settings" />,
  CalendarDays: () => <span />,
  CalendarRange: () => <span />,
  Calendar: () => <span />,
  List: () => <span />,
  Sparkles: () => <span />,
}));

// Mock tooltip
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => (
    <div ref={ref} {...props}>{children}</div>
  )),
}));

describe('AudienciasContent', () => {
  beforeEach(() => {
    // Reset to default pathname before each test
    (usePathname as jest.Mock).mockReturnValue('/audiencias/lista');
  });

  it('renders lista view when visualizacao="lista"', () => {
    render(<AudienciasContent visualizacao="lista" />);

    expect(screen.getByTestId('audiencias-list-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('view-mode-popover')).toBeInTheDocument();
  });

  it('renders semana view', () => {
    (usePathname as jest.Mock).mockReturnValue('/audiencias/semana');

    render(<AudienciasContent visualizacao="semana" />);

    expect(screen.getByTestId('audiencias-table-wrapper')).toBeInTheDocument();
  });

  it('renders mes view', () => {
    (usePathname as jest.Mock).mockReturnValue('/audiencias/mes');

    render(<AudienciasContent visualizacao="mes" />);

    expect(screen.getByTestId('audiencias-month-wrapper')).toBeInTheDocument();
  });

  it('renders ano view', () => {
    (usePathname as jest.Mock).mockReturnValue('/audiencias/ano');

    render(<AudienciasContent visualizacao="ano" />);

    expect(screen.getByTestId('audiencias-year-wrapper')).toBeInTheDocument();
  });

  it('passes ViewModePopover as slot to wrapper', () => {
    render(<AudienciasContent visualizacao="lista" />);

    // ViewModePopover should be rendered inside the wrapper via viewModeSlot
    const popover = screen.getByTestId('view-mode-popover');
    expect(popover).toBeInTheDocument();
    // The popover should show current value
    expect(popover).toHaveTextContent('lista');
  });

  it('renders settings dialog structure', () => {
    render(<AudienciasContent visualizacao="lista" />);

    // DialogFormShell for settings is always rendered
    expect(screen.getByTestId('dialog-form-shell')).toBeInTheDocument();
  });
});
