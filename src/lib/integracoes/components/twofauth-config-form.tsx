"use client";

/**
 * TwoFAuthConfigForm - Formulário de configuração do 2FAuth
 */

import { useState } from "react";
import { Loader2, Save, TestTube, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { actionAtualizarConfig2FAuth } from "../actions/integracoes-actions";
import type { TwoFAuthConfig, Integracao } from "../domain";

interface TwoFAuthConfigFormProps {
  integracao?: Integracao | null;
  onSuccess?: () => void;
}

export function TwoFAuthConfigForm({ integracao, onSuccess }: TwoFAuthConfigFormProps) {
  const existingConfig = integracao?.configuracao as TwoFAuthConfig | undefined;

  const [apiUrl, setApiUrl] = useState(existingConfig?.api_url || "");
  const [apiToken, setApiToken] = useState(existingConfig?.api_token || "");
  const [accountId, setAccountId] = useState(existingConfig?.account_id?.toString() || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): TwoFAuthConfig | null {
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

    if (!apiToken) {
      newErrors.api_token = "Token da API é obrigatório";
    } else if (apiToken.length < 10) {
      newErrors.api_token = "Token deve ter no mínimo 10 caracteres";
    }

    let parsedAccountId: number | undefined;
    if (accountId.trim() !== "") {
      const num = Number(accountId);
      if (!Number.isInteger(num) || num <= 0) {
        newErrors.account_id = "Account ID deve ser um número inteiro positivo";
      } else {
        parsedAccountId = num;
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
      api_token: apiToken,
      ...(parsedAccountId !== undefined && { account_id: parsedAccountId }),
    };
  }

  async function handleSave() {
    const data = validate();
    if (!data) return;

    setIsLoading(true);

    try {
      const result = await actionAtualizarConfig2FAuth(data);

      if (result.success) {
        toast.success("Configuração salva", {
          description: "A integração 2FAuth foi configurada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar", {
          description: result.error || "Não foi possível salvar a configuração.",
        });
      }
    } catch (error) {
      console.error("[TwoFAuthConfigForm] Erro ao salvar:", error);
      toast.error("Erro ao salvar", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleTest() {
    setIsTesting(true);

    try {
      const response = await fetch("/api/twofauth/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_url: apiUrl, api_token: apiToken }),
      });

      const data = await response.json();

      if (data.success && data.data.connected) {
        toast.success("Conexão bem-sucedida", {
          description: `Conectado como: ${data.data.user?.name || "Usuário"}`,
        });
      } else {
        toast.error("Falha na conexão", {
          description: data.data?.error || "Não foi possível conectar ao servidor 2FAuth.",
        });
      }
    } catch (error) {
      console.error("[TwoFAuthConfigForm] Erro ao testar:", error);
      toast.error("Erro ao testar", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    } finally {
      setIsTesting(false);
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="space-y-6">
      {/* Resumo de erros visível */}
      {hasErrors && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            Corrija os campos abaixo antes de salvar.
            {errors.api_url && <div>- {errors.api_url}</div>}
            {errors.api_token && <div>- {errors.api_token}</div>}
            {errors.account_id && <div>- {errors.account_id}</div>}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* URL da API */}
        <div className="space-y-2">
          <Label htmlFor="api_url">URL da API</Label>
          <Input
            id="api_url"
            type="text"
            placeholder="https://authenticator.example.com/api/v1"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
          />
          {errors.api_url && (
            <p className="text-sm text-destructive">{errors.api_url}</p>
          )}
        </div>

        {/* Token da API */}
        <div className="space-y-2">
          <Label htmlFor="api_token">Token da API</Label>
          <Input
            id="api_token"
            type="password"
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGc..."
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
          />
          {errors.api_token && (
            <p className="text-sm text-destructive">{errors.api_token}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Gere um Personal Access Token no seu servidor 2FAuth
          </p>
        </div>

        {/* Account ID (opcional) */}
        <div className="space-y-2">
          <Label htmlFor="account_id">Account ID (opcional)</Label>
          <Input
            id="account_id"
            type="number"
            placeholder="3"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
          {errors.account_id && (
            <p className="text-sm text-destructive">{errors.account_id}</p>
          )}
          <p className="text-xs text-muted-foreground">
            ID da conta padrão para operações automáticas
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isTesting || isLoading}
          className="flex-1"
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          Testar Conexão
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading || isTesting}
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
