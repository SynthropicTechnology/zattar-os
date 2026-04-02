'use client';

/**
 * Célula de Contato reutilizável para tabelas de partes
 * Exibe telefone e e-mail com ícones e botões de cópia
 */

import * as React from 'react';
import { Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyButton } from './copy-button';

interface TelefoneData {
  ddd: string | null;
  numero: string | null;
}

interface ContatoCellProps {
  /** Telefones disponíveis (prioridade: celular > comercial > residencial) */
  telefones?: TelefoneData[];
  /** E-mail principal ou lista de e-mails */
  email?: string | null;
  emails?: string[] | null;
  /** Mostrar ícones (default: true) */
  showIcons?: boolean;
}

/**
 * Formata telefone no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
function formatarTelefone(ddd: string, numero: string): string {
  const dddLimpo = ddd.replace(/\D/g, '');
  const numeroLimpo = numero.replace(/\D/g, '');

  if (numeroLimpo.length === 9) {
    return `(${dddLimpo}) ${numeroLimpo.slice(0, 5)}-${numeroLimpo.slice(5)}`;
  }
  return `(${dddLimpo}) ${numeroLimpo.slice(0, 4)}-${numeroLimpo.slice(4)}`;
}

/**
 * Obtém o primeiro telefone válido da lista
 */
function obterTelefone(telefones?: TelefoneData[]): { formatado: string; raw: string } | null {
  if (!telefones || telefones.length === 0) return null;

  for (const tel of telefones) {
    if (tel.ddd && tel.numero) {
      return {
        formatado: formatarTelefone(tel.ddd, tel.numero),
        raw: `${tel.ddd}${tel.numero}`.replace(/\D/g, ''),
      };
    }
  }
  return null;
}

/**
 * Obtém o primeiro e-mail válido
 */
function obterEmail(email?: string | null, emails?: string[] | null): string | null {
  if (email) return email;
  if (Array.isArray(emails) && emails.length > 0) {
    return String(emails[0]);
  }
  return null;
}

export function ContatoCell({
  telefones,
  email,
  emails,
  showIcons = true,
}: ContatoCellProps) {
  const telefoneData = obterTelefone(telefones);
  const emailValue = obterEmail(email, emails);

  // Se não tem nenhum contato
  if (!telefoneData && !emailValue) {
    return (
      <div className="flex items-center justify-start text-muted-foreground">-</div>
    );
  }

  return (
    <div className="flex flex-col gap-1 max-w-full overflow-hidden group">
      {/* Linha 1: Telefone */}
      <div className="flex items-center gap-1.5 min-w-0">
        {showIcons && (
          <Phone
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              telefoneData ? 'text-muted-foreground' : 'text-muted-foreground/50'
            )}
          />
        )}
        <span
          className={cn(
            'text-sm whitespace-nowrap',
            !telefoneData && 'text-muted-foreground'
          )}
        >
          {telefoneData?.formatado || '-'}
        </span>
        {telefoneData && (
          <CopyButton text={telefoneData.raw} label="Copiar telefone" />
        )}
      </div>
      {/* Linha 2: E-mail */}
      <div className="flex items-center gap-1.5 min-w-0 w-full">
        {showIcons && (
          <Mail
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              emailValue ? 'text-muted-foreground' : 'text-muted-foreground/50'
            )}
          />
        )}
        <span
          className={cn('text-sm truncate', !emailValue && 'text-muted-foreground')}
          title={emailValue || undefined}
        >
          {emailValue ? emailValue.toLowerCase() : '-'}
        </span>
        {emailValue && <CopyButton text={emailValue} label="Copiar e-mail" />}
      </div>
    </div>
  );
}
