# Instruções para Agentes de IA - Componentes Compartilhados

## LEITURA OBRIGATÓRIA

Este documento contém os padrões obrigatórios para construir páginas no Sinesys.
Agentes de IA **DEVEM** seguir estes padrões exatamente.

---

## Referência Rápida: Qual Componente Usar

| Caso de Uso | Componente | Import |
|-------------|------------|--------|
| Layout de página | `PageShell` | `@/components/shared/page-shell` |
| Página com tabela | `DataShell` + `DataTable` | `@/components/shared/data-shell` |
| Toolbar da tabela | `DataTableToolbar` | `@/components/shared/data-shell` |
| Paginação da tabela | `DataPagination` | `@/components/shared/data-shell` |
| Header de coluna ordenável | `DataTableColumnHeader` | `@/components/shared/data-shell` |
| Modal de formulário | `DialogFormShell` | `@/components/shared/dialog-form-shell` |
| Painel lateral de detalhes | `DetailSheet` | `@/components/shared/detail-sheet` |
| Estado vazio | `EmptyState` | `@/components/shared/empty-state` |

---

## COMPONENTES DEPRECADOS - NÃO USAR

| Componente | Motivo | Substituição |
|------------|--------|--------------|
| `TableToolbar` | Legado | `DataTableToolbar` |
| `TableWithToolbar` | Legado | `DataShell` + `DataTable` |
| `ResponsiveTable` | Legado | `DataTable` |
| `TablePagination` diretamente | Use wrapper | `DataPagination` |

---

## PADRÃO A: Página com Tabela (OBRIGATÓRIO)

### Arquitetura

```
[Server Component - page.tsx]
        ↓ dados iniciais
[Client Component - *-table-wrapper.tsx]
        ↓ gerencia estado
[DataShell]
  ├── header → DataTableToolbar
  ├── children → DataTable
  └── footer → DataPagination
```

### Estrutura de Arquivos

```
src/app/app/[modulo]/
├── components/
│   ├── [entidade]-table-wrapper.tsx  # Client wrapper
│   └── columns.tsx                    # Definição de colunas
├── types/
│   └── index.ts                       # Tipos TypeScript
├── index.ts                           # Barrel exports
└── page.tsx                           # Server component
```

### 1. Server Component (page.tsx)

```tsx
// src/app/app/[modulo]/page.tsx
import { PageShell } from '@/components/shared/page-shell';
import { listarEntidades } from './service';
import { EntidadeTableWrapper } from './components/entidade-table-wrapper';

export default async function EntidadesPage() {
  // Busca dados no servidor
  const result = await listarEntidades({
    pagina: 1,
    limite: 50,
  });

  const entidades = result.success ? result.data.data : [];
  const pagination = result.success ? result.data.pagination : null;

  return (
    <PageShell>
      <EntidadeTableWrapper
        initialData={entidades}
        initialPagination={pagination}
      />
    </PageShell>
  );
}
```

### 2. Client Wrapper (entidade-table-wrapper.tsx)

```tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import {
  DataShell,
  DataPagination,
  DataTable,
  DataTableToolbar
} from '@/components/shared/data-shell';
import type { Table as TanstackTable } from '@tanstack/react-table';
import { getEntidadeColumns } from './columns';
import { actionListarEntidades } from '@/app/actions/[modulo]';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// =============================================================================
// TIPOS
// =============================================================================

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface EntidadeTableWrapperProps {
  initialData: Entidade[];
  initialPagination: PaginationInfo | null;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function EntidadeTableWrapper({
  initialData,
  initialPagination,
}: EntidadeTableWrapperProps) {
  const router = useRouter();

  // ---------- Estado dos Dados ----------
  const [entidades, setEntidades] = React.useState<Entidade[]>(initialData);
  const [table, setTable] = React.useState<TanstackTable<Entidade> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  // ---------- Estado de Paginação ----------
  const [pageIndex, setPageIndex] = React.useState(
    initialPagination ? initialPagination.page - 1 : 0
  );
  const [pageSize, setPageSize] = React.useState(
    initialPagination ? initialPagination.limit : 50
  );
  const [total, setTotal] = React.useState(
    initialPagination ? initialPagination.total : 0
  );
  const [totalPages, setTotalPages] = React.useState(
    initialPagination ? initialPagination.totalPages : 0
  );

  // ---------- Estado de Loading/Error ----------
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ---------- Estado de Filtros ----------
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [status, setStatus] = React.useState<'ativo' | 'inativo' | ''>('ativo');

  // ---------- Estado de Dialogs ----------
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [entidadeParaEditar, setEntidadeParaEditar] = React.useState<Entidade | null>(null);

  // Debounce da busca (500ms)
  const buscaDebounced = useDebounce(globalFilter, 500);

  // ---------- Refetch Function ----------
  const refetch = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionListarEntidades({
        pagina: pageIndex + 1,  // API usa 1-based
        limite: pageSize,
        busca: buscaDebounced || undefined,
        ativo: status === '' ? undefined : status === 'ativo',
      });

      if (result.success) {
        const data = result.data as { data: Entidade[]; pagination: PaginationInfo };
        setEntidades(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }, [pageIndex, pageSize, buscaDebounced, status]);

  // ---------- Skip First Render ----------
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch();
  }, [pageIndex, pageSize, buscaDebounced, refetch]);

  // ---------- Handlers ----------
  const handleEdit = React.useCallback((entidade: Entidade) => {
    setEntidadeParaEditar(entidade);
    setEditOpen(true);
  }, []);

  const handleDelete = React.useCallback(
    async (entidade: Entidade) => {
      setIsLoading(true);
      try {
        const result = await actionDeletarEntidade(entidade.id);
        if (!result.success) {
          setError(result.error);
          return;
        }
        await refetch();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao deletar');
      } finally {
        setIsLoading(false);
      }
    },
    [refetch, router]
  );

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
    router.refresh();
  }, [refetch, router]);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setEntidadeParaEditar(null);
    router.refresh();
  }, [refetch, router]);

  // ---------- Columns (Memoized) ----------
  const columns = React.useMemo(
    () => getEntidadeColumns(handleEdit, handleDelete),
    [handleEdit, handleDelete]
  );

  // ---------- Render ----------
  return (
    <>
      <DataShell
        actionButton={{
          label: 'Nova Entidade',
          onClick: () => setCreateOpen(true),
        }}
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={globalFilter}
              onSearchValueChange={(value) => {
                setGlobalFilter(value);
                setPageIndex(0);  // IMPORTANTE: Reset página ao buscar
              }}
              filtersSlot={
                <>
                  <Select
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val as 'ativo' | 'inativo' | '');
                      setPageIndex(0);  // IMPORTANTE: Reset página ao filtrar
                    }}
                  >
                    <SelectTrigger className="h-10 w-37.5">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
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
              onPageSizeChange={setPageSize}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={entidades}
          columns={columns}
          pagination={{
            pageIndex,
            pageSize,
            total,
            totalPages,
            onPageChange: setPageIndex,
            onPageSizeChange: setPageSize,
          }}
          isLoading={isLoading}
          error={error}
          density={density}
          onTableReady={(t) => setTable(t as TanstackTable<Entidade>)}
          emptyMessage="Nenhum item encontrado."
        />
      </DataShell>

      {/* Dialog de Criação */}
      <EntidadeFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        mode="create"
      />

      {/* Dialog de Edição */}
      {entidadeParaEditar && (
        <EntidadeFormDialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) setEntidadeParaEditar(null);
          }}
          entidade={entidadeParaEditar}
          onSuccess={handleEditSuccess}
          mode="edit"
        />
      )}
    </>
  );
}
```

### 3. Definição de Colunas (columns.tsx)

