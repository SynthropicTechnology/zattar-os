/**
 * Serviço de Persistência para Assinatura Digital
 *
 * Funções para geração de protocolo único e persistência
 * de registros de assinatura no banco de dados.
 *
 * @module signature/persistence.service
 */

import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/service-client";
import { logger, LogServices, LogOperations } from "../logger";
import type { FinalizePayload } from "../../types/types";

const SERVICE = LogServices.SIGNATURE;

/**
 * Gera protocolo único para assinatura digital.
 *
 * Formato: FS-YYYYMMDDHHMMSS-XXXXX
 * - FS: Prefixo "Firma Signature"
 * - YYYYMMDDHHMMSS: Timestamp em formato compacto
 * - XXXXX: 5 caracteres aleatórios (00000-99999)
 *
 * @returns Protocolo único no formato FS-YYYYMMDDHHMMSS-XXXXX
 *
 * @example
 * const protocolo = buildProtocol();
 * // Retorna algo como: "FS-20250110143022-84721"
 */
export function buildProtocol(): string {
  const now = new Date();
  const ts = now
    .toISOString()
    .replace(/[-:T.Z]/g, "")
    .slice(0, 14);
  const rand = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `FS-${ts}-${rand}`;
}

/**
 * Persiste registro de assinatura no banco com todos os metadados.
 *
 * Campos críticos para conformidade legal:
 * - hash_original_sha256: Hash do PDF antes da assinatura (prova de conteúdo)
 * - hash_final_sha256: Hash do PDF após manifesto e flatten (prova de integridade)
 * - termos_aceite_versao: Versão dos termos aceitos (ex: "v1.0-MP2200-2")
 * - termos_aceite_data: Timestamp UTC do aceite (ISO 8601)
 * - dispositivo_fingerprint_raw: JSONB com dados do device (>= 6 campos)
 *
 * @param payload - Dados da assinatura a persistir
 * @param pdfUrl - URL do PDF final
 * @param protocolo - Protocolo da assinatura
 * @param hashOriginal - Hash do PDF original
 * @param hashFinal - Hash do PDF final
 * @param assinaturaUrl - URL da imagem da assinatura (opcional)
 * @param fotoUrl - URL da foto do signatário (opcional)
 * @returns Objeto com o ID, protocolo e URL do PDF da assinatura inserida.
 * @throws {Error} Se insert falhar
 */
export async function insertAssinaturaRecord(
  payload: FinalizePayload,
  pdfUrl: string,
  protocolo: string,
  hashOriginal: string,
  hashFinal: string,
  assinaturaUrl?: string,
  fotoUrl?: string
): Promise<{ id: number; protocolo: string; pdf_url: string }> {
  const context = {
    service: SERVICE,
    operation: LogOperations.PERSIST,
    cliente_id: payload.cliente_id,
    protocolo,
  };

  logger.debug("Persistindo registro de assinatura", context);

  const supabase = createServiceClient();
  const sessao_uuid = payload.sessao_id || randomUUID();
  const { data, error } = await supabase
    .from("assinatura_digital_assinaturas")
    .insert({
      cliente_id: payload.cliente_id,
      contrato_id: payload.contrato_id ?? null,
      template_uuid: payload.template_id,
      segmento_id: payload.segmento_id,
      formulario_id: payload.formulario_id,
      sessao_uuid,
      assinatura_url: assinaturaUrl ?? null,
      foto_url: fotoUrl ?? null,
      pdf_url: pdfUrl,
      protocolo,
      ip_address: payload.ip_address ?? null,
      user_agent: payload.user_agent ?? null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      geolocation_accuracy: payload.geolocation_accuracy ?? null,
      geolocation_timestamp: payload.geolocation_timestamp ?? null,
      data_assinatura: new Date().toISOString(),
      status: "concluida",
      enviado_sistema_externo: false,
      // Campos de conformidade MP 2.200-2/2001
      hash_original_sha256: hashOriginal,
      hash_final_sha256: hashFinal,
      termos_aceite_versao: payload.termos_aceite_versao,
      termos_aceite_data: new Date().toISOString(),
      dispositivo_fingerprint_raw: payload.dispositivo_fingerprint_raw ?? null,
    })
    .select("id, protocolo, pdf_url")
    .single();

  if (error) {
    logger.error("Erro ao registrar assinatura", error, context);
    throw new Error(`Erro ao registrar assinatura: ${error.message}`);
  }

  logger.debug("Registro de assinatura persistido com sucesso", {
    ...context,
    assinatura_id: data.id,
  });

  return data;
}
