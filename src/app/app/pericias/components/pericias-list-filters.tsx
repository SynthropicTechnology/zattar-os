'use client';

/**
 * PericiasListFilters - Componente de filtros reutilizável
 *
 * Puramente presentacional — sem estado próprio.
 * Recebe valores + callbacks como props.
 * Usado em todos os wrappers (lista, semana, mês, ano).
 *
 * Segue o padrão de expedientes-list-filters.tsx
 */

import * as React from 'react';
import { FilterPopover, type FilterOption } from '@/app/app/partes/components/shared';

import {
  CodigoTribunal,
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
} from '../domain';
import { GRAU_TRIBUNAL_LABELS } from '@/app/app/expedientes';
import type { UsuarioOption, EspecialidadePericiaOption, PeritoOption } from '../types';

// =============================================================================
// OPÇÕES DE FILTRO (estáticas)
// =============================================================================

const SITUACAO_OPTIONS: readonly FilterOption[] = Object.values(SituacaoPericiaCodigo).map(
  (codigo) => ({ value: codigo, label: SITUACAO_PERICIA_LABELS[codigo] })
);

const LAUDO_OPTIONS: readonly FilterOption[] = [
  { value: 'sim', label: 'Juntado' },
  { value: 'nao', label: 'Não juntado' },
];

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CodigoTribunal.map(
  (trt) => ({ value: trt, label: trt })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

// =============================================================================
// TIPOS
// =============================================================================

export type SituacaoFilterType = 'todos' | SituacaoPericiaCodigo;
export type ResponsavelFilterType = 'todos' | 'sem_responsavel' | number;
export type LaudoFilterType = 'todos' | 'sim' | 'nao';

export interface PericiasListFiltersProps {
  situacaoFilter: SituacaoFilterType;
  onSituacaoChange: (value: SituacaoFilterType) => void;
  responsavelFilter: ResponsavelFilterType;
  onResponsavelChange: (value: ResponsavelFilterType) => void;
  laudoFilter: LaudoFilterType;
  onLaudoChange: (value: LaudoFilterType) => void;
  tribunalFilter: string;
  onTribunalChange: (value: string) => void;
  grauFilter: string;
  onGrauChange: (value: string) => void;
  especialidadeFilter: string;
  onEspecialidadeChange: (value: string) => void;
  peritoFilter: string;
  onPeritoChange: (value: string) => void;
  usuarios: UsuarioOption[];
  especialidades: EspecialidadePericiaOption[];
  peritos: PeritoOption[];
  /** Esconder filtros avançados: Tribunal, Grau (ex: visão de semana) */
  hideAdvancedFilters?: boolean;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function PericiasListFilters({
  situacaoFilter,
  onSituacaoChange,
  responsavelFilter,
  onResponsavelChange,
  laudoFilter,
  onLaudoChange,
  tribunalFilter,
  onTribunalChange,
  grauFilter,
  onGrauChange,
  especialidadeFilter,
  onEspecialidadeChange,
  peritoFilter,
  onPeritoChange,
  usuarios,
  especialidades,
  peritos,
  hideAdvancedFilters,
}: PericiasListFiltersProps) {
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

  const especialidadeOptions: readonly FilterOption[] = React.useMemo(
    () => especialidades.map((e) => ({
      value: String(e.id),
      label: e.descricao,
    })),
    [especialidades]
  );

  const peritoOptions: readonly FilterOption[] = React.useMemo(
    () => peritos.map((p) => ({
      value: String(p.id),
      label: p.nome,
    })),
    [peritos]
  );

  return (
    <>
      <FilterPopover
        label="Situação"
        options={SITUACAO_OPTIONS}
        value={situacaoFilter}
        onValueChange={(v) => onSituacaoChange(v as SituacaoFilterType)}
        defaultValue="todos"
      />

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

      <FilterPopover
        label="Laudo"
        options={LAUDO_OPTIONS}
        value={laudoFilter}
        onValueChange={(v) => onLaudoChange(v as LaudoFilterType)}
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
        </>
      )}

      <FilterPopover
        label="Especialidade"
        options={especialidadeOptions}
        value={especialidadeFilter || 'all'}
        onValueChange={(v) => onEspecialidadeChange(v === 'all' ? '' : v)}
      />

      <FilterPopover
        label="Perito"
        options={peritoOptions}
        value={peritoFilter || 'all'}
        onValueChange={(v) => onPeritoChange(v === 'all' ? '' : v)}
      />
    </>
  );
}
