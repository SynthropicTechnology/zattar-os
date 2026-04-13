'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GazetteAlertBannerProps {
  count: number;
  descricao: string;
  onVerPrazos: () => void;
}

export function GazetteAlertBanner({ count, descricao, onVerPrazos }: GazetteAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || count === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2.5',
        'bg-destructive/4 border-b border-destructive/10',
      )}
    >
      {/* Icon */}
      <div className="flex shrink-0 items-center justify-center rounded-lg bg-destructive/10 p-1.5">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-medium leading-none text-destructive">
          {count} prazo{count !== 1 ? 's' : ''} crítico{count !== 1 ? 's' : ''}
        </p>
        <p className="mt-0.5 text-[11px] leading-tight text-destructive/50">{descricao}</p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onVerPrazos}
          className="h-7 border-destructive/30 px-3 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Ver Prazos
        </Button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex h-6 w-6 items-center justify-center rounded text-destructive/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label="Fechar alerta"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
