'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  History,
  ClipboardList,
  StickyNote,
  ArrowRight,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import type {
  Contrato,
  ClienteDetalhado,
  ResponsavelDetalhado,
  SegmentoDetalhado,
  ContratoStatusHistorico,
} from '@/app/(authenticated)/contratos';
import {
  STATUS_CONTRATO_LABELS,
} from '@/app/(authenticated)/contratos';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import type { Lancamento } from '@/app/(authenticated)/financeiro/domain';
import type { EntrevistaTrabalhista, EntrevistaAnexo } from '@/app/(authenticated)/entrevistas-trabalhistas';
import { EntrevistaTab } from '@/app/(authenticated)/entrevistas-trabalhistas';
import {
  ContratoDetalhesHeader,
  ContratoDetalhesCard,
  ContratoProcessosCard,
  ContratoFinanceiroCard,
  ContratoDocumentosCard,
  ContratoTimeline,
} from './components';

// =============================================================================
// Seções compactas para tab Resumo
// =============================================================================

function ObservacoesSection({ texto }: { texto: string }) {
  return (
    <WidgetContainer title="Observações" icon={StickyNote}>
      <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
        {texto}
      </p>
    </WidgetContainer>
  );
}

function ResumoFinanceiroSection({ lancamentos }: { lancamentos: Lancamento[] }) {
  const totalReceitas = lancamentos
    .filter((l) => l.tipo === 'receita' && l.status !== 'cancelado' && l.status !== 'estornado')
    .reduce((acc, l) => acc + l.valor, 0);

  const totalPendente = lancamentos
    .filter((l) => l.status === 'pendente')
    .reduce((acc, l) => acc + l.valor, 0);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (lancamentos.length === 0) {
    return (
      <WidgetContainer title="Resumo Financeiro" icon={DollarSign}>
        <p className="text-sm text-muted-foreground">Nenhum lançamento financeiro</p>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer title="Resumo Financeiro" icon={DollarSign}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="text-lg font-semibold">{formatCurrency(totalReceitas)}</p>
          </div>
          {totalPendente > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <AlertCircle className="size-3" />
                Pendente
              </p>
              <p className="text-lg font-semibold text-warning">{formatCurrency(totalPendente)}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {lancamentos.length} lançamento{lancamentos.length !== 1 ? 's' : ''}
        </p>
      </div>
    </WidgetContainer>
  );
}

function formatDateTime(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function AtividadeRecenteSection({ historico }: { historico: ContratoStatusHistorico[] }) {
  if (historico.length === 0) return null;

  const sorted = [...historico]
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    .slice(0, 3);

  return (
    <WidgetContainer title="Atividade Recente" icon={History}>
      <div className="space-y-3">
        {sorted.map((item) => {
          const toLabel = STATUS_CONTRATO_LABELS[item.toStatus] || item.toStatus;
          const fromLabel = item.fromStatus
            ? STATUS_CONTRATO_LABELS[item.fromStatus] || item.fromStatus
            : null;
          const variant = getSemanticBadgeVariant('status_contrato', item.toStatus);

          return (
            <div key={item.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {fromLabel && (
                  <>
                    <span className="text-xs text-muted-foreground truncate">{fromLabel}</span>
                    <ArrowRight className="size-3 text-muted-foreground shrink-0" />
                  </>
                )}
                <Badge variant={variant} className="text-xs shrink-0">
                  {toLabel}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(item.changedAt)}
              </span>
            </div>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

interface ContratoDetalhesClientProps {
  contrato: Contrato;
  cliente: ClienteDetalhado | null;
  responsavel: ResponsavelDetalhado | null;
  segmento: SegmentoDetalhado | null;
  lancamentos: Lancamento[];
  entrevista?: EntrevistaTrabalhista | null;
  entrevistaAnexos?: EntrevistaAnexo[];
}

export function ContratoDetalhesClient({
  contrato,
  cliente,
  responsavel,
  segmento,
  lancamentos,
  entrevista = null,
  entrevistaAnexos = [],
}: ContratoDetalhesClientProps) {
  const clienteNome = cliente?.nome ?? `Cliente #${contrato.clienteId}`;

  const totalPartes = contrato.partes.length;
  const totalProcessos = contrato.processos.length;
  const totalLancamentos = lancamentos.length;
  const totalValor = lancamentos
    .filter((l) => l.tipo === 'receita' && l.status !== 'cancelado' && l.status !== 'estornado')
    .reduce((acc, l) => acc + l.valor, 0);

  const formatCurrencyCompact = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-5">
      <ContratoDetalhesHeader
        contrato={contrato}
        clienteNome={clienteNome}
        responsavel={responsavel}
      />

      <div className="grid grid-cols-4 gap-3">
        <GlassPanel depth={2} className="px-4 py-3 text-center">
          <p className="font-display text-xl font-bold tabular-nums">{totalPartes}</p>
          <Text variant="meta-label">Partes</Text>
        </GlassPanel>
        <GlassPanel depth={2} className="px-4 py-3 text-center">
          <p className="font-display text-xl font-bold tabular-nums">{totalProcessos}</p>
          <Text variant="meta-label">Processos</Text>
        </GlassPanel>
        <GlassPanel depth={2} className="px-4 py-3 text-center">
          <p className="font-display text-xl font-bold tabular-nums">{totalLancamentos}</p>
          <Text variant="meta-label">Documentos</Text>
        </GlassPanel>
        <GlassPanel depth={2} className="px-4 py-3 text-center">
          <p className="font-display text-xl font-bold tabular-nums">{formatCurrencyCompact(totalValor)}</p>
          <Text variant="meta-label">Valor</Text>
        </GlassPanel>
      </div>

      <Tabs defaultValue="resumo" className="space-y-6">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="resumo">
            <LayoutDashboard className="size-4" />
            Resumo
          </TabsTrigger>
          <TabsTrigger value="financeiro">
            <Wallet className="size-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <FileText className="size-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="size-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="entrevista">
            <ClipboardList className="size-4" />
            Entrevista
          </TabsTrigger>
        </TabsList>

        {/* ============================================================= */}
        {/* Tab Resumo — Layout IFM                                       */}
        {/* ============================================================= */}
        <TabsContent value="resumo" className="space-y-4">
          {/* 1. Observações (se existirem) */}
          {contrato.observacoes && (
            <ObservacoesSection texto={contrato.observacoes} />
          )}

          {/* 2. Detalhes + Progresso (grid 2 cols) */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ContratoDetalhesCard
              tipoCobranca={contrato.tipoCobranca}
              papelClienteNoContrato={contrato.papelClienteNoContrato}
              segmento={segmento}
              cliente={cliente}
            />
          </div>

          {/* 3. Processos Vinculados (full width) */}
          <ContratoProcessosCard processos={contrato.processos} />

          {/* 4. Resumo Financeiro + Atividade Recente (grid 2 cols) */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ResumoFinanceiroSection lancamentos={lancamentos} />
            <AtividadeRecenteSection historico={contrato.statusHistorico} />
          </div>
        </TabsContent>

        <TabsContent value="financeiro">
          <ContratoFinanceiroCard lancamentos={lancamentos} />
        </TabsContent>

        <TabsContent value="documentos">
          <ContratoDocumentosCard contratoId={contrato.id} />
        </TabsContent>

        <TabsContent value="historico">
          <ContratoTimeline historico={contrato.statusHistorico} />
        </TabsContent>

        <TabsContent value="entrevista">
          <EntrevistaTab
            contratoId={contrato.id}
            entrevista={entrevista}
            anexos={entrevistaAnexos}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
