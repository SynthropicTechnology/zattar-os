'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { generateSlug, type AssinaturaDigitalSegmento, type AssinaturaDigitalTemplate } from '@/shared/assinatura-digital';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

const createFormularioSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  slug: z.string().min(3, 'Slug deve ter pelo menos 3 caracteres'),
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

type CreateFormularioFormData = z.infer<typeof createFormularioSchema>;

interface TipoOption {
  id: number;
  nome: string;
}

interface PipelineOption {
  id: number;
  nome: string;
  segmentoId: number;
}

interface FormularioCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  segmentos: AssinaturaDigitalSegmento[];
  templates: AssinaturaDigitalTemplate[];
}

export function FormularioCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  segmentos,
  templates,
}: FormularioCreateDialogProps) {
  const form = useForm<CreateFormularioFormData>({
    resolver: zodResolver(createFormularioSchema),
    defaultValues: {
      nome: '',
      slug: '',
      segmento_id: 0,
      descricao: '',
      template_ids: [],
      ativo: true,
      foto_necessaria: true,
      geolocation_necessaria: false,
      tipo_formulario: null,
      contrato_config: null,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = form;

  const [segmentoId, setSegmentoId] = React.useState<string>('');
  const [templateIds, setTemplateIds] = React.useState<string[]>([]);

  // Contrato config options
  const [tiposContrato, setTiposContrato] = React.useState<TipoOption[]>([]);
  const [tiposCobranca, setTiposCobranca] = React.useState<TipoOption[]>([]);
  const [pipelines, setPipelines] = React.useState<PipelineOption[]>([]);
  const [loadingOptions, setLoadingOptions] = React.useState(false);

  const nome = watch('nome');
  const tipoFormulario = watch('tipo_formulario');

  // Auto-generate slug when nome changes
  React.useEffect(() => {
    if (nome) {
      const slug = generateSlug(nome);
      setValue('slug', slug);
    }
  }, [nome, setValue]);

  // Reset form and states when dialog closes
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

  // Update form values for segmento_id and template_ids
  React.useEffect(() => {
    setValue('segmento_id', segmentoId ? parseInt(segmentoId, 10) : 0);
  }, [segmentoId, setValue]);

  React.useEffect(() => {
    setValue('template_ids', templateIds);
  }, [templateIds, setValue]);

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
        // silently fail — pipelines select will just be empty
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

  const segmentoOptions = segmentos.map((s) => ({
    value: s.id.toString(),
    label: s.nome,
  }));

  const templateOptions = templates.map((t) => ({
    value: t.template_uuid,
    label: t.nome,
    searchText: t.descricao ?? undefined,
  }));

  const onSubmit = async (data: CreateFormularioFormData) => {
    try {
      const body = {
        ...data,
        tipo_formulario: data.tipo_formulario ?? null,
        contrato_config: data.tipo_formulario === 'contrato' ? (data.contrato_config ?? null) : null,
      };

      const response = await fetch('/api/assinatura-digital/formularios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      toast.success('Formulário criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar formulário';
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Criar Novo Formulário</DialogTitle>
            <DialogDescription>
              Configure o formulário e selecione templates opcionais.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {Object.keys(errors).length > 0 && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Corrija os erros no formulário antes de continuar.
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Nome do formulário"
                disabled={isSubmitting}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                {...register('slug')}
                placeholder="Slug gerado automaticamente"
                disabled={isSubmitting}
                readOnly
              />
              {errors.slug && (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              )}
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
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
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
              {/* Preview dos templates selecionados */}
              {templateIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {templateIds.map((templateUuid) => {
                    const template = templates.find(t => t.template_uuid === templateUuid);
                    return (
                      <Badge
                        key={templateUuid}
                        variant="secondary"
                        className="gap-1 pr-1"
                      >
                        <span className="truncate max-w-37.5">
                          {template?.nome || templateUuid}
                        </span>
                        <button
                          type="button"
                          onClick={() => setTemplateIds(templateIds.filter(id => id !== templateUuid))}
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
              <Label htmlFor="tipo_formulario">Tipo de Formulário</Label>
              <select
                id="tipo_formulario"
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
                  <Label htmlFor="tipo_contrato_id">
                    Tipo de Contrato <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="tipo_contrato_id"
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
                  <Label htmlFor="tipo_cobranca_id">
                    Tipo de Cobrança <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="tipo_cobranca_id"
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
                  <Label htmlFor="papel_cliente">
                    Papel do Cliente <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="papel_cliente"
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
                  <Label htmlFor="pipeline_id">
                    Pipeline <span className="text-destructive">*</span>
                  </Label>
                  <select
                    id="pipeline_id"
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
                id="foto_necessaria"
                checked={watch('foto_necessaria')}
                onCheckedChange={(checked) => setValue('foto_necessaria', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="foto_necessaria" className="cursor-pointer">
                Foto necessária
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="geolocation_necessaria"
                checked={watch('geolocation_necessaria')}
                onCheckedChange={(checked) => setValue('geolocation_necessaria', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="geolocation_necessaria" className="cursor-pointer">
                Geolocalização necessária
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={watch('ativo')}
                onCheckedChange={(checked) => setValue('ativo', checked)}
                disabled={isSubmitting}
              />
              <Label htmlFor="ativo" className="cursor-pointer">
                Formulário ativo
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Formulário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
