"use client";

/**
 * DyteConfigForm - Formulário de configuração do Dyte
 */

import { useState } from "react";
import { Loader2, Save, AlertCircle, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { actionAtualizarConfigDyte } from "../actions/integracoes-actions";
import type { DyteConfig, Integracao } from "../domain";

interface DyteConfigFormProps {
  integracao?: Integracao | null;
  onSuccess?: () => void;
}

export function DyteConfigForm({ integracao, onSuccess }: DyteConfigFormProps) {
  const existingConfig = integracao?.configuracao as DyteConfig | undefined;

  const [orgId, setOrgId] = useState(existingConfig?.org_id || "");
  const [apiKey, setApiKey] = useState(existingConfig?.api_key || "");
  const [enableRecording, setEnableRecording] = useState(existingConfig?.enable_recording ?? false);
  const [enableTranscription, setEnableTranscription] = useState(existingConfig?.enable_transcription ?? false);
  const [transcriptionLanguage, setTranscriptionLanguage] = useState(existingConfig?.transcription_language || "pt-BR");
  const [preferredRegion, setPreferredRegion] = useState(existingConfig?.preferred_region || "");

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): DyteConfig | null {
    const newErrors: Record<string, string> = {};

    if (!orgId.trim()) {
      newErrors.org_id = "Organization ID é obrigatório";
    } else if (orgId.trim().length < 5) {
      newErrors.org_id = "Organization ID deve ter no mínimo 5 caracteres";
    }

    if (!apiKey) {
      newErrors.api_key = "API Key é obrigatória";
    } else if (apiKey.length < 10) {
      newErrors.api_key = "API Key deve ter no mínimo 10 caracteres";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Campos inválidos", {
        description: "Verifique os campos destacados em vermelho.",
      });
      return null;
    }

    return {
      org_id: orgId.trim(),
      api_key: apiKey,
      enable_recording: enableRecording,
      enable_transcription: enableTranscription,
      transcription_language: transcriptionLanguage,
      ...(preferredRegion.trim() && { preferred_region: preferredRegion.trim() }),
    };
  }

  async function handleTestConnection() {
    setIsTesting(true);

    try {
      const response = await fetch("/api/dyte/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: orgId, api_key: apiKey }),
      });

      const result = await response.json();

      if (result.data?.connected) {
        toast.success("Conexão bem-sucedida", {
          description: "As credenciais Dyte são válidas.",
        });
      } else {
        toast.error("Falha na conexão", {
          description: result.data?.error || result.error || "Erro desconhecido",
        });
      }
    } catch (error) {
      console.error("[DyteConfigForm] Erro ao testar conexão:", error);
      toast.error("Falha na conexão", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
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
      const result = await actionAtualizarConfigDyte(data);

      if (result.success) {
        toast.success("Configuração salva", {
          description: "A integração Dyte foi configurada com sucesso.",
        });
        onSuccess?.();
      } else {
        toast.error("Erro ao salvar", {
          description: result.error || "Não foi possível salvar a configuração.",
        });
      }
    } catch (error) {
      console.error("[DyteConfigForm] Erro ao salvar:", error);
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

      {/* Credenciais da API */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Credenciais da API</h4>

        <div className="space-y-2">
          <Label htmlFor="dyte_org_id">Organization ID</Label>
          <Input
            id="dyte_org_id"
            type="text"
            placeholder="org_xxxxxxxxxxxxxxxxxx"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          />
          {errors.org_id && <p className="text-sm text-destructive">{errors.org_id}</p>}
          <p className="text-xs text-muted-foreground">
            Encontrado em Developer Portal &gt; Organization Settings
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dyte_api_key">API Key</Label>
          <Input
            id="dyte_api_key"
            type="password"
            placeholder="••••••••••••••••"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          {errors.api_key && <p className="text-sm text-destructive">{errors.api_key}</p>}
          <p className="text-xs text-muted-foreground">
            Obtenha em Developer Portal &gt; API Keys
          </p>
        </div>
      </div>

      <Separator />

      {/* Funcionalidades */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium">Funcionalidades</h4>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dyte_enable_recording">Habilitar Gravação</Label>
            <p className="text-xs text-muted-foreground">
              Grava as sessões de videoconferência automaticamente
            </p>
          </div>
          <Switch
            id="dyte_enable_recording"
            checked={enableRecording}
            onCheckedChange={setEnableRecording}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dyte_enable_transcription">Habilitar Transcrição</Label>
            <p className="text-xs text-muted-foreground">
              Gera transcrição de texto durante as sessões
            </p>
          </div>
          <Switch
            id="dyte_enable_transcription"
            checked={enableTranscription}
            onCheckedChange={setEnableTranscription}
          />
        </div>

        {enableTranscription && (
          <div className="space-y-2">
            <Label htmlFor="dyte_transcription_language">Idioma da Transcrição</Label>
            <Select
              value={transcriptionLanguage}
              onValueChange={setTranscriptionLanguage}
            >
              <SelectTrigger id="dyte_transcription_language">
                <SelectValue placeholder="Selecione o idioma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español (España)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="dyte_preferred_region">Região Preferida (opcional)</Label>
          <Input
            id="dyte_preferred_region"
            type="text"
            placeholder="ap-south-1"
            value={preferredRegion}
            onChange={(e) => setPreferredRegion(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Região de infraestrutura preferida para as sessões
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTestConnection}
          disabled={isTesting || !orgId || !apiKey}
        >
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4 mr-2" />
          )}
          Testar Conexão
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
    </div>
  );
}
