import { describe, it, expect } from '@jest/globals';
import {
  assistenteSchema,
  criarAssistenteSchema,
  atualizarAssistenteSchema,
} from '../../domain';

describe('Assistentes Domain', () => {
  describe('assistenteSchema', () => {
    it('deve validar assistente completo válido', () => {
      // Arrange
      const assistente = {
        id: 1,
        nome: 'Assistente IA',
        descricao: 'Descrição do assistente',
        iframe_code: '<iframe src="https://example.com"></iframe>',
        ativo: true,
        criado_por: 1,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve validar nome obrigatório', () => {
      // Arrange
      const assistente = {
        descricao: 'Descrição',
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Nome é obrigatório');
      }
    });

    it('deve validar nome não vazio', () => {
      // Arrange
      const assistente = {
        nome: '',
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve validar tamanho máximo do nome (200 caracteres)', () => {
      // Arrange
      const assistente = {
        nome: 'A'.repeat(201),
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no máximo 200 caracteres');
      }
    });

    it('deve validar tamanho máximo da descrição (1000 caracteres)', () => {
      // Arrange
      const assistente = {
        nome: 'Teste',
        descricao: 'A'.repeat(1001),
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no máximo 1000 caracteres');
      }
    });

    it('deve permitir descrição null', () => {
      // Arrange
      const assistente = {
        nome: 'Teste',
        descricao: null,
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve permitir iframe_code opcional', () => {
      // Arrange — iframe_code is optional/nullable in the base schema
      const assistente = {
        nome: 'Teste',
        descricao: 'Descrição',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert — valid because iframe_code is optional in assistenteSchema
      expect(result.success).toBe(true);
    });

    it('deve validar ativo como booleano com padrão true', () => {
      // Arrange
      const assistente = {
        nome: 'Teste',
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = assistenteSchema.safeParse(assistente);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ativo).toBe(true);
      }
    });
  });

  describe('criarAssistenteSchema', () => {
    it('deve validar dados de criação válidos', () => {
      // Arrange
      const input = {
        nome: 'Novo Assistente',
        descricao: 'Descrição',
        iframe_code: '<iframe src="test"></iframe>',
      };

      // Act
      const result = criarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve rejeitar campos extras (apenas pick de campos permitidos)', () => {
      // Arrange
      const input = {
        nome: 'Teste',
        descricao: 'Descrição',
        iframe_code: '<iframe></iframe>',
        ativo: false, // Este campo não deveria ser aceito no criar
        id: 999, // Este campo não deveria ser aceito
      };

      // Act
      const result = criarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        // Zod pick não inclui ativo e id no schema de criar
        expect(result.data).not.toHaveProperty('ativo');
        expect(result.data).not.toHaveProperty('id');
      }
    });

    it('deve validar nome obrigatório na criação', () => {
      // Arrange
      const input = {
        descricao: 'Descrição',
        iframe_code: '<iframe></iframe>',
      };

      // Act
      const result = criarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve validar iframe_code obrigatório na criação', () => {
      // Arrange
      const input = {
        nome: 'Teste',
        descricao: 'Descrição',
      };

      // Act
      const result = criarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('atualizarAssistenteSchema', () => {
    it('deve validar dados de atualização válidos', () => {
      // Arrange
      const input = {
        nome: 'Nome Atualizado',
      };

      // Act
      const result = atualizarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve permitir atualização parcial (todos campos opcionais)', () => {
      // Arrange
      const input = {
        ativo: false,
      };

      // Act
      const result = atualizarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve permitir atualização vazia', () => {
      // Arrange
      const input = {};

      // Act
      const result = atualizarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it('deve validar tamanho do nome quando fornecido', () => {
      // Arrange
      const input = {
        nome: 'A'.repeat(201),
      };

      // Act
      const result = atualizarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve validar tamanho da descrição quando fornecida', () => {
      // Arrange
      const input = {
        descricao: 'A'.repeat(1001),
      };

      // Act
      const result = atualizarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it('deve permitir múltiplos campos de atualização', () => {
      // Arrange
      const input = {
        nome: 'Novo Nome',
        descricao: 'Nova Descrição',
        ativo: true,
      };

      // Act
      const result = atualizarAssistenteSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.nome).toBe('Novo Nome');
        expect(result.data.descricao).toBe('Nova Descrição');
        expect(result.data.ativo).toBe(true);
      }
    });
  });
});
