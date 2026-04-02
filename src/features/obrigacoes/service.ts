import { AcordoComParcelas, AcordoCondenacao, AtualizarAcordoParams, AtualizarParcelaParams, CriarAcordoComParcelasParams, FiltrosRepasses, Parcela, RegistrarRepasseParams } from "./types";
import { TipoObrigacao, StatusAcordo } from "./domain";
import { ObrigacoesRepository } from "./repository";
import { calcularDataVencimento } from "./utils";
import { normalizarDocumento } from "@/app/app/partes";
import { findClienteByCPF, findClienteByCNPJ } from "@/app/app/partes/server";
import { err, appError } from "@/types";
import { buscarProcessosPorClienteCPF, buscarProcessosPorClienteCNPJ, buscarProcessoPorNumero } from "@/features/processos";
import { normalizarNumeroProcesso } from "@/features/processos/utils";

// --- Acordos Services ---

export async function criarAcordoComParcelas(
  dados: CriarAcordoComParcelasParams
) {
  // Use repository helper to wrap in transaction logic if needed
  // Here we just orchestrate
  const acordo = await ObrigacoesRepository.criarAcordo({
    processoId: dados.processoId,
    tipo: dados.tipo,
    direcao: dados.direcao,
    valorTotal: dados.valorTotal,
    dataVencimentoPrimeiraParcela: dados.dataVencimentoPrimeiraParcela,
    numeroParcelas: dados.numeroParcelas,
    formaDistribuicao: dados.formaDistribuicao,
    percentualEscritorio: dados.percentualEscritorio,
    honorariosSucumbenciaisTotal: dados.honorariosSucumbenciaisTotal,
    createdBy: dados.createdBy,
  });

  const parcelasData = calcularParcelasDoAcordo(acordo, dados);
  const parcelas = await ObrigacoesRepository.criarParcelas(parcelasData);

  return { ...acordo, parcelas };
}

export async function listarAcordos(params: import("./types").ListarAcordosParams) {
  return await ObrigacoesRepository.listarAcordos(params);
}

export async function buscarAcordoPorId(id: number) {
  return await ObrigacoesRepository.buscarAcordoPorId(id);
}

export async function atualizarAcordo(id: number, dados: AtualizarAcordoParams) {
  return await ObrigacoesRepository.atualizarAcordo(id, dados);
}

export async function deletarAcordo(id: number) {
  return await ObrigacoesRepository.deletarAcordo(id);
}

// --- Parcelas Services ---

export async function buscarParcelaPorId(id: number) {
  return await ObrigacoesRepository.buscarParcelaPorId(id);
}

export async function atualizarParcela(id: number, dados: AtualizarParcelaParams) {
  return await ObrigacoesRepository.atualizarParcela(id, dados);
}

export async function marcarParcelaRecebida(
  id: number,
  dados: { dataRecebimento: string; valorRecebido?: number }
) {
  return await ObrigacoesRepository.marcarParcelaComoRecebida(id, {
    dataEfetivacao: dados.dataRecebimento,
    valor: dados.valorRecebido,
  });
}

export async function recalcularDistribuicao(acordoId: number) {
  const acordo = await ObrigacoesRepository.buscarAcordoPorId(acordoId);
  if (!acordo) throw new Error("Acordo não encontrado");

  // Check if any parcel is paid
  const parcelas = await ObrigacoesRepository.buscarParcelasPorAcordo(acordoId);
  if (parcelas.some((p) => ["recebida", "paga"].includes(p.status))) {
    throw new Error(
      "Não é possível recalcular distribuição com parcelas já pagas."
    );
  }

  // Delete existing parcels
  await ObrigacoesRepository.deletarParcelasDoAcordo(acordoId);

  // Re-calculate
  const params: CriarAcordoComParcelasParams = {
    processoId: acordo.processoId,
    tipo: acordo.tipo,
    direcao: acordo.direcao,
    valorTotal: acordo.valorTotal,
    dataVencimentoPrimeiraParcela: acordo.dataVencimentoPrimeiraParcela,
    numeroParcelas: acordo.numeroParcelas,
    formaDistribuicao: acordo.formaDistribuicao,
    percentualEscritorio: acordo.percentualEscritorio,
    honorariosSucumbenciaisTotal: acordo.honorariosSucumbenciaisTotal,
    formaPagamentoPadrao: "transferencia_direta", // Default or fetch from somewhere? Assuming default for recalc
    intervaloEntreParcelas: 30, // Default
    createdBy: acordo.createdBy || undefined,
  };
  // Note: We might be missing original parameters like 'formaPagamentoPadrao' if not stored in Acordo.
  // Ideally, we should check the first old parcel to guess the payment method.
  if (parcelas.length > 0) {
    params.formaPagamentoPadrao =
      parcelas[0].formaPagamento || "transferencia_direta";
  }

  const novasParcelasData = calcularParcelasDoAcordo(acordo, params);
  const novasParcelas = await ObrigacoesRepository.criarParcelas(
    novasParcelasData
  );

  return novasParcelas;
}

