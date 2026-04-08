/**
 * Registry Principal de Ferramentas MCP do Synthropic
 *
 * Orquestra o registro de 119 ferramentas MCP organizadas em 22 módulos.
 * Cada módulo é responsável por registrar ferramentas relacionadas a uma feature específica.
 *
 * Módulos disponíveis:
 * - Processos (4 tools)
 * - Partes (6 tools)
 * - Contratos (4 tools)
 * - Financeiro (29 tools)
 * - Chat (6 tools)
 * - Documentos (6 tools)
 * - Expedientes (7 tools)
 * - Audiências (6 tools)
 * - Obrigações (5 tools)
 * - RH (2 tools)
 * - Dashboard (2 tools)
 * - Busca Semântica (1 tool)
 * - Captura (1 tool)
 * - Usuários (4 tools)
 * - Acervo (1 tool)
 * - Assistentes (1 tool)
 * - Cargos (1 tool)
 * - Advogados (5 tools)
 * - Perícias (4 tools)
 * - Assinatura Digital (1 tool)
 * - Tarefas (7 tools) - Inclui agendamento de reuniões Zoom
 * - Chatwoot (16 tools) - Integração com Chatwoot Contacts e Conversations
 * - Dify (13 tools) - Integração com Dify AI Platform (chat, workflows, knowledge base)
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
