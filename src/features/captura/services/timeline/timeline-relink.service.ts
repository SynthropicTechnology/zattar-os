/**
 * Serviço de relink de documentos do Backblaze B2
 *
 * Reconstrói o campo `backblaze` nos itens da timeline quando os links foram perdidos
 * no banco de dados, mas os PDFs ainda existem no Backblaze B2.
 *
 * Estratégia:
 * 1. Lista arquivos no Backblaze pelo prefixo `processos/{numeroProcesso}/timeline/`
 * 2. Extrai o `documentoId` do nome do arquivo (`doc_{id}.pdf`)
 * 3. Faz match com itens da timeline por `item.id`
 * 4. Reconstrói o `BackblazeB2Info` e atualiza a timeline no PostgreSQL
 */

import { listObjectsByPrefix, type BackblazeListItem } from '@/lib/storage/backblaze-b2.service';
import { createServiceClient } from '@/lib/supabase/service-client';
import type { TimelineItemEnriquecido, BackblazeB2Info } from '@/types/contracts/pje-trt';

export interface RelinkResult {
  /** Total de documentos encontrados no Backblaze */
  totalNoBackblaze: number;
  /** Total de documentos re-vinculados com sucesso */
  totalRelinkados: number;
  /** Total de documentos que já tinham backblaze (ignorados) */
  totalJaVinculados: number;
  /** Total de arquivos no Backblaze que não encontraram match na timeline */
  totalSemMatch: number;
}

/**
 * Extrai o documentoId do nome do arquivo no Backblaze.
 * Formato esperado: `doc_{id}.pdf`
 *
 * @returns O ID numérico ou null se o formato não bater
 */
function extrairDocumentoIdDoNome(key: string): number | null {
  const fileName = key.split('/').pop();
  if (!fileName) return null;

  const match = fileName.match(/^doc_(\d+)\.pdf$/);
  if (!match) return null;

  return parseInt(match[1], 10);
}

/**
 * Constrói a URL pública do arquivo a partir da key.
 */
function construirUrlBackblaze(key: string, bucket: string): string {
  const endpoint = process.env.BACKBLAZE_ENDPOINT || process.env.B2_ENDPOINT || '';
  if (endpoint.startsWith('http')) {
    return `${endpoint}/${bucket}/${key}`;
  }
  return `https://${endpoint}/${bucket}/${key}`;
}

/**
 * Re-vincula documentos do Backblaze B2 aos itens da timeline no PostgreSQL.
 *
 * Usa o prefixo do processo para listar todos os PDFs existentes no Backblaze,
 * extrai o documentoId do nome do arquivo, e reconstrói o campo `backblaze`
 * nos itens correspondentes da timeline.
 *
 * @param processoIdPje - ID do processo no PJE (coluna id_pje na tabela acervo)
 * @param numeroProcesso - Número formatado do processo (ex: 0010702-80.2025.5.03.0111)
 * @returns Resultado do relink com estatísticas
 */
