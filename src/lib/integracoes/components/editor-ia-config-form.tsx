"use client";

/**
 * EditorIAConfigForm - Formulário de configuração do Editor de Texto IA
 */

import { useState } from "react";
import Link from "next/link";
import { Loader2, Save, AlertCircle, Wifi, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { actionAtualizarConfigEditorIA } from "../actions/integracoes-actions";
import type {
  EditorIAConfig,
  Integracao,
  AIProviderType,
} from "../domain";
import { AI_PROVIDER_TYPES, LABELS_AI_PROVIDER } from "../domain";

// Placeholder do modelo padrão por provedor
const DEFAULT_MODEL_PLACEHOLDER: Record<AIProviderType, string> = {
  gateway: "openai/gpt-4o-mini",
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
  google: "gemini-2.5-flash",
};

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface EditorIAConfigFormProps {
  integracao?: Integracao | null;
  onSuccess?: () => void;
}

export function EditorIAConfigForm({
  integracao,
  onSuccess,
}: EditorIAConfigFormProps) {
  const existingConfig = integracao?.configuracao as EditorIAConfig | undefined;

  const [provider, setProvider] = useState<AIProviderType>(
    existingConfig?.provider || "openai"
  );
  const [apiKey, setApiKey] = useState(existingConfig?.api_key || "");
  const [baseUrl, setBaseUrl] = useState(existingConfig?.base_url || "");
  const [defaultModel, setDefaultModel] = useState(
    existingConfig?.default_model || ""
  );
  const [toolChoiceModel, setToolChoiceModel] = useState(
    existingConfig?.tool_choice_model || ""
  );
  const [commentModel, setCommentModel] = useState(
    existingConfig?.comment_model || ""
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleProviderChange(value: AIProviderType) {
    setProvider(value);
    if (value === "openrouter") {
      setBaseUrl(OPENROUTER_BASE_URL);
    }
  }

  function validate(): EditorIAConfig | null {
    const newErrors: Record<string, string> = {};

    if (!provider) {
      newErrors.provider = "Provedor é obrigatório";
    }

    if (!apiKey) {
      newErrors.api_key = "API Key é obrigatória";
    } else if (apiKey.length < 10) {
      newErrors.api_key = "API Key deve ter no mínimo 10 caracteres";
    }

    if (!defaultModel.trim()) {
      newErrors.default_model = "Modelo padrão é obrigatório";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Campos inválidos", {
        description: "Verifique os campos destacados em vermelho.",
      });
      return null;
    }

    return {
      provider,
      api_key: apiKey,
      ...(baseUrl.trim() && { base_url: baseUrl.trim() }),
      default_model: defaultModel.trim(),
      ...(toolChoiceModel.trim() && { tool_choice_model: toolChoiceModel.trim() }),
      ...(commentModel.trim() && { comment_model: commentModel.trim() }),
    };
  }

  async function handleTestConnection() {
    setIsTesting(true);

    try {
      const response = await fetch("/api/ai-editor/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          api_key: apiKey,
          base_url: baseUrl.trim() || undefined,
          default_model: defaultModel.trim(),
        }),
      });

      const result = await response.json();

      if (result.data?.connected) {
        toast.success("Conexão bem-sucedida", {
          description: "As credenciais do provedor de IA são válidas.",
        });
      } else {
        toast.error("Falha na conexão", {
          description: result.data?.error || result.error || "Erro desconhecido",
        });
      }
    } catch (error) {
      console.error("[EditorIAConfigForm] Erro ao testar conexão:", error);
      toast.error("Falha na conexão", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsTesting(false);
    }
  }

  async function handleSave() {
    const data = validate();
    if (!data) return;

    setIsLoading(true);

    try {
      const result = await actionAtualizarConfigEditorIA(data);

      if (result.success) {
        toast.success("Configuração salva", {
          description:
            "A integração do Editor de Texto IA foi configurada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar", {
          description:
            result.error || "Não foi possível salvar a configuração.",
        });
      }
    } catch (error) {
      console.error("[EditorIAConfigForm] Erro ao salvar:", error);
      toast.error("Erro ao salvar", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      {hasErrors && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Corrija os campos abaixo antes de salvar.
            {Object.values(errors).map((err, i) => (
              <div key={i}>- {err}</div>
            ))}
          </div>
        </div>
      )}

      {/* Provedor de IA */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Provedor de IA</h4>

        <div className="space-y-2">
          <Label htmlFor="editor_ia_provider">Provedor</Label>
          <Select
            value={provider}
            onValueChange={(v) => handleProviderChange(v as AIProviderType)}
          >
            <SelectTrigger id="editor_ia_provider">
              <SelectValue placeholder="Selecione o provedor" />
            </SelectTrigger>
            <SelectContent>
              {AI_PROVIDER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {LABELS_AI_PROVIDER[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.provider && (
            <p className="text-sm text-destructive">{errors.provider}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="editor_ia_api_key">API Key</Label>
          <Input
            id="editor_ia_api_key"
            type="password"
            placeholder="••••••••••••••••"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {errors.api_key && (
            <p className="text-sm text-destructive">{errors.api_key}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="editor_ia_base_url">Base URL (opcional)</Label>
          <Input
            id="editor_ia_base_url"
            type="text"
            placeholder="https://api.exemplo.com/v1"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. URL customizada do provedor.
          </p>
        </div>
      </div>

      <Separator />

      {/* Modelos */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Modelos</h4>

        <div className="space-y-2">
          <Label htmlFor="editor_ia_default_model">Modelo Padrão</Label>
          <Input
            id="editor_ia_default_model"
            type="text"
            placeholder={DEFAULT_MODEL_PLACEHOLDER[provider]}
            value={defaultModel}
            onChange={(e) => setDefaultModel(e.target.value)}
          />
          {errors.default_model && (
            <p className="text-sm text-destructive">{errors.default_model}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="editor_ia_tool_choice_model">
            Modelo Tool Choice (opcional)
          </Label>
          <Input
            id="editor_ia_tool_choice_model"
            type="text"
            placeholder={DEFAULT_MODEL_PLACEHOLDER[provider]}
            value={toolChoiceModel}
            onChange={(e) => setToolChoiceModel(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Usado para decidir a ferramenta (gerar, editar, comentar). Se
            vazio, usa o modelo padrão.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="editor_ia_comment_model">
            Modelo Comentarios (opcional)
          </Label>
          <Input
            id="editor_ia_comment_model"
            type="text"
            placeholder={DEFAULT_MODEL_PLACEHOLDER[provider]}
            value={commentModel}
            onChange={(e) => setCommentModel(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Usado para gerar comentarios e revisoes. Se vazio, usa o modelo
            padrao.
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting || !apiKey || !defaultModel}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4 mr-2" />
          )}
          Testar Conexao
        </Button>

        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar
        </Button>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
        <Link
          href="/app/configuracoes?tab=prompts-ia"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Gerenciar Prompts do Editor
        </Link>
      </div>
    </div>
  );
}
