'use client';

import { LayoutGrid, List, GitBranch } from 'lucide-react';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { TabPills, type TabPillOption } from '@/components/dashboard/tab-pills';
import { FilterPopover } from '@/app/(authenticated)/partes';

export type UsuariosViewMode = 'grid' | 'lista' | 'organograma';

interface UsuariosToolbarProps {
  counts: { total: number; ativos: number; inativos: number; comOab: number };
  activeTab: string;
  onTabChange: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  viewMode: UsuariosViewMode;
  onViewModeChange: (mode: string) => void;
  cargoFiltro: string;
  onCargoFiltroChange: (value: string) => void;
  cargosOptions: { value: string; label: string }[];
}

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'grid', icon: LayoutGrid, label: 'Grid' },
  { id: 'lista', icon: List, label: 'Lista' },
  { id: 'organograma', icon: GitBranch, label: 'Organograma' },
];

export function UsuariosToolbar({
  counts,
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  viewMode,
  onViewModeChange,
  cargoFiltro,
  onCargoFiltroChange,
  cargosOptions,
}: UsuariosToolbarProps) {
  const tabs: TabPillOption[] = [
    { id: 'todos', label: 'Todos', count: counts.total },
    { id: 'ativos', label: 'Ativos', count: counts.ativos },
    { id: 'inativos', label: 'Inativos', count: counts.inativos },
    { id: 'com-oab', label: 'Com OAB', count: counts.comOab },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Left: tabs + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <TabPills tabs={tabs} active={activeTab} onChange={onTabChange} />
        <FilterPopover
          label="Cargo"
          options={cargosOptions}
          value={cargoFiltro}
          onValueChange={onCargoFiltroChange}
          defaultValue="all"
        />
      </div>

      {/* Right: search + view toggle */}
      <div className="flex items-center gap-2 flex-1 justify-end">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Buscar membro..."
        />
        <ViewToggle
          mode={viewMode}
          onChange={onViewModeChange}
          options={VIEW_OPTIONS}
        />
      </div>
    </div>
  );
}
