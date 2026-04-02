"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Settings, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppBadge } from "@/components/ui/app-badge";
import { DyteConfigForm } from "./dyte-config-form";
import type { Integracao, DyteConfig } from "../domain";

interface DyteIntegrationCardProps {
  integracao?: Integracao | null;
}

export function DyteIntegrationCard({ integracao }: DyteIntegrationCardProps) {
  const router = useRouter();
  const [configOpen, setConfigOpen] = useState(false);

  const isConfigured = !!integracao;
  const isActive = integracao?.ativo ?? false;
  const config = integracao?.configuracao as DyteConfig | undefined;

  const handleConfigSuccess = () => {
    setConfigOpen(false);
    router.refresh();
  };

  const maskedOrgId = config?.org_id
    ? `${config.org_id.slice(0, 8)}...`
    : null;

  // Card não configurado
  if (!isConfigured) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Video className="h-10 w-10 mb-2 text-primary" />
          <CardTitle>Dyte</CardTitle>
          <CardDescription>
            Videoconferência e chamadas de áudio em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure a conexão com o Dyte para chamadas de vídeo e áudio no chat interno.
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
                <DialogTitle>Configuração Dyte</DialogTitle>
                <DialogDescription>
                  Configure a conexão com o Dyte para videoconferência e chamadas.
                </DialogDescription>
              </DialogHeader>
              <DyteConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
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
          <Video className="h-10 w-10 mb-2 text-primary" />
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
        <CardTitle>Dyte</CardTitle>
        <CardDescription>
          Videoconferência e chamadas de áudio em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {maskedOrgId && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono truncate">{maskedOrgId}</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {config?.enable_recording && (
            <AppBadge variant="outline">Gravação</AppBadge>
          )}
          {config?.enable_transcription && (
            <AppBadge variant="outline">Transcrição</AppBadge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setConfigOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>

        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Configuração Dyte</DialogTitle>
              <DialogDescription>
                Edite a configuração do Dyte.
              </DialogDescription>
            </DialogHeader>
            <DyteConfigForm integracao={integracao} onSuccess={handleConfigSuccess} />
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
