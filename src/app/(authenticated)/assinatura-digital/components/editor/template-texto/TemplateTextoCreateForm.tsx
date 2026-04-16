'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Descendant } from 'platejs';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TemplateTextoEditor } from './TemplateTextoEditor';
import type { Segmento } from '@/shared/assinatura-digital/types/domain';

// Form validation schema
const templateTextoFormSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  descricao: z.string().max(500, 'Descrição muito longa').optional(),
  segmento_id: z.number().optional().nullable(),
});

type TemplateTextoFormValues = z.infer<typeof templateTextoFormSchema>;

interface TemplateTextoCreateFormProps {
  segmentos: Segmento[];
  onSave: (data: TemplateTextoFormValues & { conteudo: Descendant[] }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Form for creating a new text template
 * Includes metadata fields and Plate editor for content
 */
export function TemplateTextoCreateForm({
  segmentos,
  onSave,
  onCancel,
  isLoading = false,
}: TemplateTextoCreateFormProps) {
  const [editorContent, setEditorContent] = React.useState<Descendant[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<TemplateTextoFormValues>({
    resolver: zodResolver(templateTextoFormSchema),
    defaultValues: {
      nome: '',
      descricao: '',
      segmento_id: null,
    },
  });

  const handleSubmit = async (values: TemplateTextoFormValues) => {
    // Validate editor content
    if (!editorContent || editorContent.length === 0) {
      toast.error('O conteúdo do template é obrigatório');
      return;
    }

    // Check if content is just empty paragraphs
    const hasContent = editorContent.some((node: Descendant) => {
      if ('children' in node && Array.isArray(node.children)) {
        return node.children.some((child) =>
          'text' in child && typeof child.text === 'string' && child.text.trim().length > 0
        );
      }
      return false;
    });

    if (!hasContent) {
      toast.error('O conteúdo do template não pode estar vazio');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        ...values,
        conteudo: editorContent,
      });
      toast.success('Template salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const isSubmitting = isSaving || isLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Template
              </>
            )}
          </Button>
        </div>

        {/* Metadata fields */}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Template</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Contrato de Prestação de Serviços"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="segmento_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Segmento</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                  value={field.value?.toString() ?? ''}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um segmento (opcional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {segmentos.map((segmento) => (
                      <SelectItem key={segmento.id} value={segmento.id.toString()}>
                        {segmento.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Associe o template a um segmento para organização
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva o propósito deste template..."
                  rows={2}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Editor section */}
        <div className="space-y-2">
          <FormLabel>Conteúdo do Template</FormLabel>
          <TemplateTextoEditor
            value={editorContent}
            onChange={setEditorContent}
            disabled={isSubmitting}
            placeholder="Escreva o conteúdo do template aqui. Use @ para inserir variáveis dinâmicas..."
          />
        </div>
      </form>
    </Form>
  );
}

export default TemplateTextoCreateForm;
