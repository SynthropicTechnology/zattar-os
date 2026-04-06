
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { AprovarFolhaDialog } from './aprovar-folha-dialog';
import { PagarFolhaDialog } from './pagar-folha-dialog';
import {
  MESES_LABELS,
  STATUS_FOLHA_LABELS,
} from '../../domain';
import { STATUS_FOLHA_CORES } from '../../utils';
import { useFolhaPagamento, cancelarFolha } from '../../hooks';
import { toast } from 'sonner';
import { Heading } from '@/components/ui/typography';

interface FolhaDetalhesProps {
  folhaId: number;
}

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

export function FolhaDetalhes({ folhaId }: FolhaDetalhesProps) {
  const router = useRouter();
  const [dialogAprovar, setDialogAprovar] = React.useState(false);
  const [dialogPagar, setDialogPagar] = React.useState(false);

  const { folha, isLoading, error, refetch } = useFolhaPagamento(folhaId);

  const cores = folha ? (STATUS_FOLHA_CORES[folha.status] || STATUS_FOLHA_CORES.rascunho) : undefined;

  const handleCancelar = async () => {
    if (!folhaId) return;
    if (!window.confirm('Deseja cancelar esta folha?')) return;

    const result = await cancelarFolha(folhaId, 'Cancelada via tela de detalhes');
    if (!result.success) {
      toast.error(result.error || 'Erro ao cancelar folha');
      return;
    }
    toast.success('Folha cancelada');
    refetch();
  };

  const handleAposAcao = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !folha) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-center text-destructive">
        {error || 'Folha não encontrada'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Heading level="page">
            Folha {MESES_LABELS[folha.mesReferencia]}/{folha.anoReferencia}
          </Heading>
          <p className="text-muted-foreground">
            Gerada em {new Date(folha.dataGeracao).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {cores && (
             <Badge
             className={`${cores.bg} ${cores.text} border ${cores.border}`}
             variant="outline"
           >
             {STATUS_FOLHA_LABELS[folha.status]}
           </Badge>   
          )}
          {folha.status === 'rascunho' && (
            <Button onClick={() => setDialogAprovar(true)}>Aprovar</Button>
          )}
          {folha.status === 'aprovada' && (
            <Button onClick={() => setDialogPagar(true)}>Pagar</Button>
          )}
          {folha.status !== 'paga' && folha.status !== 'cancelada' && (
            <Button variant="outline" onClick={handleCancelar}>
              Cancelar
            </Button>
          )}
          <Button variant="ghost" onClick={() => router.push('/rh/folhas-pagamento')}>
            Voltar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Funcionários</p>
            <p className="text-xl font-semibold">{folha.totalFuncionarios}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <p className="text-xl font-semibold text-success">
              {formatCurrency(folha.valorTotal ?? 0)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Data de Pagamento</p>
            <p className="text-xl font-semibold">
              {folha.dataPagamento
                ? new Date(folha.dataPagamento).toLocaleDateString('pt-BR')
                : '-'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Itens da Folha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Valor Bruto</TableHead>
                <TableHead>Lançamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {folha.itens.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.usuario?.nomeExibicao ?? item.usuarioId}</TableCell>
                  <TableCell>
                    {item.salario
                      ? formatCurrency(item.salario.salarioBruto)
                      : formatCurrency(item.valorBruto)}
                  </TableCell>
                  <TableCell>{formatCurrency(item.valorBruto)}</TableCell>
                  <TableCell>
                    {item.lancamentoFinanceiroId ? (
                      <a
                        className="text-primary underline"
                        href={`/financeiro/lancamentos/${item.lancamentoFinanceiroId}`}
                      >
                        #{item.lancamentoFinanceiroId}
                      </a>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Card de Lançamentos Financeiros - só mostra se houver lançamentos */}
      {folha.itens.some((item) => item.lancamentoFinanceiroId) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Lançamentos Financeiros
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/financeiro?tab=contas-pagar')}
              >
                Ver no Financeiro
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Lançamentos criados quando a folha foi aprovada
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {folha.itens
                .filter((item) => item.lancamentoFinanceiroId)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {item.usuario?.nomeExibicao ?? `Usuário ${item.usuarioId}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Lançamento #{item.lancamentoFinanceiroId}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Salário: {formatCurrency(item.valorBruto)}</span>
                        {folha.status === 'paga' && (
                          <Badge variant={getSemanticBadgeVariant('folha_status', 'PAGA')}>
                            Pago
                          </Badge>
                        )}
                        {folha.status === 'aprovada' && (
                          <Badge variant={getSemanticBadgeVariant('folha_status', 'APROVADA')}>
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/financeiro?tab=contas-pagar`)}
                    >
                      Ver Detalhes →
                    </Button>
                  </div>
                ))}
            </div>
            <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <strong>Nota:</strong> Os lançamentos financeiros são criados automaticamente quando
              a folha é aprovada. Para visualizar todos os detalhes e realizar o pagamento, acesse o
              módulo Financeiro.
            </div>
          </CardContent>
        </Card>
      )}

      <AprovarFolhaDialog
        open={dialogAprovar}
        onOpenChange={setDialogAprovar}
        folhaId={folha.id}
        onSuccess={handleAposAcao}
      />

      <PagarFolhaDialog
        open={dialogPagar}
        onOpenChange={setDialogPagar}
        folhaId={folha.id}
        onSuccess={handleAposAcao}
      />
    </div>
  );
}
