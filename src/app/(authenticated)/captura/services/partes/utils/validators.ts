/**
 * Utilitários para validação e extração de dados PJE
 *
 * Este módulo contém funções para:
 * - Validar endereços do PJE
 * - Extrair campos específicos do PJE de partes
 * - Extrair campos específicos do PJE de representantes
 */

import type { PartePJE, RepresentantePJE } from "@/app/(authenticated)/captura/pje-trt/partes/types";
import { normalizarPolo } from "./polo-mapper";

// ============================================================================
// Tipos para estruturas do PJE (dadosCompletos)
// ============================================================================

/** Estrutura de estado retornada pelo PJE */
interface EstadoPJE {
  id?: number;
  sigla?: string;
  descricao?: string;
}

/** Estrutura de naturalidade retornada pelo PJE */
interface NaturalidadePJE {
  id?: number;
  municipio?: string;
  estado?: EstadoPJE;
}

/** Estrutura de país retornada pelo PJE */
interface PaisPJE {
  id?: number;
  codigo?: string;
  descricao?: string;
}

/** Estrutura de situação na Receita (CPF/CNPJ) retornada pelo PJE */
interface SituacaoReceitaPJE {
  id?: number;
  descricao?: string;
}

/** Estrutura de endereço retornada pelo PJE */
export interface EnderecoPJE {
  id?: number;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  idMunicipio?: number;
  municipio?: string;
  municipioIbge?: string;
  estado?: { id?: number; sigla?: string; descricao?: string };
  pais?: { id?: number; codigo?: string; descricao?: string };
  nroCep?: string;
  classificacoesEndereco?: unknown[];
  correspondencia?: boolean;
  situacao?: string;
  idUsuarioCadastrador?: number;
  dtAlteracao?: string;
}

/** Campos mínimos para endereço válido (pelo menos um deve estar presente) */
const CAMPOS_MINIMOS_ENDERECO = ["logradouro", "municipio", "cep"] as const;

// ============================================================================
// Validação de Endereço
// ============================================================================

/**
 * Resultado da validação de endereço
 */
export interface ValidacaoEnderecoResult {
  valido: boolean;
  avisos: string[];
}

/**
 * Valida endereço do PJE
 * Utiliza CAMPOS_MINIMOS_ENDERECO para verificar campos obrigatórios
 *
 * @param endereco - Endereço retornado pelo PJE
 * @returns Objeto com flag de validade e array de avisos
 */
export function validarEnderecoPJE(endereco: EnderecoPJE): ValidacaoEnderecoResult {
  const avisos: string[] = [];

  if (!endereco.id || endereco.id <= 0) {
    avisos.push("ID do endereço inválido ou ausente");
  }

  if (!endereco.logradouro?.trim()) {
    avisos.push("Logradouro obrigatório");
  }

  if (!endereco.municipio?.trim()) {
    avisos.push("Município obrigatório");
  }

  if (!endereco.estado?.sigla?.trim()) {
    avisos.push("Estado obrigatório");
  }

  if (!endereco.nroCep?.trim()) {
    avisos.push("CEP obrigatório");
  }

  // Mapeia os campos do PJE para os campos esperados
  const camposPJE: Record<string, unknown> = {
    logradouro: endereco.logradouro,
    municipio: endereco.municipio,
    cep: endereco.nroCep, // Nota: no PJE o campo é nroCep
  };

  // Verifica quais campos mínimos estão presentes
  const camposPresentes = CAMPOS_MINIMOS_ENDERECO.filter(
    (campo) => !!camposPJE[campo]
  );

  // Adiciona avisos para campos ausentes
  CAMPOS_MINIMOS_ENDERECO.forEach((campo) => {
    if (!camposPJE[campo]) {
      avisos.push(`Endereço sem ${campo}`);
    }
  });

  // Endereço é válido se tiver ID válido E pelo menos um campo mínimo
  const valido = !!(
    endereco.id &&
    endereco.id > 0 &&
    camposPresentes.length > 0
  );

  return { valido, avisos };
}

