'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { TemplateFormFields } from './template-form-fields';
import { MarkdownRichTextEditor } from '../editor/MarkdownRichTextEditor';
import { PdfUploadField, type PdfUploadValue } from '../editor/pdf-upload-field';
import {
  templateFormSchema,
  type TemplateFormData,
  type CreateTemplateInput,
  type Segmento,
  type TipoTemplate,
} from '@/shared/assinatura-digital/types';
import { listarSegmentosAction, criarTemplateAction } from '@/shared/assinatura-digital/actions';

const STEP_TITLES = ['Informações do Template', 'Conteúdo'] as const;

/**
 * Props do TemplateCreateDialog
 */
export interface TemplateCreateDialogProps {
  /** Controla se o diálogo está aberto */
  open: boolean;
  /** Callback quando o estado de abertura muda */
  onOpenChange: (open: boolean) => void;
  /** Callback quando o template é criado com sucesso */
  onSuccess?: () => void;
  /** Tipo de template inicial (default: markdown) */
  initialTipoTemplate?: TipoTemplate;
}

/**
 * Diálogo de criação de template com wizard de 2 etapas.
 *
 * Etapa 1 - Informações: tipo, nome, segmento, descrição, ativo
 * Etapa 2 - Conteúdo: editor Markdown ou upload PDF (espaço total)
 */
