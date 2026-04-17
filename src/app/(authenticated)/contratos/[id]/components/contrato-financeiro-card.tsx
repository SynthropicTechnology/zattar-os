'use client';

import * as React from 'react';
import { DollarSign, Calendar } from 'lucide-react';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { GlassPanel, WidgetContainer } from '@/components/shared/glass-panel';
import { Text } from '@/components/ui/typography';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import type { Lancamento, StatusLancamento } from '@/app/(authenticated)/financeiro/domain';

interface ContratoFinanceiroCardProps {
  lancamentos: Lancamento[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    // Usa UTC para evitar deslocamento de fuso horário em datas sem hora
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date);
  } catch {
    return '-';
  }
}

function getStatusLabel(status: StatusLancamento): string {
  const labels: Record<StatusLancamento, string> = {
    pendente: 'Pendente',
    confirmado: 'Confirmado',
    pago: 'Pago',
    recebido: 'Recebido',
    cancelado: 'Cancelado',
    estornado: 'Estornado',
  };
  return labels[status] || status;
}

export function ContratoFinanceiroCard({
  lancamentos,
  isLoading = false,
}: ContratoFinanceiroCardProps) {
  const isEmpty = lancamentos.length === 0;

  // Calculate totals
  const totalReceitas = lancamentos
    .filter((l) => l.tipo === 'receita' && l.status !== 'cancelado' && l.status !== 'estornado')
    .reduce((acc, l) => acc + l.valor, 0);

  const totalPendente = lancamentos
    .filter((l) => l.status === 'pendente')
    .reduce((acc, l) => acc + l.valor, 0);

  const valorTotal = totalReceitas + totalPendente;
  const pctRecebido = valorTotal > 0 ? Math.round((totalReceitas / valorTotal) * 100) : 0;

  return (
    <WidgetContainer title="Financeiro" icon={DollarSign}>
      {!isEmpty && (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <GlassPanel depth={2} className="px-4 py-3">
              <Text variant="meta-label">Valor Total</Text>
              <p className="font-display text-base font-bold tabular-nums mt-1">
                {formatCurrency(valorTotal)}
              </p>
            </GlassPanel>
            <GlassPanel depth={2} className="px-4 py-3">
              <Text variant="meta-label">Recebido</Text>
              <p className="font-display text-base font-bold tabular-nums mt-1 text-success">
                {formatCurrency(totalReceitas)}
              </p>
            </GlassPanel>
            <GlassPanel depth={2} className="px-4 py-3">
              <Text variant="meta-label">Pendente</Text>
              <p className="font-display text-base font-bold tabular-nums mt-1 text-warning">
                {formatCurrency(totalPendente)}
              </p>
            </GlassPanel>
          </div>
          <div className="mb-5">
            <div className="flex justify-between mb-1.5">
              <span className="text-[11px] font-medium text-muted-foreground">Progresso de recebimento</span>
              <span className="text-[11px] font-semibold text-primary tabular-nums">{pctRecebido}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${pctRecebido}%` }}
              />
            </div>
          </div>
        </>
      )}
        {isLoading ? (
          <div className="text-center py-6 text-muted-foreground">
            Carregando...
          </div>
        ) : isEmpty ? (
          <div className="text-center py-6 text-muted-foreground">
            <DollarSign className="size-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum lançamento financeiro</p>
          </div>
        ) : (
          <GlassPanel depth={2} className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.slice(0, 10).map((lancamento) => (
                  <TableRow key={lancamento.id}>
                    <TableCell className="font-medium max-w-50 truncate">
                      {lancamento.descricao}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(lancamento.valor)}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="size-3 text-muted-foreground" />
                        {formatDate(lancamento.dataVencimento)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSemanticBadgeVariant('payment_status', lancamento.status)}>
                        {getStatusLabel(lancamento.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {lancamentos.length > 10 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t border-border/20">
                Mostrando 10 de {lancamentos.length} lançamentos
              </div>
            )}
          </GlassPanel>
        )}
    </WidgetContainer>
  );
}
