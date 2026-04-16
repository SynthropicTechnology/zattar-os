/**
 * ASSINATURA DIGITAL - Formatadores
 *
 * Funções de formatação e parsing para documentos brasileiros.
 */

// =============================================================================
// CPF
// =============================================================================

/**
 * Formata CPF para exibição: 000.000.000-00
 */
export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return cleaned;
};

/**
 * Remove formatação do CPF, mantendo apenas números
 */
export const parseCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

// =============================================================================
// CNPJ
// =============================================================================

/**
 * Formata CNPJ para exibição: 00.000.000/0000-00
 */
export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length === 14) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cleaned;
};

/**
 * Remove formatação do CNPJ, mantendo apenas números
 */
export const parseCNPJ = (cnpj: string): string => {
  return cnpj.replace(/\D/g, '');
};

// =============================================================================
// CPF/CNPJ AUTO
// =============================================================================

/**
 * Formata CPF ou CNPJ automaticamente baseado no tamanho
 */
export const formatCpfCnpj = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    return formatCPF(cleaned);
  }
  return formatCNPJ(cleaned);
};

/**
 * Remove formatação de CPF ou CNPJ
 */
export const parseCpfCnpj = (value: string): string => {
  return value.replace(/\D/g, '');
};

// =============================================================================
// TELEFONE
// =============================================================================

/**
 * Formata telefone brasileiro: (00) 90000-0000 ou (00) 0000-0000
 */
export const formatTelefone = (telefone: string): string => {
  const cleaned = telefone.replace(/\D/g, '');

  // Celular (11 dígitos): (00) 90000-0000
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  // Fixo (10 dígitos): (00) 0000-0000
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return cleaned;
};

/**
 * Remove formatação do telefone, mantendo apenas números
 */
export const parseTelefone = (telefone: string): string => {
  return telefone.replace(/\D/g, '');
};

/**
 * Formata celular com código do país: +5511900000000
 */
export const formatCelularWithCountryCode = (celular: string): string => {
  const cleaned = parseTelefone(celular);
  if (cleaned.length === 11) {
    return `+55${cleaned}`;
  }
  return cleaned;
};

// =============================================================================
// CEP
// =============================================================================

/**
 * Formata CEP: 00000-000
 */
export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
  }
  return cleaned;
};

/**
 * Remove formatação do CEP, mantendo apenas números
 */
export const parseCEP = (cep: string): string => {
  return cep.replace(/\D/g, '');
};

// =============================================================================
// DATA
// =============================================================================

/**
 * Formata data ISO para exibição brasileira: DD/MM/YYYY
 */
export const formatData = (data: string | Date): string => {
  if (!data) return '';

  // Para strings ISO date-only, formatar direto sem criar Date (evita timezone shift)
  if (typeof data === 'string') {
    const isoMatch = data.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}/${m}/${y}`;
    }
  }

  // Fallback para Date objects ou formatos não-ISO
  const date = typeof data === 'string' ? new Date(data) : data;
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
};

/**
 * Formata data e hora: DD/MM/YYYY às HH:MM
 */
export const formatDataHora = (data: string | Date): string => {
  const date = typeof data === 'string' ? new Date(data) : data;
  return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Converte data BR (DD/MM/YYYY) para ISO (YYYY-MM-DD)
 */
export const parseDataBR = (dataBR: string): string => {
  const parts = dataBR.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dataBR;
};
