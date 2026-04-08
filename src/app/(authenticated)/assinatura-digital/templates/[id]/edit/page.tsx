'use client';

/**
 * Template Editor Page - Integrado com Admin Layout
 *
 * REFATORAÇÃO COMPLETA (2025-01-10):
 * - Removido layout próprio (h-screen) para integração com AdminShell
 * - Estados de loading/error usando componentes Skeleton e design system
 * - Ícones e espaçamentos consistentes com padrão admin
 * - Responsividade mobile-first com grid system
 * - Tratamento de erros TypeScript-safe (unknown)
 */

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { FieldMappingEditor, type Template } from '../../../feature';
import { PageShell } from '@/components/shared/page-shell';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/typography';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissoes } from '@/providers/user-provider';

async function getTemplate(id: string): Promise<Template> {
  const response = await fetch(`/api/assinatura-digital/templates/${id}`, {
    cache: 'no-store',
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Template não encontrado.');
    if (response.status === 401) throw new Error('Sessão expirada. Redirecionando para login...');
    if (response.status === 403) throw new Error('Você não tem permissão para acessar este template.');
    throw new Error('Erro ao carregar template. Tente novamente.');
  }

  const result = await response.json();

  // Support both {success, data} and direct object shapes
  const template = result?.data ?? result;

  if (!template) {
    throw new Error('Resposta inválida do servidor.');
  }

  return template as Template;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditTemplatePage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { temPermissao, isLoading: isLoadingPermissoes } = usePermissoes();
  const canEdit = temPermissao('assinatura_digital', 'editar');

  // Shared auth error handler for DRY
  const handleAuthError = () => setTimeout(() => router.push('/app/login'), 2000);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip fetch while permissions are loading
    if (isLoadingPermissoes) {
      return;
    }

    // Skip fetch if user doesn't have edit permission
    if (!canEdit) {
      setLoading(false);
      return;
    }

    const fetchTemplate = async () => {
      try {
        // Validar ID antes de fazer a requisição
        if (!id || id === 'undefined' || id === 'null' || id === '') {
          throw new Error('ID de template inválido. Retorne à lista de templates e tente novamente.');
        }

        setLoading(true);
        setError(null);
        const fetchedTemplate = await getTemplate(id);
        setTemplate(fetchedTemplate);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
        setError(message);
        toast.error(message);

        if (message.includes('Sessão expirada')) {
          handleAuthError();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router, isLoadingPermissoes, canEdit]);

  const handleRetry = () => {
    setError(null);
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedTemplate = await getTemplate(id);
        setTemplate(fetchedTemplate);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Ocorreu um erro desconhecido';
        setError(message);
        toast.error(message);

        if (message.includes('Sessão expirada')) {
          handleAuthError();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTemplate();
  };

  if (loading || isLoadingPermissoes) {
    return (
      <PageShell>
        <div className="h-full flex flex-col gap-6">
          <div className="shrink-0 space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>

            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (!isLoadingPermissoes && !canEdit) {
    return (
      <PageShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <Heading level="card" className="text-lg text-foreground">
                Acesso negado
              </Heading>
              <p className="text-sm text-muted-foreground">
                Você não tem permissão para editar templates.
              </p>
            </div>
            <Button onClick={() => router.push('/app/assinatura-digital/templates')} variant="outline">
              Voltar para lista
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-3">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div className="space-y-2">
              <Heading level="card" className="text-lg text-foreground">
                Erro ao carregar template
              </Heading>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <PageShell>
      <FieldMappingEditor
        template={template}
        onCancel={() => router.push('/app/assinatura-digital/templates')}
      />
    </PageShell>
  );
}