// --- Repasses Services ---

export async function listarRepassesPendentes(filtros?: FiltrosRepasses) {
  return await ObrigacoesRepository.listarRepassesPendentes(filtros);
}

export async function anexarDeclaracaoPrestacaoContas(
  parcelaId: number,
  url: string
) {
  return await ObrigacoesRepository.anexarDeclaracaoPrestacaoContas(
    parcelaId,
    url
  );
}

export async function registrarRepasse(
  parcelaId: number,
  dados: RegistrarRepasseParams
) {
  // Validate if decoration is attached
  const parcela = await ObrigacoesRepository.buscarParcelaPorId(parcelaId);
  if (!parcela) throw new Error("Parcela não encontrada");
  if (!parcela.declaracaoPrestacaoContasUrl) {
    throw new Error("Declaração de prestação de contas obrigatória");
  }

  return await ObrigacoesRepository.registrarRepasse(parcelaId, dados);
}

// --- Helpers ---

function calcularParcelasDoAcordo(
  acordo: AcordoCondenacao,
  params: CriarAcordoComParcelasParams
): Partial<Parcela>[] {
  const parcelas: Partial<Parcela>[] = [];
  const numeroParcelas = acordo.numeroParcelas;
  const intervalo = params.intervaloEntreParcelas || 30;

  const valorPorParcelaBase = acordo.valorTotal / numeroParcelas;
  const honorariosPorParcelaBase =
    acordo.honorariosSucumbenciaisTotal / numeroParcelas;

  for (let i = 0; i < numeroParcelas; i++) {
    const isLast = i === numeroParcelas - 1;

    // Values
    const valorParcela = isLast
      ? acordo.valorTotal -
        parseFloat(valorPorParcelaBase.toFixed(2)) * (numeroParcelas - 1)
      : parseFloat(valorPorParcelaBase.toFixed(2));

    const honorariosParcela = isLast
      ? acordo.honorariosSucumbenciaisTotal -
        parseFloat(honorariosPorParcelaBase.toFixed(2)) * (numeroParcelas - 1)
      : parseFloat(honorariosPorParcelaBase.toFixed(2));

    // Date
    const dataVencimento = calcularDataVencimento(
      acordo.dataVencimentoPrimeiraParcela,
      i + 1,
      intervalo
    );

    parcelas.push({
      acordoCondenacaoId: acordo.id,
      numeroParcela: i + 1,
      valorBrutoCreditoPrincipal: parseFloat(valorParcela.toFixed(2)),
      honorariosSucumbenciais: parseFloat(honorariosParcela.toFixed(2)),
      dataVencimento,
      formaPagamento: params.formaPagamentoPadrao,
      editadoManualmente: false,
    });
  }
  return parcelas;
}

/**
 * Helper para Portal do Cliente: Lista acordos filtrados por busca (CPF) retornando array tipado.
 *
 * Busca processos vinculados ao cliente pelo CPF e retorna acordos desses processos.
 * Não usa .or() em foreign tables (não suportado pelo PostgREST).
 */
export async function listarAcordosPorBuscaCpf(
  cpf: string
): Promise<AcordoComParcelas[]> {
  const cpfNormalizado = normalizarDocumento(cpf);

  if (cpfNormalizado.length !== 11) {
    return [];
  }

  // Busca processos do cliente via CPF
  const processosResult = await buscarProcessosPorClienteCPF(cpfNormalizado, 100);
  if (!processosResult.success || processosResult.data.length === 0) {
    return [];
  }

  const processoIds = processosResult.data.map((p) => p.id);

  // Busca acordos dos processos
  return ObrigacoesRepository.listarAcordosPorProcessoIds(processoIds);
}

// =============================================================================
// BUSCAS POR CPF/CNPJ (para MCP Tools - FASE 1)
// =============================================================================

