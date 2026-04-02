/**
 * CHATWOOT SERVICE - Lógica de Sincronização
 *
 * Serviço para sincronização entre partes locais e contatos do Chatwoot.
 */

import { Result, ok, err, appError, AppError } from "@/types";
import { createDbClient } from "@/lib/supabase";
import {
  createContact,
  updateContact,
  getContact,
  deleteContact,
  findContactByIdentifier,
  findContactByEmail,
  findContactByPhone,
  listAllContacts,
  getChatwootClient,
  isChatwootConfigured,
  applyParteLabels,
  getContactConversations,
  getConversationCounts,
  getConversationHistory,
  formatConversationForAI,
  ChatwootContact,
  ChatwootConversation,
  ChatwootMessage,
  ChatwootConversationCounts,
  CreateContactRequest,
  UpdateContactRequest,
  ChatwootError,
} from "@/lib/chatwoot";
import {
  findMapeamentoPorEntidade,
  findMapeamentoPorChatwootId,
  criarMapeamento,
  atualizarMapeamentoPorEntidade,
  removerMapeamentoPorEntidade,
  upsertMapeamentoPorEntidade,
} from "./repository";
import {
  TipoEntidadeChatwoot,
  PartesChatwoot,
  SincronizacaoResult,
  StatusConversa,
  formatarTelefoneInternacional,
  normalizarDocumentoParaIdentifier,
  obterPrimeiroEmail,
} from "./domain";

// =============================================================================
// Tipos para Partes
// =============================================================================

interface EnderecoInfo {
  municipio?: string | null;
  estado_sigla?: string | null;
}

interface ParteBase {
  id: number;
  nome: string;
  nome_social_fantasia?: string | null;
  tipo_pessoa: "pf" | "pj";
  emails?: string[] | null;
  ddd_celular?: string | null;
  numero_celular?: string | null;
  ddd_comercial?: string | null;
  numero_comercial?: string | null;
  /** Endereço opcional (para sincronização com Chatwoot) */
  endereco?: EnderecoInfo | null;
}

interface PartePF extends ParteBase {
  tipo_pessoa: "pf";
  cpf: string;
}

interface PartePJ extends ParteBase {
  tipo_pessoa: "pj";
  cnpj: string;
}

type Parte = PartePF | PartePJ;

interface TerceiroInfo {
  tipo_parte?: string;
}

// =============================================================================
// Helpers de Normalização
// =============================================================================

/**
 * Remove acentos de uma string
 */
function removerAcentos(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Normaliza nome para o Chatwoot: caixa alta sem acentos
 */
function normalizarNomeParaChatwoot(nome: string): string {
  return removerAcentos(nome).toUpperCase().trim();
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Converte ChatwootError para AppError
 */
function chatwootErrorToAppError(error: ChatwootError): AppError {
  return appError("EXTERNAL_SERVICE_ERROR", error.message, {
    statusCode: error.statusCode,
    apiError: error.apiError,
  });
}

// =============================================================================
// Conversão Parte -> Contato Chatwoot
// =============================================================================

/**
 * Converte dados de uma parte local para formato de criação de contato Chatwoot
 *
 * O nome é normalizado para caixa alta sem acentos.
 * Cidade e país são incluídos nos additional_attributes.
 */
export function parteParaChatwootContact(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot,
  inboxId?: number
): CreateContactRequest {
  const telefone =
    formatarTelefoneInternacional(parte.ddd_celular, parte.numero_celular) ??
    formatarTelefoneInternacional(parte.ddd_comercial, parte.numero_comercial);

  const identifier =
    parte.tipo_pessoa === "pf"
      ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
      : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

  // Nome normalizado: caixa alta sem acentos (fonte da verdade: banco local)
  const nomeNormalizado = normalizarNomeParaChatwoot(parte.nome);

  // Cidade do endereço (fonte da verdade: banco local)
  const cidade = parte.endereco?.municipio
    ? removerAcentos(parte.endereco.municipio).toUpperCase()
    : undefined;

  return {
    inbox_id: inboxId, // undefined usa CHATWOOT_DEFAULT_INBOX_ID do env
    name: nomeNormalizado,
    email: obterPrimeiroEmail(parte.emails) ?? undefined,
    phone_number: telefone ?? undefined,
    identifier: identifier ?? undefined,
    additional_attributes: {
      city: cidade,
      country: "Brazil",
      country_code: "BR",
    },
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: "zattar",
      entidade_id: parte.id,
      ...(parte.nome_social_fantasia && {
        nome_fantasia: parte.nome_social_fantasia,
      }),
    },
  };
}

/**
 * Converte dados de uma parte local para formato de atualização de contato Chatwoot
 *
 * O nome é normalizado para caixa alta sem acentos.
 * Cidade e país são incluídos nos additional_attributes.
 */
export function parteParaChatwootUpdate(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot
): UpdateContactRequest {
  const telefone =
    formatarTelefoneInternacional(parte.ddd_celular, parte.numero_celular) ??
    formatarTelefoneInternacional(parte.ddd_comercial, parte.numero_comercial);

  const identifier =
    parte.tipo_pessoa === "pf"
      ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
      : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

  // Nome normalizado: caixa alta sem acentos (fonte da verdade: banco local)
  const nomeNormalizado = normalizarNomeParaChatwoot(parte.nome);

  // Cidade do endereço (fonte da verdade: banco local)
  const cidade = parte.endereco?.municipio
    ? removerAcentos(parte.endereco.municipio).toUpperCase()
    : undefined;

  return {
    name: nomeNormalizado,
    email: obterPrimeiroEmail(parte.emails) ?? undefined,
    phone_number: telefone ?? undefined,
    identifier: identifier ?? undefined,
    additional_attributes: {
      city: cidade,
      country: "Brazil",
      country_code: "BR",
    },
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: "zattar",
      entidade_id: parte.id,
      ...(parte.nome_social_fantasia && {
        nome_fantasia: parte.nome_social_fantasia,
      }),
    },
  };
}

