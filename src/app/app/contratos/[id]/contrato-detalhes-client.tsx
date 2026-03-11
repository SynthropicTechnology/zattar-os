'use client';

import * as React from 'react';
import { LayoutDashboard, Wallet, FileText, History, ClipboardList } from 'lucide-react';
import { AnimatedIconTabs } from '@/components/ui/animated-icon-tabs';
import type {
  Contrato,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
  ContratoCompletoStats,
} from '@/features/contratos';
import type { Lancamento } from '@/features/financeiro/domain/lancamentos';
import type { EntrevistaTrabalhista, EntrevistaAnexo } from '@/features/entrevistas-trabalhistas';
import { EntrevistaTab } from '@/features/entrevistas-trabalhistas/components/entrevista-tab';
import {
  ContratoDetalhesHeader,
  ContratoResumoCard,
  ContratoProgressCard,
  ContratoTagsCard,
  ContratoPartesCard,
  ContratoProcessosCard,
  ContratoFinanceiroCard,
  ContratoDocumentosCard,
  ContratoTimeline,
  ParteViewSheet,
  type ParteDisplay,
} from './components';

// =============================================================================
// Tipos e Constantes
// =============================================================================

type ContratoTab = 'resumo' | 'financeiro' | 'documentos' | 'historico' | 'entrevista';

const TABS: { value: ContratoTab; label: string; icon: React.ReactNode }[] = [
  { value: 'resumo', label: 'Resumo', icon: <LayoutDashboard className="h-4 w-4" /> },
  { value: 'financeiro', label: 'Financeiro', icon: <Wallet className="h-4 w-4" /> },
  { value: 'documentos', label: 'Documentos', icon: <FileText className="h-4 w-4" /> },
  { value: 'historico', label: 'Histórico', icon: <History className="h-4 w-4" /> },
  { value: 'entrevista', label: 'Entrevista', icon: <ClipboardList className="h-4 w-4" /> },
];

// =============================================================================
// Componente Principal
// =============================================================================

interface ContratoDetalhesClientProps {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  stats: ContratoCompletoStats;
  lancamentos: Lancamento[];
  entrevista?: EntrevistaTrabalhista | null;
  entrevistaAnexos?: EntrevistaAnexo[];
}

export function ContratoDetalhesClient({
  contrato,
  cliente,
  responsavel,
  segmento,
  stats,
  lancamentos,
  entrevista = null,
  entrevistaAnexos = [],
}: ContratoDetalhesClientProps) {
  const [activeTab, setActiveTab] = React.useState<ContratoTab>('resumo');
  const [selectedParte, setSelectedParte] = React.useState<ParteDisplay | null>(null);
  const [parteSheetOpen, setParteSheetOpen] = React.useState(false);

  const handleViewParte = (parte: ParteDisplay) => {
    setSelectedParte(parte);
    setParteSheetOpen(true);
  };

  const clienteNome = cliente?.nome ?? `Cliente #${contrato.clienteId}`;

  const renderContent = () => {
    switch (activeTab) {
      case 'resumo':
        return (
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-1">
              <ContratoResumoCard
                contrato={contrato}
                cliente={cliente}
                responsavel={responsavel}
                stats={stats}
              />
              <ContratoProgressCard status={contrato.status} />
              <ContratoTagsCard
                tipoContrato={contrato.tipoContrato}
                tipoCobranca={contrato.tipoCobranca}
                papelClienteNoContrato={contrato.papelClienteNoContrato}
                segmento={segmento}
              />
            </div>
            <div className="space-y-4 xl:col-span-2">
              <ContratoPartesCard
                partes={contrato.partes}
                onViewParte={handleViewParte}
              />
              <ContratoProcessosCard processos={contrato.processos} />
            </div>
          </div>
        );
      case 'financeiro':
        return <ContratoFinanceiroCard lancamentos={lancamentos} />;
      case 'documentos':
        return <ContratoDocumentosCard contratoId={contrato.id} />;
      case 'historico':
        return <ContratoTimeline historico={contrato.statusHistorico} />;
      case 'entrevista':
        return (
          <EntrevistaTab
            contratoId={contrato.id}
            entrevista={entrevista}
            anexos={entrevistaAnexos}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <ContratoDetalhesHeader
        contrato={contrato}
        clienteNome={clienteNome}
      />

      <AnimatedIconTabs
        tabs={TABS}
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ContratoTab)}
      />

      <div className="mt-4">
        {renderContent()}
      </div>

      <ParteViewSheet
        open={parteSheetOpen}
        onOpenChange={setParteSheetOpen}
        parte={selectedParte}
      />
    </div>
  );
}
