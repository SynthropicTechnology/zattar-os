"use client";

/**
 * TwoFAuthIntegrationCard - Card de integração do 2FAuth
 * Exibe status, informações da conta conectada e permite gerenciar a integração
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Settings, CheckCircle, XCircle, ExternalLink, Globe } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppBadge } from "@/components/ui/app-badge";
import { TwoFAuthConfigForm } from "./twofauth-config-form";
import { TwoFAuthConfigContent } from "@/lib/twofauth";
import type { Integracao, TwoFAuthConfig } from "../domain";

interface TwoFAuthIntegrationCardProps {
  integracao?: Integracao | null;
}

export function TwoFAuthIntegrationCard({ integracao }: TwoFAuthIntegrationCardProps) {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);

  const isConfigured = !!integracao;
  const isActive = integracao?.ativo ?? false;
  const config = integracao?.configuracao as TwoFAuthConfig | undefined;

  // Após salvar configuração: fecha dialog e recarrega dados do servidor
  const handleConfigSuccess = () => {
    setConfigOpen(false);
    router.refresh();
  };

  // Extrair hostname da URL da API para exibição
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
          <KeyRound className="h-10 w-10 mb-2 text-primary" />
          <CardTitle>2FAuth</CardTitle>
          <CardDescription>
            Autenticação de dois fatores para acesso a tribunais e sistemas externos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure a conexão com seu servidor 2FAuth para gerenciar tokens de autenticação.
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
                <DialogTitle>Configuração 2FAuth</DialogTitle>
                <DialogDescription>
                  Configure a conexão com seu servidor 2FAuth para gerenciar tokens de autenticação de dois fatores.
                </DialogDescription>
              </DialogHeader>
              <TwoFAuthConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
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
          <KeyRound className="h-10 w-10 mb-2 text-primary" />
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
        <CardTitle>2FAuth</CardTitle>
        <CardDescription>
          Autenticação de dois fatores para acesso a tribunais e sistemas externos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Info do servidor conectado */}
        {apiHost && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4 shrink-0" />
            <span className="truncate">{apiHost}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        {/* Botão principal: Ver Contas */}
        <Button variant="outline" className="flex-1" onClick={() => setAccountsOpen(true)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Ver Contas
        </Button>

        {/* Botão secundário: Configurações */}
        <Button variant="outline" size="icon" onClick={() => setConfigOpen(true)}>
          <Settings className="h-4 w-4" />
        </Button>

        {/* Dialog: Ver Contas 2FA */}
        <Dialog open={accountsOpen} onOpenChange={setAccountsOpen}>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Contas 2FAuth</DialogTitle>
              <DialogDescription>
                Gerencie suas contas de autenticação de dois fatores e gere códigos OTP.
              </DialogDescription>
            </DialogHeader>
            <TwoFAuthConfigContent />
          </DialogContent>
        </Dialog>

        {/* Dialog: Configurações */}
        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configuração 2FAuth</DialogTitle>
              <DialogDescription>
                Edite a conexão com seu servidor 2FAuth.
              </DialogDescription>
            </DialogHeader>
            <TwoFAuthConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
