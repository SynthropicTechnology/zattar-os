"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissoes } from '@/providers/user-provider';
import { DataTable, DataShell, DataTableToolbar, DataPagination } from '@/components/shared/data-shell';
import { DataTableColumnHeader } from '@/components/shared/data-shell/data-table-column-header';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Link2, Trash2, Download, Pencil, Tags, FileText, CheckCircle2, Camera, MapPin, Plus } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { AssinaturaDigitalPageNav } from '../components/page-nav';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
import { FilterPopover } from '@/app/(authenticated)/partes';
import type { ColumnDef, Table as TanstackTable } from '@tanstack/react-table';
import { getSemanticBadgeVariant } from '@/lib/design-system';
import {
  getFormularioDisplayName,
  formatBooleanBadge,
  formatAtivoStatus,
  getTemplatePreviewText,
  type AssinaturaDigitalFormulario,
  type AssinaturaDigitalSegmento,
  type AssinaturaDigitalTemplate,
} from '../feature';
import { toast } from 'sonner';
import { FormularioCreateDialog } from './components/formulario-create-dialog';
import { FormularioEditDialog } from './components/formulario-edit-dialog';

import { FormularioDeleteDialog } from './components/formulario-delete-dialog';
import { SegmentoEditDialog, SegmentoDeleteDialog, SegmentoDuplicateDialog, SegmentosManagerDialog } from './components';

interface FormulariosFilters {
  ativo?: boolean;
  foto_necessaria?: boolean;
  geolocation_necessaria?: boolean;
}


