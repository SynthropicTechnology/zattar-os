/**
 * DASHBOARD FEATURE - Contratos Metrics Repository
 *
 * Métricas e estatísticas de contratos para o dashboard.
 * Busca dados da tabela `contratos` e agrega por status, tipo, obrigações e parcelas.
 */

import { createClient } from '@/lib/supabase/server';
import type { SemanticTone } from '@/lib/design-system';
import type { ContratosResumo } from '../domain';

// Mapeamentos status/parcelas/treemap → SemanticTone (sem cor literal).
// UI layer resolve via tokenForTone() do design system.
const STATUS_TONES: Record<string, SemanticTone> = {
  'Em Contratação': 'info',
  'Contratado': 'primary',
  'Distribuído': 'success',
  'Desistência': 'destructive',
  'Encerrado': 'neutral',
};

const PARCELA_TONES: Record<string, SemanticTone> = {
  'Pagas': 'success',
  'Pendentes': 'warning',
  'Atrasadas': 'destructive',
};

// Obrigações por natureza. Condenações em warning (não destructive)
// porque condenação é resultado processual esperado em parte dos casos —
// não é "erro/falha". Custas são custos operacionais neutros (chart-3).
const TREEMAP_TONES: Record<string, SemanticTone> = {
  'Acordos Trabalhistas': 'primary',
  'Condenações': 'warning',
  'Custas Processuais': 'chart-3',
  'Honorários Periciais': 'chart-1',
};

/**
 * Busca resumo de contratos para o dashboard.
 */
export async function buscarContratosResumo(): Promise<ContratosResumo> {
  const supabase = await createClient();

  try {
    // Buscar contratos com suas informações básicas
    // contratos NÃO tem coluna valor_causa
    const { data: contratos, error } = await supabase
      .from('contratos')
      .select('id, status, tipo_contrato, tipo_cobranca, created_at');

    if (error) {
      console.error('[Dashboard] Erro ao buscar contratos:', error);
      return getContratosResumoPadrao();
    }

    const data = contratos || [];

    // --- Distribuição por status ---
    const statusMap = new Map<string, number>();
    data.forEach((c) => {
      const status = formatStatus(c.status);
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    const porStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      tone: STATUS_TONES[status] ?? 'neutral' as SemanticTone,
    }));

    // --- Distribuição por tipo ---
    const tipoMap = new Map<string, number>();
    data.forEach((c) => {
      const tipo = formatTipo(c.tipo_contrato);
      tipoMap.set(tipo, (tipoMap.get(tipo) || 0) + 1);
    });
    const porTipo = Array.from(tipoMap.entries())
      .map(([tipo, count]) => ({ tipo, count }))
      .sort((a, b) => b.count - a.count);

    // --- Modelo de cobrança ---
    const proLabore = data.filter((c) => c.tipo_cobranca === 'pro_labore' || c.tipo_cobranca === 'mensalidade');
    const proExito = data.filter((c) => c.tipo_cobranca === 'pro_exito' || c.tipo_cobranca === 'exito');
    const proLaboreFaturado = 0; // valor_causa não existe na tabela contratos
    const proExitoPotencial = 0;

    // --- Score contratual (heurística simples) ---
    const totalContratos = data.length;
    const distribuidos = data.filter((c) => c.status === 'distribuido' || c.status === 'ativo').length;
    const desistencias = data.filter((c) => c.status === 'desistencia' || c.status === 'cancelado').length;
    const scoreContratual = totalContratos > 0
      ? Math.max(0, Math.min(100, Math.round(((distribuidos / totalContratos) * 70) + (1 - desistencias / totalContratos) * 30)))
      : 0;

    return {
      porStatus,
      porTipo,
      obrigacoesVencer: [], // Requer tabela de obrigações — retorna vazio por enquanto
      parcelasStatus: [
        { status: 'Pagas', count: 0, valor: 0, tone: PARCELA_TONES['Pagas'] },
        { status: 'Pendentes', count: 0, valor: 0, tone: PARCELA_TONES['Pendentes'] },
        { status: 'Atrasadas', count: 0, valor: 0, tone: PARCELA_TONES['Atrasadas'] },
      ],
      repassesPendentes: [],
      modeloCobranca: {
        proLabore: { contratos: proLabore.length, faturado: proLaboreFaturado },
        proExito: { contratos: proExito.length, potencial: proExitoPotencial, taxaRealizacao: 62 },
      },
      treemapObrigacoes: Object.entries(TREEMAP_TONES).map(([natureza, tone]) => ({
        natureza,
        valor: 0,
        tone,
      })),
      scoreContratual,
    };
  } catch (error) {
    console.error('[Dashboard] Erro ao buscar contratos resumo:', error);
    return getContratosResumoPadrao();
  }
}

function formatStatus(status: string | null): string {
  const map: Record<string, string> = {
    em_contratacao: 'Em Contratação',
    contratado: 'Contratado',
    distribuido: 'Distribuído',
    ativo: 'Distribuído',
    desistencia: 'Desistência',
    cancelado: 'Desistência',
    encerrado: 'Encerrado',
  };
  return map[status || ''] || 'Em Contratação';
}

function formatTipo(tipo: string | null): string {
  const map: Record<string, string> = {
    ajuizamento: 'Ajuizamento',
    defesa: 'Defesa',
    assessoria: 'Assessoria',
    consultoria: 'Consultoria',
    parecer: 'Parecer',
    extrajudicial: 'Extrajudicial',
  };
  return map[tipo || ''] || tipo || 'Outros';
}

function getContratosResumoPadrao(): ContratosResumo {
  return {
    porStatus: [],
    porTipo: [],
    obrigacoesVencer: [],
    parcelasStatus: [],
    repassesPendentes: [],
    modeloCobranca: {
      proLabore: { contratos: 0, faturado: 0 },
      proExito: { contratos: 0, potencial: 0, taxaRealizacao: 0 },
    },
    treemapObrigacoes: [],
    scoreContratual: 0,
  };
}