/**
 * Cria objeto de dados sincronizados para salvar no banco
 */
function criarDadosSincronizados(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot,
  labels: string[]
): Record<string, unknown> {
  const telefone =
    formatarTelefoneInternacional(parte.ddd_celular, parte.numero_celular) ??
    formatarTelefoneInternacional(parte.ddd_comercial, parte.numero_comercial);

  const identifier =
    parte.tipo_pessoa === "pf"
      ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
      : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

  // Nome normalizado: caixa alta sem acentos
  const nomeNormalizado = normalizarNomeParaChatwoot(parte.nome);

  // Cidade do endereço
  const cidade = parte.endereco?.municipio
    ? removerAcentos(parte.endereco.municipio).toUpperCase()
    : null;

  return {
    nome: nomeNormalizado,
    nome_original: parte.nome,
    email: obterPrimeiroEmail(parte.emails),
    telefone,
    identifier,
    cidade,
    pais: "Brazil",
    tipo_pessoa: parte.tipo_pessoa,
    tipo_entidade: tipoEntidade,
    labels,
    custom_attributes: {
      tipo_pessoa: parte.tipo_pessoa,
      tipo_entidade: tipoEntidade,
      sistema_origem: "zattar",
      entidade_id: parte.id,
    },
    additional_attributes: {
      city: cidade,
      country: "Brazil",
      country_code: "BR",
    },
    sincronizado_em: new Date().toISOString(),
  };
}

// =============================================================================
// Sincronização
// =============================================================================

/**
 * Sincroniza uma parte local com o Chatwoot
 * Se já existe mapeamento, atualiza o contato
 * Se não existe, cria novo contato e mapeamento
 */
export async function sincronizarParteComChatwoot(
  parte: Parte,
  tipoEntidade: TipoEntidadeChatwoot,
  terceiroInfo?: TerceiroInfo
): Promise<Result<SincronizacaoResult>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();
    const accountId = client.getAccountId();

    // Verifica se já existe mapeamento
    const mapeamentoExistente = await findMapeamentoPorEntidade(
      tipoEntidade,
      parte.id
    );

    if (!mapeamentoExistente.success) {
      return err(mapeamentoExistente.error);
    }

    let chatwootContactId: number;
    let criado = false;

    if (mapeamentoExistente.data) {
      // Atualiza contato existente
      const updateData = parteParaChatwootUpdate(parte, tipoEntidade);
      const updateResult = await updateContact(
        mapeamentoExistente.data.chatwoot_contact_id,
        updateData,
        client
      );

      if (!updateResult.success) {
        // Marca como não sincronizado
        await atualizarMapeamentoPorEntidade(tipoEntidade, parte.id, {
          sincronizado: false,
          erro_sincronizacao: updateResult.error.message,
        });

        return ok({
          sucesso: false,
          mapeamento: mapeamentoExistente.data,
          chatwoot_contact_id: mapeamentoExistente.data.chatwoot_contact_id,
          criado: false,
          erro: updateResult.error.message,
        });
      }

      chatwootContactId = updateResult.data.id;
    } else {
      // Verifica se já existe contato com mesmo identifier
      const identifier =
        parte.tipo_pessoa === "pf"
          ? normalizarDocumentoParaIdentifier((parte as PartePF).cpf)
          : normalizarDocumentoParaIdentifier((parte as PartePJ).cnpj);

      if (identifier) {
        const contatoExistente = await findContactByIdentifier(
          identifier,
          client
        );

        if (contatoExistente.success && contatoExistente.data) {
          // Contato já existe no Chatwoot - cria apenas o mapeamento
          chatwootContactId = contatoExistente.data.id;

          // Atualiza dados do contato existente
          const updateData = parteParaChatwootUpdate(parte, tipoEntidade);
          await updateContact(chatwootContactId, updateData, client);
        } else {
          // Cria novo contato
          const createData = parteParaChatwootContact(parte, tipoEntidade);
          const createResult = await createContact(createData, client);

          if (!createResult.success) {
            // Tenta recuperação de erro 422 (Unprocessable Entity) - Geralmente contato duplicado (email/telefone)
            // mas sem o identifier igual (caso contrário teria caído no if acima)
            const isConflict =
              createResult.error.statusCode === 422 ||
              createResult.error.statusCode === 400;

            if (isConflict) {
              console.log(
                `[Chatwoot Sync] Erro ao criar contato (Status ${createResult.error.statusCode}). Tentando encontrar por email/telefone...`
              );

              let contatoEncontrado: ChatwootContact | null = null;

              // 1. Tenta buscar por email
              const email = obterPrimeiroEmail(parte.emails);
              if (email) {
                const buscaEmail = await findContactByEmail(email, client);
                if (buscaEmail.success && buscaEmail.data) {
                  console.log(
                    `[Chatwoot Sync] Contato encontrado por email: ${email}`
                  );
                  contatoEncontrado = buscaEmail.data;
                }
              }

              // 2. Se não achou, tenta por telefone
              if (!contatoEncontrado) {
                const telefone =
                  formatarTelefoneInternacional(
                    parte.ddd_celular,
                    parte.numero_celular
                  ) ??
                  formatarTelefoneInternacional(
                    parte.ddd_comercial,
                    parte.numero_comercial
                  );

                if (telefone) {
                  const buscaTelefone = await findContactByPhone(
                    telefone,
                    client
                  );
                  if (buscaTelefone.success && buscaTelefone.data) {
                    console.log(
                      `[Chatwoot Sync] Contato encontrado por telefone: ${telefone}`
                    );
                    contatoEncontrado = buscaTelefone.data;
                  }
                }
              }

              // Se encontrou contato existente, usamos ele
              if (contatoEncontrado) {
                chatwootContactId = contatoEncontrado.id;

                // Verifica se o contato já está vinculado a OUTRA entidade para evitar merge incorreto
                // (Opcional, mas seguro)
                try {
                  const checkVinculo = await findMapeamentoPorChatwootId(
                    chatwootContactId,
                    accountId
                  );
                  if (checkVinculo.success && checkVinculo.data) {
                    console.warn(
                      `[Chatwoot Sync] AVISO: Contato ${chatwootContactId} já vinculado a ${checkVinculo.data.tipo_entidade}:${checkVinculo.data.entidade_id}. Atualizando mesmo assim.`
                    );
                  }
                } catch (_e) {
                  // Ignora erro de verificação
                }

                // Atualiza o contato existente para garantir que tenha o identifier correto
                const updateData = parteParaChatwootUpdate(parte, tipoEntidade);
                await updateContact(chatwootContactId, updateData, client);

                // Prossegue para criar o mapeamento...
                criado = false;
              } else {
                // Se realmente não achou ninguém, retorna o erro original
                return ok({
                  sucesso: false,
                  mapeamento: null,
                  chatwoot_contact_id: null,
                  criado: false,
                  erro: `Erro ao criar contato: ${createResult.error.message}`,
                });
              }
            } else {
              // Erro não recuperável
              return ok({
                sucesso: false,
                mapeamento: null,
                chatwoot_contact_id: null,
                criado: false,
                erro: createResult.error.message,
              });
            }
          } else {
            chatwootContactId = createResult.data.id;
            criado = true;
          }
        }
      } else {
        // Sem identifier, cria novo contato
        const createData = parteParaChatwootContact(parte, tipoEntidade);
        const createResult = await createContact(createData, client);

        if (!createResult.success) {
          return ok({
            sucesso: false,
            mapeamento: null,
            chatwoot_contact_id: null,
            criado: false,
            erro: createResult.error.message,
          });
        }

        chatwootContactId = createResult.data.id;
        criado = true;
      }
    }

    // Aplica labels
    const labelsResult = await applyParteLabels(
      chatwootContactId,
      tipoEntidade,
      parte.tipo_pessoa,
      terceiroInfo?.tipo_parte,
      client
    );

    const labels = labelsResult.success ? labelsResult.data : [];

    // Cria/atualiza mapeamento
    const dadosSincronizados = criarDadosSincronizados(
      parte,
      tipoEntidade,
      labels
    );

    const mapeamentoResult = await upsertMapeamentoPorEntidade({
      tipo_entidade: tipoEntidade,
      entidade_id: parte.id,
      chatwoot_contact_id: chatwootContactId,
      chatwoot_account_id: accountId,
      dados_sincronizados: dadosSincronizados,
    });

    if (!mapeamentoResult.success) {
      return err(mapeamentoResult.error);
    }

    return ok({
      sucesso: true,
      mapeamento: mapeamentoResult.data.mapeamento,
      chatwoot_contact_id: chatwootContactId,
      criado,
    });
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao sincronizar parte com Chatwoot",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Vinculação Manual
// =============================================================================

