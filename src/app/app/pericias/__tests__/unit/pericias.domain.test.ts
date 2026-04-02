import { describe, it, expect } from '@jest/globals';
import {
  SituacaoPericiaCodigo,
  SITUACAO_PERICIA_LABELS,
  atribuirResponsavelSchema,
  adicionarObservacaoSchema,
} from '../../domain';

describe('Perícias Domain', () => {
  describe('SituacaoPericiaCodigo Enum', () => {
    it('deve ter todos os códigos de situação definidos', () => {
      expect(SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS).toBe('S');
      expect(SituacaoPericiaCodigo.AGUARDANDO_LAUDO).toBe('L');
      expect(SituacaoPericiaCodigo.CANCELADA).toBe('C');
      expect(SituacaoPericiaCodigo.FINALIZADA).toBe('F');
      expect(SituacaoPericiaCodigo.LAUDO_JUNTADO).toBe('P');
      expect(SituacaoPericiaCodigo.REDESIGNADA).toBe('R');
    });
  });

  describe('SITUACAO_PERICIA_LABELS', () => {
    it('deve ter labels para todos os códigos de situação', () => {
      expect(SITUACAO_PERICIA_LABELS[SituacaoPericiaCodigo.AGUARDANDO_ESCLARECIMENTOS]).toBe(
        'Aguardando Esclarecimentos'
      );
      expect(SITUACAO_PERICIA_LABELS[SituacaoPericiaCodigo.AGUARDANDO_LAUDO]).toBe(
        'Aguardando Laudo'
      );
      expect(SITUACAO_PERICIA_LABELS[SituacaoPericiaCodigo.CANCELADA]).toBe('Cancelada');
      expect(SITUACAO_PERICIA_LABELS[SituacaoPericiaCodigo.FINALIZADA]).toBe('Finalizada');
      expect(SITUACAO_PERICIA_LABELS[SituacaoPericiaCodigo.LAUDO_JUNTADO]).toBe('Laudo Juntado');
      expect(SITUACAO_PERICIA_LABELS[SituacaoPericiaCodigo.REDESIGNADA]).toBe('Redesignada');
    });
  });

  describe('atribuirResponsavelSchema', () => {
    it('deve validar dados corretos', () => {
      const result = atribuirResponsavelSchema.safeParse({
        periciaId: 1,
        responsavelId: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.periciaId).toBe(1);
        expect(result.data.responsavelId).toBe(5);
      }
    });

    it('deve rejeitar periciaId menor que 1', () => {
      const result = atribuirResponsavelSchema.safeParse({
        periciaId: 0,
        responsavelId: 5,
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar periciaId negativo', () => {
      const result = atribuirResponsavelSchema.safeParse({
        periciaId: -1,
        responsavelId: 5,
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar responsavelId menor que 1', () => {
      const result = atribuirResponsavelSchema.safeParse({
        periciaId: 1,
        responsavelId: 0,
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar quando periciaId está faltando', () => {
      const result = atribuirResponsavelSchema.safeParse({
        responsavelId: 5,
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar quando responsavelId está faltando', () => {
      const result = atribuirResponsavelSchema.safeParse({
        periciaId: 1,
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar quando tipos estão incorretos', () => {
      const result = atribuirResponsavelSchema.safeParse({
        periciaId: '1',
        responsavelId: '5',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('adicionarObservacaoSchema', () => {
    it('deve validar dados corretos', () => {
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 1,
        observacoes: 'Observação importante sobre a perícia',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.periciaId).toBe(1);
        expect(result.data.observacoes).toBe('Observação importante sobre a perícia');
      }
    });

    it('deve rejeitar periciaId menor que 1', () => {
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 0,
        observacoes: 'Observação',
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar observacoes vazia', () => {
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 1,
        observacoes: '',
      });

      expect(result.success).toBe(false);
    });

    it('deve aceitar observações longas', () => {
      const observacaoLonga = 'A'.repeat(1000);
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 1,
        observacoes: observacaoLonga,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.observacoes).toHaveLength(1000);
      }
    });

    it('deve rejeitar quando periciaId está faltando', () => {
      const result = adicionarObservacaoSchema.safeParse({
        observacoes: 'Observação',
      });

      expect(result.success).toBe(false);
    });

    it('deve rejeitar quando observacoes está faltando', () => {
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 1,
      });

      expect(result.success).toBe(false);
    });

    it('deve aceitar observações com caracteres especiais', () => {
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 1,
        observacoes: 'Observação com caracteres: @#$%^&*()_+{}[]|\\:";\'<>?,./~`',
      });

      expect(result.success).toBe(true);
    });

    it('deve aceitar observações com quebras de linha', () => {
      const result = adicionarObservacaoSchema.safeParse({
        periciaId: 1,
        observacoes: 'Primeira linha\nSegunda linha\nTerceira linha',
      });

      expect(result.success).toBe(true);
    });
  });
});
