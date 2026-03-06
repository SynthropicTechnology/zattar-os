/**
 * Serviço de merge incremental de timeline
 *
 * Carrega dados de backblaze da timeline existente no banco para evitar
 * re-download de documentos que já foram capturados anteriormente.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { TimelineItemEnriquecido, BackblazeB2Info } from '@/types/contracts/pje-trt';

/**
 * Carrega um mapa de documentoId -> BackblazeB2Info a partir da timeline
 * existente no banco de dados para a instância informada.
 *
 * @param processoIdPje - ID do processo no PJE (coluna id_pje)
 * @returns Mapa de id do item da timeline para dados do Backblaze
 */
export async function carregarBackblazeExistente(
  processoIdPje: string
): Promise<Map<number, BackblazeB2Info>> {
  const mapa = new Map<number, BackblazeB2Info>();

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('acervo')
      .select('timeline_jsonb')
      .eq('id_pje', processoIdPje)
      .single();

    if (error || !data?.timeline_jsonb) {
      return mapa;
    }

    const timeline = (data.timeline_jsonb as { timeline?: TimelineItemEnriquecido[] }).timeline;
    if (!timeline) return mapa;

    for (const item of timeline) {
      if (item.documento && item.backblaze) {
        mapa.set(item.id, item.backblaze);
      }
    }

    console.log(`[timeline-merge] ${mapa.size} documentos com backblaze encontrados na timeline existente`);
  } catch (err) {
    console.warn('[timeline-merge] Erro ao carregar timeline existente (continuando sem merge):', err);
  }

  return mapa;
}
