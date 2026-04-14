'use client';

/**
 * TemplatesGlassList — Lista glass de templates no padrão AudienciasGlassList.
 * Rows-as-buttons com grid customizado, status dot com glow, icon tile,
 * column headers separado e skeleton replicando o grid.
 */

import * as React from 'react';
import { FileText, FileCode2, ChevronRight, Pencil, Copy, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import type { Template } from '../feature';
import { formatFileSize, formatTemplateStatus, getTemplateDisplayName } from '../feature';

// =============================================================================
// TIPOS
// =============================================================================

interface TemplatesGlassListProps {
  templates: Template[];
  isLoading: boolean;
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
  const status = template.status as 'ativo' | 'inativo' | 'rascunho';

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
      <div className="grid grid-cols-[auto_1fr_110px_100px_100px_110px_32px] gap-4 items-center">
        {/* Status dot */}
        <div className="flex items-center w-10">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getStatusDotColor(status))} />
        </div>

        {/* Main info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/8 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{displayName}</div>
            {template.descricao && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {template.descricao}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono truncate">
              {template.template_uuid ?? `#${template.id}`}
            </div>
          </div>
        </div>

        {/* Tipo */}
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 border',
              isMarkdown
                ? 'bg-info/12 border-info/20 text-info/80'
                : 'bg-destructive/10 border-destructive/20 text-destructive/80',
            )}
          >
            {isMarkdown ? 'Markdown' : 'PDF'}
          </span>
        </div>

        {/* Versão */}
        <div>
          <span className="inline-flex backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 bg-white/6 border border-white/10 text-muted-foreground">
            v{template.versao}
          </span>
        </div>

        {/* Tamanho */}
        <div className="text-xs text-muted-foreground tabular-nums">
          {formatFileSize(template.arquivo_tamanho || 0)}
        </div>

        {/* Status */}
        <div className="text-right">
          <SemanticBadge
            category="template_status"
            value={status}
            className="text-[10px]"
          >
            {formatTemplateStatus(status)}
          </SemanticBadge>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5" data-row-action>
          {canEdit && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Editar template"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(template);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(template);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(template);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deletar</TooltipContent>
            </Tooltip>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-1" />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COLUMN HEADERS / SKELETON / EMPTY
// =============================================================================

function ColumnHeaders() {
  return (
    <div className="grid grid-cols-[auto_1fr_110px_100px_100px_110px_32px] gap-4 items-center px-4 mb-2">
      <div className="w-10" />
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Template
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Tipo
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Versão
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Tamanho
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider text-right">
        Status
      </span>
      <div />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-white/6 bg-white/[0.028] p-4">
          <div className="grid grid-cols-[auto_1fr_110px_100px_100px_110px_32px] gap-4 items-center">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-[0.625rem]" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-lg" />
            <Skeleton className="h-6 w-10 rounded-lg" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-16 ml-auto rounded-full" />
            <div />
          </div>
        </div>
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
  onEdit,
  onDuplicate,
  onDelete,
  canEdit = false,
  canCreate = false,
  canDelete = false,
}: TemplatesGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (templates.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      <div>
        <ColumnHeaders />
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
      </div>
    </TooltipProvider>
  );
}
