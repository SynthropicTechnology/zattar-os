import { buscarEntrevistaPorContrato } from './service';
import { findAnexos } from './repository';
import type { EntrevistaTrabalhista, EntrevistaAnexo } from './domain';

// =============================================================================
// TIPOS
// =============================================================================

export interface EntrevistaComAnexos {
  entrevista: EntrevistaTrabalhista;
  anexos: EntrevistaAnexo[];
}

type QueryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// =============================================================================
// FETCHING (Server Components)
// =============================================================================

export async function fetchEntrevistaByContratoId(
  contratoId: number,
): Promise<QueryResult<EntrevistaComAnexos | null>> {
  try {
    if (!contratoId || contratoId <= 0) {
      return { success: false, error: 'ID do contrato inválido' };
    }

    const entrevistaResult = await buscarEntrevistaPorContrato(contratoId);
    if (!entrevistaResult.success) {
      return { success: false, error: entrevistaResult.error.message };
    }

    if (!entrevistaResult.data) {
      return { success: true, data: null };
    }

    const entrevista = entrevistaResult.data;

    // Buscar anexos em paralelo
    const anexosResult = await findAnexos(entrevista.id);
    const anexos = anexosResult.success ? anexosResult.data : [];

    return {
      success: true,
      data: {
        entrevista,
        anexos,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar entrevista do contrato:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
    };
  }
}
