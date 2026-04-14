'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertTriangle,
  Briefcase,
  FileText,
  Gavel,
  Users,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';

import type { ProfileData } from '../../configs/types';

type EntityType =
  | 'cliente'
  | 'parte_contraria'
  | 'terceiro'
  | 'representante'
  | 'usuario';

interface KpiSpec {
  label: string;
  icon: LucideIcon;
  valuePath: string;
  formatter?: (v: unknown) => string;
  tone?: 'default' | 'warning' | 'success';
}

const KPI_SPECS: Record<EntityType, KpiSpec[]> = {
  cliente: [
    { label: 'Processos totais', icon: FileText, valuePath: 'stats.total_processos' },
    { label: 'Ativos', icon: Activity, valuePath: 'stats.processos_ativos', tone: 'success' },
    { label: 'Pendências', icon: AlertTriangle, valuePath: 'stats.pendencias', tone: 'warning' },
  ],
  parte_contraria: [
    { label: 'Processos vinculados', icon: Gavel, valuePath: 'stats.total_processos' },
    { label: 'Em andamento', icon: Activity, valuePath: 'stats.processos_ativos', tone: 'success' },
  ],
  terceiro: [
    { label: 'Processos onde atua', icon: FileText, valuePath: 'stats.total_processos' },
  ],
  representante: [
    { label: 'Clientes', icon: Users, valuePath: 'stats.total_clientes' },
    { label: 'Processos', icon: Briefcase, valuePath: 'stats.total_processos' },
    { label: 'Ativos', icon: Activity, valuePath: 'stats.processos_ativos', tone: 'success' },
  ],
  usuario: [],
};

const getNestedValue = (obj: Record<string, unknown>, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      obj,
    );

interface ProfileKpiStripProps {
  entityType: EntityType;
  data: ProfileData;
}

export function ProfileKpiStrip({ entityType, data }: ProfileKpiStripProps) {
  const specs = KPI_SPECS[entityType];
  if (!specs || specs.length === 0) return null;

  const items = specs.map((spec) => {
    const raw = getNestedValue(data as Record<string, unknown>, spec.valuePath);
    const value =
      raw === null || raw === undefined
        ? '—'
        : spec.formatter
          ? spec.formatter(raw)
          : String(raw);
    return { ...spec, value };
  });

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        const valueColor =
          item.tone === 'success'
            ? 'text-success'
            : item.tone === 'warning'
              ? 'text-warning'
              : 'text-foreground';
        return (
          <GlassPanel key={item.label} depth={2} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="size-3.5 text-muted-foreground/60" />
              <Text variant="overline">{item.label}</Text>
            </div>
            <Heading level="card" className={valueColor}>
              {item.value}
            </Heading>
          </GlassPanel>
        );
      })}
    </div>
  );
}
