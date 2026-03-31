/**
 * ViewToggle — Alternador entre visualização em cartões e lista
 * ============================================================================
 * Dois botões compactos: grade (cards) e lista. Estilo glass pill.
 *
 * USO:
 *   <ViewToggle mode={viewMode} onChange={setViewMode} />
 * ============================================================================
 */

'use client';

import { LayoutGrid, List } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ViewToggleProps {
  mode: 'cards' | 'list';
  onChange: (mode: 'cards' | 'list') => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex p-0.5 rounded-lg bg-border/6">
      <button
        onClick={() => onChange('cards')}
        aria-label="Visualização em cartões"
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          mode === 'cards'
            ? 'bg-primary/12 text-primary'
            : 'text-muted-foreground/30 hover:text-muted-foreground/50'
        }`}
      >
        <LayoutGrid className="size-3.5" />
      </button>
      <button
        onClick={() => onChange('list')}
        aria-label="Visualização em lista"
        className={`p-1.5 rounded-md transition-all cursor-pointer ${
          mode === 'list'
            ? 'bg-primary/12 text-primary'
            : 'text-muted-foreground/30 hover:text-muted-foreground/50'
        }`}
      >
        <List className="size-3.5" />
      </button>
    </div>
  );
}
