'use client';

/**
 * ContratosGlassList — Lista Glass Briefing de contratos.
 * ============================================================================
 * Segue o vocabulário visual de AudienciasGlassList/ExpedientesGlassList:
 * grid CSS (sem TanStack), rows com rounded-2xl, hover com translate + shadow,
 * SemanticBadge, status dot colorido. Suporta seleção em massa via checkbox
 * à esquerda — diferencial de contratos.
 *
 * Clicar na linha navega para /app/contratos/[id]. Ícones de ação param
 * propagação para disparar dialogs (editar, excluir, gerar peça, visualizar).
 * ============================================================================
 */

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Building2, Scale, Eye, Pencil, Trash2, FileSignature, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SemanticBadge } from '@/components/ui/semantic-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

import type { Contrato, StatusContrato } from '../domain';
import { TIPO_CONTRATO_LABELS, TIPO_COBRANCA_LABELS, STATUS_CONTRATO_LABELS } from '../domain';
import type { ClienteInfo } from '../types';
import { formatarData } from '../utils';
import { ContratoAlterarResponsavelDialog } from './contrato-alterar-responsavel-dialog';

// =============================================================================
// TYPES
// =============================================================================

export interface ContratosGlassListProps {
  contratos: Contrato[];
  isLoading: boolean;
  clientesMap: Map<number, ClienteInfo>;
  partesContrariasMap: Map<number, ClienteInfo>;
  usuariosMap: Map<number, ClienteInfo>;
  segmentosMap: Map<number, { nome: string }>;
  usuarios: ClienteInfo[];
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onEdit: (contrato: Contrato) => void;
  onDelete: (contrato: Contrato) => void;
  onGerarPeca: (contrato: Contrato) => void;
  onResponsavelChanged: () => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const STATUS_DOT_COLOR: Record<StatusContrato, string> = {
  em_contratacao: 'bg-warning',
  contratado: 'bg-success',
  distribuido: 'bg-info',
  desistencia: 'bg-destructive',
};

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Layout de grid compartilhado entre header e linha.
const GRID_TEMPLATE =
  'grid-cols-[28px_10px_minmax(0,2.2fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_90px_140px]';

// =============================================================================
// SELECT-ALL RAIL (sem labels de coluna)
// =============================================================================

function SelectAllRail({
  allSelected,
  someSelected,
  onToggleSelectAll,
  visibleCount,
}: {
  allSelected: boolean;
  someSelected: boolean;
  onToggleSelectAll: () => void;
  visibleCount: number;
}) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 text-muted-foreground/50">
      <Checkbox
        checked={allSelected ? true : someSelected ? 'indeterminate' : false}
        onCheckedChange={onToggleSelectAll}
        aria-label="Selecionar todos da página"
        className="size-3.5"
      />
      <span className="text-[10px] font-medium uppercase tracking-wider">
        Selecionar {visibleCount}
      </span>
    </div>
  );
}

// =============================================================================
// ACTIONS CELL
// =============================================================================

function RowActions({
  contrato,
  onEdit,
  onDelete,
  onGerarPeca,
}: {
  contrato: Contrato;
  onEdit: (c: Contrato) => void;
  onDelete: (c: Contrato) => void;
  onGerarPeca: (c: Contrato) => void;
}) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Visualizar" className="size-7" asChild>
            <Link href={`/app/contratos/${contrato.id}`}>
              <Eye className="size-3.5" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Editar"
            className="size-7"
            onClick={() => onEdit(contrato)}
          >
            <Pencil className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Gerar peça"
            className="size-7"
            onClick={() => onGerarPeca(contrato)}
          >
            <FileSignature className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Gerar Peça</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Excluir"
            className="size-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(contrato)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Excluir</TooltipContent>
      </Tooltip>
    </div>
  );
}

// =============================================================================
// RESPONSÁVEL CELL
// =============================================================================

function ResponsavelCell({
  contrato,
  usuariosMap,
  usuarios,
  onChanged,
}: {
  contrato: Contrato;
  usuariosMap: Map<number, ClienteInfo>;
  usuarios: ClienteInfo[];
  onChanged: () => void;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const usuario = contrato.responsavelId ? usuariosMap.get(contrato.responsavelId) ?? null : null;
  const nome = usuario?.nome ?? null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setDialogOpen(true);
        }}
        className="flex items-center gap-1.5 min-w-0 rounded-lg px-1 -mx-1 py-1 text-left transition-colors hover:bg-muted/40 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
        title={nome ? `Alterar responsável: ${nome}` : 'Atribuir responsável'}
      >
        {nome ? (
          <>
            <Avatar size="sm" className="size-5.5">
              <AvatarImage src={usuario?.avatarUrl || undefined} alt={nome} />
              <AvatarFallback className="text-[9px] font-semibold">{getInitials(nome)}</AvatarFallback>
            </Avatar>
            <span className="text-[11px] truncate">{nome}</span>
          </>
        ) : (
          <span className="text-[11px] text-destructive/70 italic">Sem responsável</span>
        )}
      </button>
      <ContratoAlterarResponsavelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        contrato={contrato}
        usuarios={usuarios}
        onSuccess={onChanged}
      />
    </>
  );
}

