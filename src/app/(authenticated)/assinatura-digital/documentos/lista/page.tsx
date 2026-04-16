import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/shared/page-shell";
import * as documentosService from '@/shared/assinatura-digital/services/documentos.service';
import { DocumentosCommandCenter } from "./command-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Documentos de Assinatura Digital | Zattar Advogados",
  description: "Signature Command Center — pipeline visual de assinaturas",
};

function DocumentosLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-14 w-full rounded-2xl" />
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-48 ml-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ListaDocumentosPage() {
  let initialData: unknown[] = [];
  let initialStats: documentosService.DocumentosStats | undefined;

  try {
    const [resultado, stats] = await Promise.all([
      documentosService.listDocumentos({ limit: 200 }),
      documentosService.getDocumentosStats(),
    ]);
    initialData = resultado.documentos;
    initialStats = stats;
  } catch {
    // Fallback: client vai refetch no mount
  }

  return (
    <PageShell>
      <Suspense fallback={<DocumentosLoading />}>
        <DocumentosCommandCenter
          initialData={initialData as Parameters<typeof DocumentosCommandCenter>[0]["initialData"]}
          initialStats={initialStats}
        />
      </Suspense>
    </PageShell>
  );
}
