'use client';

import * as React from 'react';
import { Check, ChevronDown, X, AlertTriangle } from 'lucide-react';
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
import type { ProcessoStats } from '../service-estatisticas';

// ── Types ──────────────────────────────────────────────────────────────

interface Usuario {
  id: number;
  nomeExibicao: string;
  avatarUrl?: string | null;
}

export interface ProcessosFilters {
  origem: 'acervo_geral' | 'arquivado' | null;
  responsavel: 'meus' | 'sem_responsavel' | number | null;
  trt: string[];
  grau: string | null;
  comEventos: boolean;
}

interface ProcessosFilterBarProps {
  filters: ProcessosFilters;
  onChange: (filters: ProcessosFilters) => void;
  usuarios: Usuario[];
  currentUserId: number;
  stats: ProcessoStats;
}

// ── Shared ─────────────────────────────────────────────────────────────

const POPOVER_CLASSES = 'rounded-2xl glass-dropdown overflow-hidden p-0';

function FilterChip({
  label,
  active,
  onClear,
  onClick,
  count,
  icon,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  onClick?: () => void;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30'
      )}
    >
      {icon}
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn(
          'text-[9px] px-1 py-px rounded-full tabular-nums',
          active ? 'bg-primary/10' : 'bg-muted/50'
        )}>
          {count}
        </span>
      )}
      {active && onClear && (
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
      )}
    </button>
  );
}

function FilterDropdownTrigger({
  label,
  active,
  onClear,
  open,
  children,
}: {
  label: string;
  active: boolean;
  onClear?: () => void;
  open: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer',
        active
          ? 'border-primary/20 bg-primary/5 text-primary'
          : 'border-border/15 text-muted-foreground/60 hover:bg-muted/30',
        open && 'ring-1 ring-ring'
      )}
    >
      {children}
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

// ── Origem Filter ──────────────────────────────────────────────────────

const ORIGEM_OPTIONS = [
  { value: 'acervo_geral' as const, label: 'Ativos' },
  { value: 'arquivado' as const, label: 'Arquivados' },
];

function OrigemFilter({
  selected,
  onChange,
  stats,
}: {
  selected: 'acervo_geral' | 'arquivado' | null;
  onChange: (v: 'acervo_geral' | 'arquivado' | null) => void;
  stats: ProcessoStats;
}) {
  const [open, setOpen] = React.useState(false);

  const label = selected
    ? ORIGEM_OPTIONS.find((o) => o.value === selected)?.label ?? 'Origem'
    : 'Origem';

  const counts: Record<string, number> = {
    acervo_geral: stats.emCurso,
    arquivado: stats.arquivados,
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-44')} align="start" side="bottom">
        <div className="p-2 space-y-0.5">
          {ORIGEM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(selected === opt.value ? null : opt.value);
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === opt.value
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>{opt.label}</span>
              <span className="text-[9px] ml-auto tabular-nums opacity-50">{counts[opt.value]}</span>
              {selected === opt.value && <Check className="size-3" />}
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
  currentUserId,
  stats,
}: {
  selected: 'meus' | 'sem_responsavel' | number | null;
  onChange: (v: 'meus' | 'sem_responsavel' | number | null) => void;
  usuarios: Usuario[];
  currentUserId: number;
  stats: ProcessoStats;
}) {
  const [open, setOpen] = React.useState(false);

  let label = 'Responsável';
  if (selected === 'meus') label = 'Meus processos';
  else if (selected === 'sem_responsavel') label = 'Sem responsável';
  else if (typeof selected === 'number') {
    const u = usuarios.find((u) => u.id === selected);
    if (u) label = u.nomeExibicao;
  }

  const selectedUser = typeof selected === 'number'
    ? usuarios.find((u) => u.id === selected)
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button">
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          >
            {selectedUser && (
              <Avatar size="xs" className="border size-4">
                <AvatarImage src={selectedUser.avatarUrl || undefined} />
                <AvatarFallback className="text-[6px]">
                  {selectedUser.nomeExibicao.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
          </FilterDropdownTrigger>
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-56')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className="p-2 space-y-0.5 border-b border-border/10">
            <button
              type="button"
              onClick={() => {
                onChange(selected === 'meus' ? null : 'meus');
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === 'meus'
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>Meus processos</span>
              {selected === 'meus' && <Check className="size-3 ml-auto" />}
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(selected === 'sem_responsavel' ? null : 'sem_responsavel');
                setOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer',
                selected === 'sem_responsavel'
                  ? 'bg-primary/8 text-primary'
                  : 'hover:bg-muted/30 text-muted-foreground/70'
              )}
            >
              <span>Sem responsável</span>
              <span className="text-[9px] ml-auto tabular-nums opacity-50">{stats.semResponsavel}</span>
              {selected === 'sem_responsavel' && <Check className="size-3" />}
            </button>
          </div>
          <div className="px-3 pt-2 pb-1.5">
            <CommandInput placeholder="Buscar usuário..." className="h-8 text-xs rounded-lg" />
          </div>
          <CommandList className="max-h-44 px-1.5 pb-1.5">
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
          <FilterDropdownTrigger
            label={label}
            active={selected.length > 0}
            onClear={selected.length > 0 ? () => onChange([]) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <Command className="bg-transparent">
          <div className="px-3 pt-3 pb-1.5">
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
          <FilterDropdownTrigger
            label={label}
            active={!!selected}
            onClear={selected ? () => onChange(null) : undefined}
            open={open}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(POPOVER_CLASSES, 'w-48')} align="start" side="bottom">
        <div className="p-2 space-y-0.5">
          {GRAU_OPTIONS.map(([key, grauLabel]) => (
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
              <span>{grauLabel}</span>
              {selected === key && <Check className="size-3 ml-auto" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────

export function ProcessosFilterBar({
  filters,
  onChange,
  usuarios,
  currentUserId,
  stats,
}: ProcessosFilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <OrigemFilter
        selected={filters.origem}
        onChange={(origem) => onChange({ ...filters, origem })}
        stats={stats}
      />
      <ResponsavelFilter
        selected={filters.responsavel}
        onChange={(responsavel) => onChange({ ...filters, responsavel })}
        usuarios={usuarios}
        currentUserId={currentUserId}
        stats={stats}
      />
      <TRTFilter
        selected={filters.trt}
        onChange={(trt) => onChange({ ...filters, trt })}
      />
      <GrauFilter
        selected={filters.grau}
        onChange={(grau) => onChange({ ...filters, grau })}
      />
      <FilterChip
        label="Com Eventos"
        active={filters.comEventos}
        count={stats.comEventos}
        onClick={() => onChange({ ...filters, comEventos: !filters.comEventos })}
        onClear={filters.comEventos ? () => onChange({ ...filters, comEventos: false }) : undefined}
        icon={<AlertTriangle className="size-3" />}
      />
    </div>
  );
}
