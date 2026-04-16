'use client';

import Link from 'next/link';
import { CheckCircle2, FileText, Clock, AlertTriangle } from 'lucide-react';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import type { PacoteComDocumentos } from '@/shared/assinatura-digital/types/pacote';

interface Props {
  pacote: PacoteComDocumentos;
}

export function AssinaturaPacoteClient({ pacote }: Props) {
  const { documentos, status_efetivo, pacote: p } = pacote;

  const expiracao = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
    new Date(p.expira_em),
  );

  if (status_efetivo === 'expirado') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <GlassPanel depth={2} className="max-w-md p-6 text-center space-y-3">
          <AlertTriangle className="size-12 text-warning mx-auto" />
          <Heading level="card">Link expirado</Heading>
          <Text variant="label" className="text-muted-foreground">
            Este link expirou. Entre em contato com o escritório para um novo.
          </Text>
        </GlassPanel>
      </main>
    );
  }

  if (status_efetivo === 'cancelado') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <GlassPanel depth={2} className="max-w-md p-6 text-center space-y-3">
          <AlertTriangle className="size-12 text-destructive mx-auto" />
          <Heading level="card">Link cancelado</Heading>
          <Text variant="label" className="text-muted-foreground">
            Este link foi cancelado. Entre em contato com o escritório.
          </Text>
        </GlassPanel>
      </main>
    );
  }

  if (status_efetivo === 'concluido') {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <GlassPanel depth={2} className="max-w-md p-6 text-center space-y-3">
          <CheckCircle2 className="size-12 text-success mx-auto" />
          <Heading level="card">Todos os documentos foram assinados</Heading>
          <Text variant="label" className="text-muted-foreground">
            Obrigado. Você pode fechar esta página.
          </Text>
        </GlassPanel>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Heading level="page">Documentos de Contratação</Heading>
        <Text variant="label" className="text-muted-foreground">
          {documentos.length} documento{documentos.length === 1 ? '' : 's'} para assinar
        </Text>
      </div>

      <GlassPanel depth={1} className="p-4 flex items-center justify-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <Text variant="caption" className="text-muted-foreground">
          Expira em {expiracao}
        </Text>
      </GlassPanel>

      <ol className="space-y-3 list-none pl-0">
        {documentos.map((doc) => (
          <li key={doc.id}>
            <GlassPanel depth={2} className="p-4 flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <Text variant="label" className="font-medium">
                    {doc.ordem}. {doc.titulo ?? `Documento ${doc.ordem}`}
                  </Text>
                </div>
                {doc.assinado_em ? (
                  <AppBadge variant="success" tone="soft">
                    Assinado em{' '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(doc.assinado_em))}
                  </AppBadge>
                ) : (
                  <AppBadge variant="warning" tone="soft">
                    Pendente
                  </AppBadge>
                )}
              </div>
              {!doc.assinado_em && doc.token_assinante && (
                <Button asChild size="sm">
                  <Link href={`/assinatura/${doc.token_assinante}`}>Assinar</Link>
                </Button>
              )}
            </GlassPanel>
          </li>
        ))}
      </ol>

      <Text variant="caption" className="text-muted-foreground text-center block">
        Quando todos os documentos estiverem assinados, você pode fechar esta página.
      </Text>
    </main>
  );
}
