/**
 * Módulo MCP do Synthropic
 *
 * Exporta servidor, registry e utilitários para integração MCP
 */

// Tipos
export type {
  MCPToolConfig,
  MCPToolResult,
  MCPContentBlock,
  MCPServerInfo,
  MCPServerConfig,
  MCPConnectionState,
  ToolRegistration,
} from './types';

export {
  textResult,
  jsonResult,
  errorResult,
  buscaGenericaSchema,
  listagemSchema,
  buscarPorIdSchema,
} from './types';

// Servidor
export {
  getMcpServer,
  getMcpServerManager,
  registerMcpTool,
  executeMcpTool,
  listMcpTools,
  startMcpServerStdio,
} from './server';

// Registry
export {
  registerAllTools,
  resetToolsRegistry,
  areToolsRegistered,
} from './registry';

// Utilitários
export {
  actionResultToMcp,
  createToolFromAction,
  formatDataAsText,
  createContentBlocks,
  truncateText,
  formatListForMcp,
  extractSummaryFields,
  hasRequiredFields,
  generateToolName,
  generateToolDescription,
} from './utils';
