import { type Result, err } from '@/types';
import type { ZodTypeAny } from 'zod';
import type { EntrevistaTrabalhista, CreateEntrevistaInput, ModuloEntrevista } from './domain';
import {
  createEntrevistaSchema,
  getModulosPorTrilha,
  // Trilha A
  respostasVinculoSchema,
  respostasJornadaSchema,
  respostasSaudeAmbienteSchema,
  respostasRupturaSchema,
  // Trilha B
  respostasControleAlgoritmicoSchema,
  respostasDependenciaEconomicaSchema,
  respostasCondicoesTrabalhoGigSchema,
  respostasDesligamentoPlataformaSchema,
  // Trilha C
  respostasContratoPJSchema,
  respostasSubordinacaoRealSchema,
  respostasExclusividadePessoalidadeSchema,
  respostasFraudeVerbasSchema,
} from './domain';
import {
  findByContratoId,
  findById,
  create,
  updateRespostas,
  updateStatus,
  updateModuloAtual,
  updateTestemunhas,
} from './repository';
import {
  entrevistaNotFoundError,
  entrevistaJaExisteError,
  entrevistaValidationError,
  entrevistaStatusInvalidoError,
} from './errors';

// =============================================================================
// INICIAR ENTREVISTA
// =============================================================================

export async function iniciarEntrevista(
  input: CreateEntrevistaInput,
): Promise<Result<EntrevistaTrabalhista>> {
  // Validar input
  const validation = createEntrevistaSchema.safeParse(input);
  if (!validation.success) {
    const firstError = validation.error.errors[0];
    return err(
      entrevistaValidationError(firstError.message, {
        field: firstError.path.join('.'),
        errors: validation.error.errors,
      }),
    );
  }

  // Verificar se já existe
  const existingResult = await findByContratoId(validation.data.contratoId);
  if (!existingResult.success) return existingResult;
  if (existingResult.data) {
    return err(entrevistaJaExisteError(validation.data.contratoId));
  }

  return create(validation.data);
}

// =============================================================================
// SALVAR MÓDULO (merge JSONB + avançar progresso)
// =============================================================================

const SCHEMA_POR_MODULO: Record<string, ZodTypeAny> = {
  // Trilha A — Clássico
  vinculo: respostasVinculoSchema,
  jornada: respostasJornadaSchema,
  saude_ambiente: respostasSaudeAmbienteSchema,
  ruptura: respostasRupturaSchema,
  // Trilha B — Gig Economy
  controle_algoritmico: respostasControleAlgoritmicoSchema,
  dependencia_economica: respostasDependenciaEconomicaSchema,
  condicoes_trabalho_gig: respostasCondicoesTrabalhoGigSchema,
  desligamento_plataforma: respostasDesligamentoPlataformaSchema,
  // Trilha C — Pejotização
  contrato_pj: respostasContratoPJSchema,
  subordinacao_real: respostasSubordinacaoRealSchema,
  exclusividade_pessoalidade: respostasExclusividadePessoalidadeSchema,
  fraude_verbas: respostasFraudeVerbasSchema,
};

export async function salvarModulo(
  entrevistaId: number,
  modulo: ModuloEntrevista,
  respostasModulo: Record<string, unknown>,
  avancar: boolean = false,
  notaOperador?: string,
): Promise<Result<EntrevistaTrabalhista>> {
  // Validar que entrevista existe
  const entrevistaResult = await findById(entrevistaId);
  if (!entrevistaResult.success) return entrevistaResult;
  if (!entrevistaResult.data) {
    return err(entrevistaNotFoundError(entrevistaId));
  }

  const entrevista = entrevistaResult.data;

  // Validar que não está concluída
  if (entrevista.status === 'concluida') {
    return err(entrevistaStatusInvalidoError('concluida', 'em_andamento'));
  }

  // Validar respostas contra o schema do módulo
  const schemaModulo = SCHEMA_POR_MODULO[modulo];
  if (schemaModulo) {
    const validation = schemaModulo.safeParse(respostasModulo);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return err(
        entrevistaValidationError(`Erro no módulo ${modulo}: ${firstError.message}`, {
          field: firstError.path.join('.'),
          modulo,
        }),
      );
    }
  }

  // Salvar respostas (merge JSONB)
  const saveResult = await updateRespostas(entrevistaId, modulo, respostasModulo, notaOperador);
  if (!saveResult.success) return saveResult;

  // Avançar para próximo módulo se solicitado (usa trilha correta)
  if (avancar) {
    const modulos = getModulosPorTrilha(entrevista.tipoLitigio);
    const currentIndex = modulos.indexOf(modulo);
    if (currentIndex >= 0 && currentIndex < modulos.length - 1) {
      const nextModulo = modulos[currentIndex + 1];
      const moduloResult = await updateModuloAtual(entrevistaId, nextModulo);
      if (!moduloResult.success) return moduloResult;
      return moduloResult;
    }
  }

  return saveResult;
}