function useFormularios(params: { pagina: number; limite: number; busca?: string; ativo?: boolean; foto_necessaria?: boolean; geolocation_necessaria?: boolean; }) {
  const [data, setData] = React.useState<{ formularios: AssinaturaDigitalFormulario[]; total: number; isLoading: boolean; error: string | null; }>({ formularios: [], total: 0, isLoading: false, error: null });

  const fetchFormularios = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const searchParams = new URLSearchParams({ pagina: params.pagina.toString(), limite: params.limite.toString() });
      if (params.busca) searchParams.set('search', params.busca);
      if (params.ativo !== undefined) searchParams.set('ativo', params.ativo.toString());
      if (params.foto_necessaria !== undefined) searchParams.set('foto_necessaria', params.foto_necessaria.toString());
      if (params.geolocation_necessaria !== undefined) searchParams.set('geolocation_necessaria', params.geolocation_necessaria.toString());

      const res = await fetch(`/api/assinatura-digital/formularios?${searchParams}`);
      const json = await res.json();
      if (!res.ok || json.error) { throw new Error(json.error || 'Erro ao carregar formulários'); }
      setData({ formularios: json.data || [], total: json.total || 0, isLoading: false, error: null });
    } catch (err) {
      setData({ formularios: [], total: 0, isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, [params]);

  React.useEffect(() => { fetchFormularios(); }, [fetchFormularios]);
  return { ...data, refetch: fetchFormularios };
}

function useSegmentos() {
  const [data, setData] = React.useState<{ segmentos: AssinaturaDigitalSegmento[]; isLoading: boolean; error: string | null; }>({ segmentos: [], isLoading: false, error: null });

  const fetchSegmentos = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/segmentos?ativo=true');
      const json = await res.json();
      if (!res.ok || json.error) { throw new Error(json.error || 'Erro ao carregar segmentos'); }
      setData({ segmentos: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setData({ segmentos: [], isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, []);

  React.useEffect(() => { fetchSegmentos(); }, [fetchSegmentos]);
  return { ...data, refetch: fetchSegmentos };
}

function useTemplates() {
  const [data, setData] = React.useState<{ templates: AssinaturaDigitalTemplate[]; isLoading: boolean; error: string | null; }>({ templates: [], isLoading: false, error: null });

  const fetchTemplates = React.useCallback(async () => {
    setData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/assinatura-digital/templates?ativo=true');
      const json = await res.json();
      if (!res.ok || json.error) { throw new Error(json.error || 'Erro ao carregar templates'); }
      setData({ templates: json.data || [], isLoading: false, error: null });
    } catch (err) {
      setData({ templates: [], isLoading: false, error: err instanceof Error ? err.message : 'Erro desconhecido' });
    }
  }, []);

  React.useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  return { ...data, refetch: fetchTemplates };
}

function criarColunas(onEdit: (formulario: AssinaturaDigitalFormulario) => void, onCopyLink: (formulario: AssinaturaDigitalFormulario) => void, onDelete: (formulario: AssinaturaDigitalFormulario) => void, templates: AssinaturaDigitalTemplate[], canEdit: boolean, canDelete: boolean): ColumnDef<AssinaturaDigitalFormulario>[] {
  return [
    { 
      accessorKey: 'nome', 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Nome" />
      ),
      enableSorting: true,
      size: 250,
      meta: { align: 'left', headerLabel: 'Nome' },
      cell: ({ row }) => {
        const formulario = row.original;
        const displayName = getFormularioDisplayName(formulario);
        return (
          <div className="flex items-center text-sm gap-2">
            <span>{displayName}</span>
          </div>
        );
      } 
    },
    {
      accessorKey: 'segmento',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Segmento" />
      ),
      enableSorting: false,
      size: 150,
      meta: { align: 'left', headerLabel: 'Segmento' },
      cell: ({ row }) => {
        const segmento = row.original.segmento;
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="capitalize">{segmento?.nome || 'N/A'}</Badge>
          </div>
        );
      }
    },
    { 
      accessorKey: 'descricao', 
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Descrição" />
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left', headerLabel: 'Descrição' },
      cell: ({ row }) => {
        const descricao = row.getValue('descricao') as string | null;
        const truncated = descricao ? (descricao.length > 50 ? descricao.substring(0, 50) + '...' : descricao) : '';
        return (
          <div className="flex items-center text-sm">
            {truncated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="truncate max-w-45">{truncated}</span>
                </TooltipTrigger>
                <TooltipContent>{descricao}</TooltipContent>
              </Tooltip>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        );
      } 
    },
    {
      accessorKey: 'template_ids',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Templates" />
      ),
      enableSorting: false,
      size: 120,
      meta: { align: 'left', headerLabel: 'Templates' },
      cell: ({ row }) => {
        const templateIds = row.getValue('template_ids') as string[] | null;
        const count = templateIds ? templateIds.length : 0;
        const previewText = templateIds && templateIds.length > 0 ? getTemplatePreviewText(templateIds, templates) : 'Nenhum template';
        return (
          <div className="flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="capitalize cursor-help">{count}</Badge>
              </TooltipTrigger>
              <TooltipContent>{previewText}</TooltipContent>
            </Tooltip>
          </div>
        );
      }
    },
    {
      id: 'verificadores',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Verificadores" />
      ),
      enableSorting: false,
      size: 200,
      meta: { align: 'left', headerLabel: 'Verificadores' },
      cell: ({ row }) => {
        const formulario = row.original;
        const fotoNecessaria = formulario.foto_necessaria ?? false;
        const geolocationNecessaria = formulario.geolocation_necessaria ?? false;

        return (
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={getSemanticBadgeVariant('ativo_status', String(fotoNecessaria))} className="capitalize">
                  Foto
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Foto necessária: {formatBooleanBadge(fotoNecessaria)}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant={getSemanticBadgeVariant('ativo_status', String(geolocationNecessaria))} className="capitalize">
                  Geo
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Geolocalização necessária: {formatBooleanBadge(geolocationNecessaria)}
              </TooltipContent>
            </Tooltip>
          </div>
        );
      }
    },
    {
      accessorKey: 'ativo',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Ativo" />
      ),
      enableSorting: true,
      size: 100,
      enableHiding: true,
      meta: { align: 'left', headerLabel: 'Ativo' },
      cell: ({ row }) => {
        const ativo = row.getValue('ativo') as boolean;
        return (
          <div className="flex items-center">
            <Badge variant={ativo ? 'success' : 'secondary'} className="capitalize">{formatAtivoStatus(ativo)}</Badge>
          </div>
        );
      }
    },
    {
      id: 'acoes',
      header: 'Ações',
      enableSorting: false,
      size: 150,
      enableHiding: false,
      meta: { align: 'left', headerLabel: 'Ações' },
      cell: ({ row }) => {
        const formulario = row.original;
        return (
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            <FormularioActions formulario={formulario} onEdit={onEdit} onCopyLink={onCopyLink} onDelete={onDelete} canEdit={canEdit} canDelete={canDelete} />
          </div>
        );
      }
    },
  ];
}

