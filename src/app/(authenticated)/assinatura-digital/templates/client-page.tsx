'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  CheckCircle2,
  PenLine,
  FileCode2,
  Clock,
  Plus,
} from 'lucide-react';

import { listarTemplatesAction } from '../feature/actions';
import { useDebounce } from '@/hooks/use-debounce';
import { usePermissoes } from '@/providers/user-provider';
import { GlassPanel } from '@/components/shared/glass-panel';
import { IconContainer } from '@/components/ui/icon-container';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/dashboard/search-input';
import { FilterPopoverMulti, type FilterOption } from '@/app/(authenticated)/partes';

import {
  type Template,
  type TipoTemplate,
} from '../feature';
import { TemplateCreateDialog } from '../feature';
import { TemplateDuplicateDialog } from './components/template-duplicate-dialog';
import { TemplateDeleteDialog } from './components/template-delete-dialog';
import { AssinaturaDigitalPageNav } from '../components/page-nav';
import { TemplatesGlassList } from '../components/templates-glass-list';

// =============================================================================
// HOOK
// =============================================================================

function useTemplates() {
  const [data, setData] = React.useState<{
    templates: Template[];
    isLoading: boolean;
    error: string | null;
  }>({ templates: [], isLoading: false, error: null });

  const fetchTemplates = React.useCallback(async () => {
    setData((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await listarTemplatesAction({});
      if (!response.success) {
        throw new Error('error' in response ? response.error : 'Erro ao carregar templates');
      }
      const list = 'data' in response ? (response.data || []) : [];
      setData({ templates: list as Template[], isLoading: false, error: null });
    } catch (err) {
      setData({
        templates: [],
        isLoading: false,
        error: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  }, []);

  React.useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return { ...data, refetch: fetchTemplates };
}

// =============================================================================
// FILTER OPTIONS
// =============================================================================

const STATUS_OPTIONS: readonly FilterOption[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'inativo', label: 'Inativo' },
];

const TIPO_OPTIONS: readonly FilterOption[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'markdown', label: 'Markdown' },
];

// =============================================================================
// MAIN
// =============================================================================

export function TemplatesClient() {
  const router = useRouter();
  const { temPermissao } = usePermissoes();
  const canCreate = temPermissao('assinatura_digital', 'criar');
  const canEdit = temPermissao('assinatura_digital', 'editar');
  const canDelete = temPermissao('assinatura_digital', 'deletar');

  const { templates, isLoading, error, refetch } = useTemplates();

  const [busca, setBusca] = React.useState('');
  const [statusFiltro, setStatusFiltro] = React.useState<string[]>([]);
  const [tipoFiltro, setTipoFiltro] = React.useState<string[]>([]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [selectedTemplate, setSelectedTemplate] = React.useState<Template | null>(null);

  const buscaDebounced = useDebounce(busca, 300);

  // Filtering
  const filtered = React.useMemo(() => {
    let result = templates;
    if (statusFiltro.length > 0) {
      result = result.filter((t) => statusFiltro.includes(t.status));
    }
    if (tipoFiltro.length > 0) {
      result = result.filter((t) => tipoFiltro.includes(t.tipo_template));
    }
    if (buscaDebounced) {
      const lower = buscaDebounced.toLowerCase();
      result = result.filter(
        (t) =>
          t.nome.toLowerCase().includes(lower) ||
          (t.descricao ?? '').toLowerCase().includes(lower) ||
          (t.template_uuid ?? '').toLowerCase().includes(lower),
      );
    }
    return result;
  }, [templates, statusFiltro, tipoFiltro, buscaDebounced]);

  // Stats (sempre sobre o dataset completo)
  const stats = React.useMemo(() => ({
    total: templates.length,
    ativos: templates.filter((t) => t.status === 'ativo').length,
    rascunhos: templates.filter((t) => t.status === 'rascunho').length,
    inativos: templates.filter((t) => t.status === 'inativo').length,
    markdown: templates.filter((t) => t.tipo_template === 'markdown').length,
  }), [templates]);

  const statCards = [
    { label: 'Total', value: stats.total, Icon: FileText, tint: 'bg-primary/8', iconColor: 'text-primary/60' },
    { label: 'Ativos', value: stats.ativos, Icon: CheckCircle2, tint: 'bg-success/10', iconColor: 'text-success/70' },
    { label: 'Rascunhos', value: stats.rascunhos, Icon: PenLine, tint: 'bg-warning/12', iconColor: 'text-warning/75' },
    { label: 'Markdown', value: stats.markdown, Icon: FileCode2, tint: 'bg-info/10', iconColor: 'text-info/70' },
    { label: 'Inativos', value: stats.inativos, Icon: Clock, tint: 'bg-muted-foreground/8', iconColor: 'text-muted-foreground/60' },
  ];

  // Handlers
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
    setSelectedTemplate(template);
    setDeleteOpen(true);
  }, []);

  const handleCreateSuccess = React.useCallback(() => {
    refetch();
    setCreateOpen(false);
  }, [refetch]);

  const handleDuplicateSuccess = React.useCallback(() => {
    refetch();
    setDuplicateOpen(false);
    setSelectedTemplate(null);
  }, [refetch]);

  const handleDeleteSuccess = React.useCallback(() => {
    refetch();
    setDeleteOpen(false);
    setSelectedTemplate(null);
  }, [refetch]);

  return (
    <div className="space-y-5">
      <AssinaturaDigitalPageNav />

      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <Heading level="page">Templates</Heading>
          <Text variant="meta-label" className="mt-0.5">
            {stats.total} template{stats.total !== 1 ? 's' : ''}
            {stats.ativos > 0 ? ` · ${stats.ativos} ativo${stats.ativos !== 1 ? 's' : ''}` : ''}
            {stats.rascunhos > 0 ? ` · ${stats.rascunhos} em rascunho` : ''}
          </Text>
        </div>
        {canCreate && (
          <Button size="sm" className="h-9" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Template
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
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

      {/* Toolbar — padrão audiências: filtros à esquerda, search à direita */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPopoverMulti
            label="Status"
            options={STATUS_OPTIONS}
            value={statusFiltro}
            onValueChange={setStatusFiltro}
          />
          <FilterPopoverMulti
            label="Tipo"
            options={TIPO_OPTIONS}
            value={tipoFiltro}
            onValueChange={setTipoFiltro}
          />
        </div>
        <div className="flex items-center gap-2 flex-1 justify-end">
          <SearchInput
            value={busca}
            onChange={setBusca}
            placeholder="Buscar por nome, UUID ou descrição..."
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
      <TemplatesGlassList
        templates={filtered}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        canEdit={canEdit}
        canCreate={canCreate}
        canDelete={canDelete}
      />

      {/* Dialogs */}
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
        templates={selectedTemplate ? [selectedTemplate] : []}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
