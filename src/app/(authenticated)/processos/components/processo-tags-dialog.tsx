'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFormShell } from '@/components/shared/dialog-shell';
import { TagBadge } from '@/components/ui/tag-badge';
import { Loader2, Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  type Tag,
  TAG_COLORS,
  getRandomTagColor,
  actionListarTags,
  actionCriarTag,
  actionAtualizarTagsDoProcesso,
} from '@/lib/domain/tags';
import type { ProcessoUnificado } from '../domain';

interface ProcessoTagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoUnificado | null;
  tagsAtuais: Tag[];
  onSuccess: (tags: Tag[]) => void;
}

// TAG_COLOR_CLASS removido — picker agora consome TAG_COLORS direto via
// style={{ backgroundColor: var(--token) }}, sem mapping paralelo.
// Ver src/lib/domain/tags/domain.ts para a single source of truth.

export function ProcessoTagsDialog({
  open,
  onOpenChange,
  processo,
  tagsAtuais,
  onSuccess,
}: ProcessoTagsDialogProps) {
  const [todasTags, setTodasTags] = React.useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = React.useState<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Estado para criar nova tag
  const [showNewTagForm, setShowNewTagForm] = React.useState(false);
  const [newTagNome, setNewTagNome] = React.useState('');
  const [newTagCor, setNewTagCor] = React.useState(getRandomTagColor());
  const [isCreatingTag, setIsCreatingTag] = React.useState(false);

  // Carregar todas as tags quando o dialog abre
  React.useEffect(() => {
    if (open) {
      setIsLoading(true);
      setError(null);
      actionListarTags()
        .then((result) => {
          if (result.success) {
            setTodasTags(result.data as Tag[]);
          } else {
            setError(result.error || 'Erro ao carregar tags');
          }
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Erro ao carregar tags');
        })
        .finally(() => {
          setIsLoading(false);
        });

      // Inicializar seleção com tags atuais
      setSelectedTagIds(tagsAtuais.map((t) => t.id));
    } else {
      // Reset ao fechar
      setShowNewTagForm(false);
      setNewTagNome('');
      setNewTagCor(getRandomTagColor());
    }
  }, [open, tagsAtuais]);

  const handleToggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    if (!newTagNome.trim()) return;

    setIsCreatingTag(true);
    try {
      const result = await actionCriarTag({
        nome: newTagNome.trim(),
        cor: newTagCor,
      });

      if (result.success) {
        const novaTag = result.data as Tag;
        setTodasTags((prev) => [...prev, novaTag].sort((a, b) => a.nome.localeCompare(b.nome)));
        setSelectedTagIds((prev) => [...prev, novaTag.id]);
        setNewTagNome('');
        setNewTagCor(getRandomTagColor());
        setShowNewTagForm(false);
      } else {
        setError(result.error || 'Erro ao criar tag');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleSave = async () => {
    if (!processo) return;

    setIsSaving(true);
    setError(null);

    try {
      const result = await actionAtualizarTagsDoProcesso(processo.id, selectedTagIds);

      if (result.success) {
        const tagsAtualizadas = result.data as Tag[];
        onSuccess(tagsAtualizadas);
        onOpenChange(false);
      } else {
        setError(result.error || 'Erro ao salvar tags');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar tags');
    } finally {
      setIsSaving(false);
    }
  };

  if (!processo) {
    return null;
  }

  const footerButtons = (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
        Cancelar
      </Button>
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </Button>
    </div>
  );

  return (
    <DialogFormShell
      open={open}
      onOpenChange={onOpenChange}
      title="Gerenciar Etiquetas"
      maxWidth="md"
      footer={footerButtons}
    >
      <div className="space-y-4">
        {/* Tags selecionadas */}
        <div>
          <Label className="text-sm font-medium">Etiquetas selecionadas</Label>
          <div className="mt-2 flex flex-wrap gap-2 min-h-10 p-2 border rounded-md bg-muted/30">
            {selectedTagIds.length === 0 ? (
              <span className="text-sm text-muted-foreground">Nenhuma etiqueta selecionada</span>
            ) : (
              selectedTagIds.map((tagId) => {
                const tag = todasTags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <TagBadge
                    key={tag.id}
                    nome={tag.nome}
                    cor={tag.cor}
                    onRemove={() => handleToggleTag(tag.id)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Lista de tags disponíveis */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Etiquetas disponíveis</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowNewTagForm(!showNewTagForm)}
              className="h-7 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>

          {/* Formulário para criar nova tag */}
          {showNewTagForm && (
            <div className="mb-3 p-3 border rounded-md bg-muted/30 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da etiqueta"
                  value={newTagNome}
                  onChange={(e) => setNewTagNome(e.target.value)}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTag();
                    }
                  }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-10 p-0"
                      style={{ backgroundColor: newTagCor }}
                    >
                      <span className="sr-only">Escolher cor</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="grid grid-cols-6 gap-2">
                      {TAG_COLORS.map((color) => {
                        const isSelected = newTagCor === color.hex
                        return (
                          <button
                            key={color.hex}
                            type="button"
                            className={`h-6 w-6 rounded-full border-2 transition-all duration-200 hover:ring-2 hover:ring-offset-1 hover:ring-primary/50 ${
                              isSelected
                                ? 'border-foreground ring-2 ring-ring'
                                : 'border-transparent'
                            }`}
                            style={{ backgroundColor: `var(${color.token})` }}
                            onClick={() => setNewTagCor(color.hex)}
                            title={color.label}
                          />
                        )
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowNewTagForm(false);
                    setNewTagNome('');
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateTag}
                  disabled={!newTagNome.trim() || isCreatingTag}
                >
                  {isCreatingTag && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                  Criar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de tags */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
              {todasTags.length === 0 ? (
                <span className="text-sm text-muted-foreground">Nenhuma etiqueta cadastrada</span>
              ) : (
                todasTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleToggleTag(tag.id)}
                      className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 rounded-full"
                    >
                      <TagBadge
                        nome={tag.nome}
                        cor={tag.cor}
                        variant={isSelected ? 'selected' : 'outline'}
                        showCheck={isSelected}
                        className="cursor-pointer transition-all hover:opacity-80"
                      />
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Erro */}
        {error && (
          <p className="text-sm font-medium text-destructive">{error}</p>
        )}
      </div>
    </DialogFormShell>
  );
}