function FormularioActions({
  formulario,
  onEdit,
  onCopyLink,
  onDelete,
  canEdit,
  canDelete,
}: {
  formulario: AssinaturaDigitalFormulario;
  onEdit: (formulario: AssinaturaDigitalFormulario) => void;
  onCopyLink: (formulario: AssinaturaDigitalFormulario) => void;
  onDelete: (formulario: AssinaturaDigitalFormulario) => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <ButtonGroup>
      {canEdit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon" aria-label="Editar"
              className="h-8 w-8"
              onClick={() => onEdit(formulario)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Editar</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon" aria-label="Copiar link"
            className="h-8 w-8"
            onClick={() => onCopyLink(formulario)}
          >
            <Link2 className="h-4 w-4" />
            <span className="sr-only">Copiar link</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Copiar link</TooltipContent>
      </Tooltip>

      {canDelete && (
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Deletar formulário" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Deletar formulário</span>
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent>Deletar</TooltipContent>
          </Tooltip>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar formulário?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O formulário será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(formulario)}>
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </ButtonGroup>
  );
}

export function FormulariosClient() {
  const router = useRouter();
  const [table, setTable] = React.useState<TanstackTable<AssinaturaDigitalFormulario> | null>(null);
  const [busca, setBusca] = React.useState('');
  const [pagina, setPagina] = React.useState(0);
  const [limite, setLimite] = React.useState(50);
  const [filtros, setFiltros] = React.useState<FormulariosFilters>({});
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedFormulario, setSelectedFormulario] = React.useState<AssinaturaDigitalFormulario | null>(null);
  const [selectedFormularios, setSelectedFormularios] = React.useState<AssinaturaDigitalFormulario[]>([]);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [segmentosDialogOpen, setSegmentosDialogOpen] = React.useState(false);
  const [segmentoEditOpen, setSegmentoEditOpen] = React.useState(false);
  const [segmentoDeleteOpen, setSegmentoDeleteOpen] = React.useState(false);
  const [segmentoDuplicateOpen, setSegmentoDuplicateOpen] = React.useState(false);
  const [selectedSegmento, setSelectedSegmento] = React.useState<AssinaturaDigitalSegmento | null>(null);
  const [density, setDensity] = React.useState<'compact' | 'standard' | 'relaxed'>('standard');

  const { temPermissao } = usePermissoes();
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const { segmentos, refetch: refetchSegmentos } = useSegmentos();
  const { templates } = useTemplates();

  const buscaDebounced = useDebounce(busca, 500);

  const params = React.useMemo(
    () => ({
      pagina: pagina + 1,
      limite,
      busca: buscaDebounced || undefined,
      ativo: filtros.ativo,
      foto_necessaria: filtros.foto_necessaria,
      geolocation_necessaria: filtros.geolocation_necessaria,
    }),
    [pagina, limite, buscaDebounced, filtros]
  );

  const { formularios, total, isLoading, error, refetch } = useFormularios(params);

  // -- Stats (fetch sem filtros para contagens globais)
  const [allFormularios, setAllFormularios] = React.useState<AssinaturaDigitalFormulario[]>([]);
  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/assinatura-digital/formularios?limite=500')
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const list = (json?.formularios ?? json?.data ?? []) as AssinaturaDigitalFormulario[];
        setAllFormularios(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [total]);
  const stats = React.useMemo(() => ({
    total: allFormularios.length,
    ativos: allFormularios.filter((f) => f.ativo).length,
    comFoto: allFormularios.filter((f) => f.foto_necessaria).length,
    comGeo: allFormularios.filter((f) => f.geolocation_necessaria).length,
  }), [allFormularios]);

  const handleCreateSuccess = React.useCallback(() => { refetch(); setCreateOpen(false); }, [refetch]);
  const handleEdit = React.useCallback((formulario: AssinaturaDigitalFormulario) => { setSelectedFormulario(formulario); setEditOpen(true); }, []);
  const handleEditSuccess = React.useCallback(() => { refetch(); setEditOpen(false); setSelectedFormulario(null); }, [refetch]);
  const handleEditSchema = React.useCallback((formulario: AssinaturaDigitalFormulario) => { router.push(`/assinatura-digital/formularios/${formulario.id}/schema`); }, [router]);
  const handleCopyLink = React.useCallback((formulario: AssinaturaDigitalFormulario) => {
    const segmentoSlug = formulario.segmento?.slug;
    if (!segmentoSlug) {
      toast.error('Segmento não encontrado para este formulário.');
      return;
    }
    const url = `${window.location.origin}/formulario/${segmentoSlug}/${formulario.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Link copiado!');
    }).catch(() => {
      toast.error('Erro ao copiar link.');
    });
  }, []);
  const handleDelete = React.useCallback(async (formulario: AssinaturaDigitalFormulario) => {
    try {
      const response = await fetch(`/api/assinatura-digital/formularios/${formulario.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Erro ao deletar formulário');
      }
      toast.success('Formulário deletado com sucesso');
      await refetch();
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar formulário';
      toast.error(message);
      console.error('Erro ao deletar formulário:', error);
    }
  }, [refetch, router]);
  
  const handleBulkDeleteClick = React.useCallback(() => { 
    const selected = Object.keys(rowSelection).map(id => formularios.find(f => f.id === Number(id))).filter(Boolean) as AssinaturaDigitalFormulario[]; 
    setSelectedFormularios(selected); 
    setDeleteOpen(true); 
  }, [rowSelection, formularios]);
  const handleExportCSV = React.useCallback(() => { const selected = Object.keys(rowSelection).length > 0 ? Object.keys(rowSelection).map(id => formularios.find(f => f.id === Number(id))).filter(Boolean) as AssinaturaDigitalFormulario[] : formularios; const csv = [["Nome","Segmento","Descrição","Templates","Foto Necessária","Geolocalização Necessária","Ativo","UUID"].join(','), ...selected.map(f => [`"${f.nome}"`, `"${f.segmento?.nome || ''}"`, `"${f.descricao || ''}"`, f.template_ids?.length || 0, f.foto_necessaria ? 'Sim' : 'Não', f.geolocation_necessaria ? 'Sim' : 'Não', f.ativo ? 'Ativo' : 'Inativo', f.formulario_uuid].join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'formularios.csv'; a.click(); URL.revokeObjectURL(url); }, [rowSelection, formularios]);
  const handleDeleteSuccess = React.useCallback(() => { refetch(); setDeleteOpen(false); setSelectedFormularios([]); setRowSelection({}); }, [refetch]);

  const [ativoFilter, setAtivoFilter] = React.useState<string>('all');
  const [fotoFilter, setFotoFilter] = React.useState<string>('all');
  const [geoFilter, setGeoFilter] = React.useState<string>('all');

  const handleAtivoFilterChange = React.useCallback((value: string) => {
    setAtivoFilter(value);
    const ativo = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, ativo }));
    setPagina(0);
  }, []);

  const handleFotoNecessariaFilterChange = React.useCallback((value: string) => {
    setFotoFilter(value);
    const fotoNecessaria = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, foto_necessaria: fotoNecessaria }));
    setPagina(0);
  }, []);

  const handleGeolocationNecessariaFilterChange = React.useCallback((value: string) => {
    setGeoFilter(value);
    const geolocationNecessaria = value === 'all' ? undefined : value === 'true';
    setFiltros(prev => ({ ...prev, geolocation_necessaria: geolocationNecessaria }));
    setPagina(0);
  }, []);

  const colunas = React.useMemo(() => criarColunas(handleEdit, handleCopyLink, handleDelete, templates, canEdit, canDelete), [handleEdit, handleCopyLink, handleDelete, templates, canEdit, canDelete]);

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
            onClick={handleBulkDeleteClick}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar
          </Button>
        )}
      </div>
    );
  }, [rowSelection, handleExportCSV, handleBulkDeleteClick, canDelete]);

  const statCards = [
    { label: 'Total', value: stats.total, Icon: FileText, tint: 'bg-primary/8', iconColor: 'text-primary/60' },
    { label: 'Ativos', value: stats.ativos, Icon: CheckCircle2, tint: 'bg-success/10', iconColor: 'text-success/70' },
    { label: 'Com foto', value: stats.comFoto, Icon: Camera, tint: 'bg-info/10', iconColor: 'text-info/70' },
    { label: 'Com geoloc.', value: stats.comGeo, Icon: MapPin, tint: 'bg-warning/12', iconColor: 'text-warning/75' },
  ];

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
          <Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Formulário
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

      {error && (
        <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
          <p className="font-semibold">Erro ao carregar formulários:</p>
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
              density={density}
              onDensityChange={setDensity}
              searchValue={busca}
              onSearchValueChange={(value) => {
                setBusca(value);
                setPagina(0);
              }}
              searchPlaceholder="Buscar por nome, slug ou descrição..."
              actionSlot={
                <>
                  {canCreate && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon" aria-label="Segmentos"
                          className="bg-white dark:bg-card"
                          onClick={() => setSegmentosDialogOpen(true)}
                        >
                          <Tags className="h-4 w-4" />
                          <span className="sr-only">Segmentos</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Segmentos</TooltipContent>
                    </Tooltip>
                  )}
                </>
              }
              filtersSlot={
                <>
                  <FilterPopover
                    label="Ativo"
                    options={[
                      { value: 'true', label: 'Ativo' },
                      { value: 'false', label: 'Inativo' },
                    ]}
                    value={ativoFilter}
                    onValueChange={handleAtivoFilterChange}
                  />

                  <FilterPopover
                    label="Foto"
                    options={[
                      { value: 'true', label: 'Sim' },
                      { value: 'false', label: 'Não' },
                    ]}
                    value={fotoFilter}
                    onValueChange={handleFotoNecessariaFilterChange}
                  />

                  <FilterPopover
                    label="Geolocalização"
                    options={[
                      { value: 'true', label: 'Sim' },
                      { value: 'false', label: 'Não' },
                    ]}
                    value={geoFilter}
                    onValueChange={handleGeolocationNecessariaFilterChange}
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
          data={formularios}
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
          emptyMessage="Nenhum formulário encontrado."
          onRowClick={(row) => handleEdit(row)}
          onTableReady={(t) => {
            const tableInstance = t as TanstackTable<AssinaturaDigitalFormulario>;
            // Ocultar coluna "ativo" por padrão
            tableInstance.getColumn('ativo')?.toggleVisibility(false);
            setTable(tableInstance);
          }}
          hidePagination
        />
      </DataShell>

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
        formulario={selectedFormulario}
        onSuccess={handleEditSuccess}
        onEditSchema={handleEditSchema}
        segmentos={segmentos}
        templates={templates}
      />

      <FormularioDeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} formularios={selectedFormularios} onSuccess={handleDeleteSuccess} />

      <SegmentosManagerDialog
        open={segmentosDialogOpen}
        onOpenChange={setSegmentosDialogOpen}
        onCreated={() => {
          refetchSegmentos();
        }}
        onEdit={(segmento) => {
          setSelectedSegmento(segmento);
          setSegmentoEditOpen(true);
        }}
        onDuplicate={(segmento) => {
          setSelectedSegmento(segmento);
          setSegmentoDuplicateOpen(true);
        }}
        onDelete={(segmento) => {
          setSelectedSegmento(segmento);
          setSegmentoDeleteOpen(true);
        }}
      />

      {selectedSegmento && (
        <SegmentoEditDialog
          open={segmentoEditOpen}
          onOpenChange={setSegmentoEditOpen}
          segmento={selectedSegmento}
          onSuccess={() => {
            refetchSegmentos();
            setSegmentoEditOpen(false);
            setSelectedSegmento(null);
          }}
        />
      )}

      {selectedSegmento && (
        <SegmentoDuplicateDialog
          open={segmentoDuplicateOpen}
          onOpenChange={setSegmentoDuplicateOpen}
          segmento={selectedSegmento}
          onSuccess={() => {
            refetchSegmentos();
            setSegmentoDuplicateOpen(false);
            setSelectedSegmento(null);
          }}
        />
      )}

      <SegmentoDeleteDialog
        open={segmentoDeleteOpen}
        onOpenChange={setSegmentoDeleteOpen}
        segmentos={selectedSegmento ? [selectedSegmento] : []}
        onSuccess={() => {
          refetchSegmentos();
          setSegmentoDeleteOpen(false);
          setSelectedSegmento(null);
        }}
      />
    </div>
  );
}
