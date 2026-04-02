"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { SystemPrompt } from "../domain";
import { CATEGORIAS_PROMPT, LABELS_CATEGORIA, DESCRICOES_CATEGORIA } from "../domain";
import type { CategoriaPrompt } from "../domain";
import { DEFAULT_PROMPTS } from "../defaults";
import { PromptCard, DefaultPromptCard } from "./prompt-card";
import { PromptEditDialog } from "./prompt-edit-dialog";
import { CreatePromptDialog } from "./create-prompt-dialog";
import { actionPersonalizarPromptBuiltIn } from "../actions/system-prompts-actions";

interface PromptsIaContentProps {
  systemPrompts?: SystemPrompt[];
}

export function PromptsIAContent({ systemPrompts = [] }: PromptsIaContentProps) {
  const router = useRouter();
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [personalizando, setPersonalizando] = useState<string | null>(null);

  // Slugs que já existem no banco
  const existingSlugs = new Set(systemPrompts.map((p) => p.slug));

  // Prompts do banco agrupados por categoria
  const dbPromptsByCategoria = Object.keys(CATEGORIAS_PROMPT).reduce<
    Record<string, SystemPrompt[]>
  >((acc, cat) => {
    acc[cat] = systemPrompts.filter((p) => p.categoria === cat);
    return acc;
  }, {});

  // Defaults que NÃO existem no banco (ainda não personalizados)
  const missingDefaults = Object.entries(DEFAULT_PROMPTS).filter(
    ([slug]) => !existingSlugs.has(slug)
  );

  // Defaults agrupados por categoria
  const defaultsByCategoria = missingDefaults.reduce<
    Record<string, { slug: string; nome: string; descricao: string; categoria: CategoriaPrompt; conteudo: string }[]>
  >((acc, [slug, def]) => {
    if (!acc[def.categoria]) acc[def.categoria] = [];
    acc[def.categoria].push({ slug, ...def });
    return acc;
  }, {});

  async function handlePersonalizar(slug: string) {
    setPersonalizando(slug);
    try {
      const result = await actionPersonalizarPromptBuiltIn({ slug });
      if (result?.success) {
        toast.success("Prompt personalizado", {
          description: "O prompt foi copiado para o banco e está pronto para edição.",
        });
        router.refresh();
      } else {
        const errorResult = result as { success: false; message: string } | undefined;
        toast.error("Erro ao personalizar", {
          description: errorResult?.message ?? "Não foi possível personalizar o prompt.",
        });
      }
    } catch (error) {
      console.error("[PromptsIAContent] Erro ao personalizar:", error);
      toast.error("Erro ao personalizar", {
        description: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    } finally {
      setPersonalizando(null);
    }
  }

  // Verifica se há algo para exibir em alguma categoria
  const hasAnything = systemPrompts.length > 0 || missingDefaults.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Prompts de IA</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os prompts utilizados pelos assistentes e ferramentas de IA do sistema.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Prompt Personalizado
        </Button>
      </div>

      {!hasAnything ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground text-sm">
            Nenhum prompt encontrado.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.keys(CATEGORIAS_PROMPT).map((cat) => {
            const categoria = cat as CategoriaPrompt;
            const dbPrompts = dbPromptsByCategoria[categoria] || [];
            const defaults = defaultsByCategoria[categoria] || [];

            if (dbPrompts.length === 0 && defaults.length === 0) return null;

            return (
              <section key={categoria}>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{LABELS_CATEGORIA[categoria]}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {DESCRICOES_CATEGORIA[categoria]}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Prompts salvos no banco (editáveis) */}
                  {dbPrompts.map((prompt) => (
                    <PromptCard
                      key={prompt.id}
                      prompt={prompt}
                      onEdit={() => setEditingPrompt(prompt)}
                    />
                  ))}
                  {/* Prompts built-in que ainda não foram personalizados */}
                  {defaults.map((def) => (
                    <DefaultPromptCard
                      key={def.slug}
                      slug={def.slug}
                      nome={def.nome}
                      descricao={def.descricao}
                      categoria={def.categoria}
                      conteudo={def.conteudo}
                      onPersonalizar={() => handlePersonalizar(def.slug)}
                      loading={personalizando === def.slug}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {editingPrompt && (
        <PromptEditDialog
          prompt={editingPrompt}
          open
          onOpenChange={(open) => {
            if (!open) setEditingPrompt(null);
          }}
          onSuccess={() => {
            setEditingPrompt(null);
            router.refresh();
          }}
        />
      )}

      <CreatePromptDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