/**
 * Vincula uma parte local a um contato existente no Chatwoot
 */
export async function vincularParteAContato(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number,
  chatwootContactId: number
): Promise<Result<PartesChatwoot>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();
    const accountId = client.getAccountId();

    // Verifica se contato existe no Chatwoot
    const contatoResult = await getContact(chatwootContactId, client);

    if (!contatoResult.success) {
      return err(
        appError(
          "NOT_FOUND",
          `Contato ${chatwootContactId} não encontrado no Chatwoot`
        )
      );
    }

    // Verifica se já existe mapeamento para esta entidade
    const mapeamentoExistente = await findMapeamentoPorEntidade(
      tipoEntidade,
      entidadeId
    );

    if (mapeamentoExistente.success && mapeamentoExistente.data) {
      return err(
        appError(
          "CONFLICT",
          `Entidade ${tipoEntidade}:${entidadeId} já está vinculada ao contato ${mapeamentoExistente.data.chatwoot_contact_id}`
        )
      );
    }

    // Verifica se contato já está vinculado a outra parte
    const contatoMapeado = await findMapeamentoPorChatwootId(
      chatwootContactId,
      accountId
    );

    if (contatoMapeado.success && contatoMapeado.data) {
      return err(
        appError(
          "CONFLICT",
          `Contato ${chatwootContactId} já está vinculado a ${contatoMapeado.data.tipo_entidade}:${contatoMapeado.data.entidade_id}`
        )
      );
    }

    // Cria mapeamento
    const mapeamentoResult = await criarMapeamento({
      tipo_entidade: tipoEntidade,
      entidade_id: entidadeId,
      chatwoot_contact_id: chatwootContactId,
      chatwoot_account_id: accountId,
      dados_sincronizados: {
        vinculado_manualmente: true,
        vinculado_em: new Date().toISOString(),
      },
    });

    return mapeamentoResult;
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao vincular parte a contato",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Desvinculação
// =============================================================================

/**
 * Remove vínculo entre parte e contato (não exclui o contato do Chatwoot)
 */
