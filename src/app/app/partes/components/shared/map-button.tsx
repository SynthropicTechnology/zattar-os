'use client';

/**
 * Botao reutilizavel para abrir endereco no Google Maps
 * Usado em todas as tabelas de partes
 */

import * as React from 'react';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MapButtonProps {
  address: string;
  label?: string;
  /** Se true, botão fica sempre visível. Se false, aparece apenas no hover do grupo pai */
  alwaysVisible?: boolean;
}

export function MapButton({ address, label = 'Abrir no Google Maps', alwaysVisible = false }: MapButtonProps) {
  const handleOpenMap = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Montar URL do Google Maps
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    // Abrir em nova aba
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  }, [address]);

  if (!address || address === '-') {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleOpenMap}
          title={label}
          className={cn(
            'inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted/50 transition-colors shrink-0',
            !alwaysVisible && 'opacity-0 group-hover:opacity-100'
          )}
        >
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="sr-only">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
