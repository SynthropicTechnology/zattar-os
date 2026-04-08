/**
 * Página de listagem de documentos e arquivos
 * /documentos
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { FileManager } from '@/app/(authenticated)/documentos';
import { PageShell } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Documentos | Synthropic',
  description: 'Gerencie seus documentos e arquivos',
};

export default function DocumentosPage() {
  return (
    <PageShell>
      <Suspense fallback={<FileManagerSkeleton />}>
        <FileManager />
      </Suspense>
    </PageShell>
  );
}

function FileManagerSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="space-y-2 rounded-lg border p-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
