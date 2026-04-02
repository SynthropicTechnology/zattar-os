
import { StatusFolhaPagamento, Salario } from './domain';
import { MESES_LABELS } from './domain';
import { todayDateString, toDateString } from '@/lib/date-utils';

/**
 * Formata o período como string (ex: "Janeiro/2025")
 */
export const formatarPeriodo = (mes: number, ano: number): string => {
  return `${MESES_LABELS[mes] ?? mes}/${ano}`;
};

/**
 * Valida se um período é válido
 * Permite mês atual e próximo mês para planejamento
 */
export const validarPeriodoFolha = (mes: number, ano: number): { valido: boolean; erro?: string } => {
  if (mes < 1 || mes > 12) {
    return { valido: false, erro: 'Mês deve estar entre 1 e 12' };
  }
  if (ano < 2020) {
    return { valido: false, erro: 'Ano deve ser maior ou igual a 2020' };
  }

  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  // Calcular limite máximo (próximo mês)
  let mesLimite = mesAtual + 1;
  let anoLimite = anoAtual;
  if (mesLimite > 12) {
    mesLimite = 1;
    anoLimite++;
  }

  // Verificar se está além do próximo mês
  const periodoReferencia = ano * 12 + mes;
  const periodoLimite = anoLimite * 12 + mesLimite;

  if (periodoReferencia > periodoLimite) {
    return { valido: false, erro: 'Não é possível gerar folha para período muito distante no futuro. Permitido apenas até o próximo mês.' };
  }

  return { valido: true };
};

/**
 * Retorna o último dia do mês
 */
export const ultimoDiaDoMes = (mes: number, ano: number): string => {
  const data = new Date(ano, mes, 0); // Dia 0 do próximo mês = último dia do mês atual
  return toDateString(data);
};

/**
 * Retorna o primeiro dia do mês
 */
export const primeiroDiaDoMes = (mes: number, ano: number): string => {
  const data = new Date(ano, mes - 1, 1);
  return toDateString(data);
};

/**
 * Verifica se uma data está dentro de um período
 */
export const dataEstaNoPeriodo = (
  data: string,
  dataInicio: string,
  dataFim: string | null
): boolean => {
  const d = new Date(data);
  const inicio = new Date(dataInicio);

  if (d < inicio) {
    return false;
  }

  if (dataFim) {
    const fim = new Date(dataFim);
    return d <= fim;
  }

  return true; // Se não tem data fim, está vigente
};

/**
 * Calcula a duração em meses de uma vigência
 */
export const calcularDuracaoVigencia = (
  dataInicio: string,
  dataFim: string | null
): { meses: number; texto: string } => {
  const inicio = new Date(dataInicio);
  const fim = dataFim ? new Date(dataFim) : new Date();

  const diffTime = fim.getTime() - inicio.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const meses = Math.floor(diffDays / 30);

  if (meses < 1) {
    return { meses: 0, texto: 'Menos de 1 mês' };
  } else if (meses === 1) {
    return { meses: 1, texto: '1 mês' };
  } else if (meses < 12) {
    return { meses, texto: `${meses} meses` };
  } else {
    const anos = Math.floor(meses / 12);
    const mesesRestantes = meses % 12;
    if (mesesRestantes === 0) {
      return { meses, texto: anos === 1 ? '1 ano' : `${anos} anos` };
    }
    return {
      meses,
      texto: `${anos === 1 ? '1 ano' : `${anos} anos`} e ${mesesRestantes === 1 ? '1 mês' : `${mesesRestantes} meses`}`
    };
  }
};

/**
 * Retorna o salário vigente para um usuário em uma data de referência a partir de uma lista
 */
export const calcularSalarioVigente = (
  salarios: Salario[],
  usuarioId: number,
  dataReferencia: string = todayDateString()
): Salario | null => {
  const vigentes = salarios
    .filter((salario) => salario.usuarioId === usuarioId && salario.ativo)
    .filter((salario) =>
      dataEstaNoPeriodo(
        dataReferencia,
        salario.dataInicioVigencia,
        salario.dataFimVigencia
      )
    )
    .sort(
      (a, b) =>
        new Date(b.dataInicioVigencia).getTime() -
        new Date(a.dataInicioVigencia).getTime()
    );

  return vigentes[0] ?? null;
};

/**
 * Cores para badges de status da folha
 */
export const STATUS_FOLHA_CORES: Record<StatusFolhaPagamento, { bg: string; text: string; border: string }> = {
  rascunho: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  aprovada: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  paga: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  cancelada: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};
