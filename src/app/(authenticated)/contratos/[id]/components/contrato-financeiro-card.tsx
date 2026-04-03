'use client';

import * as React from 'react';
import { DollarSign, Calendar, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Lancamento, StatusLancamento } from '@/app/(authenticated)/financeiro/domain/lancamentos';

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

function getStatusBadgeVariant(status: StatusLancamento): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants: Record<StatusLancamento, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pendente: 'outline',
    confirmado: 'default',
    pago: 'default',
    recebido: 'default',
    cancelado: 'destructive',
    estornado: 'secondary',
  };
  return variants[status] || 'outline';
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <DollarSign className="size-4" />
            Financeiro
          </span>
          {!isEmpty && (
            <div className="flex items-center gap-4 text-sm font-normal">
              <span className="text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatCurrency(totalReceitas)}</span>
              </span>
              {totalPendente > 0 && (
                <span className="text-warning flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  Pendente: {formatCurrency(totalPendente)}
                </span>
              )}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
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
          <div className="rounded-md border">
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
                    <TableCell className="text-right font-mono">
                      {formatCurrency(lancamento.valor)}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Calendar className="size-3 text-muted-foreground" />
                        {formatDate(lancamento.dataVencimento)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(lancamento.status)}>
                        {getStatusLabel(lancamento.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {lancamentos.length > 10 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                Mostrando 10 de {lancamentos.length} lançamentos
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
