/**
 * DASHBOARD FEATURE - Documentos Recentes Repository
 *
 * Documentos recentemente editados para o widget do dashboard.
 * Responsabilidades:
 * - Buscar documentos criados ou editados pelo usuário
 * - Ordenar por data de atualização (mais recentes primeiro)
 * - Detectar tipo de documento a partir da extensão do título
 *
 * NOTA: A tabela `documentos` armazena documentos de texto rico (PlateJS),
 * não uploads de arquivo. O campo `titulo` é definido pelo usuário e pode
 * ou não conter extensão. Sem extensão reconhecida, o tipo padrão é 'doc'.
 */

import { createClient } from '@/lib/supabase/server';
import type { DocumentoRecente } from '../domain';

/**
 * Detecta o tipo de documento a partir da extensão do título.
 * Por padrão retorna 'doc', pois a maioria dos documentos é texto rico.
 */
function detectarTipoDocumento(titulo: string): DocumentoRecente['tipo'] {
  const ext = titulo.split('.').pop()?.toLowerCase() ?? '';
  if (['doc', 'docx', 'odt', 'txt', 'rtf'].includes(ext)) return 'doc';
  if (ext === 'pdf') return 'pdf';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'planilha';
  return 'outro';
}

/**
 * Busca documentos recentemente editados pelo usuário para o dashboard.
 *
 * @param usuarioId - ID numérico do usuário
 * @param limite - Quantidade máxima de documentos a retornar (padrão: 5)
 */
export async function buscarDocumentosRecentes(
  usuarioId: number,
  limite = 5
): Promise<DocumentoRecente[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('documentos')
      .select('id, titulo, updated_at')
      .or(`criado_por.eq.${usuarioId},editado_por.eq.${usuarioId}`)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false })
      .limit(limite);

    if (error) {
      console.error('[dashboard/documentos-recentes] Erro ao buscar documentos:', error);
      return [];
    }

    return (data ?? []).map((doc) => ({
      id: String(doc.id),
      nome: doc.titulo as string,
      tipo: detectarTipoDocumento(doc.titulo as string),
      atualizadoEm: doc.updated_at as string,
    }));
  } catch (error) {
    console.error('[dashboard/documentos-recentes] Erro:', error);
    return [];
  }
}
