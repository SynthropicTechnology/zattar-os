/**
 * NOTIFICAÇÕES - Barrel Exports
 *
 * Exporta todos os tipos, funções e componentes da feature de notificações.
 */

// Domain
export type {
  Notificacao,
  TipoNotificacaoUsuario,
  EntidadeTipo,
  CreateNotificacaoInput,
  UpdateNotificacaoInput,
  ListarNotificacoesParams,
  NotificacoesPaginadas,
  ContadorNotificacoes,
} from "./domain";

export {
  createNotificacaoSchema,
  updateNotificacaoSchema,
  listarNotificacoesSchema,
  TIPO_NOTIFICACAO_LABELS,
  TIPO_NOTIFICACAO_ICONES,
} from "./domain";

// Service
export {
  listarNotificacoes,
  buscarNotificacaoPorId,
  contarNotificacoesNaoLidas,
  marcarNotificacaoComoLida,
  marcarTodasComoLidas,
} from "./service";

// Actions
export {
  actionListarNotificacoes,
  actionContarNotificacoesNaoLidas,
  actionMarcarNotificacaoComoLida,
  actionMarcarTodasComoLidas,
} from "./actions/notificacoes-actions";

// Components
export { NotificacoesList } from "./components/notificacoes-list";

// Hooks
export { useNotificacoes, useNotificacoesRealtime } from "./hooks/use-notificacoes";

