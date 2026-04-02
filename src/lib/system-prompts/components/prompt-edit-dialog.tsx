"use client";

/**
 * PromptEditDialog - Diálogo de edição de um system prompt
 *
 * Uso:
 *   <PromptEditDialog
 *     prompt={prompt}
 *     open={open}
 *     onOpenChange={setOpen}
 *     onSuccess={() => router.refresh()}
 *   />
 */

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type SystemPrompt, BUILT_IN_SLUGS, LABELS_CATEGORIA } from "../domain";
import { DEFAULT_PROMPTS } from "../defaults";
import { actionAtualizarSystemPrompt } from "../actions/system-prompts-actions";

interface PromptEditDialogProps {
  prompt: SystemPrompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function PromptEditDialog({
  prompt,
  open,
  onOpenChange,
  onSuccess,
}: PromptEditDialogProps) {
  const [nome, setNome] = useState(prompt.nome);
  const [descricao, setDescricao] = useState(prompt.descricao ?? "");
  const [conteudo, setConteudo] = useState(prompt.conteudo);
  const [loading, setLoading] = useState(false);

  const isBuiltIn = BUILT_IN_SLUGS.has(prompt.slug);

  // Sincroniza o estado quando o prompt muda (ex: usuário abre outro prompt)
  useEffect(() => {
    setNome(prompt.nome);
    setDescricao(prompt.descricao ?? "");
    setConteudo(prompt.conteudo);
  }, [prompt]);

  function handleRestaurarPadrao() {
    const defaultPrompt = DEFAULT_PROMPTS[prompt.slug];
    if (!defaultPrompt) return;
    setConteudo(defaultPrompt.conteudo);
    toast.info("Conteúdo padrão restaurado", {
      description: "Clique em Salvar para confirmar a restauração.",
    });
  }

  async function handleSave() {
    if (!conteudo.trim() || conteudo.trim().length < 10) {
      toast.error("Conteúdo inválido", {
        description: "O conteúdo do prompt deve ter no mínimo 10 caracteres.",
      });
      return;
    }

    if (!nome.trim() || nome.trim().length < 3) {
      toast.error("Nome inválido", {
        description: "O nome deve ter no mínimo 3 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await actionAtualizarSystemPrompt({
        id: prompt.id,
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        conteudo: conteudo.trim(),
      });

      if (result?.success) {
        toast.success("Prompt salvo", {
          description: "As alterações foram salvas com sucesso.",
        });
        onSuccess();
      } else {
        const errorResult = result as { success: false; message: string } | undefined;
        toast.error("Erro ao salvar", {
          description: errorResult?.message ?? "Não foi possível salvar as alterações.",
        });
      }
    } catch (error) {
      console.error("[PromptEditDialog] Erro ao salvar:", error);
      toast.error("Erro ao salvar", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Prompt</DialogTitle>
          <DialogDescription>
            {LABELS_CATEGORIA[prompt.categoria]} &mdash;{" "}
            {isBuiltIn
              ? "Prompt interno do sistema. O nome não pode ser alterado."
              : "Edite o conteúdo e as informações deste prompt personalizado."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="prompt-nome">Nome</Label>
            <Input
              id="prompt-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isBuiltIn}
              placeholder="Nome do prompt"
            />
            {isBuiltIn && (
              <p className="text-xs text-muted-foreground">
                Prompts internos do sistema não podem ter o nome alterado.
              </p>
            )}
          </div>

          {/* Descricao */}
          <div className="space-y-2">
            <Label htmlFor="prompt-descricao">
              Descricao{" "}
              <span className="text-muted-foreground font-normal">
                (opcional)
              </span>
            </Label>
            <Input
              id="prompt-descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descricao breve do propósito deste prompt"
            />
          </div>

          {/* Conteudo */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt-conteudo">Conteúdo do Prompt</Label>
              {isBuiltIn && DEFAULT_PROMPTS[prompt.slug] && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRestaurarPadrao}
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Restaurar Padrão
                </Button>
              )}
            </div>
            <Textarea
              id="prompt-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="font-mono text-sm min-h-75"
              placeholder="Escreva o conteúdo do prompt aqui..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
