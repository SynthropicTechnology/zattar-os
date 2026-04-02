'use client';

/**
 * Table Wrapper de Terceiros
 * Lista e gerencia terceiros vinculados aos processos (peritos, MP, assistentes, etc.)
 *
 * Implementação seguindo o padrão DataShell.
 */

import * as React from 'react';
import Link from 'next/link';
import type { Table as TanstackTable, SortingState, ColumnDef, RowSelectionState } from '@tanstack/react-table';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Eye, Pencil } from 'lucide-react';
import {
  DataShell,
  DataTable,
  DataTableToolbar,
  DataPagination,
} from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import type { Terceiro, ProcessoRelacionado } from '../../types';

// Imports da nova estrutura de features
import { useTerceiros } from '../../hooks';
import { ProcessosRelacionadosCell, CopyButton, MapButton, ContatoCell, FilterPopover, PartesSectionFilter } from '../shared';
import { TerceiroFormDialog } from './terceiro-form';
import { TerceirosBulkActionsBar, DesativarTerceirosMassaDialog } from './terceiros-bulk-actions';
import { ChatwootSyncButton } from '@/lib/chatwoot/components';
import {
  formatarCpf,
  formatarCnpj,
  formatarNome,
  formatarEnderecoCompleto,
  calcularIdade,
} from '../../utils';
import type { TerceirosFilters } from '../../types';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { getSemanticBadgeVariant, getParteTipoLabel } from '@/lib/design-system';

/**
 * Tipo estendido de terceiro com processos relacionados
 */
type TerceiroEndereco = {
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  estado_sigla?: string | null;
};