export async function desvincularParte(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<void>> {
  return removerMapeamentoPorEntidade(tipoEntidade, entidadeId);
}

/**
 * Remove contato do Chatwoot e mapeamento local
 */
export async function excluirContatoEMapeamento(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<void>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();

    // Busca mapeamento
    const mapeamento = await findMapeamentoPorEntidade(
      tipoEntidade,
      entidadeId
    );

    if (!mapeamento.success) {
      return err(mapeamento.error);
    }

    if (!mapeamento.data) {
      return err(appError("NOT_FOUND", "Mapeamento não encontrado"));
    }

    // Exclui contato do Chatwoot
    const deleteResult = await deleteContact(
      mapeamento.data.chatwoot_contact_id,
      client
    );

    if (!deleteResult.success) {
      // Se contato não existe mais, apenas remove mapeamento
      if (deleteResult.error.statusCode !== 404) {
        return err(chatwootErrorToAppError(deleteResult.error));
      }
    }

    // Remove mapeamento local
    return removerMapeamentoPorEntidade(tipoEntidade, entidadeId);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao excluir contato",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Consultas
// =============================================================================

/**
 * Busca contato Chatwoot vinculado a uma parte
 */
export async function buscarContatoVinculado(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<ChatwootContact | null>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();

    // Busca mapeamento
    const mapeamento = await findMapeamentoPorEntidade(
      tipoEntidade,
      entidadeId
    );

    if (!mapeamento.success) {
      return err(mapeamento.error);
    }

    if (!mapeamento.data) {
      return ok(null);
    }

    // Busca contato no Chatwoot
    const contatoResult = await getContact(
      mapeamento.data.chatwoot_contact_id,
      client
    );

    if (!contatoResult.success) {
      // Se contato não existe mais, retorna null
      if (contatoResult.error.statusCode === 404) {
        return ok(null);
      }
      return err(chatwootErrorToAppError(contatoResult.error));
    }

    return ok(contatoResult.data);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao buscar contato vinculado",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Verifica se uma parte está vinculada ao Chatwoot
 */
export async function parteEstaVinculada(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number
): Promise<Result<boolean>> {
  const mapeamento = await findMapeamentoPorEntidade(tipoEntidade, entidadeId);

  if (!mapeamento.success) {
    return err(mapeamento.error);
  }

  return ok(mapeamento.data !== null);
}

// =============================================================================
// Sincronização por Telefone (Chatwoot -> App)
// =============================================================================

/**
 * Extrai DDD e número de telefone do formato Chatwoot
 * Formato esperado: +5511999887766 ou variações
 *
 * @returns { ddd: string, numero9: string, numero8: string } | null
 */
export function extrairTelefone(
  telefone: string | null | undefined
): { ddd: string; numero9: string; numero8: string } | null {
  if (!telefone) return null;

  // Remove tudo que não é número
  const numeros = telefone.replace(/\D/g, "");

  // Precisa ter pelo menos 10 dígitos (DDD + 8 dígitos)
  if (numeros.length < 10) return null;

  let telefoneLocal = numeros;

  // Remove código do país se presente (55 para Brasil)
  if (telefoneLocal.startsWith("55") && telefoneLocal.length >= 12) {
    telefoneLocal = telefoneLocal.slice(2);
  }

  // Agora deve ter 10 ou 11 dígitos (DDD + 8 ou 9 dígitos)
  if (telefoneLocal.length < 10 || telefoneLocal.length > 11) return null;

  const ddd = telefoneLocal.slice(0, 2);
  const numero = telefoneLocal.slice(2);

  // Se tem 9 dígitos, é celular com nono dígito
  // Se tem 8 dígitos, pode ser fixo ou celular antigo
  const numero9 = numero.length === 9 ? numero : `9${numero}`;
  const numero8 = numero.length === 9 ? numero.slice(1) : numero;

  return { ddd, numero9, numero8 };
}

/**
 * Resultado da busca por telefone
 */
export interface ParteEncontrada {
  tipo_entidade: TipoEntidadeChatwoot;
  entidade_id: number;
  nome: string;
  telefone_match: string;
}

/**
 * Resultado da sincronização Chatwoot -> App
 */
export interface SincronizarChatwootParaAppResult {
  total_contatos_chatwoot: number;
  contatos_com_telefone: number;
  contatos_vinculados: number;
  contatos_atualizados: number;
  contatos_sem_match: number;
  erros: Array<{ chatwoot_contact_id: number; phone: string; erro: string }>;
  contatos_sem_match_lista: Array<{
    chatwoot_contact_id: number;
    name: string;
    phone: string;
  }>;
}

/**
 * Busca uma parte por telefone no banco local
 * Pesquisa em clientes, partes_contrarias e terceiros
 *
 * @param ddd - DDD do telefone (2 dígitos)
 * @param numero9 - Número com 9 dígitos
 * @param numero8 - Número com 8 dígitos (últimos 8)
 */
export async function buscarPartePorTelefone(
  ddd: string,
  numero9: string,
  numero8: string
): Promise<Result<ParteEncontrada | null>> {
  const supabase = await createDbClient();

  // Ordem de prioridade: clientes > partes_contrarias > terceiros
  const tabelas: Array<{ tabela: string; tipo: TipoEntidadeChatwoot }> = [
    { tabela: "clientes", tipo: "cliente" },
    { tabela: "partes_contrarias", tipo: "parte_contraria" },
    { tabela: "terceiros", tipo: "terceiro" },
  ];

  for (const { tabela, tipo } of tabelas) {
    // Busca por celular com 9 dígitos
    const { data: match9Cel, error: err9Cel } = await supabase
      .from(tabela)
      .select("id, nome")
      .eq("ddd_celular", ddd)
      .eq("numero_celular", numero9)
      .limit(1)
      .maybeSingle();

    if (err9Cel) {
      console.error(`Erro ao buscar em ${tabela} (celular 9):`, err9Cel);
      continue;
    }

    if (match9Cel) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match9Cel.id,
        nome: match9Cel.nome,
        telefone_match: `${ddd}${numero9}`,
      });
    }

    // Busca por celular com 8 dígitos
    const { data: match8Cel, error: err8Cel } = await supabase
      .from(tabela)
      .select("id, nome")
      .eq("ddd_celular", ddd)
      .eq("numero_celular", numero8)
      .limit(1)
      .maybeSingle();

    if (err8Cel) {
      console.error(`Erro ao buscar em ${tabela} (celular 8):`, err8Cel);
      continue;
    }

    if (match8Cel) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match8Cel.id,
        nome: match8Cel.nome,
        telefone_match: `${ddd}${numero8}`,
      });
    }

    // Busca por comercial com 9 dígitos
    const { data: match9Com, error: err9Com } = await supabase
      .from(tabela)
      .select("id, nome")
      .eq("ddd_comercial", ddd)
      .eq("numero_comercial", numero9)
      .limit(1)
      .maybeSingle();

    if (err9Com) {
      console.error(`Erro ao buscar em ${tabela} (comercial 9):`, err9Com);
      continue;
    }

    if (match9Com) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match9Com.id,
        nome: match9Com.nome,
        telefone_match: `${ddd}${numero9}`,
      });
    }

    // Busca por comercial com 8 dígitos
    const { data: match8Com, error: err8Com } = await supabase
      .from(tabela)
      .select("id, nome")
      .eq("ddd_comercial", ddd)
      .eq("numero_comercial", numero8)
      .limit(1)
      .maybeSingle();

    if (err8Com) {
      console.error(`Erro ao buscar em ${tabela} (comercial 8):`, err8Com);
      continue;
    }

    if (match8Com) {
      return ok({
        tipo_entidade: tipo,
        entidade_id: match8Com.id,
        nome: match8Com.nome,
        telefone_match: `${ddd}${numero8}`,
      });
    }
  }

  // Nenhuma parte encontrada
  return ok(null);
}

