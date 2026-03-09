/**
 * Sinesys - Formatadores de Dados Brasileiros
 *
 * ⚠️ Legado/Compat:
 * - O "single source of truth" de formatação é o Design System em `@/lib/design-system`.
 * - Mantemos este módulo como compatibilidade (assinaturas/semântica antigas),
 *   para não quebrar telas que esperam `''` ao invés de `'-'` em campos vazios.
 *
 * REGRA PARA AGENTES:
 * SEMPRE importe e use essas funções ao exibir dados para o usuário.
 * NUNCA crie lógica de formatação inline nos componentes.
 */

import {
  formatCurrency as dsFormatCurrency,
  formatCPF as dsFormatCPF,
  formatCNPJ as dsFormatCNPJ,
  formatPhone as dsFormatPhone,
} from '@/lib/design-system';

/**
 * Formata um número para o padrão monetário brasileiro (BRL).
 * @param value O valor numérico a ser formatado.
 * @returns A string formatada, ex: "R$ 1.234,56".
 */
export const formatCurrency = (value: number | null | undefined): string => {
  // Intl pode usar NBSP entre símbolo e valor (ex: "R$\u00A00,01").
  // Normalizamos para espaço comum para manter consistência em testes/logs.
  return dsFormatCurrency(value).replace(/\u00A0/g, " ");
};

/**
 * Formata uma string de CPF (11 dígitos) para o padrão com pontos e traço.
 * @param cpf A string do CPF (apenas dígitos).
 * @returns O CPF formatado (000.000.000-00) ou a string original se inválido.
 */
export const formatCPF = (cpf: string | null | undefined): string => {
  if (!cpf) return '';
  if (!/^\d+$/.test(cpf)) return '';
  if (cpf.length !== 11) return '';
  const out = dsFormatCPF(cpf);
  return out === '-' ? '' : out;
};

/**
 * Formata uma string de CNPJ (14 dígitos) para o padrão com pontos, barra e traço.
 * @param cnpj A string do CNPJ (apenas dígitos).
 * @returns O CNPJ formatado (00.000.000/0000-00) ou a string original se inválido.
 */
export const formatCNPJ = (cnpj: string | null | undefined): string => {
  if (!cnpj) return '';
  if (!/^\d+$/.test(cnpj)) return '';
  if (cnpj.length !== 14) return '';
  const out = dsFormatCNPJ(cnpj);
  return out === '-' ? '' : out;
};

/**
 * Formata um objeto Date ou uma string de data para o padrão brasileiro (dd/MM/yyyy).
 * @param date O objeto Date ou a string de data.
 * @returns A data formatada ou uma string vazia se a data for inválida.
 */
export const formatDate = (
  date: Date | string | null | undefined
): string => {
  if (!date) return '';
  try {
    // Para strings no formato ISO date-only (YYYY-MM-DD), formatar diretamente
    // sem criar Date objects - evita problemas de timezone.
    if (typeof date === 'string') {
      const isoMatch = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
      if (isoMatch) {
        const [, y, m, d] = isoMatch;
        const month = +m;
        const day = +d;
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${d}/${m}/${y}`;
        }
      }
    }

    // Fallback para Date objects ou formatos nao-ISO
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(dateObj);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata uma string de telefone (10 ou 11 dígitos) para o padrão brasileiro.
 * @param phone A string de telefone (apenas dígitos).
 * @returns O telefone formatado ((00) 0000-0000 ou (00) 00000-0000) ou o original.
 */
export const formatPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  // Este formatador espera "apenas dígitos" (comportamento legado).
  // Se vier mascarado (ex: "(11) 99999-9999"), consideramos inválido.
  if (!/^\d+$/.test(phone)) return '';
  if (phone.length < 10 || phone.length > 11) return '';
  const out = dsFormatPhone(phone);
  return out === '-' ? '' : out;
};
