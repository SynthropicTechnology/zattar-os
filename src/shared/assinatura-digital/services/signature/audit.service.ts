/**
 * Serviço de Auditoria Forense para Assinatura Digital
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Implementa verificação independente de integridade documental,
 * essencial para contestações judiciais ou auditorias de compliance.
 *
 * @module signature/audit.service
 */

import { PDFDocument } from "pdf-lib";
import { createServiceClient } from "@/lib/supabase/service-client";
import { calculateHash, verifyHash } from "../integrity.service";
import { logger, createTimer, LogServices, LogOperations } from "../logger";
import { downloadPdfFromStorage } from "./storage-ops.service";
import { validateDeviceFingerprintEntropy } from "./validation.service";
import type { AuditResult, DeviceFingerprintData } from "../../types/types";

const SERVICE = LogServices.SIGNATURE;

/**
 * Realiza auditoria forense completa de uma assinatura digital.
 *
 * PROCEDIMENTO DE AUDITORIA - MP 2.200-2/2001
 *
 * Esta função implementa verificação independente de integridade documental,
 * essencial para contestações judiciais ou auditorias de compliance.
 *
 * Verificações realizadas:
 *
 * 1. INTEGRIDADE DO HASH (crítico)
 *    - Baixa PDF do storage (Backblaze B2)
 *    - Recalcula hash SHA-256 do PDF atual
 *    - Compara com hash_final_sha256 armazenado no banco
 *    - Usa crypto.timingSafeEqual() para evitar timing attacks
 *    - Resultado: VÁLIDO (hashes batem) ou INVÁLIDO (documento adulterado)
 *
 * 2. ENTROPIA DO DEVICE FINGERPRINT (recomendado)
 *    - Valida que fingerprint tem >= 6 campos (4 obrigatórios + 2 recomendados)
 *    - Aviso se entropia for insuficiente (não bloqueia auditoria)
 *
 * 3. EMBEDDING DA FOTO (heurístico)
 *    - Verifica que foto está embedada no PDF (não apenas no storage)
 *    - Usa heurística de tamanho (PDF >= 50% foto + manifesto >= 5KB)
 *    - Aviso se validação falhar (não bloqueia auditoria)
 *
 * Status de retorno:
 * - "valido": Todas as verificações críticas passaram
 * - "invalido": Hash divergente (documento adulterado)
 * - "erro": Falha técnica (PDF não encontrado, erro de download, etc.)
 *
 * @param assinaturaId - ID da assinatura a auditar
 * @returns Objeto AuditResult com status, verificações, avisos, e erros
 *
 * @example
 * // Auditoria de rotina
 * const result = await auditSignatureIntegrity(12345);
 * if (result.status === 'invalido') {
 *   console.error('ALERTA: Documento adulterado!', result.erros);
 * }
 *
 * @example
 * // Perícia judicial
 * const sessoes = await listSessoes({ protocolo: 'FS-20250110120000-A1B2C' });
 * const auditoria = await auditSignatureIntegrity(sessoes[0].id);
 * // Exportar auditoria.verificacoes para laudo pericial
 */
