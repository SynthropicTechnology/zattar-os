'use client';

import { useEffect, useState } from 'react';
import { ApiReferenceReact } from '@scalar/api-reference-react';
import '@scalar/api-reference-react/style.css';
import { Code, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch('/api/docs/openapi.json');
        if (!response.ok) {
          throw new Error('Falha ao carregar especificação OpenAPI');
        }
        const data = await response.json();
        setSpec(JSON.stringify(data));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadSpec();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">API REST</h1>
          </div>
          <p className="text-muted-foreground">
            Documentação interativa da API REST do Synthropic
          </p>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">Carregando documentação...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Code className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">API REST</h1>
          </div>
          <p className="text-muted-foreground">
            Documentação interativa da API REST do Synthropic
          </p>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Erro ao carregar documentação</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Verifique se o servidor está rodando e tente novamente.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!spec) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Code className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">API REST</h1>
        </div>
        <p className="text-muted-foreground">
          Documentação interativa da API REST do Synthropic. Explore endpoints, teste requisições e veja exemplos.
        </p>
      </div>

      {/* API Reference */}
      <div className="border rounded-lg overflow-hidden bg-background">
        <ApiReferenceReact
          configuration={{
            content: spec,
            theme: 'default',
            layout: 'modern',
            hideModels: false,
            hideDownloadButton: false,
          }}
        />
      </div>
    </div>
  );
}
