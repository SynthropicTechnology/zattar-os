/**
 * Serviço de persistência de entidades (clientes, partes contrárias, terceiros)
 *
 * Este serviço é responsável por:
 * - Upsert de clientes (PF e PJ) por CPF/CNPJ
 * - Upsert de partes contrárias (PF e PJ) por CPF/CNPJ
 * - Upsert de terceiros (PF e PJ) por CPF/CNPJ ou sem documento
 * - Registro em cadastros_pje para mapeamento PJE <-> Sistema
 */

import type { PartePJE } from "@/features/captura/pje-trt/partes/types";
import type { TipoParteClassificacao } from "../types";
import type { ProcessoParaCaptura } from "../partes-capture.service";
import type {
  CreateClientePFInput as CriarClientePFParams,
  CreateClientePJInput as CriarClientePJParams,
  CreateParteContrariaPFInput as CriarParteContrariaPFParams,
  CreateParteContrariaPJInput as CriarParteContrariaPJParams,
  CreateTerceiroPFInput as CriarTerceiroPFParams,
  CreateTerceiroPJInput as CriarTerceiroPJParams,
} from "@/app/app/partes";
import {
  upsertClientePorCPF,
  upsertClientePorCNPJ,
  buscarClientePorCPF,
  buscarClientePorCNPJ,
  upsertParteContrariaPorCPF,
  upsertParteContrariaPorCNPJ,
  buscarParteContrariaPorCPF,
  buscarParteContrariaPorCNPJ,
  criarParteContrariaSemDocumento,
  buscarTerceiroPorCPF,
  buscarTerceiroPorCNPJ,
  criarTerceiroSemDocumento,
} from "@/app/app/partes/repository-compat";
import {
  upsertCadastroPJE,
  buscarEntidadePorIdPessoaPJE,
  upsertTerceiroByCPF,
  upsertTerceiroByCNPJ,
} from "@/app/app/partes/server";
import { withRetry } from "@/lib/utils/retry";
import { CAPTURA_CONFIG } from "../config";
import { PersistenceError } from "../errors";
import { normalizarDocumento, temDocumentoValido } from "../utils";
import { extrairCamposPJE } from "../utils";

// Upsert params são iguais aos Create params (com ID opcional tratado internamente)
type UpsertTerceiroPorCPFParams = CriarTerceiroPFParams;
type UpsertTerceiroPorCNPJParams = CriarTerceiroPJParams;

/**
 * Resultado do processamento de uma parte
 */
export interface ProcessarParteResult {
  id: number;
}

/**
 * Processa uma parte: faz upsert da entidade apropriada usando CPF/CNPJ como chave
 *
 * @param parte - Dados da parte do PJE
 * @param tipoParte - Tipo classificado (cliente, parte_contraria, terceiro)
 * @param processo - Dados do processo
 * @returns Objeto com ID da entidade ou null se falhou
 */
export async function processarParte(
  parte: PartePJE,
  tipoParte: TipoParteClassificacao,
  processo: ProcessoParaCaptura,
): Promise<ProcessarParteResult | null> {
  const isPessoaFisica = parte.tipoDocumento === "CPF";
  const documento = parte.numeroDocumento;
  const documentoNormalizado = normalizarDocumento(documento);

  // Mapeia dados comuns
  const dadosComuns = mapearDadosComuns(parte);

  // Extrai campos adicionais do PJE
  const camposExtras = extrairCamposPJE(parte);

  // Mescla dados comuns com campos extras
  const dadosCompletos = { ...dadosComuns, ...camposExtras };

  // Validar se o documento tem comprimento correto
  const tipoDoc =
    parte.tipoDocumento === "CPF" || parte.tipoDocumento === "CNPJ"
      ? parte.tipoDocumento
      : isPessoaFisica
        ? "CPF"
        : "CNPJ";
  const documentoValido = temDocumentoValido(documento, tipoDoc);

  try {
    let entidadeId: number | null = null;

    switch (tipoParte) {
      case "cliente":
        entidadeId = await processarCliente(
          parte,
          isPessoaFisica,
          documentoNormalizado,
          documentoValido,
          dadosCompletos,
        );
        break;

      case "parte_contraria":
        entidadeId = await processarParteContraria(
          parte,
          isPessoaFisica,
          documentoNormalizado,
          documentoValido,
          dadosComuns,
          processo,
        );
        break;

      case "terceiro":
        entidadeId = await processarTerceiro(
          parte,
          isPessoaFisica,
          documentoNormalizado,
          documentoValido,
          dadosCompletos,
          processo,
        );
        break;
    }

    // Após upsert da entidade, registrar em cadastros_pje
    if (entidadeId) {
      await registrarCadastroPJE(entidadeId, tipoParte, parte, processo);
    }

    return entidadeId ? { id: entidadeId } : null;
  } catch (error) {
    throw new PersistenceError(
      `Erro ao processar parte ${parte.nome}`,
      "upsert",
      tipoParte,
      {
        parte: parte.nome,
        error: error instanceof Error ? error.message : String(error),
      },
    );
  }
}

