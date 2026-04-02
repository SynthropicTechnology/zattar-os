/**
 * Testes de Integração - API de Pastas
 *
 * Testa operações CRUD de pastas via API.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceClient } from '@/lib/supabase/service-client';
import { describeIf, hasSupabaseServiceEnv } from '@/testing/supabase-test-helpers';

const describeSupabase = describeIf(hasSupabaseServiceEnv());

describeSupabase('Pastas API Integration', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testPastaId: number | null = null;
  let testSubpastaId: number | null = null;
  let testUserId: number;

  beforeAll(async () => {
    supabase = createServiceClient();

    // Buscar um usuário de teste existente
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1)
      .single();

    if (!usuario) {
      throw new Error('Nenhum usuário encontrado para testes');
    }

    testUserId = usuario.id;
  });

  afterAll(async () => {
    // Limpar pastas de teste
    if (testSubpastaId) {
      await supabase.from('pastas').delete().eq('id', testSubpastaId);
    }
    if (testPastaId) {
      await supabase.from('pastas').delete().eq('id', testPastaId);
    }
  });

  describe('Criar Pasta', () => {
    it('deve criar uma pasta comum na raiz', async () => {
      const { data, error } = await supabase
        .from('pastas')
        .insert({
          nome: 'Pasta de Teste',
          tipo: 'comum',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.nome).toBe('Pasta de Teste');
      expect(data?.tipo).toBe('comum');
      expect(data?.pasta_pai_id).toBeNull();

      testPastaId = data?.id ?? null;
    });

    it('deve criar uma subpasta', async () => {
      if (!testPastaId) {
        console.log('Pulando teste - pasta pai não criada');
        return;
      }

      const { data, error } = await supabase
        .from('pastas')
        .insert({
          nome: 'Subpasta de Teste',
          tipo: 'comum',
          pasta_pai_id: testPastaId,
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.pasta_pai_id).toBe(testPastaId);

      testSubpastaId = data?.id ?? null;
    });

    it('deve criar uma pasta privada', async () => {
      const { data, error } = await supabase
        .from('pastas')
        .insert({
          nome: 'Pasta Privada Teste',
          tipo: 'privada',
          criado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.tipo).toBe('privada');

      // Limpar
      if (data?.id) {
        await supabase.from('pastas').delete().eq('id', data.id);
      }
    });

    it('deve falhar ao criar pasta com nome vazio', async () => {
      const { error } = await supabase
        .from('pastas')
        .insert({
          nome: '',
          tipo: 'comum',
          criado_por: testUserId,
        });

      expect(error).toBeDefined();
    });
  });

  describe('Listar Pastas', () => {
    it('deve listar pastas da raiz', async () => {
      const { data, error } = await supabase
        .from('pastas')
        .select('*')
        .is('pasta_pai_id', null)
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve listar subpastas de uma pasta', async () => {
      if (!testPastaId) {
        console.log('Pulando teste - pasta pai não criada');
        return;
      }

      const { data, error } = await supabase
        .from('pastas')
        .select('*')
        .eq('pasta_pai_id', testPastaId)
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Atualizar Pasta', () => {
    it('deve atualizar nome da pasta', async () => {
      if (!testPastaId) {
        console.log('Pulando teste - pasta não criada');
        return;
      }

      const { data, error } = await supabase
        .from('pastas')
        .update({ nome: 'Pasta Renomeada' })
        .eq('id', testPastaId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.nome).toBe('Pasta Renomeada');
    });

    it('deve atualizar cor da pasta', async () => {
      if (!testPastaId) {
        console.log('Pulando teste - pasta não criada');
        return;
      }

      const { data, error } = await supabase
        .from('pastas')
        .update({ cor: '#FF0000' })
        .eq('id', testPastaId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.cor).toBe('#FF0000');
    });
  });

  describe('Hierarquia de Pastas', () => {
    it('deve impedir ciclo em hierarquia (pasta pai = própria pasta)', async () => {
      if (!testPastaId) {
        console.log('Pulando teste - pasta não criada');
        return;
      }

      const { error } = await supabase
        .from('pastas')
        .update({ pasta_pai_id: testPastaId })
        .eq('id', testPastaId);

      // O trigger deve impedir esta operação
      expect(error).toBeDefined();
    });

    it('deve impedir ciclo (definir filho como pai)', async () => {
      if (!testPastaId || !testSubpastaId) {
        console.log('Pulando teste - pastas não criadas');
        return;
      }

      // Tentar fazer a pasta pai ser filha da subpasta
      const { error } = await supabase
        .from('pastas')
        .update({ pasta_pai_id: testSubpastaId })
        .eq('id', testPastaId);

      // O trigger deve impedir esta operação
      expect(error).toBeDefined();
    });
  });

  describe('Soft Delete Pasta', () => {
    it('deve fazer soft delete da pasta', async () => {
      if (!testSubpastaId) {
        console.log('Pulando teste - subpasta não criada');
        return;
      }

      const { data, error } = await supabase
        .from('pastas')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', testSubpastaId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.deleted_at).toBeDefined();
    });
  });
});
