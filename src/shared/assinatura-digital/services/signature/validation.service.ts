/**
 * Serviço de Validações Legais para Assinatura Digital
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Implementa validações de conformidade para assinatura eletrônica avançada,
 * garantindo identificação inequívoca do signatário conforme Art. 10, § 2º.
 *
 * @module signature/validation.service
 */

import { PDFDocument } from "pdf-lib";
import { logger, LogServices, LogOperations } from "../logger";
import { decodeDataUrlToBuffer } from "./image-utils";
import type { DeviceFingerprintData } from "../../types/types";

const SERVICE = LogServices.SIGNATURE;

/**
 * Valida entropia do device fingerprint para conformidade legal.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001, Art. 10, § 2º, alínea (b)
 *
 * A alínea (b) exige que a assinatura "seja capaz de identificar seu signatário
 * de forma inequívoca". O device fingerprint complementa a identificação biométrica
 * (foto) ao criar uma "impressão digital" única do dispositivo usado na assinatura.
 *
 * Campos obrigatórios (mínimo 4):
 * - screen_resolution: Resolução da tela (ex: "1920x1080")
 * - platform: Plataforma do SO (ex: "Win32", "MacIntel")
 * - user_agent: String do navegador/SO
 * - timezone_offset: Fuso horário em minutos (ex: -180)
 *
 * Campos recomendados (mínimo 2 adicionais):
 * - canvas_hash: Hash SHA-256 do canvas fingerprint (alta entropia)
 * - hardware_concurrency: Número de núcleos de CPU
 * - language: Idioma do navegador (ex: "pt-BR")
 * - color_depth: Profundidade de cor da tela
 *
 * Total mínimo: 6 campos (4 obrigatórios + 2 recomendados)
 *
 * @param fingerprint - Dados do device fingerprint coletados no frontend
 * @param required - Se true, lança erro quando fingerprint ausente. Default: true
 * @returns true se entropia suficiente, false caso contrário
 * @throws {Error} Se entropia for insuficiente e required=true
 *
 * @example
 * const fingerprint = {
 *   screen_resolution: "1920x1080",
 *   platform: "Win32",
 *   user_agent: "Mozilla/5.0...",
 *   timezone_offset: -180,
 *   canvas_hash: "a3c5f1e2...",
 *   hardware_concurrency: 8,
 *   language: 'pt-BR',
 *   color_depth: 24
 * };
 * validateDeviceFingerprintEntropy(fingerprint); // OK (8 campos)
 */
export function validateDeviceFingerprintEntropy(
  fingerprint: DeviceFingerprintData | null | undefined,
  required: boolean = true
): boolean {
  const context = {
    service: SERVICE,
    operation: LogOperations.VALIDATE_ENTROPY,
  };

  // Se não for obrigatório e estiver ausente, aceitar
  if (!required && !fingerprint) {
    logger.debug("Device fingerprint não fornecido (opcional)", context);
    return true;
  }

  // Se for obrigatório e estiver ausente, rejeitar
  if (required && !fingerprint) {
    logger.warn("Device fingerprint obrigatório não fornecido", context);
    throw new Error("Device fingerprint é obrigatório para conformidade legal");
  }

  // Campos obrigatórios para entropia mínima
  const requiredFields = [
    "screen_resolution",
    "platform",
    "user_agent",
    "timezone_offset",
  ];

  // Campos recomendados para entropia adicional
  const recommendedFields = [
    "canvas_hash",
    "hardware_concurrency",
    "language",
    "color_depth",
  ];

  // Contar campos presentes (não-null, não-undefined, não-string-vazia)
  const presentRequiredFields = requiredFields.filter(
    (field) =>
      fingerprint![field as keyof DeviceFingerprintData] !== null &&
      fingerprint![field as keyof DeviceFingerprintData] !== undefined &&
      fingerprint![field as keyof DeviceFingerprintData] !== ""
  );

  const presentRecommendedFields = recommendedFields.filter(
    (field) =>
      fingerprint![field as keyof DeviceFingerprintData] !== null &&
      fingerprint![field as keyof DeviceFingerprintData] !== undefined &&
      fingerprint![field as keyof DeviceFingerprintData] !== ""
  );

  const totalFields =
    presentRequiredFields.length + presentRecommendedFields.length;
  const minRequiredFields = 4; // Todos os campos obrigatórios
  const minRecommendedFields = 2; // Pelo menos 2 recomendados
  const minTotalFields = 6;

  const hasMinimumEntropy =
    presentRequiredFields.length >= minRequiredFields &&
    presentRecommendedFields.length >= minRecommendedFields &&
    totalFields >= minTotalFields;

  if (!hasMinimumEntropy) {
    logger.warn("Device fingerprint com entropia insuficiente", {
      ...context,
      required_fields_present: presentRequiredFields.length,
      required_fields_expected: minRequiredFields,
      recommended_fields_present: presentRecommendedFields.length,
      recommended_fields_expected: minRecommendedFields,
      total_fields: totalFields,
      min_total_fields: minTotalFields,
      missing_required: requiredFields.filter(
        (f) => !presentRequiredFields.includes(f)
      ),
      missing_recommended: recommendedFields.filter(
        (f) => !presentRecommendedFields.includes(f)
      ),
    });
    return false;
  }

  logger.debug("Device fingerprint validado com entropia suficiente", {
    ...context,
    total_fields: totalFields,
    required_fields: presentRequiredFields.length,
    recommended_fields: presentRecommendedFields.length,
  });

  return true;
}

