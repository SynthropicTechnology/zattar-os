/**
 * Testes Unitários do Serviço de Integridade Criptográfica
 *
 * Este arquivo testa as funções de cálculo de hash SHA-256 usadas para
 * garantir integridade documental conforme MP 2.200-2/2001.
 *
 * @module integrity.service.test
 */

import {
  calculateHash,
  calculateHashWithMetadata,
  verifyHash,
  HASH_ALGORITHM,
  HASH_LENGTH,
} from '../integrity.service';

describe('integrity.service', () => {
  // ============================================
  // Constantes e Vetores de Teste
  // ============================================

  /**
   * Vetor de teste SHA-256 conhecido (RFC 4634 / NIST)
   * Input: "abc"
   * Expected: ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad
   */
  const KNOWN_VECTOR_INPUT = 'abc';
  const KNOWN_VECTOR_HASH =
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

  /**
   * Segundo vetor de teste SHA-256 (NIST)
   * Input: "" (string vazia)
   * Expected: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
   */
  const EMPTY_STRING_HASH =
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  // ============================================
  // Testes de Constantes Exportadas
  // ============================================

  describe('constantes', () => {
    it('deve exportar HASH_ALGORITHM como sha256', () => {
      expect(HASH_ALGORITHM).toBe('sha256');
    });

    it('deve exportar HASH_LENGTH como 64', () => {
      expect(HASH_LENGTH).toBe(64);
    });
  });

  // ============================================
  // Testes da Função calculateHash
  // ============================================

  describe('calculateHash', () => {
    // ----------------------------------------
    // Funcionalidade Básica
    // ----------------------------------------

    describe('funcionalidade básica', () => {
      it('deve calcular hash de buffer vazio', () => {
        const buffer = Buffer.from('');
        const hash = calculateHash(buffer);

        expect(hash).toBe(EMPTY_STRING_HASH);
        expect(hash).toHaveLength(HASH_LENGTH);
      });

      it('deve calcular hash de buffer pequeno (10 bytes)', () => {
        const buffer = Buffer.from('0123456789');
        const hash = calculateHash(buffer);

        expect(hash).toHaveLength(HASH_LENGTH);
        expect(typeof hash).toBe('string');
      });

      it('deve calcular hash de buffer médio (1KB)', () => {
        const buffer = Buffer.alloc(1024, 'x');
        const hash = calculateHash(buffer);

        expect(hash).toHaveLength(HASH_LENGTH);
      });

      it('deve calcular hash de buffer grande (1MB)', () => {
        const buffer = Buffer.alloc(1024 * 1024, 'A');
        const hash = calculateHash(buffer);

        expect(hash).toHaveLength(HASH_LENGTH);
      });
    });

    // ----------------------------------------
    // Vetores de Teste Conhecidos
    // ----------------------------------------

    describe('vetores de teste conhecidos (NIST/RFC 4634)', () => {
      it('deve calcular hash correto para "abc"', () => {
        const buffer = Buffer.from(KNOWN_VECTOR_INPUT);
        const hash = calculateHash(buffer);

        expect(hash).toBe(KNOWN_VECTOR_HASH);
      });

      it('deve calcular hash correto para string vazia', () => {
        const buffer = Buffer.from('');
        const hash = calculateHash(buffer);

        expect(hash).toBe(EMPTY_STRING_HASH);
      });

      it('deve calcular hash correto para "The quick brown fox jumps over the lazy dog"', () => {
        const buffer = Buffer.from('The quick brown fox jumps over the lazy dog');
        const hash = calculateHash(buffer);
        // Hash conhecido para esta frase
        expect(hash).toBe(
          'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'
        );
      });
    });

    // ----------------------------------------
    // Determinismo
    // ----------------------------------------

    describe('determinismo', () => {
      it('deve gerar hash consistente para mesmo buffer (3 execuções)', () => {
        const buffer = Buffer.from('test data for determinism');
        const hash1 = calculateHash(buffer);
        const hash2 = calculateHash(buffer);
        const hash3 = calculateHash(buffer);

        expect(hash1).toBe(hash2);
        expect(hash2).toBe(hash3);
      });

      it('deve gerar hash idêntico para buffers com mesmo conteúdo', () => {
        const content = 'identical content';
        const buffer1 = Buffer.from(content);
        const buffer2 = Buffer.from(content);

        const hash1 = calculateHash(buffer1);
        const hash2 = calculateHash(buffer2);

        expect(hash1).toBe(hash2);
      });

      it('deve ser determinístico para buffers binários', () => {
        const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
        const buffer1 = Buffer.from(binaryData);
        const buffer2 = Buffer.from(binaryData);

        expect(calculateHash(buffer1)).toBe(calculateHash(buffer2));
      });
    });

    // ----------------------------------------
    // Unicidade (Collision Resistance)
    // ----------------------------------------

    describe('unicidade', () => {
      it('deve gerar hashes diferentes para buffers diferentes', () => {
        const buffer1 = Buffer.from('content A');
        const buffer2 = Buffer.from('content B');

        const hash1 = calculateHash(buffer1);
        const hash2 = calculateHash(buffer2);

        expect(hash1).not.toBe(hash2);
      });

      it('deve detectar alteração de um único byte', () => {
        const buffer1 = Buffer.from('original content');
        const buffer2 = Buffer.from('Original content'); // 'o' -> 'O'

        const hash1 = calculateHash(buffer1);
        const hash2 = calculateHash(buffer2);

        expect(hash1).not.toBe(hash2);
      });

      it('deve detectar alteração de um único bit', () => {
        const buffer1 = Buffer.from([0x00, 0x01, 0x02]);
        const buffer2 = Buffer.from([0x00, 0x01, 0x03]); // último byte: 0x02 -> 0x03

        expect(calculateHash(buffer1)).not.toBe(calculateHash(buffer2));
      });

      it('deve gerar hashes únicos para múltiplos buffers aleatórios', () => {
        const hashes = new Set<string>();
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
          const buffer = Buffer.from(`unique content ${i} ${Math.random()}`);
          hashes.add(calculateHash(buffer));
        }

        expect(hashes.size).toBe(iterations);
      });
    });

    // ----------------------------------------
    // Formato do Hash
    // ----------------------------------------

    describe('formato do hash', () => {
      it('deve retornar string com 64 caracteres', () => {
        const buffer = Buffer.from('test');
        const hash = calculateHash(buffer);

        expect(hash).toHaveLength(64);
      });

      it('deve retornar apenas caracteres hexadecimais minúsculos', () => {
        const buffer = Buffer.from('test hexadecimal format');
        const hash = calculateHash(buffer);

        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });

      it('deve retornar string (não Buffer)', () => {
        const buffer = Buffer.from('test');
        const hash = calculateHash(buffer);

        expect(typeof hash).toBe('string');
        expect(Buffer.isBuffer(hash)).toBe(false);
      });
    });

    // ----------------------------------------
    // Validação de Entrada
    // ----------------------------------------

    describe('validação de entrada', () => {
      it('deve lançar erro para buffer null', () => {
        expect(() => calculateHash(null as unknown as Buffer)).toThrow(
          'Buffer é obrigatório para cálculo de hash'
        );
      });

      it('deve lançar erro para buffer undefined', () => {
        expect(() => calculateHash(undefined as unknown as Buffer)).toThrow(
          'Buffer é obrigatório para cálculo de hash'
        );
      });

      it('deve lançar erro para string (não Buffer)', () => {
        expect(() => calculateHash('string' as unknown as Buffer)).toThrow(
          'Tipo inválido para cálculo de hash: esperado Buffer, recebido string'
        );
      });

      it('deve lançar erro para número', () => {
        expect(() => calculateHash(12345 as unknown as Buffer)).toThrow(
          'Tipo inválido para cálculo de hash: esperado Buffer, recebido number'
        );
      });

      it('deve lançar erro para objeto', () => {
        expect(() => calculateHash({ data: 'test' } as unknown as Buffer)).toThrow(
          'Tipo inválido para cálculo de hash: esperado Buffer, recebido object'
        );
      });

      it('deve lançar erro para array', () => {
        expect(() => calculateHash([1, 2, 3] as unknown as Buffer)).toThrow(
          'Tipo inválido para cálculo de hash: esperado Buffer, recebido object'
        );
      });
    });

    // ----------------------------------------
    // Casos de Uso Reais
    // ----------------------------------------

    describe('casos de uso reais', () => {
      it('deve calcular hash de PDF simulado (header PDF)', () => {
        // Simulação de início de arquivo PDF
        const pdfHeader = Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
        const hash = calculateHash(pdfHeader);

        expect(hash).toHaveLength(HASH_LENGTH);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });

      it('deve calcular hash de JSON stringificado', () => {
        const jsonData = JSON.stringify({
          cliente_id: 123,
          nome: 'João Silva',
          documento: '123.456.789-00',
          data_assinatura: '2025-01-15T10:30:00.000Z',
        });
        const buffer = Buffer.from(jsonData, 'utf-8');
        const hash = calculateHash(buffer);

        expect(hash).toHaveLength(HASH_LENGTH);
      });

      it('deve calcular hash de dados binários (imagem simulada)', () => {
        // Simulação de PNG header
        const pngHeader = Buffer.from([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ]);
        const hash = calculateHash(pngHeader);

        expect(hash).toHaveLength(HASH_LENGTH);
      });
    });

    // ----------------------------------------
    // Testes Parametrizados
    // ----------------------------------------

    describe('buffers de tamanhos variados', () => {
      const testCases = [
        { name: '0 bytes', size: 0 },
        { name: '1 byte', size: 1 },
        { name: '10 bytes', size: 10 },
        { name: '100 bytes', size: 100 },
        { name: '1KB', size: 1024 },
        { name: '10KB', size: 10 * 1024 },
        { name: '100KB', size: 100 * 1024 },
      ];

      test.each(testCases)('deve calcular hash para buffer de $name', ({ size }) => {
        const buffer = Buffer.alloc(size, 0x42);
        const hash = calculateHash(buffer);

        expect(hash).toHaveLength(HASH_LENGTH);
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
      });
    });
  });

  // ============================================
  // Testes da Função calculateHashWithMetadata
  // ============================================

  describe('calculateHashWithMetadata', () => {
    it('deve retornar objeto com hash, algorithm e timestamp', () => {
      const buffer = Buffer.from('test data');
      const result = calculateHashWithMetadata(buffer);

      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('algorithm');
      expect(result).toHaveProperty('timestamp');
    });

    it('deve retornar hash correto', () => {
      const buffer = Buffer.from(KNOWN_VECTOR_INPUT);
      const result = calculateHashWithMetadata(buffer);

      expect(result.hash).toBe(KNOWN_VECTOR_HASH);
    });

    it('deve retornar algorithm como sha256', () => {
      const buffer = Buffer.from('test');
      const result = calculateHashWithMetadata(buffer);

      expect(result.algorithm).toBe('sha256');
    });

    it('deve retornar timestamp em formato ISO 8601', () => {
      const buffer = Buffer.from('test');
      const result = calculateHashWithMetadata(buffer);

      // Validar formato ISO 8601
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
      );

      // Validar que é uma data válida
      const date = new Date(result.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
    });

    it('deve gerar timestamp próximo ao momento atual', () => {
      const before = new Date();
      const buffer = Buffer.from('test');
      const result = calculateHashWithMetadata(buffer);
      const after = new Date();

      const resultDate = new Date(result.timestamp);
      expect(resultDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(resultDate.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('deve lançar erro para buffer inválido', () => {
      expect(() =>
        calculateHashWithMetadata(null as unknown as Buffer)
      ).toThrow('Buffer é obrigatório para cálculo de hash');
    });
  });

  // ============================================
  // Testes da Função verifyHash
  // ============================================

  describe('verifyHash', () => {
    describe('verificação bem-sucedida', () => {
      it('deve retornar true para hash correto', () => {
        const buffer = Buffer.from(KNOWN_VECTOR_INPUT);
        const result = verifyHash(buffer, KNOWN_VECTOR_HASH);

        expect(result).toBe(true);
      });

      it('deve retornar true para hash em maiúsculas', () => {
        const buffer = Buffer.from(KNOWN_VECTOR_INPUT);
        const result = verifyHash(buffer, KNOWN_VECTOR_HASH.toUpperCase());

        expect(result).toBe(true);
      });

      it('deve retornar true para hash com case misto', () => {
        const buffer = Buffer.from(KNOWN_VECTOR_INPUT);
        // Alternar case: BA7816bf8F01cfea...
        const mixedCase = KNOWN_VECTOR_HASH
          .split('')
          .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
          .join('');

        const result = verifyHash(buffer, mixedCase);
        expect(result).toBe(true);
      });
    });

    describe('verificação falha', () => {
      it('deve retornar false para hash incorreto', () => {
        const buffer = Buffer.from(KNOWN_VECTOR_INPUT);
        const wrongHash =
          'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

        const result = verifyHash(buffer, wrongHash);
        expect(result).toBe(false);
      });

      it('deve retornar false quando documento foi alterado', () => {
        const originalBuffer = Buffer.from('documento original');
        const originalHash = calculateHash(originalBuffer);

        const alteredBuffer = Buffer.from('documento alterado');
        const result = verifyHash(alteredBuffer, originalHash);

        expect(result).toBe(false);
      });
    });

    describe('validação de hash esperado', () => {
      it('deve retornar false para hash null', () => {
        const buffer = Buffer.from('test');
        const result = verifyHash(buffer, null as unknown as string);

        expect(result).toBe(false);
      });

      it('deve retornar false para hash undefined', () => {
        const buffer = Buffer.from('test');
        const result = verifyHash(buffer, undefined as unknown as string);

        expect(result).toBe(false);
      });

      it('deve retornar false para hash com comprimento incorreto', () => {
        const buffer = Buffer.from('test');

        expect(verifyHash(buffer, 'abc123')).toBe(false);
        expect(verifyHash(buffer, '')).toBe(false);
        expect(verifyHash(buffer, 'a'.repeat(63))).toBe(false);
        expect(verifyHash(buffer, 'a'.repeat(65))).toBe(false);
      });

      it('deve retornar false para hash com caracteres não-hexadecimais', () => {
        const buffer = Buffer.from('test');
        // 'g' não é hexadecimal
        const invalidHash =
          'g' + 'a'.repeat(63);

        expect(verifyHash(buffer, invalidHash)).toBe(false);
      });

      it('deve retornar false para hash com espaços', () => {
        const buffer = Buffer.from('test');
        const hashWithSpaces = ' ' + 'a'.repeat(62) + ' ';

        expect(verifyHash(buffer, hashWithSpaces)).toBe(false);
      });
    });

    describe('validação de buffer', () => {
      it('deve lançar erro para buffer null', () => {
        expect(() =>
          verifyHash(null as unknown as Buffer, KNOWN_VECTOR_HASH)
        ).toThrow('Buffer é obrigatório para cálculo de hash');
      });

      it('deve lançar erro para buffer inválido', () => {
        expect(() =>
          verifyHash('string' as unknown as Buffer, KNOWN_VECTOR_HASH)
        ).toThrow('Tipo inválido para cálculo de hash');
      });
    });
  });

  // ============================================
  // Testes de Cenários de Integração
  // ============================================

  describe('cenários de integração', () => {
    it('deve validar fluxo completo: calcular -> armazenar -> verificar', () => {
      // Simular documento original
      const documentoOriginal = Buffer.from('Contrato de prestação de serviços...');

      // Calcular hash no momento da assinatura
      const hashArmazenado = calculateHash(documentoOriginal);

      // Simular recuperação do documento para auditoria
      const documentoRecuperado = Buffer.from('Contrato de prestação de serviços...');

      // Verificar integridade
      const integridadeOk = verifyHash(documentoRecuperado, hashArmazenado);

      expect(integridadeOk).toBe(true);
    });

    it('deve detectar adulteração em fluxo completo', () => {
      // Documento original assinado
      const documentoOriginal = Buffer.from('Valor: R$ 1.000,00');
      const hashOriginal = calculateHash(documentoOriginal);

      // Documento adulterado (valor alterado)
      const documentoAdulterado = Buffer.from('Valor: R$ 10.000,00');

      // Verificação deve falhar
      const integridadeOk = verifyHash(documentoAdulterado, hashOriginal);

      expect(integridadeOk).toBe(false);
    });

    it('deve funcionar com calculateHashWithMetadata para auditoria', () => {
      const documento = Buffer.from('Documento para auditoria');

      // Armazenar hash com metadados
      const resultado = calculateHashWithMetadata(documento);

      // Verificar posteriormente usando apenas o hash
      const integridadeOk = verifyHash(documento, resultado.hash);

      expect(integridadeOk).toBe(true);
      expect(resultado.algorithm).toBe(HASH_ALGORITHM);
    });
  });
});
