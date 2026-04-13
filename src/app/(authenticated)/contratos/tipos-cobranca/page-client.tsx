'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { DataShell } from '@/components/shared/data-shell';
import { DataTableToolbar } from '@/components/shared/data-shell/data-table-toolbar';
import { DialogFormShell } from '@/components/shared/dialog-shell/dialog-form-shell';
import { GlassPanel } from '@/components/shared/glass-panel';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useContratoTiposCobranca } from '@/app/(authenticated)/contratos/tipos-config/hooks';
import type { ContratoTipoCobranca } from '@/app/(authenticated)/contratos/tipos-config';

// =============================================================================
// SCHEMA
// =============================================================================

const formSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(100, 'Slug deve ter no máximo 100 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Slug deve conter apenas letras minúsculas, números e underscores'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .optional(),
  ordem: z.coerce
    .number()
    .int('Ordem deve ser um número inteiro')
    .min(0, 'Ordem deve ser maior ou igual a 0'),
});

type FormValues = z.infer<typeof formSchema>;

// =============================================================================
// HELPER: gera slug a partir do nome
// =============================================================================

function generateSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s_]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

// =============================================================================
// DIALOG DE CRIAÇÃO / EDIÇÃO
// =============================================================================

interface TipoCobrancaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipo: ContratoTipoCobranca | null;
  onSuccess: () => void;
}

function TipoCobrancaDialog({ open, onOpenChange, tipo, onSuccess }: TipoCobrancaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = tipo !== null;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      slug: '',
      descricao: '',
      ordem: 0,
    },
  });

  React.useEffect(() => {
    if (open) {
      if (tipo) {
        form.reset({
          nome: tipo.nome,
          slug: tipo.slug,
          descricao: tipo.descricao ?? '',
          ordem: tipo.ordem,
        });
      } else {
        form.reset({
          nome: '',
          slug: '',
          descricao: '',
          ordem: 0,
        });
      }
    }
  }, [open, tipo, form]);

  const nomeValue = form.watch('nome');
  React.useEffect(() => {
    if (!isEditing && nomeValue) {
      form.setValue('slug', generateSlug(nomeValue), { shouldValidate: false });
    }
  }, [nomeValue, isEditing, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/contratos/tipos-cobranca/${tipo.id}`
        : '/api/contratos/tipos-cobranca';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: values.nome,
          slug: values.slug,
          descricao: values.descricao || null,
          ordem: values.ordem,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar tipo de cobrança');
      }

      toast.success(
        isEditing ? 'Tipo de cobrança atualizado com sucesso!' : 'Tipo de cobrança criado com sucesso!'
      );
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? 'Editar Tipo de Cobrança' : 'Novo Tipo de Cobrança'}
      maxWidth="md"
      footer={
        <Button type="submit" form="tipo-cobranca-form" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Salvar alterações' : 'Criar tipo'}
        </Button>
      }
    >
      <Form {...form}>
        <form id="tipo-cobranca-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Honorários" {...field} />
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
                  <Input placeholder="ex: honorarios" {...field} />
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
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição do tipo de cobrança..."
                    className="resize-none"
                    rows={3}
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ordem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem</FormLabel>
                <FormControl>
                  <Input type="number" min={0} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </DialogFormShell>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function TiposCobrancaPageClient() {
  const { data: tipos, isLoading, error, refetch } = useContratoTiposCobranca();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<ContratoTipoCobranca | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleNovo = useCallback(() => {
    setEditingTipo(null);
    setDialogOpen(true);
  }, []);

  const handleEditar = useCallback((tipo: ContratoTipoCobranca) => {
    setEditingTipo(tipo);
    setDialogOpen(true);
  }, []);

  const handleToggleAtivo = useCallback(
    async (tipo: ContratoTipoCobranca) => {
      setTogglingId(tipo.id);
      try {
        const res = await fetch(`/api/contratos/tipos-cobranca/${tipo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !tipo.ativo }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao atualizar status');
        }
        toast.success(`Tipo de cobrança ${tipo.ativo ? 'desativado' : 'ativado'} com sucesso!`);
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro inesperado');
      } finally {
        setTogglingId(null);
      }
    },
    [refetch]
  );

  const handleDialogSuccess = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <>
      <DataShell
        ariaLabel="Tipos de Cobrança"
        header={
          <DataTableToolbar
            title="Tipos de Cobrança"
            actionButton={{
              label: 'Novo Tipo',
              icon: <Plus className="h-4 w-4" />,
              onClick: handleNovo,
            }}
          />
        }
      >
        <GlassPanel className="p-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          ) : tipos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum tipo de cobrança cadastrado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Slug</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ordem</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tipos.map((tipo, idx) => (
                  <tr
                    key={tipo.id}
                    className={idx < tipos.length - 1 ? 'border-b' : undefined}
                  >
                    <td className="px-4 py-3 font-medium">{tipo.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {tipo.slug}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{tipo.ordem}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone="soft"
                        variant={tipo.ativo ? 'success' : 'neutral'}
                      >
                        {tipo.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditar(tipo)}
                          aria-label={`Editar ${tipo.nome}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={tipo.ativo}
                          disabled={togglingId === tipo.id}
                          onCheckedChange={() => void handleToggleAtivo(tipo)}
                          aria-label={`${tipo.ativo ? 'Desativar' : 'Ativar'} ${tipo.nome}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </GlassPanel>
      </DataShell>

      <TipoCobrancaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tipo={editingTipo}
        onSuccess={handleDialogSuccess}
      />
    </>
  );
}
