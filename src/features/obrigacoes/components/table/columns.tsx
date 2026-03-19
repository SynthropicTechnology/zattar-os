'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Eye, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ParteBadge } from '@/components/ui/parte-badge';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import { cn } from '@/lib/utils';
import { DataTableColumnHeader } from '@/components/shared/data-shell';

import { GRAU_TRIBUNAL_LABELS, type GrauTribunal } from '@/features/expedientes/domain';

import {
  AcordoComParcelas,
  TIPO_LABELS,
  DIRECAO_LABELS,
  STATUS_LABELS,
} from '../../domain';

// =============================================================================
// TABLE META
// =============================================================================

interface ObrigacoesTableMeta {
  onVerDetalhes?: (acordo: AcordoComParcelas) => void;
  onRegistrarPagamento?: (acordo: AcordoComParcelas) => void;
  onSucessoOperacao?: () => void;
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Badge composto para Tribunal + Grau
 * Metade esquerda mostra o TRT (azul), metade direita mostra o Grau (cor por nível)
 * Copiado do padrão de expedientes/columns.tsx
 */
function TribunalGrauBadge({ trt, grau }: { trt: string; grau: string }) {
  const grauLabel = GRAU_TRIBUNAL_LABELS[grau as GrauTribunal] || grau;

  const grauColorClasses: Record<string, string> = {
    primeiro_grau: 'bg-green-500/15 text-green-600 dark:text-green-400',
    segundo_grau: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    tribunal_superior: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  };

  return (
    <div className="inline-flex items-center text-xs font-medium shrink-0">
      <span className="bg-sky-500/15 text-sky-700 dark:text-sky-400 px-2 py-0.5 rounded-l-full">
        {trt}
      </span>
      <span className={cn(
        'px-2 py-0.5 border-l border-background/50 rounded-r-full',
        grauColorClasses[grau] || 'bg-muted text-muted-foreground'
      )}>
        {grauLabel}
      </span>
    </div>
  );
}

// =============================================================================
// COLUMNS
// =============================================================================

export const columns: ColumnDef<AcordoComParcelas>[] = [
  // 1. Processo (padrão expedientes/audiências)
  {
    accessorKey: 'processo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Processo" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Processo',
    },
    cell: ({ row }) => {
      const processo = row.original.processo;
      if (!processo) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex flex-col gap-1.5 items-start py-2 max-w-[min(92vw,20rem)] min-w-0">
          {/* Badge Tribunal + Grau */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <TribunalGrauBadge trt={processo.trt} grau={processo.grau} />
          </div>

          {/* Número do processo */}
          <span className="text-xs font-mono font-medium text-foreground break-all" title={processo.numero_processo}>
            {processo.numero_processo}
          </span>

          {/* Partes com badges de polo */}
          <div className="flex flex-col gap-0.5">
            <ParteBadge
              polo="ATIVO"
              className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
            >
              {processo.nome_parte_autora || '-'}
            </ParteBadge>
            <ParteBadge
              polo="PASSIVO"
              className="flex whitespace-normal wrap-break-word text-left font-normal text-xs"
            >
              {processo.nome_parte_re || '-'}
            </ParteBadge>
          </div>
        </div>
      );
    },
    size: 300,
    enableSorting: false,
  },
  // 2. Tipo
  {
    accessorKey: 'tipo',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipo" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Tipo',
    },
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      return (
        <Badge variant={getSemanticBadgeVariant('obrigacao_tipo', tipo)} className="whitespace-nowrap">
          {TIPO_LABELS[tipo]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    size: 100,
  },
  // 3. Direção
  {
    accessorKey: 'direcao',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Direção" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Direção',
    },
    cell: ({ row }) => {
      const direcao = row.original.direcao;
      return (
        <Badge variant={getSemanticBadgeVariant('obrigacao_direcao', direcao)} className="whitespace-nowrap">
          {DIRECAO_LABELS[direcao]}
        </Badge>
      );
    },
    size: 100,
  },
  // 4. Valor Total
  {
    accessorKey: 'valorTotal',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Valor Total" />
    ),
    meta: {
      align: 'right' as const,
      headerLabel: 'Valor Total',
    },
    cell: ({ row }) => {
      const valor = row.original.valorTotal;
      return (
        <div className="text-right font-medium">
          {formatCurrency(valor)}
        </div>
      );
    },
    size: 120,
  },
  // 5. Parcelas
  {
    id: 'parcelas',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parcelas" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Parcelas',
    },
    cell: ({ row }) => {
      const pagas = row.original.parcelasPagas;
      const total = row.original.totalParcelas;
      return (
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium">{pagas}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{total}</span>
        </div>
      );
    },
    size: 80,
  },
  // 6. Próx. Vencimento
  {
    accessorKey: 'dataVencimentoPrimeiraParcela',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Próx. Vencimento" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Próx. Vencimento',
    },
    cell: ({ row }) => {
      const dateToShow = row.original.proximoVencimento;

      if (!dateToShow) {
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">—</span>
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span>{format(new Date(dateToShow), 'dd/MM/yyyy')}</span>
        </div>
      );
    },
    size: 120,
  },
  // 7. Status
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Status',
    },
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={getSemanticBadgeVariant('obrigacao_status', status)} className="whitespace-nowrap">
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    size: 110,
  },
  // 8. Ações
  {
    id: 'actions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ações" />
    ),
    meta: {
      align: 'left' as const,
      headerLabel: 'Ações',
    },
    cell: ({ row, table }) => {
      const acordo = row.original;
      const meta = table.options.meta as ObrigacoesTableMeta | undefined;

      return (
        <div className="flex items-center py-2">
          <ButtonGroup>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => meta?.onVerDetalhes?.(acordo)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver detalhes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver Detalhes</TooltipContent>
            </Tooltip>
            {acordo.status !== 'pago_total' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => meta?.onRegistrarPagamento?.(acordo)}
                  >
                    <DollarSign className="h-4 w-4" />
                    <span className="sr-only">Registrar pagamento</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Registrar Pagamento</TooltipContent>
              </Tooltip>
            )}
          </ButtonGroup>
        </div>
      );
    },
    size: 100,
    enableSorting: false,
    enableHiding: false,
  },
];
