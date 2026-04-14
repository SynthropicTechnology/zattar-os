'use client';

import { Users, CheckCircle, Scale, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { AnimatedNumber } from '@/app/(authenticated)/dashboard/mock/widgets/primitives';
import type { Usuario } from '../../domain';
import { calcularCompleteness } from '../shared/completeness-utils';

interface UserKpiStripProps {
  usuarios: Usuario[];
}

interface KpiCardConfig {
  label: string;
  value: number;
  proportion: number;
  iconColor: string;
  barColor: string;
  icon: React.ReactNode;
}

export function UserKpiStrip({ usuarios }: UserKpiStripProps) {
  const total = usuarios.length;

  const ativos = usuarios.filter((u) => u.ativo).length;
  const comOab = usuarios.filter((u) => Boolean(u.oab)).length;
  const incompletos = usuarios.filter((u) => {
    const { score } = calcularCompleteness(u);
    return score < 70;
  }).length;

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  const cards: KpiCardConfig[] = [
    {
      label: 'Total Membros',
      value: total,
      proportion: 100,
      iconColor: 'bg-primary/10',
      barColor: 'bg-primary',
      icon: <Users className="size-4 text-primary/70" />,
    },
    {
      label: 'Ativos',
      value: ativos,
      proportion: pct(ativos),
      iconColor: 'bg-success/10',
      barColor: 'bg-success',
      icon: <CheckCircle className="size-4 text-success/70" />,
    },
    {
      label: 'Advogados OAB',
      value: comOab,
      proportion: pct(comOab),
      iconColor: 'bg-info/10',
      barColor: 'bg-info',
      icon: <Scale className="size-4 text-info/70" />,
    },
    {
      label: 'Perfis Incompletos',
      value: incompletos,
      proportion: pct(incompletos),
      iconColor: 'bg-warning/10',
      barColor: 'bg-warning',
      icon: <AlertTriangle className="size-4 text-warning/70" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <GlassPanel key={card.label} depth={2} className="px-4 py-3.5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40 font-semibold truncate">
                {card.label}
              </span>
              <span className="text-2xl font-bold mt-1">
                <AnimatedNumber value={card.value} />
              </span>
            </div>
            <IconContainer size="md" className={card.iconColor}>
              {card.icon}
            </IconContainer>
          </div>

          {/* Bottom proportion bar */}
          <div className="mt-3 space-y-1">
            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${card.barColor}`}
                style={{ width: `${card.proportion}%` }}
              />
            </div>
            <span className="text-[9px] text-muted-foreground/40 tabular-nums">
              {card.proportion}%
            </span>
          </div>
        </GlassPanel>
      ))}
    </div>
  );
}
