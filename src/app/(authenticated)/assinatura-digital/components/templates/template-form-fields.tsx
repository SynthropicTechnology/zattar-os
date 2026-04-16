'use client';

import * as React from 'react';
import type { UseFormReturn, FieldErrors } from 'react-hook-form';
import { FileText, FileUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { MarkdownRichTextEditor } from '../editor/MarkdownRichTextEditor';
import { PdfUploadField, type PdfUploadValue } from '../editor/pdf-upload-field';
import type { Segmento, TipoTemplate } from '@/shared/assinatura-digital/types';

/**
 * Interface para dados do formulário de template
 */
interface TemplateFormValues {
  nome: string;
  descricao?: string;
  tipo_template: TipoTemplate;
  conteudo_markdown?: string | null;
  segmento_id?: number | null;
  pdf_url?: string | null;
  arquivo_original?: string | null;
  arquivo_nome?: string | null;
  arquivo_tamanho?: number | null;
  ativo?: boolean;
}

/**
 * Props do componente TemplateFormFields
 */
export interface TemplateFormFieldsProps {
  /** Instância do formulário React Hook Form */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>;
  /** Tipo de template selecionado */
  tipoTemplate: TipoTemplate;
  /** Callback quando o tipo de template muda */
  onTipoTemplateChange: (tipo: TipoTemplate) => void;
  /** Lista de segmentos disponíveis */
  segmentos: Segmento[];
  /** Se o formulário está sendo submetido */
  isSubmitting: boolean;
  /** Ocultar seção de conteúdo (editor/upload) - usado no wizard */
  hideContent?: boolean;
}

/**
 * Componente de apresentação que renderiza os campos do formulário de template.
 *
 * Features:
 * - Campos básicos (nome, descrição, segmento)
 * - Seletor de tipo (PDF vs Markdown)
 * - Renderização condicional: MarkdownRichTextEditor ou PdfUploadField
 * - Layout responsivo com grid
 * - Integração com React Hook Form
 */
export function TemplateFormFields({
  form,
  tipoTemplate,
  onTipoTemplateChange,
  segmentos,
  isSubmitting,
  hideContent,
}: TemplateFormFieldsProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  // Type-safe getters para valores do formulário
  const values = watch() as TemplateFormValues;
  const conteudoMarkdown = values.conteudo_markdown;
  const segmentoId = values.segmento_id;
  const ativo = values.ativo;
  const arquivoOriginal = values.arquivo_original;
  const arquivoNome = values.arquivo_nome;
  const arquivoTamanho = values.arquivo_tamanho;

  // Type-safe error getter
  const getErrorMessage = (field: keyof TemplateFormValues): string | undefined => {
    const fieldErrors = errors as FieldErrors<TemplateFormValues>;
    const error = fieldErrors[field];
    return error?.message as string | undefined;
  };

  // Valor do PDF para o PdfUploadField
  const pdfValue: PdfUploadValue | null = arquivoOriginal && arquivoNome && arquivoTamanho
    ? { url: arquivoOriginal, nome: arquivoNome, tamanho: arquivoTamanho }
    : null;

  // Handler para mudança de tipo de template
  const handleTipoChange = (value: string) => {
    const tipo = value as TipoTemplate;
    onTipoTemplateChange(tipo);
    setValue('tipo_template', tipo);

    // Limpar campos do tipo anterior
    if (tipo === 'pdf') {
      setValue('conteudo_markdown', null);
    } else {
      setValue('pdf_url', null);
      setValue('arquivo_original', null);
      setValue('arquivo_nome', null);
      setValue('arquivo_tamanho', null);
    }
  };

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

  // Handler para limpar segmento
  const handleClearSegmento = () => {
    setValue('segmento_id', null);
  };

  return (
    <div className="space-y-4">
      {/* Seletor de Tipo de Template */}
      <div className="space-y-1.5">
        <Label>
          Tipo de Template <span className="text-destructive">*</span>
        </Label>
        <Tabs value={tipoTemplate} onValueChange={handleTipoChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="markdown" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Editor Texto (Markdown)
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              PDF Upload
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Grid responsivo para campos básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-1.5">
          <Label htmlFor="nome">
            Nome do Template <span className="text-destructive">*</span>
          </Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Contrato de Prestação de Serviços"
            disabled={isSubmitting}
          />
          {getErrorMessage('nome') && (
            <p className="text-sm text-destructive">{getErrorMessage('nome')}</p>
          )}
        </div>

        {/* Segmento */}
        <div className="space-y-1.5">
          <Label htmlFor="segmento_id">Segmento (Opcional)</Label>
          <Select
            onValueChange={(value) => setValue('segmento_id', Number(value))}
            value={segmentoId?.toString()}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um segmento" />
            </SelectTrigger>
            <SelectContent>
              {segmentos.map((segment) => (
                <SelectItem key={segment.id} value={segment.id.toString()}>
                  {segment.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {segmentoId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSegmento}
              className="h-6 text-xs"
            >
              Limpar seleção
            </Button>
          )}
          {getErrorMessage('segmento_id') && (
            <p className="text-sm text-destructive">{getErrorMessage('segmento_id')}</p>
          )}
        </div>
      </div>

      {/* Descrição - largura total */}
      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          {...register('descricao')}
          placeholder="Breve descrição do template"
          disabled={isSubmitting}
          rows={2}
        />
        {getErrorMessage('descricao') && (
          <p className="text-sm text-destructive">{getErrorMessage('descricao')}</p>
        )}
      </div>

      {/* Checkbox Ativo */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="ativo"
          checked={ativo ?? true}
          onCheckedChange={(checked) => setValue('ativo', checked === true)}
          disabled={isSubmitting}
        />
        <Label htmlFor="ativo" className="cursor-pointer">
          Template ativo
        </Label>
      </div>

      {/* Conteúdo (editor/upload) - ocultável no modo wizard */}
      {!hideContent && (
        <>
          {/* Editor Markdown (condicional) */}
          {tipoTemplate === 'markdown' && (
            <div className="space-y-1.5">
              <Label htmlFor="conteudo_markdown">
                Conteúdo Markdown <span className="text-destructive">*</span>
              </Label>
              <MarkdownRichTextEditor
                value={conteudoMarkdown || ''}
                onChange={(value) => setValue('conteudo_markdown', value)}
                formularios={[]}
              />
              {getErrorMessage('conteudo_markdown') && (
                <p className="text-sm text-destructive">{getErrorMessage('conteudo_markdown')}</p>
              )}
            </div>
          )}

          {/* Upload de PDF (condicional) */}
          {tipoTemplate === 'pdf' && (
            <PdfUploadField
              value={pdfValue}
              onChange={handlePdfChange}
              disabled={isSubmitting}
              error={getErrorMessage('pdf_url') || getErrorMessage('arquivo_original')}
              required
            />
          )}
        </>
      )}
    </div>
  );
}
