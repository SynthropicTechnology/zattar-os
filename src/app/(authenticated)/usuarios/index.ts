// Types
export type {
  Usuario,
  UsuarioDados,
  ListarUsuariosParams,
  ListarUsuariosResult,
  OperacaoUsuarioResult,
  UsuarioDetalhado,
  Permissao,
  PermissaoMatriz,
  PermissoesSaveState,
  GeneroUsuario,
  Endereco,
  UsuariosFilters,
} from "./domain";

// Permission Types
export type {
  Recurso,
  Operacao,
} from "./types/types";

// Domain
export {
  GENERO_LABELS,
  STATUS_LABELS,
  cpfSchema,
  emailSchema,
  telefoneSchema,
  enderecoSchema,
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  isUsuarioAtivo,
  isSuperAdmin,
} from "./domain";

// Utils
export {
  formatarCpf,
  formatarTelefone,
  formatarOab,
  formatarNomeExibicao,
  formatarData,
  formatarEnderecoCompleto,
  formatarGenero,
  formatarEndereco,
  formatarDataCadastro,
  normalizarCpf,
  getAvatarUrl,
  getCoverUrl,
} from "./utils";

// Permissions Utils
export {
  formatarPermissoesParaMatriz,
  formatarMatrizParaPermissoes,
  formatarNomeRecurso,
  formatarNomeOperacao,
  contarPermissoesAtivas,
  detectarMudancas,
} from "./permissions-utils";

// Permission validation functions and matriz
export {
  MATRIZ_PERMISSOES,
  obterMatrizPermissoes,
  obterTotalPermissoes,
  isPermissaoValida,
  isRecursoValido,
  isOperacaoValida,
} from "./types/types";

// Service Functions
// NOTE: Server-side service and repository are NOT exported here to prevent
// Redis/Node.js dependencies from being bundled in client components.
// These should only be used by server actions and can be imported directly:
//   import { service } from '@/app/(authenticated)/usuarios/service';
//   import { usuarioRepository } from '@/app/(authenticated)/usuarios/repository';

// Auth Utils
export { requireAuth } from "./actions/utils";

// Actions
export {
  actionAlterarSenhaComVerificacao,
  actionRedefinirSenha,
  actionAtualizarSenhaServer,
} from "./actions/senha-actions";

export {
  actionAtualizarUsuario,
  actionCriarUsuario,
  actionBuscarUsuario,
  actionListarUsuarios,
  actionDesativarUsuario,
  actionBuscarPorCpf,
  actionBuscarPorEmail,
  actionSincronizarUsuarios,
} from "./actions/usuarios-actions";

export {
  actionUploadCover,
  actionRemoverCover,
} from "./actions/cover-actions";

export {
  actionBuscarAuthLogs,
} from "./actions/auth-logs-actions";

export {
  actionBuscarEstatisticasAtividades,
  actionBuscarProcessosAtribuidos,
  actionBuscarAudienciasAtribuidas,
  actionBuscarPendentesAtribuidos,
  actionBuscarContratosAtribuidos,
} from "./actions/atividades-actions";

export {
  actionBuscarAtividadesUsuario,
} from "./actions/audit-atividades-actions";

export type {
  AtividadeLog,
} from "./repository-audit-atividades";

// Hooks
export { useUsuarios } from "./hooks/use-usuarios";
export { useUsuario } from "./hooks/use-usuario";
export { useCargos } from "./hooks/use-cargos";
export { useUsuarioPermissoes } from "./hooks/use-usuario-permissoes";
// Components
export { UsuariosGridView } from "./components/list/usuarios-grid-view";
export { UsuariosPagination } from "./components/list/usuarios-pagination";
export {
  USUARIOS_FILTER_CONFIGS,
  buildUsuariosFilterOptions,
  buildUsuariosFilterGroups,
  parseUsuariosFilters,
} from "./components/list/usuarios-toolbar-filters";
export { UsuariosListFilters } from "./components/list/usuarios-list-filters";
export { UsuarioCard } from "./components/shared/usuario-card";
export { UsuarioCreateDialog } from "./components/forms/usuario-create-dialog";
export { UsuarioEditDialog } from "./components/forms/usuario-edit-dialog";
export { UsuarioDadosBasicos } from "./components/forms/usuario-dados-basicos";
export { UsuarioViewSheet } from "./components/detail/usuario-view-sheet";
export { CargosManagementDialog } from "./components/cargos/cargos-management-dialog";
export { RedefinirSenhaDialog } from "./components/password/redefinir-senha-dialog";
export { AvatarEditDialog } from "./components/avatar/avatar-edit-dialog";
export { CoverEditDialog } from "./components/cover/cover-edit-dialog";
export { PermissoesMatriz } from "./components/permissions/permissoes-matriz";
export { AuthLogsTimeline } from "./components/logs/auth-logs-timeline";
export { AtividadesCards } from "./components/activities/atividades-cards";
export { AtividadesRecentes } from "./components/activities/atividades-recentes";
export { UsuariosPageContent } from "./components/usuarios-page-content";
