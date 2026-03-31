'use client';

/**
 * Botao reutilizavel para copiar texto para o clipboard
 * Usado em todas as tabelas de partes
 */

import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CopyButtonProps {
  text: string;
  label: string;
  /** Se true, botão fica sempre visível. Se false, aparece apenas no hover do grupo pai */
  alwaysVisible?: boolean;
}

export function CopyButton({ text, label, alwaysVisible = false }: CopyButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  }, [text]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleCopy}
          title={copied ? 'Copiado!' : label}
          className={cn(
            'inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted/50 transition-colors shrink-0',
            !alwaysVisible && 'opacity-0 group-hover:opacity-100'
          )}
        >
          {copied ? (
            <Check className="h-3 w-3 text-success" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground" />
          )}
          <span className="sr-only">{copied ? 'Copiado!' : label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {copied ? 'Copiado!' : label}
      </TooltipContent>
    </Tooltip>
  );
}
