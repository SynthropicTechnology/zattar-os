'use client';

/**
 * Sheet de Criação/Edição/Visualização de Modelos de Peças
 */

import * as React from 'react';
import { FileText } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppBadge } from '@/components/ui/app-badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import {
  actionCriarPecaModelo,
  actionAtualizarPecaModelo,
  actionBuscarPecaModelo,
} from '../actions';
import {
  TIPO_PECA_LABELS,
  TIPOS_PECA_JURIDICA,
  type PecaModeloListItem,
} from '../domain';
import { PlaceholderToolbarButton } from './placeholder-insert-menu';

// =============================================================================
// SCHEMA
// =============================================================================

const formSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(255),
  descricao: z.string().max(1000).optional(),
  tipoPeca: z.enum(TIPOS_PECA_JURIDICA),
  visibilidade: z.enum(['publico', 'privado']),
  conteudo: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

// =============================================================================
// TYPES
// =============================================================================

interface PecaModeloFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelo: PecaModeloListItem | null;
  mode: 'create' | 'edit' | 'view';
  onSuccess?: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function PecaModeloFormSheet({
  open,
  onOpenChange,
  modelo,
  mode,
  onSuccess,
}: PecaModeloFormSheetProps) {
  const [loading, setLoading] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipoPeca: 'outro',
      visibilidade: 'privado',
      conteudo: '',
    },
  });

  // Carregar dados completos quando editar/visualizar
  React.useEffect(() => {
    if (open && modelo && (isEditMode || isViewMode)) {
      setLoading(true);
      actionBuscarPecaModelo(modelo.id)
        .then((result) => {
          if (result.success && result.data) {
            form.reset({
              titulo: result.data.titulo,
              descricao: result.data.descricao || '',
              tipoPeca: result.data.tipoPeca,
              visibilidade: result.data.visibilidade,
              conteudo: extractTextFromContent(result.data.conteudo as unknown[]),
            });
          }
        })
        .finally(() => setLoading(false));
    } else if (open && mode === 'create') {
      form.reset({
        titulo: '',
        descricao: '',
        tipoPeca: 'outro',
        visibilidade: 'privado',
        conteudo: '',
      });
    }
  }, [open, modelo, mode, isEditMode, isViewMode, form]);

  // Extrair texto do conteúdo Plate.js
  function extractTextFromContent(content: unknown[]): string {
    if (!content) return '';

    const extractText = (node: unknown): string => {
      if (typeof node !== 'object' || node === null) return '';

      const obj = node as Record<string, unknown>;

      if (typeof obj.text === 'string') {
        return obj.text;
      }

      if (Array.isArray(obj.children)) {
        return obj.children.map(extractText).join('');
      }

      return '';
    };

    return content.map((node) => extractText(node)).join('\n\n');
  }

  // Converter texto para conteúdo Plate.js simples
  function textToPlateContent(text: string): unknown[] {
    if (!text) return [];

    const paragraphs = text.split('\n\n').filter(Boolean);
    return paragraphs.map((p) => ({
      type: 'p',
      children: [{ text: p }],
    }));
  }

  // Inserir placeholder no textarea
  const handleInsertPlaceholder = (placeholder: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = form.getValues('conteudo') || '';
    const newValue =
      currentValue.substring(0, start) +
      placeholder +
      currentValue.substring(end);

    form.setValue('conteudo', newValue);

    // Reposicionar cursor após o placeholder
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
    }, 0);
  };

  const onSubmit = async (values: FormValues) => {
    setLoading(true);

    try {
      const conteudo = textToPlateContent(values.conteudo || '');

      if (isEditMode && modelo) {
        const result = await actionAtualizarPecaModelo(modelo.id, {
          titulo: values.titulo,
          descricao: values.descricao || null,
          tipoPeca: values.tipoPeca,
          visibilidade: values.visibilidade,
          conteudo,
        });

        if (result.success) {
          toast.success('Modelo atualizado com sucesso');
          onSuccess?.();
        } else {
          toast.error('Erro ao atualizar modelo', { description: result.message });
        }
      } else {
        const result = await actionCriarPecaModelo({
          titulo: values.titulo,
          descricao: values.descricao || null,
          tipoPeca: values.tipoPeca,
          visibilidade: values.visibilidade,
          conteudo,
          placeholdersDefinidos: [], // Service extracts automatically from content
        });

        if (result.success) {
          toast.success('Modelo criado com sucesso');
          onSuccess?.();
        } else {
          toast.error('Erro ao criar modelo', { description: result.message });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const title = {
    create: 'Novo Modelo de Peça',
    edit: 'Editar Modelo',
    view: 'Visualizar Modelo',
  }[mode];

  const description = {
    create: 'Crie um modelo reutilizável para geração de peças jurídicas',
    edit: 'Atualize as informações do modelo',
    view: 'Visualize os detalhes do modelo',
  }[mode];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
              {/* Título */}
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: Petição Inicial Trabalhista"
                        disabled={isViewMode || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Descreva o uso deste modelo..."
                        rows={2}
                        disabled={isViewMode || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo e Visibilidade */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipoPeca"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Peça *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isViewMode || loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TIPO_PECA_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="visibilidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visibilidade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isViewMode || loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="privado">Privado</SelectItem>
                          <SelectItem value="publico">Público</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Conteúdo do Modelo */}
              <FormField
                control={form.control}
                name="conteudo"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Conteúdo do Modelo</FormLabel>
                      {!isViewMode && (
                        <PlaceholderToolbarButton onInsert={handleInsertPlaceholder} />
                      )}
                    </div>
                    <FormDescription>
                      Use placeholders como {'{{autor_1.nome}}'} para dados dinâmicos
                    </FormDescription>
                    <FormControl>
                      <Textarea
                        {...field}
                        ref={textareaRef}
                        placeholder={`EXMO. SR. DR. JUIZ DO TRABALHO DA {{meta.vara}} VARA DO TRABALHO DE {{meta.cidade}}

{{autor_1.qualificacao_completa}}, vem, respeitosamente, perante V. Exa., por seu advogado que esta subscreve...`}
                        rows={15}
                        className="font-mono text-sm"
                        disabled={isViewMode || loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Placeholders detectados */}
              {form.watch('conteudo') && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Placeholders detectados:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {extractPlaceholdersFromText(form.watch('conteudo') || '').map(
                      (p, i) => (
                        <AppBadge key={i} variant="secondary" className="font-mono text-xs">
                          {p}
                        </AppBadge>
                      )
                    )}
                    {extractPlaceholdersFromText(form.watch('conteudo') || '').length ===
                      0 && (
                      <span className="text-sm text-muted-foreground">Nenhum</span>
                    )}
                  </div>
                </div>
              )}

              {/* Botões */}
              {!isViewMode && (
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : isEditMode ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

// Helper para extrair placeholders do texto
function extractPlaceholdersFromText(text: string): string[] {
  const regex = /\{\{([a-z_]+_\d+\.[a-z_]+|meta\.[a-z_]+|contrato\.[a-z_]+)\}\}/gi;
  const matches = text.match(regex);
  return matches ? [...new Set(matches)] : [];
}
