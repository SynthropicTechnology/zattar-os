/**
 * Converters - Funcoes de conversao de dados do banco para entidades tipadas
 *
 * Estas funcoes sao usadas por todos os repositories de partes
 * para converter os dados brutos do banco em entidades tipadas.
 */

import type {
  Cliente,
  ClientePessoaFisica,
  ClientePessoaJuridica,
  ParteContraria,
  ParteContrariaPessoaFisica,
  ParteContrariaPessoaJuridica,
  Terceiro,
  TerceiroPessoaFisica,
  TerceiroPessoaJuridica,
  TipoPessoa,
} from "../../domain";
import type { Endereco } from "@/app/(authenticated)/enderecos";

/**
 * Converte dados do banco para entidade Cliente tipada
 */
export function converterParaCliente(data: Record<string, unknown>): Cliente {
  const tipo_pessoa = data.tipo_pessoa as TipoPessoa;

  const base = {
    id: data.id as number,
    tipo_pessoa,
    nome: data.nome as string,
    nome_social_fantasia: (data.nome_social_fantasia as string | null) ?? null,
    emails: (data.emails as string[] | null) ?? null,
    ddd_celular: (data.ddd_celular as string | null) ?? null,
    numero_celular: (data.numero_celular as string | null) ?? null,
    ddd_residencial: (data.ddd_residencial as string | null) ?? null,
    numero_residencial: (data.numero_residencial as string | null) ?? null,
    ddd_comercial: (data.ddd_comercial as string | null) ?? null,
    numero_comercial: (data.numero_comercial as string | null) ?? null,
    tipo_documento: (data.tipo_documento as string | null) ?? null,
    status_pje: (data.status_pje as string | null) ?? null,
    situacao_pje: (data.situacao_pje as string | null) ?? null,
    login_pje: (data.login_pje as string | null) ?? null,
    autoridade: (data.autoridade as boolean | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores:
      (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    endereco_id: (data.endereco_id as number | null) ?? null,
    ativo: (data.ativo as boolean) ?? true,
    responsavel_id: (data.responsavel_id as number | null) ?? null,

    created_by: (data.created_by as number | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };

  if (tipo_pessoa === "pf") {
    return {
      ...base,
      tipo_pessoa: "pf",
      cpf: data.cpf as string,
      cnpj: null,
      rg: (data.rg as string | null) ?? null,
      data_nascimento: (data.data_nascimento as string | null) ?? null,
      genero: (data.genero as string | null) ?? null,
      estado_civil: (data.estado_civil as string | null) ?? null,
      nacionalidade: (data.nacionalidade as string | null) ?? null,
      sexo: (data.sexo as string | null) ?? null,
      nome_genitora: (data.nome_genitora as string | null) ?? null,
      naturalidade_id_pje: (data.naturalidade_id_pje as number | null) ?? null,
      naturalidade_municipio:
        (data.naturalidade_municipio as string | null) ?? null,
      naturalidade_estado_id_pje:
        (data.naturalidade_estado_id_pje as number | null) ?? null,
      naturalidade_estado_sigla:
        (data.naturalidade_estado_sigla as string | null) ?? null,
      uf_nascimento_id_pje:
        (data.uf_nascimento_id_pje as number | null) ?? null,
      uf_nascimento_sigla: (data.uf_nascimento_sigla as string | null) ?? null,
      uf_nascimento_descricao:
        (data.uf_nascimento_descricao as string | null) ?? null,
      pais_nascimento_id_pje:
        (data.pais_nascimento_id_pje as number | null) ?? null,
      pais_nascimento_codigo:
        (data.pais_nascimento_codigo as string | null) ?? null,
      pais_nascimento_descricao:
        (data.pais_nascimento_descricao as string | null) ?? null,
      escolaridade_codigo: (data.escolaridade_codigo as number | null) ?? null,
      situacao_cpf_receita_id:
        (data.situacao_cpf_receita_id as number | null) ?? null,
      situacao_cpf_receita_descricao:
        (data.situacao_cpf_receita_descricao as string | null) ?? null,
      pode_usar_celular_mensagem:
        (data.pode_usar_celular_mensagem as boolean | null) ?? null,
    } satisfies ClientePessoaFisica;
  } else {
    return {
      ...base,
      tipo_pessoa: "pj",
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: (data.inscricao_estadual as string | null) ?? null,
      data_abertura: (data.data_abertura as string | null) ?? null,
      data_fim_atividade: (data.data_fim_atividade as string | null) ?? null,
      orgao_publico: (data.orgao_publico as boolean | null) ?? null,
      tipo_pessoa_codigo_pje:
        (data.tipo_pessoa_codigo_pje as string | null) ?? null,
      tipo_pessoa_label_pje:
        (data.tipo_pessoa_label_pje as string | null) ?? null,
      tipo_pessoa_validacao_receita:
        (data.tipo_pessoa_validacao_receita as string | null) ?? null,
      ds_tipo_pessoa: (data.ds_tipo_pessoa as string | null) ?? null,
      situacao_cnpj_receita_id:
        (data.situacao_cnpj_receita_id as number | null) ?? null,
      situacao_cnpj_receita_descricao:
        (data.situacao_cnpj_receita_descricao as string | null) ?? null,
      ramo_atividade: (data.ramo_atividade as string | null) ?? null,
      cpf_responsavel: (data.cpf_responsavel as string | null) ?? null,
      oficial: (data.oficial as boolean | null) ?? null,
      ds_prazo_expediente_automatico:
        (data.ds_prazo_expediente_automatico as string | null) ?? null,
      porte_codigo: (data.porte_codigo as number | null) ?? null,
      porte_descricao: (data.porte_descricao as string | null) ?? null,
      ultima_atualizacao_pje:
        (data.ultima_atualizacao_pje as string | null) ?? null,
    } satisfies ClientePessoaJuridica;
  }
}

/**
 * Converte dados do banco para entidade ParteContraria tipada
 */
export function converterParaParteContraria(
  data: Record<string, unknown>,
): ParteContraria {
  const tipo_pessoa = data.tipo_pessoa as TipoPessoa;

  const base = {
    id: data.id as number,
    tipo_pessoa,
    nome: data.nome as string,
    nome_social_fantasia: (data.nome_social_fantasia as string | null) ?? null,
    emails: (data.emails as string[] | null) ?? null,
    ddd_celular: (data.ddd_celular as string | null) ?? null,
    numero_celular: (data.numero_celular as string | null) ?? null,
    ddd_residencial: (data.ddd_residencial as string | null) ?? null,
    numero_residencial: (data.numero_residencial as string | null) ?? null,
    ddd_comercial: (data.ddd_comercial as string | null) ?? null,
    numero_comercial: (data.numero_comercial as string | null) ?? null,
    tipo_documento: (data.tipo_documento as string | null) ?? null,
    status_pje: (data.status_pje as string | null) ?? null,
    situacao_pje: (data.situacao_pje as string | null) ?? null,
    login_pje: (data.login_pje as string | null) ?? null,
    autoridade: (data.autoridade as boolean | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores:
      (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    endereco_id: (data.endereco_id as number | null) ?? null,
    ativo: (data.ativo as boolean) ?? true,
    created_by: (data.created_by as number | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };

  if (tipo_pessoa === "pf") {
    return {
      ...base,
      tipo_pessoa: "pf",
      cpf: data.cpf as string,
      cnpj: null,
      rg: (data.rg as string | null) ?? null,
      data_nascimento: (data.data_nascimento as string | null) ?? null,
      genero: (data.genero as string | null) ?? null,
      estado_civil: (data.estado_civil as string | null) ?? null,
      nacionalidade: (data.nacionalidade as string | null) ?? null,
      sexo: (data.sexo as string | null) ?? null,
      nome_genitora: (data.nome_genitora as string | null) ?? null,
      naturalidade_id_pje: (data.naturalidade_id_pje as number | null) ?? null,
      naturalidade_municipio:
        (data.naturalidade_municipio as string | null) ?? null,
      naturalidade_estado_id_pje:
        (data.naturalidade_estado_id_pje as number | null) ?? null,
      naturalidade_estado_sigla:
        (data.naturalidade_estado_sigla as string | null) ?? null,
      uf_nascimento_id_pje:
        (data.uf_nascimento_id_pje as number | null) ?? null,
      uf_nascimento_sigla: (data.uf_nascimento_sigla as string | null) ?? null,
      uf_nascimento_descricao:
        (data.uf_nascimento_descricao as string | null) ?? null,
      pais_nascimento_id_pje:
        (data.pais_nascimento_id_pje as number | null) ?? null,
      pais_nascimento_codigo:
        (data.pais_nascimento_codigo as string | null) ?? null,
      pais_nascimento_descricao:
        (data.pais_nascimento_descricao as string | null) ?? null,
      escolaridade_codigo: (data.escolaridade_codigo as number | null) ?? null,
      situacao_cpf_receita_id:
        (data.situacao_cpf_receita_id as number | null) ?? null,
      situacao_cpf_receita_descricao:
        (data.situacao_cpf_receita_descricao as string | null) ?? null,
      pode_usar_celular_mensagem:
        (data.pode_usar_celular_mensagem as boolean | null) ?? null,
    } satisfies ParteContrariaPessoaFisica;
  } else {
    return {
      ...base,
      tipo_pessoa: "pj",
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: (data.inscricao_estadual as string | null) ?? null,
      data_abertura: (data.data_abertura as string | null) ?? null,
      data_fim_atividade: (data.data_fim_atividade as string | null) ?? null,
      orgao_publico: (data.orgao_publico as boolean | null) ?? null,
      tipo_pessoa_codigo_pje:
        (data.tipo_pessoa_codigo_pje as string | null) ?? null,
      tipo_pessoa_label_pje:
        (data.tipo_pessoa_label_pje as string | null) ?? null,
      tipo_pessoa_validacao_receita:
        (data.tipo_pessoa_validacao_receita as string | null) ?? null,
      ds_tipo_pessoa: (data.ds_tipo_pessoa as string | null) ?? null,
      situacao_cnpj_receita_id:
        (data.situacao_cnpj_receita_id as number | null) ?? null,
      situacao_cnpj_receita_descricao:
        (data.situacao_cnpj_receita_descricao as string | null) ?? null,
      ramo_atividade: (data.ramo_atividade as string | null) ?? null,
      cpf_responsavel: (data.cpf_responsavel as string | null) ?? null,
      oficial: (data.oficial as boolean | null) ?? null,
      ds_prazo_expediente_automatico:
        (data.ds_prazo_expediente_automatico as string | null) ?? null,
      porte_codigo: (data.porte_codigo as number | null) ?? null,
      porte_descricao: (data.porte_descricao as string | null) ?? null,
      ultima_atualizacao_pje:
        (data.ultima_atualizacao_pje as string | null) ?? null,
    } satisfies ParteContrariaPessoaJuridica;
  }
}

/**
 * Converte dados do banco para entidade Terceiro tipada
 */
export function converterParaTerceiro(data: Record<string, unknown>): Terceiro {
  const tipo_pessoa = data.tipo_pessoa as TipoPessoa;

  const base = {
    id: data.id as number,
    id_tipo_parte: (data.id_tipo_parte as number | null) ?? null,
    tipo_parte: data.tipo_parte as Terceiro["tipo_parte"],
    polo: data.polo as Terceiro["polo"],
    tipo_pessoa,
    nome: data.nome as string,
    nome_fantasia: (data.nome_fantasia as string | null) ?? null,
    emails: (data.emails as string[] | null) ?? null,
    ddd_celular: (data.ddd_celular as string | null) ?? null,
    numero_celular: (data.numero_celular as string | null) ?? null,
    ddd_residencial: (data.ddd_residencial as string | null) ?? null,
    numero_residencial: (data.numero_residencial as string | null) ?? null,
    ddd_comercial: (data.ddd_comercial as string | null) ?? null,
    numero_comercial: (data.numero_comercial as string | null) ?? null,
    principal: (data.principal as boolean | null) ?? null,
    autoridade: (data.autoridade as boolean | null) ?? null,
    endereco_desconhecido:
      (data.endereco_desconhecido as boolean | null) ?? null,
    status_pje: (data.status_pje as string | null) ?? null,
    situacao_pje: (data.situacao_pje as string | null) ?? null,
    login_pje: (data.login_pje as string | null) ?? null,
    ordem: (data.ordem as number | null) ?? null,
    observacoes: (data.observacoes as string | null) ?? null,
    dados_anteriores:
      (data.dados_anteriores as Record<string, unknown> | null) ?? null,
    ativo: (data.ativo as boolean | null) ?? true,
    endereco_id: (data.endereco_id as number | null) ?? null,
    ultima_atualizacao_pje:
      (data.ultima_atualizacao_pje as string | null) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };

  if (tipo_pessoa === "pf") {
    return {
      ...base,
      tipo_pessoa: "pf",
      cpf: data.cpf as string,
      cnpj: null,
      tipo_documento: (data.tipo_documento as string | null) ?? null,
      rg: (data.rg as string | null) ?? null,
      sexo: (data.sexo as string | null) ?? null,
      nome_genitora: (data.nome_genitora as string | null) ?? null,
      data_nascimento: (data.data_nascimento as string | null) ?? null,
      genero: (data.genero as string | null) ?? null,
      estado_civil: (data.estado_civil as string | null) ?? null,
      nacionalidade: (data.nacionalidade as string | null) ?? null,
      uf_nascimento_id_pje:
        (data.uf_nascimento_id_pje as number | null) ?? null,
      uf_nascimento_sigla: (data.uf_nascimento_sigla as string | null) ?? null,
      uf_nascimento_descricao:
        (data.uf_nascimento_descricao as string | null) ?? null,
      naturalidade_id_pje: (data.naturalidade_id_pje as number | null) ?? null,
      naturalidade_municipio:
        (data.naturalidade_municipio as string | null) ?? null,
      naturalidade_estado_id_pje:
        (data.naturalidade_estado_id_pje as number | null) ?? null,
      naturalidade_estado_sigla:
        (data.naturalidade_estado_sigla as string | null) ?? null,
      pais_nascimento_id_pje:
        (data.pais_nascimento_id_pje as number | null) ?? null,
      pais_nascimento_codigo:
        (data.pais_nascimento_codigo as string | null) ?? null,
      pais_nascimento_descricao:
        (data.pais_nascimento_descricao as string | null) ?? null,
      escolaridade_codigo: (data.escolaridade_codigo as number | null) ?? null,
      situacao_cpf_receita_id:
        (data.situacao_cpf_receita_id as number | null) ?? null,
      situacao_cpf_receita_descricao:
        (data.situacao_cpf_receita_descricao as string | null) ?? null,
      pode_usar_celular_mensagem:
        (data.pode_usar_celular_mensagem as boolean | null) ?? null,
    } satisfies TerceiroPessoaFisica;
  } else {
    return {
      ...base,
      tipo_pessoa: "pj",
      cnpj: data.cnpj as string,
      cpf: null,
      inscricao_estadual: (data.inscricao_estadual as string | null) ?? null,
      data_abertura: (data.data_abertura as string | null) ?? null,
      data_fim_atividade: (data.data_fim_atividade as string | null) ?? null,
      orgao_publico: (data.orgao_publico as boolean | null) ?? null,
      tipo_pessoa_codigo_pje:
        (data.tipo_pessoa_codigo_pje as string | null) ?? null,
      tipo_pessoa_label_pje:
        (data.tipo_pessoa_label_pje as string | null) ?? null,
      tipo_pessoa_validacao_receita:
        (data.tipo_pessoa_validacao_receita as string | null) ?? null,
      ds_tipo_pessoa: (data.ds_tipo_pessoa as string | null) ?? null,
      situacao_cnpj_receita_id:
        (data.situacao_cnpj_receita_id as number | null) ?? null,
      situacao_cnpj_receita_descricao:
        (data.situacao_cnpj_receita_descricao as string | null) ?? null,
      ramo_atividade: (data.ramo_atividade as string | null) ?? null,
      cpf_responsavel: (data.cpf_responsavel as string | null) ?? null,
      oficial: (data.oficial as boolean | null) ?? null,
      ds_prazo_expediente_automatico:
        (data.ds_prazo_expediente_automatico as string | null) ?? null,
      porte_codigo: (data.porte_codigo as number | null) ?? null,
      porte_descricao: (data.porte_descricao as string | null) ?? null,
    } satisfies TerceiroPessoaJuridica;
  }
}

/**
 * Converte row de endereco do banco para tipo Endereco
 */
export function converterParaEndereco(
  data: Record<string, unknown> | null,
): Endereco | null {
  if (!data) return null;

  return {
    id: data.id as number,
    id_pje: (data.id_pje as number) ?? null,
    entidade_tipo: data.entidade_tipo as Endereco["entidade_tipo"],
    entidade_id: data.entidade_id as number,
    trt: (data.trt as string) ?? null,
    grau: (data.grau as Endereco["grau"]) ?? null,
    numero_processo: (data.numero_processo as string) ?? null,
    logradouro: (data.logradouro as string) ?? null,
    numero: (data.numero as string) ?? null,
    complemento: (data.complemento as string) ?? null,
    bairro: (data.bairro as string) ?? null,
    id_municipio_pje: (data.id_municipio_pje as number) ?? null,
    municipio: (data.municipio as string) ?? null,
    municipio_ibge: (data.municipio_ibge as string) ?? null,
    estado_id_pje: (data.estado_id_pje as number) ?? null,
    estado_sigla: (data.estado_sigla as string) ?? null,
    estado_descricao: (data.estado_descricao as string) ?? null,
    estado: (data.estado as string) ?? null,
    pais_id_pje: (data.pais_id_pje as number) ?? null,
    pais_codigo: (data.pais_codigo as string) ?? null,
    pais_descricao: (data.pais_descricao as string) ?? null,
    pais: (data.pais as string) ?? null,
    cep: (data.cep as string) ?? null,
    classificacoes_endereco:
      (data.classificacoes_endereco as Endereco["classificacoes_endereco"]) ??
      null,
    correspondencia: (data.correspondencia as boolean) ?? null,
    situacao: (data.situacao as Endereco["situacao"]) ?? null,
    dados_pje_completo:
      (data.dados_pje_completo as Record<string, unknown>) ?? null,
    id_usuario_cadastrador_pje:
      (data.id_usuario_cadastrador_pje as number) ?? null,
    data_alteracao_pje: (data.data_alteracao_pje as string) ?? null,
    ativo: (data.ativo as boolean) ?? null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
  };
}

// Re-export types for convenience
export type { Endereco } from "@/app/(authenticated)/enderecos";
