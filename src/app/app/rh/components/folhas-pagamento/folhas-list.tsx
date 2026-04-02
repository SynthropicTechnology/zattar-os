
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import {
  DataPagination,
  DataShell,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import type { Table as TanstackTable } from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { GerarFolhaDialog } from './gerar-folha-dialog';
import { useFolhasPagamento } from '../../hooks';
import { MESES_LABELS, STATUS_FOLHA_LABELS } from '../../domain';
import { STATUS_FOLHA_CORES } from '../../utils';
import type { FolhaPagamentoComDetalhes } from '../../types';

import { FilterPopover } from '@/app/app/partes';

const statusOptions = [
  { value: 'rascunho', label: STATUS_FOLHA_LABELS.rascunho },
  { value: 'aprovada', label: STATUS_FOLHA_LABELS.aprovada },
  { value: 'paga', label: STATUS_FOLHA_LABELS.paga },
  { value: 'cancelada', label: STATUS_FOLHA_LABELS.cancelada },
];

const mesesOptions = Object.entries(MESES_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ============================================================================
// Helpers
// ============================================================================

const formatarValor = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

const formatarData = (data: string): string => {
  const date = new Date(data);
  // Usa UTC para evitar deslocamento de fuso horário em datas sem hora
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

// ============================================================================
// Definição das Colunas
// ============================================================================

function criarColunas(
  onDetalhes: (folha: FolhaPagamentoComDetalhes) => void
): ColumnDef<FolhaPagamentoComDetalhes>[] {
  return [
    {
      accessorKey: 'periodo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Período" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => {
        const folha = row.original;
        return (
          <div className="font-medium">
            {MESES_LABELS[folha.mesReferencia]}/{folha.anoReferencia}
          </div>
        );
      },
    },
    {
      accessorKey: 'dataGeracao',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Data Geração" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => (
        <div className="text-center">{formatarData(row.original.dataGeracao)}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 130,
      cell: ({ row }) => {
        const folha = row.original;
        const cores =
          STATUS_FOLHA_CORES[folha.status] || STATUS_FOLHA_CORES.rascunho;
        return (
          <div className="flex justify-center">
            <Badge
              className={`${cores.bg} ${cores.text} border ${cores.border}`}
              variant="outline"
            >
              {STATUS_FOLHA_LABELS[folha.status]}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'totalFuncionarios',
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <DataTableColumnHeader column={column} title="Funcionários" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      cell: ({ row }) => (
        <div className="text-center font-medium">
          {row.original.totalFuncionarios}
        </div>
      ),
    },
    {
      accessorKey: 'valorTotal',
      header: ({ column }) => (
        <div className="flex items-center justify-end">
          <DataTableColumnHeader column={column} title="Valor Total" />
        </div>
      ),
      enableSorting: true,
      size: 150,
      cell: ({ row }) => (
        <div className="text-right font-medium text-green-600">
          {formatarValor(row.original.valorTotal ?? 0)}
        </div>
      ),
    },
    {
      id: 'actions',
      header: () => <div className="text-center">Ações</div>,
      size: 100,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDetalhes(row.original)}
          >
            Detalhes
          </Button>
        </div>
      ),
    },
  ];
}

// ============================================================================
// Componente Principal
// ============================================================================

export function FolhasPagamentoList() {
  const router = useRouter();

  // Estado da instância da tabela e densidade
  const [table, setTable] = React.useState<
    TanstackTable<FolhaPagamentoComDetalhes> | undefined
  >(undefined);
  const [density, setDensity] = React.useState<
    'compact' | 'standard' | 'relaxed'
  >('standard');

  // Estados de filtros
  const [dialogAberto, setDialogAberto] = React.useState(false);
  const [pagina, setPagina] = React.useState(1);
  const [mesReferencia, setMesReferencia] = React.useState<string>('');
  const [anoReferencia] = React.useState<string>(''); // Mantendo como string simples por enquanto, ideal seria um input ou select de anos
  const [status, setStatus] = React.useState<string>('');

  const { folhas, paginacao, isLoading, error, refetch } = useFolhasPagamento({
    pagina,
    limite: 50,
    mesReferencia: mesReferencia ? Number(mesReferencia) : undefined,
    anoReferencia: anoReferencia ? Number(anoReferencia) : undefined,
    status: status as 'rascunho' | 'aprovada' | 'paga' | 'cancelada' | undefined,
  });

  const handleNovaFolha = React.useCallback(() => setDialogAberto(true), []);

  const handleGerada = React.useCallback(
    (folhaId?: number) => {
      refetch();
      setPagina(1);
      if (folhaId) {
        router.push(`/rh/folhas-pagamento/${folhaId}`);
      }
    },
    [refetch, router]
  );

  const handleDetalhes = React.useCallback(
    (folha: FolhaPagamentoComDetalhes) => {
      router.push(`/rh/folhas-pagamento/${folha.id}`);
    },
    [router]
  );

  // Colunas
  const colunas = React.useMemo(
    () => criarColunas(handleDetalhes),
    [handleDetalhes]
  );

  return (
    <>
      <DataShell
        header={
          <DataTableToolbar
            table={table}
            title="Folhas de Pagamento"
            density={density}
            onDensityChange={setDensity}
            actionButton={{
              label: 'Gerar Nova Folha',
              onClick: handleNovaFolha,
            }}
            filtersSlot={
              <>
                <FilterPopover
                  label="Mês"
                  options={mesesOptions}
                  value={mesReferencia}
                  onValueChange={(val) => {
                    setMesReferencia(val === 'all' ? '' : val);
                    setPagina(1);
                  }}
                  defaultValue=""
                />

                {/* TODO: Criar componente melhor para seleção de ano se necessário, por enquanto FilterPopover não é ideal para input livre, mas para selects fixos sim. 
                    Como ano é input livre no original, talvez devêssemos manter ou criar um filtro de ano específico.
                    Vou manter um input estilizado dentro do toolbar slot se funcionar bem, ou adaptar.
                    Para simplificar e seguir o padrão, vou assumir que apenas FilterPopover é desejado para selects. 
                    Se precisar de input, o DataTableToolbar tem searchValue, mas é para busca geral.
                */}

                <FilterPopover
                  label="Status"
                  options={statusOptions}
                  value={status}
                  onValueChange={(val) => {
                    setStatus(val === 'all' ? '' : val);
                    setPagina(1);
                  }}
                  defaultValue=""
                />
              </>
            }
          />
        }
        footer={
          paginacao && paginacao.totalPaginas > 0 ? (
            <DataPagination
              pageIndex={pagina - 1}
              pageSize={50}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={(pageIndex) => setPagina(pageIndex + 1)}
              onPageSizeChange={() => { }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          columns={colunas}
          data={folhas}
          isLoading={isLoading}
          error={error}
          pagination={
            paginacao
              ? {
                pageIndex: pagina - 1,
                pageSize: 50,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: (pageIndex) => setPagina(pageIndex + 1),
                onPageSizeChange: () => { },
              }
              : undefined
          }
          hidePagination={true}
          onTableReady={setTable}
          density={density}
          emptyMessage="Nenhuma folha de pagamento encontrada."
        />
      </DataShell>

      <GerarFolhaDialog
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSuccess={handleGerada}
      />
    </>
  );
}