/**
 * Verifica se um endereço possui os campos mínimos necessários
 *
 * @param endereco - Endereço a ser verificado
 * @returns true se endereço possui pelo menos um campo mínimo
 */
export function temCamposMinimosEndereco(endereco: EnderecoPJE | undefined | null): boolean {
  if (!endereco) return false;

  return !!(
    endereco.logradouro?.trim() ||
    endereco.municipio?.trim() ||
    endereco.nroCep?.trim()
  );
}

// ============================================================================
// Extração de Campos PJE - Partes
// ============================================================================

/**
 * Tipo para campos extraídos do PJE
 */
export type CamposExtraidosPJE = Record<string, unknown>;

/**
 * Extrai campos específicos do PJE de dadosCompletos de uma parte
 *
 * ESTRUTURA DO JSON DO PJE:
 * - Campos comuns ficam na raiz de dadosCompletos (status, situacao, autoridade)
 * - Campos de pessoa física ficam em dadosCompletos.pessoaFisica
 * - Campos de pessoa jurídica ficam em dadosCompletos.pessoaJuridica
 *
 * NOTA: O login pode vir na raiz OU dentro de pessoaFisica/pessoaJuridica
 *
 * @param parte - Parte retornada pelo PJE
 * @returns Objeto com campos extraídos para persistência
 */
export function extrairCamposPJE(parte: PartePJE): CamposExtraidosPJE {
  const dados = parte.dadosCompletos;
  const camposExtraidos: CamposExtraidosPJE = {};

  // Extrair objetos específicos de PF e PJ
  const pessoaFisica = dados?.pessoaFisica as
    | Record<string, unknown>
    | undefined;
  const pessoaJuridica = dados?.pessoaJuridica as
    | Record<string, unknown>
    | undefined;

  // Campos comuns (podem estar na raiz ou dentro de pessoaFisica/pessoaJuridica)
  camposExtraidos.tipo_documento = parte.tipoDocumento;
  camposExtraidos.status_pje = dados?.status as string | undefined;
  camposExtraidos.situacao_pje = dados?.situacao as string | undefined;
  camposExtraidos.autoridade =
    dados?.autoridade !== undefined ? Boolean(dados.autoridade) : undefined;

  // Login pode estar na raiz OU dentro de pessoaFisica/pessoaJuridica
  camposExtraidos.login_pje = (dados?.login ??
    pessoaFisica?.login ??
    pessoaJuridica?.login) as string | undefined;

  // Campos específicos de PF (vêm de dadosCompletos.pessoaFisica)
  if (parte.tipoDocumento === "CPF" && pessoaFisica) {
    extrairCamposPessoaFisica(camposExtraidos, pessoaFisica, dados);
  }

  // Campos específicos de PJ (vêm de dadosCompletos.pessoaJuridica)
  if (parte.tipoDocumento === "CNPJ" && pessoaJuridica) {
    extrairCamposPessoaJuridica(camposExtraidos, pessoaJuridica);
  }

  return camposExtraidos;
}

/**
 * Extrai campos específicos de pessoa física do PJE
 */
