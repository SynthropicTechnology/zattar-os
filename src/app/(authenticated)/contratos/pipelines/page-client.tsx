'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Pencil,
  Loader2,
  Star,
  Trash2,
  GripVertical,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

import { DataShell } from '@/components/shared/data-shell';
import { DataTableToolbar } from '@/components/shared/data-shell/data-table-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePipelines } from '@/app/(authenticated)/contratos/tipos-config/hooks';
import type { ContratoPipeline, ContratoPipelineEstagio } from '@/app/(authenticated)/contratos/pipelines/types';

// =============================================================================
// INTERFACES LOCAIS
// =============================================================================

interface SegmentoOption {
  id: number;
  nome: string;
}

// =============================================================================
// SCHEMAS
// =============================================================================

const pipelineFormSchema = z.object({
  segmentoId: z.coerce.number().int().positive('Selecione um segmento'),
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(200, 'Nome deve ter no máximo 200 caracteres'),
  descricao: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .nullable()
    .optional(),
});

type PipelineFormValues = z.infer<typeof pipelineFormSchema>;

const estagioFormSchema = z.object({
  nome: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z
    .string()
    .min(1, 'Slug é obrigatório')
    .max(100, 'Slug deve ter no máximo 100 caracteres'),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser hex válida'),
  isDefault: z.boolean(),
});

type EstagioFormValues = z.infer<typeof estagioFormSchema>;

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
// HOOK: buscar segmentos
// =============================================================================

function useSegmentos() {
  const [data, setData] = useState<SegmentoOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSegmentos = async () => {
      try {
        const res = await fetch('/api/segmentos?ativo=true');
        const json = await res.json();
        if (json.success || Array.isArray(json.data)) {
          setData(json.data ?? []);
        } else if (Array.isArray(json)) {
          setData(json);
        }
      } catch {
        // ignora erro silenciosamente - segmentos são opcionais na UI
      } finally {
        setIsLoading(false);
      }
    };
    void fetchSegmentos();
  }, []);

  return { data, isLoading };
}

// =============================================================================
// DIALOG: Criar / Editar Pipeline
// =============================================================================

interface PipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: ContratoPipeline | null;
  segmentos: SegmentoOption[];
  onSuccess: () => void;
}