/**
 * Dados comuns mapeados de uma parte PJE
 */
interface DadosComuns {
  nome: string;
  emails?: string[];
  ddd_celular?: string;
  numero_celular?: string;
  ddd_residencial?: string;
  numero_residencial?: string;
}

/**
 * Mapeia dados comuns de uma parte PJE para formato de persistência
 */
function mapearDadosComuns(parte: PartePJE): DadosComuns {
  return {
    nome: parte.nome,
    emails: parte.emails.length > 0 ? parte.emails : undefined,
    ddd_celular: parte.telefones[0]?.ddd || undefined,
    numero_celular: parte.telefones[0]?.numero || undefined,
    ddd_residencial: parte.telefones[1]?.ddd || undefined,
    numero_residencial: parte.telefones[1]?.numero || undefined,
  };
}

/**
 * Processa um cliente (upsert por CPF/CNPJ)
 */
async function processarCliente(
  parte: PartePJE,
  isPessoaFisica: boolean,
  documentoNormalizado: string,
  documentoValido: boolean,
  dadosCompletos: DadosComuns & Record<string, unknown>,
): Promise<number | null> {
  // Cliente sem documento válido não pode ser processado
  if (!documentoValido) {
    console.warn(
      `[PARTES] Cliente "${parte.nome}" sem documento válido (${
        isPessoaFisica ? "CPF" : "CNPJ"
      }) - ignorando`,
    );
    return null;
  }

  // Buscar entidade existente por CPF/CNPJ
  const entidadeExistente = isPessoaFisica
    ? await buscarClientePorCPF(documentoNormalizado)
    : await buscarClientePorCNPJ(documentoNormalizado);

  if (entidadeExistente) {
    // UPDATE: entidade já existe
    return entidadeExistente.id;
  }

  // INSERT: nova entidade
  if (isPessoaFisica) {
    const params: CriarClientePFParams = {
      ...dadosCompletos,
      tipo_pessoa: "pf",
      cpf: documentoNormalizado,
      ativo: true,
    };
    const result = await withRetry(
      () => upsertClientePorCPF(documentoNormalizado, params),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      },
    );
    return result.cliente?.id ?? null;
  } else {
    const params: CriarClientePJParams = {
      ...dadosCompletos,
      tipo_pessoa: "pj",
      cnpj: documentoNormalizado,
      ativo: true,
    };
    const result = await withRetry(
      () => upsertClientePorCNPJ(documentoNormalizado, params),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      },
    );
    return result.cliente?.id ?? null;
  }
}

/**
 * Processa uma parte contrária (upsert por CPF/CNPJ ou criação sem documento)
 *
 * Permite criar partes contrárias sem documento para casos especiais como:
 * - Mandados de segurança contra órgãos julgadores (Juízo da Vara, Tribunal, etc.)
 * - Entidades públicas sem CNPJ cadastrado no PJE
 */
async function processarParteContraria(
  parte: PartePJE,
  isPessoaFisica: boolean,
  documentoNormalizado: string,
  documentoValido: boolean,
  dadosComuns: DadosComuns,
  processo: ProcessoParaCaptura,
): Promise<number | null> {
  if (documentoValido) {
    return await processarParteContrariaComDocumento(
      parte,
      isPessoaFisica,
      documentoNormalizado,
      dadosComuns,
    );
  } else {
    return await processarParteContrariaSemDocumento(parte, processo);
  }
}

/**
 * Processa parte contrária que possui documento válido
 */
