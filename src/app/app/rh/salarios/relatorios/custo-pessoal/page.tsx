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

import { useFolhasPagamento } from '@/app/app/rh/hooks';

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor ?? 0);

export default function RelatorioCustoPessoalPage() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = React.useState(anoAtual);
  const [periodicidade, setPeriodicidade] = React.useState<'mensal' | 'trimestral' | 'anual'>(
    'mensal'
  );

  const { folhas, isLoading, error, refetch } = useFolhasPagamento({
    anoReferencia: ano,
    limite: 50,
  });

  const custoTotal = folhas.reduce((total, folha) => total + Number(folha.valorTotal ?? 0), 0);
  const mediaMensal = folhas.length ? custoTotal / folhas.length : 0;
  const custoProjetadoAnual = mediaMensal * 12;
  const totalFuncionarios =
    folhas.sort((a, b) => b.anoReferencia - a.anoReferencia || b.mesReferencia - a.mesReferencia)[0]
      ?.totalFuncionarios ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Custo Total com Pessoal</h1>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground">Ano</label>
            <Select value={ano.toString()} onValueChange={(value) => setAno(Number(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[anoAtual - 1, anoAtual, anoAtual + 1].map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Periodicidade</label>
            <Select
              value={periodicidade}
              onValueChange={(value: 'mensal' | 'trimestral' | 'anual') => setPeriodicidade(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-muted-foreground">Carregando dados...</CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Custo Total ({ano})</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold text-green-700">
              {formatCurrency(custoTotal)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Custo Médio Mensal</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {formatCurrency(mediaMensal)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Projeção Anual</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {formatCurrency(custoProjetadoAnual)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total de Funcionários</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">{totalFuncionarios}</CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