type TerceiroComProcessos = Terceiro & {
  processos_relacionados?: ProcessoRelacionado[];
  endereco?: TerceiroEndereco | null;
};

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
function formatarData(dataISO: string | null): string {
  if (!dataISO) return '';
  try {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

interface TerceiroActionsProps {
  terceiro: TerceiroComProcessos;
  onEdit: (terceiro: TerceiroComProcessos) => void;
}

function TerceiroActions({ terceiro, onEdit }: TerceiroActionsProps) {
  return (
    <ButtonGroup>
      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
        <Link href={`/app/partes/terceiros/${terceiro.id}`}>
          <Eye className="h-4 w-4" />
          <span className="sr-only">Visualizar terceiro</span>
        </Link>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(terceiro)}
      >
        <Pencil className="h-4 w-4" />
        <span className="sr-only">Editar terceiro</span>
      </Button>
    </ButtonGroup>
  );
}

export function TerceirosTableWrapper() {
  const [table, setTable] = React.useState<TanstackTable<TerceiroComProcessos> | null>(null);

  // Search & Pagination
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);

  // Filtros
  const [tipoPessoa, setTipoPessoa] = React.useState<'all' | 'pf' | 'pj'>('all');
  const [tipoParte, setTipoParte] = React.useState<string>('all');
  const [polo, setPolo] = React.useState<'all' | 'ATIVO' | 'PASSIVO'>('all');
  const [situacao, setSituacao] = React.useState<'all' | 'A' | 'I'>('all');

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Estados para diálogos
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [terceiroParaEditar, setTerceiroParaEditar] = React.useState<TerceiroComProcessos | null>(null);
  const [desativarMassaOpen, setDesativarMassaOpen] = React.useState(false);

  // Debounce da busca
  const buscaDebounced = useDebounce(busca, 500);

  const selectedIds = React.useMemo(
    () => Object.keys(rowSelection).filter((key) => rowSelection[key]).map(Number),
    [rowSelection]
  );
  const selectedCount = selectedIds.length;

  const params = React.useMemo(() => {
    const filtros: TerceirosFilters = {};
    if (tipoPessoa !== 'all') filtros.tipo_pessoa = tipoPessoa;
    if (tipoParte !== 'all') filtros.tipo_parte = tipoParte;
    if (polo !== 'all') filtros.polo = polo;
    if (situacao !== 'all') filtros.situacao = situacao;

    return {
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      incluirEndereco: true,
      incluirProcessos: true,
      ...filtros,
    };
  }, [pagina, limite, buscaDebounced, tipoPessoa, tipoParte, polo, situacao]);

  const { terceiros, paginacao, isLoading, error, refetch } = useTerceiros(params);

  const handleEdit = React.useCallback((terceiro: TerceiroComProcessos) => {
    setTerceiroParaEditar(terceiro);
    setEditOpen(true);
  }, []);

  const columns = React.useMemo<ColumnDef<TerceiroComProcessos>[]>(
    () => [
      {
        id: 'identificacao',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Identificação" />
        ),
        enableSorting: true,
        accessorKey: 'nome',
        size: 300,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          const isPF = terceiro.tipo_pessoa === 'pf';
          const documento = isPF ? formatarCpf(terceiro.cpf) : formatarCnpj(terceiro.cnpj);
          const documentoRaw = isPF ? terceiro.cpf : terceiro.cnpj;
          const dataNascimento = isPF && terceiro.data_nascimento ? terceiro.data_nascimento : null;
          const idade = calcularIdade(dataNascimento);
          const tipoParteTerceiro = terceiro.tipo_parte;

          return (
            <div className="flex flex-col items-start gap-0.5 max-w-full overflow-hidden">
              {/* Badge do tipo de parte */}
              {tipoParteTerceiro && (
                <Badge variant={getSemanticBadgeVariant('parte', tipoParteTerceiro)} className="w-fit mb-1">
                  {getParteTipoLabel(tipoParteTerceiro)}
                </Badge>
              )}
              <div className="flex items-center gap-1 max-w-full">
                <span className="text-sm font-medium wrap-break-word whitespace-normal">
                  {formatarNome(terceiro.nome)}
                </span>
                <CopyButton text={terceiro.nome} label="Copiar nome" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">
                  {documento}
                </span>
                {documentoRaw && (
                  <CopyButton text={documentoRaw} label={isPF ? 'Copiar CPF' : 'Copiar CNPJ'} />
                )}
              </div>
              {isPF && dataNascimento && (
                <span className="text-xs text-muted-foreground text-left">
                  {formatarData(dataNascimento)}
                  {idade !== null && ` - ${idade} anos`}
                </span>
              )}
            </div>
          );
        },
      },
      {
        id: 'contato',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Contato" />,
        enableSorting: false,
        size: 240,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const terceiro = row.original;
          return (
            <ContatoCell
              telefones={[
                { ddd: terceiro.ddd_celular, numero: terceiro.numero_celular },
                { ddd: terceiro.ddd_comercial, numero: terceiro.numero_comercial },
                { ddd: terceiro.ddd_residencial, numero: terceiro.numero_residencial },
              ]}
              emails={terceiro.emails}
            />
          );
        },
      },
      {
        id: 'endereco',
        header: 'Endereço',
        enableSorting: false,
        size: 280,
        meta: { align: 'left' },
        cell: ({ row }) => {
          const enderecoFormatado = formatarEnderecoCompleto(row.original.endereco);
          const hasEndereco = enderecoFormatado && enderecoFormatado !== '-';

          return (
            <div className="flex items-start gap-1 max-w-full overflow-hidden">
              <span
                className="text-sm whitespace-normal wrap-break-word flex-1"
                title={enderecoFormatado}
              >
                {enderecoFormatado || '-'}
              </span>
              {hasEndereco && (
                <>
                  <CopyButton text={enderecoFormatado} label="Copiar endereço" />
                  <MapButton address={enderecoFormatado} />
                </>
              )}
            </div>
          );
        },
      },
      {
        id: 'processos',
        header: 'Processos',
        enableSorting: false,
        meta: { align: 'left' },
        size: 200,
        cell: ({ row }) => {
          const terceiro = row.original;
          return (
            <div className="flex items-center min-w-0">
              <ProcessosRelacionadosCell
                processos={terceiro.processos_relacionados || []}
              />
            </div>
          );
        },
      },
      {
        id: 'acoes',
        header: 'Ações',
        enableSorting: false,
        meta: { align: 'left' },
        size: 120,
        cell: ({ row }) => {
          return (
            <div className="flex items-center">
              <TerceiroActions terceiro={row.original} onEdit={handleEdit} />
            </div>
          );
        },
        enableHiding: false,
      },
    ],
    [handleEdit]
  );

  const handleBulkSuccess = React.useCallback(() => {
    setRowSelection({});
    refetch();
  }, [refetch]);

  const handleCreateSuccess = React.useCallback(() => {
    setCreateOpen(false);
    refetch();
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    setEditOpen(false);
    setTerceiroParaEditar(null);
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
              title="Terceiros"
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPagina(0);
              }}
              searchPlaceholder="Buscar..."
              actionButton={{
                label: 'Novo Terceiro',
                onClick: () => setCreateOpen(true),
              }}
              actionSlot={
                <>
                  {selectedCount > 0 && (
                    <TerceirosBulkActionsBar
                      selectedCount={selectedCount}
                      onClearSelection={() => setRowSelection({})}
                      onDesativar={() => setDesativarMassaOpen(true)}
                    />
                  )}
                  <ChatwootSyncButton
                    tipoEntidade="terceiro"
                    apenasAtivos={situacao === 'A'}
                  />
                </>
              }
              filtersSlot={
                <>
                  <PartesSectionFilter currentSection="terceiros" />
                  <FilterPopover
                    label="Situação"
                    value={situacao}
                    onValueChange={(value) => {
                      setSituacao(value as 'all' | 'A' | 'I');
                      setPagina(0);
                    }}
                    options={[
                      { value: 'A', label: 'Ativo' },
                      { value: 'I', label: 'Inativo' },
                    ]}
                    defaultValue="all"
                  />
                  <FilterPopover
                    label="Tipo Pessoa"
                    value={tipoPessoa}
                    onValueChange={(value) => {
                      setTipoPessoa(value as 'all' | 'pf' | 'pj');
                      setPagina(0);
                    }}
                    options={[
                      { value: 'pf', label: 'Pessoa Física' },
                      { value: 'pj', label: 'Pessoa Jurídica' },
                    ]}
                    defaultValue="all"
                  />
                  <FilterPopover
                    label="Tipo Parte"
                    value={tipoParte}
                    onValueChange={(value) => {
                      setTipoParte(value);
                      setPagina(0);
                    }}
                    options={[
                      { value: 'PERITO', label: 'Perito' },
                      { value: 'MINISTERIO_PUBLICO', label: 'Ministério Público' },
                      { value: 'ASSISTENTE', label: 'Assistente' },
                      { value: 'TESTEMUNHA', label: 'Testemunha' },
                      { value: 'CUSTOS_LEGIS', label: 'Custos Legis' },
                      { value: 'AMICUS_CURIAE', label: 'Amicus Curiae' },
                      { value: 'OUTRO', label: 'Outro' },
                    ]}
                    defaultValue="all"
                  />
                  <FilterPopover
                    label="Polo"
                    value={polo}
                    onValueChange={(value) => {
                      setPolo(value as 'all' | 'ATIVO' | 'PASSIVO');
                      setPagina(0);
                    }}
                    options={[
                      { value: 'ATIVO', label: 'Polo Ativo' },
                      { value: 'PASSIVO', label: 'Polo Passivo' },
                    ]}
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
              pageIndex={pagina}
              pageSize={limite}
              total={total}
              totalPages={totalPages}
              onPageChange={setPagina}
              onPageSizeChange={(size) => {
                setLimite(size);
                setPagina(0);
              }}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={terceiros}
          columns={columns}
          pagination={{
            pageIndex: pagina,
            pageSize: limite,
            total,
            totalPages,
            onPageChange: setPagina,
            onPageSizeChange: setLimite,
          }}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => String(row.id),
          }}
          sorting={sorting}
          onSortingChange={setSorting}
          isLoading={isLoading}
          error={error}
          emptyMessage="Nenhum terceiro encontrado."
          onTableReady={(t) => setTable(t as TanstackTable<TerceiroComProcessos>)}
        />
      </DataShell>

      {/* Dialogs */}
      <TerceiroFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {terceiroParaEditar && (
        <TerceiroFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setTerceiroParaEditar(null);
          }}
          terceiro={terceiroParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}

      <DesativarTerceirosMassaDialog
        open={desativarMassaOpen}
        onOpenChange={setDesativarMassaOpen}
        selectedIds={selectedIds}
        onSuccess={handleBulkSuccess}
      />
    </>
  );
}
