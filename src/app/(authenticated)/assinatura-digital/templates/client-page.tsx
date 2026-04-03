"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { listarTemplatesAction } from '../feature/actions';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissoes } from '@/providers/user-provider';
import { DataTable, DataShell, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pencil, Copy, Trash2, Download } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ButtonGroup } from '@/components/ui/button-group';
import { FilterPopover } from '@/app/(authenticated)/partes';
import {
  formatFileSize,
  formatTemplateStatus,
  getStatusBadgeVariant,
  truncateText,
  getTemplateDisplayName,
  type Template,
  type TipoTemplate,
} from '../feature';
import { TemplateCreateDialog } from '../feature';
import { TemplateDuplicateDialog } from './components/template-duplicate-dialog';
import { TemplateDeleteDialog } from './components/template-delete-dialog';
import type { TemplatesFilters } from './components/template-filters';

// Hook para buscar templates
function useTemplates(params: {
  pagina: number;
  limite: number;
  busca?: string;
  ativo?: boolean;
  tipo_template?: TipoTemplate;
}) {
  const [data, setData] = React.useState<{
    templates: Template[];
    total: number;
    isLoading: boolean;
    error: string | null;
  }>({
    templates: [],
    total: 0,
    isLoading: false,
    error: null,
  });

  const fetchTemplates = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await listarTemplatesAction({
        ativo: params.ativo,
        tipo_template: params.tipo_template,
      });

      if (!response.success) {
        throw new Error('error' in response ? response.error : 'Erro ao carregar templates');
      }

      // TODO: Implementar paginação e busca no server action, por enquanto simulando
      let filteredTemplates = 'data' in response ? (response.data || []) : [];
      if (params.busca) {
        const lowerCaseBusca = params.busca.toLowerCase();
        filteredTemplates = filteredTemplates.filter((t: Template) =>
          t.nome.toLowerCase().includes(lowerCaseBusca) ||
          (t.descricao && t.descricao.toLowerCase().includes(lowerCaseBusca))
        );
      }

      const totalFiltered = filteredTemplates.length;
      const startIndex = (params.pagina - 1) * params.limite;
      const endIndex = startIndex + params.limite;
      const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

      setData({ templates: paginatedTemplates, total: totalFiltered, isLoading: false, error: null });
    } catch (err) {
      setData({
        templates: [],
        total: 0,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, [params.ativo, params.busca, params.limite, params.pagina, params.tipo_template]);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { ...data, refetch: fetchTemplates };
}

// Define as colunas da tabela
function criarColunas(
  onEdit: (template: Template) => void,
  onDuplicate: (template: Template) => void,
  onDelete: (template: Template) => void,
  canEdit: boolean,
  canCreate: boolean,
  canDelete: boolean
): ColumnDef<Template>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Nome" />
        </div>
      ),
      enableSorting: true,
      size: 250,
      meta: { align: 'left', headerLabel: 'Nome' },
      cell: ({ row }) => {
        const template = row.original;
        const displayName = getTemplateDisplayName(template);
        return (
          <div className="min-h-10 flex items-center justify-start text-sm gap-2">
            <span>{displayName}</span>
            {template.tipo_template === 'pdf' && !template.pdf_url && !template.arquivo_original && (
              <Badge variant="outline" className="text-xs">
                Sem PDF
              </Badge>
            )}
            {template.tipo_template === 'markdown' && (
              <Badge variant="secondary" className="text-xs">
                Markdown
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => (
        <div className="flex items-center justify-start">
          <DataTableColumnHeader column={column} title="Descrição" />
        </div>
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left', headerLabel: 'Descrição' },
      cell: ({ row }) => {
        const descricao = row.getValue('descricao') as string | null;
        const truncated = truncateText(descricao || '', 50);
        return (
          <div className="min-h-10 flex items-center justify-start text-sm">
            {truncated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-45">{truncated}</span>
                </TooltipTrigger>
                <TooltipContent>
                  {descricao}
                </TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'tipo_template',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tipo" />
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'left', headerLabel: 'Tipo' },
      cell: ({ row }) => {
        const tipo = row.getValue('tipo_template') as TipoTemplate;
        return (
          <div className="flex items-center text-sm capitalize">
            {tipo === 'pdf' ? 'PDF' : 'Markdown'}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left', headerLabel: 'Status' },
      cell: ({ row }) => {
        const status = row.getValue('status') as 'ativo' | 'inativo' | 'rascunho';
        return (
          <div className="flex items-center">
            <Badge variant={getStatusBadgeVariant(status)} className="capitalize">
              {formatTemplateStatus(status)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: 'versao',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Versão" />
      ),
      enableSorting: true,
      size: 100,
      meta: { align: 'left', headerLabel: 'Versão' },
      cell: ({ row }) => (
        <div className="flex items-center text-sm">
          v{row.getValue('versao')}
        </div>
      ),
    },
    {
      accessorKey: 'arquivo_tamanho',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tamanho" />
      ),
      enableSorting: true,
      size: 120,
      meta: { align: 'left', headerLabel: 'Tamanho' },
      cell: ({ row }) => {
        const tamanho = row.original.arquivo_tamanho as number | undefined;
        return (
          <div className="flex items-center text-sm">
            {formatFileSize(tamanho || 0)}
          </div>
        );
      },
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      size: 120,
      enableHiding: false,
      meta: { align: 'left', headerLabel: 'Ações' },
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex items-center">
            <TemplateActions
              template={template}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              canEdit={canEdit}
              canCreate={canCreate}
              canDelete={canDelete}
            />
          </div>
        );
      },
    },
  ];
}

// Componente de ações para cada template
function TemplateActions({
  template,
  onEdit,
  onDuplicate,
  onDelete,
  canEdit,
  canCreate,
  canDelete,
}: {
  template: Template;
  onEdit: (template: Template) => void;
  onDuplicate: (template: Template) => void;
  onDelete: (template: Template) => void;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}) {
  return (
    <ButtonGroup>
      {canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(template)}>
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar template</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
      {canCreate && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDuplicate(template)}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Duplicar template</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar</TooltipContent>
        </Tooltip>
      )}
      {canDelete && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(template)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Deletar template</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deletar</TooltipContent>
        </Tooltip>
      )}
    </ButtonGroup>
  );
}

export function TemplatesClient() {
  const router = useRouter();
  const [table, setTable] = React.useState<TanstackTable<Template> | null>(null);
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<TemplatesFilters>({});
  const [createOpen, setCreateOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);
  const [selectedTemplates, setSelectedTemplates] = React.useState<Template[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  const { temPermissao } = usePermissoes();
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(() => {
    return {
      pagina: pagina + 1, // API usa 1-indexed
      limite,
      busca: buscaDebounced || undefined,
      ativo: filtros.ativo,
      tipo_template: filtros.tipo_template,
    };
  }, [pagina, limite, buscaDebounced, filtros.ativo, filtros.tipo_template]);

  const { templates, total, isLoading, error, refetch } = useTemplates(params);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  const handleEdit = React.useCallback((template: Template) => {
    if (template.tipo_template === 'markdown') {
      router.push(`/assinatura-digital/templates/${template.id}/edit/markdown`);
    } else {
      router.push(`/assinatura-digital/templates/${template.id}/edit`);
    }
  }, [router]);

  const handleDuplicate = React.useCallback((template: Template) => {
    setSelectedTemplate(template);
    setDuplicateOpen(true);
  }, []);

  const handleDelete = React.useCallback((template: Template) => {
    setSelectedTemplates([template]);
    setDeleteOpen(true);
  }, []);

  const handleBulkDelete = React.useCallback(() => {
    const selected = Object.keys(rowSelection).map(id => templates.find(t => t.id.toString() === id)).filter(Boolean) as Template[];
    setSelectedTemplates(selected);
    setDeleteOpen(true);
  }, [rowSelection, templates]);

  const handleExportCSV = React.useCallback(() => {
    const selected = Object.keys(rowSelection).length > 0
      ? Object.keys(rowSelection).map(id => templates.find(t => t.id.toString() === id)).filter(Boolean) as Template[]
      : templates;

    const csv = [
      ['Nome', 'Descrição', 'Tipo', 'Status', 'Versão', 'Tamanho', 'UUID'].join(','),
      ...selected.map(t => [
        `"${t.nome}"`,
        `"${t.descricao || ''}"`,
        t.tipo_template,
        t.status,
        t.versao,
        t.arquivo_tamanho,
        (t as Template & { template_uuid?: string }).template_uuid || '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'templates.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [rowSelection, templates]);

  const handleDuplicateSuccess = React.useCallback(() => {
    refetch();
    setDuplicateOpen(false);
    setSelectedTemplate(null);
  }, [refetch]);

  const handleDeleteSuccess = React.useCallback(() => {
    refetch();
    setDeleteOpen(false);
    setSelectedTemplates([]);
    setRowSelection({});
  }, [refetch]);



  // Handlers para filtros (FilterPopover usa 'all' como default para "sem filtro")
  const [ativoFilter, setAtivoFilter] = React.useState<string>('all');
  const [tipoFilter, setTipoFilter] = React.useState<string>('all');

  const handleAtivoFilterChange = React.useCallback((value: string) => {
    setAtivoFilter(value);
    const ativo = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, ativo }));
    setPagina(0);
  }, []);

  const handleTipoTemplateFilterChange = React.useCallback((value: string) => {
    setTipoFilter(value);
    const tipo_template = value === 'all' ? undefined : value as TipoTemplate;
    setFiltros(prev => ({ ...prev, tipo_template }));
    setPagina(0);
  }, []);

  const colunas = React.useMemo(() => criarColunas(handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete), [handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete]);

  const bulkActions = React.useMemo(() => {
    const selectedCount = Object.keys(rowSelection).length;
    if (selectedCount === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        )}
      </div>
    );
  }, [rowSelection, handleExportCSV, handleBulkDelete, canDelete]);

  return (
    <>
      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar templates:</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              title="Templates"
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPagina(0);
              }}
              searchPlaceholder="Buscar por nome, UUID ou descrição..."
              actionButton={canCreate ? {
                label: 'Novo Template',
                onClick: () => setCreateOpen(true),
              } : undefined}
              filtersSlot={
                <>
                  <FilterPopover
                    label="Disponível"
                    options={[
                      { value: 'true', label: 'Ativo' },
                      { value: 'false', label: 'Inativo' },
                    ]}
                    value={ativoFilter}
                    onValueChange={handleAtivoFilterChange}
                  />

                  <FilterPopover
                    label="Tipo"
                    options={[
                      { value: 'pdf', label: 'PDF' },
                      { value: 'markdown', label: 'Markdown' },
                    ]}
                    value={tipoFilter}
                    onValueChange={handleTipoTemplateFilterChange}
                  />

                  {bulkActions}
                </>
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          total > 0 ? (
            <DataPagination
              pageIndex={pagina}
              pageSize={limite}
              total={total}
              totalPages={Math.ceil(total / limite)}
              onPageChange={setPagina}
              onPageSizeChange={setLimite}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={templates}
          columns={colunas}
          pagination={{
            pageIndex: pagina,
            pageSize: limite,
            total,
            totalPages: Math.ceil(total / limite),
            onPageChange: setPagina,
            onPageSizeChange: setLimite,
          }}
          sorting={undefined}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => row.id.toString(),
          }}
          density={density}
          isLoading={isLoading}
          error={null}
          emptyMessage="Nenhum template encontrado."
          onRowClick={(row) => handleEdit(row)}
          onTableReady={(t) => {
            const tableInstance = t as TanstackTable<Template>;
            setTable(tableInstance);
          }}
          hidePagination
        />
      </DataShell>

      <TemplateCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        initialTipoTemplate="markdown"
      />

      {selectedTemplate && (
        <TemplateDuplicateDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          template={selectedTemplate}
          onSuccess={handleDuplicateSuccess}
        />
      )}

      <TemplateDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        templates={selectedTemplates}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}