export function TemplateCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  initialTipoTemplate = 'markdown',
}: TemplateCreateDialogProps) {
  const [segmentos, setSegmentos] = React.useState<Segmento[]>([]);
  const [isLoadingSegmentos, setIsLoadingSegmentos] = React.useState(false);
  const [tipoTemplate, setTipoTemplate] = React.useState<TipoTemplate>(initialTipoTemplate);
  const [step, setStep] = React.useState(1);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      tipo_template: initialTipoTemplate,
      conteudo_markdown: '',
      segmento_id: undefined,
      pdf_url: undefined,
      ativo: true,
      status: 'rascunho',
      versao: 1,
    },
  });

  const { handleSubmit, reset, formState: { isSubmitting }, watch, getValues, setValue, trigger } = form;

  // Buscar segmentos quando o diálogo abre
  React.useEffect(() => {
    if (open) {
      setIsLoadingSegmentos(true);
      listarSegmentosAction({ ativo: true })
        .then((response) => {
          if (!response.success) {
            const errorMsg = 'error' in response ? response.error : 'Erro desconhecido';
            toast.error('Erro ao carregar segmentos: ' + errorMsg);
            return;
          }

          if ('data' in response) {
            setSegmentos(response.data ?? []);
          }
        })
        .catch((error) => {
          toast.error('Erro ao carregar segmentos: ' + error.message);
        })
        .finally(() => {
          setIsLoadingSegmentos(false);
        });
    }
  }, [open]);

  // Reset form e step quando o diálogo fecha
  React.useEffect(() => {
    if (!open) {
      reset({
        nome: '',
        descricao: '',
        tipo_template: initialTipoTemplate,
        conteudo_markdown: '',
        segmento_id: undefined,
        pdf_url: undefined,
        ativo: true,
        status: 'rascunho',
        versao: 1,
      });
      setTipoTemplate(initialTipoTemplate);
      setStep(1);
    }
  }, [open, reset, initialTipoTemplate]);

  // Handler para mudança de tipo de template
  const handleTipoTemplateChange = (tipo: TipoTemplate) => {
    setTipoTemplate(tipo);
  };

  // Avançar para etapa 2 (valida campos da etapa 1)
  const handleNext = async () => {
    const valid = await trigger('nome');
    if (valid) {
      setStep(2);
    }
  };

  // Voltar para etapa 1
  const handleBack = () => {
    setStep(1);
  };

  // Handler de submit
  const onSubmit = async (data: TemplateFormData) => {
    try {
      const createInput: CreateTemplateInput = {
        nome: data.nome,
        descricao: data.descricao,
        tipo_template: tipoTemplate,
        conteudo_markdown: data.conteudo_markdown,
        segmento_id: data.segmento_id ?? null,
        pdf_url: data.pdf_url ?? null,
        arquivo_original: data.arquivo_original,
        arquivo_nome: data.arquivo_nome,
        arquivo_tamanho: data.arquivo_tamanho,
        ativo: data.ativo ?? true,
        status: data.status ?? 'rascunho',
        versao: data.versao ?? 1,
      };

      const result = await criarTemplateAction(createInput);

      if (!result.success) {
        throw new Error('error' in result ? result.error : 'Erro ao criar template');
      }

      toast.success(`Template ${tipoTemplate === 'pdf' ? 'PDF' : 'Markdown'} criado com sucesso!`);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : `Erro ao criar template ${tipoTemplate === 'pdf' ? 'PDF' : 'Markdown'}.`;
      toast.error(message);
    }
  };

  // Verificar se pode submeter (etapa 2)
  const canSubmit = React.useMemo(() => {
    if (isSubmitting) return false;

    const values = getValues();

    if (tipoTemplate === 'pdf') {
      return Boolean(values.pdf_url || values.arquivo_original);
    }

    return Boolean(values.conteudo_markdown && values.conteudo_markdown.trim());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubmitting, tipoTemplate, watch()]);

  // Handler para mudança de PDF
  const handlePdfChange = (file: PdfUploadValue | null) => {
    if (file) {
      setValue('pdf_url', file.url);
      setValue('arquivo_original', file.url);
      setValue('arquivo_nome', file.nome);
      setValue('arquivo_tamanho', file.tamanho);
    } else {
      setValue('pdf_url', null);
      setValue('arquivo_original', null);
      setValue('arquivo_nome', null);
      setValue('arquivo_tamanho', null);
    }
  };

  // Valor do PDF para o PdfUploadField
  const watchedValues = watch();
  const pdfValue: PdfUploadValue | null =
    watchedValues.arquivo_original && watchedValues.arquivo_nome && watchedValues.arquivo_tamanho
      ? { url: watchedValues.arquivo_original, nome: watchedValues.arquivo_nome, tamanho: watchedValues.arquivo_tamanho }
      : null;

  // Largura dinâmica: etapa 2 com markdown precisa de mais espaço
  const maxWidth = step === 2 && tipoTemplate === 'markdown' ? '4xl' as const : '2xl' as const;

  // Footer dinâmico por etapa
  const footer = step === 1 ? (
    <Button type="button" onClick={handleNext}>
      Próximo
      <ArrowRight className="ml-2 h-4 w-4" />
    </Button>
  ) : (
    <>
      <Button type="button" variant="outline" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>
      <Button
        type="submit"
        form="template-create-form"
        disabled={!canSubmit}
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar Template
      </Button>
    </>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Criar Novo Template"
      maxWidth={maxWidth}
      multiStep={{
        current: step,
        total: 2,
        stepTitle: STEP_TITLES[step - 1],
      }}
      footer={footer}
    >
      {isLoadingSegmentos ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form
          id="template-create-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {/* Etapa 1: Informações do Template */}
          {step === 1 && (
            <TemplateFormFields
              form={form}
              tipoTemplate={tipoTemplate}
              onTipoTemplateChange={handleTipoTemplateChange}
              segmentos={segmentos}
              isSubmitting={isSubmitting}
              hideContent
            />
          )}

          {/* Etapa 2: Conteúdo */}
          {step === 2 && (
            <>
              {tipoTemplate === 'markdown' && (
                <div className="space-y-1.5">
                  <Label htmlFor="conteudo_markdown">
                    Conteúdo Markdown <span className="text-destructive">*</span>
                  </Label>
                  <MarkdownRichTextEditor
                    value={watchedValues.conteudo_markdown || ''}
                    onChange={(value) => setValue('conteudo_markdown', value)}
                    formularios={[]}
                  />
                  {form.formState.errors.conteudo_markdown && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.conteudo_markdown.message as string}
                    </p>
                  )}
                </div>
              )}

              {tipoTemplate === 'pdf' && (
                <PdfUploadField
                  value={pdfValue}
                  onChange={handlePdfChange}
                  disabled={isSubmitting}
                  error={
                    (form.formState.errors.pdf_url?.message as string) ||
                    (form.formState.errors.arquivo_original?.message as string)
                  }
                  required
                />
              )}
            </>
          )}
        </form>
      )}
    </DialogFormShell>
  );
}
