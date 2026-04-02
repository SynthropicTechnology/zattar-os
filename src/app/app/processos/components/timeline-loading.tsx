/**
 * Timeline Loading State
 *
 * Exibe skeleton e mensagens contextuais durante carregamento ou captura.
 */

'use client';

import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface TimelineLoadingProps {
  message?: string;
  isCapturing?: boolean;
  embedded?: boolean;
}

export function TimelineLoading({
  message = 'Carregando processo...',
  isCapturing = false,
  embedded = false,
}: TimelineLoadingProps) {
  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.36fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border bg-muted/20 p-4 space-y-3">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-2">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="rounded-xl border bg-background p-3 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-muted/10 p-5 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="rounded-2xl border bg-background p-5 space-y-4 min-h-120">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card px-6 py-8">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-base font-medium">{message}</p>
              {isCapturing && (
                <>
                  <Progress value={undefined} className="w-64 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Você pode seguir navegando. A captura continua integrada ao workspace.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </Card>

      {/* Timeline Loading Message */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <div className="text-center space-y-2">
            <p className="text-base font-medium">{message}</p>
            {isCapturing && (
              <>
                <Progress value={undefined} className="w-64 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Você pode navegar para outras páginas. A captura continuará em segundo
                  plano.
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Timeline Items Skeleton (apenas se não estiver capturando) */}
      {!isCapturing && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="w-0.5 h-20 bg-border" />
              </div>
              <Card className="flex-1 p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
