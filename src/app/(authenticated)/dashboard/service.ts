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
  buscarProcessosDetalhados,
  buscarAudienciasResumo,
  buscarAudienciasDetalhadas,
  buscarExpedientesResumo,
  buscarExpedientesDetalhados,
  buscarProximasAudiencias,
  buscarExpedientesUrgentes,
  buscarProdutividadeUsuario,
  buscarDadosFinanceirosConsolidados,
  buscarFinanceiroDetalhado,
  buscarContratosResumo,
  buscarMetricasEscritorio,
  buscarCargaUsuarios,
  buscarStatusCapturas,
  buscarPerformanceAdvogados,
  buscarUsuario,
} from './repository';
import { checkPermission } from '@/lib/auth/authorization';
import type {
  DashboardUsuarioData,
  DashboardAdminData,
  ProcessoResumo,
  AudienciasResumo,
  ExpedientesResumo,
  ProdutividadeResumo,
  DadosFinanceirosConsolidados,
  ContratosResumo,
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
  const [usuario, podeVerProcessos, podeVerAudiencias, podeVerExpedientes, podeVerFinanceiro, podeVerContratos] =
    await Promise.all([
      buscarUsuario(usuarioId),
      checkPermission(usuarioId, 'acervo', 'listar'),
      checkPermission(usuarioId, 'audiencias', 'listar'),
      checkPermission(usuarioId, 'pendentes', 'listar'),
      checkPermission(usuarioId, 'lancamentos_financeiros', 'listar'),
      checkPermission(usuarioId, 'contratos', 'listar'),
    ]);

  // Buscar apenas dados permitidos com processo em lotes para evitar pool/connection exhaustion (fetch failed)
  const fetchTasks: (() => Promise<unknown>)[] = [];
  const indices: {
    processos?: number;
    audiencias?: number;
    expedientes?: number;
    proximasAudiencias?: number;
    expedientesUrgentes?: number;
    produtividade?: number;
    dadosFinanceiros?: number;
    processosDetalhados?: number;
    audienciasDetalhadas?: number;
    expedientesDetalhados?: number;
    financeiroDetalhado?: number;
    contratos?: number;
  } = {};

  let currentIndex = 0;

  // Processos
  if (podeVerProcessos) {
    indices.processos = currentIndex++;
    fetchTasks.push(() => buscarProcessosResumo(usuarioId));
  } else {
    fetchTasks.push(() => Promise.resolve(PROCESSOS_RESUMO_PADRAO));
    indices.processos = currentIndex++;
  }

  // Audiências
  if (podeVerAudiencias) {
    indices.audiencias = currentIndex++;
    fetchTasks.push(() => buscarAudienciasResumo(usuarioId));
  } else {
    fetchTasks.push(() => Promise.resolve(AUDIENCIAS_RESUMO_PADRAO));
    indices.audiencias = currentIndex++;
  }

  // Expedientes
  if (podeVerExpedientes) {
    indices.expedientes = currentIndex++;
    fetchTasks.push(() => buscarExpedientesResumo(usuarioId));
  } else {
    fetchTasks.push(() => Promise.resolve(EXPEDIENTES_RESUMO_PADRAO));
    indices.expedientes = currentIndex++;
  }

  // Próximas audiências (requer permissão de audiências)
  if (podeVerAudiencias) {
    indices.proximasAudiencias = currentIndex++;
    fetchTasks.push(() => buscarProximasAudiencias(usuarioId, 5));
  } else {
    fetchTasks.push(() => Promise.resolve([]));
    indices.proximasAudiencias = currentIndex++;
  }

  // Expedientes urgentes (requer permissão de expedientes)
  if (podeVerExpedientes) {
    indices.expedientesUrgentes = currentIndex++;
    fetchTasks.push(() => buscarExpedientesUrgentes(usuarioId, 5));
  } else {
    fetchTasks.push(() => Promise.resolve([]));
    indices.expedientesUrgentes = currentIndex++;
  }

  // Produtividade (requer permissão de processos)
  if (podeVerProcessos) {
    indices.produtividade = currentIndex++;
    fetchTasks.push(() => buscarProdutividadeUsuario(usuarioId));
  } else {
    fetchTasks.push(() => Promise.resolve(PRODUTIVIDADE_RESUMO_PADRAO));
    indices.produtividade = currentIndex++;
  }

  // Dados financeiros
  if (podeVerFinanceiro) {
    indices.dadosFinanceiros = currentIndex++;
    fetchTasks.push(() => buscarDadosFinanceirosConsolidados(usuarioId));
  } else {
    fetchTasks.push(() => Promise.resolve(DADOS_FINANCEIROS_PADRAO));
    indices.dadosFinanceiros = currentIndex++;
  }

  // Métricas detalhadas para widgets secundários
  if (podeVerProcessos) {
    indices.processosDetalhados = currentIndex++;
    fetchTasks.push(() => buscarProcessosDetalhados(usuarioId));
  }

  if (podeVerAudiencias) {
    indices.audienciasDetalhadas = currentIndex++;
    fetchTasks.push(() => buscarAudienciasDetalhadas(usuarioId));
  }

  if (podeVerExpedientes) {
    indices.expedientesDetalhados = currentIndex++;
    fetchTasks.push(() => buscarExpedientesDetalhados(usuarioId));
  }

  if (podeVerFinanceiro) {
    indices.financeiroDetalhado = currentIndex++;
    fetchTasks.push(() => buscarFinanceiroDetalhado(usuarioId));
  }

  if (podeVerContratos) {
    indices.contratos = currentIndex++;
    fetchTasks.push(() => buscarContratosResumo());
  }

  // Processar em lotes (4 tasks concorrentes) para evitar `fetch failed`
  const results: unknown[] = [];
  const BATCH_SIZE = 4;
  for (let i = 0; i < fetchTasks.length; i += BATCH_SIZE) {
    const batch = fetchTasks.slice(i, i + BATCH_SIZE).map(fn => fn());
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
  }

  // Mesclar dados detalhados nos resumos
  const processos = results[indices.processos!] as ProcessoResumo;
  if (indices.processosDetalhados !== undefined) {
    const det = results[indices.processosDetalhados] as {
      porStatus: ProcessoResumo['porStatus'];
      porSegmento: ProcessoResumo['porSegmento'];
      aging: ProcessoResumo['aging'];
      tendenciaMensal: ProcessoResumo['tendenciaMensal'];
    };
    processos.porStatus = det.porStatus;
    processos.porSegmento = det.porSegmento;
    processos.aging = det.aging;
    processos.tendenciaMensal = det.tendenciaMensal;
  }

  const audiencias = results[indices.audiencias!] as AudienciasResumo;
  if (indices.audienciasDetalhadas !== undefined) {
    const det = results[indices.audienciasDetalhadas] as {
      porModalidade: AudienciasResumo['porModalidade'];
      statusMensal: AudienciasResumo['statusMensal'];
      porTipo: AudienciasResumo['porTipo'];
      trendMensal: AudienciasResumo['trendMensal'];
      heatmapSemanal: AudienciasResumo['heatmapSemanal'];
      duracaoMedia: AudienciasResumo['duracaoMedia'];
      taxaComparecimento: AudienciasResumo['taxaComparecimento'];
    };
    audiencias.porModalidade = det.porModalidade;
    audiencias.statusMensal = det.statusMensal;
    audiencias.porTipo = det.porTipo;
    audiencias.trendMensal = det.trendMensal;
    audiencias.heatmapSemanal = det.heatmapSemanal;
    audiencias.duracaoMedia = det.duracaoMedia;
    audiencias.taxaComparecimento = det.taxaComparecimento;
  }

  const expedientes = results[indices.expedientes!] as ExpedientesResumo;
  if (indices.expedientesDetalhados !== undefined) {
    const det = results[indices.expedientesDetalhados] as {
      porOrigem: ExpedientesResumo['porOrigem'];
      resultadoDecisao: ExpedientesResumo['resultadoDecisao'];
      volumeSemanal: ExpedientesResumo['volumeSemanal'];
      prazoMedio: ExpedientesResumo['prazoMedio'];
      calendarioPrazos: ExpedientesResumo['calendarioPrazos'];
      tempoRespostaMedio: ExpedientesResumo['tempoRespostaMedio'];
      taxaCumprimento: ExpedientesResumo['taxaCumprimento'];
      backlogAtual: ExpedientesResumo['backlogAtual'];
    };
    expedientes.porOrigem = det.porOrigem;
    expedientes.resultadoDecisao = det.resultadoDecisao;
    expedientes.volumeSemanal = det.volumeSemanal;
    expedientes.prazoMedio = det.prazoMedio;
    expedientes.calendarioPrazos = det.calendarioPrazos;
    expedientes.tempoRespostaMedio = det.tempoRespostaMedio;
    expedientes.taxaCumprimento = det.taxaCumprimento;
    expedientes.backlogAtual = det.backlogAtual;
  }

  const dadosFinanceiros = results[indices.dadosFinanceiros!] as DadosFinanceirosConsolidados;
  if (indices.financeiroDetalhado !== undefined) {
    const det = results[indices.financeiroDetalhado] as {
      saldoTrend: DadosFinanceirosConsolidados['saldoTrend'];
      contasReceberAging: DadosFinanceirosConsolidados['contasReceberAging'];
      contasPagarAging: DadosFinanceirosConsolidados['contasPagarAging'];
      despesasPorCategoria: DadosFinanceirosConsolidados['despesasPorCategoria'];
      dreComparativo: DadosFinanceirosConsolidados['dreComparativo'];
      fluxoCaixaMensal: DadosFinanceirosConsolidados['fluxoCaixaMensal'];
    };
    dadosFinanceiros.saldoTrend = det.saldoTrend;
    dadosFinanceiros.contasReceberAging = det.contasReceberAging;
    dadosFinanceiros.contasPagarAging = det.contasPagarAging;
    dadosFinanceiros.despesasPorCategoria = det.despesasPorCategoria;
    dadosFinanceiros.dreComparativo = det.dreComparativo;
    dadosFinanceiros.fluxoCaixaMensal = det.fluxoCaixaMensal;
  }

  const contratos = indices.contratos !== undefined
    ? results[indices.contratos] as ContratosResumo
    : undefined;

  return {
    role: 'user',
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
    },
    processos,
    audiencias,
    expedientes,
    produtividade: results[indices.produtividade!] as ProdutividadeResumo,
    proximasAudiencias: results[indices.proximasAudiencias!] as AudienciaProxima[],
    expedientesUrgentes: results[indices.expedientesUrgentes!] as ExpedienteUrgente[],
    dadosFinanceiros,
    contratos,
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

  // Separar em lotes (batches) menores para não esgotar as conexões 
  // do node/fetch (Evita "TypeError: fetch failed" e pool starvation)

  // 1. Dados básicos
  const usuario = await usuarioPromise;

  // 2. Resumos 1
  const [metricas, cargaUsuarios, statusCapturas, contratos] = await Promise.all([
    buscarMetricasEscritorio(),
    buscarCargaUsuarios(),
    buscarStatusCapturas(),
    buscarContratosResumo(),
  ]);

  // 3. Resumos 2
  const [performanceAdvogados, proximasAudiencias, expedientesUrgentes] = await Promise.all([
    buscarPerformanceAdvogados(),
    buscarProximasAudiencias(undefined, 5),
    buscarExpedientesUrgentes(undefined, 5),
  ]);

  // 4. Detalhados pesados
  const [processosDetalhados, audienciasDetalhadas, expedientesDetalhados] = await Promise.all([
    buscarProcessosDetalhados(),
    buscarAudienciasDetalhadas(),
    buscarExpedientesDetalhados(),
  ]);

  // 5. Financeiro
  const [dadosFinanceiros, financeiroDetalhado] = await Promise.all([
    buscarDadosFinanceirosConsolidados(),
    buscarFinanceiroDetalhado(),
  ]);

  // Mesclar dados detalhados no financeiro
  dadosFinanceiros.saldoTrend = financeiroDetalhado.saldoTrend;
  dadosFinanceiros.contasReceberAging = financeiroDetalhado.contasReceberAging;
  dadosFinanceiros.contasPagarAging = financeiroDetalhado.contasPagarAging;
  dadosFinanceiros.despesasPorCategoria = financeiroDetalhado.despesasPorCategoria;
  dadosFinanceiros.dreComparativo = financeiroDetalhado.dreComparativo;
  dadosFinanceiros.fluxoCaixaMensal = financeiroDetalhado.fluxoCaixaMensal;

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
    contratos,
    // Métricas detalhadas disponíveis via metricas + campos extras nos tipos
    _processosDetalhados: processosDetalhados,
    _audienciasDetalhadas: audienciasDetalhadas,
    _expedientesDetalhados: expedientesDetalhados,
    ultimaAtualizacao: new Date().toISOString(),
  } as DashboardAdminData;
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

// ============================================================================
// Lembretes Service (re-export)
// ============================================================================

export {
  listarLembretes,
  obterLembrete,
  criarNovoLembrete,
  atualizarLembreteExistente,
  alterarStatusLembrete,
  removerLembrete,
  obterContagemLembretesPendentes,
  obterLembretesVencidos,
} from './services/lembretes-service';
