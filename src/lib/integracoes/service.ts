/**
 * Service - Integrações
 * Lógica de negócio para integrações
 */

import * as repo from "./repository";
import {
  criarIntegracaoSchema,
  atualizarIntegracaoSchema,
  twofauthConfigSchema,
  chatwootConfigSchema,
  dyteConfigSchema,
  editorIAConfigSchema,
  type Integracao,
  type TipoIntegracao,
  type TwoFAuthConfig,
  type ChatwootConfig,
  type DyteConfig,
  type EditorIAConfig,
} from "./domain";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Listar todas as integrações
 */
export async function listar(): Promise<Integracao[]> {
  return repo.findAll();
}

/**
 * Listar integrações por tipo
 */
export async function listarPorTipo(tipo: TipoIntegracao): Promise<Integracao[]> {
  return repo.findByTipo(tipo);
}

/**
 * Buscar integração por ID
 */
export async function buscarPorId(id: string): Promise<Integracao | null> {
  return repo.findById(id);
}

/**
 * Buscar configuração do 2FAuth
 */
export async function buscarConfig2FAuth(): Promise<TwoFAuthConfig | null> {
  const integracao = await repo.findByTipoAndNome("twofauth", "2FAuth Principal");
  
  if (!integracao || !integracao.ativo) {
    return null;
  }

  // Validar configuração
  const result = twofauthConfigSchema.safeParse(integracao.configuracao);
  
  if (!result.success) {
    console.error("Configuração 2FAuth inválida:", result.error);
    return null;
  }

  return result.data;
}

/**
 * Buscar configuração do Dyte
 */
export async function buscarConfigDyte(): Promise<DyteConfig | null> {
  const integracao = await repo.findByTipoAndNome("dyte", "Dyte Principal");

  if (!integracao || !integracao.ativo) {
    return null;
  }

  const result = dyteConfigSchema.safeParse(integracao.configuracao);

  if (!result.success) {
    console.error("Configuração Dyte inválida:", result.error);
    return null;
  }

  return result.data as DyteConfig;
}

/**
 * Buscar configuração do Editor de Texto IA
 */
