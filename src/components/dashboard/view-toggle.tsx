/**
 * ViewToggle — Alternador genérico entre modos de visualização
 * ============================================================================
 * Suporta 2 modos (cards/list) ou N modos via prop `options`.
 *
 * USO SIMPLES (2 modos):
 *   <ViewToggle mode={viewMode} onChange={setViewMode} />
 *
 * USO AVANÇADO (N modos):
 *   <ViewToggle
 *     mode={viewMode}
 *     onChange={setViewMode}
 *     options={[
 *       { id: 'pipeline', icon: GitBranch, label: 'Pipeline' },
 *       { id: 'kanban', icon: Kanban, label: 'Kanban' },
 *       { id: 'lista', icon: List, label: 'Lista' },
 *     ]}
 *   />
 * ============================================================================
 */

'use client';

import { LayoutGrid, List, type LucideIcon } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ViewToggleOption {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface ViewToggleProps {
  mode: string;
  onChange: (mode: string) => void;
  options?: ViewToggleOption[];
}

// Default options (backwards compatible)
const DEFAULT_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Visualização em cartões' },
  { id: 'list', icon: List, label: 'Visualização em lista' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ViewToggle({ mode, onChange, options = DEFAULT_OPTIONS }: ViewToggleProps) {
  return (
    <div className="flex p-0.5 rounded-lg bg-border/6">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          aria-label={opt.label}
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            mode === opt.id
              ? 'bg-primary/12 text-primary'
              : 'text-muted-foreground/55 hover:text-muted-foreground/50'
          }`}
        >
          <opt.icon className="size-3.5" />
        </button>
      ))}
    </div>
  );
}
