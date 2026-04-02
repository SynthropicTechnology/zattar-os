/**
 * Serviço para timeline unificada de processos multi-instância
 *
 * Agrega timelines de todas as instâncias de um processo (1º grau, 2º grau, TST)
 * e aplica deduplicação de eventos repetidos.
 */

import { createServiceClient } from '@/lib/supabase/service-client';
import type { TimelineItemEnriquecido } from '@/types/contracts/pje-trt';
import type { GrauAcervo } from './domain';

// Type alias para compatibilidade interna
type GrauProcesso = GrauAcervo;

/**
 * Item da timeline com metadados de origem (grau/instância)
 */
export interface TimelineItemUnificado extends TimelineItemEnriquecido {
    /** Grau de origem do evento */
    grauOrigem: GrauProcesso;
    /** TRT de origem */
    trtOrigem: string;
    /** ID da instância no acervo */
    instanciaId: number;
    /** Hash único para deduplicação */
    _dedupeHash: string;
}

/**
 * Timeline unificada com metadados agregados
 */
export interface TimelineUnificada {
    /** Número do processo */
    numeroProcesso: string;
    /** Timelines agregada e deduplicada */
    timeline: TimelineItemUnificado[];
    /** Metadados agregados */
    metadata: {
        /** Total de itens após deduplicação */
        totalItens: number;
        /** Total de documentos */
        totalDocumentos: number;
        /** Total de movimentos */
        totalMovimentos: number;
        /** Instâncias incluídas */
        instancias: {
            id: number;
            grau: GrauProcesso;
            trt: string;
            totalItensOriginal: number;
            totalMovimentosProprios: number; // Apenas movimentos próprios (sem mala direta)
        }[];
        /** Quantidade de duplicatas removidas */
        duplicatasRemovidas: number;
    };
}

/**
 * Gera hash único para um item da timeline para deduplicação
 *
 * Estratégia:
 * - Documentos: usa idUnicoDocumento se disponível, senão combina data + tipo + titulo
 * - Movimentos: combina data + codigoMovimentoCNJ + titulo
 *
 * @internal Exportado para testes unitários
 */
export function gerarHashDeduplicacao(item: TimelineItemEnriquecido): string {
    const dataStr = item.data.substring(0, 10); // Apenas YYYY-MM-DD

    if (item.documento) {
        // Para documentos, preferir idUnicoDocumento
        if (item.idUnicoDocumento) {
            return `doc:${item.idUnicoDocumento}`;
        }
        // Fallback: combinar data + tipo + titulo
        return `doc:${dataStr}:${item.tipo || ''}:${item.titulo}`;
    } else {
        // Para movimentos, usar código CNJ + data + titulo
        const cnj = item.codigoMovimentoCNJ || '';
        return `mov:${dataStr}:${cnj}:${item.titulo}`;
    }
}

/**
 * Deduplica itens da timeline mantendo a versão mais completa
 *
 * Quando há duplicatas:
 * - Mantém o item com mais informações (ex: com googleDrive/backblaze)
 * - Prioriza instância de grau superior (2º grau > 1º grau)
 *
 * @internal Exportado para testes unitários
 */
export function deduplicarTimeline(items: TimelineItemUnificado[]): TimelineItemUnificado[] {
    const hashMap = new Map<string, TimelineItemUnificado>();

    // Ordem de prioridade de graus (maior = mais prioritário)
    const grauPrioridade: Record<GrauProcesso, number> = {
        tribunal_superior: 3,
        segundo_grau: 2,
        primeiro_grau: 1,
    };

    for (const item of items) {
        const hash = item._dedupeHash;
        const existing = hashMap.get(hash);

        if (!existing) {
            hashMap.set(hash, item);
            continue;
        }

        // Determinar qual item manter
        let shouldReplace = false;

        // 1. Priorizar item com links de armazenamento
        const hasStorage = item.backblaze || item.googleDrive;
        const existingHasStorage = existing.backblaze || existing.googleDrive;

        if (hasStorage && !existingHasStorage) {
            shouldReplace = true;
        } else if (!hasStorage && existingHasStorage) {
            shouldReplace = false;
        } else {
            // 2. Ambos têm ou não têm storage - priorizar grau superior
            const itemPriority = grauPrioridade[item.grauOrigem] || 0;
            const existingPriority = grauPrioridade[existing.grauOrigem] || 0;

            if (itemPriority > existingPriority) {
                shouldReplace = true;
            }
        }

        if (shouldReplace) {
            hashMap.set(hash, item);
        }
    }

    return Array.from(hashMap.values());
}

/**
 * Busca todas as instâncias de um processo pelo numero_processo
 */
async function buscarInstanciasProcesso(numeroProcesso: string) {
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('acervo')
        .select('id, grau, trt, timeline_jsonb, updated_at')
        .eq('numero_processo', numeroProcesso)
        .order('updated_at', { ascending: false });

    if (error) {
        throw new Error(`Erro ao buscar instâncias: ${error.message}`);
    }

    return data || [];
}

