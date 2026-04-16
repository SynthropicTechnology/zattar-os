'use client';

/**
 * TemplatesGlassList — Lista/Cards glass no padrão AudienciasGlassList.
 */

import * as React from 'react';
import {
  FileText,
  FileCode2,
  Pencil,
  Copy,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';

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

import type { Template } from '@/shared/assinatura-digital';
import { formatFileSize, getTemplateDisplayName } from '@/shared/assinatura-digital';

// =============================================================================
// TIPOS
// =============================================================================

export type TemplatesViewMode = 'cards' | 'list';

interface TemplatesGlassListProps {
  templates: Template[];
  isLoading: boolean;
  mode?: TemplatesViewMode;
  onEdit?: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  onDelete?: (template: Template) => void;
  canEdit?: boolean;
  canCreate?: boolean;
  canDelete?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'ativo':
      return 'bg-success shadow-[0_0_6px_var(--success)]';
    case 'rascunho':
      return 'bg-warning shadow-[0_0_6px_var(--warning)]';
    case 'inativo':
      return 'bg-muted-foreground';
    default:
      return 'bg-muted-foreground';
  }
}

function getStatusLabel(status: string): string {
  if (status === 'ativo') return 'Ativo';
  if (status === 'rascunho') return 'Rascunho';
  return 'Inativo';
}

function getStatusPillClass(status: string): string {
  if (status === 'ativo') return 'bg-success/10 border-success/25 text-success';
  if (status === 'rascunho') return 'bg-warning/10 border-warning/25 text-warning';
  return 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground';
}

// =============================================================================
// ACTIONS
// =============================================================================

function TemplateActions({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  compact = false,
}: {
  template: Template;
  onEdit?: (t: Template) => void;
  onDuplicate?: (t: Template) => void;
  onDelete?: (t: Template) => void;
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
            <DropdownMenuItem onClick={() => onEdit(template)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
          )}
          {canCreate && onDuplicate && (
            <DropdownMenuItem onClick={() => onDuplicate(template)}>
              <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
            </DropdownMenuItem>
          )}
          {canDelete && onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onDelete(template)} className="text-destructive">
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
              aria-label="Editar template"
              onClick={(e) => { e.stopPropagation(); onEdit(template); }}
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
              aria-label="Duplicar template"
              onClick={(e) => { e.stopPropagation(); onDuplicate(template); }}
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
              aria-label="Deletar template"
              onClick={(e) => { e.stopPropagation(); onDelete(template); }}
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
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
  isAlt,
}: {
  template: Template;
  onEdit?: (t: Template) => void;
  onDuplicate?: (t: Template) => void;
  onDelete?: (t: Template) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
  isAlt: boolean;
}) {
  const displayName = getTemplateDisplayName(template);
  const isMarkdown = template.tipo_template === 'markdown';
  const Icon = isMarkdown ? FileCode2 : FileText;
  const status = template.status;

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(template);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(template);
        }
      }}
      className={cn(
        'w-full text-left rounded-2xl border border-white/6 p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5.5 hover:border-white/12 hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
      )}
    >
      <div className="grid grid-cols-[auto_1fr_auto_auto_90px_120px] gap-4 items-center">
        {/* Status dot */}
        <div className="flex items-center w-4">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotColor(status))} />
        </div>

        {/* Main info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/8 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">{displayName}</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold border',
                  isMarkdown
                    ? 'bg-info/10 border-info/25 text-info'
                    : 'bg-destructive/10 border-destructive/25 text-destructive',
                )}
              >
                {isMarkdown ? 'Markdown' : 'PDF'}
              </span>
            </div>
            {template.descricao && (
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {template.descricao}
              </div>
            )}
          </div>
        </div>

        {/* Versão */}
        <span className="inline-flex backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 bg-white/6 border border-white/10 text-muted-foreground">
          v{template.versao}
        </span>

        {/* Tamanho */}
        <div className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
          {formatFileSize(template.arquivo_tamanho || 0)}
        </div>

        {/* Status pill */}
        <div className="flex justify-start">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border whitespace-nowrap',
              getStatusPillClass(status),
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5" data-row-action>
          <TemplateActions
            template={template}
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
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  template: Template;
  onEdit?: (t: Template) => void;
  onDuplicate?: (t: Template) => void;
  onDelete?: (t: Template) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const displayName = getTemplateDisplayName(template);
  const isMarkdown = template.tipo_template === 'markdown';
  const Icon = isMarkdown ? FileCode2 : FileText;
  const status = template.status;

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(template);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(template);
        }
      }}
      className={cn(
        'relative flex flex-col gap-3 rounded-2xl border border-white/6 bg-white/[0.028] p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5.5 hover:border-white/12 hover:-translate-y-px hover:shadow-lg',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-[0.625rem] bg-primary/8 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex items-center gap-1.5" data-row-action>
          <div className={cn('w-2 h-2 rounded-full', getStatusDotColor(status))} />
          <TemplateActions
            template={template}
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold line-clamp-1">{displayName}</span>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold border',
              isMarkdown
                ? 'bg-info/10 border-info/25 text-info'
                : 'bg-destructive/10 border-destructive/25 text-destructive',
            )}
          >
            {isMarkdown ? 'Markdown' : 'PDF'}
          </span>
          <span className="text-[10px] text-muted-foreground">v{template.versao}</span>
        </div>
      </div>

      {template.descricao ? (
        <p className="text-xs text-muted-foreground line-clamp-3 flex-1">{template.descricao}</p>
      ) : (
        <p className="text-xs text-muted-foreground/40 italic flex-1">Sem descrição</p>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/6">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {formatFileSize(template.arquivo_tamanho || 0)}
        </span>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border',
            getStatusPillClass(status),
          )}
        >
          {getStatusLabel(status)}
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
      <FileText className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">Nenhum template encontrado</p>
      <p className="text-xs text-muted-foreground/30 mt-1">Tente ajustar os filtros ou criar um novo template</p>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function TemplatesGlassList({
  templates,
  isLoading,
  mode = 'list',
  onEdit,
  onDuplicate,
  onDelete,
  canEdit = false,
  canCreate = false,
  canDelete = false,
}: TemplatesGlassListProps) {
  if (isLoading) return mode === 'cards' ? <CardsSkeleton /> : <ListSkeleton />;
  if (templates.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      {mode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((t) => (
            <GlassCard
              key={t.id}
              template={t}
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
          {templates.map((t, i) => (
            <GlassRow
              key={t.id}
              template={t}
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
