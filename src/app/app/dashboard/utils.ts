/**
 * Utilitários para Dashboard
 * Funções de formatação e cálculos auxiliares
 */

// ============================================================================
// Formatação de Datas
// ============================================================================

/**
 * Formata data relativa (Hoje, Amanhã, etc.)
 */
export function formatarDataRelativa(data: string | Date): string {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataObj = typeof data === 'string' ? new Date(data) : data;
  dataObj.setHours(0, 0, 0, 0);

  const diff = Math.floor((dataObj.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Ontem';
  if (diff > 1 && diff <= 7) return `Em ${diff} dias`;
  if (diff < -1 && diff >= -7) return `Há ${Math.abs(diff)} dias`;

  return dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data e hora para exibição
 */
export function formatarDataHora(data: string | Date, hora?: string | null): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;

  const dataStr = dataObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (hora) {
    return `${dataStr} às ${hora}`;
  }

  return dataStr;
}

/**
 * Formata apenas a hora
 */
export function formatarHora(hora: string | null): string {
  if (!hora) return '--:--';

  // Se já está no formato HH:mm
  if (/^\d{2}:\d{2}$/.test(hora)) return hora;

  // Se está no formato HH:mm:ss
  if (/^\d{2}:\d{2}:\d{2}$/.test(hora)) return hora.slice(0, 5);

  return hora;
}

// ============================================================================
// Formatação de Valores Monetários
// ============================================================================

/**
 * Formata valor em moeda brasileira
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

/**
 * Formata valor abreviado (K, M, B)
 */
export function formatarValorAbreviado(valor: number): string {
  if (Math.abs(valor) >= 1e9) {
    return `${(valor / 1e9).toFixed(1)}B`;
  }
  if (Math.abs(valor) >= 1e6) {
    return `${(valor / 1e6).toFixed(1)}M`;
  }
  if (Math.abs(valor) >= 1e3) {
    return `${(valor / 1e3).toFixed(1)}K`;
  }
  return valor.toFixed(0);
}

// ============================================================================
// Cálculos
// ============================================================================

/**
 * Calcula percentual
 */
export function calcularPercentual(valor: number, total: number): number {
  return total > 0 ? Math.round((valor / total) * 100) : 0;
}

/**
 * Calcula variação percentual entre dois valores
 */
export function calcularVariacao(atual: number, anterior: number): number {
  if (anterior === 0) return atual > 0 ? 100 : 0;
  return Math.round(((atual - anterior) / anterior) * 100);
}

/**
 * Retorna direção da variação
 */
export function getDirecaoVariacao(variacao: number): 'up' | 'down' | 'neutral' {
  if (variacao > 0) return 'up';
  if (variacao < 0) return 'down';
  return 'neutral';
}

// ============================================================================
// Status e Urgência
// ============================================================================

/**
 * Determina nível de urgência baseado em dias restantes
 */
export function getNivelUrgencia(diasRestantes: number): 'critico' | 'alto' | 'medio' | 'baixo' {
  if (diasRestantes < 0) return 'critico';
  if (diasRestantes === 0) return 'alto';
  if (diasRestantes <= 3) return 'medio';
  return 'baixo';
}

/**
 * Retorna cor CSS baseada no nível de urgência
 */
export function getCorUrgencia(diasRestantes: number): string {
  const nivel = getNivelUrgencia(diasRestantes);
  switch (nivel) {
    case 'critico': return 'text-destructive bg-destructive/10';
    case 'alto': return 'text-warning bg-warning/10';
    case 'medio': return 'text-warning bg-warning/10';
    default: return 'text-success bg-success/10';
  }
}

/**
 * Formata texto de dias restantes
 */
export function formatarDiasRestantes(dias: number): string {
  if (dias < 0) return `${Math.abs(dias)} dia(s) atrás`;
  if (dias === 0) return 'Hoje';
  if (dias === 1) return 'Amanhã';
  return `Em ${dias} dias`;
}

// ============================================================================
// Formatação de Status
// ============================================================================

/**
 * Formata status de expediente
 */
export function formatarStatusExpediente(status: string): string {
  const statusMap: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    vencido: 'Vencido',
  };
  return statusMap[status] || status;
}

/**
 * Formata status de captura
 */
export function formatarStatusCaptura(status: string): string {
  const statusMap: Record<string, string> = {
    sucesso: 'Sucesso',
    erro: 'Erro',
    pendente: 'Pendente',
    executando: 'Executando',
  };
  return statusMap[status] || status;
}

// ============================================================================
// Formatação de TRT
// ============================================================================

/**
 * Formata número do TRT para exibição
 */
export function formatarTRT(trt: string | null): string {
  if (!trt) return 'N/A';
  return trt.replace('TRT', 'TRT ').trim();
}

/**
 * Formata grau do processo para exibição
 */
export function formatarGrau(grau: string): string {
  const grauMap: Record<string, string> = {
    primeiro_grau: '1º Grau',
    segundo_grau: '2º Grau',
  };
  return grauMap[grau] || grau;
}

// ============================================================================
// Agregação de Dados
// ============================================================================

/**
 * Agrupa array por chave
 */
export function agruparPor<T, K extends keyof T>(
  array: T[],
  chave: K
): Map<T[K], T[]> {
  const map = new Map<T[K], T[]>();

  array.forEach((item) => {
    const valor = item[chave];
    const grupo = map.get(valor) || [];
    grupo.push(item);
    map.set(valor, grupo);
  });

  return map;
}

/**
 * Conta ocorrências de valores
 */
export function contarOcorrencias<T, K extends keyof T>(
  array: T[],
  chave: K
): { valor: T[K]; count: number }[] {
  const map = new Map<T[K], number>();

  array.forEach((item) => {
    const valor = item[chave];
    map.set(valor, (map.get(valor) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([valor, count]) => ({ valor, count }))
    .sort((a, b) => b.count - a.count);
}
