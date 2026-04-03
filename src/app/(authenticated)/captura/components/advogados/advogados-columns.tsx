'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Key, Trash2 } from 'lucide-react';

import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Advogado } from '@/app/(authenticated)/advogados';

interface ColumnOptions {
  onEdit: (advogado: Advogado) => void;
  onDelete: (advogado: Advogado) => void;
  onViewCredenciais: (advogado: Advogado) => void;
}

/**
 * Formata CPF para exibição: 000.000.000-00
 */
function formatarCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function criarColunasAdvogados({
  onEdit,
  onDelete,
  onViewCredenciais,
}: ColumnOptions): ColumnDef<Advogado>[] {
  return [
    {
      accessorKey: 'nome_completo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      enableSorting: true,
      size: 280,
      meta: { align: 'left' as const },
      cell: ({ row }) => (
        <span className="text-sm font-medium">{row.original.nome_completo}</span>
      ),
    },
    {
      accessorKey: 'cpf',
      header: ({ column }) => <DataTableColumnHeader column={column} title="CPF" />,
      enableSorting: false,
      size: 160,
      meta: { align: 'left' as const },
      cell: ({ row }) => (
        <span className="font-mono text-sm">{formatarCpf(row.original.cpf)}</span>
      ),
    },
    {
      accessorKey: 'oabs',
      header: ({ column }) => <DataTableColumnHeader column={column} title="OAB" />,
      enableSorting: false,
      size: 200,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const oabs = row.original.oabs;
        if (!oabs || oabs.length === 0) return <span className="text-muted-foreground">-</span>;
        
        const primaryOab = oabs[0];
        const hasMultiple = oabs.length > 1;
        
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{primaryOab.numero}</span>
            <Badge variant="outline" tone="soft" className="text-xs">
              {primaryOab.uf}
            </Badge>
            {hasMultiple && (
              <Badge variant="secondary" className="text-xs">
                +{oabs.length - 1}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => <span className="text-sm font-medium text-muted-foreground">Ações</span>,
      enableSorting: false,
      enableHiding: false,
      size: 120,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const advogado = row.original;
        return (
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(advogado)}
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
                  onClick={() => onViewCredenciais(advogado)}
                >
                  <Key className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver Credenciais</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onDelete(advogado)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Excluir</TooltipContent>
            </Tooltip>
          </div>
        );
      },
    },
  ];
}
