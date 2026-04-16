'use client';

/**
 * SegmentosGlassList — Lista/Cards glass no padrão AudienciasGlassList.
 */

import * as React from 'react';
import { Tags, Pencil, Copy, Trash2, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import type { AssinaturaDigitalSegmento } from '@/shared/assinatura-digital';

// =============================================================================
// TIPOS
// =============================================================================

export type SegmentosViewMode = 'cards' | 'list';

interface SegmentosGlassListProps {
  segmentos: AssinaturaDigitalSegmento[];
  isLoading: boolean;
  mode?: SegmentosViewMode;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function getAtivoDotColor(ativo: boolean): string {
  return ativo
    ? 'bg-success shadow-[0_0_6px_var(--success)]'
    : 'bg-muted-foreground';
}

function getSegmentoChartToken(id: number): string {
  const index = (Math.abs(id) % 8) + 1;
  return `--chart-${index}`;
}

// =============================================================================
// ACTIONS
// =============================================================================

function SegmentoActions({
  segmento,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  compact = false,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Ações"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {canEdit && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(segmento)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {canCreate && onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(segmento)}>
              <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(segmento)} className="text-destructive">
                <Trash2 className="w-3.5 h-3.5 mr-2" /> Deletar
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {canEdit && onEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Editar segmento"
              onClick={(e) => { e.stopPropagation(); onEdit(segmento); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
      {canCreate && onDuplicate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Duplicar segmento"
              onClick={(e) => { e.stopPropagation(); onDuplicate(segmento); }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>
      )}
      {canDelete && onDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Deletar segmento"
              onClick={(e) => { e.stopPropagation(); onDelete(segmento); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deletar</TooltipContent>
        </Tooltip>
      )}
    </>
  );
}

// =============================================================================
// ROW
// =============================================================================

function GlassRow({
  segmento,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  isAlt,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  isAlt: boolean;
}) {
  const token = getSegmentoChartToken(segmento.id);

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(segmento);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(segmento);
        }
      }}
      className={cn(
        'w-full text-left rounded-2xl border border-white/6 p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5.5 hover:border-white/12 hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto_90px_120px] gap-4 items-center">
        {/* Status dot */}
        <div className="flex items-center w-4">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getAtivoDotColor(segmento.ativo))} />
        </div>

        {/* Main info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-[0.625rem] flex items-center justify-center shrink-0"
            style={{ background: `color-mix(in oklch, var(${token}) 14%, transparent)` }}
          >
            <Tags className="w-4 h-4" style={{ color: `var(${token})` }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{segmento.nome}</div>
            {segmento.descricao && (
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {segmento.descricao}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono truncate">
              {segmento.slug}
            </div>
          </div>
        </div>

        {/* Uso */}
        <span className="inline-flex backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 bg-white/6 border border-white/10 text-muted-foreground">
          <span className="tabular-nums">{segmento.formularios_count ?? 0}</span>
          <span className="ml-1 opacity-60">
            formulário{(segmento.formularios_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </span>

        {/* Status */}
        <div className="flex justify-start">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border whitespace-nowrap',
              segmento.ativo
                ? 'bg-success/10 border-success/25 text-success'
                : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
            )}
          >
            {segmento.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5" data-row-action>
          <SegmentoActions
            segmento={segmento}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// CARD
// =============================================================================

function GlassCard({
  segmento,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit?: (s: AssinaturaDigitalSegmento) => void;
  onDuplicate?: (s: AssinaturaDigitalSegmento) => void;
  onDelete?: (s: AssinaturaDigitalSegmento) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const token = getSegmentoChartToken(segmento.id);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(segmento);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(segmento);
        }
      }}
      className={cn(
        'relative flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/[0.028] p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5.5 hover:border-white/12 hover:-translate-y-px hover:shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-10 h-10 rounded-[0.625rem] flex items-center justify-center"
          style={{ background: `color-mix(in oklch, var(${token}) 14%, transparent)` }}
        >
          <Tags className="w-4 h-4" style={{ color: `var(${token})` }} />
        </div>
        <div className="flex items-center gap-1.5" data-row-action>
          <div className={cn('w-2 h-2 rounded-full', getAtivoDotColor(segmento.ativo))} />
          <SegmentoActions
            segmento={segmento}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            compact
          />
        </div>
      </div>

      <div>
        <div className="text-sm font-semibold line-clamp-1">{segmento.nome}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono truncate">
          {segmento.slug}
        </div>
      </div>

      {segmento.descricao ? (
        <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{segmento.descricao}</p>
      ) : (
        <p className="text-xs text-muted-foreground/40 italic flex-1">Sem descrição</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/6">
        <span className="text-[10px] text-muted-foreground">
          <span className="font-display text-sm font-bold tabular-nums text-foreground/80">
            {segmento.formularios_count ?? 0}
          </span>
          <span className="ml-1">
            formulário{(segmento.formularios_count ?? 0) !== 1 ? 's' : ''}
          </span>
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border',
            segmento.ativo
              ? 'bg-success/10 border-success/25 text-success'
              : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
          )}
        >
          {segmento.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// SKELETONS & EMPTY
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-20 rounded-2xl border border-white/6 bg-white/[0.028] animate-pulse" />
      ))}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-44 rounded-2xl border border-white/6 bg-white/[0.028] animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <Tags className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">Nenhum segmento encontrado</p>
      <p className="text-xs text-muted-foreground/30 mt-1">Tente ajustar os filtros ou criar um novo segmento</p>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function SegmentosGlassList({
  segmentos,
  isLoading,
  mode = 'list',
  onEdit,
  onDuplicate,
  onDelete,
  canEdit = false,
  canCreate = false,
  canDelete = false,
}: SegmentosGlassListProps) {
  if (isLoading) return mode === 'cards' ? <CardsSkeleton /> : <ListSkeleton />;
  if (segmentos.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      {mode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {segmentos.map((s) => (
            <GlassCard
              key={s.id}
              segmento={s}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              canEdit={canEdit}
              canCreate={canCreate}
              canDelete={canDelete}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {segmentos.map((s, i) => (
            <GlassRow
              key={s.id}
              segmento={s}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              canEdit={canEdit}
              canCreate={canCreate}
              canDelete={canDelete}
              isAlt={i % 2 === 1}
            />
          ))}
        </div>
      )}
    </TooltipProvider>
  );
}
