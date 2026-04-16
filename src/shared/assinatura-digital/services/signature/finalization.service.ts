/**
 * Serviço de Finalização de Assinatura Digital
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Implementa o fluxo completo de finalização de assinatura eletrônica
 * avançada, garantindo conformidade com as 4 alíneas do Art. 10, § 2º.
 *
 * @module signature/finalization.service
 */

import { PDFDocument } from "pdf-lib";
import {
  generatePdfFromTemplate,
  appendManifestPage,
  MANIFEST_LEGAL_TEXT,
  type ManifestData,
} from "../template-pdf.service";
import {
  storePdf,
  storePhotoImage,
  storeSignatureImage,
} from "../storage.service";
import { generatePresignedUrl } from "@/lib/storage/backblaze-b2.service";
import { calculateHash } from "../integrity.service";
import {
  getClienteBasico,
  getFormularioBasico,
  getSegmentoBasico,
  getTemplateBasico,
} from "../data.service";
import { logger, createTimer, LogServices, LogOperations, type LogContext } from "../logger";
import { buildProtocol, insertAssinaturaRecord } from "./persistence.service";
import {
  validateDeviceFingerprintEntropy,
  validatePhotoEmbedding,
} from "./validation.service";
import type { FinalizePayload, FinalizeResult } from "../../types/types";

const SERVICE = LogServices.SIGNATURE;

/**
 * Dados coletados para finalização da assinatura.
 */
interface FinalizationData {
  cliente: NonNullable<Awaited<ReturnType<typeof getClienteBasico>>>;
  template: NonNullable<Awaited<ReturnType<typeof getTemplateBasico>>>;
  formulario: NonNullable<Awaited<ReturnType<typeof getFormularioBasico>>>;
  segmento: NonNullable<Awaited<ReturnType<typeof getSegmentoBasico>>>;
}

/**
 * Resultado do armazenamento de imagens.
 */
interface StoredImages {
  assinaturaUrl: string;
  fotoUrl?: string;
}

/**
 * Resultado da geração de PDF.
 */
interface GeneratedPdf {
  buffer: Buffer;
  hash: string;
}

/**
 * Valida entrada para finalização de assinatura.
 *
 * Verificações:
 * - Assinatura base64 obrigatória
 * - Termos de aceite obrigatórios
 * - Entropia do device fingerprint (warning se insuficiente)
 *
 * @param payload - Dados da assinatura
 * @param context - Contexto de logging
 * @throws {Error} Se validação crítica falhar
 */
function validateFinalizationInput(
  payload: FinalizePayload,
  context: LogContext
): void {
  if (!payload.assinatura_base64) {
    logger.warn("Tentativa de finalização sem assinatura", context);
    throw new Error("assinatura_base64 é obrigatória");
  }

  // Validação de termos de aceite (conformidade MP 2.200-2/2001)
  if (!payload.termos_aceite || !payload.termos_aceite_versao) {
    logger.warn("Tentativa de finalização sem aceite de termos", context);
    throw new Error(
      "Aceite de termos é obrigatório (termos_aceite e termos_aceite_versao)"
    );
  }

  logger.info("Termos de aceite validados", {
    ...context,
    termos_versao: payload.termos_aceite_versao,
  });

  // Validação de entropia do device fingerprint (conformidade MP 2.200-2/2001)
  // IMPORTANTE: Device fingerprint é fortemente recomendado mas não obrigatório para
  // manter retrocompatibilidade. Assinaturas sem fingerprint ou com entropia baixa
  // terão menor robustez de evidência forense.
  const entropiaSuficiente = validateDeviceFingerprintEntropy(
    payload.dispositivo_fingerprint_raw,
    false // Não obrigatório, mas fortemente recomendado
  );

  if (!payload.dispositivo_fingerprint_raw) {
    logger.warn(
      "Assinatura sem device fingerprint - evidência de identificação do signatário reduzida (Art. 10, § 2º, alínea b, MP 2.200-2/2001)",
      {
        ...context,
        impacto:
          "Menor robustez forense - recomenda-se coletar fingerprint em futuras assinaturas",
      }
    );
  } else if (!entropiaSuficiente) {
    logger.warn(
      "Device fingerprint com entropia insuficiente - identificação do signatário pode ser questionável",
      {
        ...context,
        impacto:
          "Evidência biométrica fraca - recomenda-se coletar mais campos do dispositivo",
        campos_minimos:
          "screen_resolution, platform, user_agent, timezone_offset, canvas_hash, hardware_concurrency",
      }
    );
  } else {
    logger.info("Device fingerprint validado com entropia suficiente", {
      ...context,
      conformidade: "Evidência biométrica robusta coletada",
    });
  }
}

