'use client';

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TimelineNowMarkerProps {
  className?: string;
}

export const TimelineNowMarker = forwardRef<HTMLDivElement, TimelineNowMarkerProps>(
  function TimelineNowMarker({ className }, ref) {
    const hoje = format(new Date(), "dd MMM yyyy", { locale: ptBR });

    return (
      <div
        ref={ref}
        role="separator"
        aria-label="Momento atual"
        className={cn('py-3 px-2', className)}
      >
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-linear-to-r from-transparent via-primary/25 to-primary/25" />
          <div className="flex items-center gap-2 rounded-lg bg-primary/6 border border-primary/15 px-3 py-1.5">
            <div className="size-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider">
              Hoje — {hoje}
            </span>
          </div>
          <div className="h-px flex-1 bg-linear-to-l from-transparent via-primary/25 to-primary/25" />
        </div>
      </div>
    );
  }
);
