/**
 * ASSINATURA DIGITAL - Token Expiration Utilities
 *
 * Funções para gerenciar expiração de tokens públicos de assinatura.
 */

import { TOKEN_EXPIRATION } from "../services/constants";

/**
 * Resultado da verificação de expiração do token.
 */
export interface TokenExpirationCheck {
  /** Token está expirado? */
  expired: boolean;
  /** Mensagem de erro (se expirado) */
  error?: string;
  /** Data de expiração do token */
  expiresAt?: Date;
  /** Tempo restante em ms (se não expirado) */
  remainingMs?: number;
}

/**
 * Verifica se um token está expirado.
 *
 * @param expiresAt - Data de expiração do token (string ISO ou Date)
 * @returns Resultado da verificação
 */
export function checkTokenExpiration(
  expiresAt: string | Date | null | undefined
): TokenExpirationCheck {
  // Token sem expiração definida = não expira (retrocompatibilidade)
  if (!expiresAt) {
    return { expired: false };
  }

  const expirationDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  const now = new Date();

  if (expirationDate <= now) {
    return {
      expired: true,
      error: "Este link de assinatura expirou. Solicite um novo link ao remetente.",
      expiresAt: expirationDate,
    };
  }

  return {
    expired: false,
    expiresAt: expirationDate,
    remainingMs: expirationDate.getTime() - now.getTime(),
  };
}

/**
 * Calcula a data de expiração para um novo token.
 *
 * @param ttlDays - Tempo de vida em dias (default: 7)
 * @returns Data de expiração (ISO string)
 */
export function calculateTokenExpiration(ttlDays?: number): string {
  const days = ttlDays ?? TOKEN_EXPIRATION.DEFAULT_SIGNING_TTL_DAYS;

  // Limitar ao máximo permitido
  const effectiveDays = Math.min(days, TOKEN_EXPIRATION.MAX_SIGNING_TTL_DAYS);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + effectiveDays);

  return expiresAt.toISOString();
}

/**
 * Calcula nova data de expiração após assinatura (para download).
 *
 * Após o assinante concluir, o token permanece válido por 48h para download.
 *
 * @returns Nova data de expiração (ISO string)
 */
export function calculatePostSignatureExpiration(): string {
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + TOKEN_EXPIRATION.POST_SIGNATURE_DOWNLOAD_TTL_MS);

  return expiresAt.toISOString();
}

/**
 * Formata o tempo restante do token para exibição.
 *
 * @param remainingMs - Tempo restante em ms
 * @returns String formatada (ex: "2 dias", "5 horas", "30 minutos")
 */
export function formatRemainingTime(remainingMs: number): string {
  const minutes = Math.floor(remainingMs / (1000 * 60));
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

  if (days > 0) {
    return days === 1 ? "1 dia" : `${days} dias`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hora" : `${hours} horas`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minuto" : `${minutes} minutos`;
  }

  return "menos de 1 minuto";
}
