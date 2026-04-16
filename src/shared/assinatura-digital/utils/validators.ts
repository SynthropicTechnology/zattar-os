/**
 * ASSINATURA DIGITAL - Validadores
 *
 * Funções de validação para documentos brasileiros.
 */

// =============================================================================
// CPF
// =============================================================================

/**
 * Valida CPF brasileiro com verificação dos dígitos verificadores
 */
export const validateCPF = (cpf: string): boolean => {
  // Remove formatação
  const cleaned = cpf.replace(/\D/g, '');

  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;

  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

  return true;
};

// =============================================================================
// CNPJ
// =============================================================================

/**
 * Valida CNPJ brasileiro com verificação dos dígitos verificadores
 */
export const validateCNPJ = (cnpj: string): boolean => {
  // Remove formatação
  const cleaned = cnpj.replace(/\D/g, '');

  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let length = cleaned.length - 2;
  let numbers = cleaned.substring(0, length);
  const digits = cleaned.substring(length);
  let sum = 0;
  let pos = length - 7;

  // Primeiro dígito verificador
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  // Segundo dígito verificador
  length = length + 1;
  numbers = cleaned.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

// =============================================================================
// TELEFONE
// =============================================================================

/**
 * Valida telefone brasileiro (fixo ou celular)
 */
export const validateTelefone = (telefone: string): boolean => {
  // Remove formatação
  const cleaned = telefone.replace(/\D/g, '');

  // Verifica se tem 10 ou 11 dígitos
  if (cleaned.length !== 10 && cleaned.length !== 11) return false;

  // Extrai DDD
  const ddd = parseInt(cleaned.substring(0, 2));

  // DDDs válidos no Brasil (11 a 99)
  if (ddd < 11 || ddd > 99) return false;

  // Para celular (11 dígitos), deve começar com 9 após o DDD
  if (cleaned.length === 11) {
    const firstDigit = parseInt(cleaned.charAt(2));
    if (firstDigit !== 9) return false;
  }

  return true;
};

// =============================================================================
// CEP
// =============================================================================

/**
 * Valida formato de CEP brasileiro (8 dígitos)
 */
export const validateCEP = (cep: string): boolean => {
  const cleaned = cep.replace(/\D/g, '');
  return cleaned.length === 8;
};

// =============================================================================
// EMAIL
// =============================================================================

/**
 * Valida formato básico de e-mail
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// =============================================================================
// CPF OU CNPJ
// =============================================================================

/**
 * Valida CPF ou CNPJ automaticamente baseado no tamanho
 */
export const validateCpfCnpj = (value: string): boolean => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return validateCPF(cleaned);
  }
  if (cleaned.length === 14) {
    return validateCNPJ(cleaned);
  }
  return false;
};
