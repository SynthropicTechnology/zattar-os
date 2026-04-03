import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { toast } from 'sonner';
import { Loader2, Pencil, X } from 'lucide-react';
import {
  generateSlug,
  type AssinaturaDigitalFormulario,
  type AssinaturaDigitalSegmento,
  type AssinaturaDigitalTemplate,
} from '../../feature';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const editFormularioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z
    .string()
    .min(3, 'Slug deve ter pelo menos 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  segmento_id: z.coerce.number().int().positive('Segmento é obrigatório'),
  descricao: z.string().max(500, 'Descrição deve ter no máximo 500 caracteres').optional(),
  template_ids: z.array(z.string()).optional(),
  ativo: z.boolean(),
  foto_necessaria: z.boolean(),
  geolocation_necessaria: z.boolean(),
  tipo_formulario: z.enum(['contrato', 'documento', 'cadastro']).nullable().optional(),
  contrato_config: z
    .object({
      tipo_contrato_id: z.coerce.number().int().positive(),
      tipo_cobranca_id: z.coerce.number().int().positive(),
      papel_cliente: z.enum(['autora', 're']),
      pipeline_id: z.coerce.number().int().positive(),
    })
    .nullable()
    .optional(),
});

type EditFormularioFormData = z.infer<typeof editFormularioSchema>;

interface TipoOption {
  id: number;
  nome: string;
}

interface PipelineOption {
  id: number;
  nome: string;
  segmentoId: number;
}

interface FormularioEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formulario: AssinaturaDigitalFormulario | null;
  onSuccess: () => void;
  onEditSchema: (formulario: AssinaturaDigitalFormulario) => void;
  segmentos: AssinaturaDigitalSegmento[];
  templates: AssinaturaDigitalTemplate[];
}

