/**
 * TabPills — Navegação por abas com contadores, estilo pílula
 * ============================================================================
 * Barra de filtro horizontal com badges de contagem por aba.
 * Rola horizontalmente em telas menores.
 *
 * USO:
 *   <TabPills
 *     tabs={[{ id: 'todos', label: 'Todos', count: 272 }]}
 *     active="todos"
 *     onChange={(id) => setTab(id)}
 *   />
 * ============================================================================
 */

'use client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TabPillOption {
  id: string;
  label: string;
  count?: number;
}

interface TabPillsProps {
  tabs: TabPillOption[];
  active: string;
  onChange: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TabPills({ tabs, active, onChange }: TabPillsProps) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-border/6 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
            transition-all duration-200 cursor-pointer
            ${active === tab.id
              ? 'bg-primary/12 text-primary shadow-sm'
              : 'text-muted-foreground/50 hover:text-muted-foreground/70 hover:bg-white/4'
            }
          `}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`text-[10px] tabular-nums ${
                active === tab.id ? 'text-primary/50' : 'text-muted-foreground/55'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
