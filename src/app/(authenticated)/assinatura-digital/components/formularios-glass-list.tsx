'use client';

/**
 * FormulariosGlassList — Lista glass de formulários no padrão AudienciasGlassList.
 */

import * as React from 'react';
import {
  ClipboardList,
  ChevronRight,
  Pencil,
  Link2,
  Trash2,
  Camera,
  MapPin,
  Code2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import type { AssinaturaDigitalFormulario } from '../feature';
import { getFormularioDisplayName } from '../feature';

// =============================================================================
// TIPOS
// =============================================================================

interface FormulariosGlassListProps {
  formularios: AssinaturaDigitalFormulario[];
  isLoading: boolean;
  onEdit?: (f: AssinaturaDigitalFormulario) => void;
  onEditSchema?: (f: AssinaturaDigitalFormulario) => void;
  onCopyLink?: (f: AssinaturaDigitalFormulario) => void;
  onDelete?: (f: AssinaturaDigitalFormulario) => void;
  canEdit?: boolean;
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

// =============================================================================
// ROW
// =============================================================================

function GlassRow({
  formulario,
  onEdit,
  onEditSchema,
  onCopyLink,
  onDelete,
  canEdit,
  canDelete,
  isAlt,
}: {
  formulario: AssinaturaDigitalFormulario;
  onEdit?: (f: AssinaturaDigitalFormulario) => void;
  onEditSchema?: (f: AssinaturaDigitalFormulario) => void;
  onCopyLink?: (f: AssinaturaDigitalFormulario) => void;
  onDelete?: (f: AssinaturaDigitalFormulario) => void;
  canEdit: boolean;
  canDelete: boolean;
  isAlt: boolean;
}) {
  const displayName = getFormularioDisplayName(formulario);
  const segmentoNome = formulario.segmento?.nome;

  const handleRowClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-row-action]')) return;
    onEdit?.(formulario);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onEdit?.(formulario);
        }
      }}
      className={cn(
        'w-full text-left rounded-2xl border border-white/6 p-4 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:bg-white/5.5 hover:border-white/12 hover:scale-[1.0025] hover:-translate-y-px hover:shadow-lg',
        isAlt ? 'bg-white/[0.018]' : 'bg-white/[0.028]',
      )}
    >
      <div className="grid grid-cols-[auto_1fr_140px_120px_80px_140px] gap-4 items-center">
        {/* Status dot */}
        <div className="flex items-center w-10">
          <div className={cn('w-2 h-2 rounded-full shrink-0', getAtivoDotColor(formulario.ativo))} />
        </div>

        {/* Main info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-[0.625rem] bg-primary/8 flex items-center justify-center shrink-0">
            <ClipboardList className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{displayName}</div>
            {formulario.descricao && (
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {formulario.descricao}
              </div>
            )}
            <div className="text-[10px] text-muted-foreground/50 mt-0.5 font-mono truncate">
              {formulario.slug}
            </div>
          </div>
        </div>

        {/* Segmento */}
        <div>
          {segmentoNome ? (
            <span className="inline-flex backdrop-blur-sm rounded-lg text-[11px] font-semibold tracking-[0.04em] px-2 py-1 bg-primary/12 border border-primary/20 text-primary/80 truncate max-w-full">
              {segmentoNome}
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground/50">—</span>
          )}
        </div>

        {/* Captura */}
        <div className="flex items-center gap-1.5">
          {formulario.foto_necessaria && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 bg-info/10 border border-info/25 text-info rounded px-1.5 py-0.5 text-[10px] font-semibold">
                  <Camera className="w-2.5 h-2.5" />
                  Foto
                </span>
              </TooltipTrigger>
              <TooltipContent>Captura selfie do assinante</TooltipContent>
            </Tooltip>
          )}
          {formulario.geolocation_necessaria && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 bg-warning/10 border border-warning/25 text-warning rounded px-1.5 py-0.5 text-[10px] font-semibold">
                  <MapPin className="w-2.5 h-2.5" />
                  Geo
                </span>
              </TooltipTrigger>
              <TooltipContent>Registra coordenadas</TooltipContent>
            </Tooltip>
          )}
          {!formulario.foto_necessaria && !formulario.geolocation_necessaria && (
            <span className="text-[11px] text-muted-foreground/50">—</span>
          )}
        </div>

        {/* Status */}
        <div>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 backdrop-blur-sm rounded-lg text-[10px] font-semibold tracking-[0.04em] px-2 py-1 border',
              formulario.ativo
                ? 'bg-success/10 border-success/25 text-success'
                : 'bg-muted-foreground/10 border-muted-foreground/25 text-muted-foreground',
            )}
          >
            {formulario.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-0.5" data-row-action>
          {onEditSchema && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Editar schema"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSchema(formulario);
                  }}
                >
                  <Code2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Schema</TooltipContent>
            </Tooltip>
          )}
          {canEdit && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Editar formulário"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(formulario);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          )}
          {onCopyLink && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Copiar link público"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyLink(formulario);
                  }}
                >
                  <Link2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copiar link</TooltipContent>
            </Tooltip>
          )}
          {canDelete && onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Deletar formulário"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(formulario);
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
    <div className="grid grid-cols-[auto_1fr_140px_120px_80px_140px] gap-4 items-center px-4 mb-2">
      <div className="w-10" />
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Formulário
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Segmento
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
        Captura
      </span>
      <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
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
          <div className="grid grid-cols-[auto_1fr_140px_120px_80px_140px] gap-4 items-center">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-[0.625rem]" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-lg" />
            <Skeleton className="h-5 w-14 rounded-lg" />
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
      <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/50">Nenhum formulário encontrado</p>
      <p className="text-xs text-muted-foreground/30 mt-1">Tente ajustar os filtros ou criar um novo formulário</p>
    </div>
  );
}

// =============================================================================
// MAIN
// =============================================================================

export function FormulariosGlassList({
  formularios,
  isLoading,
  onEdit,
  onEditSchema,
  onCopyLink,
  onDelete,
  canEdit = false,
  canDelete = false,
}: FormulariosGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (formularios.length === 0) return <EmptyState />;

  return (
    <TooltipProvider>
      <div>
        <ColumnHeaders />
        <div className="flex flex-col gap-2">
          {formularios.map((f, i) => (
            <GlassRow
              key={f.id}
              formulario={f}
              onEdit={onEdit}
              onEditSchema={onEditSchema}
              onCopyLink={onCopyLink}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              isAlt={i % 2 === 1}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
