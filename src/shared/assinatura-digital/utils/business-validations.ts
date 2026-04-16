/**
 * ASSINATURA DIGITAL - Business validations
 *
 * Validações de UX/negócio para o fluxo de assinatura.
 * Estas funções retornam objetos com `valid` + mensagens, para uso direto em UI.
 */

import { validateCPF as validateCPFBoolean, validateTelefone as validateTelefoneBoolean } from './validators';

export type ValidationResult = {
  valid: boolean;
  message?: string;
};

export type ValidationIssuesResult = {
  valid: boolean;
  issues: string[];
};

export const TEXT_LIMITS = {
  logradouro: { min: 2, max: 120 },
  bairro: { min: 2, max: 80 },
  cidade: { min: 2, max: 80 },
  complemento: { min: 0, max: 120 },
} as const;

export function validateTextLength(
  value: string,
  key: keyof typeof TEXT_LIMITS
): ValidationResult {
  const limits = TEXT_LIMITS[key];
  const trimmed = (value ?? '').trim();

  if (trimmed.length < limits.min) {
    return {
      valid: false,
      message: `mínimo de ${limits.min} caracteres`,
    };
  }

  if (trimmed.length > limits.max) {
    return {
      valid: false,
      message: `máximo de ${limits.max} caracteres`,
    };
  }

  return { valid: true };
}

export function validateCPFDigits(cpfDigits: string): ValidationResult {
  const cleaned = (cpfDigits ?? '').replace(/\D/g, '');

  if (cleaned.length !== 11) {
    return { valid: false, message: 'deve conter 11 dígitos' };
  }

  if (/^(\d)\1{10}$/.test(cleaned)) {
    return { valid: false, message: 'CPF inválido' };
  }

  if (!validateCPFBoolean(cleaned)) {
    return { valid: false, message: 'CPF inválido' };
  }

  return { valid: true };
}

export function validateBirthDate(dateString: string): ValidationResult {
  const raw = (dateString ?? '').trim();
  if (!raw) return { valid: false, message: 'data obrigatória' };

  // Extrair componentes da data sem criar Date objects (evita timezone shift)
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!isoMatch) return { valid: false, message: 'data inválida' };

  const [, yearStr, monthStr, dayStr] = isoMatch;
  const year = +yearStr;
  const month = +monthStr;
  const day = +dayStr;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, message: 'data inválida' };
  }

  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;
  const nowDay = now.getDate();

  // Comparar como inteiros para evitar timezone issues
  const dateNum = year * 10000 + month * 100 + day;
  const nowNum = nowYear * 10000 + nowMonth * 100 + nowDay;
  if (dateNum > nowNum) return { valid: false, message: 'não pode ser futura' };

  let age = nowYear - year;
  if (nowMonth < month || (nowMonth === month && nowDay < day)) age--;

  if (age < 0) return { valid: false, message: 'data inválida' };
  if (age > 120) return { valid: false, message: 'idade inválida' };

  return { valid: true };
}

export function validateBrazilianPhone(phoneDigits: string): ValidationResult {
  const cleaned = (phoneDigits ?? '').replace(/\D/g, '');
  if (!cleaned) return { valid: false, message: 'telefone obrigatório' };

  // Espera-se DDD + número (10 ou 11 dígitos).
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return { valid: false, message: 'deve conter 10 ou 11 dígitos (com DDD)' };
  }

  const ddd = Number(cleaned.slice(0, 2));
  if (Number.isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { valid: false, message: 'DDD inválido' };
  }

  // Se for celular (11 dígitos), 3º dígito costuma ser 9.
  if (cleaned.length === 11 && cleaned[2] !== '9') {
    return { valid: false, message: 'celular inválido (deve começar com 9 após o DDD)' };
  }

  // Reaproveita validador existente (aceita fixo/celular).
  if (!validateTelefoneBoolean(cleaned)) {
    return { valid: false, message: 'telefone inválido' };
  }

  return { valid: true };
}

export function validateEmail(email: string): ValidationResult {
  const value = (email ?? '').trim();
  if (!value) return { valid: false, message: 'email obrigatório' };

  // Regex simples e suficiente para UX (validação final pode ocorrer no backend).
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return ok ? { valid: true } : { valid: false, message: 'email inválido' };
}

export function validateCEP(cep: string): ValidationResult {
  const digits = (cep ?? '').replace(/\D/g, '');
  if (digits.length !== 8) return { valid: false, message: 'CEP deve conter 8 dígitos' };
  return { valid: true };
}

export function validateGeolocation(
  latitude: number,
  longitude: number,
  accuracy?: number | null,
  timestamp?: number | null
): ValidationIssuesResult {
  const issues: string[] = [];

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    issues.push('Latitude inválida');
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    issues.push('Longitude inválida');
  }

  if (accuracy !== undefined && accuracy !== null) {
    if (!Number.isFinite(accuracy) || accuracy <= 0) {
      issues.push('Acurácia inválida');
    } else if (accuracy > 500) {
      issues.push('Acurácia muito baixa (tente novamente em local aberto)');
    }
  }

  if (timestamp !== undefined && timestamp !== null) {
    const now = Date.now();
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      issues.push('Timestamp de geolocalização inválido');
    } else if (now - timestamp > 15 * 60 * 1000) {
      issues.push('Localização desatualizada (capture novamente)');
    }
  }

  return { valid: issues.length === 0, issues };
}

function isImageDataUrl(base64: string): boolean {
  return /^data:image\/(png|jpeg|jpg);base64,/.test(base64);
}

export function validatePhotoQuality(photoBase64: string): ValidationIssuesResult {
  const issues: string[] = [];
  const value = (photoBase64 ?? '').trim();

  if (!value) issues.push('Foto não encontrada');
  if (value && !isImageDataUrl(value)) issues.push('Formato de foto inválido');

  // Heurística simples: base64 muito curto costuma indicar captura falha/miniatura.
  if (value && value.length < 20_000) {
    issues.push('Foto com baixa qualidade. Tente tirar novamente em boa iluminação.');
  }

  return { valid: issues.length === 0, issues };
}

export function validateSignatureQuality(signatureBase64: string): ValidationIssuesResult {
  const issues: string[] = [];
  const value = (signatureBase64 ?? '').trim();

  if (!value) issues.push('Assinatura não encontrada');
  if (value && !isImageDataUrl(value)) issues.push('Formato de assinatura inválido');

  // Assinatura pode ser menor que foto, mas não deve ser “quase vazia”.
  if (value && value.length < 2_000) {
    issues.push('Assinatura muito curta. Assine novamente.');
  }

  return { valid: issues.length === 0, issues };
}

export function validateDataConsistency(input: {
  cpf: string;
  email: string;
  telefone: string;
  nomeCompleto: string;
}): ValidationIssuesResult {
  const issues: string[] = [];

  const cpf = (input.cpf ?? '').trim();
  const email = (input.email ?? '').trim();
  const telefone = (input.telefone ?? '').trim();
  const nomeCompleto = (input.nomeCompleto ?? '').trim();

  if (!nomeCompleto || nomeCompleto.length < 3) issues.push('Nome completo inválido');

  const cpfCheck = validateCPFDigits(cpf);
  if (!cpfCheck.valid) issues.push(cpfCheck.message ?? 'CPF inválido');

  const emailCheck = validateEmail(email);
  if (!emailCheck.valid) issues.push(emailCheck.message ?? 'Email inválido');

  const phoneCheck = validateBrazilianPhone(telefone);
  if (!phoneCheck.valid) issues.push(phoneCheck.message ?? 'Telefone inválido');

  return { valid: issues.length === 0, issues };
}


