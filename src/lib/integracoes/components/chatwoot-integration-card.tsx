"use client";

/**
 * ChatwootIntegrationCard - Card de integração do Chatwoot
 * Exibe status, informações da conexão e permite gerenciar a integração
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Settings, CheckCircle, XCircle, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppBadge } from "@/components/ui/app-badge";
import { ChatwootConfigForm } from "./chatwoot-config-form";
import type { Integracao, ChatwootConfig } from "../domain";

interface ChatwootIntegrationCardProps {
  integracao?: Integracao | null;
}

export function ChatwootIntegrationCard({ integracao }: ChatwootIntegrationCardProps) {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);

  const isConfigured = !!integracao;
  const isActive = integracao?.ativo ?? false;
  const config = integracao?.configuracao as ChatwootConfig | undefined;

  const handleConfigSuccess = () => {
    setConfigOpen(false);
    router.refresh();
  };

  const apiHost = (() => {
    if (!config?.api_url) return null;
    try {
      return new URL(config.api_url).hostname;
    } catch {
      return config.api_url;
    }
  })();

  // Card não configurado
  if (!isConfigured) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <MessageCircle className="h-10 w-10 mb-2 text-primary" />
          <CardTitle>Chatwoot</CardTitle>
          <CardDescription>
            Sistema de atendimento e chatbot para comunicação com clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure a conexão com seu servidor Chatwoot para atendimento ao vivo e chatbot.
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
                <DialogTitle>Configuração Chatwoot</DialogTitle>
                <DialogDescription>
                  Configure a conexão com seu servidor Chatwoot para atendimento e chatbot.
                </DialogDescription>
              </DialogHeader>
              <ChatwootConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
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
          <MessageCircle className="h-10 w-10 mb-2 text-primary" />
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
        <CardTitle>Chatwoot</CardTitle>
        <CardDescription>
          Sistema de atendimento e chatbot para comunicação com clientes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {apiHost && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="truncate">{apiHost}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setConfigOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>

        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configuração Chatwoot</DialogTitle>
              <DialogDescription>
                Edite a conexão com seu servidor Chatwoot.
              </DialogDescription>
            </DialogHeader>
            <ChatwootConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
