/**
 * API Route: Indexar Documentos em Background
 *
 * Executa indexação de documentos pendentes de forma assíncrona.
 * Deve ser chamada periodicamente via cron job externo.
 *
 * Autenticação: Requer CRON_SECRET via header Authorization
 *
 * Exemplo:
 * curl -X POST https://seu-dominio.com/api/cron/indexar-documentos \
 *   -H "Authorization: Bearer SEU_CRON_SECRET"
 */

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service-client";
import { indexarDocumento } from "@/lib/ai/indexing";
import type { DocumentoMetadata } from "@/lib/ai/types";
import { requireCronAuth } from "@/lib/cron/cron-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutos

interface DocumentoPendente {
  id: number;
  tipo: "processo" | "audiencia" | "documento" | "contrato" | "outro";
  entity_id: number;
  texto: string;
  metadata: unknown; // jsonb from database, will be typed at call-site
  tentativas?: number;
  ultimo_erro?: string;
  created_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (process.env.ENABLE_AI_INDEXING === "false") {
      console.log("[Cron Indexação] Indexação desabilitada via ENABLE_AI_INDEXING");
      return NextResponse.json({
        success: true,
        message: "Indexação desabilitada",
        processados: 0,
      });
    }

    const authError = requireCronAuth(request, { logPrefix: "[Cron Indexação]" });
    if (authError) return authError;

    console.log("[Cron Indexação] Iniciando processamento...");

    const supabase = createServiceClient();

    const { data: pendentes, error } = await supabase
      .from("documentos_pendentes_indexacao")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[Cron Indexação] Erro ao buscar pendentes:", error);
      throw error;
    }

    if (!pendentes || pendentes.length === 0) {
      console.log("[Cron Indexação] Nenhum documento pendente");
      return NextResponse.json({
        success: true,
        message: "Nenhum documento pendente",
        processados: 0,
        duration_ms: Date.now() - startTime,
      });
    }

    console.log(`[Cron Indexação] ${pendentes.length} documentos pendentes`);

    let processados = 0;
    let erros = 0;

    const CONCURRENCY_LIMIT = 10;
    for (let i = 0; i < pendentes.length; i += CONCURRENCY_LIMIT) {
      const batch = pendentes.slice(i, i + CONCURRENCY_LIMIT);

      await Promise.allSettled(
        batch.map(async (doc: DocumentoPendente) => {
          try {
            let texto = doc.texto?.trim() || "";

            const metadataRecord = isRecord(doc.metadata) ? doc.metadata : null;
            const storageKey =
              metadataRecord && typeof metadataRecord.storage_key === "string"
                ? metadataRecord.storage_key
                : null;
            const storageProviderRaw =
              metadataRecord && typeof metadataRecord.storage_provider === "string"
                ? metadataRecord.storage_provider
                : null;
            const contentType =
              metadataRecord && typeof metadataRecord.content_type === "string"
                ? metadataRecord.content_type
                : "application/octet-stream";

            // Se texto está vazio e há storage_key, tentar extrair do storage
            if (!texto && storageKey) {
              try {
                const { downloadFile } = await import("@/lib/ai");
                const { extractText } = await import(
                  "@/lib/ai/services/extraction.service"
                );

                const storageProvider =
                  storageProviderRaw === "backblaze" ||
                  storageProviderRaw === "supabase" ||
                  storageProviderRaw === "google_drive"
                    ? storageProviderRaw
                    : "supabase";

                const buffer = await downloadFile(storageProvider, storageKey);
                texto = await extractText(buffer, contentType);
                console.log(`[Cron Indexação] Texto extraído para documento ${doc.id} (${texto.length} chars)`);
              } catch (extractError) {
                console.warn(`[Cron Indexação] Falha ao extrair texto para documento ${doc.id}:`, extractError);
                // Se extração falhar, requeue e tenta novamente
                const currentTentativas = doc.tentativas ?? 0;
                const maxRetries = 3;
                
                if (currentTentativas < maxRetries) {
                  await supabase
                    .from('documentos_pendentes_indexacao')
                    .update({
                      tentativas: currentTentativas + 1,
                      ultimo_erro: `Falha na extração (tentativa ${currentTentativas + 1}/${maxRetries})`,
                    })
                    .eq('id', doc.id);
                  console.log(`[Cron Indexação] Documento ${doc.id} refilerado para nova tentativa`);
                  return;
                } else {
                  // Máximo de tentativas atingido
                  await supabase
                    .from('documentos_pendentes_indexacao')
                    .update({
                      tentativas: currentTentativas + 1,
                      ultimo_erro: `Extração falhou após ${maxRetries} tentativas`,
                    })
                    .eq('id', doc.id);
                  console.error(`[Cron Indexação] Documento ${doc.id} descartado após máximo de tentativas`);
                  erros++;
                  return;
                }
              }
            }

            // Skip if still no text after extraction attempts
            if (!texto || texto.trim().length === 0) {
              console.warn(`[Cron Indexação] Documento ${doc.id} sem texto, será reprocessado`);
              const currentTentativas = doc.tentativas ?? 0;
              await supabase
                .from('documentos_pendentes_indexacao')
                .update({
                  tentativas: currentTentativas + 1,
                  ultimo_erro: 'Texto vazio - aguardando extração',
                })
                .eq('id', doc.id);
              return;
            }

            // Cast DB jsonb to DocumentoMetadata interface
            const metadata = doc.metadata as DocumentoMetadata;
            await indexarDocumento({
              texto,
              metadata,
            });

            await supabase
              .from('documentos_pendentes_indexacao')
              .delete()
              .eq('id', doc.id);

            processados++;
            console.log(`[Cron Indexação] Documento ${doc.id} indexado`);
          } catch (error) {
            erros++;
            console.error(`[Cron Indexação] Erro ao indexar ${doc.id}:`, error);

            // Increment tentativas safely without supabase.raw
            const currentTentativas = doc.tentativas ?? 0;
            await supabase
              .from('documentos_pendentes_indexacao')
              .update({
                tentativas: currentTentativas + 1,
                ultimo_erro: error instanceof Error ? error.message : 'Erro desconhecido',
              })
              .eq('id', doc.id);
          }
        })
      );
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron Indexação] Concluído: ${processados} processados, ${erros} erros em ${duration}ms`);

    return NextResponse.json({
      success: true,
      message: "Indexação concluída",
      processados,
      erros,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[Cron Indexação] Erro:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao processar indexação",
        message: error instanceof Error ? error.message : "Erro desconhecido",
        duration_ms: duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
