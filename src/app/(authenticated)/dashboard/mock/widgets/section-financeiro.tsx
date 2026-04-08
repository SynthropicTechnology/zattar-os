/**
 * WIDGET GALLERY — Seção Financeiro
 * ============================================================================
 * Visualizações do módulo financeiro com dados mock realistas para
 * escritório de advocacia brasileiro. Estética "Glass Briefing".
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  AlertTriangle,
  Activity,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

import {
  GallerySection,
  WidgetContainer,
  MiniBar,
  MiniArea,
  MiniDonut,
  Sparkline,
  ProgressRing,
  Stat,
  AnimatedNumber,
  GaugeMeter,
  InsightBanner,
  TabToggle,
  Treemap,
  ComparisonStat,
  fmtMoeda,
} from './primitives';

// ─── Dados Mock ─────────────────────────────────────────────────────────────

const fluxoCaixaData = [
  { label: 'Out', value: 45000, value2: 32000 },
  { label: 'Nov', value: 52000, value2: 38000 },
  { label: 'Dez', value: 48000, value2: 41000 },
  { label: 'Jan', value: 61000, value2: 35000 },
  { label: 'Fev', value: 55000, value2: 42000 },
  { label: 'Mar', value: 67500, value2: 32100 },
];

const saldoTrend = [98200, 102400, 95800, 108300, 111200, 99700, 115600, 109800, 118400, 121000, 119300, 124350];

const contasReceberAging = [
  { label: 'A vencer', value: 42000, color: 'var(--success)' },
  { label: 'Até 30d', value: 15000, color: 'var(--chart-success-dark)' },
  { label: '30–60d', value: 7000, color: 'var(--warning)' },
  { label: '60–90d', value: 2500, color: 'var(--chart-warning-dark)' },
  { label: '90+ dias', value: 1000, color: 'var(--destructive)' },
];

const contasPagarAging = [
  { label: 'A vencer', value: 22000, color: 'var(--success)' },
  { label: 'Até 30d', value: 6000, color: 'var(--chart-success-dark)' },
  { label: '30–60d', value: 2800, color: 'var(--warning)' },
  { label: '60–90d', value: 1000, color: 'var(--chart-warning-dark)' },
  { label: '90+ dias', value: 300, color: 'var(--destructive)' },
];

const despesasSegmentos = [
  { label: 'Pessoal', value: 18500, color: 'var(--primary)' },
  { label: 'Aluguel', value: 6200, color: 'var(--chart-2)' },
  { label: 'Serviços', value: 4100, color: 'var(--chart-3)' },
  { label: 'Tributário', value: 2800, color: 'var(--warning)' },
  { label: 'Outros', value: 600, color: 'var(--muted-foreground)' },
];

const dreSparklines: Record<string, number[]> = {
  receita: [52000, 58000, 55000, 61000, 57000, 63000, 60000, 65000, 62000, 68000, 64000, 67500],
  despesa: [38000, 35000, 37000, 34000, 36000, 33000, 35000, 32000, 34000, 31000, 33000, 32100],
  resultado: [14000, 23000, 18000, 27000, 21000, 30000, 25000, 33000, 28000, 37000, 31000, 35400],
};

const INADIMPLENCIA_PERCENT = 12;
const TOTAL_A_RECEBER = 67500;
const VALOR_EM_ATRASO = 8200;

// ─── Widget 1: Saúde Financeira (Hero, col-span-full) ───────────────────────

export function WidgetSaúdeFinanceira() {
  return (
    <WidgetContainer
      title="Saúde Financeira"
      subtitle="Visão consolidada — março 2026"
      icon={Activity}
      className="md:col-span-3"
      depth={2}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

        {/* Gauge */}
        <div className="shrink-0">
          <GaugeMeter
            value={78}
            max={100}
            size={100}
            status="good"
            label="Saúde"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch bg-border/15" />

        {/* Stats horizontais */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Saldo</p>
            <p className="font-display text-base font-bold tabular-nums">
              <AnimatedNumber value={124350} prefix={"R$\u00a0"} duration={1200} />
            </p>
            <p className="text-[10px] text-success/60">+12% mês</p>
          </div>

          <div className="w-px self-stretch bg-border/10" />

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">A receber</p>
            <p className="font-display text-base font-bold tabular-nums text-success/80">
              <AnimatedNumber value={67500} prefix={"R$\u00a0"} duration={1400} />
            </p>
            <p className="text-[10px] text-muted-foreground/55">carteira ativa</p>
          </div>

          <div className="w-px self-stretch bg-border/10" />

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">A pagar</p>
            <p className="font-display text-base font-bold tabular-nums text-destructive/70">
              <AnimatedNumber value={32100} prefix={"R$\u00a0"} duration={1600} />
            </p>
            <p className="text-[10px] text-muted-foreground/55">vencimentos próx.</p>
          </div>

          <div className="w-px self-stretch bg-border/10" />

          <div className="flex flex-col gap-0.5">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Resultado mês</p>
            <p className="font-display text-base font-bold tabular-nums text-primary/90">
              <AnimatedNumber value={35400} prefix={"R$\u00a0"} duration={1800} />
            </p>
            <p className="text-[10px] text-success/60">margem 52,4%</p>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px self-stretch bg-border/15" />

        {/* Insight */}
        <div className="shrink-0 max-w-50">
          <InsightBanner type="info">
            Receita projetada de R$\u00a072k para abril baseada na tendência dos últimos 3 meses.
          </InsightBanner>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 2: Fluxo de Caixa 6 Meses ───────────────────────────────────────

export function WidgetFluxoCaixa() {
  return (
    <WidgetContainer
      title="Fluxo de Caixa"
      subtitle="Últimos 6 meses"
      icon={Wallet}
      className="md:col-span-2"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-sm bg-primary/60" />
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">Receita</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block size-2 rounded-sm bg-chart-2/60" />
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">Despesa</span>
        </div>
      </div>
      <MiniBar
        data={fluxoCaixaData}
        height={64}
        barColor="bg-primary/60"
        barColor2="bg-chart-2/60"
      />
      <div className="flex justify-between mt-3 pt-3 border-t border-border/10">
        <div>
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Receita mar</p>
          <p className="text-sm font-semibold font-display tabular-nums">{fmtMoeda(67500)}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Despesa mar</p>
          <p className="text-sm font-semibold font-display tabular-nums">{fmtMoeda(32100)}</p>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 3: Saldo & Trend ─────────────────────────────────────────────────

export function WidgetSaldoTrend() {
  return (
    <WidgetContainer
      title="Saldo Atual"
      subtitle="Conta corrente consolidada"
      icon={TrendingUp}
    >
      <div className="flex items-end justify-between gap-4">
        <Stat
          label="Saldo disponível"
          value={fmtMoeda(124350.80)}
          delta="+12% vs mês anterior"
          deltaType="positive"
        />
        <div className="flex items-center gap-1 text-success/60 shrink-0 mb-1">
          <TrendingUp className="size-3.5" />
          <span className="text-[10px] font-medium">+12%</span>
        </div>
      </div>
      <div className="mt-4 w-full">
        <MiniArea
          data={saldoTrend}
          width={260}
          height={44}
          color="var(--primary)"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-muted-foreground/55 tabular-nums">Abr/25</span>
          <span className="text-[9px] text-muted-foreground/55 tabular-nums">Mar/26</span>
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 4: Contas a Receber Aging ────────────────────────────────────────

export function WidgetContasReceber() {
  const total = contasReceberAging.reduce((acc, r) => acc + r.value, 0);
  const maxVal = Math.max(...contasReceberAging.map((r) => r.value));

  return (
    <WidgetContainer
      title="Contas a Receber"
      subtitle="Aging por vencimento"
      icon={ArrowUpRight}
      action={
        <span className="text-xs font-semibold tabular-nums text-success/70">
          {fmtMoeda(total)}
        </span>
      }
    >
      <div className="flex flex-col gap-2 mt-1">
        {contasReceberAging.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground/50">{item.label}</span>
              <span className="text-[10px] tabular-nums font-medium" style={{ color: item.color }}>
                {fmtMoeda(item.value)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  backgroundColor: item.color,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 5: Contas a Pagar Aging ─────────────────────────────────────────

export function WidgetContasPagar() {
  const total = contasPagarAging.reduce((acc, r) => acc + r.value, 0);
  const maxVal = Math.max(...contasPagarAging.map((r) => r.value));

  return (
    <WidgetContainer
      title="Contas a Pagar"
      subtitle="Aging por vencimento"
      icon={ArrowDownLeft}
      action={
        <span className="text-xs font-semibold tabular-nums text-destructive/60">
          {fmtMoeda(total)}
        </span>
      }
    >
      <div className="flex flex-col gap-2 mt-1">
        {contasPagarAging.map((item) => (
          <div key={item.label}>
            <div className="flex justify-between mb-0.5">
              <span className="text-[10px] text-muted-foreground/50">{item.label}</span>
              <span className="text-[10px] tabular-nums font-medium" style={{ color: item.color }}>
                {fmtMoeda(item.value)}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  backgroundColor: item.color,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 6: Despesas por Categoria ────────────────────────────────────────

export function WidgetDespesasCategoria() {
  const total = despesasSegmentos.reduce((acc, s) => acc + s.value, 0);

  return (
    <WidgetContainer
      title="Despesas"
      subtitle="Por categoria — março"
      icon={PieChart}
    >
      <div className="flex items-center gap-5 mt-1">
        <MiniDonut
          segments={despesasSegmentos}
          size={84}
          strokeWidth={12}
          centerLabel={fmtMoeda(total).replace('R$\u00a0', 'R$\n')}
        />
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {despesasSegmentos.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="size-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-[10px] text-muted-foreground/60 truncate">{seg.label}</span>
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground/80 font-medium shrink-0">
                {fmtMoeda(seg.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 7: DRE Comparativo ───────────────────────────────────────────────

export function WidgetDREComparativo() {
  return (
    <WidgetContainer
      title="DRE Comparativo"
      subtitle="Março vs fevereiro"
      icon={TrendingUp}
    >
      <div className="grid grid-cols-3 gap-3 mt-1 divide-x divide-border/10">

        {/* Receita */}
        <div className="pr-3">
          <Stat
            label="Receita"
            value={fmtMoeda(67500)}
            delta="+8%"
            deltaType="positive"
            small
          />
          <div className="mt-2">
            <Sparkline
              data={dreSparklines.receita}
              width={64}
              height={20}
              color="var(--success)"
            />
          </div>
        </div>

        {/* Despesa */}
        <div className="px-3">
          <Stat
            label="Despesa"
            value={fmtMoeda(32100)}
            delta="-3%"
            deltaType="positive"
            small
          />
          <div className="mt-2">
            <Sparkline
              data={dreSparklines.despesa}
              width={64}
              height={20}
              color="var(--destructive)"
            />
          </div>
        </div>

        {/* Resultado */}
        <div className="pl-3">
          <Stat
            label="Resultado"
            value={fmtMoeda(35400)}
            delta="+22%"
            deltaType="positive"
            small
          />
          <div className="mt-2">
            <Sparkline
              data={dreSparklines.resultado}
              width={64}
              height={20}
              color="var(--primary)"
            />
          </div>
        </div>

      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/10">
        <div className="flex items-center gap-1.5 text-success/60">
          <TrendingUp className="size-3.5" />
          <span className="text-[10px]">Margem líquida</span>
        </div>
        <span className="text-sm font-bold tabular-nums font-display text-success/80">52,4%</span>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 8: Inadimplência ─────────────────────────────────────────────────

export function WidgetInadimplencia() {
  const isAlert = INADIMPLENCIA_PERCENT > 10;
  const ringColor = isAlert ? 'var(--destructive)' : 'var(--success)';

  return (
    <WidgetContainer
      title="Inadimplência"
      subtitle="Sobre carteira a receber"
      icon={AlertTriangle}
    >
      <div className="flex items-center gap-5 mt-1">
        <ProgressRing
          percent={INADIMPLENCIA_PERCENT}
          size={72}
          color={ringColor}
        />
        <div className="flex flex-col gap-1">
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
              Em atraso
            </p>
            <p
              className="text-lg font-bold font-display tabular-nums"
              style={{ color: ringColor }}
            >
              {fmtMoeda(VALOR_EM_ATRASO)}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider mb-0.5">
              Carteira total
            </p>
            <p className="text-sm font-semibold font-display tabular-nums text-muted-foreground/70">
              {fmtMoeda(TOTAL_A_RECEBER)}
            </p>
          </div>
        </div>
      </div>

      {isAlert && (
        <div className="flex items-center gap-2 mt-4 px-3 py-2 rounded-lg bg-destructive/8 border border-destructive/15">
          <AlertTriangle className="size-3.5 text-destructive/70 shrink-0" />
          <p className="text-[10px] text-destructive/70">
            Inadimplência acima do limite recomendado de 10%.
          </p>
        </div>
      )}

      {!isAlert && (
        <div className="mt-4 pt-3 border-t border-border/10">
          <div className="flex items-center gap-1.5 text-success/60">
            <TrendingDown className="size-3.5" />
            <span className="text-[10px]">Dentro da meta de 10%</span>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

// ─── Widget 9: Despesas Treemap ──────────────────────────────────────────────

const treemapSegmentos = [
  { label: 'Pessoal', value: 18500, color: 'var(--primary)' },
  { label: 'Aluguel', value: 6200, color: 'var(--warning)' },
  { label: 'Serviços', value: 4100, color: 'var(--success)' },
  { label: 'Tributário', value: 2800, color: 'var(--info, var(--primary))' },
  { label: 'Marketing', value: 1800, color: 'var(--chart-2)' },
  { label: 'Outros', value: 600, color: 'var(--chart-muted-soft)' },
];

export function WidgetDespesasTreemap() {
  return (
    <WidgetContainer
      title="Composição de Despesas"
      subtitle="Proporção visual por categoria"
      icon={BarChart2}
    >
      <div className="mt-1">
        <Treemap segments={treemapSegmentos} height={100} />
      </div>

      <div className="mt-4 pt-3 border-t border-border/10 flex items-end justify-between gap-4">
        <ComparisonStat
          label="Total mês"
          current={32100}
          previous={34800}
          format="currency"
        />
        <div className="flex flex-wrap gap-1.5 justify-end">
          {treemapSegmentos.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1">
              <span
                className="size-1.5 rounded-full shrink-0"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[9px] text-muted-foreground/60">{seg.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <InsightBanner type="success">
          Despesas reduziram 7,8% — maior economia em Serviços (-22%).
        </InsightBanner>
      </div>
    </WidgetContainer>
  );
}

// ─── Widget 10: Fluxo com Tabs (Mensal / Acumulado) ──────────────────────────

const fluxoMensalData = [
  { label: 'Out', value: 45000, value2: 32000 },
  { label: 'Nov', value: 52000, value2: 38000 },
  { label: 'Dez', value: 48000, value2: 41000 },
  { label: 'Jan', value: 61000, value2: 35000 },
  { label: 'Fev', value: 55000, value2: 42000 },
  { label: 'Mar', value: 67500, value2: 32100 },
];

// Resultado acumulado (receita - despesa, soma corrente em R$ mil)
const fluxoAcumulado = [13, 27, 34, 60, 73, 108.4];

const tabOptions = [
  { id: 'mensal', label: 'Mensal' },
  { id: 'acumulado', label: 'Acumulado' },
];

export function WidgetFluxoComTabs() {
  const [tab, setTab] = useState<string>('mensal');

  return (
    <WidgetContainer
      title="Resultado Operacional"
      subtitle="Receita vs despesa — 6 meses"
      icon={RefreshCw}
      action={
        <TabToggle
          tabs={tabOptions}
          active={tab}
          onChangeAction={setTab}
        />
      }
    >
      {tab === 'mensal' && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-primary/60" />
              <span className="text-[10px] text-muted-foreground/50">Receita</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-chart-2/60" />
              <span className="text-[10px] text-muted-foreground/50">Despesa</span>
            </div>
          </div>
          <MiniBar
            data={fluxoMensalData}
            height={64}
            barColor="bg-primary/60"
            barColor2="bg-chart-2/60"
          />
          <div className="flex justify-between mt-3 pt-3 border-t border-border/10">
            <div>
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Receita mar</p>
              <p className="text-sm font-semibold font-display tabular-nums">{fmtMoeda(67500)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Despesa mar</p>
              <p className="text-sm font-semibold font-display tabular-nums">{fmtMoeda(32100)}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'acumulado' && (
        <div>
          <p className="text-[10px] text-muted-foreground/60 mb-3">
            Resultado líquido acumulado (R$ mil) — Out/25 a Mar/26
          </p>
          <div className="w-full">
            <MiniArea
              data={fluxoAcumulado}
              width={240}
              height={64}
              color="var(--success)"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/55 tabular-nums">Out/25</span>
              <span className="text-[9px] text-muted-foreground/55 tabular-nums">Mar/26</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/10 flex items-end justify-between">
            <div>
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Acumulado total</p>
              <p className="text-sm font-semibold font-display tabular-nums text-success/80">{fmtMoeda(108400)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">Crescimento</p>
              <p className="text-sm font-semibold font-display tabular-nums text-success/80">+734%</p>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}

// ─── Export Principal ────────────────────────────────────────────────────────

export function FinanceiroWidgets() {
  return (
    <GallerySection
      title="Financeiro"
      description="Fluxo de caixa, aging de recebíveis e pagamentos, composição de despesas e indicadores de performance financeira."
    >
      <WidgetSaúdeFinanceira />
      <WidgetFluxoCaixa />
      <WidgetSaldoTrend />
      <WidgetContasReceber />
      <WidgetContasPagar />
      <WidgetDespesasCategoria />
      <WidgetDREComparativo />
      <WidgetInadimplencia />
      <WidgetDespesasTreemap />
      <WidgetFluxoComTabs />
    </GallerySection>
  );
}
