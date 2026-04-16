export const TABLE_TEMPLATES = 'assinatura_digital_templates';
export const TABLE_FORMULARIOS = 'assinatura_digital_formularios';
export const TABLE_SEGMENTOS = 'segmentos'; // Tabela global compartilhada por todos os módulos
export const TABLE_SESSOES = 'assinatura_digital_assinaturas';

// Novo fluxo: PDF pronto + links públicos
export const TABLE_DOCUMENTOS = 'assinatura_digital_documentos';
export const TABLE_DOCUMENTO_ASSINANTES = 'assinatura_digital_documento_assinantes';
export const TABLE_DOCUMENTO_ANCORAS = 'assinatura_digital_documento_ancoras';

/**
 * Configuração de expiração de tokens públicos.
 *
 * Tokens são usados para acessar documentos via links públicos.
 * A expiração é uma medida de segurança para limitar o tempo de acesso.
 */
export const TOKEN_EXPIRATION = {
  /** Tempo padrão para assinatura (7 dias em ms) */
  DEFAULT_SIGNING_TTL_MS: 7 * 24 * 60 * 60 * 1000,

  /** Tempo máximo permitido para assinatura (30 dias em ms) */
  MAX_SIGNING_TTL_MS: 30 * 24 * 60 * 60 * 1000,

  /** Tempo após assinatura para permitir download (48 horas em ms) */
  POST_SIGNATURE_DOWNLOAD_TTL_MS: 48 * 60 * 60 * 1000,

  /** Tempo padrão para assinatura (7 dias em dias) */
  DEFAULT_SIGNING_TTL_DAYS: 7,

  /** Tempo máximo permitido para assinatura (30 dias em dias) */
  MAX_SIGNING_TTL_DAYS: 30,
} as const;