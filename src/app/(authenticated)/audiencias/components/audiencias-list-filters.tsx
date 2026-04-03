'use client';

import * as React from 'react';
import { FilterPopoverMulti } from '@/app/(authenticated)/partes/components/shared/filter-popover-multi';
import type { FilterOption } from '@/app/(authenticated)/partes/components/shared/filter-popover';

import {
  StatusAudiencia,
  ModalidadeAudiencia,
  GrauTribunal,
  CODIGO_TRIBUNAL,
  STATUS_AUDIENCIA_LABELS,
  MODALIDADE_AUDIENCIA_LABELS,
  GRAU_TRIBUNAL_LABELS,
  type CodigoTribunal,
  type TipoAudiencia,
} from '../domain';

// =============================================================================
// OPÇÕES DE FILTRO (estáticas)
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = Object.entries(STATUS_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const MODALIDADE_OPTIONS: readonly FilterOption[] = Object.entries(MODALIDADE_AUDIENCIA_LABELS).map(
  ([value, label]) => ({ value, label })
);

const GRAU_OPTIONS: readonly FilterOption[] = Object.entries(GRAU_TRIBUNAL_LABELS).map(
  ([value, label]) => ({ value, label })
);

const TRIBUNAL_OPTIONS: readonly FilterOption[] = CODIGO_TRIBUNAL.map(
  (trt) => ({ value: trt, label: trt })
);

// =============================================================================
// TIPOS
// =============================================================================

interface Usuario {
  id: number;
  nomeExibicao?: string | null;
  nomeCompleto?: string | null;
}

export interface AudienciasListFiltersProps {
  statusFiltro: StatusAudiencia[];
  onStatusChange: (value: StatusAudiencia[]) => void;
  modalidadeFiltro: ModalidadeAudiencia[];
  onModalidadeChange: (value: ModalidadeAudiencia[]) => void;
  trtFiltro: CodigoTribunal[];
  onTrtChange: (value: CodigoTribunal[]) => void;
  grauFiltro: GrauTribunal[];
  onGrauChange: (value: GrauTribunal[]) => void;
  responsavelFiltro: (number | 'null')[];
  onResponsavelChange: (value: (number | 'null')[]) => void;
  tipoAudienciaFiltro: number[];
  onTipoAudienciaChange: (value: number[]) => void;
  usuarios: Usuario[];
  tiposAudiencia: TipoAudiencia[];
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function AudienciasListFilters({
  statusFiltro,
  onStatusChange,
  modalidadeFiltro,
  onModalidadeChange,
  trtFiltro,
  onTrtChange,
  grauFiltro,
  onGrauChange,
  responsavelFiltro,
  onResponsavelChange,
  tipoAudienciaFiltro,
  onTipoAudienciaChange,
  usuarios,
  tiposAudiencia,
}: AudienciasListFiltersProps) {
  // Opções dinâmicas
  const responsavelOptions: readonly FilterOption[] = React.useMemo(
    () => [
      { value: 'null', label: 'Sem Responsável' },
      ...usuarios.map((u) => ({
        value: String(u.id),
        label: u.nomeExibicao || u.nomeCompleto || `Usuário ${u.id}`,
      })),
    ],
    [usuarios]
  );

  const tipoAudienciaOptions: readonly FilterOption[] = React.useMemo(
    () => tiposAudiencia.map((t) => ({ value: String(t.id), label: t.descricao })),
    [tiposAudiencia]
  );

  return (
    <>
      <FilterPopoverMulti
        label="Status"
        options={STATUS_OPTIONS}
        value={statusFiltro}
        onValueChange={(v) => onStatusChange(v as StatusAudiencia[])}
      />

      <FilterPopoverMulti
        label="Modalidade"
        options={MODALIDADE_OPTIONS}
        value={modalidadeFiltro}
        onValueChange={(v) => onModalidadeChange(v as ModalidadeAudiencia[])}
      />

      <FilterPopoverMulti
        label="Tribunal"
        options={TRIBUNAL_OPTIONS}
        value={trtFiltro}
        onValueChange={(v) => onTrtChange(v as CodigoTribunal[])}
      />

      <FilterPopoverMulti
        label="Grau"
        options={GRAU_OPTIONS}
        value={grauFiltro}
        onValueChange={(v) => onGrauChange(v as GrauTribunal[])}
      />

      <FilterPopoverMulti
        label="Responsável"
        options={responsavelOptions}
        value={responsavelFiltro.map(String)}
        onValueChange={(v) => {
          // Converter strings de volta para number ou 'null'
          const m = v.map((val) => (val === 'null' ? 'null' : Number(val)));
          onResponsavelChange(m);
        }}
        placeholder="Filtrar por responsável..."
      />

      <FilterPopoverMulti
        label="Tipo"
        options={tipoAudienciaOptions}
        value={tipoAudienciaFiltro.map(String)}
        onValueChange={(v) => onTipoAudienciaChange(v.map(Number))}
        placeholder="Filtrar por tipo..."
      />
    </>
  );
}
