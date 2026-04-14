'use client';

/**
 * FilterChip & FilterChipMulti — Chips de filtro no padrão AudienciasFilterBar.
 * Visual: `rounded-lg border px-2.5 py-1.5 text-[11px]` com popover de opções
 * com checkmark. NÃO é o FilterPopover do módulo partes — é o design chip
 * usado em audiências/expedientes/contratos.
 */

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

export interface FilterChipOption {
  value: string;
  label: string;
  count?: number;
}

// =============================================================================
// TRIGGER
// =============================================================================

function FilterDropdownTrigger({
  label,
  active,
  onClear,
  open,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  open: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring',
      )}
    >
      <span>{label}</span>
      {active && onClear ? (
        <span
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
        >
          <X className="size-2.5" />
        </span>
      ) : (
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      )}
    </div>
  );
}

// =============================================================================
// FilterChipMulti (multi-select)
// =============================================================================

interface FilterChipMultiProps {
  label: string;
  options: readonly FilterChipOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Largura do popover (Tailwind class). default: w-48 */
  popoverWidth?: string;
}

export function FilterChipMulti({
  label,
  options,
  value,
  onValueChange,
  popoverWidth = 'w-48',
}: FilterChipMultiProps) {
  const [open, setOpen] = React.useState(false);

  const active = value.length > 0;
  const displayLabel = active
    ? value.length === 1
      ? options.find((o) => o.value === value[0])?.label ?? label
      : `${label} · ${value.length}`
    : label;

  const toggle = (v: string) => {
    if (value.includes(v)) {
      onValueChange(value.filter((x) => x !== v));
    } else {
      onValueChange([...value, v]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={`Filtrar por ${label}`}>
          <FilterDropdownTrigger
            label={displayLabel}
            active={active}
            onClear={active ? () => onValueChange([]) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, popoverWidth)} align="start" side="bottom">
        <div className="p-2 space-y-0.5 max-h-72 overflow-y-auto">
          {options.length === 0 ? (
            <div className="text-[11px] text-muted-foreground/50 px-2.5 py-2">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = value.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-primary/8 text-primary'
                      : 'hover:bg-muted/30 text-muted-foreground/70',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-[9px] ml-auto tabular-nums opacity-50">{opt.count}</span>
                  )}
                  {isSelected && <Check className={cn('size-3', opt.count === undefined && 'ml-auto')} />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
