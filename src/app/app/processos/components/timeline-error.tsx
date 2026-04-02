/**
 * Timeline Error State
 *
 * Exibe mensagens de erro com opção de retry.
 */

'use client';

import { AlertTriangle, RotateCw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TimelineErrorProps {
  error: Error;
  onRetry: () => void;
  message?: string;
}

export function TimelineError({ error, onRetry, message }: TimelineErrorProps) {
  const router = useRouter();

  // Determinar tipo de erro e mensagem apropriada
  const getErrorDetails = (error: Error) => {
    const message = error.message.toLowerCase();

    if (message.includes('processo não encontrado')) {
      return {
        title: 'Processo Não Encontrado',
        description:
          'Este processo não foi encontrado no sistema. Verifique se o ID está correto.',
        canRetry: false,
      };
    }

    if (message.includes('autenticação') || message.includes('credenciais')) {
      return {
        title: 'Erro de Autenticação',
        description:
          'Não foi possível autenticar no PJE com as credenciais do advogado. Verifique se as credenciais estão corretas e atualizadas.',
        canRetry: true,
      };
    }

    if (message.includes('timeout')) {
      return {
        title: 'Timeout na Captura',
        description:
          'A captura está demorando mais que o esperado. A operação pode estar em andamento. Recarregue a página em alguns minutos.',
        canRetry: true,
      };
    }

    if (message.includes('advogado não configurado')) {
      return {
        title: 'Configuração Incompleta',
        description: error.message,
        canRetry: false,
      };
    }

    // Erro genérico
    return {
      title: 'Erro ao Carregar Timeline',
      description: 'Ocorreu um erro ao carregar a timeline do processo. Tente novamente.',
      canRetry: true,
    };
  };

  const { title, description, canRetry } = getErrorDetails(error);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {message && <p className="font-medium">{message}</p>}
            <p>{description}</p>

            {/* Detalhes técnicos (colapsível) */}
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-x-auto">
                {error.message}
              </pre>
            </details>
          </AlertDescription>
        </Alert>

        {/* Ações */}
        <div className="flex gap-3 mt-6">
          {canRetry && (
            <Button onClick={onRetry} className="gap-2">
              <RotateCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => router.push('/processos')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Processos
          </Button>
        </div>
      </Card>
    </div>
  );
}