export async function relinkBackblazeDocumentos(
  processoIdPje: string,
  numeroProcesso: string
): Promise<RelinkResult> {
  const bucket = process.env.BACKBLAZE_BUCKET_NAME || process.env.B2_BUCKET || '';

  console.log(`[timeline-relink] Iniciando relink para processo ${numeroProcesso} (id_pje=${processoIdPje})`);

  // 1. Buscar timeline atual do banco
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('acervo')
    .select('timeline_jsonb')
    .eq('id_pje', processoIdPje)
    .limit(1);

  if (error) {
    throw new Error(`[timeline-relink] Erro ao buscar timeline: ${error.message}`);
  }

  if (!data || data.length === 0 || !data[0]?.timeline_jsonb) {
    console.log('[timeline-relink] Nenhuma timeline encontrada no banco');
    return { totalNoBackblaze: 0, totalRelinkados: 0, totalJaVinculados: 0, totalSemMatch: 0 };
  }

  const timelineJsonb = data[0].timeline_jsonb as {
    timeline?: TimelineItemEnriquecido[];
    metadata?: Record<string, unknown>;
  };
  const timeline = timelineJsonb.timeline;

  if (!timeline || timeline.length === 0) {
    console.log('[timeline-relink] Timeline vazia no banco');
    return { totalNoBackblaze: 0, totalRelinkados: 0, totalJaVinculados: 0, totalSemMatch: 0 };
  }

  // 2. Listar arquivos no Backblaze pelo prefixo do processo
  const prefix = `processos/${numeroProcesso.trim()}/timeline/`;
  console.log(`[timeline-relink] Listando arquivos com prefixo: ${prefix}`);

  let backblazeFiles: BackblazeListItem[];
  try {
    backblazeFiles = await listObjectsByPrefix(prefix);
  } catch (err) {
    throw new Error(
      `[timeline-relink] Erro ao listar arquivos no Backblaze: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  console.log(`[timeline-relink] ${backblazeFiles.length} arquivos encontrados no Backblaze`);

  if (backblazeFiles.length === 0) {
    return { totalNoBackblaze: 0, totalRelinkados: 0, totalJaVinculados: 0, totalSemMatch: 0 };
  }

  // 3. Criar mapa de documentoId -> BackblazeListItem a partir dos arquivos
  const backblazeMap = new Map<number, BackblazeListItem>();
  for (const file of backblazeFiles) {
    const docId = extrairDocumentoIdDoNome(file.key);
    if (docId !== null) {
      backblazeMap.set(docId, file);
    }
  }

  console.log(`[timeline-relink] ${backblazeMap.size} arquivos com documentoId extraído`);

  // 4. Percorrer timeline e reconstruir backblaze onde falta
  let totalRelinkados = 0;
  let totalJaVinculados = 0;
  const idsMatchados = new Set<number>();

  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i];
    if (!item.documento) continue;

    if (item.backblaze) {
      totalJaVinculados++;
      idsMatchados.add(item.id);
      continue;
    }

    const backblazeFile = backblazeMap.get(item.id);
    if (backblazeFile) {
      const fileName = backblazeFile.key.split('/').pop() || `doc_${item.id}.pdf`;
      const backblazeInfo: BackblazeB2Info = {
        url: construirUrlBackblaze(backblazeFile.key, bucket),
        key: backblazeFile.key,
        bucket,
        fileName,
        uploadedAt: backblazeFile.lastModified || new Date(),
      };

      timeline[i] = { ...item, backblaze: backblazeInfo };
      totalRelinkados++;
      idsMatchados.add(item.id);
    }
  }

  const totalSemMatch = backblazeMap.size - idsMatchados.size;

  console.log(`[timeline-relink] Resultado:`, {
    totalNoBackblaze: backblazeFiles.length,
    totalRelinkados,
    totalJaVinculados,
    totalSemMatch,
  });

  // 5. Salvar timeline atualizada se houve relinks
  if (totalRelinkados > 0) {
    const totalDocumentosBaixados = timeline.filter(
      item => item.documento && item.backblaze
    ).length;

    const updatedJsonb = {
      ...timelineJsonb,
      timeline,
      metadata: {
        ...timelineJsonb.metadata,
        totalDocumentosBaixados,
        relinkadoEm: new Date().toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .from('acervo')
      .update({ timeline_jsonb: updatedJsonb })
      .eq('id_pje', processoIdPje);

    if (updateError) {
      throw new Error(`[timeline-relink] Erro ao salvar timeline relinkada: ${updateError.message}`);
    }

    console.log(`[timeline-relink] Timeline atualizada com ${totalRelinkados} documentos re-vinculados`);
  }

  return {
    totalNoBackblaze: backblazeFiles.length,
    totalRelinkados,
    totalJaVinculados,
    totalSemMatch,
  };
}
