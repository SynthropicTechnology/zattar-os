import { describe, it, expect } from '@jest/globals';
import { validarCpf } from '../../utils';

describe('Portal Cliente Utils', () => {
  describe('validarCpf', () => {
    it('deve validar CPF correto sem formatação', () => {
      // 529.982.247-25 is a valid CPF (check digits match)
      const result = validarCpf('52998224725');

      expect(result.valido).toBe(true);
      expect(result.cpfLimpo).toBe('52998224725');
      expect(result.erro).toBeUndefined();
    });

    it('deve validar CPF correto com formatação', () => {
      const result = validarCpf('529.982.247-25');

      expect(result.valido).toBe(true);
      expect(result.cpfLimpo).toBe('52998224725');
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      const result = validarCpf('123456789');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com mais de 11 dígitos', () => {
      const result = validarCpf('123456789000');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com todos os dígitos iguais', () => {
      const result1 = validarCpf('11111111111');
      const result2 = validarCpf('00000000000');
      const result3 = validarCpf('99999999999');

      expect(result1.valido).toBe(false);
      expect(result2.valido).toBe(false);
      expect(result3.valido).toBe(false);
    });

    it('deve limpar caracteres não numéricos', () => {
      const result = validarCpf('529.982.247-25');

      expect(result.cpfLimpo).toBe('52998224725');
    });

    it('deve limpar múltiplos tipos de caracteres', () => {
      const result = validarCpf('529-982.247/25');

      expect(result.cpfLimpo).toBe('52998224725');
    });

    it('deve rejeitar CPF vazio', () => {
      const result = validarCpf('');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF apenas com caracteres especiais', () => {
      const result = validarCpf('...-');

      expect(result.valido).toBe(false);
      expect(result.erro).toBe('CPF inválido');
    });

    it('deve rejeitar CPF com letras', () => {
      const result = validarCpf('123abc789de');

      expect(result.valido).toBe(false);
      expect(result.cpfLimpo).toBe('123789'); // Apenas números
      expect(result.erro).toBe('CPF inválido');
    });
  });

  // cpfSchema was removed from utils — validation is now handled by validarCpf directly
});
