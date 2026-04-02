/**
 * PERÍCIAS SERVICE - Camada de Negócio
 */

import "server-only";

import type { Result, PaginatedResponse } from "@/types";
import { err, appError } from "@/types";
import {
  adicionarObservacaoSchema,
  atribuirResponsavelSchema,
  criarPericiaSchema,
  type Pericia,
  type ListarPericiasParams,
  SituacaoPericiaCodigo,
} from "./domain";
import * as repository from "./repository";

export async function listarPericias(
  params: ListarPericiasParams
): Promise<Result<PaginatedResponse<Pericia>>> {
  const saneParams: ListarPericiasParams = {
    ...params,
    pagina: params.pagina && params.pagina > 0 ? params.pagina : 1,
    limite:
      params.limite && params.limite > 0 && params.limite <= 1000
        ? params.limite
        : 50,
    ordenarPor: params.ordenarPor ?? "prazo_entrega",
    ordem: params.ordem ?? "asc",
  };

  return repository.findAllPericias(saneParams);
}

export async function obterPericia(id: number): Promise<Result<Pericia | null>> {
  if (!id || id <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da perícia inválido."));
  }
  return repository.findPericiaById(id);
}

export async function atribuirResponsavel(
  params: unknown
): Promise<Result<boolean>> {
  const validacao = atribuirResponsavelSchema.safeParse(params);
  if (!validacao.success) {
    return err(
      appError(
        "VALIDATION_ERROR",
        validacao.error.errors[0]?.message || "Dados inválidos."
      )
    );
  }

  return repository.atribuirResponsavelPericia(
    validacao.data.periciaId,
    validacao.data.responsavelId
  );
}

export async function adicionarObservacao(
  params: unknown
): Promise<Result<boolean>> {
  const validacao = adicionarObservacaoSchema.safeParse(params);
  if (!validacao.success) {
    return err(
      appError(
        "VALIDATION_ERROR",
        validacao.error.errors[0]?.message || "Dados inválidos."
      )
    );
  }

  return repository.adicionarObservacaoPericia(
    validacao.data.periciaId,
    validacao.data.observacoes
  );
}

export async function listarEspecialidadesPericia(): Promise<
  Result<{ id: number; descricao: string }[]>
> {
  return repository.listEspecialidadesPericia();
}

export async function criarPericia(
  params: unknown,
  advogadoId: number
): Promise<Result<Pericia>> {
  const validacao = criarPericiaSchema.safeParse(params);
  if (!validacao.success) {
    return err(
      appError(
        "VALIDATION_ERROR",
        validacao.error.errors[0]?.message || "Dados inválidos."
      )
    );
  }

  if (!advogadoId || advogadoId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID do advogado inválido."));
  }

  return repository.criarPericia(validacao.data, advogadoId);
}

export async function atualizarSituacao(
  periciaId: number,
  situacaoCodigo: SituacaoPericiaCodigo
): Promise<Result<boolean>> {
  if (!periciaId || periciaId <= 0) {
    return err(appError("VALIDATION_ERROR", "ID da perícia inválido."));
  }
  // TODO: Adicionar validação de transição de status se necessário
  return repository.atualizarSituacaoPericia(periciaId, situacaoCodigo);
}


