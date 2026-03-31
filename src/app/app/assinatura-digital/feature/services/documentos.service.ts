import { randomBytes, randomUUID } from "crypto";
import { PDFDocument, type PDFImage } from "pdf-lib";
import { createServiceClient } from "@/lib/supabase/service-client";
import { uploadToBackblaze } from "@/lib/storage/backblaze-b2.service";
import { calculateHash } from "../services/integrity.service";
import { decodeDataUrlToBuffer } from "../services/base64";
import { downloadFromStorageUrl } from "../services/signature";
import {
  TABLE_DOCUMENTOS,
  TABLE_DOCUMENTO_ASSINANTES,
  TABLE_DOCUMENTO_ANCORAS,
} from "./constants";
import {
  calculateTokenExpiration,
  calculatePostSignatureExpiration,
} from "../utils/token-expiration";
import type {
  AssinaturaDigitalDocumento,
  AssinaturaDigitalDocumentoAssinante,
  AssinaturaDigitalDocumentoAncora,
  AssinaturaDigitalDocumentoAssinanteTipo,
  CreateAssinaturaDigitalDocumentoAssinanteInput,
  CreateAssinaturaDigitalDocumentoInput,
  UpsertAssinaturaDigitalDocumentoAncoraInput,
} from "../types/types";

function buildPublicLink(token: string): string {
  return `/assinatura/${token}`;
}

function generateOpaqueToken(): string {
  // 32 bytes -> 64 chars hex (não enumerável e suficientemente imprevisível)
  return randomBytes(32).toString("hex");
}