```tsx
import type { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/shared/data-shell';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';

// =============================================================================
// FACTORY FUNCTION - Recebe callbacks de ação
// =============================================================================

export function getEntidadeColumns(
  onEdit: (entidade: Entidade) => void,
  onDelete: (entidade: Entidade) => void
): ColumnDef<Entidade>[] {
  return [
    // Coluna: Nome (ordenável, alinhada à esquerda)
    {
      accessorKey: 'nome',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      meta: {
        align: 'left',
        headerLabel: 'Nome',  // Para dropdown de visibilidade
      },
      size: 280,
      enableSorting: true,
    },

    // Coluna: Status (ordenável, centralizada)
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      meta: {
        align: 'center',
        headerLabel: 'Status',
      },
      size: 120,
      cell: ({ row }) => (
        <Badge variant={row.original.ativo ? 'success' : 'secondary'}>
          {row.original.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
      enableSorting: true,
    },

    // Coluna: Valor (ordenável, alinhada à direita)
    {
      accessorKey: 'valor',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Valor" />
      ),
      meta: {
        align: 'right',
        headerLabel: 'Valor',
      },
      size: 120,
      cell: ({ row }) => formatCurrency(row.original.valor),
      enableSorting: true,
    },

    // Coluna: Ações (NÃO ordenável, NÃO ocultável)
    {
      id: 'actions',
      header: 'Ações',
      meta: { align: 'center' },
      size: 120,
      cell: ({ row }) => (
        <EntidadeActions
          entidade={row.original}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];
}

// =============================================================================
// COMPONENTE DE AÇÕES
// =============================================================================

function EntidadeActions({
  entidade,
  onEdit,
  onDelete,
}: {
  entidade: Entidade;
  onEdit: (entidade: Entidade) => void;
  onDelete: (entidade: Entidade) => void;
}) {
  return (
    <ButtonGroup>
      {/* Visualizar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/[modulo]/${entidade.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Visualizar</TooltipContent>
      </Tooltip>

      {/* Editar */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(entidade)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Editar</TooltipContent>
      </Tooltip>

      {/* Deletar */}
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Excluir</TooltipContent>
        </Tooltip>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(entidade)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ButtonGroup>
  );
}
```

---

## PADRÃO B: Dialog de Formulário (OBRIGATÓRIO)

### Uso do DialogFormShell

```tsx
import { DialogFormShell } from '@/components/shared';
import { Button } from '@/components/ui/button';

interface EntidadeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  entidade?: Entidade;
  mode: 'create' | 'edit';
}

export function EntidadeFormDialog({
  open,
  onOpenChange,
  onSuccess,
  entidade,
  mode,
}: EntidadeFormDialogProps) {
  const [isPending, setIsPending] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      // ... lógica de submit
      onSuccess?.();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'Nova Entidade' : 'Editar Entidade'}
      maxWidth="lg"  // sm | md | lg | xl | 2xl
      footer={
        <Button type="submit" form="entidade-form" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      }
    >
      <form id="entidade-form" onSubmit={handleSubmit} className="space-y-4 p-6">
        {/* Campos do formulário */}
      </form>
    </DialogFormShell>
  );
}
```

### Multi-Step Form

```tsx
<DialogFormShell
  open={open}
  onOpenChange={onOpenChange}
  title="Cadastro de Entidade"
  multiStep={{
    current: currentStep,
    total: totalSteps,
    stepTitle: stepTitles[currentStep - 1],
  }}
  footer={
    <>
      {currentStep > 1 && (
        <Button variant="outline" onClick={handlePrevious}>
          Anterior
        </Button>
      )}
      {currentStep < totalSteps ? (
        <Button onClick={handleNext}>Próximo</Button>
      ) : (
        <Button type="submit">Finalizar</Button>
      )}
    </>
  }
>
  {/* Conteúdo de cada step */}
</DialogFormShell>
```

---

## PADRÃO C: Painel de Detalhes (DetailSheet)

```tsx
import { DetailSheet } from '@/components/shared/detail-sheet';
import { Button } from '@/components/ui/button';

interface EntidadeDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entidade: Entidade | null;
}

export function EntidadeDetailSheet({
  open,
  onOpenChange,
  entidade,
}: EntidadeDetailSheetProps) {
  if (!entidade) return null;

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={entidade.nome}
      side="right"  // "left" | "right"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button>Editar</Button>
        </div>
      }
    >
      {/* Conteúdo dos detalhes */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Nome
          </label>
          <p className="text-sm">{entidade.nome}</p>
        </div>
        {/* ... mais campos */}
      </div>
    </DetailSheet>
  );
}
```

