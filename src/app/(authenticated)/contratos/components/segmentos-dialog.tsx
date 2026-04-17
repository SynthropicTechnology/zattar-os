'use client';

/**
 * CONTRATOS FEATURE - SegmentosDialog
 *
 * Dialog para gerenciar segmentos (áreas do direito) dos contratos.
 * Permite criar, editar e deletar segmentos.
 */

import { useState, useEffect, useCallback } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppBadge } from '@/components/ui/app-badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  FileX,
} from 'lucide-react';
import { toast } from 'sonner';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Typography } from '@/components/ui/typography';
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
import type { Segmento } from '../actions';
import {
  actionListarSegmentos,
  actionCriarSegmento,
  actionAtualizarSegmento,
  actionDeletarSegmento,
} from '../actions';

// =============================================================================
// TIPOS
// =============================================================================

interface SegmentosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SegmentoFormData {
  nome: string;
  slug: string;
  descricao: string;
  ativo: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Gera slug a partir do nome
 */
function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '_') // Substitui caracteres especiais por _
    .replace(/^_|_$/g, '') // Remove _ do início e fim
    .substring(0, 50); // Limita tamanho
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function SegmentosDialog({ open, onOpenChange }: SegmentosDialogProps) {
  // Estado dos dados
  const [segmentos, setSegmentos] = useState<Segmento[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estado do formulário
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingSegmento, setDeletingSegmento] = useState<Segmento | null>(null);

  const [formData, setFormData] = useState<SegmentoFormData>({
    nome: '',
    slug: '',
    descricao: '',
    ativo: true,
  });

  // Buscar segmentos
  const fetchSegmentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await actionListarSegmentos();
      if (result.success) {
        setSegmentos(result.data || []);
      } else {
        toast.error(result.error || 'Erro ao carregar segmentos');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar segmentos');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar ao abrir
  useEffect(() => {
    if (open) {
      fetchSegmentos();
    }
  }, [open, fetchSegmentos]);

  // Reset form
  const resetForm = () => {
    setFormData({ nome: '', slug: '', descricao: '', ativo: true });
    setIsCreating(false);
    setEditingId(null);
  };

  // Atualizar slug automaticamente ao digitar nome (apenas se for criação)
  const handleNomeChange = (nome: string) => {
    setFormData((prev) => ({
      ...prev,
      nome,
      // Só atualiza slug automaticamente se for criação e slug estiver vazio ou igual ao gerado do nome anterior
      slug: !editingId && (!prev.slug || prev.slug === gerarSlug(prev.nome))
        ? gerarSlug(nome)
        : prev.slug,
    }));
  };

  // Criar segmento
  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do segmento é obrigatório');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug do segmento é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const result = await actionCriarSegmento({
        nome: formData.nome.trim(),
        slug: formData.slug.trim(),
        descricao: formData.descricao.trim() || null,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar segmento');
      }

      toast.success('Segmento criado com sucesso!');
      resetForm();
      fetchSegmentos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar segmento');
    } finally {
      setIsSaving(false);
    }
  };

  // Iniciar edição
  const handleEdit = (segmento: Segmento) => {
    setEditingId(segmento.id);
    setFormData({
      nome: segmento.nome,
      slug: segmento.slug,
      descricao: segmento.descricao || '',
      ativo: segmento.ativo,
    });
    setIsCreating(false);
  };

  // Atualizar segmento
  const handleUpdate = async () => {
    if (!editingId || !formData.nome.trim()) {
      toast.error('Nome do segmento é obrigatório');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug do segmento é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const result = await actionAtualizarSegmento(editingId, {
        nome: formData.nome.trim(),
        slug: formData.slug.trim(),
        descricao: formData.descricao.trim() || null,
        ativo: formData.ativo,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar segmento');
      }

      toast.success('Segmento atualizado com sucesso!');
      resetForm();
      fetchSegmentos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar segmento');
    } finally {
      setIsSaving(false);
    }
  };

  // Deletar segmento
  const handleDelete = async () => {
    if (!deletingSegmento) return;

    try {
      const result = await actionDeletarSegmento(deletingSegmento.id);

      if (!result.success) {
        throw new Error(result.error || 'Erro ao deletar segmento');
      }

      toast.success('Segmento deletado com sucesso!');
      setDeletingSegmento(null);
      fetchSegmentos();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar segmento');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="max-w-3xl max-h-[90vh] flex flex-col bg-background">
          <DialogHeader>
            <DialogTitle>Gerenciar Segmentos</DialogTitle>
            <DialogDescription>
              Crie, edite ou exclua segmentos (áreas do direito) para os contratos.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Formulário de Criação/Edição */}
            {(isCreating || editingId) && (
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Typography.Small className="font-medium">
                    {editingId ? 'Editar Segmento' : 'Novo Segmento'}
                  </Typography.Small>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="nome">
                        Nome <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="nome"
                        variant="glass"
                        value={formData.nome}
                        onChange={(e) => handleNomeChange(e.target.value)}
                        placeholder="Ex: Trabalhista, Civil, Previdenciário..."
                        disabled={isSaving}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="slug">
                        Slug <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="slug"
                        variant="glass"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="Ex: trabalhista, civil, previdenciario..."
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descrição opcional do segmento"
                      rows={2}
                      disabled={isSaving}
                    />
                  </div>

                  {editingId && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="ativo"
                        checked={formData.ativo}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, ativo: checked === true })
                        }
                        disabled={isSaving}
                      />
                      <Label htmlFor="ativo" className="cursor-pointer">
                        Segmento ativo
                      </Label>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={editingId ? handleUpdate : handleCreate}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        {editingId ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Lista de Segmentos */}
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : segmentos.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileX className="h-6 w-6" />
                  </EmptyMedia>
                  <EmptyTitle>Nenhum segmento cadastrado</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-1">
                {segmentos.map((segmento) => (
                  <div
                    key={segmento.id}
                    className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 transition-colors rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium">{segmento.nome}</span>
                      {!segmento.ativo && (
                        <AppBadge variant="secondary" className="text-xs">
                          Inativo
                        </AppBadge>
                      )}
                      {segmento.descricao && (
                        <Typography.Muted as="span" className="truncate">
                          - {segmento.descricao}
                        </Typography.Muted>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Editar"
                        className="h-8 w-8"
                        onClick={() => handleEdit(segmento)}
                        disabled={editingId === segmento.id}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Excluir"
                        className="h-8 w-8"
                        onClick={() => setDeletingSegmento(segmento)}
                        title="Deletar"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            {!isCreating && !editingId && (
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Segmento
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingSegmento}
        onOpenChange={(open) => !open && setDeletingSegmento(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Segmento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o segmento &quot;{deletingSegmento?.nome}&quot;?
              {'\n\n'}
              Esta ação não pode ser desfeita. Se houver contratos usando este
              segmento, a operação falhará.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