/**
 * Busca dados necessários para finalização.
 *
 * @param payload - Dados da assinatura
 * @param context - Contexto de logging
 * @returns Dados completos do cliente, template, formulário e segmento
 * @throws {Error} Se algum dado não for encontrado ou estiver inativo
 */
async function fetchFinalizationData(
  payload: FinalizePayload,
  context: LogContext
): Promise<FinalizationData> {
  logger.debug("Buscando dados para finalização", context);

  const [cliente, template, formulario, segmento] = await Promise.all([
    getClienteBasico(payload.cliente_id),
    getTemplateBasico(payload.template_id),
    getFormularioBasico(payload.formulario_id),
    getSegmentoBasico(payload.segmento_id),
  ]);

  if (!cliente) {
    logger.warn("Cliente não encontrado para finalização", context);
    throw new Error("Cliente não encontrado");
  }
  if (!template || !template.ativo) {
    logger.warn("Template não encontrado ou inativo para finalização", context);
    throw new Error("Template não encontrado ou inativo");
  }
  if (!formulario || !formulario.ativo) {
    logger.warn(
      "Formulário não encontrado ou inativo para finalização",
      context
    );
    throw new Error("Formulário não encontrado ou inativo");
  }
  if (!segmento || !segmento.ativo) {
    logger.warn("Segmento não encontrado ou inativo para finalização", context);
    throw new Error("Segmento não encontrado ou inativo");
  }

  // Validação de foto baseada na configuração do formulário
  const fotoObrigatoria = formulario.foto_necessaria === true;
  if (fotoObrigatoria && !payload.foto_base64) {
    logger.warn(
      "Tentativa de finalização sem foto (obrigatória para este formulário)",
      {
        ...context,
        foto_necessaria: formulario.foto_necessaria,
      }
    );
    throw new Error(
      "Foto é obrigatória para este formulário (foto_necessaria=true)"
    );
  }

  return { cliente, template, formulario, segmento };
}

/**
 * Armazena imagens de assinatura e foto no storage.
 *
 * @param payload - Dados da assinatura
 * @param context - Contexto de logging
 * @returns URLs das imagens armazenadas
 */
async function storeSignatureImages(
  payload: FinalizePayload,
  context: LogContext
): Promise<StoredImages> {
  logger.debug("Armazenando imagens (assinatura/foto)", context);

  const assinaturaStored = await storeSignatureImage(payload.assinatura_base64);
  const fotoStored = payload.foto_base64
    ? await storePhotoImage(payload.foto_base64)
    : undefined;

  return {
    assinaturaUrl: assinaturaStored.url,
    fotoUrl: fotoStored?.url,
  };
}

/**
 * Gera PDF pré-assinatura (sem imagens) para cálculo do hash original.
 *
 * @param data - Dados do cliente, template, formulário e segmento
 * @param payload - Dados da assinatura
 * @param protocolo - Protocolo único da assinatura
 * @param context - Contexto de logging
 * @returns Buffer do PDF e hash original
 */
async function generatePreSignPdf(
  data: FinalizationData,
  payload: FinalizePayload,
  protocolo: string,
  context: LogContext
): Promise<GeneratedPdf> {
  const { cliente, template, formulario, segmento } = data;

  // Extrair dados completos de parte contrária se disponível
  const parteContrariaDados =
    payload.parte_contraria_dados && payload.parte_contraria_dados.length > 0
      ? payload.parte_contraria_dados[0]
      : undefined;

  // Preparar extras com dados completos do cliente se disponível
  const extras: Record<string, unknown> = {
    segmento_id: payload.segmento_id,
    formulario_id: payload.formulario_id,
    contrato_id: payload.contrato_id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    geolocation_accuracy: payload.geolocation_accuracy,
    geolocation_timestamp: payload.geolocation_timestamp,
  };

  // Adicionar dados completos do cliente se disponível no payload
  if (payload.cliente_dados) {
    extras.cliente_dados = payload.cliente_dados;
    // Também adicionar campos individuais do cliente para facilitar acesso
    Object.entries(payload.cliente_dados).forEach(([key, value]) => {
      extras[`cliente.${key}`] = value;
    });
  }
  // Incluir dados do formulário dinâmico (acao) com prefixo "acao."
  if (payload.acao_dados) {
    const acao = payload.acao_dados as Record<string, unknown>;
    for (const [key, value] of Object.entries(acao)) {
      extras[`acao.${key}`] = value;
    }
  }

  logger.debug("Gerando PDF pré-assinatura (sem imagens)", context);
  const pdfBuffer = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento,
      formulario,
      protocolo,
      ip: payload.ip_address,
      user_agent: payload.user_agent,
      parte_contraria: parteContrariaDados
        ? {
            nome: parteContrariaDados.nome,
            cpf: parteContrariaDados.cpf,
            cnpj: parteContrariaDados.cnpj,
            telefone: parteContrariaDados.telefone,
          }
        : undefined,
    },
    extras,
    undefined // Sem imagens para calcular hash original
  );

  let hash: string;
  try {
    hash = calculateHash(pdfBuffer);
    logger.debug("Hash original calculado", {
      ...context,
      hash_prefix: hash.slice(0, 8),
    });
  } catch (error) {
    logger.error("Erro ao calcular hash original", error, context);
    throw new Error("Falha na geração de hash de integridade");
  }

  return { buffer: pdfBuffer, hash };
}