/**
 * Busca acordos e condenações vinculados a um cliente por CPF
 */
export async function buscarAcordosPorClienteCPF(
  cpf: string,
  tipo?: TipoObrigacao,
  status?: StatusAcordo
): Promise<import("@/types").Result<AcordoComParcelas[]>> {

  if (!cpf || !cpf.trim()) {
    return err(appError("VALIDATION_ERROR", "CPF e obrigatorio"));
  }

  const cpfNormalizado = normalizarDocumento(cpf);

  if (cpfNormalizado.length !== 11) {
    return err(appError("VALIDATION_ERROR", "CPF deve conter 11 digitos"));
  }

  try {
    // Busca cliente por CPF
    const clienteResult = await findClienteByCPF(cpfNormalizado);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError("NOT_FOUND", "Cliente nao encontrado"));
    }

    // const clienteId = clienteResult.data.id;

    // Busca processos do cliente
    const processosResult = await buscarProcessosPorClienteCPF(cpf, 100);
    if (!processosResult.success) return err(processosResult.error);

    if (processosResult.data.length === 0) {
      return { success: true, data: [] };
    }

    const processoIds = processosResult.data.map((p) => p.id);

    // Busca acordos de todos os processos em uma única consulta
    const allAcordos = await ObrigacoesRepository.listarAcordosPorProcessoIds(
      processoIds,
      { tipo, status }
    );

    return { success: true, data: allAcordos };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar acordos"
      )
    );
  }
}

/**
 * Busca acordos e condenações vinculados a um cliente por CNPJ
 */
export async function buscarAcordosPorClienteCNPJ(
  cnpj: string,
  tipo?: TipoObrigacao,
  status?: StatusAcordo
): Promise<import("@/types").Result<AcordoComParcelas[]>> {

  if (!cnpj || !cnpj.trim()) {
    return err(appError("VALIDATION_ERROR", "CNPJ e obrigatorio"));
  }

  const cnpjNormalizado = normalizarDocumento(cnpj);

  if (cnpjNormalizado.length !== 14) {
    return err(appError("VALIDATION_ERROR", "CNPJ deve conter 14 digitos"));
  }

  try {
    // Busca cliente por CNPJ
    const clienteResult = await findClienteByCNPJ(cnpjNormalizado);
    if (!clienteResult.success) return err(clienteResult.error);
    if (!clienteResult.data) {
      return err(appError("NOT_FOUND", "Cliente nao encontrado"));
    }

    // Busca processos do cliente
    const processosResult = await buscarProcessosPorClienteCNPJ(cnpj, 100);
    if (!processosResult.success) return err(processosResult.error);

    if (processosResult.data.length === 0) {
      return { success: true, data: [] };
    }

    const processoIds = processosResult.data.map((p) => p.id);

    // Busca acordos de todos os processos em uma única consulta
    const allAcordos = await ObrigacoesRepository.listarAcordosPorProcessoIds(
      processoIds,
      { tipo, status }
    );

    return { success: true, data: allAcordos };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar acordos"
      )
    );
  }
}

// =============================================================================
// BUSCAS POR NUMERO DE PROCESSO (para MCP Tools - FASE 2)
// =============================================================================

/**
 * Busca acordos e condenações de um processo específico pelo número processual
 */
export async function buscarAcordosPorNumeroProcesso(
  numeroProcesso: string,
  tipo?: TipoObrigacao
): Promise<import("@/types").Result<AcordoComParcelas[]>> {

  if (!numeroProcesso || !numeroProcesso.trim()) {
    return err(
      appError("VALIDATION_ERROR", "Numero do processo e obrigatorio")
    );
  }

  try {
    // Normalizar número de processo antes de buscar
    const numeroNormalizado = normalizarNumeroProcesso(numeroProcesso.trim());

    // Busca processo por número normalizado (via service, não Server Action)
    const processoResult = await buscarProcessoPorNumero(numeroNormalizado);

    if (!processoResult.success || !processoResult.data) {
      return err(appError("NOT_FOUND", "Processo nao encontrado"));
    }

    const processoId = processoResult.data.id;

    // Busca acordos do processo
    const result = await listarAcordos({
      processoId,
      tipo,
      limite: 100,
    });

    return { success: true, data: result.acordos || [] };
  } catch (error) {
    return err(
      appError(
        "INTERNAL_ERROR",
        error instanceof Error ? error.message : "Erro ao buscar acordos"
      )
    );
  }
}
