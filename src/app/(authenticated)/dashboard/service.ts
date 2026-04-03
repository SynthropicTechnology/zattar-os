/**
 * Service Layer do Dashboard
 * Orquestração e agregação de dados
 *
 * OTIMIZAÇÃO:
 * - unstable_cache com TTL de 5 minutos para métricas que mudam pouco
 * - Cache key inclui usuarioId para dados personalizados
 * - Tags para invalidação on-demand via revalidateTag('dashboard')
 */

import { unstable_cache } from 'next/cache';
import {
  buscarProcessosResumo,
  buscarAudienciasResumo,
  buscarExpedientesResumo,
  buscarProximasAudiencias,
  buscarExpedientesUrgentes,
  buscarProdutividadeUsuario,
  buscarDadosFinanceirosConsolidados,
  buscarMetricasEscritorio,
  buscarCargaUsuarios,
  buscarStatusCapturas,
  buscarPerformanceAdvogados,
  buscarUsuario,
} from './repositories';
import { checkPermission } from '@/lib/auth/authorization';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
  ProcessoResumo,
  AudienciasResumo,
  ExpedientesResumo,
  ProdutividadeResumo,
  DadosFinanceirosConsolidados,
  AudienciaProxima,
  ExpedienteUrgente,
} from './domain';

// ============================================================================
// Cache TTL (em segundos)
// ============================================================================

const CACHE_TTL_DASHBOARD = 300; // 5 minutos

// ============================================================================
// Valores padrão para quando usuário não tem permissão
// ============================================================================

const PROCESSOS_RESUMO_PADRAO: ProcessoResumo = {
  total: 0,
  ativos: 0,
  arquivados: 0,
  porGrau: [],
  porTRT: [],
};

const AUDIENCIAS_RESUMO_PADRAO: AudienciasResumo = {
  total: 0,
  hoje: 0,
  amanha: 0,
  proximos7dias: 0,
  proximos30dias: 0,
};

const EXPEDIENTES_RESUMO_PADRAO: ExpedientesResumo = {
  total: 0,
  vencidos: 0,
  venceHoje: 0,
  venceAmanha: 0,
  proximos7dias: 0,
  porTipo: [],
};

const PRODUTIVIDADE_RESUMO_PADRAO: ProdutividadeResumo = {
  baixasHoje: 0,
  baixasSemana: 0,
  baixasMes: 0,
  mediaDiaria: 0,
  comparativoSemanaAnterior: 0,
  porDia: [],
};

const DADOS_FINANCEIROS_PADRAO: DadosFinanceirosConsolidados = {
  saldoTotal: 0,
  contasPagar: {
    quantidade: 0,
    valor: 0,
  },
  contasReceber: {
    quantidade: 0,
    valor: 0,
  },
  alertas: [],
};

// ============================================================================
// Dashboard de Usuário
// ============================================================================

/**
 * Obtém dados completos da dashboard para um usuário
 * Verifica permissões antes de buscar dados para evitar exposição de informações
 */
