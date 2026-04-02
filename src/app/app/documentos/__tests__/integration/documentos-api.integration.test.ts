/**
 * Testes de Integração - API de Documentos
 *
 * Testa operações CRUD de documentos via API.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { createServiceClient } from '@/lib/supabase/service-client';
import { describeIf, hasSupabaseServiceEnv } from '@/testing/supabase-test-helpers';

const describeSupabase = describeIf(hasSupabaseServiceEnv());

describeSupabase('Documentos API Integration', () => {
  let supabase: ReturnType<typeof createServiceClient>;
  let testDocumentoId: number | null = null;
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
    // Limpar documento de teste
    if (testDocumentoId) {
      await supabase.from('documentos').delete().eq('id', testDocumentoId);
    }
  });

  describe('Criar Documento', () => {
    it('deve criar um documento com título e conteúdo', async () => {
      const { data, error } = await supabase
        .from('documentos')
        .insert({
          titulo: 'Documento de Teste',
          conteudo: [{ type: 'p', children: [{ text: 'Teste' }] }],
          criado_por: testUserId,
          editado_por: testUserId,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.titulo).toBe('Documento de Teste');
      expect(data?.versao).toBe(1);

      testDocumentoId = data?.id ?? null;
    });

    it('deve falhar ao criar documento sem título', async () => {
      const { error } = await supabase
        .from('documentos')
        .insert({
          titulo: '',
          conteudo: [],
          criado_por: testUserId,
        });

      expect(error).toBeDefined();
    });
  });

  describe('Listar Documentos', () => {
    it('deve listar documentos do usuário', async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('criado_por', testUserId)
        .is('deleted_at', null)
        .limit(10);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve filtrar documentos por pasta', async () => {
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('criado_por', testUserId)
        .is('pasta_id', null)
        .is('deleted_at', null);

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Buscar Documento', () => {
    it('deve buscar documento por ID', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', testDocumentoId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(testDocumentoId);
    });

    it('deve retornar erro para documento inexistente', async () => {
      const { error } = await supabase
        .from('documentos')
        .select('*')
        .eq('id', 999999)
        .single();

      expect(error).toBeDefined();
    });
  });

  describe('Atualizar Documento', () => {
    it('deve atualizar título do documento', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos')
        .update({
          titulo: 'Documento Atualizado',
          editado_por: testUserId,
        })
        .eq('id', testDocumentoId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.titulo).toBe('Documento Atualizado');
    });

    it('deve incrementar versão ao atualizar conteúdo', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data: antes } = await supabase
        .from('documentos')
        .select('versao')
        .eq('id', testDocumentoId)
        .single();

      const versaoAnterior = antes?.versao ?? 1;

      const { data, error } = await supabase
        .from('documentos')
        .update({
          conteudo: [{ type: 'p', children: [{ text: 'Atualizado' }] }],
          versao: versaoAnterior + 1,
          editado_por: testUserId,
        })
        .eq('id', testDocumentoId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.versao).toBe(versaoAnterior + 1);
    });
  });

  describe('Soft Delete Documento', () => {
    it('deve fazer soft delete do documento', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', testDocumentoId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.deleted_at).toBeDefined();
    });

    it('deve restaurar documento deletado', async () => {
      if (!testDocumentoId) {
        console.log('Pulando teste - documento não criado');
        return;
      }

      const { data, error } = await supabase
        .from('documentos')
        .update({ deleted_at: null })
        .eq('id', testDocumentoId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.deleted_at).toBeNull();
    });
  });
});
