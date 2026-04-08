import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getDocumentoByUuid,
  getAssinaturaById,
} from "../../feature/services/documentos.service";
import type {
  DocumentoVerificacaoData,
  SignatarioVerificacaoData,
} from "../../feature/types/types";
import { DocumentoVerificacaoClient } from "./client-page";
import { PageShell } from "@/components/shared/page-shell";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Verificação de Documento | Assinatura Digital",
  description: "Painel de verificação e visualização de dados da assinatura",
};

/**
 * Normaliza dados de um documento upload-based para o formato unificado.
 */
function normalizeDocumento(
  doc: Awaited<ReturnType<typeof getDocumentoByUuid>>
): DocumentoVerificacaoData {
  if (!doc) throw new Error("Documento não encontrado");

  const signatarios: SignatarioVerificacaoData[] = doc.assinantes.map((a) => ({
    id: a.id,
    tipo: a.assinante_tipo,
    nome: (a.dados_snapshot?.nome_completo as string) ?? (a.dados_snapshot?.nome as string),
    cpf: a.dados_snapshot?.cpf as string | undefined,
    email: a.dados_snapshot?.email as string | undefined,
    telefone: a.dados_snapshot?.telefone as string | undefined,
    status: a.status,
    concluidoEm: a.concluido_em ?? null,
    token: a.token,
    publicLink: a.public_link,
    assinaturaUrl: a.assinatura_url ?? null,
    selfieUrl: a.selfie_url ?? null,
    rubricaUrl: a.rubrica_url ?? null,
    ipAddress: a.ip_address ?? null,
    userAgent: a.user_agent ?? null,
    geolocation: a.geolocation
      ? {
          latitude: (a.geolocation as Record<string, unknown>).latitude as number | null,
          longitude: (a.geolocation as Record<string, unknown>).longitude as number | null,
          accuracy: (a.geolocation as Record<string, unknown>).accuracy as number | null,
          timestamp: (a.geolocation as Record<string, unknown>).timestamp as string | null,
        }
      : null,
    dispositivoFingerprint: a.dispositivo_fingerprint_raw ?? null,
    termosAceiteVersao: a.termos_aceite_versao ?? null,
    termosAceiteData: a.termos_aceite_data ?? null,
  }));

  return {
    tipo: "documento",
    id: doc.documento.id,
    uuid: doc.documento.documento_uuid,
    titulo: doc.documento.titulo || `Documento #${doc.documento.id}`,
    status: doc.documento.status,
    pdfUrl: doc.documento.pdf_final_url || doc.documento.pdf_original_url,
    pdfOriginalUrl: doc.documento.pdf_original_url,
    pdfFinalUrl: doc.documento.pdf_final_url ?? null,
    hashOriginal: doc.documento.hash_original_sha256 ?? null,
    hashFinal: doc.documento.hash_final_sha256 ?? null,
    createdAt: doc.documento.created_at || new Date().toISOString(),
    selfieHabilitada: doc.documento.selfie_habilitada,
    signatarios,
  };
}

/**
 * Normaliza dados de uma assinatura de formulário para o formato unificado.
 */
function normalizeAssinatura(
  ass: Awaited<ReturnType<typeof getAssinaturaById>>
): DocumentoVerificacaoData {
  if (!ass) throw new Error("Assinatura não encontrada");

  const clienteNome = ass.clientes?.nome ?? null;
  const clienteCpf = ass.clientes?.cpf ?? null;
  const clienteEmail = ass.clientes?.emails ?? null;
  const clienteTelefone =
    ass.clientes?.ddd_celular && ass.clientes?.numero_celular
      ? `(${ass.clientes.ddd_celular}) ${ass.clientes.numero_celular}`
      : null;

  // No fluxo de formulário, o "signatário" é o próprio cliente
  const signatario: SignatarioVerificacaoData = {
    id: ass.id,
    tipo: "cliente",
    nome: clienteNome ?? undefined,
    cpf: clienteCpf ?? undefined,
    email: clienteEmail ?? undefined,
    telefone: clienteTelefone ?? undefined,
    status: ass.status === "concluida" || ass.status === "concluido" ? "concluido" : ass.status,
    concluidoEm: ass.data_assinatura ?? null,
    assinaturaUrl: ass.assinatura_url ?? null,
    selfieUrl: ass.foto_url ?? null,
    ipAddress: ass.ip_address ?? null,
    userAgent: ass.user_agent ?? null,
    geolocation:
      ass.latitude != null
        ? {
            latitude: ass.latitude,
            longitude: ass.longitude,
            accuracy: ass.geolocation_accuracy,
            timestamp: ass.geolocation_timestamp,
          }
        : null,
    dispositivoFingerprint: ass.dispositivo_fingerprint_raw ?? null,
    termosAceiteVersao: ass.termos_aceite_versao ?? null,
    termosAceiteData: ass.termos_aceite_data ?? null,
  };

  const statusNorm =
    ass.status === "concluida" || ass.status === "concluido"
      ? "concluido"
      : ass.status === "cancelada" || ass.status === "cancelado"
        ? "cancelado"
        : ass.status;

  return {
    tipo: "formulario",
    id: ass.id,
    uuid: `ass-${ass.id}`,
    titulo: clienteNome
      ? `Contrato Assinado - ${clienteNome}`
      : `Contrato Assinado - ${ass.protocolo}`,
    status: statusNorm,
    pdfUrl: ass.pdf_url,
    pdfOriginalUrl: ass.pdf_url,
    pdfFinalUrl: null,
    hashOriginal: ass.hash_original_sha256 ?? null,
    hashFinal: ass.hash_final_sha256 ?? null,
    createdAt: ass.data_assinatura || ass.created_at,
    protocolo: ass.protocolo,
    clienteNome,
    clienteCpf,
    signatarios: [signatario],
  };
}

export default async function DocumentoVerificacaoPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  const isFormulario = uuid.startsWith("ass-");

  let data: DocumentoVerificacaoData;

  try {
    if (isFormulario) {
      const id = Number(uuid.replace("ass-", ""));
      if (Number.isNaN(id)) notFound();
      const assinatura = await getAssinaturaById(id);
      if (!assinatura) notFound();
      data = normalizeAssinatura(assinatura);
    } else {
      const documento = await getDocumentoByUuid(uuid);
      if (!documento) notFound();
      data = normalizeDocumento(documento);
    }
  } catch {
    notFound();
  }

  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="flex h-96 w-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Carregando verificação...
              </p>
            </div>
          </div>
        }
      >
        <DocumentoVerificacaoClient data={data} />
      </Suspense>
    </PageShell>
  );
}
