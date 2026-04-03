'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { TribunalBadge } from '@/components/ui/tribunal-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import type { TribunalConfigDb } from '@/app/(authenticated)/captura';

type Params = {
  onEdit?: (tribunal: TribunalConfigDb) => void;
};

const TIPO_ACESSO_LABELS: Record<string, string> = {
  primeiro_grau: '1º Grau',
  segundo_grau: '2º Grau',
  unico: 'Único',
};

export function criarColunasTribunais({ onEdit }: Params): ColumnDef<TribunalConfigDb>[] {
  return [
    {
      accessorKey: 'tribunal_codigo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Código" />,
      cell: ({ row }) => <TribunalBadge codigo={row.original.tribunal_codigo} />,
      meta: { headerLabel: 'Código' },
    },
    {
      accessorKey: 'tribunal_nome',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Tribunal" />,
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.tribunal_nome}</span>
      ),
      meta: { headerLabel: 'Tribunal' },
    },
    {
      accessorKey: 'tipo_acesso',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acesso" />,
      cell: ({ row }) => (
        <Badge variant={getSemanticBadgeVariant('grau', row.original.tipo_acesso)}>
          {TIPO_ACESSO_LABELS[row.original.tipo_acesso] ?? row.original.tipo_acesso}
        </Badge>
      ),
      meta: { headerLabel: 'Acesso' },
    },
    {
      accessorKey: 'url_base',
      header: ({ column }) => <DataTableColumnHeader column={column} title="URL Base" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground truncate block max-w-xs" title={row.original.url_base}>
          {row.original.url_base}
        </span>
      ),
      meta: { headerLabel: 'URL Base' },
    },
    {
      id: 'acoes',
      header: () => <span className="text-sm font-medium text-muted-foreground">Ações</span>,
      enableSorting: false,
      enableHiding: false,
      size: 80,
      meta: { align: 'left' as const },
      cell: ({ row }) => (
        <div className="flex items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit?.(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];
}