function extrairCamposPessoaFisica(
  camposExtraidos: CamposExtraidosPJE,
  pessoaFisica: Record<string, unknown>,
  dados: Record<string, unknown> | undefined
): void {
  // Sexo pode vir como "sexo" (texto) ou "codigoSexo" (código)
  camposExtraidos.sexo = (pessoaFisica.sexo ?? dados?.sexo) as
    | string
    | undefined;
  camposExtraidos.nome_genitora = pessoaFisica.nomeGenitora as
    | string
    | undefined;

  // Naturalidade (cast para tipo específico)
  const naturalidade = pessoaFisica.naturalidade as
    | NaturalidadePJE
    | undefined;
  if (naturalidade) {
    camposExtraidos.naturalidade_id_pje =
      naturalidade.id !== undefined ? Number(naturalidade.id) : undefined;
    // Nome do município pode vir como "nome" ou "municipio" dependendo do TRT
    camposExtraidos.naturalidade_municipio =
      ((naturalidade as Record<string, unknown>).nome as
        | string
        | undefined) ?? naturalidade.municipio;
    camposExtraidos.naturalidade_estado_id_pje =
      naturalidade.estado?.id !== undefined
        ? Number(naturalidade.estado.id)
        : undefined;
    camposExtraidos.naturalidade_estado_sigla = naturalidade.estado?.sigla;
  }

  // UF Nascimento (cast para tipo específico)
  const ufNascimento = pessoaFisica.ufNascimento as EstadoPJE | undefined;
  if (ufNascimento) {
    camposExtraidos.uf_nascimento_id_pje =
      ufNascimento.id !== undefined ? Number(ufNascimento.id) : undefined;
    camposExtraidos.uf_nascimento_sigla = ufNascimento.sigla;
    camposExtraidos.uf_nascimento_descricao = ufNascimento.descricao;
  }

  // País Nascimento (cast para tipo específico)
  const paisNascimento = pessoaFisica.paisNascimento as PaisPJE | undefined;
  if (paisNascimento) {
    camposExtraidos.pais_nascimento_id_pje =
      paisNascimento.id !== undefined ? Number(paisNascimento.id) : undefined;
    camposExtraidos.pais_nascimento_codigo = paisNascimento.codigo;
    camposExtraidos.pais_nascimento_descricao = paisNascimento.descricao;
  }

  camposExtraidos.escolaridade_codigo =
    pessoaFisica.escolaridade !== undefined
      ? Number(pessoaFisica.escolaridade)
      : undefined;

  // Situação CPF Receita - o campo no PJE é "situacaoCpfReceitaFederal"
  const situacaoCpfReceita = pessoaFisica.situacaoCpfReceitaFederal as
    | SituacaoReceitaPJE
    | undefined;
  if (situacaoCpfReceita) {
    camposExtraidos.situacao_cpf_receita_id =
      situacaoCpfReceita.id !== undefined
        ? Number(situacaoCpfReceita.id)
        : undefined;
    camposExtraidos.situacao_cpf_receita_descricao =
      situacaoCpfReceita.descricao;
  }

  // Campo é "podeUsarCelularParaMensagem"
  camposExtraidos.pode_usar_celular_mensagem =
    pessoaFisica.podeUsarCelularParaMensagem !== undefined
      ? Boolean(pessoaFisica.podeUsarCelularParaMensagem)
      : undefined;
}

/**
 * Extrai campos específicos de pessoa jurídica do PJE
 */
function extrairCamposPessoaJuridica(
  camposExtraidos: CamposExtraidosPJE,
  pessoaJuridica: Record<string, unknown>
): void {
  camposExtraidos.inscricao_estadual = pessoaJuridica.inscricaoEstadual as
    | string
    | undefined;
  camposExtraidos.data_abertura = pessoaJuridica.dataAbertura as
    | string
    | undefined;
  camposExtraidos.orgao_publico =
    pessoaJuridica.orgaoPublico !== undefined
      ? Boolean(pessoaJuridica.orgaoPublico)
      : undefined;

  // Tipo Pessoa - pode vir como objeto {codigo, label} ou strings separadas
  const tipoPessoaCodigo = pessoaJuridica.tipoPessoaCodigo as
    | string
    | undefined;
  const tipoPessoaLabel = pessoaJuridica.tipoPessoaLabel as
    | string
    | undefined;
  camposExtraidos.tipo_pessoa_codigo_pje = tipoPessoaCodigo;
  camposExtraidos.tipo_pessoa_label_pje =
    tipoPessoaLabel ?? (pessoaJuridica.dsTipoPessoa as string | undefined);

  // Situação CNPJ Receita - o campo no PJE é "situacaoCnpjReceitaFederal"
  const situacaoCnpjReceita = pessoaJuridica.situacaoCnpjReceitaFederal as
    | SituacaoReceitaPJE
    | undefined;
  if (situacaoCnpjReceita) {
    camposExtraidos.situacao_cnpj_receita_id =
      situacaoCnpjReceita.id !== undefined
        ? Number(situacaoCnpjReceita.id)
        : undefined;
    camposExtraidos.situacao_cnpj_receita_descricao =
      situacaoCnpjReceita.descricao;
  }

  camposExtraidos.ramo_atividade = pessoaJuridica.dsRamoAtividade as
    | string
    | undefined;
  camposExtraidos.cpf_responsavel = pessoaJuridica.numeroCpfResponsavel as
    | string
    | undefined;
  camposExtraidos.oficial =
    pessoaJuridica.oficial !== undefined
      ? Boolean(pessoaJuridica.oficial)
      : undefined;

  // Porte - pode vir como objeto ou campos separados (porteCodigo, porteLabel)
  const porteCodigo = pessoaJuridica.porteCodigo as number | undefined;
  const porteLabel = pessoaJuridica.porteLabel as string | undefined;
  camposExtraidos.porte_codigo =
    porteCodigo !== undefined ? Number(porteCodigo) : undefined;
  camposExtraidos.porte_descricao = porteLabel;

  camposExtraidos.ultima_atualizacao_pje =
    pessoaJuridica.ultimaAtualizacao as string | undefined;
}

