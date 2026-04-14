'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';

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
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

import { generateSlug, type AssinaturaDigitalSegmento } from '../../feature';

// Schema local para garantir tipagem correta com useForm
const duplicateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  descricao: z.string().optional(),
  ativo: z.boolean(),
});

type DuplicateFormData = z.infer<typeof duplicateSchema>;

interface SegmentoDuplicateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  segmento: AssinaturaDigitalSegmento;
  onSuccess: () => void;
}

export function SegmentoDuplicateDialog({
  open,
  onOpenChange,
  segmento,
  onSuccess,
}: SegmentoDuplicateDialogProps) {
  const form = useForm<DuplicateFormData>({
    resolver: zodResolver(duplicateSchema),
    defaultValues: {
      nome: '',
      slug: '',
      descricao: '',
      ativo: true,
    },
  });

  useEffect(() => {
    if (segmento) {
      const newNome = `Cópia de ${segmento.nome}`;
      form.reset({
        nome: newNome,
        slug: generateSlug(newNome),
        descricao: segmento.descricao || '',
        ativo: true,
      });
    }
  }, [segmento, form]);

  const onSubmit = async (data: DuplicateFormData) => {
    try {
      // Check slug uniqueness using exact-match lookup
      const checkResponse = await fetch(`/api/assinatura-digital/segmentos?slug=${encodeURIComponent(data.slug)}`);
      if (!checkResponse.ok) {
        throw new Error('Erro ao verificar unicidade do slug');
      }
      const checkData = await checkResponse.json();
      if (checkData.exists) {
        form.setError('slug', { message: 'Slug já existe. Escolha um slug diferente.' });
        return;
      }

      // Proceed with duplication
      const response = await fetch('/api/assinatura-digital/segmentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao duplicar segmento');
      }

      toast.success('Segmento duplicado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao duplicar segmento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Duplicar Segmento</DialogTitle>
          <DialogDescription>
            Crie uma cópia do segmento &ldquo;{segmento.nome}&rdquo;. Edite o nome e descrição se necessário.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do segmento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="Slug gerado automaticamente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição opcional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ativo</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Duplicar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}