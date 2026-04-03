'use client';

/**
 * Página de Plano de Contas
 * Lista e gerencia contas contábeis do sistema
 *
 * REFATORADO: Migrado de TableToolbar (deprecated) para DataTableToolbar (Data Shell)
 */

import * as React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataPagination,
  DataShell,
  DataTable,
  DataTableToolbar,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { PageShell } from '@/components/shared/page-shell';
import {
  type NivelConta,
  PlanoContaCreateDialog,
  type PlanoContaComPai,
  PlanoContaEditDialog,
  type PlanoContasFilters,
  type TipoContaContabil,
  usePlanoContas,
  TIPO_CONTA_LABELS,
  NATUREZA_LABELS,
  NIVEL_LABELS,
  MaisFiltrosPlanoContasPopover,
} from '@/app/(authenticated)/financeiro';
import { actionAtualizarConta } from '@/app/(authenticated)/financeiro/server-actions';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Power } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';

// Variantes do Badge para tipos de conta
type BadgeVariant = 'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'destructive' | 'neutral' | 'accent';
const TIPO_CONTA_VARIANTS: Record<TipoContaContabil, BadgeVariant> = {
  ativo: 'info',           // azul (sky)
  passivo: 'destructive',       // vermelho
  receita: 'success',      // verde (emerald)
  despesa: 'warning',      // amarelo (amber)
  patrimonio_liquido: 'default',  // roxo/primário
};



/**
 * Define as colunas da tabela de plano de contas
 */