// =============================================================================
// GLASS ROW
// =============================================================================

function GlassRow({
  contrato,
  clientesMap,
  partesContrariasMap,
  usuariosMap,
  segmentosMap,
  usuarios,
  isSelected,
  isAlt,
  onToggleSelect,
  onEdit,
  onDelete,
  onGerarPeca,
  onResponsavelChanged,
}: {
  contrato: Contrato;
  clientesMap: Map<number, ClienteInfo>;
  partesContrariasMap: Map<number, ClienteInfo>;
  usuariosMap: Map<number, ClienteInfo>;
  segmentosMap: Map<number, { nome: string }>;
  usuarios: ClienteInfo[];
  isSelected: boolean;
  isAlt: boolean;
  onToggleSelect: () => void;
  onEdit: (c: Contrato) => void;
  onDelete: (c: Contrato) => void;
  onGerarPeca: (c: Contrato) => void;
  onResponsavelChanged: () => void;
}) {
  const router = useRouter();

  // Partes autora/ré com fallback no cliente canônico do contrato.
  const clienteNome = clientesMap.get(contrato.clienteId)?.nome || `Cliente #${contrato.clienteId}`;
  const partesAutoras = (contrato.partes ?? []).filter((p) => p.papelContratual === 'autora');
  const partesRe = (contrato.partes ?? []).filter((p) => p.papelContratual === 're');

  const getParteNome = (parte: { tipoEntidade: string; entidadeId: number; nomeSnapshot?: string | null }) => {
    if (parte.nomeSnapshot) return parte.nomeSnapshot;
    if (parte.tipoEntidade === 'cliente') {
      return clientesMap.get(parte.entidadeId)?.nome || `Cliente #${parte.entidadeId}`;
    }
    if (parte.tipoEntidade === 'parte_contraria') {
      return partesContrariasMap.get(parte.entidadeId)?.nome || `Parte Contrária #${parte.entidadeId}`;
    }
    return `Entidade #${parte.entidadeId}`;
  };

  const autoraNome = (() => {
    if (contrato.papelClienteNoContrato === 'autora') {
      return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : clienteNome;
    }
    return partesAutoras.length > 0 ? getParteNome(partesAutoras[0]) : null;
  })();

  const reNome = (() => {
    if (contrato.papelClienteNoContrato === 're') {
      return partesRe.length > 0 ? getParteNome(partesRe[0]) : clienteNome;
    }
    return partesRe.length > 0 ? getParteNome(partesRe[0]) : null;
  })();

  const segmentoNome = contrato.segmentoId ? segmentosMap.get(contrato.segmentoId)?.nome ?? null : null;
  const processos = contrato.processos ?? [];
  const firstProcesso = processos[0];
  const processosRestantes = processos.length > 1 ? processos.length - 1 : 0;

  const handleRowClick = () => {
    router.push(`/app/contratos/${contrato.id}`);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleRowClick();
        }
      }}
      className={cn(
        'group w-full text-left rounded-2xl border p-3 cursor-pointer',
        'transition-all duration-180 ease-out',
        'hover:border-border hover:shadow-[0_4px_14px_rgba(0,0,0,0.06)] hover:-translate-y-px',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected
          ? 'border-primary/40 bg-primary/4'
          : isAlt
            ? 'border-border/50 bg-card/60'
            : 'border-border/60 bg-card',
      )}
    >
      <div className={cn('grid items-center gap-3', GRID_TEMPLATE)}>
        {/* 1. Checkbox */}
        <div
          className="flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Selecionar contrato ${contrato.id}`}
            className="size-3.5"
          />
        </div>

        {/* 2. Status dot (stage color) */}
        <div className="flex items-center justify-center">
          <span
            className={cn('size-2 rounded-full shrink-0 opacity-80', STATUS_DOT_COLOR[contrato.status])}
            aria-hidden="true"
          />
        </div>

        {/* 3. Cliente / Parte — título + partes + observações */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-foreground truncate leading-tight">
              {autoraNome || clienteNome}
              {partesAutoras.length > 1 && (
                <span className="text-muted-foreground/60 font-medium"> e outros</span>
              )}
            </span>
            {contrato.papelClienteNoContrato === 'autora' && (
              <span className="inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1 py-px text-[9px] font-semibold shrink-0">
                Cliente
              </span>
            )}
          </div>
          {reNome && (
            <div className="text-[11px] text-muted-foreground/70 truncate mt-0.5">
              <span className="text-muted-foreground/40">vs. </span>
              {reNome}
              {partesRe.length > 1 && <span className="text-muted-foreground/50"> e outros</span>}
              {contrato.papelClienteNoContrato === 're' && (
                <span className="ml-1.5 inline-flex items-center bg-primary/10 border border-primary/20 text-primary rounded px-1 py-px text-[9px] font-semibold">
                  Cliente
                </span>
              )}
            </div>
          )}
          {segmentoNome && (
            <div className="text-[10px] text-muted-foreground/45 mt-0.5 truncate">{segmentoNome}</div>
          )}
        </div>

        {/* 4. Tipo / Cobrança */}
        <div className="flex flex-col gap-1 min-w-0">
          <SemanticBadge category="tipo_contrato" value={contrato.tipoContrato} className="text-[10px] w-fit">
            {TIPO_CONTRATO_LABELS[contrato.tipoContrato]}
          </SemanticBadge>
          <SemanticBadge category="tipo_cobranca" value={contrato.tipoCobranca} className="text-[10px] w-fit">
            {TIPO_COBRANCA_LABELS[contrato.tipoCobranca]}
          </SemanticBadge>
        </div>

        {/* 5. Processos vinculados */}
        <div className="flex flex-col gap-0.5 min-w-0">
          {firstProcesso ? (
            <>
              <Link
                href={`/app/processos/${firstProcesso.processoId}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 min-w-0 text-[11px] text-primary hover:underline"
              >
                <Scale className="size-2.5 shrink-0" />
                <span className="tabular-nums truncate">
                  {firstProcesso.processo?.numeroProcesso ?? `Processo #${firstProcesso.processoId}`}
                </span>
              </Link>
              {processosRestantes > 0 && (
                <span className="text-[9px] text-muted-foreground/60">+{processosRestantes} vinculado{processosRestantes > 1 ? 's' : ''}</span>
              )}
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground/40">—</span>
          )}
        </div>

        {/* 6. Estágio (status) */}
        <div>
          <SemanticBadge category="status_contrato" value={contrato.status} className="text-[10px]">
            {STATUS_CONTRATO_LABELS[contrato.status]}
          </SemanticBadge>
        </div>

        {/* 7. Responsável */}
        <ResponsavelCell
          contrato={contrato}
          usuariosMap={usuariosMap}
          usuarios={usuarios}
          onChanged={onResponsavelChanged}
        />

        {/* 8. Data de cadastro */}
        <div className="text-[11px] text-muted-foreground/70 tabular-nums">
          {formatarData(contrato.cadastradoEm)}
        </div>

        {/* 9. Ações (4 ícones) */}
        <RowActions contrato={contrato} onEdit={onEdit} onDelete={onDelete} onGerarPeca={onGerarPeca} />
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON
// =============================================================================

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card p-3">
          <div className={cn('grid items-center gap-3', GRID_TEMPLATE)}>
            <Skeleton className="size-3.5 rounded" />
            <Skeleton className="size-2 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-4 w-16 rounded-md" />
              <Skeleton className="h-4 w-14 rounded-md" />
            </div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-20 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-14" />
            <div className="flex items-center justify-end gap-0.5">
              {[0, 1, 2, 3].map((j) => (
                <Skeleton key={j} className="size-7 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 opacity-60">
      <FileText className="w-10 h-10 text-muted-foreground/30 mb-4" />
      <p className="text-sm font-medium text-muted-foreground/60">Nenhum contrato encontrado</p>
      <p className="text-xs text-muted-foreground/40 mt-1">Tente ajustar os filtros ou cadastre um novo contrato</p>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ContratosGlassList({
  contratos,
  isLoading,
  clientesMap,
  partesContrariasMap,
  usuariosMap,
  segmentosMap,
  usuarios,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onGerarPeca,
  onResponsavelChanged,
}: ContratosGlassListProps) {
  if (isLoading) return <ListSkeleton />;
  if (contratos.length === 0) return <EmptyState />;

  const allSelected = contratos.length > 0 && contratos.every((c) => selectedIds.has(c.id));
  const someSelected = !allSelected && contratos.some((c) => selectedIds.has(c.id));

  return (
    <TooltipProvider>
      <div>
        <SelectAllRail
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleSelectAll={onToggleSelectAll}
          visibleCount={contratos.length}
        />
        <div className="flex flex-col gap-2">
          {contratos.map((contrato, i) => (
            <GlassRow
              key={contrato.id}
              contrato={contrato}
              clientesMap={clientesMap}
              partesContrariasMap={partesContrariasMap}
              usuariosMap={usuariosMap}
              segmentosMap={segmentosMap}
              usuarios={usuarios}
              isSelected={selectedIds.has(contrato.id)}
              isAlt={i % 2 === 1}
              onToggleSelect={() => onToggleSelect(contrato.id)}
              onEdit={onEdit}
              onDelete={onDelete}
              onGerarPeca={onGerarPeca}
              onResponsavelChanged={onResponsavelChanged}
            />
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}
