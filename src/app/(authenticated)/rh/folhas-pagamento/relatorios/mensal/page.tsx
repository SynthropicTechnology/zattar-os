'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { useFolhaDoPeriodo } from '@/app/(authenticated)/rh/hooks';

import { MESES_LABELS, STATUS_FOLHA_LABELS } from '@/app/(authenticated)/rh';
import { Heading } from '@/components/ui/typography';

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

export default function RelatorioMensalFolhaPage() {
  const hoje = new Date();
  const [ano, setAno] = React.useState(hoje.getFullYear());
  const [mes, setMes] = React.useState(hoje.getMonth() + 1);

  const { folha, isLoading, error, refetch } = useFolhaDoPeriodo({ ano, mes });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="page">Relatório Mensal da Folha</Heading>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-muted-foreground">Mês</label>
            <Select value={mes.toString()} onValueChange={(value) => setMes(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MESES_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Ano</label>
            <Select value={ano.toString()} onValueChange={(value) => setAno(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[ano - 2, ano - 1, ano, ano + 1].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-muted-foreground">Carregando...</CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {folha && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
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
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-semibold">{STATUS_FOLHA_LABELS[folha.status]}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data Pagamento</p>
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
              <CardTitle>Detalhamento por Funcionário</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Valor Bruto</TableHead>
                    <TableHead>Lançamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {folha.itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.usuario?.nomeExibicao ?? item.usuarioId}</TableCell>
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
