'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  WidgetContainer,
  MiniBar,
  MiniArea,
  TabToggle,
  fmtMoeda,
} from '../../mock/widgets/primitives';
import { WidgetSkeleton } from '../shared/widget-skeleton';
import { fmtMes } from '../shared/fmt-mes';
import { useFluxoCaixa } from '../../hooks';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TAB_OPTIONS = [
  { id: 'mensal', label: 'Mensal' },
  { id: 'acumulado', label: 'Acumulado' },
];

// ─── WidgetFluxoComTabs ───────────────────────────────────────────────────────

export function WidgetFluxoComTabs() {
  const [tab, setTab] = useState<string>('mensal');
  const { data, isLoading, error } = useFluxoCaixa(6);

  if (isLoading) {
    return <WidgetSkeleton size="sm" />;
  }

  if (error || !data || data.length === 0) {
    return (
      <WidgetContainer
        title="Resultado Operacional"
        subtitle="Receita vs despesa — 6 meses"
        icon={RefreshCw}
      >
        <p className="text-[11px] text-muted-foreground/60 py-6 text-center">
          Dados de fluxo de caixa indisponíveis.
        </p>
      </WidgetContainer>
    );
  }

  // Map to MiniBar format (value = receita, value2 = despesa)
  const barData = data.map((d) => ({
    label: fmtMes(d.mes),
    value: d.receitas,
    value2: d.despesas,
  }));

  // Running accumulated saldo for MiniArea
  const acumuladoData = data.reduce<number[]>((acc, d, i) => {
    const saldoPeriodo = d.saldo ?? d.receitas - d.despesas;
    const previous = acc[i - 1] ?? 0;
    acc.push(previous + saldoPeriodo);
    return acc;
  }, []);

  const ultimoPeriodo = data[data.length - 1];
  const ultimoLabel = fmtMes(data[data.length - 1]?.mes ?? '');
  const primeiroLabel = fmtMes(data[0]?.mes ?? '');
  const acumuladoTotal = acumuladoData[acumuladoData.length - 1] ?? 0;

  return (
    <WidgetContainer
      title="Resultado Operacional"
      subtitle="Receita vs despesa — 6 meses"
      icon={RefreshCw}
      action={
        <TabToggle
          tabs={TAB_OPTIONS}
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
            data={barData}
            height={64}
            barColor="bg-primary/60"
            barColor2="bg-chart-2/60"
          />
          <div className="flex justify-between mt-3 pt-3 border-t border-border/10">
            <div>
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                Receita {ultimoLabel}
              </p>
              <p className="text-sm font-semibold font-display tabular-nums">
                {fmtMoeda(ultimoPeriodo?.receitas ?? 0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                Despesa {ultimoLabel}
              </p>
              <p className="text-sm font-semibold font-display tabular-nums">
                {fmtMoeda(ultimoPeriodo?.despesas ?? 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {tab === 'acumulado' && (
        <div>
          <p className="text-[10px] text-muted-foreground/60 mb-3">
            Resultado líquido acumulado — {primeiroLabel} a {ultimoLabel}
          </p>
          <div className="w-full">
            <MiniArea
              data={acumuladoData}
              width={240}
              height={64}
              color="var(--success)"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/55 tabular-nums">{primeiroLabel}</span>
              <span className="text-[9px] text-muted-foreground/55 tabular-nums">{ultimoLabel}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/10 flex items-end justify-between">
            <div>
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                Acumulado total
              </p>
              <p className="text-sm font-semibold font-display tabular-nums text-success/80">
                {fmtMoeda(acumuladoTotal)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
                Saldo último período
              </p>
              <p className="text-sm font-semibold font-display tabular-nums text-success/80">
                {fmtMoeda(ultimoPeriodo?.saldo ?? (ultimoPeriodo?.receitas ?? 0) - (ultimoPeriodo?.despesas ?? 0))}
              </p>
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
}