export function FormularioEditDialog({
  open,
  onOpenChange,
  formulario,
  onSuccess,
  onEditSchema,
  segmentos,
  templates,
}: FormularioEditDialogProps) {
  const form = useForm<EditFormularioFormData>({
    resolver: zodResolver(editFormularioSchema),
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = form;

  const [segmentoId, setSegmentoId] = React.useState<string>('');
  const [templateIds, setTemplateIds] = React.useState<string[]>([]);

  // Contrato config options
  const [tiposContrato, setTiposContrato] = React.useState<TipoOption[]>([]);
  const [tiposCobranca, setTiposCobranca] = React.useState<TipoOption[]>([]);
  const [pipelines, setPipelines] = React.useState<PipelineOption[]>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(false);

  const tipoFormulario = watch('tipo_formulario');

  // Pre-populate form when formulario changes
  React.useEffect(() => {
    if (formulario) {
      reset({
        nome: formulario.nome,
        slug: formulario.slug,
        segmento_id: formulario.segmento_id,
        descricao: formulario.descricao || '',
        template_ids: formulario.template_ids || [],
        ativo: formulario.ativo,
        foto_necessaria: formulario.foto_necessaria ?? true,
        geolocation_necessaria: formulario.geolocation_necessaria ?? false,
        tipo_formulario: formulario.tipo_formulario ?? null,
        contrato_config: formulario.contrato_config ?? null,
      });
      setSegmentoId(formulario.segmento_id.toString());
      setTemplateIds(formulario.template_ids || []);
    }
  }, [formulario, reset]);

  // Reset form when dialog closes
  React.useEffect(() => {
    if (!open) {
      reset();
      setSegmentoId('');
      setTemplateIds([]);
      setTiposContrato([]);
      setTiposCobranca([]);
      setPipelines([]);
    }
  }, [open, reset]);

  // Fetch tipos de contrato and tipos de cobrança when tipo_formulario = 'contrato'
  React.useEffect(() => {
    if (tipoFormulario !== 'contrato') return;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [tiposRes, cobrancaRes] = await Promise.all([
          fetch('/api/contratos/tipos?ativo=true'),
          fetch('/api/contratos/tipos-cobranca?ativo=true'),
        ]);
        if (tiposRes.ok) {
          const json = await tiposRes.json();
          setTiposContrato(json.data ?? []);
        } else {
          console.error('Falha ao carregar tipos de contrato:', tiposRes.status);
          toast.error('Falha ao carregar tipos de contrato.');
        }
        if (cobrancaRes.ok) {
          const json = await cobrancaRes.json();
          setTiposCobranca(json.data ?? []);
        } else {
          console.error('Falha ao carregar tipos de cobrança:', cobrancaRes.status);
          toast.error('Falha ao carregar tipos de cobrança.');
        }
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [tipoFormulario]);

  // Fetch pipelines when tipo_formulario = 'contrato' and segmentoId is set
  React.useEffect(() => {
    if (tipoFormulario !== 'contrato' || !segmentoId) {
      setPipelines([]);
      return;
    }

    const fetchPipelines = async () => {
      try {
        const res = await fetch(`/api/contratos/pipelines?segmentoId=${segmentoId}&ativo=true`);
        if (res.ok) {
          const json = await res.json();
          setPipelines(json.data ?? []);
        }
      } catch {
        // silently fail
      }
    };

    fetchPipelines();
  }, [tipoFormulario, segmentoId]);

  // When tipo_formulario changes away from 'contrato', clear contrato_config
  React.useEffect(() => {
    if (tipoFormulario !== 'contrato') {
      setValue('contrato_config', null);
    }
  }, [tipoFormulario, setValue]);

  // Sync segmento_id and template_ids with form
  React.useEffect(() => {
    setValue('segmento_id', segmentoId ? parseInt(segmentoId, 10) : 0);
  }, [segmentoId, setValue]);

  React.useEffect(() => {
    setValue('template_ids', templateIds);
  }, [templateIds, setValue]);

  // Auto-generate slug on nome blur if slug hasn't been manually changed
  const handleNomeBlur = () => {
    if (!formulario) return;
    const nome = watch('nome');
    const slug = watch('slug');
    if (nome && slug === formulario.slug) {
      setValue('slug', generateSlug(nome));
    }
  };

  const segmentoOptions = segmentos.map((s) => ({
    value: s.id.toString(),
    label: s.nome,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.template_uuid,
    label: t.nome,
    searchText: t.descricao ?? undefined,
  }));

  const onSubmit = async (data: EditFormularioFormData) => {
    if (!formulario) return;

    try {
      // Check slug uniqueness excluding current formulario
      if (data.slug !== formulario.slug) {
        const checkResponse = await fetch(
          `/api/assinatura-digital/formularios?search=${encodeURIComponent(data.slug)}`
        );
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          const existing = (checkData.data || []).find(
            (f: AssinaturaDigitalFormulario) =>
              f.slug === data.slug && f.id !== formulario.id
          );
          if (existing) {
            setError('slug', { message: 'Slug já existe. Escolha um slug diferente.' });
            return;
          }
        }
      }

      // Compute changed fields for partial update
      const changedData: Record<string, unknown> = {};
      if (data.nome !== formulario.nome) changedData.nome = data.nome;
      if (data.slug !== formulario.slug) changedData.slug = data.slug;
      if (data.segmento_id !== formulario.segmento_id) changedData.segmento_id = data.segmento_id;
      if (data.descricao !== (formulario.descricao || '')) changedData.descricao = data.descricao;
      if (data.ativo !== formulario.ativo) changedData.ativo = data.ativo;
      if (data.foto_necessaria !== (formulario.foto_necessaria ?? true))
        changedData.foto_necessaria = data.foto_necessaria;
      if (data.geolocation_necessaria !== (formulario.geolocation_necessaria ?? false))
        changedData.geolocation_necessaria = data.geolocation_necessaria;

      // Compare template_ids arrays
      const originalIds = [...(formulario.template_ids || [])].sort();
      const newIds = [...(data.template_ids || [])].sort();
      if (JSON.stringify(originalIds) !== JSON.stringify(newIds)) {
        changedData.template_ids = data.template_ids || [];
      }

      // tipo_formulario
      const origTipo = formulario.tipo_formulario ?? null;
      const newTipo = data.tipo_formulario ?? null;
      if (origTipo !== newTipo) {
        changedData.tipo_formulario = newTipo;
      }

      // contrato_config
      if (newTipo === 'contrato') {
        const origConfig = formulario.contrato_config ?? null;
        const newConfig = data.contrato_config ?? null;
        if (JSON.stringify(origConfig) !== JSON.stringify(newConfig)) {
          changedData.contrato_config = newConfig;
        }
      } else if (formulario.contrato_config != null) {
        // Tipo mudou para não-contrato, mas havia config antes — limpar
        changedData.contrato_config = null;
      }

      if (Object.keys(changedData).length === 0) {
        toast.info('Nenhuma alteração detectada.');
        return;
      }

      const response = await fetch(`/api/assinatura-digital/formularios/${formulario.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Formulário atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar formulário';
      toast.error(message);
    }
  };

  if (!formulario) return null;

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Formulário"
      maxWidth="2xl"
      footer={
        <Button type="submit" form="formulario-edit-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      }
    >
      <form id="formulario-edit-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
        {Object.keys(errors).length > 0 && (
          <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
            Corrija os erros no formulário antes de continuar.
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="edit-nome">
            Nome <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-nome"
            {...register('nome', { onBlur: handleNomeBlur })}
            placeholder="Nome do formulário"
            disabled={isSubmitting}
          />
          {errors.nome && <p className="text-sm text-destructive">{errors.nome.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-slug">
            Slug <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-slug"
            {...register('slug')}
            placeholder="Slug único"
            disabled={isSubmitting}
          />
          {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>
            Segmento <span className="text-destructive">*</span>
          </Label>
          <Combobox
            options={segmentoOptions}
            value={segmentoId ? [segmentoId] : []}
            onValueChange={(vals) => setSegmentoId(vals[0] || '')}
            placeholder="Selecione um segmento"
            multiple={false}
            disabled={isSubmitting}
          />
          {errors.segmento_id && (
            <p className="text-sm text-destructive">{errors.segmento_id.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-descricao">Descrição</Label>
          <Textarea
            id="edit-descricao"
            {...register('descricao')}
            placeholder="Descrição opcional do formulário"
            disabled={isSubmitting}
          />
          {errors.descricao && (
            <p className="text-sm text-destructive">{errors.descricao.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Templates</Label>
          <Combobox
            options={templateOptions}
            value={templateIds}
            onValueChange={setTemplateIds}
            placeholder="Selecione templates (opcional)"
            multiple={true}
            disabled={isSubmitting}
          />
          {templateIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {templateIds.map((templateUuid) => {
                const template = templates.find((t) => t.template_uuid === templateUuid);
                return (
                  <Badge key={templateUuid} variant="secondary" className="gap-1 pr-1">
                    <span className="truncate max-w-37.5">
                      {template?.nome || templateUuid}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTemplateIds(templateIds.filter((id) => id !== templateUuid))}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                      disabled={isSubmitting}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remover {template?.nome || 'template'}</span>
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Tipo de formulário */}
        <div className="space-y-2">
          <Label htmlFor="edit-tipo_formulario">Tipo de Formulário</Label>
          <select
            id="edit-tipo_formulario"
            className={SELECT_CLASS}
            disabled={isSubmitting}
            value={tipoFormulario ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setValue(
                'tipo_formulario',
                val === '' ? null : (val as 'contrato' | 'documento' | 'cadastro'),
              );
            }}
          >
            <option value="">Selecione o tipo (opcional)</option>
            <option value="contrato">Contrato</option>
            <option value="documento">Documento</option>
            <option value="cadastro">Cadastro</option>
          </select>
        </div>

        {/* Campos de configuração de contrato */}
        {tipoFormulario === 'contrato' && (
          <div className="space-y-4 rounded-md border p-4">
            <p className="text-sm font-medium text-muted-foreground">
              Configuração do Contrato
            </p>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo_contrato_id">
                Tipo de Contrato <span className="text-destructive">*</span>
              </Label>
              <select
                id="edit-tipo_contrato_id"
                className={SELECT_CLASS}
                disabled={isSubmitting || loadingOptions}
                {...register('contrato_config.tipo_contrato_id')}
              >
                <option value="">
                  {loadingOptions ? 'Carregando...' : 'Selecione o tipo de contrato'}
                </option>
                {tiposContrato.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              {errors.contrato_config?.tipo_contrato_id && (
                <p className="text-sm text-destructive">
                  {errors.contrato_config.tipo_contrato_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo_cobranca_id">
                Tipo de Cobrança <span className="text-destructive">*</span>
              </Label>
              <select
                id="edit-tipo_cobranca_id"
                className={SELECT_CLASS}
                disabled={isSubmitting || loadingOptions}
                {...register('contrato_config.tipo_cobranca_id')}
              >
                <option value="">
                  {loadingOptions ? 'Carregando...' : 'Selecione o tipo de cobrança'}
                </option>
                {tiposCobranca.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
              {errors.contrato_config?.tipo_cobranca_id && (
                <p className="text-sm text-destructive">
                  {errors.contrato_config.tipo_cobranca_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-papel_cliente">
                Papel do Cliente <span className="text-destructive">*</span>
              </Label>
              <select
                id="edit-papel_cliente"
                className={SELECT_CLASS}
                disabled={isSubmitting}
                {...register('contrato_config.papel_cliente')}
              >
                <option value="">Selecione o papel do cliente</option>
                <option value="autora">Autora</option>
                <option value="re">Ré</option>
              </select>
              {errors.contrato_config?.papel_cliente && (
                <p className="text-sm text-destructive">
                  {errors.contrato_config.papel_cliente.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-pipeline_id">
                Pipeline <span className="text-destructive">*</span>
              </Label>
              <select
                id="edit-pipeline_id"
                className={SELECT_CLASS}
                disabled={isSubmitting || !segmentoId}
                {...register('contrato_config.pipeline_id')}
              >
                <option value="">
                  {!segmentoId
                    ? 'Selecione um segmento primeiro'
                    : pipelines.length === 0
                      ? 'Nenhum pipeline disponível'
                      : 'Selecione o pipeline'}
                </option>
                {pipelines.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
              {errors.contrato_config?.pipeline_id && (
                <p className="text-sm text-destructive">
                  {errors.contrato_config.pipeline_id.message}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-foto_necessaria"
            checked={watch('foto_necessaria')}
            onCheckedChange={(checked) => setValue('foto_necessaria', checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="edit-foto_necessaria" className="cursor-pointer">
            Foto necessária
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-geolocation_necessaria"
            checked={watch('geolocation_necessaria')}
            onCheckedChange={(checked) => setValue('geolocation_necessaria', checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="edit-geolocation_necessaria" className="cursor-pointer">
            Geolocalização necessária
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-ativo"
            checked={watch('ativo')}
            onCheckedChange={(checked) => setValue('ativo', checked)}
            disabled={isSubmitting}
          />
          <Label htmlFor="edit-ativo" className="cursor-pointer">
            Formulário ativo
          </Label>
        </div>

        <div className="pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onEditSchema(formulario);
            }}
            disabled={isSubmitting}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar campos do formulário
          </Button>
        </div>
      </form>
    </DialogFormShell>
  );
}
