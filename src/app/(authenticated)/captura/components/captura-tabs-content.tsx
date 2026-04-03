'use client';

/**
 * CapturaTabsContent - Componente principal com tabs para navegação no módulo de Captura
 */

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { History, CalendarClock, KeyRound, Landmark } from 'lucide-react';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import AgendamentosClient from '@/app/(authenticated)/captura/agendamentos/page-client';
import CredenciaisClient from '@/app/(authenticated)/captura/credenciais/page-client';
import HistoricoClient from '@/app/(authenticated)/captura/historico/page-client';
import TribunaisClient from '@/app/(authenticated)/captura/tribunais/page-client';

// =============================================================================
// TIPOS
// =============================================================================

type CapturaView = 'historico' | 'agendamentos' | 'credenciais' | 'tribunais';

interface CapturaTab {
  value: CapturaView;
  label: string;
  icon: React.ReactNode;
}

// =============================================================================
// CONFIGURAÇÃO DAS TABS
// =============================================================================

const TABS: CapturaTab[] = [
  { value: 'historico', label: 'Histórico', icon: <History /> },
  { value: 'agendamentos', label: 'Agendamentos', icon: <CalendarClock /> },
  { value: 'credenciais', label: 'Credenciais', icon: <KeyRound /> },
  { value: 'tribunais', label: 'Tribunais', icon: <Landmark /> },
];

const VALID_TABS = new Set(TABS.map(t => t.value));

// =============================================================================
// PROPS
// =============================================================================

interface CapturaTabsContentProps {
  /** Tab inicial (padrão: 'historico') */
  initialTab?: CapturaView;
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function CapturaTabsContent({ initialTab = 'historico' }: CapturaTabsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Deriva a tab ativa da URL com validação
  const rawTab = searchParams.get('tab');
  const activeTab = (rawTab && VALID_TABS.has(rawTab as CapturaView)) 
    ? (rawTab as CapturaView) 
    : initialTab;

  // Handler para mudança de tab - atualiza URL
  const handleTabChange = React.useCallback(
    (value: string) => {
      router.push(`/captura?tab=${value}`, { scroll: false });
    },
    [router]
  );

  // =============================================================================
  // RENDERIZAÇÃO DO CONTEÚDO
  // =============================================================================

  const renderContent = () => {
    switch (activeTab) {
      case 'historico':
        return <HistoricoClient />;
      case 'agendamentos':
        return <AgendamentosClient />;
      case 'credenciais':
        return <CredenciaisClient />;
      case 'tribunais':
        return <TribunaisClient />;
      default:
        return <HistoricoClient />;
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <AnimatedIconTabs
        tabs={TABS}
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-fit"
      />
      <div className="mt-4 flex-1 min-h-0">{renderContent()}</div>
    </div>
  );
}

export default CapturaTabsContent;
