'use client';

import * as React from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { GRAU_LABELS } from '@/lib/design-system';
import { TRIBUNAIS } from '../domain';

// ── Types ──────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

export interface ProcessosFilters {
  trt: string[];
  grau: string | null;
  responsavelId: number | null;
}

interface ProcessosFilterBarProps {
  filters: ProcessosFilters;
  onChange: (filters: ProcessosFilters) => void;
  usuarios: Usuario[];
}

// ── Shared popover wrapper (glass style) ───────────────────────────────

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

// ── Filter button ──────────────────────────────────────────────────────

function FilterButton({
  label,
  active,
  onClear,
  children,
  open,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  children: React.ReactNode;
  open: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring'
      )}
    >
      {children}
      <span>{label}</span>
      {active && onClear ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-primary/10 transition-colors"
        >
          <X className="size-2.5" />
        </button>
      ) : (
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} />
      )}
    </div>
  );
}

// ── TRT Filter ─────────────────────────────────────────────────────────

function TRTFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (trts: string[]) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected.length === 0
    ? 'Tribunal'
    : selected.length === 1
      ? selected[0]
      : `${selected.length} tribunais`;

  const handleToggle = (trt: string) => {
    const next = selected.includes(trt)
      ? selected.filter((t) => t !== trt)
      : [...selected, trt];
    onChange(next);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterButton
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange([]) : undefined}
            open={open}
          >
            <span className="text-[10px]">⚖</span>
          </FilterButton>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">
              Tribunal Regional
            </p>
            <CommandInput placeholder="Buscar TRT..." className="h-8 text-xs rounded-lg" />
          </div>
          <CommandList className="max-h-52 px-1.5 pb-1.5">
            <CommandEmpty>
              <span className="text-[11px] text-muted-foreground/40">Não encontrado</span>
            </CommandEmpty>
            <CommandGroup>
              {TRIBUNAIS.map((trt) => (
                <CommandItem
                  key={trt}
                  value={trt}
                  onSelect={() => handleToggle(trt)}
                  className="gap-2 rounded-lg text-xs px-2 py-1.5"
                >
                  <div className={cn(
                    'size-3.5 rounded border flex items-center justify-center',
                    selected.includes(trt)
                      ? 'bg-primary border-primary'
                      : 'border-border/30'
                  )}>
                    {selected.includes(trt) && <Check className="size-2.5 text-primary-foreground" />}
                  </div>
                  <span>{trt}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Grau Filter ────────────────────────────────────────────────────────

const GRAU_OPTIONS = Object.entries(GRAU_LABELS) as [string, string][];

function GrauFilter({
  selected,
  onChange,
}: {
  selected: string | null;
  onChange: (grau: string | null) => void;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected
    ? (GRAU_LABELS[selected as keyof typeof GRAU_LABELS] || selected)
    : 'Grau';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterButton
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          >
            <span className="text-[10px]">📋</span>
          </FilterButton>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className="p-3 space-y-1">
          <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">
            Grau de Jurisdição
          </p>
          {GRAU_OPTIONS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(selected === key ? null : key);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === key
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>{label}</span>
              {selected === key && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Responsável Filter ─────────────────────────────────────────────────

function ResponsavelFilter({
  selected,
  onChange,
  usuarios,
}: {
  selected: number | null;
  onChange: (id: number | null) => void;
  usuarios: Usuario[];
}) {
  const [open, setOpen] = React.useState(false);

  const selectedUser = selected ? usuarios.find((u) => u.id === selected) : null;
  const label = selectedUser?.nomeExibicao || 'Responsável';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterButton
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          >
            {selectedUser ? (
              <Avatar size="xs" className="border size-4">
                <AvatarImage src={selectedUser.avatarUrl || undefined} />
                <AvatarFallback className="text-[6px]">
                  {selectedUser.nomeExibicao.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-[10px]">👤</span>
            )}
          </FilterButton>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-56')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
            <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-wider mb-2">
              Filtrar por responsável
            </p>
            <CommandInput placeholder="Buscar..." className="h-8 text-xs rounded-lg" />
          </div>
          <CommandList className="max-h-52 px-1.5 pb-1.5">
            <CommandEmpty>
              <span className="text-[11px] text-muted-foreground/40">Não encontrado</span>
            </CommandEmpty>
            <CommandGroup>
              {usuarios.map((usuario) => (
                <CommandItem
                  key={usuario.id}
                  value={usuario.nomeExibicao}
                  onSelect={() => {
                    onChange(selected === usuario.id ? null : usuario.id);
                    setOpen(false);
                  }}
                  className="gap-2 rounded-lg text-xs px-2 py-1.5"
                >
                  <Avatar size="xs" className="border size-5">
                    <AvatarImage src={usuario.avatarUrl || undefined} />
                    <AvatarFallback className="text-[7px]">
                      {usuario.nomeExibicao.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span>{usuario.nomeExibicao}</span>
                  {selected === usuario.id && (
                    <Check className="size-3 ml-auto text-primary shrink-0" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────

export function ProcessosFilterBar({ filters, onChange, usuarios }: ProcessosFilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <TRTFilter
        selected={filters.trt}
        onChange={(trt) => onChange({ ...filters, trt })}
      />
      <GrauFilter
        selected={filters.grau}
        onChange={(grau) => onChange({ ...filters, grau })}
      />
      <ResponsavelFilter
        selected={filters.responsavelId}
        onChange={(responsavelId) => onChange({ ...filters, responsavelId })}
        usuarios={usuarios}
      />
    </div>
  );
}
