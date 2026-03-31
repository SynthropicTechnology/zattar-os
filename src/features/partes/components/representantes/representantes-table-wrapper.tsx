'use client';

/**
 * Table Wrapper de Representantes
 * Lista e gerencia representantes legais (advogados)
 *
 * NOTA: Representantes são sempre advogados (pessoas físicas) com CPF.
 * O modelo foi deduplicado - um registro por CPF, vínculos via processo_partes.
 *
 * Implementação seguindo o padrão DataShell.
 */

import * as React from 'react';
import Link from 'next/link';
import type { Table as TanstackTable, ColumnDef, SortingState, RowSelectionState } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useRepresentantes } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, ContatoCell, FilterPopover, PartesSectionFilter } from '../shared';
import { RepresentanteFormDialog } from './representante-form';
import { RepresentantesBulkActionsBar, ExcluirRepresentantesMassaDialog } from './representantes-bulk-actions';
import { formatarCpf, formatarNome } from '../../utils';
import type { Representante, InscricaoOAB } from '../../types';

// UFs do Brasil
const UFS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];


/**
 * Tipo estendido de representante com processos relacionados
 */
type RepresentanteComProcessos = Representante & {
  processos_relacionados?: ProcessoRelacionado[];
};

/**
 * Formata número da OAB removendo UF do início se presente
 * Ex: "MG128404" -> "128.404"
 */
function formatarNumeroOab(numero: string): string {
  // Remove UF do início se presente
  const apenasNumeros = numero.replace(/^[A-Z]{2}/i, '').replace(/\D/g, '');
  return apenasNumeros.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Retorna o label e a cor do tone para a situação da OAB
 */
function obterSituacaoOab(situacao: string | null | undefined): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } {
  if (!situacao) return { label: '', tone: 'neutral' };

  switch (situacao) {
    case 'REGULAR':
      return { label: 'Regular', tone: 'success' };
    case 'SUSPENSO':
      return { label: 'Suspenso', tone: 'warning' };
    case 'CANCELADO':
      return { label: 'Cancelado', tone: 'danger' };
    case 'LICENCIADO':
      return { label: 'Licenciado', tone: 'warning' };
    case 'FALECIDO':
      return { label: 'Falecido', tone: 'neutral' };
    default:
      return { label: situacao, tone: 'neutral' };
  }
}

/**
 * Badge composto para OAB + Situação
 * Metade esquerda em azul (OAB), metade direita na cor da situação
 */
function OabSituacaoBadge({
  numero,
  uf,
  situacao,
}: {
  numero: string;
  uf: string;
  situacao: string | null;
}) {
  const numeroFormatado = formatarNumeroOab(numero);
  const { label: situacaoLabel, tone: situacaoTone } = obterSituacaoOab(situacao);

  // Classes para cada tone
  const toneClasses = {
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-destructive/15 text-destructive',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="inline-flex items-center text-xs font-medium rounded-full overflow-hidden shrink-0">
      {/* Lado esquerdo: OAB (azul/info) */}
      <span className="bg-info/15 text-info px-2 py-0.5">
        {numeroFormatado} OAB-{uf}
      </span>
      {/* Separador e lado direito: Situação */}
      {situacaoLabel && (
        <span className={cn('px-2 py-0.5 border-l border-background/50', toneClasses[situacaoTone])}>
          {situacaoLabel}
        </span>
      )}
    </div>
  );
}

/**
 * Componente para exibir múltiplas OABs
 */
function OabsBadges({ oabs }: { oabs: InscricaoOAB[] }) {
  if (!oabs || oabs.length === 0) return null;

  // Mostrar até 2 OABs na listagem, com indicador de +N se houver mais
  const oabsVisiveis = oabs.slice(0, 2);
  const oabsRestantes = oabs.length - 2;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {oabsVisiveis.map((oab, index) => (
        <OabSituacaoBadge
          key={index}
          numero={oab.numero}
          uf={oab.uf}
          situacao={oab.situacao}
        />
      ))}
      {oabsRestantes > 0 && (
        <span className="text-xs text-muted-foreground">+{oabsRestantes}</span>
      )}
    </div>
  );
}


/**
 * Componente de ações para cada representante
 */
interface RepresentanteActionsProps {
  representante: Representante;
  onEdit: (representante: Representante) => void;
}

function RepresentanteActions({
  representante,
  onEdit,
}: RepresentanteActionsProps) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/app/partes/representantes/${representante.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar representante</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(representante)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar representante</span>
      </Button>
    </ButtonGroup>
  );
}

