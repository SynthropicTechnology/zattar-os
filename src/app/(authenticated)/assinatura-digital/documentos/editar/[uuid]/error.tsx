'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Heading } from '@/components/ui/typography';

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('[EditarDocumento] Erro de renderização:', error);
    }, [error]);

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background p-4">
            <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
            </div>

            <div className="text-center space-y-2 max-w-md">
                <Heading level="section" className="text-2xl tracking-tight">Algo deu errado!</Heading>
                <p className="text-muted-foreground">
                    Não foi possível carregar o editor de documentos.
                </p>

                {error.digest && (
                    <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs text-left overflow-auto max-h-32">
                        <p className="font-semibold text-foreground mb-1">Código do erro (Digest):</p>
                        <p className="text-muted-foreground select-all">{error.digest}</p>
                    </div>
                )}

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 rounded-md bg-destructive/10 p-3 text-left overflow-auto max-h-48 text-xs">
                        <p className="font-semibold text-destructive mb-1">Detalhes (Dev):</p>
                        <p className="whitespace-pre-wrap text-destructive/80 font-mono">{error.message}</p>
                        {error.stack && (
                            <details className="mt-2">
                                <summary className="cursor-pointer font-semibold text-destructive/90">Stack Trace</summary>
                                <pre className="mt-1 whitespace-pre p-2 overflow-auto text-[10px]">{error.stack}</pre>
                            </details>
                        )}
                    </div>
                )}
            </div>

            <div className="flex gap-2 mt-6">
                <Button variant="outline" onClick={() => window.location.href = '/app/assinatura-digital/documentos'}>
                    Voltar para Lista
                </Button>
                <Button onClick={() => reset()}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Tentar Novamente
                </Button>
            </div>
        </div>
    );
}
