'use client';

import { useState, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---

export interface CapturaFilters {
  tipo: string | null;
  status: string | null;
  tribunal: string | null;
}

interface CapturaFilterBarProps {
  filters: CapturaFilters;
  onChange: (filters: CapturaFilters) => void;
  counts?: {
    tipo?: Record<string, number>;
    status?: Record<string, number>;
    tribunal?: Record<string, number>;
  };
}

// --- Constants ---

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

const TIPO_OPTIONS = [
  { value: 'acervo_geral', label: 'Acervo Geral' },
  { value: 'audiencias', label: 'Audiências' },
  { value: 'combinada', label: 'Combinada' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'pericias', label: 'Perícias' },
  { value: 'partes', label: 'Partes' },
  { value: 'pendentes', label: 'Expedientes' },
  { value: 'arquivados', label: 'Arquivados' },
];

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Concluída' },
  { value: 'in_progress', label: 'Em Andamento' },
  { value: 'failed', label: 'Falha' },
  { value: 'pending', label: 'Pendente' },
];

const TRIBUNAL_OPTIONS = [
  { value: 'TRT1', label: 'TRT1' },
  { value: 'TRT2', label: 'TRT2' },
  { value: 'TRT3', label: 'TRT3' },
  { value: 'TRT4', label: 'TRT4' },
  { value: 'TRT5', label: 'TRT5' },
  { value: 'TRT6', label: 'TRT6' },
  { value: 'TRT7', label: 'TRT7' },
  { value: 'TRT8', label: 'TRT8' },
  { value: 'TRT9', label: 'TRT9' },
  { value: 'TRT10', label: 'TRT10' },
  { value: 'TRT11', label: 'TRT11' },
  { value: 'TRT12', label: 'TRT12' },
  { value: 'TRT13', label: 'TRT13' },
  { value: 'TRT14', label: 'TRT14' },
  { value: 'TRT15', label: 'TRT15' },
  { value: 'TST', label: 'TST' },
];

// --- Sub-components ---

function FilterDropdownTrigger({
  label,
  active,
  onClear,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30'
      )}
    >
      <span>{label}</span>
      {active ? (
        <X
          className="size-2.5 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onClear?.();
          }}
        />
      ) : (
        <ChevronDown className="size-2.5 opacity-50" />
      )}
    </div>
  );
}

function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
  counts,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  counts?: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={selected ? options.find((o) => o.value === selected)?.label ?? label : label}
            active={!!selected}
            onClear={() => { onSelect(null); setOpen(false); }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className="p-2 space-y-0.5">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onSelect(opt.value === selected ? null : opt.value); setOpen(false); }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>{opt.label}</span>
              {counts?.[opt.value] != null && (
                <span className="text-[9px] ml-auto tabular-nums opacity-50">{counts[opt.value]}</span>
              )}
              {selected === opt.value && <Check className="size-3" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Main Component ---

export function CapturaFilterBar({ filters, onChange, counts }: CapturaFilterBarProps) {
  const handleChange = useCallback(
    (key: keyof CapturaFilters) => (value: string | null) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <FilterDropdown
        label="Tipo"
        options={TIPO_OPTIONS}
        selected={filters.tipo}
        onSelect={handleChange('tipo')}
        counts={counts?.tipo}
      />
      <FilterDropdown
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onSelect={handleChange('status')}
        counts={counts?.status}
      />
      <FilterDropdown
        label="Tribunal"
        options={TRIBUNAL_OPTIONS}
        selected={filters.tribunal}
        onSelect={handleChange('tribunal')}
        counts={counts?.tribunal}
      />
    </div>
  );
}