export function RepresentantesTableWrapper() {
  const [table, setTable] = React.useState<TanstackTable<RepresentanteComProcessos> | null>(null);

  // Pagination
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(50);

  // Search & Filters
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [ufOab, setUfOab] = React.useState<string>('all');

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const [excluirMassaOpen, setExcluirMassaOpen] = React.useState(false);

  // Dialog state
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [representanteParaEditar, setRepresentanteParaEditar] = React.useState<RepresentanteComProcessos | null>(null);

  const buscaDebounced = useDebounce(globalFilter, 500);

  // Parâmetros para buscar representantes
  const params = React.useMemo(() => {
    return {
      pagina: pageIndex + 1, // API usa 1-indexed
      limite: pageSize,
      busca: buscaDebounced || undefined,
      uf_oab: ufOab !== 'all' ? ufOab : undefined,
      incluirProcessos: true, // Incluir processos relacionados
    };
  }, [pageIndex, pageSize, buscaDebounced, ufOab]);

  const { representantes, paginacao, isLoading, error, refetch } = useRepresentantes(params);

  const selectedIds = React.useMemo(
    () => Object.keys(rowSelection).filter((key) => rowSelection[key]).map(Number),
    [rowSelection]
  );
  const selectedCount = selectedIds.length;

  const handleBulkSuccess = React.useCallback(() => {
    setRowSelection({});
    refetch();
  }, [refetch]);

  const handleEdit = React.useCallback((representante: RepresentanteComProcessos) => {
    setRepresentanteParaEditar(representante);
    setEditOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<RepresentanteComProcessos>[]>(
    () => [
      // Coluna composta: Representante (Badge OAB+Situação | Nome | CPF)
      {
        id: 'representante',
        accessorKey: 'nome',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Representante" />
        ),
        enableSorting: true,
        size: 360,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const representante = row.original;
          const nome = formatarNome(representante.nome);
          const cpf = representante.cpf ? formatarCpf(representante.cpf) : null;
          const cpfRaw = representante.cpf;

          return (
            <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
              {/* Linha 1: Badges de OABs */}
              {representante.oabs && representante.oabs.length > 0 && (
                <div className="mb-1">
                  <OabsBadges oabs={representante.oabs} />
                </div>
              )}
              {/* Linha 2: Nome */}
              <div className="flex items-center gap-1">
                <span className="font-medium text-sm" title={nome}>
                  {nome}
                </span>
                <CopyButton text={representante.nome} label="Copiar nome" />
              </div>
              {/* Linha 3: CPF */}
              {cpf && (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{cpf}</span>
                  {cpfRaw && <CopyButton text={cpfRaw} label="Copiar CPF" />}
                </div>
              )}
            </div>
          );
        },
      },
      // Coluna composta: Contato (Telefone + E-mail)
      {
        id: 'contato',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
        enableSorting: false,
        size: 280,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const rep = row.original;
          return (
            <ContatoCell
              telefones={[
                { ddd: rep.ddd_celular, numero: rep.numero_celular },
                { ddd: rep.ddd_comercial, numero: rep.numero_comercial },
                { ddd: rep.ddd_residencial, numero: rep.numero_residencial },
              ]}
              email={rep.email}
              emails={rep.emails}
            />
          );
        },
      },
      // Processos relacionados
      {
        id: 'processos',
        header: 'Processos',
        enableSorting: false,
        meta: { align: 'left' },
        size: 200,
        cell: ({ row }) => {
          const representante = row.original;
          return (
            <div className="flex items-center min-w-0">
              <ProcessosRelacionadosCell processos={representante.processos_relacionados || []} />
            </div>
          );
        },
      },
      // Ações
      {
        id: 'acoes',
        header: 'Ações',
        enableSorting: false,
        meta: { align: 'left' },
        size: 120,
        cell: ({ row }) => {
          const representante = row.original;
          return (
            <div className="flex items-center">
              <RepresentanteActions representante={representante} onEdit={handleEdit} />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [handleEdit]
  );

  const handleCreateSuccess = React.useCallback(() => {
    setCreateOpen(false);
    refetch();
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    setRepresentanteParaEditar(null);
    refetch();
  }, [refetch]);

  const total = paginacao?.total ?? 0;
  const totalPages = paginacao?.totalPaginas ?? 0;

  return (
    <>
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Representantes"
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);
              }}
              searchPlaceholder="Buscar representantes..."
              actionButton={{
                label: 'Novo Representante',
                onClick: () => setCreateOpen(true),
              }}
              actionSlot={
                selectedCount > 0 ? (
                  <RepresentantesBulkActionsBar
                    selectedCount={selectedCount}
                    onClearSelection={() => setRowSelection({})}
                    onExcluir={() => setExcluirMassaOpen(true)}
                  />
                ) : undefined
              }
              filtersSlot={
                <>
                  <PartesSectionFilter currentSection="representantes" />
                  <FilterPopover
                    label="UF OAB"
                    value={ufOab}
                    onValueChange={(val) => {
                      setUfOab(val);
                      setPageIndex(0);
                    }}
                    options={UFS_BRASIL.map((uf) => ({ value: uf, label: uf }))}
                    defaultValue="all"
                  />
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          totalPages > 0 ? (
            <DataPagination
              pageIndex={pageIndex}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              onPageChange={setPageIndex}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPageIndex(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={representantes}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => String(row.id),
          }}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum representante encontrado."
          onTableReady={(t) => setTable(t as TanstackTable<RepresentanteComProcessos>)}
        />
      </DataShell>

      {/* Dialogs */}
      <RepresentanteFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {representanteParaEditar && (
        <RepresentanteFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setRepresentanteParaEditar(null);
          }}
          representante={representanteParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}

      <ExcluirRepresentantesMassaDialog
        open={excluirMassaOpen}
        onOpenChange={setExcluirMassaOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
