
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { AppBadge as Badge } from '@/components/ui/app-badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Save,
  FileX,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCargos } from '@/app/(authenticated)/cargos';
import { actionCriarCargo, actionAtualizarCargo, actionDeletarCargo } from '@/app/(authenticated)/cargos';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty';
import { Typography } from '@/components/ui/typography';
import { DialogFormShell } from '@/components/shared/dialog-shell';
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

interface CargosManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CargoFormData {
  nome: string;
  descricao: string;
  ativo: boolean;
}

// Tipo local para simplificar, já que Cargo vem do hook
interface Cargo {
  id: number;
  nome: string;
  descricao?: string | null;
  ativo: boolean;
}

export function CargosManagementDialog({
  open,
  onOpenChange,
}: CargosManagementDialogProps) {
  const { cargos, isLoading, refetch } = useCargos();

  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingCargo, setDeletingCargo] = useState<Cargo | null>(null);

  const [formData, setFormData] = useState<CargoFormData>({
    nome: '',
    descricao: '',
    ativo: true,
  });

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', ativo: true });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async () => {
    if (!formData.nome.trim()) {
      toast.error('Nome do cargo é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const response = await actionCriarCargo({
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao criar cargo');
      }

      toast.success('Cargo criado com sucesso!');
      resetForm();
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao criar cargo'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (cargo: Cargo) => {
    setEditingId(cargo.id);
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao || '',
      ativo: cargo.ativo,
    });
    setIsCreating(false);
  };

  const handleUpdate = async () => {
    if (!editingId || !formData.nome.trim()) {
      toast.error('Nome do cargo é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      const response = await actionAtualizarCargo(editingId, {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim() || undefined,
        ativo: formData.ativo,
      });

      if (!response.success) {
        throw new Error(response.error || 'Erro ao atualizar cargo');
      }

      toast.success('Cargo atualizado com sucesso!');
      resetForm();
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao atualizar cargo'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCargo) return;

    try {
      const response = await actionDeletarCargo(deletingCargo.id);

      if (!response.success) {
        throw new Error(response.error || 'Erro ao deletar cargo');
      }

      toast.success('Cargo deletado com sucesso!');
      setDeletingCargo(null);
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao deletar cargo'
      );
    }
  };

  return (
    <>
      <DialogFormShell
        open={open}
        onOpenChange={onOpenChange}
        title={<Typography.H3 as="span">Gerenciar cargos</Typography.H3>}
        maxWidth="3xl"
      >
        <div className="p-6 space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lista */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Typography.H4 as="h3">Cargos</Typography.H4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreating(true);
                    setEditingId(null);
                    setFormData({ nome: '', descricao: '', ativo: true });
                  }}
                  disabled={isSaving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo cargo
                </Button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : cargos.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FileX className="h-6 w-6" />
                    </EmptyMedia>
                    <EmptyTitle>Nenhum cargo cadastrado</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-1 rounded-lg border bg-card">
                  {cargos.map((cargo) => (
                    <div
                      key={cargo.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleEdit(cargo)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEdit(cargo);
                        }
                      }}
                      className="w-full text-left flex items-center justify-between py-2 px-3 hover:bg-muted/50 transition-colors cursor-pointer rounded-md"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium">{cargo.nome}</span>
                        {!cargo.ativo && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                        {cargo.descricao && (
                          <Typography.Muted as="span" className="truncate">
                            - {cargo.descricao}
                          </Typography.Muted>
                        )}
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(cargo);
                          }}
                          disabled={editingId === cargo.id}
                          aria-label="Editar cargo"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingCargo(cargo);
                          }}
                          aria-label="Deletar cargo"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Typography.H4 as="h3">
                  {editingId ? 'Editar cargo' : isCreating ? 'Novo cargo' : 'Detalhes'}
                </Typography.H4>
                {(isCreating || editingId) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    disabled={isSaving}
                  >
                    Limpar
                  </Button>
                )}
              </div>

              {!isCreating && !editingId ? (
                <div className="rounded-lg border bg-card p-4">
                  <Typography.Muted>
                    Selecione um cargo para editar ou clique em <strong>Novo cargo</strong>.
                  </Typography.Muted>
                </div>
              ) : (
                <div className="rounded-lg border bg-card p-4 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nome">
                      Nome <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) =>
                        setFormData({ ...formData, nome: e.target.value })
                      }
                      placeholder="Ex: Advogado, Estagiário, Secretária..."
                      disabled={isSaving}
                      className="bg-card"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) =>
                        setFormData({ ...formData, descricao: e.target.value })
                      }
                      placeholder="Descrição opcional do cargo"
                      rows={3}
                      disabled={isSaving}
                      className="bg-card"
                    />
                  </div>

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
                      Cargo ativo
                    </Label>
                  </div>

                  <Separator />

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
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
            </div>
          </div>
        </div>
      </DialogFormShell>

      {/* Dialog de confirmação de exclusão */}
      <AlertDialog
        open={!!deletingCargo}
        onOpenChange={(open) => !open && setDeletingCargo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Cargo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar o cargo &quot;{deletingCargo?.nome}&quot;?
              {'\n\n'}
              Esta ação não pode ser desfeita. Se houver usuários com este
              cargo, a operação falhará.
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
