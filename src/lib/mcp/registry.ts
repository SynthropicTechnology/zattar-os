/**
 * Registry Principal de Ferramentas MCP do ZattarOS
 *
 * Orquestra o registro de 172 ferramentas MCP organizadas em 23 módulos.
 * Cada módulo é responsável por registrar ferramentas relacionadas a uma feature específica.
 *
 * Módulos disponíveis:
 * - Processos (4 tools) - Busca por CPF, CNPJ, número CNJ
 * - Partes (6 tools) - Clientes, partes contrárias, terceiros
 * - Contratos (4 tools) - CRUD e busca por cliente
 * - Financeiro (29 tools) - Plano de contas, lançamentos, DRE, fluxo de caixa
 * - Chat (6 tools) - Salas, mensagens, grupos, chamadas
 * - Documentos (6 tools) - Listagem, templates, categorias
 * - Expedientes (7 tools) - Listagem, baixa, transferência, pendentes
 * - Audiências (6 tools) - Listagem, status, busca por CPF/CNPJ/processo
 * - Obrigações (5 tools) - Acordos, repasses pendentes
 * - RH (2 tools) - Salários e folhas de pagamento
 * - Dashboard (2 tools) - Métricas do escritório e do usuário
 * - Busca Semântica (1 tool) - Busca vetorial cross-módulo
 * - Captura (1 tool) - Capturas CNJ
 * - Usuários (4 tools) - Listagem, busca por email/CPF, permissões
 * - Acervo (1 tool) - Listagem de acervo processual
 * - Assistentes (1 tool) - Listagem de assistentes AI
 * - Cargos (1 tool) - Listagem de cargos
 * - Advogados (5 tools) - CRUD, busca por OAB, credenciais
 * - Perícias (4 tools) - Listagem, busca por ID/processo, especialidades
 * - Assinatura Digital (1 tool) - Templates de assinatura
 * - Tarefas (10 tools) - CRUD, quadros, reuniões Zoom, horários disponíveis
 * - Chatwoot (16 tools) - Contatos, conversas, labels, métricas
 * - Dify (50 tools) - Chat, workflows, knowledge base, anotações, tags, chunks
 */

import {
  registerProcessosTools,
  registerPartesTools,
  registerContratosTools,
  registerFinanceiroTools,
  registerChatTools,
  registerDocumentosTools,
  registerExpedientesTools,
  registerAudienciasTools,
  registerObrigacoesTools,
  registerRHTools,
  registerDashboardTools,
  registerBuscaSemanticaTools,
  registerCapturaTools,
  registerUsuariosTools,
  registerAcervoTools,
  registerAssistentesTools,
  registerCargosTools,
  registerAdvogadosTools,
  registerPericiasTools,
  registerAssinaturaDigitalTools,
  registerTarefasTools,
  registerChatwootTools,
  registerDifyTools,
} from './registries';

/**
 * Flag de controle de registro único
 */
let toolsRegistered = false;

/**
 * Registra todas as ferramentas MCP
 *
 * Esta função orquestra o registro de todas as ferramentas MCP do sistema,
 * chamando sequencialmente cada módulo de registro.
 *
 * @returns Promise<void>
 */
export async function registerAllTools(): Promise<void> {
  if (toolsRegistered) {
    console.log('[MCP Registry] Ferramentas já registradas');
    return;
  }

  console.log('[MCP Registry] Iniciando registro...');

  // Registrar tools por módulo
  await registerProcessosTools();
  await registerPartesTools();
  await registerContratosTools();
  await registerFinanceiroTools();
  await registerChatTools();
  await registerDocumentosTools();
  await registerExpedientesTools();
  await registerAudienciasTools();
  await registerObrigacoesTools();
  await registerRHTools();
  await registerDashboardTools();
  await registerBuscaSemanticaTools();
  await registerCapturaTools();
  await registerUsuariosTools();
  await registerAcervoTools();
  await registerAssistentesTools();
  await registerCargosTools();
  await registerAdvogadosTools();
  await registerPericiasTools();
  await registerAssinaturaDigitalTools();
  await registerTarefasTools();
  await registerChatwootTools();
  await registerDifyTools();

  toolsRegistered = true;
  console.log('[MCP Registry] Registro concluído');
}

/**
 * Reseta o registry (para testes)
 *
 * Esta função permite resetar o estado do registry,
 * útil para cenários de teste onde é necessário
 * re-registrar as ferramentas.
 */
export function resetToolsRegistry(): void {
  toolsRegistered = false;
}

/**
 * Verifica se tools foram registradas
 *
 * @returns boolean indicando se as ferramentas já foram registradas
 */
export function areToolsRegistered(): boolean {
  return toolsRegistered;
}
