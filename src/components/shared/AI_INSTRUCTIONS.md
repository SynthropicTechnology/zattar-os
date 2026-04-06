# Instruções para Agentes de IA - Componentes Compartilhados

## LEITURA OBRIGATÓRIA

Este documento contém os padrões obrigatórios para construir páginas no Sinesys.
Agentes de IA **DEVEM** seguir estes padrões exatamente.

---

## 🚨 SYSTEM DESIGN MANDATÓRIO: "NEON MAGISTRATE" (Glass Briefing)

**O Zattar OS (Sinesys) evoluiu seu padrão arquitetural para o "Neon Magistrate". O uso isolado e simplório das classes nativas do Shadcn (ex: `bg-card border-border/20`) em Dashboards, Painéis Hero ou Módulos Principais ESTÁ DEPRECADO.**

Você **SEMPRE** deve priorizar a injeção do pacote de primitivas avançadas (Glass Effects, Micro-tipografia) implementadas atualmente nos módulos mais densos.

### Regras do Neon Magistrate
1. **Painéis Principais e Cards (Glass Effects):** Não utilize `<div className="bg-card">`. Utilize o componente central `<GlassPanel depth={1 | 2 | 3}>` de `@/components/shared/glass-panel`.
2. **Ambiente Glow / Blur:** Para componentes Hero, injetar luzes de fundo atmosféricas atrás do conteúdo: `<div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />`
3. **Indicadores Numéricos Dinâmicos:** Ao exibir números chave ou estatísticas numéricas principais, **NÃO** exiba plain text estático. Encape-os dentro de `<AnimatedNumber value={value} />` (originário de `@/app/(authenticated)/dashboard/mock/widgets/primitives`).
4. **Resumos Analíticos (Tendências):** Qualquer métrica de dashboard orientada a variação ou tempo requer o componente de suporte `<Sparkline data={trendArray} />`.
5. **Micro-Tipografia de Alta Definição:** Use fontes customizadas `font-display` para manchetes e números. Para legendas diminutas e sub-itens não adote `text-xs`. Utilize micro-tipografias manuais tailwind: `text-[9px]`, `text-[10px]` com `font-medium uppercase tracking-wider text-muted-foreground/60`.
6. **Tokens Geométricos Uniformes:** Troque utilitários tailwind antigos como `w-4 h-4` pela sintaxe moderna aglutinada `size-4`, e para ícones encapsulados utilize `size-8 rounded-lg bg-primary/8 text-primary flex items-center justify-center`.

Qualquer refatoração requer obrigatoriamente a atualização dos componentes para esta diretriz de estado da arte.

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

Sistema de compound components para painéis laterais de detalhes. Fornece layout,
estados (loading/error/empty) e sub-componentes para composição livre.

### Componentes Disponíveis

| Componente | Uso |
|------------|-----|
| `DetailSheet` | Container raiz (gerencia Sheet + estados) |
| `DetailSheetHeader` | Header com border-b |
| `DetailSheetTitle` | Título com suporte a `badge` lateral |
| `DetailSheetDescription` | Metadados abaixo do título |
| `DetailSheetActions` | Botões de ação no header |
| `DetailSheetContent` | Área scrollável (flex-1 overflow-y-auto) |
| `DetailSheetSection` | Card com ícone + título + `action` opcional |
| `DetailSheetInfoRow` | Par label:valor |
| `DetailSheetMetaGrid` | Grid 2-3 colunas para metadados |
| `DetailSheetMetaItem` | Item do MetaGrid (label uppercase + valor) |
| `DetailSheetSeparator` | Separador entre conteúdos de uma Section |
| `DetailSheetAudit` | Timestamps criação/atualização |
| `DetailSheetFooter` | Footer com border-t |
| `DetailSheetEmpty` | Estado vazio com ícone + título + descrição |

### Exemplo Completo