/**
 * Gera PDF final com imagens e manifesto.
 *
 * Fluxo:
 * 1. Gera PDF com imagens (assinatura + foto)
 * 2. Anexa página de manifesto com evidências
 * 3. Flatten do PDF (trava edições)
 * 4. Calcula hash final
 * 5. Valida embedding de foto
 *
 * @param data - Dados do cliente, template, formulário e segmento
 * @param payload - Dados da assinatura
 * @param protocolo - Protocolo único da assinatura
 * @param hashOriginal - Hash do PDF original
 * @param context - Contexto de logging
 * @returns Buffer do PDF final e hash
 */
async function generateFinalPdf(
  data: FinalizationData,
  payload: FinalizePayload,
  protocolo: string,
  hashOriginal: string,
  context: LogContext
): Promise<GeneratedPdf> {
  const { cliente, template, formulario, segmento } = data;

  // Extrair dados completos de parte contrária se disponível
  const parteContrariaDados2 =
    payload.parte_contraria_dados && payload.parte_contraria_dados.length > 0
      ? payload.parte_contraria_dados[0]
      : undefined;

  // Preparar extras
  const extras: Record<string, unknown> = {
    segmento_id: payload.segmento_id,
    formulario_id: payload.formulario_id,
    contrato_id: payload.contrato_id,
    latitude: payload.latitude,
    longitude: payload.longitude,
    geolocation_accuracy: payload.geolocation_accuracy,
    geolocation_timestamp: payload.geolocation_timestamp,
  };

  if (payload.cliente_dados) {
    extras.cliente_dados = payload.cliente_dados;
    Object.entries(payload.cliente_dados).forEach(([key, value]) => {
      extras[`cliente.${key}`] = value;
    });
  }
  if (payload.acao_dados) {
    const acao = payload.acao_dados as Record<string, unknown>;
    for (const [key, value] of Object.entries(acao)) {
      extras[`acao.${key}`] = value;
    }
  }

  logger.debug("Gerando PDF com assinatura e foto", context);
  const pdfBufferWithImages = await generatePdfFromTemplate(
    template,
    {
      cliente,
      segmento,
      formulario,
      protocolo,
      ip: payload.ip_address,
      user_agent: payload.user_agent,
      parte_contraria: parteContrariaDados2
        ? {
            nome: parteContrariaDados2.nome,
            cpf: parteContrariaDados2.cpf,
            cnpj: parteContrariaDados2.cnpj,
            telefone: parteContrariaDados2.telefone,
          }
        : undefined,
    },
    extras,
    {
      assinaturaBase64: payload.assinatura_base64,
      fotoBase64: payload.foto_base64 || undefined,
    }
  );

  // Carregar PDF para adicionar página de manifesto
  const pdfDoc = await PDFDocument.load(pdfBufferWithImages);

  // Construir dados do manifesto
  const dataAssinatura = new Date();
  const manifestData: ManifestData = {
    protocolo,
    nomeArquivo: `${protocolo}.pdf`,
    hashOriginalSha256: hashOriginal,
    hashFinalSha256: undefined, // Será calculado após save
    signatario: {
      nomeCompleto: cliente.nome,
      cpf: cliente.cpf || "",
      dataHora: dataAssinatura.toISOString(),
      dataHoraLocal: dataAssinatura.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      ipOrigem: payload.ip_address || null,
      geolocalizacao:
        payload.latitude !== null &&
        payload.latitude !== undefined &&
        payload.longitude !== null &&
        payload.longitude !== undefined
          ? {
              latitude: payload.latitude,
              longitude: payload.longitude,
              accuracy: payload.geolocation_accuracy ?? undefined,
            }
          : null,
    },
    evidencias: {
      fotoBase64: payload.foto_base64 || undefined,
      assinaturaBase64: payload.assinatura_base64,
    },
    termos: {
      versao: payload.termos_aceite_versao,
      dataAceite: dataAssinatura.toISOString(),
      textoDeclaracao: MANIFEST_LEGAL_TEXT,
    },
    dispositivo: payload.dispositivo_fingerprint_raw
      ? {
          plataforma: payload.dispositivo_fingerprint_raw.platform as
            | string
            | undefined,
          navegador: payload.dispositivo_fingerprint_raw.user_agent as
            | string
            | undefined,
          resolucao: payload.dispositivo_fingerprint_raw.screen_resolution as
            | string
            | undefined,
        }
      : undefined,
  };

  // Anexar página de manifesto
  try {
    await appendManifestPage(pdfDoc, manifestData);
    logger.debug("Manifesto anexado ao PDF", context);
  } catch (error) {
    logger.error("Erro ao anexar manifesto ao PDF", error, context);
    throw new Error("Falha ao gerar página de manifesto");
  }

  // Salvar (flatten) PDF final
  const finalPdfBytes = await pdfDoc.save();
  const finalPdfBuffer = Buffer.from(finalPdfBytes);

  // Calcular hash final
  let hashFinal: string;
  try {
    hashFinal = calculateHash(finalPdfBuffer);
    logger.debug("Hash final calculado", {
      ...context,
      hash_prefix: hashFinal.slice(0, 8),
    });
  } catch (error) {
    logger.error("Erro ao calcular hash final", error, context);
    throw new Error("Falha na geração de hash de integridade final");
  }

  // Validação de embedding de foto (conformidade MP 2.200-2/2001)
  if (payload.foto_base64) {
    const fotoEmbedded = await validatePhotoEmbedding(
      finalPdfBuffer,
      payload.foto_base64
    );
    if (!fotoEmbedded) {
      logger.warn(
        "AVISO DE INTEGRIDADE: Validação de embedding de foto falhou (heurística). " +
          "A assinatura prosseguirá, mas a integridade forense da foto pode ser questionada. " +
          "Recomenda-se auditoria manual do PDF final.",
        {
          ...context,
          cause:
            "A validação heurística (tamanho do PDF vs. tamanho da foto) não foi satisfeita.",
        }
      );
    } else {
      logger.info("Foto validada como embedada no PDF", context);
    }
  }

  return { buffer: finalPdfBuffer, hash: hashFinal };
}

