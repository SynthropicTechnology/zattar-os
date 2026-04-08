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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  ContratoProgressCard,
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
    <Card className="border-l-4 border-l-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <StickyNote className="size-4" />
          Observações
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
          {texto}
        </p>
      </CardContent>
    </Card>
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
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="size-4" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum lançamento financeiro</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <DollarSign className="size-4" />
          Resumo Financeiro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
      </CardContent>
    </Card>
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <History className="size-4" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
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

  return (
    <div className="space-y-6">
      <ContratoDetalhesHeader
        contrato={contrato}
        clienteNome={clienteNome}
        responsavel={responsavel}
      />

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
            <ContratoProgressCard status={contrato.status} />
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