export async function buscarConfigEditorIA(): Promise<EditorIAConfig | null> {
  const integracao = await repo.findByTipoAndNome("editor_ia", "Editor de Texto IA Principal");

  if (!integracao || !integracao.ativo) {
    return null;
  }

  const result = editorIAConfigSchema.safeParse(integracao.configuracao);

  if (!result.success) {
    console.error("Configuração Editor IA inválida:", result.error);
    return null;
  }

  return result.data as EditorIAConfig;
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Criar nova integração
 */
export async function criar(params: unknown): Promise<Integracao> {
  // Validar dados
  const validacao = criarIntegracaoSchema.safeParse(params);
  
  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  // Validar configuração específica por tipo
  if (validacao.data.tipo === "twofauth") {
    const configValidacao = twofauthConfigSchema.safeParse(validacao.data.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração 2FAuth inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  if (validacao.data.tipo === "chatwoot") {
    const configValidacao = chatwootConfigSchema.safeParse(validacao.data.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração Chatwoot inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  if (validacao.data.tipo === "dyte") {
    const configValidacao = dyteConfigSchema.safeParse(validacao.data.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração Dyte inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  if (validacao.data.tipo === "editor_ia") {
    const configValidacao = editorIAConfigSchema.safeParse(validacao.data.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração Editor IA inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  return repo.create(validacao.data);
}

/**
 * Atualizar integração
 */
export async function atualizar(params: unknown): Promise<Integracao> {
  // Validar dados
  const validacao = atualizarIntegracaoSchema.safeParse(params);
  
  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  const { id, ...updateData } = validacao.data;

  // Se estiver atualizando configuração de 2FAuth, validar
  if (updateData.tipo === "twofauth" && updateData.configuracao) {
    const configValidacao = twofauthConfigSchema.safeParse(updateData.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração 2FAuth inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  if (updateData.tipo === "chatwoot" && updateData.configuracao) {
    const configValidacao = chatwootConfigSchema.safeParse(updateData.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração Chatwoot inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  if (updateData.tipo === "dyte" && updateData.configuracao) {
    const configValidacao = dyteConfigSchema.safeParse(updateData.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração Dyte inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  if (updateData.tipo === "editor_ia" && updateData.configuracao) {
    const configValidacao = editorIAConfigSchema.safeParse(updateData.configuracao);
    if (!configValidacao.success) {
      throw new Error(`Configuração Editor IA inválida: ${configValidacao.error.errors[0].message}`);
    }
  }

  return repo.update(id, updateData);
}

/**
 * Deletar integração
 */
export async function deletar(id: string): Promise<void> {
  return repo.remove(id);
}

/**
 * Ativar/desativar integração
 */
export async function toggleAtivo(id: string, ativo: boolean): Promise<Integracao> {
  return repo.toggleAtivo(id, ativo);
}

/**
 * Atualizar configuração do 2FAuth
 */
export async function atualizarConfig2FAuth(config: TwoFAuthConfig): Promise<Integracao> {
  // Validar configuração
  const validacao = twofauthConfigSchema.safeParse(config);
  
  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  // Buscar integração existente
  const integracao = await repo.findByTipoAndNome("twofauth", "2FAuth Principal");
  
  if (!integracao) {
    // Criar nova integração
    return repo.create({
      tipo: "twofauth",
      nome: "2FAuth Principal",
      descricao: "Servidor de autenticação de dois fatores",
      ativo: true,
      configuracao: validacao.data,
    });
  }

  // Atualizar integração existente
  return repo.update(integracao.id, {
    configuracao: validacao.data,
    ativo: true,
  });
}

/**
 * Atualizar configuração do Chatwoot
 */
export async function atualizarConfigChatwoot(config: ChatwootConfig): Promise<Integracao> {
  const validacao = chatwootConfigSchema.safeParse(config);

  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  // Buscar integração existente
  const integracao = await repo.findByTipoAndNome("chatwoot", "Chatwoot Principal");

  if (!integracao) {
    return repo.create({
      tipo: "chatwoot",
      nome: "Chatwoot Principal",
      descricao: "Sistema de atendimento e conversas",
      ativo: true,
      configuracao: validacao.data,
    });
  }

  return repo.update(integracao.id, {
    configuracao: validacao.data,
    ativo: true,
  });
}

/**
 * Atualizar configuração do Dyte
 */
export async function atualizarConfigDyte(config: DyteConfig): Promise<Integracao> {
  const validacao = dyteConfigSchema.safeParse(config);

  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  const integracao = await repo.findByTipoAndNome("dyte", "Dyte Principal");

  if (!integracao) {
    return repo.create({
      tipo: "dyte",
      nome: "Dyte Principal",
      descricao: "Videoconferência e chamadas de áudio",
      ativo: true,
      configuracao: validacao.data,
    });
  }

  return repo.update(integracao.id, {
    configuracao: validacao.data,
    ativo: true,
  });
}

/**
 * Atualizar configuração do Editor de Texto IA
 */
export async function atualizarConfigEditorIA(config: EditorIAConfig): Promise<Integracao> {
  const validacao = editorIAConfigSchema.safeParse(config);

  if (!validacao.success) {
    throw new Error(validacao.error.errors[0].message);
  }

  const integracao = await repo.findByTipoAndNome("editor_ia", "Editor de Texto IA Principal");

  if (!integracao) {
    return repo.create({
      tipo: "editor_ia",
      nome: "Editor de Texto IA Principal",
      descricao: "Inteligência artificial para o editor de documentos",
      ativo: true,
      configuracao: validacao.data,
    });
  }

  return repo.update(integracao.id, {
    configuracao: validacao.data,
    ativo: true,
  });
}