function PipelineDialog({ open, onOpenChange, pipeline, segmentos, onSuccess }: PipelineDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = pipeline !== null;

  const form = useForm<PipelineFormValues>({
    resolver: zodResolver(pipelineFormSchema),
    defaultValues: {
      segmentoId: 0,
      nome: '',
      descricao: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (pipeline) {
        form.reset({
          segmentoId: pipeline.segmentoId,
          nome: pipeline.nome,
          descricao: pipeline.descricao ?? '',
        });
      } else {
        form.reset({
          segmentoId: 0,
          nome: '',
          descricao: '',
        });
      }
    }
  }, [open, pipeline, form]);

  const onSubmit = async (values: PipelineFormValues) => {
    setIsSubmitting(true);
    try {
      const url = isEditing ? `/api/contratos/pipelines/${pipeline.id}` : '/api/contratos/pipelines';
      const method = isEditing ? 'PUT' : 'POST';

      const body = isEditing
        ? { nome: values.nome, descricao: values.descricao || null }
        : { segmentoId: values.segmentoId, nome: values.nome, descricao: values.descricao || null };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar pipeline');
      }

      toast.success(isEditing ? 'Pipeline atualizado com sucesso!' : 'Pipeline criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pipeline' : 'Novo Pipeline'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!isEditing && (
              <FormField
                control={form.control}
                name="segmentoId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Segmento</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      >
                        <option value={0}>Selecione um segmento...</option>
                        {segmentos.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nome}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Pipeline Trabalhista" {...field} />
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
                      placeholder="Descrição do pipeline..."
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
                {isEditing ? 'Salvar alterações' : 'Criar pipeline'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// DIALOG: Criar / Editar Estágio
// =============================================================================

interface EstagioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipelineId: number;
  estagio: ContratoPipelineEstagio | null;
  onSuccess: () => void;
}

function EstagioDialog({ open, onOpenChange, pipelineId, estagio, onSuccess }: EstagioDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = estagio !== null;

  const form = useForm<EstagioFormValues>({
    resolver: zodResolver(estagioFormSchema),
    defaultValues: {
      nome: '',
      slug: '',
      cor: '#6B7280',
      isDefault: false,
    },
  });

  useEffect(() => {
    if (open) {
      if (estagio) {
        form.reset({
          nome: estagio.nome,
          slug: estagio.slug,
          cor: estagio.cor,
          isDefault: estagio.isDefault,
        });
      } else {
        form.reset({
          nome: '',
          slug: '',
          cor: '#6B7280',
          isDefault: false,
        });
      }
    }
  }, [open, estagio, form]);

  const nomeValue = form.watch('nome');
  useEffect(() => {
    if (!isEditing && nomeValue) {
      form.setValue('slug', generateSlug(nomeValue), { shouldValidate: false });
    }
  }, [nomeValue, isEditing, form]);

  const onSubmit = async (values: EstagioFormValues) => {
    setIsSubmitting(true);
    try {
      const url = isEditing
        ? `/api/contratos/pipelines/${pipelineId}/estagios/${estagio.id}`
        : `/api/contratos/pipelines/${pipelineId}/estagios`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao salvar estágio');
      }

      toast.success(isEditing ? 'Estágio atualizado com sucesso!' : 'Estágio criado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle>
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
                    <Input placeholder="Ex: Em Análise" {...field} />
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
                    <Input placeholder="ex: em_analise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cor</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-9 w-12 cursor-pointer rounded-md border border-input p-1"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                      <Input
                        placeholder="#6B7280"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="mt-0!">Estágio padrão</FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                {isEditing ? 'Salvar alterações' : 'Criar estágio'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// SHEET: Gerenciar Estágios com drag-and-drop simples
// =============================================================================

interface EstagiosSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pipeline: ContratoPipeline | null;
  onPipelineUpdate: () => void;
}

function EstagiosSheet({ open, onOpenChange, pipeline, onPipelineUpdate }: EstagiosSheetProps) {
  const [estagios, setEstagios] = useState<ContratoPipelineEstagio[]>([]);
  const [isLoadingEstagios, setIsLoadingEstagios] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [hasReordered, setHasReordered] = useState(false);

  const [estagioDialogOpen, setEstagioDialogOpen] = useState(false);
  const [editingEstagio, setEditingEstagio] = useState<ContratoPipelineEstagio | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    estagio: ContratoPipelineEstagio | null;
    isDeleting: boolean;
  }>({ open: false, estagio: null, isDeleting: false });

  // Drag state usando refs (lição aprendida: evita stale closure em click handlers)
  const dragIndexRef = useRef<number | null>(null);
  const hasMovedRef = useRef(false);

  const fetchEstagios = useCallback(async () => {
    if (!pipeline) return;
    setIsLoadingEstagios(true);
    try {
      const res = await fetch(`/api/contratos/pipelines/${pipeline.id}`);
      const json = await res.json();
      if (json.success && json.data?.estagios) {
        const sorted = [...json.data.estagios].sort(
          (a: ContratoPipelineEstagio, b: ContratoPipelineEstagio) => a.ordem - b.ordem
        );
        setEstagios(sorted);
        setHasReordered(false);
      }
    } catch {
      toast.error('Erro ao carregar estágios');
    } finally {
      setIsLoadingEstagios(false);
    }
  }, [pipeline]);

  useEffect(() => {
    if (open && pipeline) {
      // Se o pipeline já tem estagios carregados, usa-os diretamente
      if (pipeline.estagios && pipeline.estagios.length >= 0) {
        const sorted = [...pipeline.estagios].sort((a, b) => a.ordem - b.ordem);
        setEstagios(sorted);
        setHasReordered(false);
      } else {
        void fetchEstagios();
      }
    }
  }, [open, pipeline, fetchEstagios]);

  // Salvar nova ordem
  const handleSaveOrder = useCallback(async () => {
    if (!pipeline || !hasReordered) return;
    setIsSavingOrder(true);
    try {
      const estagioIds = estagios.map((e) => e.id);
      const res = await fetch(`/api/contratos/pipelines/${pipeline.id}/estagios/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estagioIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao reordenar estágios');
      }
      toast.success('Ordem dos estágios atualizada!');
      setHasReordered(false);
      onPipelineUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setIsSavingOrder(false);
    }
  }, [pipeline, estagios, hasReordered, onPipelineUpdate]);

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dragIndexRef.current = index;
    hasMovedRef.current = false;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === index) return;
    hasMovedRef.current = true;
    setEstagios((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(index, 0, moved);
      return updated;
    });
    dragIndexRef.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (hasMovedRef.current) {
      setHasReordered(true);
    }
    dragIndexRef.current = null;
  }, []);

  // Deletar estágio
  const handleDeleteEstagio = useCallback(async () => {
    if (!pipeline || !deleteConfirm.estagio) return;
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch(
        `/api/contratos/pipelines/${pipeline.id}/estagios/${deleteConfirm.estagio.id}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao excluir estágio');
      }
      toast.success('Estágio excluído com sucesso!');
      setDeleteConfirm({ open: false, estagio: null, isDeleting: false });
      await fetchEstagios();
      onPipelineUpdate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro inesperado');
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [pipeline, deleteConfirm.estagio, fetchEstagios, onPipelineUpdate]);

  const handleEstagioSuccess = useCallback(async () => {
    await fetchEstagios();
    onPipelineUpdate();
  }, [fetchEstagios, onPipelineUpdate]);

  if (!pipeline) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader className="pb-2">
            <SheetTitle>Estágios — {pipeline.nome}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {isLoadingEstagios ? (
              <div className="space-y-2 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : estagios.length === 0 ? (
              <p className="pt-4 text-center text-sm text-muted-foreground">
                Nenhum estágio cadastrado.
              </p>
            ) : (
              <div className="space-y-2 pt-2">
                {estagios.map((estagio, index) => (
                  <div
                    key={estagio.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 rounded-md border bg-card p-3 cursor-grab active:cursor-grabbing select-none"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />

                    {/* Swatch de cor */}
                    <div
                      className="h-4 w-4 shrink-0 rounded-full border"
                      style={{ backgroundColor: estagio.cor }}
                      title={estagio.cor}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{estagio.nome}</span>
                        {estagio.isDefault && (
                          <Star className="h-3.5 w-3.5 shrink-0 fill-warning text-warning" />
                        )}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{estagio.slug}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setEditingEstagio(estagio);
                          setEstagioDialogOpen(true);
                        }}
                        aria-label={`Editar ${estagio.nome}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirm({ open: true, estagio, isDeleting: false })}
                        aria-label={`Excluir ${estagio.nome}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-4 pt-2 border-t space-y-2">
            {hasReordered && (
              <Button
                onClick={() => void handleSaveOrder()}
                disabled={isSavingOrder}
                variant="outline"
                className="w-full"
              >
                {isSavingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar nova ordem
              </Button>
            )}
            <Button
              onClick={() => {
                setEditingEstagio(null);
                setEstagioDialogOpen(true);
              }}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Estágio
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <EstagioDialog
        open={estagioDialogOpen}
        onOpenChange={setEstagioDialogOpen}
        pipelineId={pipeline.id}
        estagio={editingEstagio}
        onSuccess={handleEstagioSuccess}
      />

      <AlertDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !deleteConfirm.isDeleting && setDeleteConfirm({ open, estagio: null, isDeleting: false })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir estágio?</AlertDialogTitle>
            <AlertDialogDescription>
              O estágio <strong>{deleteConfirm.estagio?.nome}</strong> será excluído
              permanentemente. Contratos neste estágio precisarão ser movidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteConfirm.isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteEstagio()}
              disabled={deleteConfirm.isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteConfirm.isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// =============================================================================
// COMPONENTE PRINCIPAL
// =============================================================================

export function PipelinesPageClient() {
  const { data: pipelines, isLoading, error, refetch } = usePipelines();
  const { data: segmentos } = useSegmentos();

  const [pipelineDialogOpen, setPipelineDialogOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<ContratoPipeline | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [estagiosSheet, setEstagiosSheet] = useState<{
    open: boolean;
    pipeline: ContratoPipeline | null;
  }>({ open: false, pipeline: null });

  const handleNovoPipeline = useCallback(() => {
    setEditingPipeline(null);
    setPipelineDialogOpen(true);
  }, []);

  const handleEditarPipeline = useCallback((pipeline: ContratoPipeline) => {
    setEditingPipeline(pipeline);
    setPipelineDialogOpen(true);
  }, []);

  const handleToggleAtivo = useCallback(
    async (pipeline: ContratoPipeline) => {
      setTogglingId(pipeline.id);
      try {
        const res = await fetch(`/api/contratos/pipelines/${pipeline.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !pipeline.ativo }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erro ao atualizar status');
        }
        toast.success(`Pipeline ${pipeline.ativo ? 'desativado' : 'ativado'} com sucesso!`);
        await refetch();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro inesperado');
      } finally {
        setTogglingId(null);
      }
    },
    [refetch]
  );

  const handleGerenciarEstagios = useCallback((pipeline: ContratoPipeline) => {
    setEstagiosSheet({ open: true, pipeline });
  }, []);

  const handlePipelineSuccess = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handlePipelineUpdate = useCallback(async () => {
    await refetch();
    // Atualiza o pipeline no sheet se estiver aberto
    setEstagiosSheet((prev) => {
      if (!prev.pipeline) return prev;
      return prev;
    });
  }, [refetch]);

  // Mapeia segmentoId para nome
  const segmentoNomeMap = React.useMemo(() => {
    const map: Record<number, string> = {};
    for (const s of segmentos) {
      map[s.id] = s.nome;
    }
    return map;
  }, [segmentos]);

  return (
    <>
      <DataShell
        ariaLabel="Pipelines de Contratos"
        header={
          <DataTableToolbar
            title="Pipelines de Contratos"
            actionButton={{
              label: 'Novo Pipeline',
              icon: <Plus className="h-4 w-4" />,
              onClick: handleNovoPipeline,
            }}
          />
        }
      >
        <div className="rounded-md border bg-card">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-sm text-destructive">{error}</div>
          ) : pipelines.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum pipeline cadastrado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Segmento</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estágios</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pipelines.map((pipeline, idx) => (
                  <tr
                    key={pipeline.id}
                    className={idx < pipelines.length - 1 ? 'border-b' : undefined}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-medium">{pipeline.nome}</span>
                        {pipeline.descricao && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">
                            {pipeline.descricao}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {segmentoNomeMap[pipeline.segmentoId] ?? `Segmento #${pipeline.segmentoId}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">
                          {pipeline.estagios?.length ?? 0} estágio(s)
                        </span>
                        {pipeline.estagios && pipeline.estagios.length > 0 && (
                          <div className="flex -space-x-1">
                            {pipeline.estagios.slice(0, 5).map((e) => (
                              <div
                                key={e.id}
                                className="h-3 w-3 rounded-full border border-background"
                                style={{ backgroundColor: e.cor }}
                                title={e.nome}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone="soft"
                        variant={pipeline.ativo ? 'success' : 'neutral'}
                      >
                        {pipeline.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5"
                          onClick={() => handleGerenciarEstagios(pipeline)}
                        >
                          <Settings className="h-3.5 w-3.5" />
                          Estágios
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditarPipeline(pipeline)}
                          aria-label={`Editar ${pipeline.nome}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={pipeline.ativo}
                          disabled={togglingId === pipeline.id}
                          onCheckedChange={() => void handleToggleAtivo(pipeline)}
                          aria-label={`${pipeline.ativo ? 'Desativar' : 'Ativar'} ${pipeline.nome}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DataShell>

      <PipelineDialog
        open={pipelineDialogOpen}
        onOpenChange={setPipelineDialogOpen}
        pipeline={editingPipeline}
        segmentos={segmentos}
        onSuccess={handlePipelineSuccess}
      />

      <EstagiosSheet
        open={estagiosSheet.open}
        onOpenChange={(open) =>
          setEstagiosSheet((prev) => ({ ...prev, open }))
        }
        pipeline={estagiosSheet.pipeline}
        onPipelineUpdate={handlePipelineUpdate}
      />
    </>
  );
}
