'use client';

import { Scale, Briefcase, Archive, UserX } from 'lucide-react';
import { PulseStrip, type PulseItem } from '@/components/dashboard/pulse-strip';
import type { ProcessoStats } from '../service-estatisticas';

interface ProcessosPulseStripProps {
  stats: ProcessoStats;
}

/**
 * KPI strip do acervo de processos.
 * Acervo (total) | Em Curso (acervo_geral) | Arquivados | Sem Responsável
 */
export function ProcessosPulseStrip({ stats }: ProcessosPulseStripProps) {
  const items: PulseItem[] = [
    { label: 'Acervo', total: stats.total, icon: Scale, color: 'text-primary' },
    { label: 'Em Curso', total: stats.emCurso, icon: Briefcase, color: 'text-success' },
    { label: 'Arquivados', total: stats.arquivados, icon: Archive, color: 'text-muted-foreground' },
    { label: 'Sem Responsável', total: stats.semResponsavel, icon: UserX, color: 'text-warning' },
  ];

  return <PulseStrip items={items} />;
}
