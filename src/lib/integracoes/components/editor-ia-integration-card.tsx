"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Settings, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppBadge } from "@/components/ui/app-badge";
import { EditorIAConfigForm } from "./editor-ia-config-form";
import type { Integracao, EditorIAConfig } from "../domain";
import { LABELS_AI_PROVIDER } from "../domain";

interface EditorIAIntegrationCardProps {
  integracao?: Integracao | null;
}

export function EditorIAIntegrationCard({ integracao }: EditorIAIntegrationCardProps) {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);

  const isConfigured = !!integracao;
  const isActive = integracao?.ativo ?? false;
  const config = integracao?.configuracao as EditorIAConfig | undefined;

  const handleConfigSuccess = () => {
    setConfigOpen(false);
    router.refresh();
  };

  const providerLabel = config?.provider ? LABELS_AI_PROVIDER[config.provider] : null;

  // Card não configurado
  if (!isConfigured) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Sparkles className="h-10 w-10 mb-2 text-primary" />
          <CardTitle>Editor de Texto IA</CardTitle>
          <CardDescription>
            Inteligência artificial para o editor de documentos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure o provedor de IA para gerar, editar e revisar textos jurídicos no editor.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" onClick={() => setConfigOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
          <Dialog open={configOpen} onOpenChange={setConfigOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Configuração Editor de Texto IA</DialogTitle>
                <DialogDescription>
                  Configure o provedor de IA para o editor de texto.
                </DialogDescription>
              </DialogHeader>
              <EditorIAConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>
    );
  }

  // Card configurado
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Sparkles className="h-10 w-10 mb-2 text-primary" />
          <AppBadge variant={isActive ? "success" : "secondary"}>
            {isActive ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                Inativo
              </>
            )}
          </AppBadge>
        </div>
        <CardTitle>Editor de Texto IA</CardTitle>
        <CardDescription>
          Inteligência artificial para o editor de documentos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {providerLabel && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{providerLabel}</span>
          </div>
        )}
        {config?.default_model && (
          <div className="flex flex-wrap gap-1.5">
            <AppBadge variant="outline">{config.default_model}</AppBadge>
          </div>
        )}
        <Button variant="link" className="h-auto p-0 text-sm" asChild>
          <Link href="/app/configuracoes?tab=prompts-ia">
            <ExternalLink className="h-3 w-3 mr-1" />
            Gerenciar Prompts do Editor
          </Link>
        </Button>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setConfigOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>

        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configuração Editor de Texto IA</DialogTitle>
              <DialogDescription>
                Edite a configuração do Editor de Texto IA.
              </DialogDescription>
            </DialogHeader>
            <EditorIAConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
