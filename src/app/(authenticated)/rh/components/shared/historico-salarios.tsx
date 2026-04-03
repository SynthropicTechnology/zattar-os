'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { useSalariosDoUsuario } from '../../hooks/use-salarios';
import { calcularDuracaoVigencia } from '@/app/(authenticated)/rh/utils';

interface HistoricoSalariosProps {
  usuarioId: number;
}

const formatCurrency = (valor: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);

export function HistoricoSalarios({ usuarioId }: HistoricoSalariosProps) {
  const { salarios, isLoading, error, refetch } = useSalariosDoUsuario({
    usuarioId,
    vigente: false,
  });

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
        Carregando histórico salarial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
        {error}
      </div>
    );
  }

  if (salarios.length === 0) {
      return (
        <div className="rounded-lg border bg-card p-6 text-center text-muted-foreground">
            Nenhum histórico salarial encontrado.
        </div>
      );
  }

  const usuarioNome = salarios[0]?.usuario?.nomeExibicao ?? `Usuário ${usuarioId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-heading">Histórico Salarial - {usuarioNome}</h1>
        </div>
        <button
          className="text-sm text-primary underline"
          type="button"
          onClick={() => refetch()}
        >
          Atualizar
        </button>
      </div>

      <div className="space-y-4">
        {salarios.map((salario) => {
          const vigente = !salario.dataFimVigencia;
          const duracao = calcularDuracaoVigencia(
            salario.dataInicioVigencia,
            salario.dataFimVigencia
          );
          return (
            <Card key={salario.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{formatCurrency(salario.salarioBruto)}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Vigência: {new Date(salario.dataInicioVigencia).toLocaleDateString('pt-BR')} {' '}
                    {salario.dataFimVigencia
                      ? `até ${new Date(salario.dataFimVigencia).toLocaleDateString('pt-BR')}`
                      : '(atual)'}
                  </p>
                </div>
                <Badge variant={vigente ? 'default' : 'secondary'}>
                  {vigente ? 'Vigente' : 'Encerrado'} · {duracao.texto}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Cargo: {salario.cargo?.nome ?? 'Não informado'}
                </p>
                {salario.observacoes && (
                  <p className="text-sm text-muted-foreground">Observações: {salario.observacoes}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