function criarColunas(
  onEdit: (conta: PlanoContaComPai) => void,
  onToggleStatus: (conta: PlanoContaComPai) => void
): ColumnDef<PlanoContaComPai>[] {
  return [
    {
      accessorKey: 'codigo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Código" />
        </div>
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left' as const, headerLabel: 'Código' },
      cell: ({ row }) => (
        <div className="flex items-center justify-start font-mono text-sm">
          {row.getValue('codigo')}
        </div>
      ),
    },
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 300,
      meta: { align: 'left' as const, headerLabel: 'Nome' },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="flex flex-col justify-center">
            <span className="text-sm">{conta.nome}</span>
            {conta.contaPai && (
              <span className="text-xs text-muted-foreground">
                Pai: {conta.contaPai.codigo} - {conta.contaPai.nome}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'tipoConta',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Tipo" />
        </div>
      ),
      enableSorting: true,
      size: 140,
      meta: { align: 'left' as const, headerLabel: 'Tipo' },
      cell: ({ row }) => {
        const tipo = row.getValue('tipoConta') as TipoContaContabil;
        const variant = TIPO_CONTA_VARIANTS[tipo];
        return (
          <div className="flex items-center justify-start">
            <Badge variant={variant}>
              {TIPO_CONTA_LABELS[tipo] || tipo || '—'}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'nivel',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nível" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'left' as const, headerLabel: 'Nível' },
      cell: ({ row }) => {
        const nivel = row.getValue('nivel') as NivelConta | undefined;
        const label = nivel ? NIVEL_LABELS[nivel] : '—';
        return (
          <div className="flex items-center justify-start">
            <Badge variant={nivel === 'sintetica' ? 'outline' : 'default'}>
              {label}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Status" />
        </div>
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'left' as const, headerLabel: 'Status' },
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="flex items-center justify-start">
            <Badge variant={ativo ? 'success' : 'outline'}>
              {ativo ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: () => (
        <div className="flex items-center justify-start">
          <div className="text-sm font-medium">Ações</div>
        </div>
      ),
      enableSorting: false,
      size: 80,
      meta: { align: 'left' as const },
      cell: ({ row }) => {
        const conta = row.original;
        return (
          <div className="flex items-center justify-start">
            <PlanoContaActions
              conta={conta}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
            />
          </div>
        );
      },
    },
  ];
}

/**
 * Componente de ações para cada conta
 */
function PlanoContaActions({
  conta,
  onEdit,
  onToggleStatus,
}: {
  conta: PlanoContaComPai;
  onEdit: (conta: PlanoContaComPai) => void;
  onToggleStatus: (conta: PlanoContaComPai) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Ações da conta</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(conta)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onToggleStatus(conta)}>
          <Power className="mr-2 h-4 w-4" />
          {conta.ativo ? 'Desativar' : 'Ativar'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function PlanoContasPage() {
  // Estados de busca e paginação
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Estados de filtros individuais
  const [tipoConta, setTipoConta] = React.useState<string>('');
  const [nivel, setNivel] = React.useState<string>('');
  const [ativo, setAtivo] = React.useState<string>('true');
  const [natureza, setNatureza] = React.useState<string>('');
  const [contaPaiId, setContaPaiId] = React.useState<string>('');

  // Estados do Data Shell
  const [table, setTable] = React.useState<TanstackTable<PlanoContaComPai> | undefined>(undefined);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // Estados de dialogs
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [selectedConta, setSelectedConta] = React.useState<PlanoContaComPai | null>(null);

  // Debounce da busca
  const buscaDebounced = useDebounce(globalFilter, 500);

  // Preparar filtros para API
  const filtros = React.useMemo<PlanoContasFilters>(() => {
    const filters: PlanoContasFilters = {};

    if (tipoConta) filters.tipoConta = tipoConta as TipoContaContabil;
    if (nivel) filters.nivel = nivel as NivelConta;
    if (ativo !== '') filters.ativo = ativo === 'true';

    return filters;
  }, [tipoConta, nivel, ativo]);

  // Parâmetros para buscar plano de contas
  const params = React.useMemo(
    () => ({
      pagina: pageIndex + 1, // API usa 1-indexed
      limite: pageSize,
      busca: buscaDebounced || undefined,
      ...filtros,
      contaPaiId: contaPaiId ? Number(contaPaiId) : undefined,
    }),
    [pageIndex, pageSize, buscaDebounced, filtros, contaPaiId]
  );

  const { planoContas, paginacao, isLoading, error, mutate } = usePlanoContas(params);

  // Função para atualizar após operações
  const refetch = React.useCallback(() => {
    mutate();
  }, [mutate]);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEdit = React.useCallback((conta: PlanoContaComPai) => {
    setSelectedConta(conta);
    setEditOpen(true);
  }, []);

  const handleToggleStatus = React.useCallback(
    async (conta: PlanoContaComPai) => {
      try {
        const result = await actionAtualizarConta({ id: conta.id, ativo: !conta.ativo });

        if (!result.success) {
          throw new Error(result.error || 'Erro ao alterar status');
        }

        toast.success(conta.ativo ? 'Conta desativada com sucesso!' : 'Conta ativada com sucesso!');
        refetch();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao alterar status';
        toast.error(message);
      }
    },
    [refetch]
  );

  const handleExport = React.useCallback(
    async (format: 'csv' | 'xlsx' | 'json') => {
      if (!table) return;

      try {
        const rows = table.getFilteredRowModel().rows;

        if (rows.length === 0) {
          toast.warning('Nenhum dado para exportar.');
          return;
        }

        const data = rows.map((row) => {
          const item = row.original;
          return {
            'Código': item.codigo,
            'Nome': item.nome,
            'Tipo': TIPO_CONTA_LABELS[item.tipo] || item.tipo,
            'Nível': NIVEL_LABELS[item.nivel] || item.nivel,
            'Natureza': NATUREZA_LABELS[item.natureza] || item.natureza,
            'Conta Pai': item.nomePai || '',
            'Status': item.ativo ? 'Ativo' : 'Inativo',
          };
        });

        const filename = 'plano-contas';

        if (format === 'json') {
          const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
            JSON.stringify(data, null, 2)
          )}`;
          const link = document.createElement('a');
          link.href = jsonString;
          link.download = `${filename}.json`;
          link.click();
          toast.success('Exportação concluída!');
          return;
        }

        if (format === 'csv') {
          const Papa = (await import('papaparse')).default;
          const csv = Papa.unparse(data);
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('Exportação concluída!');
          return;
        }

        if (format === 'xlsx') {
          const exceljsModule = await import('exceljs/dist/exceljs.min.js');
          const ExcelJS = (exceljsModule as unknown as { default: typeof import('exceljs') }).default;

          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Plano de Contas');

          // Configurar colunas
          const columns = Object.keys(data[0]);
          worksheet.columns = columns.map(col => ({ header: col, key: col, width: 20 }));

          // Adicionar dados
          worksheet.addRows(data);

          // Estilizar cabeçalho
          worksheet.getRow(1).font = { bold: true };

          const buffer = await workbook.xlsx.writeBuffer();
          const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.xlsx`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success('Exportação concluída!');
        }
      } catch (error) {
        console.error('Erro na exportação:', error);
        toast.error('Erro ao exportar dados.');
      }
    },
    [table]
  );

  const colunas = React.useMemo(
    () => criarColunas(handleEdit, handleToggleStatus),
    [handleEdit, handleToggleStatus]
  );

  return (
    <PageShell>
      <DataShell
        header={
          <DataTableToolbar
            table={table}
            title="Plano de Contas"
            density={density}
            onDensityChange={setDensity}
            searchValue={globalFilter}
            onSearchValueChange={(value) => {
              setGlobalFilter(value);
              setPageIndex(0);
            }}
            searchPlaceholder="Buscar por código ou nome..."
            actionButton={{
              label: 'Nova Conta',
              onClick: () => setCreateOpen(true),
            }}
            onExport={handleExport}
            filtersSlot={
              <>
                {/* Filtros primários (3) */}
                <FilterPopover
                  label="Tipo de Conta"
                  options={[
                    { value: 'ativo', label: 'Ativo' },
                    { value: 'passivo', label: 'Passivo' },
                    { value: 'receita', label: 'Receita' },
                    { value: 'despesa', label: 'Despesa' },
                    { value: 'patrimonio_liquido', label: 'Patrimônio Líquido' },
                  ]}
                  value={tipoConta}
                  onValueChange={(val) => {
                    setTipoConta(val === 'all' ? '' : val);
                    setPageIndex(0);
                  }}
                  defaultValue=""
                />
                <FilterPopover
                  label="Nível"
                  options={[
                    { value: 'sintetica', label: 'Sintética' },
                    { value: 'analitica', label: 'Analítica' },
                  ]}
                  value={nivel}
                  onValueChange={(val) => {
                    setNivel(val === 'all' ? '' : val);
                    setPageIndex(0);
                  }}
                  defaultValue=""
                />
                <FilterPopover
                  label="Status"
                  options={[
                    { value: 'true', label: 'Ativo' },
                    { value: 'false', label: 'Inativo' },
                  ]}
                  value={ativo}
                  onValueChange={(val) => {
                    setAtivo(val === 'all' ? '' : val);
                    setPageIndex(0);
                  }}
                  defaultValue="true"
                />

                {/* Filtros avançados (dropdown) */}
                <MaisFiltrosPlanoContasPopover
                  natureza={natureza}
                  onNaturezaChange={(val) => {
                    setNatureza(val);
                    setPageIndex(0);
                  }}
                  naturezaOptions={[
                    { value: 'devedora', label: 'Devedora' },
                    { value: 'credora', label: 'Credora' },
                  ]}
                  contaPaiId={contaPaiId}
                  onContaPaiIdChange={(val) => {
                    setContaPaiId(val);
                    setPageIndex(0);
                  }}
                />
              </>
            }
          />
        }
        footer={
          paginacao ? (
            <DataPagination
              pageIndex={paginacao.pagina - 1}
              pageSize={paginacao.limite}
              total={paginacao.total}
              totalPages={paginacao.totalPaginas}
              onPageChange={setPageIndex}
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={planoContas}
          columns={colunas}
          pagination={
            paginacao
              ? {
                pageIndex: paginacao.pagina - 1, // Converter para 0-indexed
                pageSize: paginacao.limite,
                total: paginacao.total,
                totalPages: paginacao.totalPaginas,
                onPageChange: setPageIndex,
                onPageSizeChange: setPageSize,
              }
              : undefined
          }
          sorting={undefined}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<PlanoContaComPai>)}
          emptyMessage="Nenhuma conta encontrada."
          hidePagination={true}
        />
      </DataShell>

      {/* Dialog para criação */}
      <PlanoContaCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />

      {/* Dialog para edição */}
      {selectedConta && (
        <PlanoContaEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          onSuccess={handleCreateSuccess}
          conta={selectedConta}
        />
      )}
    </PageShell>
  );
}
