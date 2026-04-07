'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { isServerActionVersionMismatch } from '@/lib/server-action-error-handler';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isReloading, setIsReloading] = useState(false);
  const isVersionMismatch = isServerActionVersionMismatch(error);

  useEffect(() => {
    // No futuro, podemos logar o erro para um serviço como Sentry
    console.error(error);

    // Auto-reload após 5 segundos para erros de versão
    if (isVersionMismatch) {
      const timer = setTimeout(() => {
        setIsReloading(true);
        window.location.reload();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, isVersionMismatch]);

  if (isVersionMismatch) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex animate-in flex-col items-center gap-4 text-center zoom-in-95 fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-info/10">
            <RefreshCw className={`h-10 w-10 text-info ${isReloading ? 'animate-spin' : ''}`} />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Nova versão disponível
            </h1>
            <p className="max-w-md text-muted-foreground">
              O sistema foi atualizado. A página será recarregada automaticamente em alguns segundos.
            </p>
          </div>
          <Button
            onClick={() => {
              setIsReloading(true);
              window.location.reload();
            }}
            disabled={isReloading}
          >
            {isReloading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Recarregando...
              </>
            ) : (
              'Recarregar agora'
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <div className="flex animate-in flex-col items-center gap-4 text-center zoom-in-95 fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Oops! Algo deu errado.
          </h1>
          <p className="max-w-md text-muted-foreground">
            Ocorreu um erro inesperado. Você pode tentar recarregar a página ou voltar para o início.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Button asChild>
            <a href="/app/dashboard">Ir para o Início</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
