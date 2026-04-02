"use client";

/**
 * ChatwootConfigForm - Formulário de configuração do Chatwoot
 */

import { useState } from "react";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { actionAtualizarConfigChatwoot } from "../actions/integracoes-actions";
import type { ChatwootConfig, Integracao } from "../domain";

interface ChatwootConfigFormProps {
  integracao?: Integracao | null;
  onSuccess?: () => void;
}

export function ChatwootConfigForm({ integracao, onSuccess }: ChatwootConfigFormProps) {
  const existingConfig = integracao?.configuracao as ChatwootConfig | undefined;

  const [apiUrl, setApiUrl] = useState(existingConfig?.api_url || "");
  const [apiKey, setApiKey] = useState(existingConfig?.api_key || "");
  const [accountId, setAccountId] = useState(existingConfig?.account_id?.toString() || "");
  const [defaultInboxId, setDefaultInboxId] = useState(existingConfig?.default_inbox_id?.toString() || "");
  const [websiteToken, setWebsiteToken] = useState(existingConfig?.website_token || "");
  const [widgetBaseUrl, setWidgetBaseUrl] = useState(existingConfig?.widget_base_url || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): ChatwootConfig | null {
    const newErrors: Record<string, string> = {};

    if (!apiUrl) {
      newErrors.api_url = "URL da API é obrigatória";
    } else {
      try {
        new URL(apiUrl);
      } catch {
        newErrors.api_url = "URL inválida";
      }
    }

    if (!apiKey) {
      newErrors.api_key = "API Key é obrigatória";
    } else if (apiKey.length < 10) {
      newErrors.api_key = "API Key deve ter no mínimo 10 caracteres";
    }

    let parsedAccountId: number | undefined;
    if (!accountId.trim()) {
      newErrors.account_id = "Account ID é obrigatório";
    } else {
      const num = Number(accountId);
      if (!Number.isInteger(num) || num <= 0) {
        newErrors.account_id = "Account ID deve ser um número inteiro positivo";
      } else {
        parsedAccountId = num;
      }
    }

    let parsedInboxId: number | undefined;
    if (defaultInboxId.trim()) {
      const num = Number(defaultInboxId);
      if (!Number.isInteger(num) || num <= 0) {
        newErrors.default_inbox_id = "Inbox ID deve ser um número inteiro positivo";
      } else {
        parsedInboxId = num;
      }
    }

    if (widgetBaseUrl.trim()) {
      try {
        new URL(widgetBaseUrl);
      } catch {
        newErrors.widget_base_url = "URL do widget inválida";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Campos inválidos", {
        description: "Verifique os campos destacados em vermelho.",
      });
      return null;
    }

    return {
      api_url: apiUrl,
      api_key: apiKey,
      account_id: parsedAccountId!,
      ...(parsedInboxId !== undefined && { default_inbox_id: parsedInboxId }),
      ...(websiteToken.trim() && { website_token: websiteToken.trim() }),
      ...(widgetBaseUrl.trim() && { widget_base_url: widgetBaseUrl.trim() }),
    };
  }

  async function handleSave() {
    const data = validate();
    if (!data) return;

    setIsLoading(true);

    try {
      const result = await actionAtualizarConfigChatwoot(data);

      if (result.success) {
        toast.success("Configuração salva", {
          description: "A integração Chatwoot foi configurada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar", {
          description: result.error || "Não foi possível salvar a configuração.",
        });
      }
    } catch (error) {
      console.error("[ChatwootConfigForm] Erro ao salvar:", error);
      toast.error("Erro ao salvar", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
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

      {/* API Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Configuração da API</h4>

        <div className="space-y-2">
          <Label htmlFor="chatwoot_api_url">URL da API</Label>
          <Input
            id="chatwoot_api_url"
            type="text"
            placeholder="https://chat.exemplo.com/api/v1"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
          {errors.api_url && <p className="text-sm text-destructive">{errors.api_url}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="chatwoot_api_key">API Key</Label>
          <Input
            id="chatwoot_api_key"
            type="password"
            placeholder="api_access_token"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {errors.api_key && <p className="text-sm text-destructive">{errors.api_key}</p>}
          <p className="text-xs text-muted-foreground">
            Obtenha em Settings &gt; Account Settings &gt; API no Chatwoot
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="chatwoot_account_id">Account ID</Label>
            <Input
              id="chatwoot_account_id"
              type="number"
              placeholder="1"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
            {errors.account_id && <p className="text-sm text-destructive">{errors.account_id}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chatwoot_inbox_id">Default Inbox ID (opcional)</Label>
            <Input
              id="chatwoot_inbox_id"
              type="number"
              placeholder="1"
              value={defaultInboxId}
              onChange={(e) => setDefaultInboxId(e.target.value)}
            />
            {errors.default_inbox_id && <p className="text-sm text-destructive">{errors.default_inbox_id}</p>}
          </div>
        </div>
      </div>

      <Separator />

      {/* Widget Configuration */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Configuração do Widget (Chat no site)</h4>

        <div className="space-y-2">
          <Label htmlFor="chatwoot_widget_base_url">URL Base do Widget</Label>
          <Input
            id="chatwoot_widget_base_url"
            type="text"
            placeholder="https://chatwoot-web.exemplo.com"
            value={widgetBaseUrl}
            onChange={(e) => setWidgetBaseUrl(e.target.value)}
          />
          {errors.widget_base_url && <p className="text-sm text-destructive">{errors.widget_base_url}</p>}
          <p className="text-xs text-muted-foreground">
            URL base da sua instância Chatwoot (para o SDK do widget)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="chatwoot_website_token">Website Token</Label>
          <Input
            id="chatwoot_website_token"
            type="text"
            placeholder="xxxxxxxxxxxxxxxx"
            value={websiteToken}
            onChange={(e) => setWebsiteToken(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Token do canal Website no Chatwoot (Inboxes &gt; Website &gt; Configuration)
          </p>
        </div>
      </div>

      <div className="flex gap-2">
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
    </div>
  );
}