// =============================================================================
// FINALIZAR ENTREVISTA
// =============================================================================

export async function finalizarEntrevista(
  entrevistaId: number,
  testemunhasMapeadas: boolean,
): Promise<Result<EntrevistaTrabalhista>> {
  // Buscar entrevista
  const entrevistaResult = await findById(entrevistaId);
  if (!entrevistaResult.success) return entrevistaResult;
  if (!entrevistaResult.data) {
    return err(entrevistaNotFoundError(entrevistaId));
  }

  const entrevista = entrevistaResult.data;

  // Validar status
  if (entrevista.status === 'concluida') {
    return err(entrevistaStatusInvalidoError('concluida', 'concluida'));
  }

  // Validar campos obrigatórios mínimos por trilha
  const respostas = entrevista.respostas;

  switch (entrevista.tipoLitigio) {
    case 'trabalhista_classico':
      if (!respostas.vinculo?.ctps_assinada) {
        return err(entrevistaValidationError('Módulo Vínculo: campo CTPS é obrigatório'));
      }
      if (!respostas.ruptura?.motivo) {
        return err(entrevistaValidationError('Módulo Ruptura: motivo do término é obrigatório'));
      }
      break;

    case 'gig_economy':
      if (!respostas.controle_algoritmico?.tipo_plataforma) {
        return err(entrevistaValidationError('Módulo Controle Algorítmico: tipo de plataforma é obrigatório'));
      }
      if (!respostas.desligamento_plataforma?.forma_desligamento) {
        return err(entrevistaValidationError('Módulo Desligamento: forma de desligamento é obrigatória'));
      }
      break;

    case 'pejotizacao':
      if (!respostas.contrato_pj?.origem_pj) {
        return err(entrevistaValidationError('Módulo Contrato PJ: origem do PJ é obrigatória'));
      }
      if (!respostas.fraude_verbas?.regime_ferias) {
        return err(entrevistaValidationError('Módulo Fraude nas Verbas: regime de férias é obrigatório'));
      }
      break;
  }

  // Atualizar testemunhas
  const testResult = await updateTestemunhas(entrevistaId, testemunhasMapeadas);
  if (!testResult.success) return testResult;

  // Atualizar status para concluída
  return updateStatus(entrevistaId, 'concluida');
}

// =============================================================================
// REABRIR ENTREVISTA
// =============================================================================

export async function reabrirEntrevista(
  entrevistaId: number,
): Promise<Result<EntrevistaTrabalhista>> {
  const entrevistaResult = await findById(entrevistaId);
  if (!entrevistaResult.success) return entrevistaResult;
  if (!entrevistaResult.data) {
    return err(entrevistaNotFoundError(entrevistaId));
  }

  if (entrevistaResult.data.status !== 'concluida') {
    return err(
      entrevistaStatusInvalidoError(entrevistaResult.data.status, 'em_andamento'),
    );
  }

  return updateStatus(entrevistaId, 'em_andamento');
}

// =============================================================================
// BUSCAR ENTREVISTA
// =============================================================================

export async function buscarEntrevistaPorContrato(
  contratoId: number,
): Promise<Result<EntrevistaTrabalhista | null>> {
  if (!contratoId || contratoId <= 0) {
    return err(entrevistaValidationError('ID do contrato inválido'));
  }
  return findByContratoId(contratoId);
}

export async function buscarEntrevista(
  id: number,
): Promise<Result<EntrevistaTrabalhista | null>> {
  if (!id || id <= 0) {
    return err(entrevistaValidationError('ID da entrevista inválido'));
  }
  return findById(id);
}