export async function obterDashboardUsuario(
  usuarioId: number
): Promise<DashboardUsuarioData> {
  // Buscar dados do usuário e permissões em paralelo
  const [usuario, podeVerProcessos, podeVerAudiencias, podeVerExpedientes, podeVerFinanceiro] =
    await Promise.all([
      buscarUsuario(usuarioId),
      checkPermission(usuarioId, 'processos', 'read'),
      checkPermission(usuarioId, 'audiencias', 'read'),
      checkPermission(usuarioId, 'expedientes', 'read'),
      checkPermission(usuarioId, 'financeiro', 'read'),
    ]);

  // Buscar apenas dados permitidos em paralelo
  const promises: Promise<unknown>[] = [];
  const indices: {
    processos?: number;
    audiencias?: number;
    expedientes?: number;
    proximasAudiencias?: number;
    expedientesUrgentes?: number;
    produtividade?: number;
    dadosFinanceiros?: number;
  } = {};

  let currentIndex = 0;

  // Processos
  if (podeVerProcessos) {
    indices.processos = currentIndex++;
    promises.push(buscarProcessosResumo(usuarioId));
  } else {
    promises.push(Promise.resolve(PROCESSOS_RESUMO_PADRAO));
    indices.processos = currentIndex++;
  }

  // Audiências
  if (podeVerAudiencias) {
    indices.audiencias = currentIndex++;
    promises.push(buscarAudienciasResumo(usuarioId));
  } else {
    promises.push(Promise.resolve(AUDIENCIAS_RESUMO_PADRAO));
    indices.audiencias = currentIndex++;
  }

  // Expedientes
  if (podeVerExpedientes) {
    indices.expedientes = currentIndex++;
    promises.push(buscarExpedientesResumo(usuarioId));
  } else {
    promises.push(Promise.resolve(EXPEDIENTES_RESUMO_PADRAO));
    indices.expedientes = currentIndex++;
  }

  // Próximas audiências (requer permissão de audiências)
  if (podeVerAudiencias) {
    indices.proximasAudiencias = currentIndex++;
    promises.push(buscarProximasAudiencias(usuarioId, 5));
  } else {
    promises.push(Promise.resolve([]));
    indices.proximasAudiencias = currentIndex++;
  }

  // Expedientes urgentes (requer permissão de expedientes)
  if (podeVerExpedientes) {
    indices.expedientesUrgentes = currentIndex++;
    promises.push(buscarExpedientesUrgentes(usuarioId, 5));
  } else {
    promises.push(Promise.resolve([]));
    indices.expedientesUrgentes = currentIndex++;
  }

  // Produtividade (requer permissão de processos)
  if (podeVerProcessos) {
    indices.produtividade = currentIndex++;
    promises.push(buscarProdutividadeUsuario(usuarioId));
  } else {
    promises.push(Promise.resolve(PRODUTIVIDADE_RESUMO_PADRAO));
    indices.produtividade = currentIndex++;
  }

  // Dados financeiros
  if (podeVerFinanceiro) {
    indices.dadosFinanceiros = currentIndex++;
    promises.push(buscarDadosFinanceirosConsolidados(usuarioId));
  } else {
    promises.push(Promise.resolve(DADOS_FINANCEIROS_PADRAO));
    indices.dadosFinanceiros = currentIndex++;
  }

  const results = await Promise.all(promises);

  return {
    role: 'user',
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
    },
    processos: results[indices.processos!] as ProcessoResumo,
    audiencias: results[indices.audiencias!] as AudienciasResumo,
    expedientes: results[indices.expedientes!] as ExpedientesResumo,
    produtividade: results[indices.produtividade!] as ProdutividadeResumo,
    proximasAudiencias: results[indices.proximasAudiencias!] as AudienciaProxima[],
    expedientesUrgentes: results[indices.expedientesUrgentes!] as ExpedienteUrgente[],
    dadosFinanceiros: results[indices.dadosFinanceiros!] as DadosFinanceirosConsolidados,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// ============================================================================
// Dashboard de Admin
// ============================================================================

/**
 * Obtém dados completos da dashboard para admin
 * @param usuarioId - ID do usuário admin para buscar nome e personalizar saudação
 */
export async function obterDashboardAdmin(
  usuarioId?: number
): Promise<DashboardAdminData> {
  // Buscar dados do usuário admin se fornecido
  const usuarioPromise = usuarioId
    ? buscarUsuario(usuarioId)
    : Promise.resolve({ id: 0, nome: 'Administrador' });

  // Buscar todos os dados em paralelo
  const [
    usuario,
    metricas,
    cargaUsuarios,
    statusCapturas,
    performanceAdvogados,
    proximasAudiencias,
    expedientesUrgentes,
    dadosFinanceiros,
  ] = await Promise.all([
    usuarioPromise,
    buscarMetricasEscritorio(),
    buscarCargaUsuarios(),
    buscarStatusCapturas(),
    buscarPerformanceAdvogados(),
    buscarProximasAudiencias(undefined, 5), // Todas as audiências
    buscarExpedientesUrgentes(undefined, 5), // Todos os expedientes
    buscarDadosFinanceirosConsolidados(), // Dados financeiros do escritório
  ]);

  return {
    role: 'admin',
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
    },
    metricas,
    cargaUsuarios,
    statusCapturas,
    performanceAdvogados,
    proximasAudiencias,
    expedientesUrgentes,
    dadosFinanceiros,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// ============================================================================
// Métricas Específicas (com cache)
// ============================================================================

/**
 * Obtém métricas do escritório com cache de 5 minutos.
 * Cache é compartilhado entre todos os admins (dados não são per-user).
 */
export const obterMetricasEscritorioCached = unstable_cache(
  async () => {
    const [metricas, cargaUsuarios, performanceAdvogados] = await Promise.all([
      buscarMetricasEscritorio(),
      buscarCargaUsuarios(),
      buscarPerformanceAdvogados(),
    ]);

    return {
      metricas,
      cargaUsuarios,
      performanceAdvogados,
      ultimaAtualizacao: new Date().toISOString(),
    };
  },
  ['dashboard-metricas-escritorio'],
  { revalidate: CACHE_TTL_DASHBOARD, tags: ['dashboard', 'dashboard-admin'] }
);

/**
 * Obtém apenas métricas do escritório (para admin)
 */
export async function obterMetricasEscritorio() {
  return obterMetricasEscritorioCached();
}

/**
 * Obtém apenas status das capturas (para admin)
 */
export async function obterStatusCapturas() {
  const capturas = await buscarStatusCapturas();

  return {
    capturas,
    ultimaAtualizacao: new Date().toISOString(),
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Determina se usuário é admin baseado no perfil
 * Esta verificação será feita no nível da action usando supabase.auth
 * Mantido aqui para referência futura se necessário
 */
export async function verificarAdmin(): Promise<boolean> {
  return false;
}