async function fetchAssinanteSnapshot(
  tipo: AssinaturaDigitalDocumentoAssinanteTipo,
  entidadeId?: number | null
): Promise<Record<string, unknown>> {
  if (!entidadeId || tipo === "convidado") return {};

  const supabase = createServiceClient();

  // Normalização do snapshot para a jornada pública
  // (evita dependência das tabelas externas no link público)
  if (tipo === "cliente") {
    const { data } = await supabase
      .from("clientes")
      .select("id, nome, cpf, cnpj, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      Array.isArray(data.emails) && data.emails.length > 0
        ? data.emails[0]
        : null;
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      cnpj: data.cnpj ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "parte_contraria") {
    const { data } = await supabase
      .from("partes_contrarias")
      .select("id, nome, cpf, cnpj, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      Array.isArray(data.emails) && data.emails.length > 0
        ? data.emails[0]
        : null;
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      cnpj: data.cnpj ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "representante") {
    const { data } = await supabase
      .from("representantes")
      .select("id, nome, cpf, email, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      data.email ??
      (Array.isArray(data.emails) && data.emails.length > 0
        ? data.emails[0]
        : null);
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "terceiro") {
    const { data } = await supabase
      .from("terceiros")
      .select("id, nome, cpf, cnpj, emails, ddd_celular, numero_celular")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    const email =
      Array.isArray(data.emails) && data.emails.length > 0
        ? data.emails[0]
        : null;
    const telefone =
      data.ddd_celular && data.numero_celular
        ? `${data.ddd_celular}${data.numero_celular}`
        : null;

    return {
      entidade_id: data.id,
      nome_completo: data.nome,
      cpf: data.cpf ?? null,
      cnpj: data.cnpj ?? null,
      email: email ?? null,
      telefone: telefone ?? null,
    };
  }

  if (tipo === "usuario") {
    const { data } = await supabase
      .from("usuarios")
      .select("id, nome_completo, cpf, email_corporativo, telefone")
      .eq("id", entidadeId)
      .single();

    if (!data) return {};
    return {
      entidade_id: data.id,
      nome_completo: data.nome_completo,
      cpf: data.cpf ?? null,
      email: data.email_corporativo ?? null,
      telefone: data.telefone ?? null,
    };
  }

  return {};
}

export async function createDocumentoFromUploadedPdf(params: {
  titulo?: string | null;
  selfie_habilitada: boolean;
  pdfBuffer: Buffer;
  created_by?: number | null;
  assinantes: CreateAssinaturaDigitalDocumentoAssinanteInput[];
}): Promise<{
  documento: AssinaturaDigitalDocumento;
  assinantes: Array<
    AssinaturaDigitalDocumentoAssinante & {
      public_link: string;
    }
  >;
}> {
  const supabase = createServiceClient();

  const documento_uuid = randomUUID();
  const hashOriginal = calculateHash(params.pdfBuffer);

  const pdfKey = `assinatura-digital/documentos/${documento_uuid}/original.pdf`;
  const uploadedPdf = await uploadToBackblaze({
    buffer: params.pdfBuffer,
    key: pdfKey,
    contentType: "application/pdf",
  });

  const docInsert: CreateAssinaturaDigitalDocumentoInput & {
    documento_uuid: string;
    status: "rascunho";
  } = {
    documento_uuid,
    status: "rascunho",
    titulo: params.titulo ?? null,
    selfie_habilitada: params.selfie_habilitada,
    pdf_original_url: uploadedPdf.url,
    hash_original_sha256: hashOriginal,
    created_by: params.created_by ?? null,
    assinantes: params.assinantes,
  };

  const { assinantes: _, ...docRow } = docInsert;

  const { data: documentoData, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .insert(docRow)
    .select("*")
    .single();

  if (docError) {
    throw new Error(`Erro ao criar documento: ${docError.message}`);
  }

  const documento = documentoData as AssinaturaDigitalDocumento;

  const assinantesToInsert = await Promise.all(
    params.assinantes.map(async (a) => {
      const snapshot =
        a.dados_snapshot && Object.keys(a.dados_snapshot).length > 0
          ? a.dados_snapshot
          : await fetchAssinanteSnapshot(
              a.assinante_tipo,
              a.assinante_entidade_id
            );

      return {
        documento_id: documento.id,
        assinante_tipo: a.assinante_tipo,
        assinante_entidade_id: a.assinante_entidade_id ?? null,
        dados_snapshot: snapshot ?? {},
        dados_confirmados: false,
        token: generateOpaqueToken(),
        status: "pendente",
        expires_at: calculateTokenExpiration(),
      };
    })
  );

  const { data: assinantesData, error: signersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .insert(assinantesToInsert)
    .select("*");

  if (signersError) {
    throw new Error(`Erro ao criar assinantes: ${signersError.message}`);
  }

  const assinantes = (
    assinantesData as AssinaturaDigitalDocumentoAssinante[]
  ).map((s) => ({
    ...s,
    public_link: buildPublicLink(s.token),
  }));

  return { documento, assinantes };
}

export async function getDocumentoByUuid(documentoUuid: string): Promise<{
  documento: AssinaturaDigitalDocumento;
  assinantes: Array<
    AssinaturaDigitalDocumentoAssinante & { public_link: string }
  >;
  ancoras: AssinaturaDigitalDocumentoAncora[];
} | null> {
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("*")
    .eq("documento_uuid", documentoUuid)
    .single();

  if (docError) {
    if (docError.code === "PGRST116") return null;
    throw new Error(`Erro ao obter documento: ${docError.message}`);
  }

  const documento = doc as AssinaturaDigitalDocumento;

  const { data: signers, error: signersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("*")
    .eq("documento_id", documento.id)
    .order("id");

  if (signersError) {
    throw new Error(`Erro ao obter assinantes: ${signersError.message}`);
  }

  const { data: ancoras, error: anchorsError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("*")
    .eq("documento_id", documento.id)
    .order("id");

  if (anchorsError) {
    throw new Error(`Erro ao obter âncoras: ${anchorsError.message}`);
  }

  return {
    documento,
    assinantes: (signers as AssinaturaDigitalDocumentoAssinante[]).map((s) => ({
      ...s,
      public_link: buildPublicLink(s.token),
    })),
    ancoras: (ancoras as AssinaturaDigitalDocumentoAncora[]) ?? [],
  };
}

export async function setDocumentoAnchors(params: {
  documentoUuid: string;
  anchors: UpsertAssinaturaDigitalDocumentoAncoraInput[];
}): Promise<{ ancoras: AssinaturaDigitalDocumentoAncora[] }> {
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id")
    .eq("documento_uuid", params.documentoUuid)
    .single();

  if (docError) {
    throw new Error(`Erro ao obter documento: ${docError.message}`);
  }

  const documento_id = (doc as { id: number }).id;

  // Substituir todas as âncoras do documento (simples e previsível)
  const { error: delError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .delete()
    .eq("documento_id", documento_id);

  if (delError) {
    throw new Error(`Erro ao limpar âncoras: ${delError.message}`);
  }

  const toInsert = params.anchors.map((a) => ({
    documento_id,
    documento_assinante_id: a.documento_assinante_id,
    tipo: a.tipo,
    pagina: a.pagina,
    x_norm: a.x_norm,
    y_norm: a.y_norm,
    w_norm: a.w_norm,
    h_norm: a.h_norm,
  }));

  const { data: inserted, error: insError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .insert(toInsert)
    .select("*");

  if (insError) {
    throw new Error(`Erro ao salvar âncoras: ${insError.message}`);
  }

  const { error: updateDocError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .update({ status: "pronto" })
    .eq("id", documento_id);

  if (updateDocError) {
    throw new Error(
      `Erro ao atualizar status do documento: ${updateDocError.message}`
    );
  }

  return { ancoras: (inserted as AssinaturaDigitalDocumentoAncora[]) ?? [] };
}

export async function listDocumentos(
  params: {
    limit?: number;
    origem?: 'todos' | 'documento' | 'formulario';
  } = {}
): Promise<{
  documentos: (AssinaturaDigitalDocumento & {
    _assinantes_count: number;
    _assinantes_concluidos: number;
    _origem: 'documento' | 'formulario';
    _cliente_nome?: string;
    _protocolo?: string;
  })[];
}> {
  const supabase = createServiceClient();
  const limit = params.limit ?? 50;
  const origem = params.origem ?? 'todos';

  // Query 1: Documentos do editor (assinatura_digital_documentos)
  const documentosPromise = origem !== 'formulario'
    ? supabase
        .from(TABLE_DOCUMENTOS)
        .select(`
          *,
          assinantes:assinatura_digital_documento_assinantes(id, status)
        `)
        .order("created_at", { ascending: false })
        .limit(limit)
    : Promise.resolve({ data: [], error: null });

  // Query 2: Assinaturas de formulário (assinatura_digital_assinaturas)
  const assinaturasPromise = origem !== 'documento'
    ? supabase
        .from('assinatura_digital_assinaturas')
        .select(`
          id,
          cliente_id,
          contrato_id,
          template_uuid,
          protocolo,
          pdf_url,
          status,
          data_assinatura,
          created_at:data_assinatura,
          clientes(nome)
        `)
        .order("data_assinatura", { ascending: false })
        .limit(limit)
    : Promise.resolve({ data: [], error: null });

  const [docResult, assResult] = await Promise.all([documentosPromise, assinaturasPromise]);

  if (docResult.error) {
    throw new Error(`Erro ao listar documentos: ${docResult.error.message}`);
  }

  if (assResult.error) {
    console.error('[listDocumentos] Erro ao listar assinaturas de formulário:', assResult.error.message);
  }

  // Mapear documentos do editor
  const documentosEditor = (docResult.data ?? []).map((doc) => {
    const assinantes = doc.assinantes || [];
    return {
      ...doc,
      assinantes: undefined,
      _assinantes_count: assinantes.length,
      _assinantes_concluidos: assinantes.filter(
        (a: { status: string }) => a.status === "concluido"
      ).length,
      _origem: 'documento' as const,
      _cliente_nome: undefined,
      _protocolo: undefined,
    };
  });

  // Mapear assinaturas de formulário para o formato de DocumentoListItem
  // O status na tabela é 'concluida' (feminino) — normalizar para 'concluido' do enum de documentos
  const assinaturasFormulario = (assResult.data ?? []).map((ass) => {
    const clienteRaw = ass.clientes as unknown;
    const clienteNome = clienteRaw && typeof clienteRaw === 'object' && 'nome' in clienteRaw
      ? (clienteRaw as { nome: string }).nome
      : Array.isArray(clienteRaw) && clienteRaw.length > 0
        ? (clienteRaw[0] as { nome: string }).nome
        : undefined;

    const statusRaw = (ass.status ?? 'concluida') as string;
    const statusNormalizado = statusRaw === 'concluida' || statusRaw === 'concluido'
      ? 'concluido' as const
      : statusRaw === 'cancelada' || statusRaw === 'cancelado'
        ? 'cancelado' as const
        : 'concluido' as const;
    const isConcluido = statusNormalizado === 'concluido';

    return {
      id: ass.id,
      documento_uuid: `ass-${ass.id}`,
      titulo: clienteNome
        ? `Contrato Assinado - ${clienteNome}`
        : `Contrato Assinado - ${ass.protocolo}`,
      status: statusNormalizado,
      selfie_habilitada: false,
      pdf_original_url: ass.pdf_url,
      pdf_final_url: null,
      hash_original_sha256: null,
      hash_final_sha256: null,
      created_by: null,
      created_at: ass.data_assinatura,
      updated_at: ass.data_assinatura,
      contrato_id: ass.contrato_id ?? null,
      _assinantes_count: 1,
      _assinantes_concluidos: isConcluido ? 1 : 0,
      _origem: 'formulario' as const,
      _cliente_nome: clienteNome || undefined,
      _protocolo: ass.protocolo,
    };
  });

  // Merge e ordenar por data decrescente
  const todos = [...documentosEditor, ...assinaturasFormulario]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return { documentos: todos };
}

/**
 * Deleta um documento de assinatura digital e todos os dados relacionados.
 *
 * Regras:
 * - Documentos com status "concluido" não podem ser deletados
 * - Documentos com assinantes que já concluíram não podem ser deletados
 */
export async function deleteDocumento(
  documentoUuid: string
): Promise<{ deleted: boolean }> {
  const supabase = createServiceClient();

  // Buscar documento
  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id, status")
    .eq("documento_uuid", documentoUuid)
    .single();

  if (docError) {
    if (docError.code === "PGRST116") {
      throw new Error("Documento não encontrado");
    }
    throw new Error(`Erro ao buscar documento: ${docError.message}`);
  }

  // Verificar se pode deletar
  if (doc.status === "concluido") {
    throw new Error("Documentos concluídos não podem ser deletados");
  }

  // Verificar se há assinantes concluídos
  const { data: assinantes, error: signersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("id, status")
    .eq("documento_id", doc.id);

  if (signersError) {
    throw new Error(`Erro ao verificar assinantes: ${signersError.message}`);
  }

  const assinantesConcluidos = (assinantes ?? []).filter(
    (a) => a.status === "concluido"
  );
  if (assinantesConcluidos.length > 0) {
    throw new Error(
      "Documentos com assinaturas concluídas não podem ser deletados"
    );
  }

  // Deletar âncoras
  const { error: ancorasError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .delete()
    .eq("documento_id", doc.id);

  if (ancorasError) {
    throw new Error(`Erro ao deletar âncoras: ${ancorasError.message}`);
  }

  // Deletar assinantes
  const { error: assinantesError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .delete()
    .eq("documento_id", doc.id);

  if (assinantesError) {
    throw new Error(`Erro ao deletar assinantes: ${assinantesError.message}`);
  }

  // Deletar documento
  const { error: deleteError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .delete()
    .eq("id", doc.id);

  if (deleteError) {
    throw new Error(`Erro ao deletar documento: ${deleteError.message}`);
  }

  return { deleted: true };
}

/**
 * Finaliza um documento para assinatura.
 *
 * Verifica se o documento tem âncoras definidas e marca como "pronto"
 * se ainda não estiver nesse status. Retorna erro se não houver âncoras.
 */
export async function finalizeDocumento(documentoUuid: string): Promise<{
  finalized: boolean;
  status: string;
}> {
  const supabase = createServiceClient();

  // Buscar documento
  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id, status")
    .eq("documento_uuid", documentoUuid)
    .single();

  if (docError) {
    if (docError.code === "PGRST116") {
      throw new Error("Documento não encontrado");
    }
    throw new Error(`Erro ao buscar documento: ${docError.message}`);
  }

  // Se já está concluído, não pode finalizar novamente
  if (doc.status === "concluido") {
    throw new Error("Documento já foi concluído e não pode ser modificado");
  }

  // Se já está pronto, apenas retorna sucesso
  if (doc.status === "pronto") {
    return { finalized: true, status: "pronto" };
  }

  // Verificar se há âncoras definidas
  const { data: ancoras, error: ancorasError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("id")
    .eq("documento_id", doc.id);

  if (ancorasError) {
    throw new Error(`Erro ao verificar âncoras: ${ancorasError.message}`);
  }

  if (!ancoras || ancoras.length === 0) {
    throw new Error(
      "O documento precisa ter pelo menos uma âncora de assinatura definida antes de ser finalizado"
    );
  }

  // Atualizar status para "pronto"
  const { error: updateError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .update({ status: "pronto" })
    .eq("id", doc.id);

  if (updateError) {
    throw new Error(`Erro ao finalizar documento: ${updateError.message}`);
  }

  return { finalized: true, status: "pronto" };
}

export async function updateDocumentoSettings(
  documentoUuid: string,
  updates: { titulo?: string; selfie_habilitada?: boolean }
): Promise<{ updated: boolean }> {
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id, status")
    .eq("documento_uuid", documentoUuid)
    .single();

  if (docError) {
    if (docError.code === "PGRST116") {
      throw new Error("Documento não encontrado");
    }
    throw new Error(`Erro ao buscar documento: ${docError.message}`);
  }

  if (doc.status === "concluido") {
    throw new Error("Documento concluído não pode ser modificado");
  }

  const payload: Record<string, unknown> = {};
  if (updates.titulo !== undefined) payload.titulo = updates.titulo;
  if (updates.selfie_habilitada !== undefined) payload.selfie_habilitada = updates.selfie_habilitada;

  if (Object.keys(payload).length === 0) {
    return { updated: false };
  }

  const { error: updateError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .update(payload)
    .eq("id", doc.id);

  if (updateError) {
    throw new Error(`Erro ao atualizar documento: ${updateError.message}`);
  }

  return { updated: true };
}

export async function updatePublicSignerIdentification(params: {
  token: string;
  dados: {
    nome_completo: string;
    cpf: string;
    email: string;
    telefone: string;
  };
}): Promise<{ assinante_id: number }> {
  const supabase = createServiceClient();

  const { data: signer, error: signerError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("id, status, dados_snapshot, expires_at")
    .eq("token", params.token)
    .single();

  if (signerError) {
    throw new Error("Link inválido.");
  }

  // Verificar expiração do token
  if (signer.expires_at && new Date(signer.expires_at) <= new Date()) {
    throw new Error(
      "Este link de assinatura expirou. Solicite um novo link ao remetente."
    );
  }

  if (signer.status === "concluido") {
    throw new Error("Este link já foi concluído e não pode ser reutilizado.");
  }

  const mergedSnapshot = {
    ...(signer.dados_snapshot ?? {}),
    nome_completo: params.dados.nome_completo,
    cpf: params.dados.cpf,
    email: params.dados.email,
    telefone: params.dados.telefone,
  };

  const { error: updateError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .update({
      dados_snapshot: mergedSnapshot,
      dados_confirmados: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", signer.id);

  if (updateError) {
    throw new Error(`Erro ao salvar identificação: ${updateError.message}`);
  }

  return { assinante_id: signer.id };
}

export async function finalizePublicSigner(params: {
  token: string;
  // identificação/segurança
  ip_address?: string | null;
  user_agent?: string | null;
  geolocation?: Record<string, unknown> | null;
  dispositivo_fingerprint_raw?: Record<string, unknown> | null;
  termos_aceite_versao: string;
  // artefatos
  selfie_base64?: string | null;
  assinatura_base64: string;
  rubrica_base64?: string | null;
}): Promise<{
  documento_uuid: string;
  pdf_final_url: string;
  hash_final_sha256: string;
  assinante_id: number;
}> {
  const supabase = createServiceClient();

  const { data: signer, error: signerError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("*")
    .eq("token", params.token)
    .single();

  if (signerError) {
    throw new Error(`Token inválido: ${signerError.message}`);
  }

  const assinante = signer as AssinaturaDigitalDocumentoAssinante;

  // Verificar expiração do token
  if (assinante.expires_at && new Date(assinante.expires_at) <= new Date()) {
    throw new Error(
      "Este link de assinatura expirou. Solicite um novo link ao remetente."
    );
  }

  if (assinante.status === "concluido") {
    throw new Error("Este link já foi concluído e não pode ser reutilizado.");
  }

  const { data: documentoRow, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("*")
    .eq("id", assinante.documento_id)
    .single();

  if (docError) {
    throw new Error(`Documento não encontrado: ${docError.message}`);
  }

  const documento = documentoRow as AssinaturaDigitalDocumento;

  // Validar necessidade de rubrica com base nas âncoras do assinante
  const { data: signerAnchors, error: signerAnchorsError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("tipo")
    .eq("documento_id", documento.id)
    .eq("documento_assinante_id", assinante.id);

  if (signerAnchorsError) {
    throw new Error(`Erro ao validar âncoras: ${signerAnchorsError.message}`);
  }

  const requiresRubrica = (signerAnchors ?? []).some(
    (a) => a.tipo === "rubrica"
  );
  if (requiresRubrica && !params.rubrica_base64) {
    throw new Error("Rubrica é obrigatória para este documento.");
  }

  // Upload de artefatos (assinatura/rubrica/selfie) para B2
  const assinaturaBuf = decodeDataUrlToBuffer(params.assinatura_base64).buffer;
  const assinaturaKey = `assinatura-digital/documentos/${documento.documento_uuid}/assinantes/${assinante.id}/assinatura.png`;
  const assinaturaUpload = await uploadToBackblaze({
    buffer: assinaturaBuf,
    key: assinaturaKey,
    contentType: "image/png",
  });

  let rubricaUrl: string | null = null;
  if (params.rubrica_base64) {
    const rubricaBuf = decodeDataUrlToBuffer(params.rubrica_base64).buffer;
    const rubricaKey = `assinatura-digital/documentos/${documento.documento_uuid}/assinantes/${assinante.id}/rubrica.png`;
    const rubricaUpload = await uploadToBackblaze({
      buffer: rubricaBuf,
      key: rubricaKey,
      contentType: "image/png",
    });
    rubricaUrl = rubricaUpload.url;
  }

  let selfieUrl: string | null = null;
  if (documento.selfie_habilitada) {
    if (!params.selfie_base64) {
      throw new Error("Selfie é obrigatória para este documento.");
    }
    const selfieBuf = decodeDataUrlToBuffer(params.selfie_base64).buffer;
    const selfieKey = `assinatura-digital/documentos/${documento.documento_uuid}/assinantes/${assinante.id}/selfie.jpg`;
    const selfieUpload = await uploadToBackblaze({
      buffer: selfieBuf,
      key: selfieKey,
      contentType: "image/jpeg",
    });
    selfieUrl = selfieUpload.url;
  }

  const nowIso = new Date().toISOString();

  const { error: updateSignerError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .update({
      selfie_url: selfieUrl,
      assinatura_url: assinaturaUpload.url,
      rubrica_url: rubricaUrl,
      ip_address: params.ip_address ?? null,
      user_agent: params.user_agent ?? null,
      geolocation: params.geolocation ?? null,
      termos_aceite_versao: params.termos_aceite_versao,
      termos_aceite_data: nowIso,
      dispositivo_fingerprint_raw: params.dispositivo_fingerprint_raw ?? null,
      status: "concluido",
      concluido_em: nowIso,
      // Estender expiração após assinatura (48h para download)
      expires_at: calculatePostSignatureExpiration(),
    })
    .eq("id", assinante.id);

  if (updateSignerError) {
    throw new Error(
      `Erro ao atualizar assinante: ${updateSignerError.message}`
    );
  }

  // Regerar PDF final sempre a partir do original + assinaturas concluídas (determinístico)
  const { data: allSigners, error: allSignersError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("*")
    .eq("documento_id", documento.id);

  if (allSignersError) {
    throw new Error(`Erro ao obter assinantes: ${allSignersError.message}`);
  }

  const concluded = (
    allSigners as AssinaturaDigitalDocumentoAssinante[]
  ).filter((s) => s.status === "concluido");

  const { data: anchors, error: anchorsError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .select("*")
    .eq("documento_id", documento.id);

  if (anchorsError) {
    throw new Error(`Erro ao obter âncoras: ${anchorsError.message}`);
  }

  const originalPdfBuffer = await downloadFromStorageUrl(
    documento.pdf_original_url,
    {
      service: "documentos",
      operation: "download_original_pdf",
      documento_uuid: documento.documento_uuid,
    }
  );

  const pdfDoc = await PDFDocument.load(originalPdfBuffer);
  const pages = pdfDoc.getPages();

  // Aplicar assinaturas/rubricas de todos assinantes concluídos
  for (const s of concluded) {
    if (!s.assinatura_url) continue;
    const sigBuffer = await downloadFromStorageUrl(s.assinatura_url, {
      service: "documentos",
      operation: "download_signature_image",
      documento_uuid: documento.documento_uuid,
      assinante_id: s.id,
    });
    const sigImage = await pdfDoc.embedPng(sigBuffer);

    let rubImage: PDFImage | null = null;
    if (s.rubrica_url) {
      const rubBuffer = await downloadFromStorageUrl(s.rubrica_url, {
        service: "documentos",
        operation: "download_rubrica_image",
        documento_uuid: documento.documento_uuid,
        assinante_id: s.id,
      });
      rubImage = await pdfDoc.embedPng(rubBuffer);
    }

    const signerAnchors = (
      anchors as AssinaturaDigitalDocumentoAncora[]
    ).filter((a) => a.documento_assinante_id === s.id);

    for (const a of signerAnchors) {
      const pageIndex = a.pagina - 1;
      const page = pages[pageIndex];
      if (!page) continue;

      const { width: pageW, height: pageH } = page.getSize();
      const x = a.x_norm * pageW;
      const w = a.w_norm * pageW;
      const h = a.h_norm * pageH;
      // y_norm vem do front como referência no topo; converter para origem inferior do PDF
      const y = pageH - (a.y_norm + a.h_norm) * pageH;

      if (a.tipo === "assinatura") {
        page.drawImage(sigImage, { x, y, width: w, height: h });
      } else if (a.tipo === "rubrica" && rubImage) {
        page.drawImage(rubImage, { x, y, width: w, height: h });
      }
    }
  }

  const finalPdfBytes = await pdfDoc.save();
  const finalPdfBuffer = Buffer.from(finalPdfBytes);
  const hashFinal = calculateHash(finalPdfBuffer);

  const finalKey = `assinatura-digital/documentos/${documento.documento_uuid}/final.pdf`;
  const finalUpload = await uploadToBackblaze({
    buffer: finalPdfBuffer,
    key: finalKey,
    contentType: "application/pdf",
  });

  const allDone = (allSigners as AssinaturaDigitalDocumentoAssinante[]).every(
    (s) => s.status === "concluido"
  );

  const { error: updateDocError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .update({
      pdf_final_url: finalUpload.url,
      hash_final_sha256: hashFinal,
      status: allDone ? "concluido" : "pronto",
    })
    .eq("id", documento.id);

  if (updateDocError) {
    throw new Error(`Erro ao atualizar documento: ${updateDocError.message}`);
  }

  return {
    documento_uuid: documento.documento_uuid,
    pdf_final_url: finalUpload.url,
    hash_final_sha256: hashFinal,
    assinante_id: assinante.id,
  };
}

export async function addSignerToDocument(
  documentoUuid: string,
  signer: CreateAssinaturaDigitalDocumentoAssinanteInput
): Promise<AssinaturaDigitalDocumentoAssinante & { public_link: string }> {
  const supabase = createServiceClient();

  const { data: doc, error: docError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id, status")
    .eq("documento_uuid", documentoUuid)
    .single();

  if (docError || !doc) throw new Error("Documento não encontrado");

  if (doc.status === "concluido") throw new Error("Documento já concluído");

  const snapshot =
    signer.dados_snapshot && Object.keys(signer.dados_snapshot).length > 0
      ? signer.dados_snapshot
      : await fetchAssinanteSnapshot(
          signer.assinante_tipo,
          signer.assinante_entidade_id
        );

  const token = generateOpaqueToken();
  const toInsert = {
    documento_id: doc.id,
    assinante_tipo: signer.assinante_tipo,
    assinante_entidade_id: signer.assinante_entidade_id ?? null,
    dados_snapshot: snapshot ?? {},
    dados_confirmados: false,
    token: token,
    status: "pendente",
    expires_at: calculateTokenExpiration(),
  };

  const { data: newSigner, error: insError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .insert(toInsert)
    .select("*")
    .single();

  if (insError)
    throw new Error(`Erro ao adicionar assinante: ${insError.message}`);

  return {
    ...(newSigner as AssinaturaDigitalDocumentoAssinante),
    public_link: buildPublicLink(token),
  };
}

export async function removeSignerFromDocument(
  documentoUuid: string,
  signerId: number
): Promise<void> {
  const supabase = createServiceClient();

  const { data: signer, error: sError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .select("id, status, documento_id")
    .eq("id", signerId)
    .single();

  if (sError || !signer) throw new Error("Assinante não encontrado");

  const { data: doc, error: dError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id, documento_uuid, status")
    .eq("id", signer.documento_id)
    .eq("documento_uuid", documentoUuid)
    .single();

  if (dError || !doc) throw new Error("Documento não corresponde ao assinante");
  if (doc.status === "concluido") throw new Error("Documento concluído");
  if (signer.status === "concluido")
    throw new Error("Assinante já assinou, não pode remover");

  const { error: anchorError } = await supabase
    .from(TABLE_DOCUMENTO_ANCORAS)
    .delete()
    .eq("documento_assinante_id", signerId);

  if (anchorError)
    throw new Error(
      `Erro ao limpar âncoras do assinante: ${anchorError.message}`
    );

  const { error: delError } = await supabase
    .from(TABLE_DOCUMENTO_ASSINANTES)
    .delete()
    .eq("id", signerId);

  if (delError)
    throw new Error(`Erro ao remover assinante: ${delError.message}`);
}

// =============================================================================
// STATS — Contagem por status, taxa conclusão, tempo médio, trend mensal
// =============================================================================

export interface DocumentosStats {
  total: number;
  rascunhos: number;
  aguardando: number;
  concluidos: number;
  cancelados: number;
  taxaConclusao: number;
  tempoMedio: number;
  trendMensal: number[];
}

/**
 * Retorna stats agregados de todos os documentos de assinatura digital.
 *
 * - Contagem por status (rascunho, pronto, concluido, cancelado)
 * - Taxa de conclusão (concluidos / total excluindo cancelados)
 * - Tempo médio entre created_at e concluido_em dos assinantes
 * - Trend mensal (últimos 6 meses)
 */
export async function getDocumentosStats(): Promise<DocumentosStats> {
  const supabase = createServiceClient();

  // 1. Contagem por status
  const { data: docs, error: docsError } = await supabase
    .from(TABLE_DOCUMENTOS)
    .select("id, status, created_at");

  if (docsError) throw new Error(`Erro ao buscar stats: ${docsError.message}`);

  const all = docs ?? [];
  const rascunhos = all.filter((d) => d.status === "rascunho").length;
  const aguardando = all.filter((d) => d.status === "pronto").length;
  const concluidos = all.filter((d) => d.status === "concluido").length;
  const cancelados = all.filter((d) => d.status === "cancelado").length;
  const total = all.length;

  const baseParaTaxa = total - cancelados;
  const taxaConclusao =
    baseParaTaxa > 0 ? Math.round((concluidos / baseParaTaxa) * 100) : 0;

  // 2. Tempo médio de conclusão (dias entre created_at do doc e concluido_em do último assinante)
  let tempoMedio = 0;
  const docsConcluidos = all.filter((d) => d.status === "concluido");

  if (docsConcluidos.length > 0) {
    const docIds = docsConcluidos.map((d) => d.id);
    const { data: assinantes } = await supabase
      .from(TABLE_DOCUMENTO_ASSINANTES)
      .select("documento_id, concluido_em")
      .in("documento_id", docIds)
      .eq("status", "concluido")
      .not("concluido_em", "is", null);

    if (assinantes && assinantes.length > 0) {
      const docCreatedMap = new Map(
        docsConcluidos.map((d) => [d.id, new Date(d.created_at).getTime()])
      );

      let totalDays = 0;
      let count = 0;

      // Para cada doc concluído, pegar o último assinante que concluiu
      const lastByDoc = new Map<number, number>();
      for (const a of assinantes) {
        const t = new Date(a.concluido_em!).getTime();
        const current = lastByDoc.get(a.documento_id);
        if (!current || t > current) {
          lastByDoc.set(a.documento_id, t);
        }
      }

      for (const [docId, lastTime] of lastByDoc) {
        const createdAt = docCreatedMap.get(docId);
        if (createdAt) {
          totalDays += (lastTime - createdAt) / 86400000;
          count++;
        }
      }

      tempoMedio = count > 0 ? Math.round((totalDays / count) * 10) / 10 : 0;
    }
  }

  // 3. Trend mensal (últimos 6 meses — contagem de docs criados por mês)
  const now = new Date();
  const trendMensal: number[] = [];

  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const count = all.filter((d) => {
      const created = new Date(d.created_at);
      return created >= monthStart && created <= monthEnd;
    }).length;
    trendMensal.push(count);
  }

  return {
    total,
    rascunhos,
    aguardando,
    concluidos,
    cancelados,
    taxaConclusao,
    tempoMedio,
    trendMensal,
  };
}

// =============================================================================
// BUSCA DE ASSINATURA DE FORMULÁRIO (para página de verificação)
// =============================================================================

/**
 * Busca uma assinatura de formulário por ID com dados do cliente.
 *
 * Usado pela página de verificação para exibir dados completos
 * de assinaturas originadas do fluxo de formulários.
 */
export async function getAssinaturaById(id: number) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assinatura_digital_assinaturas")
    .select(
      `
      *,
      clientes(id, nome, cpf, cnpj, emails, ddd_celular, numero_celular)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Erro ao buscar assinatura: ${error.message}`);
  }

  return data as {
    id: number;
    cliente_id: number;
    contrato_id: number | null;
    template_uuid: string;
    segmento_id: number;
    formulario_id: number;
    sessao_uuid: string;
    protocolo: string;
    assinatura_url: string;
    foto_url: string | null;
    pdf_url: string;
    ip_address: string | null;
    user_agent: string | null;
    latitude: number | null;
    longitude: number | null;
    geolocation_accuracy: number | null;
    geolocation_timestamp: string | null;
    data_assinatura: string;
    status: string;
    hash_original_sha256: string | null;
    hash_final_sha256: string | null;
    termos_aceite_versao: string | null;
    termos_aceite_data: string | null;
    dispositivo_fingerprint_raw: Record<string, unknown> | null;
    created_at: string;
    updated_at: string;
    clientes: {
      id: number;
      nome: string;
      cpf: string | null;
      cnpj: string | null;
      emails: string | null;
      ddd_celular: string | null;
      numero_celular: string | null;
    } | null;
  };
}
