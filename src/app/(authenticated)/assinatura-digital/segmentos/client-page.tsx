'use client';

import * as React from 'react';
import {
  Plus,
  Tags,
  CheckCircle2,
  Clock,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-react';

import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { FilterChipMulti, type FilterChipOption } from '../components/filter-chip';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissoes } from '@/providers/user-provider';

import type { AssinaturaDigitalSegmento } from '@/shared/assinatura-digital';
import { AssinaturaDigitalPageNav } from '../components/page-nav';
import { SegmentosGlassList } from '../components/segmentos-glass-list';
import {
  SegmentoCreateDialog,
  SegmentoEditDialog,
  SegmentoDeleteDialog,
  SegmentoDuplicateDialog,
} from '../formularios/components';

// =============================================================================
// HOOK
// =============================================================================

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

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const STATUS_OPTIONS: readonly FilterChipOption[] = [
  { value: 'true', label: 'Ativos' },
  { value: 'false', label: 'Inativos' },
];

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Visualização em cartões' },
  { id: 'list', icon: List, label: 'Visualização em lista' },
];

// =============================================================================
// MAIN
// =============================================================================

export function SegmentosClient() {
  const { temPermissao } = usePermissoes();
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const { segmentos, isLoading, error, refetch } = useSegmentos();

  const [busca, setBusca] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<'cards' | 'list'>('list');

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AssinaturaDigitalSegmento | null>(null);

  const buscaDebounced = useDebounce(busca, 300);

  // Filtering
  const filtered = React.useMemo(() => {
    let result = segmentos;
    if (statusFiltro.length > 0) {
      result = result.filter((s) => statusFiltro.includes(String(s.ativo)));
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
  }, [segmentos, statusFiltro, buscaDebounced]);

  // Stats
  const stats = React.useMemo(() => ({
    total: segmentos.length,
    ativos: segmentos.filter((s) => s.ativo).length,
    inativos: segmentos.filter((s) => !s.ativo).length,
    emUso: segmentos.filter((s) => (s.formularios_count ?? 0) > 0).length,
  }), [segmentos]);

  const statCards = [
    { label: 'Total', value: stats.total, Icon: Tags, tint: 'bg-primary/8', iconColor: 'text-primary/60' },
    { label: 'Ativos', value: stats.ativos, Icon: CheckCircle2, tint: 'bg-success/10', iconColor: 'text-success/70' },
    { label: 'Inativos', value: stats.inativos, Icon: Clock, tint: 'bg-muted-foreground/8', iconColor: 'text-muted-foreground/60' },
    { label: 'Em uso', value: stats.emUso, Icon: FileText, tint: 'bg-info/10', iconColor: 'text-info/70' },
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
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="size-3.5" />
            Novo segmento
          </button>
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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChipMulti
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFiltro}
            onValueChange={setStatusFiltro}
          />
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome, slug ou descrição..."
          />
          <ViewToggle
            mode={viewMode}
            onChange={(m) => setViewMode(m as 'cards' | 'list')}
            options={VIEW_OPTIONS}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/4 px-4 py-3 text-xs text-destructive/80">
          {error}
          <Button variant="outline" size="sm" onClick={refetch} className="ml-3">
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista Glass */}
      <SegmentosGlassList
        segmentos={filtered}
        isLoading={isLoading}
        mode={viewMode}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        canEdit={canEdit}
        canCreate={canCreate}
        canDelete={canDelete}
      />

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