/**
 * Obtém timeline unificada de um processo
 *
 * Busca todas as instâncias do processo pelo numero_processo,
 * agrega as timelines e aplica deduplicação.
 *
 * @param numeroProcesso - Número do processo (ex: "0010014-94.2025.5.03.0022")
 * @returns Timeline unificada com todos os eventos deduplicados
 */
export async function obterTimelineUnificada(
    numeroProcesso: string
): Promise<TimelineUnificada | null> {
    // 1. Buscar todas as instâncias do processo
    const instancias = await buscarInstanciasProcesso(numeroProcesso);

    if (instancias.length === 0) {
        return null;
    }

    // 2. Buscar timeline de cada instância
    const todosItens: TimelineItemUnificado[] = [];
    const instanciasMetadata: TimelineUnificada['metadata']['instancias'] = [];

    for (const instancia of instancias) {
        // Verificar se instância possui timeline no JSONB
        if (!instancia.timeline_jsonb || !instancia.timeline_jsonb.timeline) {
            // Instância sem timeline ainda
            instanciasMetadata.push({
                id: instancia.id,
                grau: instancia.grau as GrauProcesso,
                trt: instancia.trt,
                totalItensOriginal: 0,
                totalMovimentosProprios: 0,
            });
            continue;
        }

        try {
            // Ler timeline diretamente do JSONB
            const timelineItems = instancia.timeline_jsonb.timeline;

            // Enriquecer cada item com metadados de origem
            const itensEnriquecidos: TimelineItemUnificado[] = timelineItems.map((item: TimelineItemEnriquecido) => ({
                ...item,
                grauOrigem: instancia.grau as GrauProcesso,
                trtOrigem: instancia.trt,
                instanciaId: instancia.id,
                _dedupeHash: gerarHashDeduplicacao(item),
            }));

            todosItens.push(...itensEnriquecidos);

            instanciasMetadata.push({
                id: instancia.id,
                grau: instancia.grau as GrauProcesso,
                trt: instancia.trt,
                totalItensOriginal: timelineItems.length,
                totalMovimentosProprios: 0, // Será calculado após deduplicação
            });
        } catch (error) {
            console.error(`[timeline-unificada] Erro ao processar timeline da instância ${instancia.id}:`, error);
            // Continuar com outras instâncias
            instanciasMetadata.push({
                id: instancia.id,
                grau: instancia.grau as GrauProcesso,
                trt: instancia.trt,
                totalItensOriginal: 0,
                totalMovimentosProprios: 0,
            });
        }
    }

    // 3. Deduplicar timeline
    const totalAntesDedup = todosItens.length;
    const timelineDeduplicada = deduplicarTimeline(todosItens);
    const duplicatasRemovidas = totalAntesDedup - timelineDeduplicada.length;

    // 4. Ordenar por data (mais recente primeiro)
    timelineDeduplicada.sort((a, b) => {
        const dataA = new Date(a.data).getTime();
        const dataB = new Date(b.data).getTime();
        return dataB - dataA; // Decrescente
    });

    // 5. Calcular totais
    const totalDocumentos = timelineDeduplicada.filter(i => i.documento).length;
    const totalMovimentos = timelineDeduplicada.filter(i => !i.documento).length;

    // 6. Calcular movimentos próprios por instância (sem mala direta)
    // IMPORTANTE: Contar apenas movimentos (não documentos) que pertencem àquela instância específica
    // e que sobreviveram à deduplicação. Movimentos próprios são aqueles criados naquela instância,
    // excluindo os que vieram na "mala direta" de instâncias anteriores.
    // Nota: Se todos os movimentos de uma instância foram duplicados e removidos durante a deduplicação,
    // o total será zero, o que está correto - significa que não há movimentos únicos daquela instância.
    for (const instanciaMeta of instanciasMetadata) {
        const movimentosProprios = timelineDeduplicada.filter(
            item => !item.documento && item.grauOrigem === instanciaMeta.grau && item.instanciaId === instanciaMeta.id
        ).length;
        instanciaMeta.totalMovimentosProprios = movimentosProprios;
    }

    return {
        numeroProcesso,
        timeline: timelineDeduplicada,
        metadata: {
            totalItens: timelineDeduplicada.length,
            totalDocumentos,
            totalMovimentos,
            instancias: instanciasMetadata,
            duplicatasRemovidas,
        },
    };
}

/**
 * Obtém timeline unificada por ID de qualquer instância do processo
 *
 * Conveniência: busca o numero_processo pelo ID e depois chama obterTimelineUnificada
 *
 * @param acervoId - ID de qualquer instância do processo no acervo
 * @returns Timeline unificada
 */
export async function obterTimelineUnificadaPorId(
    acervoId: number
): Promise<TimelineUnificada | null> {
    const supabase = createServiceClient();

    // Buscar numero_processo pelo ID
    const { data, error } = await supabase
        .from('acervo')
        .select('numero_processo')
        .eq('id', acervoId)
        .single();

    if (error || !data) {
        return null;
    }

    return obterTimelineUnificada(data.numero_processo);
}
