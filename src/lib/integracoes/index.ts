/**
 * Feature: Integrações
 * Barrel exports
 * 
 * IMPORTANT: Only export types, schemas, actions, and components here.
 * DO NOT export service or repository functions to avoid client/server boundary violations.
 */

// Domain - Types and Schemas (safe for client)
export type {
  Integracao,
  TipoIntegracao,
  TwoFAuthConfig,
  ChatwootConfig,
  DyteConfig,
  EditorIAConfig,
  AIProviderType,
  CriarIntegracaoParams,
  AtualizarIntegracaoParams,
} from "./domain";

export {
  TIPOS_INTEGRACAO,
  LABELS_TIPO_INTEGRACAO,
  DESCRICOES_TIPO_INTEGRACAO,
  LABELS_AI_PROVIDER,
  AI_PROVIDER_TYPES,
  criarIntegracaoSchema,
  atualizarIntegracaoSchema,
  twofauthConfigSchema,
  chatwootConfigSchema,
  dyteConfigSchema,
  editorIAConfigSchema,
} from "./domain";

// Actions - Server Actions (safe for client)
export {
  actionListarIntegracoes,
  actionListarIntegracoesPorTipo,
  actionBuscarIntegracao,
  actionBuscarConfig2FAuth,
  actionCriarIntegracao,
  actionAtualizarIntegracao,
  actionDeletarIntegracao,
  actionToggleAtivoIntegracao,
  actionAtualizarConfig2FAuth,
  actionAtualizarConfigChatwoot,
  actionAtualizarConfigDyte,
  actionAtualizarConfigEditorIA,
} from "./actions/integracoes-actions";

// Components (safe for client)
export { TwoFAuthIntegrationCard } from "./components/twofauth-integration-card";
export { TwoFAuthConfigForm } from "./components/twofauth-config-form";
export { ChatwootIntegrationCard } from "./components/chatwoot-integration-card";
export { ChatwootConfigForm } from "./components/chatwoot-config-form";
export { DyteIntegrationCard } from "./components/dyte-integration-card";
export { DyteConfigForm } from "./components/dyte-config-form";
export { EditorIAIntegrationCard } from "./components/editor-ia-integration-card";
export { EditorIAConfigForm } from "./components/editor-ia-config-form";

// Service - Server-only exports (use in Server Components and Actions only)
// Import directly from "./service" when needed in server context