async function processarParteContrariaComDocumento(
  parte: PartePJE,
  isPessoaFisica: boolean,
  documentoNormalizado: string,
  dadosComuns: DadosComuns,
): Promise<number | null> {
  // Buscar entidade existente por CPF/CNPJ
  const entidadeExistente = isPessoaFisica
    ? await buscarParteContrariaPorCPF(documentoNormalizado)
    : await buscarParteContrariaPorCNPJ(documentoNormalizado);

  if (entidadeExistente) {
    // UPDATE: entidade já existe
    return entidadeExistente.id;
  }

  // INSERT: nova entidade
  if (isPessoaFisica) {
    const params: CriarParteContrariaPFParams = {
      ...dadosComuns,
      tipo_pessoa: "pf",
      cpf: documentoNormalizado,
      ativo: true,
    };
    const result = await withRetry(
      () => upsertParteContrariaPorCPF(documentoNormalizado, params),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      },
    );
    return result.parteContraria?.id ?? null;
  } else {
    const params: CriarParteContrariaPJParams = {
      ...dadosComuns,
      tipo_pessoa: "pj",
      cnpj: documentoNormalizado,
      ativo: true,
    };
    const result = await withRetry(
      () => upsertParteContrariaPorCNPJ(documentoNormalizado, params),
      {
        maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
        baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
      },
    );
    return result.parteContraria?.id ?? null;
  }
}

/**
 * Processa parte contrária sem documento válido
 *
 * Usado para casos especiais como:
 * - Órgãos julgadores em mandados de segurança (Juízo da 3ª Vara, Tribunal, etc.)
 * - Entidades públicas sem CNPJ cadastrado no PJE
 */
async function processarParteContrariaSemDocumento(
  parte: PartePJE,
  processo: ProcessoParaCaptura,
): Promise<number | null> {
  console.log(
    `[PARTES] Parte contrária "${parte.nome}" sem documento válido - usando busca por id_pessoa_pje`,
  );

  // 1. Tentar encontrar entidade existente via cadastros_pje
  const cadastroExistente = await buscarEntidadePorIdPessoaPJE({
    id_pessoa_pje: parte.idPessoa,
    sistema: "pje_trt",
    tribunal: processo.trt,
    grau: processo.grau === "primeiro_grau" ? "primeiro_grau" : "segundo_grau",
    tipo_entidade: "parte_contraria",
  });

  if (
    cadastroExistente &&
    cadastroExistente.tipo_entidade === "parte_contraria"
  ) {
    console.log(
      `[PARTES] Parte contrária "${parte.nome}" encontrada via cadastros_pje: ID ${cadastroExistente.entidade_id}`,
    );
    return cadastroExistente.entidade_id;
  }

  // 2. Criar nova entidade sem documento
  const tipoPessoaInferido = inferirTipoPessoaParteContraria(parte.nome);

  const params = {
    nome: parte.nome,
    tipo_pessoa: tipoPessoaInferido,
    emails: parte.emails.length > 0 ? parte.emails : undefined,
    ddd_celular: parte.telefones[0]?.ddd || undefined,
    numero_celular: parte.telefones[0]?.numero || undefined,
    ddd_residencial: parte.telefones[1]?.ddd || undefined,
    numero_residencial: parte.telefones[1]?.numero || undefined,
    ativo: true,
    // Documento vazio - será null no banco
    cpf: tipoPessoaInferido === "pf" ? undefined : undefined,
    cnpj: tipoPessoaInferido === "pj" ? undefined : undefined,
  };

  const result = await withRetry(
    () =>
      criarParteContrariaSemDocumento(
        params as unknown as
          | CriarParteContrariaPFParams
          | CriarParteContrariaPJParams,
      ),
    {
      maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
      baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
    },
  );

  if (result.parteContraria) {
    console.log(
      `[PARTES] Parte contrária "${parte.nome}" criada sem documento: ID ${result.parteContraria.id}`,
    );
    return result.parteContraria.id;
  }

  throw new PersistenceError(
    "Erro ao criar parte contrária sem documento: resultado inesperado",
    "insert",
    "parte_contraria",
    { parte: parte.nome, idPessoa: parte.idPessoa },
  );
}

/**
 * Infere tipo de pessoa (PF ou PJ) para parte contrária baseado no nome
 * Heurística: órgãos julgadores, ministérios, autarquias, etc são PJ
 */
function inferirTipoPessoaParteContraria(nome: string): "pf" | "pj" {
  const pareceSerPJ =
    /^(JU[ÍI]ZO|JUIZADO|VARA|TRIBUNAL|TRT|TST|STF|STJ|MINIST[ÉE]RIO|MINISTERIO|UNI[ÃA]O|UNIAO|ESTADO|MUNIC[ÍI]PIO|MUNICIPIO|INSTITUTO|INSS|IBAMA|ANVISA|RECEITA|FAZENDA|FUNDA[ÇC][ÃA]O|FUNDACAO|AUTARQUIA|EMPRESA|[ÓO]RG[ÃA]O|ORGAO|SECRETARIA|PREFEITURA|GOVERNO|C[ÂA]MARA|CAMARA|SENADO|ASSEMBL[ÉE]IA|ASSEMBLEIA)/i.test(
      nome.trim(),
    );
  return pareceSerPJ ? "pj" : "pf";
}

