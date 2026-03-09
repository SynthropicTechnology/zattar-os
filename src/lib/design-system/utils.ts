/**
 * Design System Utilities
 *
 * Este arquivo fornece utilitários de formatação e validação para o Design System.
 *
 * @ai-context Use estas funções para garantir formatação consistente em todo o sistema.
 */

// Re-exportar cn() de @/lib/utils para conveniência
export { cn } from '@/lib/utils';

// =============================================================================
// FORMATAÇÃO DE MOEDA
// =============================================================================

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 *
 * @param value - O valor a ser formatado
 * @param options - Opções adicionais de formatação
 * @returns String formatada como moeda
 *
 * @example
 * formatCurrency(1234.56) // "R$ 1.234,56"
 * formatCurrency(1234.56, { showSymbol: false }) // "1.234,56"
 */
export function formatCurrency(
  value: number | null | undefined,
  options: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return showSymbol ? 'R$ 0,00' : '0,00';
  }

  const formatter = new Intl.NumberFormat('pt-BR', {
    style: showSymbol ? 'currency' : 'decimal',
    currency: 'BRL',
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return formatter.format(value);
}

// =============================================================================
// FORMATAÇÃO DE DATA
// =============================================================================

/**
 * Formata uma data ISO para o formato brasileiro.
 *
 * @param dateISO - Data em formato ISO string ou Date
 * @param options - Opções de formatação
 * @returns String formatada ou placeholder
 *
 * @example
 * formatDate('2024-01-15') // "15/01/2024"
 * formatDate('2024-01-15T10:30:00', { includeTime: true }) // "15/01/2024 10:30"
 */
export function formatDate(
  dateISO: string | Date | null | undefined,
  options: {
    includeTime?: boolean;
    placeholder?: string;
  } = {}
): string {
  const { includeTime = false, placeholder = '-' } = options;

  if (!dateISO) {
    return placeholder;
  }

  try {
    // Para strings ISO date-only (YYYY-MM-DD), formatar direto sem Date (evita timezone shift)
    if (typeof dateISO === 'string' && !includeTime) {
      const isoMatch = dateISO.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
      if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return `${d}/${m}/${y}`;
      }
    }

    // Fallback para Date objects, formatos não-ISO, ou quando includeTime é true
    const date = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;

    if (isNaN(date.getTime())) {
      return placeholder;
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: includeTime ? undefined : 'UTC',
    };

    if (includeTime) {
      dateOptions.hour = '2-digit';
      dateOptions.minute = '2-digit';
    }

    return date.toLocaleString('pt-BR', dateOptions);
  } catch {
    return placeholder;
  }
}

/**
 * Formata uma data para exibição relativa (hoje, ontem, etc.).
 */
export function formatRelativeDate(dateISO: string | Date | null | undefined): string {
  if (!dateISO) return '-';

  try {
    const date = typeof dateISO === 'string' ? new Date(dateISO) : dateISO;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atras`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana(s) atras`;

    return formatDate(date);
  } catch {
    return '-';
  }
}

// =============================================================================
// FORMATAÇÃO DE DOCUMENTOS
// =============================================================================

/**
 * Formata um CPF para o padrão brasileiro.
 *
 * @param cpf - CPF com ou sem formatação
 * @returns CPF formatado (XXX.XXX.XXX-XX) ou placeholder
 *
 * @example
 * formatCPF('12345678901') // "123.456.789-01"
 * formatCPF('123.456.789-01') // "123.456.789-01"
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';

  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) {
    return cpf; // Retorna original se não for CPF válido
  }

  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ para o padrão brasileiro.
 *
 * @param cnpj - CNPJ com ou sem formatação
 * @returns CNPJ formatado (XX.XXX.XXX/XXXX-XX) ou placeholder
 *
 * @example
 * formatCNPJ('12345678000199') // "12.345.678/0001-99"
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '-';

  const digits = cnpj.replace(/\D/g, '');

  if (digits.length !== 14) {
    return cnpj; // Retorna original se não for CNPJ válido
  }

  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formata CPF ou CNPJ automaticamente baseado no tamanho.
 */
export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '-';

  const digits = doc.replace(/\D/g, '');

  if (digits.length === 11) {
    return formatCPF(digits);
  }

  if (digits.length === 14) {
    return formatCNPJ(digits);
  }

  return doc;
}

// =============================================================================
// FORMATAÇÃO DE TELEFONE
// =============================================================================

/**
 * Formata um telefone para o padrão brasileiro.
 *
 * @param phone - Telefone com ou sem formatação
 * @returns Telefone formatado
 *
 * @example
 * formatPhone('11999887766') // "(11) 99988-7766"
 * formatPhone('1133445566') // "(11) 3344-5566"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';

  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  if (digits.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

// =============================================================================
// FORMATAÇÃO DE PROCESSO
// =============================================================================

/**
 * Formata um número de processo judicial.
 * Padrão CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
 *
 * @param numero - Número do processo
 * @returns Número formatado ou original
 */
export function formatProcessNumber(numero: string | null | undefined): string {
  if (!numero) return '-';

  const digits = numero.replace(/\D/g, '');

  if (digits.length === 20) {
    return digits.replace(
      /(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/,
      '$1-$2.$3.$4.$5.$6'
    );
  }

  return numero;
}

// =============================================================================
// FORMATAÇÃO DE TEXTO
// =============================================================================

/**
 * Trunca um texto adicionando reticências.
 *
 * @param text - Texto a ser truncado
 * @param maxLength - Tamanho máximo
 * @returns Texto truncado ou original
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Converte texto para Title Case.
 */
export function toTitleCase(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Remove acentos de um texto.
 */
export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// =============================================================================
// VALIDAÇÃO
// =============================================================================

/**
 * Valida se um CPF é válido.
 */
export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');

  if (digits.length !== 11) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // Todos dígitos iguais

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  return remainder === parseInt(digits[10]);
}

/**
 * Valida se um CNPJ é válido.
 */
export function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '');

  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const firstDigit = remainder < 2 ? 0 : 11 - remainder;
  if (parseInt(digits[12]) !== firstDigit) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const secondDigit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(digits[13]) === secondDigit;
}

// =============================================================================
// CÁLCULOS
// =============================================================================

/**
 * Calcula a idade a partir de uma data de nascimento.
 */
export function calculateAge(birthDate: string | Date | null | undefined): number | null {
  if (!birthDate) return null;

  try {
    const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  } catch {
    return null;
  }
}

/**
 * Calcula dias até uma data (negativo se passou).
 */
export function daysUntil(targetDate: string | Date | null | undefined): number | null {
  if (!targetDate) return null;

  try {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

// =============================================================================
// EXPORTS AGRUPADOS
// =============================================================================

export const FORMAT = {
  currency: formatCurrency,
  date: formatDate,
  relativeDate: formatRelativeDate,
  cpf: formatCPF,
  cnpj: formatCNPJ,
  document: formatDocument,
  phone: formatPhone,
  processNumber: formatProcessNumber,
  truncate: truncateText,
  titleCase: toTitleCase,
  removeAccents,
} as const;

export const VALIDATE = {
  cpf: isValidCPF,
  cnpj: isValidCNPJ,
} as const;

export const CALC = {
  age: calculateAge,
  daysUntil,
} as const;
