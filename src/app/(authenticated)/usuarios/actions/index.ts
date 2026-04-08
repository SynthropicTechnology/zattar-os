// ============================================================================
// Usuarios Actions — Barrel Export
// ============================================================================

// --- Auth Utils ---
export { requireAuth } from './utils';

// --- Usuarios CRUD ---
export {
    actionAtualizarUsuario,
    actionCriarUsuario,
    actionBuscarUsuario,
    actionListarUsuarios,
    actionDesativarUsuario,
    actionBuscarPorCpf,
    actionBuscarPorEmail,
    actionSincronizarUsuarios,
} from './usuarios-actions';

// --- Senha ---
export {
    actionAlterarSenhaComVerificacao,
    actionRedefinirSenha,
    actionAtualizarSenhaServer,
} from './senha-actions';

// --- Permissões ---
export {
    actionListarPermissoes,
    actionSalvarPermissoes,
} from './permissoes-actions';

// --- Avatar ---
export {
    actionUploadAvatar,
    actionRemoverAvatar,
} from './avatar-actions';

// --- Cover ---
export {
    actionUploadCover,
    actionRemoverCover,
} from './cover-actions';

// --- Cargos ---
export {
    actionListarCargos,
    actionCriarCargo,
    actionAtualizarCargo,
    actionDeletarCargo,
} from './cargos-actions';

// --- Atividades ---
export {
    actionBuscarEstatisticasAtividades,
    actionBuscarProcessosAtribuidos,
    actionBuscarAudienciasAtribuidas,
    actionBuscarPendentesAtribuidos,
    actionBuscarContratosAtribuidos,
} from './atividades-actions';

// --- Auth Logs ---
export {
    actionBuscarAuthLogs,
} from './auth-logs-actions';

// --- Audit Atividades ---
export {
    actionBuscarAtividadesUsuario,
} from './audit-atividades-actions';