/**
 * Processa um terceiro (upsert por CPF/CNPJ ou criação sem documento)
 */
async function processarTerceiro(
  parte: PartePJE,
  isPessoaFisica: boolean,
  documentoNormalizado: string,
  documentoValido: boolean,
  dadosCompletos: DadosComuns & Record<string, unknown>,
  processo: ProcessoParaCaptura,
): Promise<number | null> {
  if (documentoValido) {
    return await processarTerceiroComDocumento(
      parte,
      isPessoaFisica,
      documentoNormalizado,
      dadosCompletos,
    );
  } else {
    return await processarTerceiroSemDocumento(parte, processo);
  }
}

/**
 * Processa terceiro que possui documento válido
 */
async function processarTerceiroComDocumento(
  parte: PartePJE,
  isPessoaFisica: boolean,
  documentoNormalizado: string,
  dadosCompletos: DadosComuns & Record<string, unknown>,
): Promise<number | null> {
  // Buscar entidade existente por CPF/CNPJ
  const entidadeExistente = isPessoaFisica
    ? await buscarTerceiroPorCPF(documentoNormalizado)
    : await buscarTerceiroPorCNPJ(documentoNormalizado);

  if (entidadeExistente) {
    // UPDATE: entidade já existe
    return entidadeExistente.id;
  }

  // INSERT: nova entidade com documento
  const params = {
    ...dadosCompletos,
    tipo_pessoa: isPessoaFisica ? "pf" : "pj",
    cpf: isPessoaFisica ? documentoNormalizado : undefined,
    cnpj: !isPessoaFisica ? documentoNormalizado : undefined,
    tipo_parte: parte.tipoParte,
    polo: parte.polo,
    ativo: true,
  } as CriarTerceiroPFParams | CriarTerceiroPJParams;

  const result = isPessoaFisica
    ? await upsertTerceiroByCPF(
        documentoNormalizado,
        params as UpsertTerceiroPorCPFParams,
      )
    : await upsertTerceiroByCNPJ(
        documentoNormalizado,
        params as UpsertTerceiroPorCNPJParams,
      );

  if (result.success && result.data?.terceiro) {
    return result.data.terceiro.id;
  }

  // Se houve conflito (race condition no processamento paralelo),
  // tentar buscar novamente a entidade que foi inserida por outra thread
  if (!result.success && result.error?.code === "CONFLICT") {
    console.warn(
      `[PARTES] Conflito ao inserir terceiro "${parte.nome}" - tentando buscar existente`,
    );
    const retryLookup = isPessoaFisica
      ? await buscarTerceiroPorCPF(documentoNormalizado)
      : await buscarTerceiroPorCNPJ(documentoNormalizado);
    if (retryLookup) {
      return retryLookup.id;
    }
  }

  // Propagar erro real em vez de retornar null silenciosamente
  const errorMsg = !result.success
    ? result.error?.message ?? "Erro desconhecido"
    : "Resultado sem dados de terceiro";
  throw new PersistenceError(
    `Erro ao persistir terceiro com documento: ${errorMsg}`,
    "insert",
    "terceiro",
    { parte: parte.nome, documento: documentoNormalizado },
  );
}

/**
 * Processa terceiro sem documento válido
 * Comum para entidades como Ministério Público, Peritos sem CPF, Testemunhas, etc.
 */
