'use client';

/**
 * ExpedientesListFilters - Componente de filtros reutilizável
 *
 * Puramente presentacional — sem estado próprio.
 * Recebe valores + callbacks como props.
 * Usado em todos os wrappers (lista, semana, mês, ano).
 *
 * Segue o padrão de audiencias-list-filters.tsx
 */

import * as React from 'react';
import { FilterPopover, type FilterOption } from '@/app/app/partes/components/shared';

import {
  CodigoTribunal,
  GRAU_TRIBUNAL_LABELS,
  ORIGEM_EXPEDIENTE_LABELS,
} from '../domain';

// =============================================================================
// OPÇÕES DE FILTRO (estáticas)
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = [
  { value: 'pendentes', label: 'Pendentes' },
  { value: 'baixados', label: 'Baixados' },
];

const PRAZO_OPTIONS: readonly FilterOption[] = [
  { value: 'vencidos', label: 'Vencidos' },
  { value: 'hoje', label: 'Vence Hoje' },
  { value: 'amanha', label: 'Vence Amanhã' },
  { value: 'semana', label: 'Esta Semana' },
  { value: 'sem_prazo', label: 'Sem Prazo' },
];

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CodigoTribunal.map(
  (trt) => ({ value: trt, label: trt })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const ORIGEM_OPTIONS: readonly FilterOption[] = Object.entries(ORIGEM_EXPEDIENTE_LABELS).map(
  ([value, label]) => ({ value, label })
);

// =============================================================================
// TIPOS
// =============================================================================

interface Usuario {
  id: number;
  nomeExibicao?: string | null;
  nome_exibicao?: string | null;
  nomeCompleto?: string | null;
  nome?: string | null;
}

interface TipoExpediente {
  id: number;
  tipoExpediente?: string;
  tipo_expediente?: string;
}

export type StatusFilterType = 'todos' | 'pendentes' | 'baixados';
export type PrazoFilterType = 'todos' | 'vencidos' | 'hoje' | 'amanha' | 'semana' | 'sem_prazo';
export type ResponsavelFilterType = 'todos' | 'sem_responsavel' | number;

export interface ExpedientesListFiltersProps {
  statusFilter: StatusFilterType;
  onStatusChange: (value: StatusFilterType) => void;
  prazoFilter?: PrazoFilterType;
  onPrazoChange?: (value: PrazoFilterType) => void;
  responsavelFilter: ResponsavelFilterType;
  onResponsavelChange: (value: ResponsavelFilterType) => void;
  tribunalFilter: string;
  onTribunalChange: (value: string) => void;
  grauFilter: string;
  onGrauChange: (value: string) => void;
  tipoExpedienteFilter: string;
  onTipoExpedienteChange: (value: string) => void;
  origemFilter: string;
  onOrigemChange: (value: string) => void;
  usuarios: Usuario[];
  tiposExpedientes: TipoExpediente[];
  /** Esconder filtro de prazo (ex: visão de semana) */
  hidePrazoFilter?: boolean;
  /** Esconder filtros avançados: Tribunal, Grau, Origem (ex: visão de semana) */
  hideAdvancedFilters?: boolean;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function ExpedientesListFilters({
  statusFilter,
  onStatusChange,
  prazoFilter = 'todos',
  onPrazoChange,
  responsavelFilter,
  onResponsavelChange,
  tribunalFilter,
  onTribunalChange,
  grauFilter,
  onGrauChange,
  tipoExpedienteFilter,
  onTipoExpedienteChange,
  origemFilter,
  onOrigemChange,
  usuarios,
  tiposExpedientes,
  hidePrazoFilter,
  hideAdvancedFilters,
}: ExpedientesListFiltersProps) {
  // Opções dinâmicas
  const responsavelOptions: readonly FilterOption[] = React.useMemo(
    () => [
      { value: 'sem_responsavel', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label: u.nomeExibicao || u.nome_exibicao || u.nomeCompleto || u.nome || `Usuário ${u.id}`,
      })),
    ],
    [usuarios]
  );

  const tipoExpedienteOptions: readonly FilterOption[] = React.useMemo(
    () => tiposExpedientes.map((t) => ({
      value: String(t.id),
      label: t.tipoExpediente || t.tipo_expediente || `Tipo ${t.id}`,
    })),
    [tiposExpedientes]
  );

  return (
    <>
      <FilterPopover
        label="Status"
        options={STATUS_OPTIONS}
        value={statusFilter}
        onValueChange={(v) => onStatusChange(v as StatusFilterType)}
        defaultValue="todos"
      />

      {!hidePrazoFilter && onPrazoChange && (
        <FilterPopover
          label="Prazo"
          options={PRAZO_OPTIONS}
          value={prazoFilter}
          onValueChange={(v) => onPrazoChange(v as PrazoFilterType)}
          defaultValue="todos"
        />
      )}

      <FilterPopover
        label="Responsável"
        options={responsavelOptions}
        value={typeof responsavelFilter === 'number' ? String(responsavelFilter) : responsavelFilter}
        onValueChange={(v) => {
          if (v === 'todos') onResponsavelChange('todos');
          else if (v === 'sem_responsavel') onResponsavelChange('sem_responsavel');
          else onResponsavelChange(parseInt(v, 10));
        }}
        defaultValue="todos"
      />

      {!hideAdvancedFilters && (
        <>
          <FilterPopover
            label="Tribunal"
            options={TRIBUNAL_OPTIONS}
            value={tribunalFilter || 'all'}
            onValueChange={(v) => onTribunalChange(v === 'all' ? '' : v)}
          />

          <FilterPopover
            label="Grau"
            options={GRAU_OPTIONS}
            value={grauFilter || 'all'}
            onValueChange={(v) => onGrauChange(v === 'all' ? '' : v)}
          />

          <FilterPopover
            label="Origem"
            options={ORIGEM_OPTIONS}
            value={origemFilter || 'all'}
            onValueChange={(v) => onOrigemChange(v === 'all' ? '' : v)}
          />
        </>
      )}

      <FilterPopover
        label="Tipo"
        options={tipoExpedienteOptions}
        value={tipoExpedienteFilter || 'all'}
        onValueChange={(v) => onTipoExpedienteChange(v === 'all' ? '' : v)}
      />
    </>
  );
}