```tsx
import {
  DetailSheet,
  DetailSheetHeader,
  DetailSheetTitle,
  DetailSheetDescription,
  DetailSheetContent,
  DetailSheetSection,
  DetailSheetInfoRow,
  DetailSheetSeparator,
  DetailSheetMetaGrid,
  DetailSheetMetaItem,
  DetailSheetAudit,
  DetailSheetFooter,
  DetailSheetEmpty,
} from '@/components/shared/detail-sheet';
import { Button } from '@/components/ui/button';
import { CalendarDays, ClipboardList, User } from 'lucide-react';

export function EntidadeDetailSheet({ open, onOpenChange, entidade, isLoading, error }) {
  // Sem dados e sem loading/error → estado vazio
  if (!entidade && !isLoading && !error) {
    return (
      <DetailSheet open={open} onOpenChange={onOpenChange}>
        <DetailSheetHeader>
          <DetailSheetTitle>Entidade</DetailSheetTitle>
        </DetailSheetHeader>
        <DetailSheetEmpty title="Não encontrada" description="Detalhes indisponíveis." />
        <DetailSheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DetailSheetFooter>
      </DetailSheet>
    );
  }

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      loading={isLoading}    // Exibe skeleton automaticamente
      error={error}          // Exibe estado de erro automaticamente
    >
      <DetailSheetHeader>
        <DetailSheetTitle badge={<Badge>Ativo</Badge>}>
          {entidade.nome}
        </DetailSheetTitle>
        <DetailSheetDescription>
          <CalendarDays className="h-4 w-4" />
          <span>01/04/2026</span>
        </DetailSheetDescription>
      </DetailSheetHeader>

      <DetailSheetContent>
        {/* Seção com card */}
        <DetailSheetSection icon={<ClipboardList className="h-4 w-4" />} title="Dados">
          <DetailSheetInfoRow label="Nome">{entidade.nome}</DetailSheetInfoRow>
          <DetailSheetInfoRow label="CPF">{entidade.cpf}</DetailSheetInfoRow>
          <DetailSheetSeparator />
          <DetailSheetInfoRow label="E-mail">{entidade.email}</DetailSheetInfoRow>
        </DetailSheetSection>

        {/* Grid de metadados */}
        <DetailSheetMetaGrid>
          <DetailSheetMetaItem label="Status">
            <Badge>Ativo</Badge>
          </DetailSheetMetaItem>
          <DetailSheetMetaItem label="Prioridade">Alta</DetailSheetMetaItem>
          <DetailSheetMetaItem label="Prazo">01/05/2026</DetailSheetMetaItem>
        </DetailSheetMetaGrid>

        {/* Timestamps */}
        <DetailSheetAudit createdAt={entidade.createdAt} updatedAt={entidade.updatedAt} />
      </DetailSheetContent>

      <DetailSheetFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        <Button>Editar</Button>
      </DetailSheetFooter>
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

### DetailSheet (Root)

| Prop | Tipo | Descrição |
|------|------|-----------|
| `open` | `boolean` | Controle de abertura |
| `onOpenChange` | `(open) => void` | Callback de mudança |
| `children` | `ReactNode` | Compound components internos |
| `loading` | `boolean?` | Exibe skeleton automaticamente |
| `error` | `string?` | Exibe estado de erro automaticamente |
| `side` | `'left' \| 'right'` | Lado de abertura (default: right) |
| `className` | `string?` | Width customizado (default: `w-full sm:w-135 md:w-155`) |

### DetailSheetTitle

| Prop | Tipo | Descrição |
|------|------|-----------|
| `children` | `ReactNode` | Texto do título |
| `badge` | `ReactNode?` | Badge de status ao lado direito |

### DetailSheetSection

| Prop | Tipo | Descrição |
|------|------|-----------|
| `icon` | `ReactNode?` | Ícone Lucide (h-4 w-4) |
| `title` | `string` | Título da seção |
| `children` | `ReactNode` | Conteúdo da seção |
| `action` | `ReactNode?` | Ação no canto superior direito |

### DetailSheetInfoRow

| Prop | Tipo | Descrição |
|------|------|-----------|
| `label` | `string` | Label do campo |
| `children` | `ReactNode` | Valor do campo |

### DetailSheetMetaItem

| Prop | Tipo | Descrição |
|------|------|-----------|
| `label` | `string` | Label uppercase |
| `children` | `ReactNode` | Valor com ícone opcional |

### DetailSheetAudit

| Prop | Tipo | Descrição |
|------|------|-----------|
| `createdAt` | `string` | Data de criação (ISO) |
| `updatedAt` | `string?` | Data de atualização (ISO) |

### DetailSheetEmpty

| Prop | Tipo | Descrição |
|------|------|-----------|
| `title` | `string?` | Título (default: "Não encontrado") |
| `description` | `string?` | Descrição |
| `icon` | `ReactNode?` | Ícone customizado |

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
