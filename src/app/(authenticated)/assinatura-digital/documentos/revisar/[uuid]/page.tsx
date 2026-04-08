import { Suspense } from "react";
import { PageShell } from "@/components/shared/page-shell";
import { RevisarDocumentoClient } from "./client-page";

export const metadata = {
  title: "Revisar Documento | Assinatura Digital",
  description: "Revisar documento antes de enviar para assinatura",
};

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default async function RevisarDocumentoPage({ params }: PageProps) {
  const { uuid } = await params;

  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-100">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">
                Carregando revisão...
              </p>
            </div>
          </div>
        }
      >
        <RevisarDocumentoClient uuid={uuid} />
      </Suspense>
    </PageShell>
  );
}
