'use client';

/**
 * Componente que exibe cursores remotos de colaboradores
 * Mostra indicadores visuais de onde outros usuários estão trabalhando
 */

import * as React from 'react';
import type { RemoteCursor } from '@/hooks/use-realtime-collaboration';

interface RemoteCursorsOverlayProps {
  cursors: RemoteCursor[];
}

export function RemoteCursorsOverlay({ cursors }: RemoteCursorsOverlayProps) {
  if (cursors.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {cursors.map((cursor) => (
        <RemoteCursorIndicator key={cursor.userId} cursor={cursor} />
      ))}
    </div>
  );
}

interface RemoteCursorIndicatorProps {
  cursor: RemoteCursor;
}

function RemoteCursorIndicator({ cursor }: RemoteCursorIndicatorProps) {
  // O indicador é exibido como um pequeno badge flutuante
  // A posição exata do cursor seria calculada pelo editor Plate
  // Por ora, mostramos apenas um indicador de que o usuário está ativo

  return (
    <div
      className="absolute top-2 left-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white shadow-md animate-pulse"
      style={{ backgroundColor: cursor.color }}
    >
      <span className="h-2 w-2 rounded-full bg-white/80" />
      <span>{cursor.userName}</span>
    </div>
  );
}
