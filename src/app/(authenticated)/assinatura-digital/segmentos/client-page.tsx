'use client';

import * as React from 'react';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { Plus, Pencil, Copy, Trash2, Tags, CheckCircle2, Clock, FileText } from 'lucide-react';

import { DataTable, DataShell, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FilterPopover } from '@/app/(authenticated)/partes';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissoes } from '@/providers/user-provider';
import { cn } from '@/lib/utils';

import type { AssinaturaDigitalSegmento } from '../feature';
import { AssinaturaDigitalPageNav } from '../components/page-nav';
import {
  SegmentoCreateDialog,
  SegmentoEditDialog,
  SegmentoDeleteDialog,
  SegmentoDuplicateDialog,
} from '../formularios/components';

// ─── Hook ───────────────────────────────────────────────────────────────

function useSegmentos() {
  const [data, setData] = React.useState<{
    segmentos: AssinaturaDigitalSegmento[];
    isLoading: boolean;
    error: string | null;
  }>({ segmentos: [], isLoading: false, error: null });

  const fetchSegmentos = React.useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/segmentos');
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao carregar segmentos');
      }
      setData({ segmentos: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setData({
        segmentos: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, []);

  React.useEffect(() => {
    fetchSegmentos();
  }, [fetchSegmentos]);

  return { ...data, refetch: fetchSegmentos };
}

// ─── Helpers ────────────────────────────────────────────────────────────

// Paleta derivada dos tokens --chart-1..8 do Glass Briefing.
// Hash simples por id para dar consistência visual (mesmo segmento, mesma cor).
function getSegmentoChartToken(id: number): string {
  const index = (Math.abs(id) % 8) + 1;
  return `--chart-${index}`;
}

// ─── Columns ────────────────────────────────────────────────────────────

function criarColunas(
  onEdit: (s: AssinaturaDigitalSegmento) => void,
  onDuplicate: (s: AssinaturaDigitalSegmento) => void,
  onDelete: (s: AssinaturaDigitalSegmento) => void,
  canEdit: boolean,
  canCreate: boolean,
  canDelete: boolean,
): ColumnDef<AssinaturaDigitalSegmento>[] {
  return [
    {
      accessorKey: 'nome',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nome" />,
      enableSorting: true,
      size: 240,
      meta: { align: 'left', headerLabel: 'Nome' },
      cell: ({ row }) => {
        const s = row.original;
        const token = getSegmentoChartToken(s.id);
        return (
          <div className="flex items-center gap-2.5">
            <span
              className="size-7 shrink-0 rounded-lg"
              style={{ background: `color-mix(in oklch, var(${token}) 16%, transparent)` }}
              aria-hidden="true"
            >
              <span
                className="block size-full rounded-lg"
                style={{ background: `color-mix(in oklch, var(${token}) 55%, transparent)`, mask: 'radial-gradient(circle at center, black 25%, transparent 65%)' }}
              />
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium">{s.nome}</p>
              <p className="truncate font-mono text-[10px] text-muted-foreground">{s.slug}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'descricao',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descrição" />,
      enableSorting: false,
      size: 240,
      meta: { align: 'left', headerLabel: 'Descrição' },
      cell: ({ row }) => {
        const desc = row.original.descricao;
        return desc ? (
          <span className="truncate text-sm text-muted-foreground">{desc}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: 'formularios_count',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Formulários" />,
      enableSorting: true,
      size: 120,
      meta: { align: 'left', headerLabel: 'Formulários' },
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.formularios_count ?? 0}</span>
      ),
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      enableSorting: true,
      size: 100,
      meta: { align: 'left', headerLabel: 'Status' },
      cell: ({ row }) => {
        const ativo = row.original.ativo;
        return (
          <Badge variant={ativo ? 'success' : 'secondary'}>
            {ativo ? 'Ativo' : 'Inativo'}
          </Badge>
        );
      },
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      enableHiding: false,
      size: 120,
      meta: { align: 'left', headerLabel: 'Ações' },
      cell: ({ row }) => (
        <ButtonGroup>
          {canEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Editar segmento"
                  onClick={() => onEdit(row.original)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          )}
          {canCreate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Duplicar segmento"
                  onClick={() => onDuplicate(row.original)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicar</TooltipContent>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Deletar segmento"
                  onClick={() => onDelete(row.original)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Deletar</TooltipContent>
            </Tooltip>
          )}
        </ButtonGroup>
      ),
    },
  ];
}

// ─── Segmento Card (padrão glass depth-2) ───────────────────────────────

function SegmentoCard({
  segmento,
  onEdit,
  onDelete,
}: {
  segmento: AssinaturaDigitalSegmento;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const token = getSegmentoChartToken(segmento.id);

  return (
    <GlassPanel depth={2} className={cn('cursor-pointer px-4 py-4 transition-shadow hover:shadow-md')}>
      <div className="mb-3 flex items-start justify-between">
        <IconContainer
          size="md"
          style={{ background: `color-mix(in oklch, var(${token}) 14%, transparent)` }}
        >
          <Tags className="size-4" style={{ color: `var(${token})` }} />
        </IconContainer>
        <ButtonGroup>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Editar segmento"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Deletar segmento"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </ButtonGroup>
      </div>
      <p className="font-medium">{segmento.nome}</p>
      <Text variant="meta-label" className="mt-0.5 truncate">
        {segmento.descricao || 'Sem descrição'}
      </Text>
      <div className="mt-3 flex items-center gap-4 border-t border-outline-variant pt-3">
        <div>
          <span className="font-display text-base font-bold tabular-nums">
            {segmento.formularios_count ?? 0}
          </span>
          <Text variant="meta-label" className="ml-1">
            formulário{(segmento.formularios_count ?? 0) !== 1 ? 's' : ''}
          </Text>
        </div>
        {!segmento.ativo && (
          <Badge variant="secondary" className="ml-auto">
            Inativo
          </Badge>
        )}
      </div>
    </GlassPanel>
  );
}

// ─── Main ───────────────────────────────────────────────────────────────

export function SegmentosClient() {
  const { temPermissao } = usePermissoes();
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const { segmentos, isLoading, error, refetch } = useSegmentos();

  const [busca, setBusca] = React.useState('');
  const [ativoFilter, setAtivoFilter] = React.useState<string>('all');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [table, setTable] = React.useState<TanstackTable<AssinaturaDigitalSegmento> | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AssinaturaDigitalSegmento | null>(null);

  const buscaDebounced = useDebounce(busca, 300);

  // Filtering (client-side, lista é pequena)
  const filtered = React.useMemo(() => {
    let result = segmentos;
    if (ativoFilter !== 'all') {
      const ativo = ativoFilter === 'true';
      result = result.filter((s) => s.ativo === ativo);
    }
    if (buscaDebounced) {
      const lower = buscaDebounced.toLowerCase();
      result = result.filter(
        (s) =>
          s.nome.toLowerCase().includes(lower) ||
          s.slug.toLowerCase().includes(lower) ||
          (s.descricao ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [segmentos, ativoFilter, buscaDebounced]);

  const totalPages = Math.ceil(filtered.length / limite);
  const paginated = React.useMemo(
    () => filtered.slice(pagina * limite, pagina * limite + limite),
    [filtered, pagina, limite],
  );

  // Stats
  const stats = React.useMemo(() => ({
    total: segmentos.length,
    ativos: segmentos.filter((s) => s.ativo).length,
    inativos: segmentos.filter((s) => !s.ativo).length,
    comFormularios: segmentos.filter((s) => (s.formularios_count ?? 0) > 0).length,
  }), [segmentos]);

  const statCards = [
    { label: 'Total', value: stats.total, Icon: Tags, tint: 'bg-primary/8', iconColor: 'text-primary/60' },
    { label: 'Ativos', value: stats.ativos, Icon: CheckCircle2, tint: 'bg-success/10', iconColor: 'text-success/70' },
    { label: 'Inativos', value: stats.inativos, Icon: Clock, tint: 'bg-muted-foreground/8', iconColor: 'text-muted-foreground/60' },
    { label: 'Em uso', value: stats.comFormularios, Icon: FileText, tint: 'bg-info/10', iconColor: 'text-info/70' },
  ];

  // Handlers
  const handleEdit = (s: AssinaturaDigitalSegmento) => {
    setSelected(s);
    setEditOpen(true);
  };
  const handleDuplicate = (s: AssinaturaDigitalSegmento) => {
    setSelected(s);
    setDuplicateOpen(true);
  };
  const handleDelete = (s: AssinaturaDigitalSegmento) => {
    setSelected(s);
    setDeleteOpen(true);
  };

  const colunas = React.useMemo(
    () => criarColunas(handleEdit, handleDuplicate, handleDelete, canEdit, canCreate, canDelete),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canEdit, canCreate, canDelete],
  );

  // Destaque (top 4) — segmentos ativos com mais formulários
  const destacados = React.useMemo(
    () =>
      [...segmentos]
        .filter((s) => s.ativo)
        .sort((a, b) => (b.formularios_count ?? 0) - (a.formularios_count ?? 0))
        .slice(0, 4),
    [segmentos],
  );

  return (
    <div className="space-y-5">
      <AssinaturaDigitalPageNav />

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Segmentos</Heading>
          <Text variant="meta-label" className="mt-0.5">
            {stats.total} segmento{stats.total !== 1 ? 's' : ''}
            {stats.ativos > 0 ? ` · ${stats.ativos} ativo${stats.ativos !== 1 ? 's' : ''}` : ''}
            {' · organizam formulários por área de atuação'}
          </Text>
        </div>
        {canCreate && (
          <Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Segmento
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map(({ label, value, Icon, tint, iconColor }) => (
          <GlassPanel key={label} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  {label}
                </p>
                <p className="mt-1 font-display text-xl font-bold tabular-nums leading-none">
                  {value}
                </p>
              </div>
              <IconContainer size="md" className={tint}>
                <Icon className={`size-4 ${iconColor}`} />
              </IconContainer>
            </div>
          </GlassPanel>
        ))}
      </div>

      {/* Destaques — cards visuais dos 4 mais usados */}
      {destacados.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((s) => (
            <SegmentoCard
              key={s.id}
              segmento={s}
              onEdit={() => handleEdit(s)}
              onDelete={() => handleDelete(s)}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar segmentos:</p>
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={refetch} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista completa */}
      <DataShell
        header={
          table ? (
            <DataTableToolbar
              table={table}
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPagina(0);
              }}
              searchPlaceholder="Buscar por nome, slug ou descrição..."
              filtersSlot={
                <FilterPopover
                  label="Status"
                  options={[
                    { value: 'true', label: 'Ativos' },
                    { value: 'false', label: 'Inativos' },
                  ]}
                  value={ativoFilter}
                  onValueChange={(v) => {
                    setAtivoFilter(v);
                    setPagina(0);
                  }}
                  defaultValue="all"
                />
              }
            />
          ) : (
            <div className="p-6" />
          )
        }
        footer={
          filtered.length > 0 ? (
            <DataPagination
              pageIndex={pagina}
              pageSize={limite}
              total={filtered.length}
              totalPages={totalPages}
              onPageChange={setPagina}
              onPageSizeChange={setLimite}
              isLoading={isLoading}
            />
          ) : null
        }
      >
        <DataTable
          data={paginated}
          columns={colunas}
          pagination={{
            pageIndex: pagina,
            pageSize: limite,
            total: filtered.length,
            totalPages,
            onPageChange: setPagina,
            onPageSizeChange: setLimite,
          }}
          rowSelection={{
            state: rowSelection,
            onRowSelectionChange: setRowSelection,
            getRowId: (row) => row.id.toString(),
          }}
          density={density}
          isLoading={isLoading}
          error={null}
          emptyMessage="Nenhum segmento encontrado."
          onRowClick={canEdit ? (row) => handleEdit(row) : undefined}
          onTableReady={(t) => setTable(t as TanstackTable<AssinaturaDigitalSegmento>)}
          hidePagination
        />
      </DataShell>

      {/* Dialogs */}
      <SegmentoCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          refetch();
        }}
      />

      <SegmentoEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        segmento={selected}
        onSuccess={() => {
          setEditOpen(false);
          setSelected(null);
          refetch();
        }}
      />

      {selected && (
        <SegmentoDuplicateDialog
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
          segmento={selected}
          onSuccess={() => {
            setDuplicateOpen(false);
            setSelected(null);
            refetch();
          }}
        />
      )}

      <SegmentoDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        segmentos={selected ? [selected] : []}
        onSuccess={() => {
          setDeleteOpen(false);
          setSelected(null);
          refetch();
        }}
      />
    </div>
  );
}