/**
 * Finaliza assinatura digital com conformidade legal MP 2.200-2/2001.
 *
 * FLUXO COMPLETO DE FINALIZAÇÃO
 *
 * Este é o ponto central do módulo de assinatura digital. Implementa todas
 * as 4 alíneas do Art. 10, § 2º da MP 2.200-2/2001 para Assinatura Eletrônica
 * Avançada sem certificado ICP-Brasil.
 *
 * Etapas (ordem crítica para cadeia de custódia):
 *
 * 1. VALIDAÇÃO DE ENTRADA
 *    - Verifica aceite de termos (termos_aceite === true)
 *    - Valida entropia do device fingerprint (>= 6 campos)
 *    - Confirma presença de foto se formulário exigir
 *
 * 2. COLETA DE DADOS
 *    - Busca cliente, template, formulário, segmento no Supabase
 *    - Monta contexto completo para geração de PDF
 *
 * 3. ARMAZENAMENTO DE IMAGENS
 *    - Upload de assinatura manuscrita (PNG) para Backblaze B2
 *    - Upload de foto selfie (JPEG) para Backblaze B2
 *    - Gera URLs assinadas (expiration: 1 ano)
 *
 * 4. GERAÇÃO DE PDF PRÉ-ASSINATURA
 *    - Gera PDF preenchido com dados do formulário (SEM imagens)
 *    - Calcula hash_original_sha256 (prova de integridade do conteúdo)
 *
 * 5. MONTAGEM DO PDF FINAL
 *    - Recarrega PDF e insere imagens (assinatura + foto)
 *    - Anexa página de manifesto com todas as evidências
 *    - Flatten do PDF (trava edições, remove campos interativos)
 *    - Calcula hash_final_sha256 (prova de integridade do documento completo)
 *
 * 6. VALIDAÇÃO DE INTEGRIDADE
 *    - Verifica embedding da foto no PDF (heurística)
 *
 * 7. PERSISTÊNCIA
 *    - Upload do PDF final para Backblaze B2
 *    - Insert no banco com todos os metadados + hashes
 *    - Retorna protocolo + URLs para download
 *
 * CONFORMIDADE LEGAL - Mapeamento das Alíneas:
 *
 * - Alínea (a) - Associação unívoca: Device fingerprint + IP + geolocalização
 * - Alínea (b) - Identificação inequívoca: Foto selfie + CPF + dados pessoais
 * - Alínea (c) - Controle exclusivo: Captura em tempo real (webcam/canvas)
 * - Alínea (d) - Detecção de modificações: Dual hashing SHA-256 + flatten
 *
 * @param payload - Dados completos da assinatura (FinalizePayload)
 * @returns Objeto com protocolo, URLs dos PDFs, e metadados
 * @throws {Error} Se validação falhar ou ocorrer erro técnico
 *
 * @example
 * const result = await finalizeSignature({
 *   cliente_id: 123,
 *   formulario_id: 456,
 *   template_id: 789,
 *   assinatura_base64: "data:image/png;base64,...",
 *   foto_base64: "data:image/jpeg;base64,...",
 *   termos_aceite: true,
 *   termos_aceite_versao: "v1.0-MP2200-2",
 *   dispositivo_fingerprint_raw: { screen_resolution: "1920x1080", ... },
 *   // ... outros campos
 * });
 * console.log(result.protocolo); // "FS-20250110120000-A1B2C"
 */