export async function auditSignatureIntegrity(
  assinaturaId: number
): Promise<AuditResult> {
  const timer = createTimer();
  const context = {
    service: SERVICE,
    operation: LogOperations.AUDIT,
    assinatura_id: assinaturaId,
  };

  logger.info("Iniciando auditoria de integridade de assinatura", context);

  const avisos: string[] = [];
  const erros: string[] = [];

  // Buscar registro da assinatura no banco
  const supabase = createServiceClient();
  const { data: assinatura, error: fetchError } = await supabase
    .from("assinatura_digital_assinaturas")
    .select("*")
    .eq("id", assinaturaId)
    .single();

  if (fetchError || !assinatura) {
    logger.error(
      "Assinatura não encontrada para auditoria",
      fetchError,
      context
    );
    throw new Error(`Assinatura ${assinaturaId} não encontrada`);
  }

  logger.debug("Assinatura carregada para auditoria", {
    ...context,
    protocolo: assinatura.protocolo,
  });

  // ==========================================================================
  // VALIDAÇÃO 1: Integridade Criptográfica (Recalcular Hash Final)
  // ==========================================================================
  let hashFinalRecalculado: string;
  let hashesValidos = false;

  try {
    logger.debug("Baixando PDF para recálculo de hash", context);
    const pdfBuffer = await downloadPdfFromStorage(assinatura.pdf_url);

    logger.debug("Recalculando hash final do PDF", context);
    hashFinalRecalculado = calculateHash(pdfBuffer);

    // Comparar hashes usando VERIFY_HASH operation
    const hashRegistrado = assinatura.hash_final_sha256;
    if (!hashRegistrado) {
      erros.push("Hash final não foi registrado no banco (campo vazio)");
      logger.warn("Hash final ausente no banco", context);
    } else {
      const verifyContext = {
        ...context,
        operation: LogOperations.VERIFY_HASH,
      };
      logger.debug("Verificando integridade do hash", verifyContext);
      hashesValidos = verifyHash(pdfBuffer, hashRegistrado);
      if (!hashesValidos) {
        avisos.push(
          `ALERTA DE INTEGRIDADE: Hash final não confere. ` +
            `Registrado: ${hashRegistrado.slice(0, 16)}..., ` +
            `Recalculado: ${hashFinalRecalculado.slice(0, 16)}...`
        );
        logger.warn("Falha na verificação de integridade: hash não confere", {
          ...verifyContext,
          hash_registrado: hashRegistrado.slice(0, 16),
          hash_recalculado: hashFinalRecalculado.slice(0, 16),
        });
      } else {
        logger.info(
          "Hash final validado com sucesso - documento íntegro",
          verifyContext
        );
      }
    }
  } catch (error) {
    hashFinalRecalculado = "";
    erros.push(
      `Erro ao recalcular hash: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.error("Erro ao recalcular hash final", error, context);
  }

  // ==========================================================================
  // VALIDAÇÃO 2: Entropia do Device Fingerprint
  // ==========================================================================
  let entropiaSuficiente = false;
  let entropiaDetalhes;

  try {
    if (!assinatura.dispositivo_fingerprint_raw) {
      avisos.push("Device fingerprint não foi coletado (campo vazio)");
      logger.warn("Device fingerprint ausente", context);
    } else {
      entropiaSuficiente = validateDeviceFingerprintEntropy(
        assinatura.dispositivo_fingerprint_raw as DeviceFingerprintData,
        false // Não obrigatório em auditoria (já foi aceito)
      );

      const fingerprint =
        assinatura.dispositivo_fingerprint_raw as DeviceFingerprintData;
      const requiredFields = [
        "screen_resolution",
        "platform",
        "user_agent",
        "timezone_offset",
      ];
      const recommendedFields = [
        "canvas_hash",
        "hardware_concurrency",
        "language",
        "color_depth",
      ];

      const presentRequiredFields = requiredFields.filter(
        (field) =>
          fingerprint[field as keyof DeviceFingerprintData] !== null &&
          fingerprint[field as keyof DeviceFingerprintData] !== undefined &&
          fingerprint[field as keyof DeviceFingerprintData] !== ""
      );

      const presentRecommendedFields = recommendedFields.filter(
        (field) =>
          fingerprint[field as keyof DeviceFingerprintData] !== null &&
          fingerprint[field as keyof DeviceFingerprintData] !== undefined &&
          fingerprint[field as keyof DeviceFingerprintData] !== ""
      );

      entropiaDetalhes = {
        campos_presentes:
          presentRequiredFields.length + presentRecommendedFields.length,
        campos_obrigatorios: presentRequiredFields.length,
        campos_recomendados: presentRecommendedFields.length,
      };

      if (!entropiaSuficiente) {
        avisos.push(
          `Device fingerprint com entropia insuficiente ` +
            `(${entropiaDetalhes.campos_presentes} campos, mínimo recomendado: 6)`
        );
        logger.warn("Entropia insuficiente detectada em auditoria", {
          ...context,
          ...entropiaDetalhes,
        });
      } else {
        logger.debug("Entropia de fingerprint validada", {
          ...context,
          ...entropiaDetalhes,
        });
      }
    }
  } catch (error) {
    erros.push(
      `Erro ao validar entropia: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.error("Erro ao validar entropia de fingerprint", error, context);
  }

  // ==========================================================================
  // VALIDAÇÃO 3: Embedding de Foto (se aplicável)
  // ==========================================================================
  let fotoEmbedada: boolean | undefined;

  try {
    if (assinatura.foto_url) {
      logger.debug("Validando embedding de foto em auditoria", context);
      const pdfBuffer = await downloadPdfFromStorage(assinatura.pdf_url);

      // Não temos acesso direto ao foto_base64 original, então fazemos validação heurística
      // baseada apenas no tamanho do PDF e estrutura do manifesto
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const manifestPage = pdfDoc.getPage(pageCount - 1);
      const manifestPageSize = manifestPage.node.toString().length;
      const minManifestSize = 5000; // Manifesto com foto deve ter >= 5KB

      fotoEmbedada = manifestPageSize >= minManifestSize;

      if (!fotoEmbedada) {
        avisos.push(
          "Foto pode não estar embedada no PDF " +
            `(manifesto com ${manifestPageSize} bytes, esperado >= ${minManifestSize})`
        );
        logger.warn("Possível falha de embedding de foto detectada", {
          ...context,
          manifest_page_size: manifestPageSize,
          min_manifest_size: minManifestSize,
        });
      } else {
        logger.debug("Foto validada como embedada", context);
      }
    }
  } catch (error) {
    erros.push(
      `Erro ao validar embedding de foto: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    logger.error("Erro ao validar embedding de foto", error, context);
  }

  // ==========================================================================
  // RESULTADO DA AUDITORIA
  // ==========================================================================
  const status: "valido" | "invalido" | "erro" =
    erros.length > 0 ? "erro" : !hashesValidos ? "invalido" : "valido";

  const result: AuditResult = {
    assinatura_id: assinatura.id,
    protocolo: assinatura.protocolo,
    status,
    hashes_validos: hashesValidos,
    hash_original_registrado: assinatura.hash_original_sha256,
    hash_final_registrado: assinatura.hash_final_sha256 || "",
    hash_final_recalculado: hashFinalRecalculado,
    entropia_suficiente: entropiaSuficiente,
    entropia_detalhes: entropiaDetalhes,
    foto_embedada: fotoEmbedada,
    avisos,
    erros,
    auditado_em: new Date().toISOString(),
  };

  timer.log("Auditoria de integridade concluída", context, {
    status,
    hashes_validos: hashesValidos,
    entropia_suficiente: entropiaSuficiente,
    avisos_count: avisos.length,
    erros_count: erros.length,
  });

  return result;
}
