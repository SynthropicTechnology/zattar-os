import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Pencil, Power } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { getSemanticBadgeVariant, GRAU_LABELS } from '@/lib/design-system';
import type { Credencial } from '@/app/(authenticated)/captura/types';
import { formatOabs } from '@/app/(authenticated)/advogados';

type Params = {
  onViewAdvogado?: (credencial: Credencial) => void;
  onEdit?: (credencial: Credencial) => void;
  onToggleStatus?: (credencial: Credencial) => void;
};

export function criarColunasCredenciais({ onViewAdvogado, onEdit, onToggleStatus }: Params): ColumnDef<Credencial>[] {
  return [
    {
      accessorKey: 'advogado_nome',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Advogado" />,
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.advogado_nome}</p>
          <p className="truncate text-xs text-muted-foreground">
            OAB {formatOabs(row.original.advogado_oabs)} • CPF {row.original.advogado_cpf}
          </p>
        </div>
      ),
      meta: { headerLabel: 'Advogado' },
    },
    {
      accessorKey: 'tribunal',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
      cell: ({ row }) => <TribunalBadge codigo={row.original.tribunal} />,
      meta: { headerLabel: 'Tribunal' },
    },
    {
      accessorKey: 'grau',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Grau" />,
      cell: ({ row }) => (
        <Badge variant={getSemanticBadgeVariant('grau', row.original.grau)}>
          {GRAU_LABELS[row.original.grau] ?? row.original.grau}
        </Badge>
      ),
      meta: { headerLabel: 'Grau' },
    },
    {
      accessorKey: 'active',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={getSemanticBadgeVariant('status', row.original.active ? 'ATIVO' : 'INATIVO')}>
          {row.original.active ? 'Ativa' : 'Inativa'}
        </Badge>
      ),
      meta: { headerLabel: 'Status' },
    },
    {
      id: 'acoes',
      header: () => <span className="text-sm font-medium text-muted-foreground">Ações</span>,
      enableSorting: false,
      enableHiding: false,
      size: 120,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const credencial = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewAdvogado?.(credencial)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver advogado</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit?.(credencial)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleStatus?.(credencial)}
                >
                  <Power className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {credencial.active ? 'Desativar' : 'Ativar'}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
