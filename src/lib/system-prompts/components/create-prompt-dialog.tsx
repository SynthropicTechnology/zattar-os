"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { actionCriarSystemPrompt } from "../actions/system-prompts-actions";

interface CreatePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const INITIAL_STATE = {
  slug: "",
  nome: "",
  descricao: "",
  conteudo: "",
};

export function CreatePromptDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreatePromptDialogProps) {
  const [slug, setSlug] = useState(INITIAL_STATE.slug);
  const [nome, setNome] = useState(INITIAL_STATE.nome);
  const [descricao, setDescricao] = useState(INITIAL_STATE.descricao);
  const [conteudo, setConteudo] = useState(INITIAL_STATE.conteudo);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setSlug(INITIAL_STATE.slug);
    setNome(INITIAL_STATE.nome);
    setDescricao(INITIAL_STATE.descricao);
    setConteudo(INITIAL_STATE.conteudo);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await actionCriarSystemPrompt({
        slug,
        nome,
        descricao: descricao || undefined,
        categoria: "custom",
        conteudo,
        ativo: true,
      });

      if (!result?.success) {
        toast.error("Erro ao criar prompt", {
          description: result?.message ?? "Ocorreu um erro inesperado.",
        });
        return;
      }

      toast.success("Prompt criado com sucesso!");
      resetForm();
      onSuccess();
    } catch (error) {
      console.error("[CreatePromptDialog] Erro ao criar:", error);
      toast.error("Erro inesperado ao criar prompt.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Criar Prompt Personalizado</DialogTitle>
          <DialogDescription>
            Crie um prompt personalizado para ser utilizado pelos assistentes e ferramentas de IA.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-slug">Slug</Label>
              <Input
                id="create-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="meu_prompt_custom"
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e underscores (ex: meu_prompt_custom)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-nome">Nome</Label>
              <Input
                id="create-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do prompt"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-descricao">
              Descrição{" "}
              <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="create-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Breve descrição do propósito deste prompt"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-conteudo">Conteúdo do Prompt</Label>
            <Textarea
              id="create-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva o conteúdo do prompt aqui..."
              className="font-mono text-sm min-h-75"
              required
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
