/**
 * Serviço de Integridade Criptográfica para Assinatura Digital
 *
 * Implementa cálculo de hashes SHA-256 para garantir integridade documental
 * conforme MP 2.200-2/2001 (Assinatura Eletrônica Avançada).
 *
 * CONFORMIDADE LEGAL - MP 2.200-2/2001
 *
 * Este serviço implementa requisitos de integridade para Assinatura Eletrônica Avançada:
 *
 * Art. 10, § 2º: "Considera-se assinatura eletrônica avançada aquela que utiliza
 * certificados não emitidos pela ICP-Brasil, desde que admitida pelas partes como
 * válida ou aceita pela pessoa a quem for oposta o documento, com as seguintes
 * características: [...] b) seja capaz de identificar seu signatário de forma
 * inequívoca; c) seja criada por meios que o signatário possa manter sob seu
 * controle exclusivo; d) esteja relacionada aos dados a ela associados de tal
 * modo que qualquer modificação posterior seja detectável."
 *
 * O hash SHA-256 garante a alínea (d): qualquer modificação no documento altera
 * o hash, tornando a adulteração detectável.
 *
 * Propósito Jurídico:
 * - Prova de integridade: Hash original comprova que o documento não foi alterado
 * - Cadeia de custódia: Hash final vincula manifesto de assinatura ao documento
 * - Auditoria forense: Permite verificação independente da integridade
 *
 * @module integrity.service
 */

import crypto from 'crypto';
import { logger, createTimer } from './logger';

/**
 * Algoritmo de hash utilizado (SHA-256)
 * SHA-256 é recomendado pelo NIST e amplamente aceito em contextos jurídicos
 */
export const HASH_ALGORITHM = 'sha256';

/**
 * Comprimento esperado do hash SHA-256 em formato hexadecimal
 * SHA-256 produz 256 bits = 32 bytes = 64 caracteres hexadecimais
 */
export const HASH_LENGTH = 64;

/**
 * Tamanho mínimo de buffer para logging de performance (1MB)
 * Buffers maiores que este valor terão métricas de tempo registradas
 */
const LARGE_BUFFER_THRESHOLD = 1024 * 1024;

/**
 * Serviço de integridade para logging estruturado
 */
const SERVICE = 'integrity';

/**
 * Resultado do cálculo de hash com metadados
 */
export interface HashResult {
  /** Hash calculado em formato hexadecimal (64 caracteres) */
  hash: string;
  /** Algoritmo utilizado (sempre 'sha256') */
  algorithm: string;
  /** Timestamp ISO 8601 do momento do cálculo */
  timestamp: string;
}

/**
 * Valida se o parâmetro é um Buffer válido
 *
 * @param buffer - Valor a ser validado
 * @throws {Error} Se o valor não for um Buffer válido
 */
function validateBuffer(buffer: unknown): asserts buffer is Buffer {
  if (buffer === null || buffer === undefined) {
    throw new Error('Buffer é obrigatório para cálculo de hash');
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      `Tipo inválido para cálculo de hash: esperado Buffer, recebido ${typeof buffer}`
    );
  }
}

/**
 * Calcula hash SHA-256 de um buffer para garantir integridade documental.
 *
 * Uso no fluxo de assinatura:
 * 1. Hash Original: Calculado do PDF preenchido ANTES da assinatura visual
 * 2. Hash Final: Calculado do PDF completo DEPOIS do manifesto e flatten
 *
 * Ambos os hashes são persistidos no banco (hash_original_sha256, hash_final_sha256)
 * e incluídos no manifesto de assinatura para auditoria futura.
 *
 * @param buffer - Buffer do arquivo PDF a ser hasheado
 * @returns Hash SHA-256 em formato hexadecimal (64 caracteres)
 * @throws {Error} Se buffer for inválido ou nulo
 *
 * @example
 * const pdfBuffer = await fs.readFile('documento.pdf');
 * const hash = calculateHash(pdfBuffer);
 * // hash: "a3c5f1e2b4d6..."
 *
 * @example
 * // Vetor de teste SHA-256 (RFC 4634)
 * const hash = calculateHash(Buffer.from('abc'));
 * // hash: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
 */
