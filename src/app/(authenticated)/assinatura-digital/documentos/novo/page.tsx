import { Metadata } from "next";
import { PageShell } from "@/components/shared/page-shell";
import { NovoDocumentoClient } from "./client-page";

export const metadata: Metadata = {
  title: "Novo Documento | Assinatura Digital",
  description: "Enviar documento para assinatura digital",
};

export const dynamic = "force-dynamic";

export default function NovoDocumentoPage() {
  return (
    <PageShell>
      <NovoDocumentoClient />
    </PageShell>
  );
}
