'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppBadge } from "@/components/ui/app-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useObrigacoes } from "@/app/(authenticated)/financeiro/hooks";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { todayDateString, addDays } from "@/lib/date-utils";
import type { ParcelaComLancamento } from "@/app/(authenticated)/obrigacoes";

type ParcelaObrigacao = ParcelaComLancamento;

// ============================================================================
// Helper Functions
// ============================================================================

function getStatusLabel(status: ParcelaObrigacao['status']): string {
  const labels: Record<ParcelaObrigacao['status'], string> = {
    pendente: 'Pendente',
    recebida: 'Recebida',
    paga: 'Paga',
    atrasada: 'Atrasada',
    cancelada: 'Cancelada',
  };
  return labels[status] || status;
}

function getStatusVariant(status: ParcelaObrigacao['status']): "default" | "destructive" | "outline" | "secondary" {
  if (status === 'pendente' || status === 'atrasada') return 'destructive';
  if (status === 'recebida' || status === 'paga') return 'default';
  return 'outline';
}

function getTipoLabel(parcela: ParcelaObrigacao): string {
  return `Parcela ${parcela.numeroParcela}`;
}

function getTipoBadge(): string {
  return 'Parcela';
}

// ============================================================================
// Component
// ============================================================================

export function ObrigacoesRecentesCard() {
  // Buscar obrigações próximas do vencimento (últimos 7 dias vencidas + próximos 30 dias)
  const hojeStr = todayDateString();

  const { obrigacoes, isLoading, error } = useObrigacoes({
    limite: 10,
    pagina: 1,
    dataVencimentoInicio: addDays(hojeStr, -7),
    dataVencimentoFim: addDays(hojeStr, 30),
  });

  // Ordenar por data de vencimento (mais próximas primeiro)
  const obrigacoesOrdenadas = obrigacoes
    .slice()
    .sort((a, b) => {
      const dataA = new Date(a.dataVencimento).getTime();
      const dataB = new Date(b.dataVencimento).getTime();
      return dataA - dataB;
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className="col-span-full glass-widget bg-transparent transition-all duration-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="col-span-full glass-widget bg-transparent transition-all duration-200">
        <CardHeader>
          <CardTitle>Obrigações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Erro ao carregar obrigações: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (obrigacoesOrdenadas.length === 0) {
    return (
      <Card className="col-span-full glass-widget bg-transparent transition-all duration-200">
        <CardHeader>
          <CardTitle>Obrigações Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhuma obrigação encontrada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full glass-widget bg-transparent transition-all duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Obrigações Recentes</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/acordos-condenacoes">
            Ver todas
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {obrigacoesOrdenadas.map((ob) => (
              <TableRow key={ob.id}>
                <TableCell className="font-medium">
                  <div>{getTipoLabel(ob)}</div>
                </TableCell>
                <TableCell>
                  <AppBadge variant="outline">{getTipoBadge()}</AppBadge>
                </TableCell>
                <TableCell>{formatCurrency(ob.valorBrutoCreditoPrincipal)}</TableCell>
                <TableCell>{formatDate(ob.dataVencimento)}</TableCell>
                <TableCell>
                  <AppBadge variant={getStatusVariant(ob.status)}>
                    {getStatusLabel(ob.status)}
                  </AppBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