// ============================================================================
// Extração de Campos PJE - Representantes
// ============================================================================

/**
 * Tipo para campos extraídos de representante do PJE
 */
export type CamposRepresentanteExtraidos = Record<string, unknown>;

/**
 * Extrai campos específicos do PJE de dadosCompletos para representantes
 * NOTA: Representantes (advogados) têm dados limitados na API do PJE - apenas campos básicos
 *
 * @param rep - Representante retornado pelo PJE
 * @returns Objeto com campos extraídos para persistência
 */
export function extrairCamposRepresentantePJE(rep: RepresentantePJE): CamposRepresentanteExtraidos {
  const dados = rep.dadosCompletos;
  const camposExtraidos: CamposRepresentanteExtraidos = {};

  // Campos disponíveis para representantes na API do PJE
  camposExtraidos.situacao = dados?.situacao as string | undefined;
  camposExtraidos.status = dados?.status as string | undefined;
  camposExtraidos.principal =
    dados?.principal !== undefined ? Boolean(dados.principal) : undefined;
  camposExtraidos.endereco_desconhecido =
    dados?.enderecoDesconhecido !== undefined
      ? Boolean(dados.enderecoDesconhecido)
      : undefined;
  camposExtraidos.id_tipo_parte =
    dados?.idTipoParte !== undefined ? Number(dados.idTipoParte) : undefined;
  camposExtraidos.polo = normalizarPolo(dados?.polo);

  // Sexo está disponível para representantes PF
  if (rep.tipoDocumento === "CPF") {
    camposExtraidos.sexo = dados?.sexo as string | undefined;
  }

  return camposExtraidos;
}

// ============================================================================
// Validações de Formato
// ============================================================================

/**
 * Valida formato de CEP
 *
 * @param cep - CEP a ser validado
 * @returns true se CEP é válido (8 dígitos numéricos)
 */
export function validarFormatoCep(cep: string | null | undefined): boolean {
  if (!cep) return false;
  const cepNormalizado = cep.replace(/\D/g, "");
  return /^\d{8}$/.test(cepNormalizado);
}

/**
 * Valida formato de telefone
 *
 * @param ddd - DDD do telefone
 * @param numero - Número do telefone
 * @returns true se telefone é válido
 */
export function validarFormatoTelefone(
  ddd: string | null | undefined,
  numero: string | null | undefined
): boolean {
  if (!ddd || !numero) return false;

  const dddNormalizado = ddd.replace(/\D/g, "");
  const numeroNormalizado = numero.replace(/\D/g, "");

  // DDD deve ter 2 dígitos, número deve ter 8 ou 9 dígitos
  return (
    /^\d{2}$/.test(dddNormalizado) &&
    /^\d{8,9}$/.test(numeroNormalizado)
  );
}

/**
 * Valida formato básico de email
 *
 * @param email - Email a ser validado
 * @returns true se email tem formato válido
 */
export function validarFormatoEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
