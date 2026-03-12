'use client';

import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventSignatureInfoProps {
  signatario?: string;
  isSigiloso?: boolean;
}

/**
 * Exibe informações de assinatura digital e/ou sigilo do documento.
 * Retorna null quando nenhuma das condições se aplica.
 *
 * @example
 * <EventSignatureInfo signatario="João da Silva" isSigiloso={false} />
 */
export function EventSignatureInfo({
  signatario,
  isSigiloso,
}: EventSignatureInfoProps) {
  // Não renderiza se não houver informação relevante
  if (!signatario && !isSigiloso) {
    return null;
  }

  return (
    <div className="px-6 py-5 border-b bg-muted/30">
      <div className="flex flex-col gap-3">
        {/* Assinatura digital */}
        {signatario && (
          <div className="flex items-center gap-3">
            {/* Ícone com círculo verde */}
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center shrink-0',
                'bg-green-100/50 text-green-600 border border-green-200/50',
                'dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50'
              )}
            >
              <CheckCircle2 className="size-4" />
            </div>

            {/* Texto da assinatura */}
            <div>
              <p className="text-[13px] font-medium leading-tight">
                Assinado digitalmente por
              </p>
              <p className="text-[13px] text-muted-foreground font-normal leading-tight mt-0.5">
                {signatario}
              </p>
            </div>
          </div>
        )}

        {/* Aviso de sigilo */}
        {isSigiloso && (
          <div className="flex items-center gap-3">
            {/* Ícone com círculo âmbar */}
            <div
              className={cn(
                'size-8 rounded-full flex items-center justify-center shrink-0',
                'bg-amber-100/50 text-amber-600 border border-amber-200/50',
                'dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
              )}
            >
              <ShieldAlert className="size-4" />
            </div>

            {/* Texto do sigilo */}
            <div>
              <p className="text-[13px] font-medium leading-tight">
                Documento sigiloso — acesso restrito
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