async function processarTerceiroSemDocumento(
  parte: PartePJE,
  processo: ProcessoParaCaptura,
): Promise<number | null> {
  console.log(
    `[PARTES] Terceiro "${parte.nome}" sem documento válido - usando busca por id_pessoa_pje`,
  );

  // 1. Tentar encontrar entidade existente via cadastros_pje
  const cadastroExistente = await buscarEntidadePorIdPessoaPJE({
    id_pessoa_pje: parte.idPessoa,
    sistema: "pje_trt",
    tribunal: processo.trt,
    grau: processo.grau === "primeiro_grau" ? "primeiro_grau" : "segundo_grau",
    tipo_entidade: "terceiro",
  });

  if (cadastroExistente && cadastroExistente.tipo_entidade === "terceiro") {
    console.log(
      `[PARTES] Terceiro "${parte.nome}" encontrado via cadastros_pje: ID ${cadastroExistente.entidade_id}`,
    );
    return cadastroExistente.entidade_id;
  }

  // 2. Criar nova entidade sem documento
  const tipoPessoaInferido = inferirTipoPessoa(parte.nome);

  const params = {
    nome: parte.nome,
    tipo_pessoa: tipoPessoaInferido,
    tipo_parte: parte.tipoParte,
    polo: parte.polo,
    emails: parte.emails.length > 0 ? parte.emails : undefined,
    ddd_celular: parte.telefones[0]?.ddd || undefined,
    numero_celular: parte.telefones[0]?.numero || undefined,
    ddd_residencial: parte.telefones[1]?.ddd || undefined,
    numero_residencial: parte.telefones[1]?.numero || undefined,
    ativo: true,
    // Sem documento - usar undefined para que o banco receba NULL
    // (string vazia "" violaria unique constraint parcial WHERE cpf IS NOT NULL)
    cpf: undefined,
    cnpj: undefined,
  };

  const result = await withRetry(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    () => criarTerceiroSemDocumento(params as any),
    {
      maxAttempts: CAPTURA_CONFIG.RETRY_MAX_ATTEMPTS,
      baseDelay: CAPTURA_CONFIG.RETRY_BASE_DELAY_MS,
    },
  );

  if (result.terceiro) {
    console.log(
      `[PARTES] Terceiro "${parte.nome}" criado sem documento: ID ${result.terceiro.id}`,
    );
    return result.terceiro.id;
  }

  throw new PersistenceError(
    "Erro ao criar terceiro sem documento: resultado inesperado",
    "insert",
    "terceiro",
    { parte: parte.nome, idPessoa: parte.idPessoa },
  );
}

/**
 * Infere tipo de pessoa (PF ou PJ) baseado no nome
 * Heurística: nomes com "MINISTÉRIO", "UNIÃO", etc são PJ
 */
function inferirTipoPessoa(nome: string): "pf" | "pj" {
  const pareceSerPJ =
    /^(MINISTÉRIO|MINISTERIO|UNIÃO|UNIAO|ESTADO|MUNICÍPIO|MUNICIPIO|INSTITUTO|INSS|IBAMA|ANVISA|RECEITA|FAZENDA|FUNDAÇÃO|FUNDACAO|AUTARQUIA|EMPRESA|ÓRGÃO|ORGAO)/i.test(
      nome.trim(),
    );
  return pareceSerPJ ? "pj" : "pf";
}

/**
 * Registra entidade em cadastros_pje para mapeamento PJE <-> Sistema
 */
async function registrarCadastroPJE(
  entidadeId: number,
  tipoParte: TipoParteClassificacao,
  parte: PartePJE,
  processo: ProcessoParaCaptura,
): Promise<void> {
  try {
    // Validar que o tribunal está presente (campo obrigatório)
    if (!processo.trt) {
      throw new Error(
        `Tribunal não informado para processo ${processo.id_pje}`,
      );
    }

    await upsertCadastroPJE({
      tipo_entidade: tipoParte,
      entidade_id: entidadeId,
      id_pessoa_pje: parte.idPessoa,
      sistema: "pje_trt",
      tribunal: processo.trt,
      grau:
        processo.grau === "primeiro_grau" ? "primeiro_grau" : "segundo_grau",
      dados_cadastro_pje: parte.dadosCompletos,
    });
  } catch (cadastroError) {
    // Log erro mas não falha a captura - dados principais já salvos
    console.error(
      `Erro ao registrar em cadastros_pje para ${tipoParte} ${entidadeId}:`,
      cadastroError,
    );
  }
}

/**
 * Registra representante em cadastros_pje
 */
export async function registrarRepresentanteCadastroPJE(
  representanteId: number,
  idPessoaPje: number,
  dadosCompletos: Record<string, unknown> | undefined,
  processo: ProcessoParaCaptura,
): Promise<void> {
  try {
    if (!processo.trt) {
      throw new Error(
        `Tribunal não informado para processo ${processo.id_pje}`,
      );
    }

    await upsertCadastroPJE({
      tipo_entidade: "representante",
      entidade_id: representanteId,
      id_pessoa_pje: idPessoaPje,
      sistema: "pje_trt",
      tribunal: processo.trt,
      grau:
        processo.grau === "primeiro_grau" ? "primeiro_grau" : "segundo_grau",
      dados_cadastro_pje: dadosCompletos,
    });
  } catch (cadastroError) {
    // Log erro mas não falha a captura
    console.error(
      `Erro ao registrar representante em cadastros_pje:`,
      cadastroError,
    );
  }
}
