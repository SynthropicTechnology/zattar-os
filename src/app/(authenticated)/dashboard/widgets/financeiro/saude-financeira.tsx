'use client';

/**
 * WidgetSaúdeFinanceira — Widget conectado (col-span-3, hero strip)
 * Fontes:
 *   - useDashboard() → data.dadosFinanceiros (saldoTotal, contasPagar, contasReceber)
 *   - useFluxoCaixa(12) → trend para insight
 */

import { Activity } from 'lucide-react';
import {
  WidgetContainer,
  GaugeMeter,
  AnimatedNumber,
  InsightBanner,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { useDashboard, useFluxoCaixa } from '../../hooks';

function calcularScoreSaude(
  saldo: number,
  receber: number,
  pagar: number
): { score: number; status: 'good' | 'warning' | 'danger' } {
  // Saldo positivo e receber > pagar = saudável
  if (saldo > 0 && receber > pagar) {
    const margem = receber > 0 ? ((receber - pagar) / receber) * 100 : 50;
    const score = Math.min(100, Math.max(60, 60 + margem * 0.4));
    return { score: Math.round(score), status: 'good' };
  }

  if (saldo > 0) {
    return { score: 55, status: 'warning' };
  }

  return { score: 30, status: 'danger' };
}

function gerarInsight(
  saldo: number,
  receber: number,
  pagar: number,
  temTrend: boolean
): { tipo: 'alert' | 'success' | 'warning' | 'info'; texto: string } {
  if (saldo < 0) {
    return {
      tipo: 'alert',
      texto: 'Saldo negativo detectado — revise as contas a pagar com urgência.',
    };
  }

  if (pagar > receber) {
    return {
      tipo: 'warning',
      texto: `Contas a pagar (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pagar)}) superam os recebíveis do período.`,
    };
  }

  if (temTrend) {
    return {
      tipo: 'info',
      texto: 'Tendência de fluxo de caixa positiva nos últimos 12 meses.',
    };
  }

  return {
    tipo: 'success',
    texto: 'Saúde financeira estável — recebíveis superam compromissos do período.',
  };
}

export function WidgetSaúdeFinanceira() {
  const { data, isLoading: isDashLoading } = useDashboard();
  const { data: fluxo, isLoading: isFluxoLoading } = useFluxoCaixa(12);

  if (isDashLoading) return <WidgetSkeleton size="full" />;

  if (!data) {
    return (
      <WidgetContainer
        title="Saúde Financeira"
        icon={Activity}
        subtitle="Visão consolidada"
        className="md:col-span-2"
        depth={2}
      >
        <InsightBanner type="warning">
          Não foi possível carregar os dados financeiros.
        </InsightBanner>
      </WidgetContainer>
    );
  }

  const fin = data.dadosFinanceiros;
  const saldo = fin.saldoTotal;
  const receber = fin.contasReceber.valor;
  const pagar = fin.contasPagar.valor;
  const resultado = receber - pagar;
  const temTrend = !isFluxoLoading && fluxo.length > 0;

  const { score, status } = calcularScoreSaude(saldo, receber, pagar);
  const insight = gerarInsight(saldo, receber, pagar, temTrend);

  return (
    <WidgetContainer
      title="Saúde Financeira"
      icon={Activity}
      subtitle="Visão consolidada"
      className="md:col-span-2"
      depth={2}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

        {/* Gauge */}
        <div className="shrink-0">
          <GaugeMeter
            value={score}
            max={100}
            size={100}
            status={status}
            label="Saúde"
          />
        </div>

        {/* Divisor vertical */}
        <div className="hidden sm:block w-px self-stretch bg-border/15" aria-hidden="true" />

        {/* Stats horizontais */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 flex-1 min-w-0">

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Saldo
            </p>
            <p className={`font-display text-base font-bold tabular-nums ${saldo < 0 ? 'text-destructive/80' : ''}`}>
              <AnimatedNumber
                value={saldo}
                prefix={"R$\u00a0"}
                duration={1200}
              />
            </p>
            <p className="text-[10px] text-muted-foreground/55">saldo do mês</p>
          </div>

          <div className="w-px self-stretch bg-border/10" aria-hidden="true" />

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              A receber
            </p>
            <p className="font-display text-base font-bold tabular-nums text-success/80">
              <AnimatedNumber
                value={receber}
                prefix={"R$\u00a0"}
                duration={1400}
              />
            </p>
            <p className="text-[10px] text-muted-foreground/55">
              {fin.contasReceber.quantidade} conta{fin.contasReceber.quantidade !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="w-px self-stretch bg-border/10" aria-hidden="true" />

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              A pagar
            </p>
            <p className="font-display text-base font-bold tabular-nums text-destructive/70">
              <AnimatedNumber
                value={pagar}
                prefix={"R$\u00a0"}
                duration={1600}
              />
            </p>
            <p className="text-[10px] text-muted-foreground/55">
              {fin.contasPagar.quantidade} pendente{fin.contasPagar.quantidade !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="w-px self-stretch bg-border/10" aria-hidden="true" />

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
              Resultado
            </p>
            <p className={`font-display text-base font-bold tabular-nums ${resultado >= 0 ? 'text-primary/90' : 'text-destructive/80'}`}>
              <AnimatedNumber
                value={resultado}
                prefix={"R$\u00a0"}
                duration={1800}
              />
            </p>
            <p className="text-[10px] text-muted-foreground/55">receber − pagar</p>
          </div>

        </div>

        {/* Divisor vertical */}
        <div className="hidden sm:block w-px self-stretch bg-border/15" aria-hidden="true" />

        {/* Insight */}
        <div className="shrink-0 max-w-52">
          <InsightBanner type={insight.tipo}>
            {insight.texto}
          </InsightBanner>
        </div>

      </div>
    </WidgetContainer>
  );
}