export function calculateHash(buffer: Buffer): string {
  // Validação de entrada
  validateBuffer(buffer);

  const context = {
    service: SERVICE,
    operation: 'hash',
    buffer_size: buffer.length,
  };

  // Para buffers grandes, medir performance
  const shouldLogPerformance = buffer.length >= LARGE_BUFFER_THRESHOLD;
  const timer = shouldLogPerformance ? createTimer() : null;

  logger.debug('Calculando hash SHA-256', context);

  // Cálculo do hash usando módulo crypto nativo do Node.js
  const hash = crypto.createHash(HASH_ALGORITHM).update(buffer).digest('hex');

  // Validação do resultado
  if (hash.length !== HASH_LENGTH) {
    logger.error(
      'Hash gerado com comprimento inválido',
      new Error(`Comprimento esperado: ${HASH_LENGTH}, obtido: ${hash.length}`),
      context
    );
    throw new Error('Falha na geração do hash: comprimento inválido');
  }

  // Log de performance para buffers grandes
  if (timer) {
    timer.log('Hash SHA-256 calculado', context, {
      hash_length: hash.length,
    });
  } else {
    logger.debug('Hash SHA-256 calculado com sucesso', {
      ...context,
      hash_length: hash.length,
    });
  }

  return hash;
}

/**
 * Calcula hash SHA-256 e retorna resultado completo com metadados.
 *
 * Útil para auditoria onde se precisa saber o momento exato do cálculo
 * e confirmar o algoritmo utilizado.
 *
 * @param buffer - Buffer do arquivo a ser hasheado
 * @returns Objeto HashResult com hash, algoritmo e timestamp
 * @throws {Error} Se buffer for inválido ou nulo
 *
 * @example
 * const result = calculateHashWithMetadata(pdfBuffer);
 * // result: {
 * //   hash: "ba7816bf...",
 * //   algorithm: "sha256",
 * //   timestamp: "2025-01-15T10:30:00.000Z"
 * // }
 */
export function calculateHashWithMetadata(buffer: Buffer): HashResult {
  const hash = calculateHash(buffer);

  return {
    hash,
    algorithm: HASH_ALGORITHM,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Verifica se um buffer corresponde a um hash esperado.
 *
 * Função auxiliar para auditoria e validação de integridade documental.
 * Permite verificar se um documento foi alterado comparando seu hash
 * atual com o hash armazenado no momento da assinatura.
 *
 * @param buffer - Buffer do arquivo a ser verificado
 * @param expectedHash - Hash SHA-256 esperado (64 caracteres hexadecimais)
 * @returns true se o hash calculado corresponde ao esperado, false caso contrário
 * @throws {Error} Se buffer for inválido ou nulo
 *
 * @example
 * // Verificar integridade de documento assinado
 * const hashOriginal = assinatura.hash_original_sha256;
 * const isIntact = verifyHash(pdfAtual, hashOriginal);
 * if (!isIntact) {
 *   throw new Error('Documento foi alterado após assinatura');
 * }
 */
export function verifyHash(buffer: Buffer, expectedHash: string): boolean {
  // Validação de entrada primeiro (antes de acessar buffer.length)
  validateBuffer(buffer);

  const context = {
    service: SERVICE,
    operation: 'verify',
    buffer_size: buffer.length,
    expected_hash_prefix: expectedHash?.slice(0, 8),
  };

  logger.debug('Verificando integridade via hash', context);

  // Validar formato do hash esperado
  if (!expectedHash || typeof expectedHash !== 'string') {
    logger.warn('Hash esperado inválido ou não fornecido', context);
    return false;
  }

  if (expectedHash.length !== HASH_LENGTH) {
    logger.warn('Hash esperado com comprimento inválido', {
      ...context,
      expected_length: HASH_LENGTH,
      actual_length: expectedHash.length,
    });
    return false;
  }

  // Validar formato hexadecimal
  if (!/^[a-f0-9]+$/i.test(expectedHash)) {
    logger.warn('Hash esperado com formato inválido (não-hexadecimal)', context);
    return false;
  }

  // Calcular hash atual e comparar usando comparação em tempo constante
  // para proteção contra timing attacks (side-channel attacks)
  const actualHash = calculateHash(buffer);
  const actualBuffer = Buffer.from(actualHash.toLowerCase(), 'hex');
  const expectedBuffer = Buffer.from(expectedHash.toLowerCase(), 'hex');
  const isValid = crypto.timingSafeEqual(actualBuffer, expectedBuffer);

  if (isValid) {
    logger.debug('Verificação de integridade: documento íntegro', context);
  } else {
    logger.warn('Verificação de integridade: documento alterado', {
      ...context,
      actual_hash_prefix: actualHash.slice(0, 8),
    });
  }

  return isValid;
}