/**
 * Sincroniza contatos do Chatwoot para o App
 *
 * Fluxo:
 * 1. Lista todos os contatos do Chatwoot
 * 2. Para cada contato com telefone, busca no banco local
 * 3. Se encontrar, cria/atualiza mapeamento
 *
 * @returns Resultado com estatísticas da sincronização
 */
export async function sincronizarChatwootParaApp(): Promise<
  Result<SincronizarChatwootParaAppResult>
> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  const client = await getChatwootClient();
  const accountId = client.getAccountId();

  const result: SincronizarChatwootParaAppResult = {
    total_contatos_chatwoot: 0,
    contatos_com_telefone: 0,
    contatos_vinculados: 0,
    contatos_atualizados: 0,
    contatos_sem_match: 0,
    erros: [],
    contatos_sem_match_lista: [],
  };

  try {
    // Lista todos os contatos do Chatwoot (max 50 pages = ~750 contacts)
    const contatosResult = await listAllContacts(50, client);

    if (!contatosResult.success) {
      return err(chatwootErrorToAppError(contatosResult.error));
    }

    const contatos = contatosResult.data;
    result.total_contatos_chatwoot = contatos.length;

    // Processa cada contato
    for (const contato of contatos) {
      const telefoneInfo = extrairTelefone(contato.phone_number);

      if (!telefoneInfo) {
        // Contato sem telefone válido, pula
        continue;
      }

      result.contatos_com_telefone++;

      // Verifica se já existe mapeamento para este contato
      const mapeamentoExistente = await findMapeamentoPorChatwootId(
        contato.id,
        accountId
      );

      if (mapeamentoExistente.success && mapeamentoExistente.data) {
        // Já está vinculado, atualiza timestamp se necessário
        result.contatos_atualizados++;
        continue;
      }

      // Busca parte por telefone
      const parteResult = await buscarPartePorTelefone(
        telefoneInfo.ddd,
        telefoneInfo.numero9,
        telefoneInfo.numero8
      );

      if (!parteResult.success) {
        result.erros.push({
          chatwoot_contact_id: contato.id,
          phone: contato.phone_number ?? "",
          erro: parteResult.error.message,
        });
        continue;
      }

      if (!parteResult.data) {
        // Não encontrou parte correspondente
        result.contatos_sem_match++;
        result.contatos_sem_match_lista.push({
          chatwoot_contact_id: contato.id,
          name: contato.name ?? "",
          phone: contato.phone_number ?? "",
        });
        continue;
      }

      // Encontrou parte! Cria mapeamento
      const parte = parteResult.data;

      const mapeamentoResult = await upsertMapeamentoPorEntidade({
        tipo_entidade: parte.tipo_entidade,
        entidade_id: parte.entidade_id,
        chatwoot_contact_id: contato.id,
        chatwoot_account_id: accountId,
        dados_sincronizados: {
          vinculado_por_telefone: true,
          telefone_match: parte.telefone_match,
          nome_chatwoot: contato.name,
          nome_local: parte.nome,
          vinculado_em: new Date().toISOString(),
        },
      });

      if (mapeamentoResult.success) {
        result.contatos_vinculados++;
      } else {
        result.erros.push({
          chatwoot_contact_id: contato.id,
          phone: contato.phone_number ?? "",
          erro: mapeamentoResult.error.message,
        });
      }
    }

    return ok(result);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao sincronizar Chatwoot para App",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Conversas
// =============================================================================

/**
 * Busca conversas de uma parte local (cliente, parte_contraria, terceiro)
 * Primeiro busca o mapeamento, depois busca conversas do contato no Chatwoot
 */
export async function buscarConversasDaParte(
  tipoEntidade: TipoEntidadeChatwoot,
  entidadeId: number,
  status?: "open" | "resolved" | "pending" | "all"
): Promise<Result<ChatwootConversation[]>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();

    // Busca mapeamento da parte
    const mapeamento = await findMapeamentoPorEntidade(
      tipoEntidade,
      entidadeId
    );

    if (!mapeamento.success) {
      return err(mapeamento.error);
    }

    if (!mapeamento.data) {
      return ok([]); // Parte não está vinculada ao Chatwoot
    }

    // Busca conversas do contato
    const conversasResult = await getContactConversations(
      mapeamento.data.chatwoot_contact_id,
      status,
      client
    );

    if (!conversasResult.success) {
      return err(chatwootErrorToAppError(conversasResult.error));
    }

    return ok(conversasResult.data);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao buscar conversas da parte",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca histórico de mensagens de uma conversa específica
 */
export async function buscarHistoricoConversa(
  conversationId: number,
  limite?: number
): Promise<Result<ChatwootMessage[]>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();

    const result = await getConversationHistory(conversationId, limite, client);

    if (!result.success) {
      return err(chatwootErrorToAppError(result.error));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao buscar histórico da conversa",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca histórico formatado para AI de uma conversa
 */
export async function buscarHistoricoConversaFormatado(
  conversationId: number,
  limite = 50
): Promise<Result<string>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();

    const result = await formatConversationForAI(
      conversationId,
      limite,
      client
    );

    if (!result.success) {
      return err(chatwootErrorToAppError(result.error));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao formatar histórico da conversa",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Busca métricas de conversas (contagens por status)
 */
export async function buscarMetricasConversas(
  inboxId?: number,
  teamId?: number
): Promise<Result<ChatwootConversationCounts>> {
  // Verifica se Chatwoot está configurado
  if (!(await isChatwootConfigured())) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Chatwoot não está configurado. Defina as variáveis de ambiente."
      )
    );
  }

  try {
    const client = await getChatwootClient();

    const result = await getConversationCounts(
      { inbox_id: inboxId, team_id: teamId },
      client
    );

    if (!result.success) {
      return err(chatwootErrorToAppError(result.error));
    }

    return ok(result.data);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao buscar métricas de conversas",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Sincronização de Conversas (conversas_chatwoot table)
// =============================================================================

export interface SincronizarConversaParams {
  chatwoot_conversation_id: number;
  chatwoot_account_id: number;
  chatwoot_inbox_id: number;
  mapeamento_partes_chatwoot_id?: number;
  status?: "open" | "resolved" | "pending" | "snoozed";
  assignee_id?: number | null;
  message_count?: number;
  unread_count?: number;
}

/**
 * Sincroniza uma conversa do Chatwoot para a tabela conversas_chatwoot
 * Cria ou atualiza a conversa com dados sincronizados
 */
export async function sincronizarConversaChatwoot(
  params: SincronizarConversaParams
): Promise<Result<{ id: bigint; criada: boolean }>> {
  try {
    // Verifica se conversa já existe
    const {
      criarConversa,
      atualizarConversa,
      findConversaPorChatwootId,
    } = await import("./repository");

    const contatoExistente = await findConversaPorChatwootId(
      BigInt(params.chatwoot_conversation_id),
      BigInt(params.chatwoot_account_id)
    );

    if (!contatoExistente.success) {
      return err(contatoExistente.error);
    }

    if (contatoExistente.data) {
      // Atualiza conversa existente
      const updateResult = await atualizarConversa(contatoExistente.data.id, {
        status: params.status,
        sincronizado: true,
        ultima_sincronizacao: new Date().toISOString(),
      });

      if (!updateResult.success) {
        return err(updateResult.error);
      }

      return ok({ id: contatoExistente.data.id, criada: false });
    }

    // Cria nova conversa
    const criarResult = await criarConversa({
      chatwoot_conversation_id: BigInt(params.chatwoot_conversation_id),
      chatwoot_account_id: BigInt(params.chatwoot_account_id),
      chatwoot_inbox_id: BigInt(params.chatwoot_inbox_id),
      mapeamento_partes_chatwoot_id: params.mapeamento_partes_chatwoot_id,
      status: params.status || "open",
      assignee_chatwoot_id: params.assignee_id ? BigInt(params.assignee_id) : undefined,
      dados_sincronizados: {
        criada_em: new Date().toISOString(),
        versao_schema: 1,
      },
    });

    if (!criarResult.success) {
      return err(criarResult.error);
    }

    return ok({ id: criarResult.data.id, criada: true });
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao sincronizar conversa Chatwoot",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Interface para parâmetros de atribuição inteligente
 */
export interface AtribuirConversaInteligentParams {
  conversacao_id?: bigint;
  chatwoot_conversation_id?: number;
  chatwoot_account_id: number;
  habilidades_requeridas?: string[];
  prioridade?: "alta" | "media" | "baixa";
}

/**
 * Atribui uma conversa a um agente disponível (smart assignment)
 * Lógica:
 * 1. Lista agentes disponíveis da conta
 * 2. Filtra por habilidades se especificadas
 * 3. Ordena por número de conversas ativas (ascending) para distribuição de carga
 * 4. Retorna o agente com menos conversas ativas
 */
export async function atribuirConversaInteligente(
  params: AtribuirConversaInteligentParams
): Promise<Result<{ usuario_id: string; agente_id: bigint; nome: string | null }>> {
  try {
    const {
      listarAgentesDisponíveis,
      atualizarConversa,
    } = await import("./repository");

    // Lista agentes disponíveis ordenados por carga
    const agentesResult = await listarAgentesDisponíveis(
      BigInt(params.chatwoot_account_id),
      { skills: params.habilidades_requeridas }
    );

    if (!agentesResult.success) {
      return err(agentesResult.error);
    }

    if (!agentesResult.data || agentesResult.data.length === 0) {
      return err(
        appError(
          "NOT_FOUND",
          "Nenhum agente disponível para atribuição"
        )
      );
    }

    // Pega o primeiro agente (ordenado por menor carga)
    const agenteSelecionado = agentesResult.data[0];

    // Se houver conversa para atualizar, marca como atribuída
    if (params.conversacao_id) {
      const updateResult = await atualizarConversa(params.conversacao_id, {
        assignee_chatwoot_id: agenteSelecionado.chatwoot_agent_id,
        sincronizado: false, // Marca para re-sincronizar com Chatwoot
      });

      if (!updateResult.success) {
        console.error("Erro ao atualizar conversa:", updateResult.error);
        // Não falha a atribuição, apenas loga o erro
      }
    }

    return ok({
      usuario_id: agenteSelecionado.usuario_id,
      agente_id: agenteSelecionado.chatwoot_agent_id,
      nome: agenteSelecionado.nome_chatwoot,
    });
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao atribuir conversa",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza o status de uma conversa e sincroniza com Chatwoot
 */
export async function atualizarStatusConversa(
  chatwoot_conversation_id: number,
  chatwoot_account_id: number,
  novo_status: "open" | "resolved" | "pending" | "snoozed"
): Promise<Result<void>> {
  try {
    if (!(await isChatwootConfigured())) {
      return err(
        appError("EXTERNAL_SERVICE_ERROR", "Chatwoot não está configurado")
      );
    }

    const { findConversaPorChatwootId, atualizarConversa } = await import("./repository");
    const _client = await getChatwootClient();

    // Busca conversa local
    const contatoLocal = await findConversaPorChatwootId(
      BigInt(chatwoot_conversation_id),
      BigInt(chatwoot_account_id)
    );

    if (!contatoLocal.success) {
      return err(contatoLocal.error);
    }

    if (!contatoLocal.data) {
      return err(appError("NOT_FOUND", "Conversa não encontrada"));
    }

    // Atualiza no Chatwoot via API (se implementado no cliente)
    // Por enquanto, apenas atualiza localmente
    const updateResult = await atualizarConversa(contatoLocal.data.id, {
      status: novo_status,
      ultima_sincronizacao: new Date().toISOString(),
    });

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao atualizar status da conversa",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Sincronização de Agentes (usuarios_chatwoot table)
// =============================================================================

export interface SincronizarAgenteParams {
  usuario_id?: string;
  chatwoot_agent_id: number;
  chatwoot_account_id: number;
  email: string;
  nome_chatwoot: string;
  role: "agent" | "supervisor" | "admin";
  disponivel?: boolean;
  habilidades?: string[];
  max_conversas_simultaneas?: number;
}

/**
 * Sincroniza um agente do Chatwoot para a tabela usuarios_chatwoot
 */
export async function sincronizarAgenteChatwoot(
  params: SincronizarAgenteParams
): Promise<Result<{ id: bigint; criado: boolean }>> {
  try {
    const {
      findUsuarioPorChatwootId,
      criarUsuario,
      atualizarUsuario,
      atualizarUsuarioPorUUID,
    } = await import("./repository");

    // Busca agente existente
    const agenteExistente = await findUsuarioPorChatwootId(
      BigInt(params.chatwoot_agent_id),
      BigInt(params.chatwoot_account_id)
    );

    if (!agenteExistente.success) {
      return err(agenteExistente.error);
    }

    if (agenteExistente.data) {
      // Atualiza agente existente
      const updateResult = params.usuario_id
        ? await atualizarUsuarioPorUUID(
            agenteExistente.data.usuario_id,
            {
              role: params.role,
              ultima_sincronizacao: new Date().toISOString(),
            }
          )
        : await atualizarUsuario(agenteExistente.data.id, {
            role: params.role,
            ultima_sincronizacao: new Date().toISOString(),
          });

      if (!updateResult.success) {
        return err(updateResult.error);
      }

      return ok({ id: agenteExistente.data.id, criado: false });
    }

    // Cria novo agente
    const criarResult = await criarUsuario({
      usuario_id: params.usuario_id,
      chatwoot_agent_id: BigInt(params.chatwoot_agent_id),
      chatwoot_account_id: BigInt(params.chatwoot_account_id),
      email: params.email,
      nome_chatwoot: params.nome_chatwoot,
      role: params.role,
      skills: params.habilidades || [],
      max_conversas_simultaneas: params.max_conversas_simultaneas || 10,
      dados_sincronizados: {
        sincronizado_em: new Date().toISOString(),
      },
    });

    if (!criarResult.success) {
      return err(criarResult.error);
    }

    return ok({ id: criarResult.data.id, criado: true });
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao sincronizar agente Chatwoot",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Atualiza a disponibilidade de um agente
 */
export async function atualizarDisponibilidadeAgente(
  usuario_id: string,
  disponivel: boolean,
  disponivel_em?: Date
): Promise<Result<void>> {
  try {
    const { atualizarUsuarioPorUUID } = await import("./repository");

    const updateResult = await atualizarUsuarioPorUUID(usuario_id, {
      disponivel,
      disponivel_em: disponivel_em ? disponivel_em.toISOString() : (disponivel ? undefined : new Date().toISOString()),
      ultima_sincronizacao: new Date().toISOString(),
    });

    if (!updateResult.success) {
      return err(updateResult.error);
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao atualizar disponibilidade do agente",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

// =============================================================================
// Webhook Handling
// =============================================================================

/**
 * Tipos de eventos webhook do Chatwoot
 */
export type WebhookEventType =
  | "conversation.created"
  | "conversation.updated"
  | "conversation.status_changed"
  | "conversation.assignment_changed"
  | "message.created"
  | "message.updated"
  | "agent.status_changed"
  | "contact.created"
  | "contact.updated";

/**
 * Payload base do webhook
 */
export interface WebhookPayload {
  event: WebhookEventType;
  data?: Record<string, unknown>;
  account_id?: number;
}

/**
 * Processa webhook de conversa criada/atualizada
 */
export async function processarWebhookConversa(
  event: WebhookEventType,
  payload: WebhookPayload
): Promise<Result<void>> {
  try {
    if (!(await isChatwootConfigured())) {
      return err(
        appError("EXTERNAL_SERVICE_ERROR", "Chatwoot não está configurado")
      );
    }

    const data = payload.data || {};
    const conversationId = (data.id as number | undefined) || ((data.conversation as Record<string, unknown>)?.id as number | undefined) || 0;
    const accountId = payload.account_id || Number((payload.data?.account_id as string) || 0);

    if (!conversationId || !accountId) {
      return err(
        appError(
          "VALIDATION_ERROR",
          "Webhook payload inválido: faltam conversation_id ou account_id"
        )
      );
    }

    if (event === "conversation.created") {
      // Sincroniza nova conversa
      const syncResult = await sincronizarConversaChatwoot({
        chatwoot_conversation_id: conversationId,
        chatwoot_account_id: accountId,
        chatwoot_inbox_id: (data.inbox_id as number) || 0,
        status: (data.status as StatusConversa) || "open",
        message_count: (data.messages_count as number) || 0,
        unread_count: (data.unread_count as number) || 0,
      });

      if (!syncResult.success) {
        return err(syncResult.error);
      }

      // Se conversa criada sem agente atribuído, tenta atribuir
      if (!data.assignee_id) {
        const atribuirResult = await atribuirConversaInteligente({
          conversacao_id: syncResult.data.id,
          chatwoot_conversation_id: conversationId,
          chatwoot_account_id: accountId,
        });

        if (!atribuirResult.success) {
          console.warn(
            `Não foi possível atribuir conversa ${conversationId}:`,
            atribuirResult.error.message
          );
        }
      }
    } else if (event === "conversation.updated") {
      // Atualiza dados da conversa
      const syncResult = await sincronizarConversaChatwoot({
        chatwoot_conversation_id: conversationId,
        chatwoot_account_id: accountId,
        chatwoot_inbox_id: (data.inbox_id as number) || 0,
        status: (data.status as StatusConversa) || "open",
        assignee_id: (data.assignee_id as number) || undefined,
        message_count: (data.messages_count as number) || 0,
        unread_count: (data.unread_count as number) || 0,
      });

      if (!syncResult.success) {
        return err(syncResult.error);
      }
    } else if (event === "conversation.status_changed") {
      // Atualiza status da conversa
      const novo_status = (data.status as "open" | "resolved" | "pending" | "snoozed") || "open";
      const statusResult = await atualizarStatusConversa(
        conversationId,
        accountId,
        novo_status
      );

      if (!statusResult.success) {
        return err(statusResult.error);
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao processar webhook de conversa",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Processa webhook de mudança de status de agente
 */
export async function processarWebhookAgente(
  event: WebhookEventType,
  payload: WebhookPayload
): Promise<Result<void>> {
  try {
    if (!(await isChatwootConfigured())) {
      return err(
        appError("EXTERNAL_SERVICE_ERROR", "Chatwoot não está configurado")
      );
    }

    const data = payload.data || {};
    const agentId = (data.id as number) || (data.agent_id as number);
    const accountId = payload.account_id || Number((payload.data?.account_id as string) || 0);

    if (!agentId || !accountId) {
      return err(
        appError(
          "VALIDATION_ERROR",
          "Webhook payload inválido: faltam agent_id ou account_id"
        )
      );
    }

    if (event === "agent.status_changed") {
      // Busca usuário associado e atualiza disponibilidade
      const { findUsuarioPorChatwootId } = await import("./repository");

      const usuarioResult = await findUsuarioPorChatwootId(
        BigInt(agentId),
        BigInt(accountId)
      );

      if (!usuarioResult.success) {
        // Pode ser que o agente ainda não tenha sido sincronizado
        console.warn(`Agente ${agentId} não encontrado no banco local`);
        return ok(undefined);
      }

      if (!usuarioResult.data) {
        return ok(undefined);
      }

      // Atualiza disponibilidade com base no status Chatwoot
      const disponivel = (data.availability_status as string) === "available" || 
                        data.presence_status !== "offline";

      const disponibilidadeResult = await atualizarDisponibilidadeAgente(
        usuarioResult.data.usuario_id,
        disponivel,
        disponivel ? undefined : new Date()
      );

      if (!disponibilidadeResult.success) {
        return err(disponibilidadeResult.error);
      }
    }

    return ok(undefined);
  } catch (error) {
    return err(
      appError(
        "EXTERNAL_SERVICE_ERROR",
        "Erro ao processar webhook de agente",
        undefined,
        error instanceof Error ? error : undefined
      )
    );
  }
}

/**
 * Processa webhook genérico e roteia para o handler específico
 */
export async function processarWebhook(
  event: WebhookEventType,
  payload: WebhookPayload
): Promise<Result<void>> {
  // Roteia para o handler específico
  if (event.startsWith("conversation")) {
    return processarWebhookConversa(event, payload);
  } else if (event.startsWith("agent")) {
    return processarWebhookAgente(event, payload);
  }

  // Para outros eventos (contact, message), apenas loga por enquanto
  console.log(`Webhook recebido: ${event}`, payload);

  return ok(undefined);
}
