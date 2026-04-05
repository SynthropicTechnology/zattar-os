'use client';

import { Scale, Clock, ArrowUpRight, Archive } from 'lucide-react';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import type { ProcessoStats } from '../service-estatisticas';

interface ProcessosPulseStripProps {
  stats: ProcessoStats;
}

export function ProcessosPulseStrip({ stats }: ProcessosPulseStripProps) {
  const items: PulseItem[] = [
    { label: 'Ativos', total: stats.ativos, icon: Scale, color: 'text-primary' },
    { label: 'Pendentes', total: stats.pendentes, icon: Clock, color: 'text-warning' },
    { label: 'Em Recurso', total: stats.emRecurso, icon: ArrowUpRight, color: 'text-info' },
    { label: 'Arquivados', total: stats.arquivados, icon: Archive, color: 'text-muted-foreground' },
  ];

  return <PulseStrip items={items} />;
}