---

## Props dos Componentes

### DataShell

| Prop | Tipo | Descrição |
|------|------|-----------|
| `header` | `ReactNode` | Toolbar/filtros |
| `footer` | `ReactNode` | Paginação |
| `children` | `ReactNode` | DataTable |
| `actionButton` | `{ label, onClick, icon?, tooltip? }` | Botão de ação primária |
| `ariaLabel` | `string` | Label de acessibilidade |

### DataTableToolbar

| Prop | Tipo | Descrição |
|------|------|-----------|
| `table` | `Table<TData>` | Instância TanStack Table |
| `density` | `'compact' \| 'standard' \| 'relaxed'` | Densidade da tabela |
| `onDensityChange` | `(density) => void` | Callback de mudança |
| `searchValue` | `string` | Valor da busca (controlled) |
| `onSearchValueChange` | `(value) => void` | Callback de busca |
| `searchPlaceholder` | `string` | Placeholder do input |
| `filtersSlot` | `ReactNode` | Filtros customizados |
| `actionSlot` | `ReactNode` | Ações adicionais |
| `onExport` | `(format) => void` | Callback de exportação |

### DataTable

| Prop | Tipo | Descrição |
|------|------|-----------|
| `data` | `TData[]` | Dados da tabela |
| `columns` | `ColumnDef<TData>[]` | Definição de colunas |
| `hideTableBorder` | `boolean` | Ocultar borda da tabela (default: false) |
| `isLoading` | `boolean` | Estado de loading |
| `error` | `string \| null` | Mensagem de erro |
| `density` | `'compact' \| 'standard' \| 'relaxed'` | Densidade |
| `emptyMessage` | `string` | Mensagem quando vazio |
| `onTableReady` | `(table) => void` | Callback com instância da tabela |
| `pagination` | `PaginationProps` | Config de paginação |
| `rowSelection` | `RowSelectionProps` | Config de seleção |

### DialogFormShell

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controle de abertura |
| `onOpenChange` | `(open) => void` | Callback de mudança |
| `title` | `string` | Título do dialog |
| `description` | `string?` | Descrição opcional |
| `children` | `ReactNode` | Conteúdo do formulário |
| `footer` | `ReactNode?` | Botões de ação |
| `multiStep` | `{ current, total, stepTitle? }` | Config multi-step |
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | Largura máxima |

### DetailSheet

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controle de abertura |
| `onOpenChange` | `(open) => void` | Callback de mudança |
| `title` | `string` | Título |
| `description` | `string?` | Descrição |
| `children` | `ReactNode` | Conteúdo |
| `footer` | `ReactNode?` | Rodapé |
| `side` | `'left' \| 'right'` | Lado de abertura |

---

## Checklist de Implementação

### Página com Tabela

- [ ] Server component busca dados iniciais
- [ ] Client wrapper gerencia todo o estado
- [ ] Import de `@/components/shared/data-shell` (NÃO de `@/components/ui`)
- [ ] `DataShell` com `header`, `footer`, `children`
- [ ] `DataTableToolbar` com `table`, `density`, `searchValue`, `filtersSlot`
- [ ] `DataPagination` no footer
- [ ] `DataTable` (tabela renderiza sua própria borda)
- [ ] `onTableReady` para capturar instância
- [ ] `useDebounce` para busca
- [ ] Reset `pageIndex` ao mudar filtros
- [ ] Columns como factory function

### Dialog de Formulário

- [ ] Import de `@/components/shared/dialog-form-shell`
- [ ] Props `open`, `onOpenChange`, `title`
- [ ] `footer` com botões de ação
- [ ] Formulário com `id` para submit externo

---

## Referência de Implementação

**Arquivo gold standard:**
```
src/app/app/partes/components/clientes/clientes-table-wrapper.tsx
```

Use este arquivo como referência para qualquer implementação de página com tabela.