export async function finalizeSignature(
  payload: FinalizePayload
): Promise<FinalizeResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.FINALIZE,
    cliente_id: payload.cliente_id,
    template_id: payload.template_id,
    segmento_id: payload.segmento_id,
    formulario_id: payload.formulario_id,
  };

  logger.info("Iniciando finalização de assinatura", context);

  // ==========================================================================
  // ETAPA 1: Validação de entrada
  // ==========================================================================
  validateFinalizationInput(payload, context);

  // ==========================================================================
  // ETAPA 2: Coleta de dados
  // ==========================================================================
  const data = await fetchFinalizationData(payload, context);

  // ==========================================================================
  // ETAPA 3: Armazenamento de imagens
  // ==========================================================================
  const storedImages = await storeSignatureImages(payload, context);

  // ==========================================================================
  // ETAPA 4: Geração do protocolo
  // ==========================================================================
  const protocolo = buildProtocol();
  logger.debug("Protocolo gerado", { ...context, protocolo });

  // ==========================================================================
  // ETAPA 5: Geração de PDF pré-assinatura e hash original
  // ==========================================================================
  const preSignPdf = await generatePreSignPdf(data, payload, protocolo, context);

  // ==========================================================================
  // ETAPA 6: Geração de PDF final com manifesto
  // ==========================================================================
  const finalPdf = await generateFinalPdf(
    data,
    payload,
    protocolo,
    preSignPdf.hash,
    context
  );

  // ==========================================================================
  // ETAPA 7: Persistência
  // ==========================================================================
  logger.debug("Armazenando PDF final", context);
  const pdfStored = await storePdf(finalPdf.buffer);

  logger.debug("Registrando assinatura no banco", context);
  const record = await insertAssinaturaRecord(
    payload,
    pdfStored.url,
    protocolo,
    preSignPdf.hash,
    finalPdf.hash,
    storedImages.assinaturaUrl,
    storedImages.fotoUrl
  );

  // Gerar presigned URL para acesso temporário do navegador (1 hora)
  // O record.pdf_url contém a URL raw do Backblaze (bucket privado),
  // que não é acessível diretamente pelo browser.
  const presignedPdfUrl = await generatePresignedUrl(pdfStored.key, 3600);

  timer.log(
    "Assinatura finalizada com sucesso",
    {
      ...context,
      protocolo,
      assinatura_id: record.id,
    },
    { pdf_size: finalPdf.buffer.length }
  );

  return {
    assinatura_id: record.id,
    protocolo: record.protocolo,
    pdf_url: presignedPdfUrl,
    pdf_raw_url: pdfStored.url,
    pdf_key: pdfStored.key,
    pdf_size: finalPdf.buffer.length,
  };
}