/**
 * Valida que a foto biométrica está embedada no PDF final.
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001, Art. 10, § 2º, alínea (b)
 *
 * A foto selfie é evidência biométrica crítica para identificação inequívoca
 * do signatário. Ela DEVE estar embedada diretamente no PDF (não apenas
 * armazenada separadamente no storage) para garantir integridade forense.
 *
 * Se a foto estiver apenas no storage (Backblaze B2), um atacante poderia
 * alegar que a foto foi substituída após a assinatura. Ao embedar a foto
 * no PDF e calcular o hash_final_sha256, qualquer alteração (incluindo
 * substituição da foto) seria detectada.
 *
 * Validação heurística (limitações do pdf-lib):
 * - Tamanho do PDF final deve ser >= 50% do tamanho da foto
 * - Página de manifesto deve ter >= 5KB de objetos (imagens embedadas)
 *
 * Nota: Esta é uma validação heurística, não determinística. Em auditorias
 * forenses, recomenda-se inspeção manual do PDF com ferramentas como
 * Adobe Acrobat ou pdfinfo.
 *
 * @param pdfBuffer - Buffer do PDF final (após flatten)
 * @param fotoBase64 - Data URL da foto que deveria estar embedada
 * @returns true se validação passar, false caso contrário
 *
 * @example
 * const pdfBuffer = await fs.readFile('documento-assinado.pdf');
 * const fotoBase64 = "data:image/jpeg;base64,...";
 * const isEmbedded = await validatePhotoEmbedding(pdfBuffer, fotoBase64);
 * if (!isEmbedded) {
 *   throw new Error('Foto não está embedada no PDF');
 * }
 */
export async function validatePhotoEmbedding(
  pdfBuffer: Buffer,
  fotoBase64: string | null | undefined
): Promise<boolean> {
  const context = {
    service: SERVICE,
    operation: LogOperations.VALIDATE_EMBEDDING,
  };

  // Se não há foto, não há o que validar
  if (!fotoBase64) {
    logger.debug("Nenhuma foto fornecida para validação de embedding", context);
    return true;
  }

  try {
    logger.debug("Validando embedding de foto no PDF", context);

    // Carregar PDF para inspeção
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // A foto deve estar na última página (manifesto)
    const manifestPage = pdfDoc.getPage(pageCount - 1);

    // pdf-lib não expõe API pública para listar imagens embedadas diretamente,
    // mas podemos verificar se o PDF tem objetos de imagem no dicionário interno.
    // Heurística: Se o PDF tem mais de 1 imagem (assinatura + foto), assumir que foto está presente.

    // Alternativa: Verificar tamanho do PDF. PDF com foto embedada deve ser maior.
    const { buffer: fotoBuffer } = decodeDataUrlToBuffer(fotoBase64);
    const fotoSize = fotoBuffer.length;
    const pdfSize = pdfBuffer.length;

    // Heurística: PDF final deve ser significativamente maior que apenas assinatura
    // (foto típica: 50-200KB, assinatura: 5-20KB)
    const minExpectedSize = fotoSize * 0.5; // Pelo menos 50% do tamanho da foto deve estar no PDF

    if (pdfSize < minExpectedSize) {
      logger.warn(
        "PDF final menor que esperado (foto pode não estar embedada)",
        {
          ...context,
          pdf_size: pdfSize,
          foto_size: fotoSize,
          min_expected_size: minExpectedSize,
        }
      );
      return false;
    }

    // Validação adicional: Verificar se a última página (manifesto) tem conteúdo suficiente
    // (manifesto com foto deve ter mais objetos que manifesto sem foto)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const manifestPageObjects = (manifestPage.node as any).toString().length;
    const minManifestSize = 5000; // Manifesto com foto deve ter pelo menos 5KB de objetos

    if (manifestPageObjects < minManifestSize) {
      logger.warn(
        "Página de manifesto com conteúdo insuficiente (foto pode não estar embedada)",
        {
          ...context,
          manifest_page_size: manifestPageObjects,
          min_manifest_size: minManifestSize,
        }
      );
      return false;
    }

    logger.debug("Foto validada como embedada no PDF", {
      ...context,
      pdf_size: pdfSize,
      foto_size: fotoSize,
      manifest_page_size: manifestPageObjects,
    });

    return true;
  } catch (error) {
    logger.error("Erro ao validar embedding de foto", error, context);
    // Em caso de erro, assumir que validação falhou (fail-safe)
    return false;
  }
}
