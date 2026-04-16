'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  FileText,
  CheckCircle2,
  Camera,
  MapPin,
  Plus,
  LayoutGrid,
  List,
} from 'lucide-react';

import { useDebounce } from '@/hooks/use-debounce';
import { usePermissoes } from '@/providers/user-provider';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { ViewToggle, type ViewToggleOption } from '@/components/dashboard/view-toggle';
import { FilterChipMulti, type FilterChipOption } from '../components/filter-chip';

import {
  type AssinaturaDigitalFormulario,
  type AssinaturaDigitalSegmento,
  type AssinaturaDigitalTemplate,
} from '@/shared/assinatura-digital';
import { FormularioCreateDialog } from './components/formulario-create-dialog';
import { FormularioEditDialog } from './components/formulario-edit-dialog';
import { FormularioDeleteDialog } from './components/formulario-delete-dialog';
import { AssinaturaDigitalPageNav } from '../components/page-nav';
import { FormulariosGlassList } from '../components/formularios-glass-list';

// =============================================================================
// HOOKS
// =============================================================================

function useFormularios() {
  const [data, setData] = React.useState<{
    formularios: AssinaturaDigitalFormulario[];
    isLoading: boolean;
    error: string | null;
  }>({ formularios: [], isLoading: false, error: null });

  const fetchFormularios = React.useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/formularios?limite=500');
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Erro ao carregar formulários');
      }
      const list = (json?.formularios ?? json?.data ?? []) as AssinaturaDigitalFormulario[];
      setData({ formularios: list, isLoading: false, error: null });
    } catch (err) {
      setData({
        formularios: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, []);

  React.useEffect(() => {
    fetchFormularios();
  }, [fetchFormularios]);

  return { ...data, refetch: fetchFormularios };
}

function useSegmentos() {
  const [segmentos, setSegmentos] = React.useState<AssinaturaDigitalSegmento[]>([]);
  const fetchSegmentos = React.useCallback(async () => {
    try {
      const res = await fetch('/api/assinatura-digital/segmentos?ativo=true');
      const json = await res.json();
      if (res.ok && !json.error) setSegmentos(json.data || []);
    } catch {
      /* silencioso — segmentos vazios são toleráveis para o dialog */
    }
  }, []);
  React.useEffect(() => { fetchSegmentos(); }, [fetchSegmentos]);
  return { segmentos, refetch: fetchSegmentos };
}

function useTemplatesAtivos() {
  const [templates, setTemplates] = React.useState<AssinaturaDigitalTemplate[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/assinatura-digital/templates?ativo=true')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json && !json.error) setTemplates(json.data || []);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return { templates };
}

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const ATIVO_OPTIONS: readonly FilterChipOption[] = [
  { value: 'true', label: 'Ativo' },
  { value: 'false', label: 'Inativo' },
];

const FOTO_OPTIONS: readonly FilterChipOption[] = [
  { value: 'true', label: 'Captura foto' },
  { value: 'false', label: 'Sem foto' },
];

const GEO_OPTIONS: readonly FilterChipOption[] = [
  { value: 'true', label: 'Com geoloc.' },
  { value: 'false', label: 'Sem geoloc.' },
];

const VIEW_OPTIONS: ViewToggleOption[] = [
  { id: 'cards', icon: LayoutGrid, label: 'Visualização em cartões' },
  { id: 'list', icon: List, label: 'Visualização em lista' },
];

// =============================================================================
// MAIN
// =============================================================================

export function FormulariosClient() {
  const router = useRouter();
  const { temPermissao } = usePermissoes();
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const { formularios, isLoading, error, refetch } = useFormularios();
  const { segmentos } = useSegmentos();
  const { templates } = useTemplatesAtivos();

  const [busca, setBusca] = React.useState('');
  const [ativoFiltro, setAtivoFiltro] = React.useState<string[]>([]);
  const [fotoFiltro, setFotoFiltro] = React.useState<string[]>([]);
  const [geoFiltro, setGeoFiltro] = React.useState<string[]>([]);
  const [segmentoFiltro, setSegmentoFiltro] = React.useState<string[]>([]);
  const [viewMode, setViewMode] = React.useState<'cards' | 'list'>('list');

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AssinaturaDigitalFormulario | null>(null);

  const buscaDebounced = useDebounce(busca, 300);

  // Filter options dinâmicos (Segmento)
  const segmentoOptions: readonly FilterChipOption[] = React.useMemo(
    () => segmentos.map((s) => ({ value: String(s.id), label: s.nome })),
    [segmentos],
  );

  // Filtering
  const filtered = React.useMemo(() => {
    let result = formularios;
    if (ativoFiltro.length > 0) {
      result = result.filter((f) => ativoFiltro.includes(String(f.ativo)));
    }
    if (fotoFiltro.length > 0) {
      result = result.filter((f) => fotoFiltro.includes(String(f.foto_necessaria)));
    }
    if (geoFiltro.length > 0) {
      result = result.filter((f) => geoFiltro.includes(String(f.geolocation_necessaria)));
    }
    if (segmentoFiltro.length > 0) {
      result = result.filter((f) => f.segmento && segmentoFiltro.includes(String(f.segmento.id)));
    }
    if (buscaDebounced) {
      const lower = buscaDebounced.toLowerCase();
      result = result.filter(
        (f) =>
          f.nome.toLowerCase().includes(lower) ||
          (f.slug ?? '').toLowerCase().includes(lower) ||
          (f.descricao ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [formularios, ativoFiltro, fotoFiltro, geoFiltro, segmentoFiltro, buscaDebounced]);

  // Stats (dataset completo)
  const stats = React.useMemo(() => ({
    total: formularios.length,
    ativos: formularios.filter((f) => f.ativo).length,
    comFoto: formularios.filter((f) => f.foto_necessaria).length,
    comGeo: formularios.filter((f) => f.geolocation_necessaria).length,
  }), [formularios]);

  const statCards = [
    { label: 'Total', value: stats.total, Icon: FileText, tint: 'bg-primary/8', iconColor: 'text-primary/60' },
    { label: 'Ativos', value: stats.ativos, Icon: CheckCircle2, tint: 'bg-success/10', iconColor: 'text-success/70' },
    { label: 'Com foto', value: stats.comFoto, Icon: Camera, tint: 'bg-info/10', iconColor: 'text-info/70' },
    { label: 'Com geoloc.', value: stats.comGeo, Icon: MapPin, tint: 'bg-warning/12', iconColor: 'text-warning/75' },
  ];

  // Handlers
  const handleEdit = React.useCallback((f: AssinaturaDigitalFormulario) => {
    setSelected(f);
    setEditOpen(true);
  }, []);

  const handleEditSchema = React.useCallback((f: AssinaturaDigitalFormulario) => {
    router.push(`/assinatura-digital/formularios/${f.id}/schema`);
  }, [router]);

  const handleCopyLink = React.useCallback((f: AssinaturaDigitalFormulario) => {
    const segmentoSlug = f.segmento?.slug;
    if (!segmentoSlug) {
      toast.error('Segmento não encontrado para este formulário.');
      return;
    }
    const url = `${window.location.origin}/formulario/${segmentoSlug}/${f.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copiado!');
    }).catch(() => {
      toast.error('Erro ao copiar link.');
    });
  }, []);

  const handleDelete = React.useCallback((f: AssinaturaDigitalFormulario) => {
    setSelected(f);
    setDeleteOpen(true);
  }, []);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  const handleEditSuccess = React.useCallback(() => {
    refetch();
    setEditOpen(false);
    setSelected(null);
  }, [refetch]);

  const handleDeleteSuccess = React.useCallback(() => {
    refetch();
    setDeleteOpen(false);
    setSelected(null);
  }, [refetch]);

  return (
    <div className="space-y-5">
      <AssinaturaDigitalPageNav />

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Formulários</Heading>
          <Text variant="meta-label" className="mt-0.5">
            {stats.total} formulário{stats.total !== 1 ? 's' : ''}
            {stats.ativos > 0 ? ` · ${stats.ativos} ativo${stats.ativos !== 1 ? 's' : ''}` : ''}
          </Text>
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="size-3.5" />
            Novo formulário
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
          <FilterChipMulti label="Status" options={ATIVO_OPTIONS} value={ativoFiltro} onValueChange={setAtivoFiltro} />
          <FilterChipMulti label="Segmento" options={segmentoOptions} value={segmentoFiltro} onValueChange={setSegmentoFiltro} popoverWidth="w-56" />
          <FilterChipMulti label="Foto" options={FOTO_OPTIONS} value={fotoFiltro} onValueChange={setFotoFiltro} />
          <FilterChipMulti label="Geoloc." options={GEO_OPTIONS} value={geoFiltro} onValueChange={setGeoFiltro} />
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
      <FormulariosGlassList
        formularios={filtered}
        isLoading={isLoading}
        mode={viewMode}
        onEdit={handleEdit}
        onEditSchema={handleEditSchema}
        onCopyLink={handleCopyLink}
        onDelete={handleDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />

      {/* Dialogs */}
      <FormularioCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
        segmentos={segmentos}
        templates={templates}
      />

      <FormularioEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        formulario={selected}
        onSuccess={handleEditSuccess}
        onEditSchema={handleEditSchema}
        segmentos={segmentos}
        templates={templates}
      />

      <FormularioDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        formularios={selected ? [selected] : []}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
