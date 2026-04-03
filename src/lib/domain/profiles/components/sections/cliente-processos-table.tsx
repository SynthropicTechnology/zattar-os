'use client';

import * as React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { DataTable } from '@/components/shared/data-shell/data-table';
import { SemanticBadge, StatusSemanticBadge } from '@/components/ui/semantic-badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatarData } from '@/app/(authenticated)/partes/utils';
import { StatusProcesso, STATUS_PROCESSO_LABELS, GRAU_LABELS } from '@/app/(authenticated)/processos';
import type { ProcessoVinculo } from '../../types';
import type { ProfileData } from '../../configs/types';
import type { GrauProcesso, PoloProcessoParte } from '@/app/(authenticated)/partes';

interface EntidadeProcessosTableProps {
  data: ProfileData;
  title?: string;
}

const POLO_OPTIONS: { value: PoloProcessoParte | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativo' },
  { value: 'PASSIVO', label: 'Passivo' },
  { value: 'NEUTRO', label: 'Neutro' },
  { value: 'TERCEIRO', label: 'Terceiro' },
];

const STATUS_OPTIONS: { value: StatusProcesso | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  ...Object.entries(STATUS_PROCESSO_LABELS).map(([value, label]) => ({
    value: value as StatusProcesso,
    label,
  })),
];

function getGrauLabel(grau: string): string {
  const grauMap: Record<string, string> = {
    primeiro_grau: '1\u00BA Grau',
    segundo_grau: '2\u00BA Grau',
    tribunal_superior: 'TST',
  };
  return grauMap[grau] || GRAU_LABELS[grau as GrauProcesso] || grau;
}

export function EntidadeProcessosTable({ data, title = 'Processos Relacionados' }: EntidadeProcessosTableProps) {

  const processos = React.useMemo(() => (data.processos || []) as ProcessoVinculo[], [data.processos]);

  const [poloFilter, setPoloFilter] = React.useState<string>('todos');
  const [statusFilter, setStatusFilter] = React.useState<string>('todos');

  const filteredData = React.useMemo(() => {
    return processos.filter((processo) => {
      if (poloFilter !== 'todos' && processo.polo !== poloFilter) {
        return false;
      }
      if (statusFilter !== 'todos' && processo.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [processos, poloFilter, statusFilter]);

  const columns = React.useMemo<ColumnDef<ProcessoVinculo>[]>(
    () => [
      {
        accessorKey: 'numero_processo',
        header: 'Numero do Processo',
        meta: { align: 'left' },
        cell: ({ row }) => {
          const processo = row.original;
          return (
            <Link
              href={`/app/processos/${processo.processo_id}`}
              className="text-primary hover:underline flex items-center gap-2"
              aria-label={`Ver detalhes do processo ${processo.numero_processo}`}
            >
              <Eye className="h-4 w-4" />
              <span className="font-mono text-sm">{processo.numero_processo}</span>
            </Link>
          );
        },
      },
      {
        accessorKey: 'trt',
        header: 'TRT',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <SemanticBadge category="tribunal" value={row.original.trt}>
            {row.original.trt}
          </SemanticBadge>
        ),
      },
      {
        accessorKey: 'grau',
        header: 'Grau',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <SemanticBadge category="grau" value={row.original.grau}>
            {getGrauLabel(row.original.grau)}
          </SemanticBadge>
        ),
      },
      {
        accessorKey: 'polo',
        header: 'Polo',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <SemanticBadge category="polo" value={row.original.polo}>
            {row.original.polo}
          </SemanticBadge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <StatusSemanticBadge value={row.original.status}>
            {STATUS_PROCESSO_LABELS[row.original.status] || row.original.status}
          </StatusSemanticBadge>
        ),
      },
      {
        accessorKey: 'data_autuacao',
        header: 'Distribuicao',
        meta: { align: 'left' },
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatarData(row.original.data_autuacao)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Toolbar de filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="polo-filter" className="text-sm text-muted-foreground">
              Filtrar por Polo
            </label>
            <Select value={poloFilter} onValueChange={setPoloFilter}>
              <SelectTrigger id="polo-filter" className="w-45">
                <SelectValue placeholder="Selecionar polo" />
              </SelectTrigger>
              <SelectContent>
                {POLO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="status-filter" className="text-sm text-muted-foreground">
              Filtrar por Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-45">
                <SelectValue placeholder="Selecionar status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(poloFilter !== 'todos' || statusFilter !== 'todos') && (
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPoloFilter('todos');
                  setStatusFilter('todos');
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </div>

        {/* Tabela */}
        <DataTable
          data={filteredData}
          columns={columns}
          density="standard"
          striped={true}
          emptyMessage="Nenhum processo encontrado com os filtros aplicados."
          ariaLabel="Processos relacionados"
        />
      </CardContent>
    </Card>
  );
}

// Alias exports for specific entity types (for backwards compatibility and clarity)
export const ClienteProcessosTable = EntidadeProcessosTable;
export const ParteContrariaProcessosTable = EntidadeProcessosTable;
export const TerceiroProcessosTable = EntidadeProcessosTable;
