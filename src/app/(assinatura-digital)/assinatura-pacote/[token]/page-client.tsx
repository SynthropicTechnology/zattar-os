'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Clock,
  AlertTriangle,
  XCircle,
  PartyPopper,
  ChevronRight,
} from 'lucide-react';
import { AmbientBackdrop } from '@/components/shared/ambient-backdrop';
import { GlassPanel } from '@/components/shared/glass-panel';
import { Heading, Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { AppBadge } from '@/components/ui/app-badge';
import type { PacoteComDocumentos } from '@/shared/assinatura-digital/types/pacote';

interface Props {
  pacote: PacoteComDocumentos;
}

/**
 * Estado terminal reutilizável — container com AmbientBackdrop, ícone
 * destacado em ring tintado, título display e descrição empática.
 */
function TerminalState({
  icon,
  iconTone,
  title,
  description,
  tint = 'primary',
}: {
  icon: React.ReactNode;
  iconTone: 'warning' | 'destructive' | 'success';
  title: string;
  description: string;
  tint?: 'primary' | 'success';
}) {
  const iconClasses = {
    warning: 'bg-warning/10 text-warning ring-warning/20',
    destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
    success: 'bg-success/10 text-success ring-success/20',
  }[iconTone];

  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-surface-dim p-4">
      <AmbientBackdrop blurIntensity={55} tint={tint} />
      <GlassPanel
        depth={2}
        className="relative z-10 max-w-md space-y-5 p-8 text-center sm:p-10"
      >
        <div className="flex justify-center">
          <span
            className={`inline-flex h-16 w-16 items-center justify-center rounded-2xl ring-1 ${iconClasses}`}
          >
            {icon}
          </span>
        </div>
        <div className="space-y-2">
          <Heading level="page" className="font-display text-2xl tracking-tight sm:text-3xl">
            {title}
          </Heading>
          <Text variant="caption" className="block text-muted-foreground leading-relaxed">
            {description}
          </Text>
        </div>
      </GlassPanel>
    </div>
  );
}

export function AssinaturaPacoteClient({ pacote }: Props) {
  const { documentos, status_efetivo, pacote: p } = pacote;

  const expiracao = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
    new Date(p.expira_em),
  );

  if (status_efetivo === 'expirado') {
    return (
      <TerminalState
        icon={<AlertTriangle className="h-7 w-7" strokeWidth={2} />}
        iconTone="warning"
        title="Link expirado"
        description="O prazo pra assinar este pacote de documentos já passou. Entre em contato com o escritório responsável pra receber um novo link."
      />
    );
  }

  if (status_efetivo === 'cancelado') {
    return (
      <TerminalState
        icon={<XCircle className="h-7 w-7" strokeWidth={2} />}
        iconTone="destructive"
        title="Link cancelado"
        description="Este pacote foi cancelado pelo escritório e não está mais disponível para assinatura. Entre em contato caso precise de esclarecimento."
      />
    );
  }

  if (status_efetivo === 'concluido') {
    return (
      <TerminalState
        icon={<PartyPopper className="h-7 w-7" strokeWidth={2} />}
        iconTone="success"
        title="Tudo pronto!"
        description="Todos os documentos deste pacote foram assinados com sucesso. Você pode fechar esta página com tranquilidade."
        tint="success"
      />
    );
  }

  // Lista de documentos — estado ativo
  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-surface-dim">
      <AmbientBackdrop blurIntensity={55} tint="primary" />

      <main className="relative z-10 mx-auto max-w-2xl space-y-6 px-4 py-10 sm:px-6 sm:py-14">
        <header className="space-y-3 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <FileText className="h-5 w-5" strokeWidth={2} />
          </span>
          <Heading level="page" className="font-display text-2xl tracking-tight sm:text-3xl">
            Documentos de contratação
          </Heading>
          <Text variant="caption" className="block text-muted-foreground">
            {documentos.length} documento{documentos.length === 1 ? '' : 's'} para assinar
          </Text>
        </header>

        {/* Info bar — expiração */}
        <div
          role="status"
          className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest/50 px-4 py-2.5 backdrop-blur-sm"
        >
          <Clock
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          />
          <Text variant="caption" className="text-muted-foreground">
            Expira em <span className="font-medium text-foreground">{expiracao}</span>
          </Text>
        </div>

        {/* Lista de documentos */}
        <ol className="space-y-3 list-none pl-0">
          {documentos.map((doc) => {
            const assinado = !!doc.assinado_em
            const pendente = !assinado
            return (
              <li key={doc.id}>
                <GlassPanel
                  depth={assinado ? 1 : 2}
                  className="flex items-center gap-4 p-4 sm:p-5"
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      assinado
                        ? 'bg-success/10 text-success ring-success/20'
                        : 'bg-primary/10 text-primary ring-primary/15'
                    }`}
                  >
                    {assinado ? (
                      <CheckCircle2 className="h-4 w-4" strokeWidth={2.25} />
                    ) : (
                      <FileText className="h-4 w-4" strokeWidth={2.25} />
                    )}
                  </span>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <Text variant="label" className="block truncate text-foreground">
                      {doc.ordem}. {doc.titulo ?? `Documento ${doc.ordem}`}
                    </Text>
                    {assinado ? (
                      <AppBadge variant="success" tone="soft">
                        Assinado em{' '}
                        {new Intl.DateTimeFormat('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        }).format(new Date(doc.assinado_em!))}
                      </AppBadge>
                    ) : (
                      <AppBadge variant="warning" tone="soft">
                        Pendente
                      </AppBadge>
                    )}
                  </div>
                  {pendente && doc.token_assinante && (
                    <Button
                      asChild
                      size="sm"
                      className="shrink-0 cursor-pointer active:scale-[0.98]"
                    >
                      <Link
                        href={`/assinatura/${doc.token_assinante}`}
                        className="inline-flex items-center gap-1"
                      >
                        Assinar
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </GlassPanel>
              </li>
            )
          })}
        </ol>

        <Text variant="caption" className="block text-center text-muted-foreground/80">
          Quando todos os documentos estiverem assinados, você pode fechar esta página.
        </Text>
      </main>
    </div>
  );
}
