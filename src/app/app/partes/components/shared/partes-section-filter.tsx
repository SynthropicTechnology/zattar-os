'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { FilterPopover, type FilterOption } from './filter-popover';

type PartesSection = 'clientes' | 'partes-contrarias' | 'terceiros' | 'representantes';

const PARTES_SECTION_OPTIONS: readonly FilterOption[] = [
  { value: 'clientes', label: 'Clientes' },
  { value: 'partes-contrarias', label: 'Partes Contrárias' },
  { value: 'terceiros', label: 'Terceiros' },
  { value: 'representantes', label: 'Representantes' },
];

const PARTES_SECTION_ROUTES: Record<PartesSection, string> = {
  clientes: '/app/partes/clientes',
  'partes-contrarias': '/app/partes/partes-contrarias',
  terceiros: '/app/partes/terceiros',
  representantes: '/app/partes/representantes',
};

interface PartesSectionFilterProps {
  currentSection: PartesSection;
}

export function PartesSectionFilter({ currentSection }: PartesSectionFilterProps) {
  const router = useRouter();

  return (
    <FilterPopover
      label='Partes'
      placeholder='Buscar seção...'
      options={PARTES_SECTION_OPTIONS}
      value={currentSection}
      defaultValue={currentSection}
      onValueChange={(nextSection) => {
        if (nextSection === currentSection) return;
        const route = PARTES_SECTION_ROUTES[nextSection as PartesSection];
        if (route) router.push(route);
      }}
    />
  );
}
